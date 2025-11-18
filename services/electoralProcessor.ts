import { RawElectionData, ProcessedElectionData, CandidateRanking, ProbabilityResult, ProcessedDataPayload, InvalidVoteCounts, AnalysisType, PartyData, ElectoralDataset, HistoricalDataset, LocalSupportConfig, CampaignStrengthConfig, CoattailEffectConfig } from '../types';
import Papa from 'papaparse';

const PARTY_COLORS = [
    '#3b82f6', '#10b981', '#ef4444', '#f97316', '#8b5cf6', '#ec4899',
    '#6366f1', '#14b8a6', '#f59e0b', '#d946ef', '#0ea5e9', '#84cc16'
];

const getColorForParty = (partyName: string): string => {
    let hash = 0;
    if (partyName.length === 0) return PARTY_COLORS[0];
    for (let i = 0; i < partyName.length; i++) {
        const char = partyName.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash % PARTY_COLORS.length);
    return PARTY_COLORS[index];
};

const normalizePartyName = (name: string): string => {
    if (!name) return '';
    return name
        .normalize('NFD') // Decompose combined characters (e.g., 'á' -> 'a' + '´')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .toUpperCase()
        .trim()
        .replace(/['"“”]/g, '');
};


export const aggregateVotesByParty = (data: ProcessedElectionData[]): PartyData[] => {
    const partyVotes = new Map<string, number>();
    data.forEach(row => {
        // Normalization is assumed to have happened in processData
        const partyName = row.UnidadPolitica;
        partyVotes.set(partyName, (partyVotes.get(partyName) || 0) + row.Votos);
    });
    return Array.from(partyVotes.entries()).map(([name, votes], index) => ({
        id: index + 1,
        name,
        votes,
        color: getColorForParty(name),
    })).sort((a,b) => b.votes - a.votes);
};


// Módulo 1: DataHandler
export const processData = (csvText: string): Promise<ProcessedDataPayload> => {
  return new Promise((resolve, reject) => {
    Papa.parse<RawElectionData>(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          // Ignore non-critical parsing errors like too few or too many fields,
          // as subsequent logic (e.g., isNaN checks) can often handle these malformed rows gracefully.
          const criticalErrors = results.errors.filter(
            e => e.code !== 'TooFewFields' && e.code !== 'TooManyFields'
          );

          if (criticalErrors.length > 0) {
            console.error("Critical CSV Parsing Errors:", criticalErrors);
            const firstError = criticalErrors[0];
            // row is 0-indexed, and we have a header, so add 2 for a 1-indexed line number.
            return reject(new Error(`Error de formato CSV: ${firstError.message} en la línea ${firstError.row + 2}.`));
          }
        }
        
        const invalidVoteCounts: InvalidVoteCounts = { blankVotes: 0, nullVotes: 0 };
        const validRows: RawElectionData[] = [];
        
        results.data.forEach(row => {
          if (!row.Candidato || !row.Votos) return;
          const candidateUpper = row.Candidato.toUpperCase().trim();
          const votes = parseInt(row.Votos, 10);
          if (isNaN(votes)) return;

          if (candidateUpper.includes('NULOS')) {
            invalidVoteCounts.nullVotes += votes;
          } else if (candidateUpper.includes('EN BLANCO')) {
            invalidVoteCounts.blankVotes += votes;
          } else if (row.UnidadPolitica) { // Ensure there's a political unit
            validRows.push(row);
          }
        });
        
        const hasIndividualCandidates = validRows.some(
            row => normalizePartyName(row.Candidato) !== 'SOLO POR LA LISTA'
        );
        const analysisType: AnalysisType = hasIndividualCandidates ? 'candidate' : 'party';
        
        const allianceSizes = new Map<string, number>();
        const allianceMembers = new Map<string, Set<string>>();

        validRows.forEach(row => {
          if (row.AlianzaHistoricaID && row.AlianzaHistoricaID.trim() !== "") {
            const key = `${row.Eleccion}|${row.Año}|${row.AlianzaHistoricaID}`;
            if (!allianceMembers.has(key)) {
              allianceMembers.set(key, new Set());
            }
            allianceMembers.get(key)!.add(normalizePartyName(row.UnidadPolitica));
          }
        });

        allianceMembers.forEach((units, key) => {
            allianceSizes.set(key, units.size);
        });
        
        const processedData = validRows.map(row => {
            if (!row.Candidato || !row.Votos || !row.UnidadPolitica) return null;
            const votos = parseInt(row.Votos, 10);
            if (isNaN(votos)) return null;

            const esCabezaDeLista = row.EsCabezaDeLista?.toLowerCase() === 'true';
            let votos_calculados = votos;

            if (esCabezaDeLista && row.Eleccion === 'Cámara') {
                votos_calculados /= 2;
            }
            
            if (row.AlianzaHistoricaID && row.AlianzaHistoricaID.trim() !== "") {
                const key = `${row.Eleccion}|${row.Año}|${row.AlianzaHistoricaID}`;
                const n = allianceSizes.get(key) || 1;
                if (n > 1) {
                    votos_calculados /= n;
                }
            }
            
            // CRITICAL: Normalize political unit name here
            const normalizedUnidadPolitica = normalizePartyName(row.UnidadPolitica);
            if (!normalizedUnidadPolitica) return null; // Skip rows without a valid party name


            return {
                ...row,
                UnidadPolitica: normalizedUnidadPolitica, 
                Votos: votos,
                EsCabezaDeLista: esCabezaDeLista,
                votos_calculados: Math.round(votos_calculados)
            };
        }).filter((d): d is ProcessedElectionData => d !== null);

        resolve({ processedData, invalidVoteCounts, analysisType });
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

// Módulo 2: AnalysisEngine
export const calculateBaseRanking = (processedData: ProcessedElectionData[]): CandidateRanking[] => {
    if (!processedData || processedData.length === 0) {
        return [];
    }

    const isPartyLevelOnly = processedData.every(
        row => normalizePartyName(row.Candidato) === 'SOLO POR LA LISTA'
    );

    if (isPartyLevelOnly) {
        // Party-level analysis: aggregate by UnidadPolitica
        const partyVotes = new Map<string, { totalVotes: number; count: number }>();
        processedData.forEach(row => {
            if (!partyVotes.has(row.UnidadPolitica)) {
                partyVotes.set(row.UnidadPolitica, { totalVotes: 0, count: 0 });
            }
            const current = partyVotes.get(row.UnidadPolitica)!;
            current.totalVotes += row.votos_calculados;
            current.count += 1;
        });
        const ranking = Array.from(partyVotes.entries()).map(([unidadPolitica, data]) => ({
            candidato: unidadPolitica, 
            unidadPolitica: unidadPolitica,
            poderElectoralBase: Math.round(data.totalVotes / data.count),
        }));
        return ranking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);

    } else {
        // Candidate-level analysis
        const candidateVotes = new Map<string, { totalVotes: number; count: number; unidadPolitica: string }>();
        processedData.forEach(row => {
            if (normalizePartyName(row.Candidato) === 'SOLO POR LA LISTA') return;
            if (!candidateVotes.has(row.Candidato)) {
                candidateVotes.set(row.Candidato, { totalVotes: 0, count: 0, unidadPolitica: row.UnidadPolitica });
            }
            const current = candidateVotes.get(row.Candidato)!;
            current.totalVotes += row.votos_calculados;
            current.count += 1;
        });
        const ranking = Array.from(candidateVotes.entries()).map(([candidato, data]) => ({
            candidato,
            unidadPolitica: data.unidadPolitica,
            poderElectoralBase: Math.round(data.totalVotes / data.count),
        }));
        return ranking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
    }
};

// Módulo 3: ScenarioSimulator
export const simulateVoteFragmentation = (
    baseRanking: CandidateRanking[],
    unidadPolitica: string,
    numCandidatos: number
): CandidateRanking[] => {
    if (numCandidatos <= 1 || !unidadPolitica) {
        return [...baseRanking];
    }
    
    const totalPowerOfUnit = baseRanking
        .filter(c => c.unidadPolitica === unidadPolitica)
        .reduce((sum, c) => sum + c.poderElectoralBase, 0);

    const fragmentedPower = Math.round(totalPowerOfUnit / numCandidatos);
    
    const newRanking = baseRanking.map(c => {
        if (c.unidadPolitica === unidadPolitica) {
            return { ...c, poderElectoralBase: fragmentedPower };
        }
        return { ...c };
    });

    return newRanking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
};

export const applyGovernmentOppositionFactor = (
    baseRanking: CandidateRanking[],
    governmentParties: string[]
): CandidateRanking[] => {
    if (governmentParties.length === 0) {
        return [...baseRanking];
    }

    const newRanking = baseRanking.map(c => {
        if (governmentParties.includes(c.unidadPolitica)) {
            // Apply a random negative variation between 15% and 20%
            const penalty = 0.15 + Math.random() * 0.05; // Random value between 0.15 and 0.20
            const newPower = Math.round(c.poderElectoralBase * (1 - penalty));
            return { ...c, poderElectoralBase: newPower };
        }
        return { ...c };
    });
    
    return newRanking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
};

const LOCAL_SUPPORT_FACTORS = { 'Nulo': 1.0, 'Bajo': 1.05, 'Medio': 1.12, 'Alto': 1.20 };
export const applyLocalSupportFactor = (
    baseRanking: CandidateRanking[],
    localSupport: LocalSupportConfig[]
): CandidateRanking[] => {
    if (localSupport.length === 0) return [...baseRanking];

    const supportMap = new Map(localSupport.map(s => [s.unit, LOCAL_SUPPORT_FACTORS[s.level]]));
    
    const newRanking = baseRanking.map(c => {
        const factor = supportMap.get(c.unidadPolitica);
        if (factor && factor > 1.0) {
            const newPower = Math.round(c.poderElectoralBase * factor);
            return { ...c, poderElectoralBase: newPower };
        }
        return { ...c };
    });

    return newRanking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
};

const CAMPAIGN_STRENGTH_FACTORS = { 'Baja': 0.90, 'Media': 1.0, 'Alta': 1.15 };
export const applyCampaignStrengthFactor = (
    baseRanking: CandidateRanking[],
    campaignStrength: CampaignStrengthConfig[]
): CandidateRanking[] => {
    if (campaignStrength.length === 0) return [...baseRanking];

    const strengthMap = new Map(campaignStrength.map(s => [s.unit, CAMPAIGN_STRENGTH_FACTORS[s.level]]));

    const newRanking = baseRanking.map(c => {
        const factor = strengthMap.get(c.unidadPolitica);
        if (factor) {
            const newPower = Math.round(c.poderElectoralBase * factor);
            return { ...c, poderElectoralBase: newPower };
        }
        return { ...c };
    });

    return newRanking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
};

const COATTAIL_FACTORS = { 'Nulo': 1.0, 'Moderado': 1.15, 'Fuerte': 1.25 };
export const applyCoattailEffect = (
    baseRanking: CandidateRanking[],
    coattailEffect: CoattailEffectConfig
): CandidateRanking[] => {
    if (!coattailEffect.unit || coattailEffect.strength === 'Nulo') {
        return [...baseRanking];
    }
    
    const factor = COATTAIL_FACTORS[coattailEffect.strength];
    
    const newRanking = baseRanking.map(c => {
        if (c.unidadPolitica === coattailEffect.unit) {
            const newPower = Math.round(c.poderElectoralBase * factor);
            return { ...c, poderElectoralBase: newPower };
        }
        return { ...c };
    });
    
    return newRanking.sort((a, b) => b.poderElectoralBase - a.poderElectoralBase);
};


// Módulo 5: ProbabilityEngine
export const runMonteCarloSimulation = (
    ranking: CandidateRanking[],
    threshold: number,
    iterations: number,
    deviation: number = 0.10 // 10% standard deviation
): ProbabilityResult[] => {
    if (threshold <= 0 || iterations <= 0) return [];

    const results: ProbabilityResult[] = ranking.map(candidate => {
        let wins = 0;
        let totalProjectedVotes = 0;
        
        for (let i = 0; i < iterations; i++) {
            // Using a simple uniform distribution for this example. A normal distribution would be better.
            const randomFactor = 1 + (Math.random() - 0.5) * 2 * deviation;
            const simulatedVotes = candidate.poderElectoralBase * randomFactor;
            totalProjectedVotes += simulatedVotes;
            
            if (simulatedVotes >= threshold) {
                wins++;
            }
        }
        
        return {
            candidato: candidate.candidato,
            probabilidad_curul: (wins / iterations) * 100,
            votos_proyectados: Math.round(totalProjectedVotes / iterations)
        };
    });

    return results.sort((a, b) => b.probabilidad_curul - a.probabilidad_curul);
};

export const buildHistoricalDataset = (electoralDataset: ElectoralDataset): HistoricalDataset => {
    const processedData = electoralDataset.processedData;
    return {
      id: electoralDataset.id,
      name: electoralDataset.name,
      analysisType: electoralDataset.analysisType,
      invalidVoteCounts: electoralDataset.invalidVoteCounts,
      processedData,
      partyData: aggregateVotesByParty(processedData),
      baseRanking: calculateBaseRanking(processedData),
    };
};