
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

// --- EXPANDED TACTICAL & CRONOPOSTING TYPES (300% CAPACITY) ---

export interface PsychometricProfile {
    openness: string; // e.g. "Baja - Prefiere lo conocido"
    conscientiousness: string; // "Alta - Valora el orden"
    extraversion: string;
    agreeableness: string;
    neuroticism: string; // "Alta - Responde al miedo/seguridad"
}

export interface ViralPayload {
    format: string; // "Meme", "Video Vertical", "Tweet Hilo"
    hook: string; // The attention grabber
    visual_prompt: string; // DALL-E / Midjourney prompt
    psychological_trigger: string; // e.g. "Fear of Loss", "Social Proof"
}

export interface TacticalContent {
    platform: string;
    copy: string;
    visualPrompt: string;
    objective: string; // Micro-objective for this specific post
}

export interface TacticalCampaignResult {
    technicalJustification: string;
    psychometricProfile: PsychometricProfile; // NEW: OCEAN Model
    narrative_virus: { // NEW: Attack/Defense vectors
        attack_vector: string;
        defense_vector: string;
    };
    geographicFocus: string[];
    demographicAdaptation: string;
    slogans: string[];
    viralPayloads: ViralPayload[]; // NEW: Specific viral content concepts
    socialMediaPosts: TacticalContent[];
    whatsappMessage: string;
    speechFragment: string;
    groundEvents: string[];
}

// --- 500% BOOSTED CRONOPOSTING TYPES ---

export interface CronopostingConfig {
    duration: string;
    startDate: string;
    goal: string;
    context: string;
    // New Advanced Parameters
    platforms: string[]; // Instagram, TikTok, X, LinkedIn, Facebook
    frequency: 'Baja (Calidad)' | 'Media (Constancia)' | 'Alta (Dominancia)' | 'Enjambre (Viral)' | 'Blitzkrieg (Saturación)' | 'Sniper (Precisión)' | 'Pulse (Latido)';
    tone: 'Institucional' | 'Disruptivo' | 'Empático' | 'Autoridad' | 'Cercano' | 'Urgente/Alarmista' | 'Inspirador/Visionario' | 'Científico/Datos' | 'Satírico/Meme';
    contentMix: 'Educativo (70/20/10)' | 'Promocional (Agresivo)' | 'Entretenimiento (Viral)' | 'Storytelling (Marca)' | 'Engagement (40/40/20)' | 'Conversión (30/30/40)';
    keyFormats: string[]; // Reels, Carruseles, Hilos, Historias
    kpiFocus: 'Alcance' | 'Engagement' | 'Conversión (Votos)' | 'Tráfico';
    resourcesLevel: 'Bajo (Orgánico)' | 'Medio (Semi-Pro)' | 'Alto (Producción)' | 'Cine (Alta Gama)' | 'Guerrilla (Low Cost)';
}

export interface CronopostingEntry {
    date: string;
    platform: string;
    format: string;
    contentTheme: string;
    objective: string;
    // Advanced Fields
    asset_prompt: string; // Detailed Midjourney/DALL-E prompt
    copy_angle: string; // Psychological angle
    copywriting_framework: string; // AIDA, PAS, BAB
    hashtags: string[]; // Strategic hashtag mix
    best_time: string; // Suggested posting time
    visual_composition: string; // e.g. "Rule of thirds, high contrast"
}

export interface CronopostingResult {
    overview: string;
    schedule: CronopostingEntry[];
    strategic_rationale: string; // Explanation of the grid logic
}

export interface SocialPostResult {
    caption: string;
    hashtags: string[];
    image_prompt: string;
    strategic_notes: string;
}

// --- END NEW TYPES ---

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

// STORAGE TYPES
export interface SavedAnalysis {
    id: string;
    name: string;
    type: 'simulation' | 'marketing' | 'candidate_profile' | 'candidate_comparison';
    date: string;
    data: any; // The payload (SimulationParams, MarketingResult, etc.)
}

// --- GENERAL STAFF AGENT TYPES (MILITARY GRADE) ---

// G2: Intel
export interface IntelReport {
    chainOfThought: string[];
    psychometric_profile: {
        openness: string;
        conscientiousness: string;
        extraversion: string;
        agreeableness: string;
        neuroticism: string;
        analysis: string;
    };
    sentiment_spectrum: {
        rage: number;
        vigilance: number;
        ecstasy: number;
        admiration: number;
        terror: number;
        amazement: number;
        grief: number;
        loathing: number;
    };
    narrative_triangulation: {
        origin_point: string;
        patient_zero: string;
        vectors: string[];
    }[];
    ecosystem_scan: string;
}

// G3: Strategy
export interface StrategyReport {
    chainOfThought: string[];
    war_game_scenario: {
        red_team_move: string;
        blue_team_counter: string;
        projected_impact: string;
    };
    dynamic_vote_model: {
        swing_voters_count: number;
        hard_vote_count: number;
        vulnerability_index: number; // 0-100
    };
    resource_allocation: {
        channel: string;
        budget_percent: number;
        roi_projection: string;
    }[];
}

// G4: Comms
export interface CommsReport {
    chainOfThought: string[];
    viral_payloads: {
        format: string; // Meme, Thread, Clip
        hook: string;
        psychological_trigger: string;
        asset_prompt: string;
    }[];
    cronoposting_matrix: {
        day: number;
        time: string;
        platform: string;
        content_type: string;
        objective: string;
    }[];
    micro_targeting_scripts: {
        persona: string;
        script: string;
        tone: string;
    }[];
}

// G5: Counter-Intel
export interface CounterReport {
    chainOfThought: string[];
    threat_radar: {
        threat: string;
        severity: 'Critical' | 'High' | 'Medium' | 'Low';
        origin: string; // Organic vs Inorganic
        status: 'Active' | 'Dormant' | 'Neutralized';
    }[];
    inoculation_strategy: {
        narrative_to_prebunk: string;
        counter_message: string;
        deployment_channel: string;
    }[];
    bot_network_analysis: string;
}

// G1: Ops (Field)
export interface OpsReport {
    chainOfThought: string[];
    territorial_heatmap: {
        zone_name: string;
        heat_level: number; // 0-100
        priority_action: string;
    }[];
    gotv_logistics: {
        transport_units: number;
        volunteers_needed: number;
        routing_strategy: string;
    };
}

// --- LEGACY AGENT TYPES ---

export interface SocialListeningResponse {
    chainOfThought: string[];
    sentiment_breakdown: {
        emotion: string;
        percentage: number;
        context: string;
    }[];
    narrative_virus: {
        name: string;
        velocity: 'High' | 'Medium' | 'Low';
        description: string;
    }[];
    influencer_graph: {
        name: string;
        affinity: string;
        influence_level: number;
    }[];
    strategic_intel: string;
}

export interface CampaignPlanResponse {
    chainOfThought: string[];
    cobalto_plan: {
        zone: string;
        priority: 'Critical' | 'High' | 'Normal';
        action: string;
    }[];
    resource_allocation: {
        channel: string;
        percentage: number;
        justification: string;
    }[];
    ab_simulation: {
        scenarioA: string;
        scenarioB: string;
        winner: string;
        reason: string;
    };
    gotv_logistics: string[];
}

export interface ContentCalendarResponse {
    chainOfThought: string[];
    monthly_calendar: {
        week: number;
        focus: string;
        posts: {
            platform: string;
            content: string;
            asset_prompt: string;
        }[];
    }[];
    cross_platform_adaptations: {
        platform: string;
        strategy: string;
    }[];
}
