import { PartyData, ProcessedElectionData, VoteTransferModel, VoteTransferModelResult } from '../types';
import { aggregateVotesByParty } from './electoralProcessor';

const aggregatePartyVotes = (data: ProcessedElectionData[]): Map<string, number> => {
    const partyVotes = new Map<string, number>();
    data.forEach(row => {
        const currentVotes = partyVotes.get(row.UnidadPolitica) || 0;
        partyVotes.set(row.UnidadPolitica, currentVotes + row.Votos);
    });
    return partyVotes;
};

const IDEOLOGY_SPECTRUM = ['IZQUIERDA', 'CENTRO-IZQUIERDA', 'CENTRO', 'REGIONALISTA', 'ATRAPA-TODO', 'OTRO', 'RELIGIOSO', 'CENTRO-DERECHA', 'DERECHA'];

const getIdeologicalDistance = (ideologyA: string, ideologyB: string): number => {
    const indexA = IDEOLOGY_SPECTRUM.indexOf(ideologyA?.toUpperCase());
    const indexB = IDEOLOGY_SPECTRUM.indexOf(ideologyB?.toUpperCase());

    if (indexA === -1 || indexB === -1) {
        return 5; // High distance for unknown/other ideologies to reduce affinity
    }
    return Math.abs(indexA - indexB);
};

// Helper to normalize names, avoiding circular deps
const normalizePartyName = (name: string): string => {
    if (!name) return '';
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
        .trim()
        .replace(/['"“”]/g, '');
};


export const calculateTransferModel = (
    preData: ProcessedElectionData[], 
    postData: ProcessedElectionData[],
    newPartyName: string,
    ideologies: Record<string, string>
): VoteTransferModelResult => {
    const preVotes = aggregatePartyVotes(preData);
    const postVotes = aggregatePartyVotes(postData);

    const newPartyTotalVotes = postVotes.get(newPartyName);
    if (!newPartyTotalVotes || newPartyTotalVotes === 0) {
        throw new Error(`El partido "${newPartyName}" no fue encontrado o no tiene votos en la elección de referencia posterior.`);
    }
    
    const normalizedNewPartyName = normalizePartyName(newPartyName);
    
    const potentialDonors = new Map<string, number>(); // Map<partyName, weight>
    let totalWeight = 0;
    
    // Special logic for "CREEMOS" party: transfer is proportional to donor votes
    if (normalizedNewPartyName === 'PARTIDO POLITICO CREEMOS') {
        const donorPartyKeywords = [
            'PARTIDO CENTRO DEMOCRATICO',
            'PARTIDO LIBERAL COLOMBIANO',
            'PARTIDO CONSERVADOR COLOMBIANO',
            'PARTIDO CAMBIO RADICAL',
            'MIRA', // Will match coalitions including MIRA
            'MOVIMIENTO DE SALVACION NACIONAL'
        ];

        preVotes.forEach((votes, party) => {
            if (donorPartyKeywords.some(keyword => party.includes(keyword))) {
                potentialDonors.set(party, votes);
                totalWeight += votes;
            }
        });
        
        if (totalWeight === 0) {
            throw new Error("No se encontraron los partidos donantes especificados para 'CREEMOS' en la elección de referencia 'antes'.");
        }
    } else {
        // Original ideology-based logic for all other parties
        const newPartyIdeology = ideologies[newPartyName] || 'Otro';
        if (!newPartyIdeology) {
             throw new Error(`La ideología para el nuevo partido "${newPartyName}" no pudo ser determinada. Asegúrate de que los partidos estén clasificados.`);
        }
        
        preVotes.forEach((votes, donorParty) => {
            if (votes > 0) {
                const donorIdeology = ideologies[donorParty] || 'Otro';
                const distance = getIdeologicalDistance(donorIdeology, newPartyIdeology);
                const attraction = 1 / (1 + Math.pow(distance, 2)); 
                const weightedPotential = votes * attraction;
                potentialDonors.set(donorParty, weightedPotential);
                totalWeight += weightedPotential;
            }
        });
        
        if (totalWeight === 0) {
            throw new Error("No se pudo calcular un modelo de transferencia. No hay afinidad ideológica entre el nuevo partido y los partidos existentes.");
        }
    }

    const transferModel: VoteTransferModel = {};
    
    potentialDonors.forEach((weight, donorParty) => {
        const proportion = weight / totalWeight;
        const votesTransferred = Math.round(proportion * newPartyTotalVotes);

        if (votesTransferred > 0) {
            transferModel[donorParty] = proportion;
        }
    });
    
    // Normalize the model so that the percentages of the included parties sum to 1
    const totalPercentageInModel = Object.values(transferModel).reduce((sum, p) => sum + p, 0);
    if (totalPercentageInModel > 0) {
      for (const party in transferModel) {
        transferModel[party] /= totalPercentageInModel;
      }
    }

    return {
        model: transferModel
    };
};

export const applyTransferModel = (
    historicalData: ProcessedElectionData[],
    transferModel: VoteTransferModel,
    newPartyName: string
): PartyData[] => {
    const historicalPartyVotes = aggregatePartyVotes(historicalData);
    const simulatedPartyVotes = new Map(historicalPartyVotes);

    let newPartyVotes = 0;

    Object.entries(transferModel).forEach(([donorParty, percentage]) => {
        const donorVotes = historicalPartyVotes.get(donorParty);
        if (donorVotes) {
            const vulnerabilityFactor = 0.65; 
            const votesToTransfer = Math.round(donorVotes * vulnerabilityFactor * percentage);
            
            simulatedPartyVotes.set(donorParty, Math.max(0, donorVotes - votesToTransfer));
            newPartyVotes += votesToTransfer;
        }
    });

    simulatedPartyVotes.set(newPartyName, (simulatedPartyVotes.get(newPartyName) || 0) + newPartyVotes);

    const originalPartyData = aggregateVotesByParty(historicalData);
    
    const simulatedPartyData = Array.from(simulatedPartyVotes.entries()).map(([name, votes]) => {
        const originalParty = originalPartyData.find(p => p.name === name);
        return {
            id: originalParty?.id || Math.random(),
            name,
            votes,
            color: originalParty?.color || '#cccccc'
        }
    }).sort((a, b) => b.votes - a.votes);

    return simulatedPartyData;
};