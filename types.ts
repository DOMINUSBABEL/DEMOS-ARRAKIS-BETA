
export interface RawElectionData {
  Eleccion: string;
  Año: string;
  UnidadPolitica: string;
  Candidato: string;
  Votos: string;
  EsCabezaDeLista: string;
  AlianzaHistoricaID: string;

  // New optional fields for detailed classification
  Departamento?: string;
  CodigoDepartamento?: string;
  Municipio?: string;
  CodigoMunicipio?: string;
  Comuna?: string;
  Zona?: string;
  Puesto?: string;
  Circunscripcion?: string;
  CodigoCandidato?: string;
}

// Fix: Omit properties from RawElectionData with incompatible types ('Votos', 'EsCabezaDeLista') and redeclare them.
export interface ProcessedElectionData extends Omit<RawElectionData, 'Votos' | 'EsCabezaDeLista'> {
  Votos: number;
  EsCabezaDeLista: boolean;
  votos_calculados: number;
}

export interface CandidateRanking {
  candidato: string;
  unidadPolitica: string;
  poderElectoralBase: number;
}

export interface LocalSupportConfig {
  unit: string;
  level: 'Nulo' | 'Bajo' | 'Medio' | 'Alto';
}

export interface CampaignStrengthConfig {
  unit: string;
  level: 'Baja' | 'Media' | 'Alta';
}

export interface CoattailEffectConfig {
  unit: string;
  strength: 'Nulo' | 'Moderado' | 'Fuerte';
}

export interface SimulationParams {
  fragmentationUnit: string;
  numCandidates: number;
  governmentParties: string[];
  threshold: number;
  monteCarloIterations: number;
  localSupport: LocalSupportConfig[];
  campaignStrength: CampaignStrengthConfig[];
  coattailEffect: CoattailEffectConfig;
}

export interface ProbabilityResult {
  candidato: string;
  probabilidad_curul: number;
  votos_proyectados: number;
}

export interface SimulationResults {
  fragmentedRanking: CandidateRanking[];
  factoredRanking: CandidateRanking[];
  probabilities: ProbabilityResult[];
}

// --- NEW TYPES ---
export interface InvalidVoteCounts {
  blankVotes: number;
  nullVotes: number;
}

// Updated to include 'executive' for Mayor/Governor/President
export type AnalysisType = 'candidate' | 'party' | 'executive';

export interface ProcessedDataPayload {
  processedData: ProcessedElectionData[];
  invalidVoteCounts: InvalidVoteCounts;
  analysisType: AnalysisType;
}


// --- D'Hondt Simulator Types ---

export interface PartyData {
  id: number;
  name: string;
  votes: number;
  color: string;
}

export interface SeatAllocation {
  party: string;
  seats: number;
}

export interface DHondtStep {
  seatNumber: number;
  party: string;
  quotient: number;
  partyVotes: number;
  seatsWon: number;
}

export interface DHondtAnalysis {
  seats: SeatAllocation[];
  steps: DHondtStep[];
  totalVotes: number;
  votesPerSeat: { party: string; votes: number }[];
  lastSeatWinner: DHondtStep | null;
  runnerUp: DHondtStep | null;
  totalSeats: number; // Added for context
}

// --- Historical Simulation Types ---
// REFACTORED: ToonDataset is now ElectoralDataset and stores data as objects.
export interface ElectoralDataset {
    id: string;
    name: string;
    processedData: ProcessedElectionData[];
    invalidVoteCounts: InvalidVoteCounts;
    analysisType: AnalysisType;
}

// HistoricalDataset represents the fully parsed, in-memory version for analysis.
export interface HistoricalDataset {
    id: string;
    name: string;
    processedData: ProcessedElectionData[];
    partyData: PartyData[];
    baseRanking: CandidateRanking[];
    invalidVoteCounts: InvalidVoteCounts;
    analysisType: AnalysisType;
}

export type VoteTransferModel = Record<string, number>;

export interface VoteTransferModelResult {
    model: VoteTransferModel; // The percentage model
}

// --- Centralized Party Analysis Types ---
export interface PartyHistoryPoint {
  datasetId: string;
  datasetName: string;
  votes: number;
}

export interface PartyAnalysisData {
  name: string; // The original, non-normalized name for display
  history: PartyHistoryPoint[];
  color: string;
  ideology?: string; // e.g., 'Izquierda', 'Derecha', 'Centro'
}

// --- NEW TYPES FOR ADVANCED ANALYSIS ---
export interface CoalitionBreakdown {
    party: string;
    estimatedVotes: number;
    contributionPercentage: number;
    color: string;
}

export interface VoteElasticityResult {
    inelasticVote: number; // The floor
    elasticVote: number; // The range (ceiling - floor)
    ceiling: number;
}

export interface ListAnalysisAIResponse {
  projections: {
    openList: {
      baseline: number | null;
      lowerBound: number | null;
      upperBound: number | null;
    } | null;
    closedList: {
      baseline: number | null;
      lowerBound: number | null;
      upperBound: number | null;
    } | null;
  };
  strategicRecommendation: 'Abierta' | 'Cerrada' | 'Depende del Contexto';
  analysis: {
    voteProfile: 'Elástico' | 'Inelástico' | 'Mixto';
    prosOpen: string;
    consOpen: string;
    prosClosed: string;
    consClosed: string;
    finalVerdict: string;
  };
}

export interface MarketingStrategyResult {
    candidateProfile: string;
    elasticVoterPersona: {
        demographics: string;
        interests: string[];
        painPoints: string[];
        mediaHabits: string[];
    };
    campaignPillars: {
        rational: string[];
        emotional: string[];
        slogans: string[];
    };
    tactics: {
        digital: string[];
        territory: string[];
    };
    kpis: {
        metric: string;
        target: string;
    }[];
}

export interface CandidateProfileResult {
    overview: string;
    opinionAnalysis: string;
    managementAnalysis: string;
    simulationParameters: {
        suggestedVoteBase: number;
        suggestedVoteFloor: number;
        suggestedVoteCeiling: number;
        volatility: 'Baja' | 'Media' | 'Alta';
        growthTrend: 'Positiva' | 'Estable' | 'Negativa';
    };
    sources: any[];
}

export interface ComparisonScenario {
    name: string; 
    description: string;
    voteProjections: { candidateName: string; votes: number }[]; 
    swingVotes: number; 
    winner: string; 
}

export interface ScoringBreakdown {
    trajectoryScore: number; // 0-100 (Trayectoria)
    structureScore: number; // 0-100 (Estructura)
    territoryScore: number; // 0-100 (Territorio)
    managementScore: number; // 0-100 (Gestión)
    internalDynamicsScore: number; // 0-100 (Dinámica Interna)
    scandalPenalty: number; // 0-100 (Penalización por Ruido)
}

export interface VoterAvatar {
    archetype: string; // e.g. "El Joven Indignado"
    demographics: string; // e.g. "Universitario, 22 años, Medellín"
    motivation: string; // Why they vote for this candidate
    painPoint: string; // What worries them
}

export interface CandidateAnalysis {
    name: string;
    probabilityScore: number; // 0-100 (Chance of Seat/Win) - Calculated Weighted Score
    
    // Deep Dive Fields
    trajectory: string; // Resumen técnico de carrera política
    scandals: string; // Análisis de riesgo reputacional
    image: string; // Percepción pública
    structure: string; // Capacidad de endoso y maquinaria
    management: string; // Evaluación de resultados (KPIs cualitativos)
    territory: string; // Capilaridad geográfica
    alliances: string; // Alineación con factores de poder
    
    // For Radar Chart and Weighting
    scoring: ScoringBreakdown;
    
    // New: Voter Personas
    avatars: VoterAvatar[];
}

export interface PartyMetrics {
    totalListVotes: number;
    candidateVotesSubtotal: number;
    logoVotes: number;
    logoPercentage: number;
}

export interface CandidateComparisonResult {
    listVerdict: string; // Análisis global de la lista (quiénes entran, quiénes salen)
    partyMetrics: PartyMetrics; // NEW: Breakdown of Logo vs Candidate votes
    candidates: CandidateAnalysis[]; 
    scenarios: ComparisonScenario[];
}
