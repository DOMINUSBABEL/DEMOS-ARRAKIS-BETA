
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

export interface StrategyPipeline {
    phase1_extraction: string[]; // Análisis Histórico y Georreferenciación
    phase2_execution: string[]; // Minería de Datos y Escucha Social + Publicidad
    phase3_conversion: string[]; // Validación Rigurosa y Match Perfecto
}

export interface VoterAvatar {
    id: number;
    archetype: string; // e.g. "El Joven Indignado"
    demographics: string; // e.g. "Universitario, 22 años, Medellín"
    painPoint: string; // What worries them
    channel: string; // Where to find them (FB, IG, WA, Calle)
}

export interface CandidateAvatar {
    id: number;
    archetype: string; // e.g. "El Gestor Eficiente", "El Amigo del Barrio"
    messaging_angle: string; // The narrative hook
    visual_style: string; // How they should appear
    target_voter_ids: number[]; // IDs of VoterAvatars this persona targets
}

export interface MarketingStrategyResult {
    candidateProfile: string;
    calculatedBase: number; // Base Electoral X
    pipeline: StrategyPipeline;
    voterAvatars: VoterAvatar[]; // 10 Avatars
    candidateAvatars: CandidateAvatar[]; // 10 Avatars
    kpis: {
        metric: string;
        target: string;
    }[];
}

// NEW: Tactical Campaign Result for Specific Targeting
export interface TacticalContent {
    platform: string;
    copy: string;
    visualPrompt: string;
}

export interface TacticalCampaignResult {
    technicalJustification: string; // Why this candidate angle works for this voter
    geographicFocus: string[]; // NEW: Specific zones/barrios inferred from history
    demographicAdaptation: string; // NEW: Specific speech/tone adaptation instructions
    slogans: string[];
    socialMediaPosts: TacticalContent[];
    whatsappMessage: string;
    speechFragment: string; // A hook for a speech
    groundEvents: string[]; // Specific street actions
}

// NEW: Advanced Cronoposting Types
export interface SocialListeningTrend {
    keyword: string;
    sentiment: 'Negativo' | 'Positivo' | 'Neutro';
    volume: 'Alto' | 'Medio' | 'Bajo';
    context: string; // Why is this trending?
}

export interface CronopostingEntry {
    date: string; // ISO Date or "Semana 1 - Lunes"
    time: string; // Recommended posting time
    platform: string;
    format: string; // Reel, Story, Static, Carousel, Tweet
    contentTheme: string;
    objective: string; // The micro-goal of this post
    
    // Enhanced Fields
    headline: string; // Catchy title
    copy: string; // The actual text body
    hashtags: string[];
    visualCue: string; // Instructions for the image/video
    sentimentTarget: string; // Emotion to provoke (e.g. "Indignation", "Hope")
    listeningFocus: string; // What keyword to monitor in comments
}

export interface CronopostingResult {
    overview: string;
    detectedTrends: SocialListeningTrend[]; // Contextual trends driving the schedule
    schedule: CronopostingEntry[];
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

export interface CandidateAnalysis {
    name: string;
    probabilityScore: number; // 0-100 (Chance of Seat/Win)
    calculatedBase: number; // Base Electoral X Calculated by AI based on structure/history
    
    // Deep Dive Fields
    trajectory: string; 
    scandals: string; 
    image: string; 
    structure: string; 
    management: string; 
    territory: string; 
    alliances: string; 
    
    // Strategy
    pipeline: StrategyPipeline;

    // For Radar Chart and Weighting
    scoring: ScoringBreakdown;
    
    // The 10+10 Match
    voterAvatars: VoterAvatar[];
    candidateAvatars: CandidateAvatar[];
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

// AUTH TYPES
export interface User {
    username: string;
    password?: string; // Only used during auth, not stored in state
    role: 'admin' | 'user';
}
