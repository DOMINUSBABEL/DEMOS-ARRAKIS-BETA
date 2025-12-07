
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
    name: string; // "Escenario Pesimista", "Escenario Base", "Escenario Optimista"
    description: string;
    voteProjections: { candidateName: string; votes: number }[]; // Updated for N candidates
    swingVotes: number; // Votos indecisos en juego
    winner: string; // Winner name
}

export interface CandidateAnalysis {
    name: string;
    strengths: string[];
    weaknesses: string[];
    probabilityScore: number; // 0-100
}

export interface CandidateComparisonResult {
    winner: string;
    winnerReason: string;
    candidates: CandidateAnalysis[]; // Array of N candidates
    scenarios: ComparisonScenario[];
    keyDifferentiator: string;
}
