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

export interface SimulationParams {
  fragmentationUnit: string;
  numCandidates: number;
  governmentParties: string[];
  threshold: number;
  monteCarloIterations: number;
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

export type AnalysisType = 'candidate' | 'party';

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
// NEW: ToonDataset is the primary storage format.
export interface ToonDataset {
    id: string;
    name: string;
    toonData: string; // The serialized TOON data
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