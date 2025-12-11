
import { GoogleGenAI, Type, GenerateContentResponse, Schema } from "@google/genai";
import { 
    CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData, 
    ListAnalysisAIResponse, ProcessedElectionData, MarketingStrategyResult, CandidateProfileResult, 
    CandidateComparisonResult, TacticalCampaignResult, CronopostingResult, CronopostingConfig, CronopostingEntry,
    SocialListeningResponse, CampaignPlanResponse, ContentCalendarResponse,
    IntelReport, StrategyReport, CommsReport, CounterReport, OpsReport, SocialPostResult 
} from '../types';
import { SocialListeningAgent } from './agents/SocialListeningAgent';
import { CampaignAgent } from './agents/CampaignAgent';
import { ContentAgent } from './agents/ContentAgent';
import { IntelAgent } from './agents/IntelAgent';
import { StrategyAgent } from './agents/StrategyAgent';
import { CommsAgent } from './agents/CommsAgent';
import { CounterAgent } from './agents/CounterAgent';
import { OpsAgent } from './agents/OpsAgent';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- LEGACY AGENT ORCHESTRATORS ---
export const runAgentSocial = async (query: string, context: string): Promise<SocialListeningResponse> => {
    const agent = new SocialListeningAgent();
    return await agent.generate(query, { user_context: context });
};

export const runAgentCampaign = async (query: string, context: string): Promise<CampaignPlanResponse> => {
    const agent = new CampaignAgent();
    return await agent.generate(query, { user_context: context });
};

export const runAgentContent = async (query: string, context: string): Promise<ContentCalendarResponse> => {
    const agent = new ContentAgent();
    return await agent.generate(query, { user_context: context });
};

// --- NEW GENERAL STAFF ORCHESTRATORS (WAR ROOM) ---
export const runIntelDirector = async (query: string, context: string): Promise<IntelReport> => {
    const agent = new IntelAgent();
    return await agent.generate(query, { user_context: context });
};

export const runStrategyDirector = async (query: string, context: string): Promise<StrategyReport> => {
    const agent = new StrategyAgent();
    return await agent.generate(query, { user_context: context });
};

export const runCommsDirector = async (query: string, context: string): Promise<CommsReport> => {
    const agent = new CommsAgent();
    return await agent.generate(query, { user_context: context });
};

export const runCounterDirector = async (query: string, context: string): Promise<CounterReport> => {
    const agent = new CounterAgent();
    return await agent.generate(query, { user_context: context });
};

export const runOpsDirector = async (query: string, context: string): Promise<OpsReport> => {
    const agent = new OpsAgent();
    return await agent.generate(query, { user_context: context });
};

// --- EXISTING SERVICES ---

export const classifyPartiesIdeology = async (partyNames: string[]): Promise<Record<string, string>> => {
    const prompt = `Clasifica los partidos políticos de Colombia: ${JSON.stringify(partyNames)} en: 'Izquierda', 'Centro-Izquierda', 'Centro', 'Centro-Derecha', 'Derecha', 'Religioso', 'Otro'. JSON Array {party, ideology}.`;
    const schema: Schema = {
        type: Type.ARRAY,
        items: { type: Type.OBJECT, properties: { party: { type: Type.STRING }, ideology: { type: Type.STRING } }, required: ['party', 'ideology'] }
    };
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
        const list = JSON.parse(response.text || '[]');
        const result: Record<string, string> = {};
        list.forEach((item: any) => { if (item.party) result[item.party] = item.ideology; });
        return result;
    } catch (error) { return {}; }
};

export const getAIAnalysis = async (params: { type: 'base_ranking' | 'simulation'; data: any; partyFilter?: string }): Promise<GenerateContentResponse> => {
    let prompt = params.type === 'base_ranking' 
        ? `Analiza ranking electoral base Colombia. ${params.partyFilter || ''}. Datos: ${JSON.stringify(params.data, null, 2)}`
        : `Analiza simulación electoral Monte Carlo. Datos: ${JSON.stringify(params.data, null, 2)}`;
    return await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { tools: [{ googleSearch: {} }] } });
};

export const extractDataFromText = async (text: string): Promise<string> => {
    return (await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Extrae CSV (Eleccion, Año, UnidadPolitica, Candidato, Votos, EsCabezaDeLista) de: ${text.substring(0, 30000)}` })).text?.replace(/```csv|```/g, '').trim() || "";
};

export const extractDataFromDocument = async (file: { mimeType: string; data: string }): Promise<string> => {
    return (await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: [{ inlineData: file }, { text: "Extrae CSV electoral (columnas estándar)." }] })).text?.replace(/```csv|```/g, '').trim() || "";
};

export const generateStrategicReport = async (dataset: HistoricalDataset, partyAnalysis: Map<string, PartyAnalysisData>, targetParty: string, seats: number, focus: string, query: string): Promise<GenerateContentResponse> => {
    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Informe estratégico electoral para "${targetParty}". Contexto: ${dataset.name}, ${seats} curules. Foco: ${focus}. Pregunta: ${query}. Estructura Markdown: Resumen, FODA, Narrativa, Geo-Táctica, Recomendaciones. Usa Google Search.`,
        config: { tools: [{ googleSearch: {} }] }
    });
};

export const getGeospatialAnalysis = async (query: string, location: { latitude: number, longitude: number } | null): Promise<GenerateContentResponse> => {
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Geografía electoral Colombia: "${query}". Ubicación: ${JSON.stringify(location)}.`,
        config: { tools: [{ googleMaps: {} }, { googleSearch: {} }], toolConfig: location ? { retrievalConfig: { latLng: location } } : undefined }
    });
};

export const getVoteTransferAnalysis = async (sourcePartyData: PartyData[], targetPartyData: PartyData[]): Promise<any> => {
    const schema: Schema = {
        type: Type.OBJECT, properties: { nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING } } } }, links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.INTEGER }, target: { type: Type.INTEGER }, value: { type: Type.INTEGER } } } } }
    };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Sankey votos transferencia partidos. Origen: ${JSON.stringify(sourcePartyData.slice(0,20))}. Destino: ${JSON.stringify(targetPartyData.slice(0,20))}`, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const getOpenVsClosedListAnalysis = async (partyName: string, history: any[], metrics: any, targetYear: number): Promise<ListAnalysisAIResponse> => {
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            projections: { type: Type.OBJECT, properties: { openList: { type: Type.OBJECT, properties: { baseline: { type: Type.INTEGER }, lowerBound: { type: Type.INTEGER }, upperBound: { type: Type.INTEGER } } }, closedList: { type: Type.OBJECT, properties: { baseline: { type: Type.INTEGER }, lowerBound: { type: Type.INTEGER }, upperBound: { type: Type.INTEGER } } } } },
            strategicRecommendation: { type: Type.STRING },
            analysis: { type: Type.OBJECT, properties: { voteProfile: { type: Type.STRING }, prosOpen: { type: Type.STRING }, consOpen: { type: Type.STRING }, prosClosed: { type: Type.STRING }, consClosed: { type: Type.STRING }, finalVerdict: { type: Type.STRING } } }
        }
    };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Análisis Lista Abierta vs Cerrada "${partyName}" para ${targetYear}. Historia: ${JSON.stringify(history)}`, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const generateMarketingStrategy = async (targetName: string, targetType: 'candidate' | 'party', context: string): Promise<MarketingStrategyResult> => {
    const prompt = `Estrategia Marketing Político "${targetName}". Contexto: ${context}. 
    JSON: candidateProfile, calculatedBase (number), pipeline (fases 1,2,3 array strings), voterAvatars (id, archetype, demographics, painPoint, channel), candidateAvatars (id, archetype, messaging_angle, visual_style, target_voter_ids), kpis. Match 10 avatars.`;
    
    // Schema simplified for brevity but structure maintained
    const schema: Schema = { type: Type.OBJECT, properties: { candidateProfile: { type: Type.STRING }, calculatedBase: { type: Type.INTEGER }, pipeline: { type: Type.OBJECT, properties: { phase1_extraction: {type: Type.ARRAY, items: {type: Type.STRING}}, phase2_execution: {type: Type.ARRAY, items: {type: Type.STRING}}, phase3_conversion: {type: Type.ARRAY, items: {type: Type.STRING}} } }, voterAvatars: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.INTEGER}, archetype: {type: Type.STRING}, demographics: {type: Type.STRING}, painPoint: {type: Type.STRING}, channel: {type: Type.STRING} } } }, candidateAvatars: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: {type: Type.INTEGER}, archetype: {type: Type.STRING}, messaging_angle: {type: Type.STRING}, visual_style: {type: Type.STRING}, target_voter_ids: {type: Type.ARRAY, items: {type: Type.INTEGER}} } } }, kpis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { metric: {type: Type.STRING}, target: {type: Type.STRING} } } } } };

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

// --- MILITARY GRADE PROMPTS RESTORED ---

export const generateTacticalCampaign = async (candidateName: string, voterProfile: string, angleProfile: string, context: string): Promise<TacticalCampaignResult> => {
    const prompt = `
    ROL: Comandante Estratégico Conjunto (G2/G4). TAREA: Campaña Táctica "Guerra de Guerrillas".
    ENTRADA: Candidato: ${candidateName}, Ángulo: ${angleProfile}, Votante: ${voterProfile}, Contexto: ${context}.
    
    REQUISITOS (RIGOR MILITAR - ESPAÑOL):
    1. Justificación Técnica (Neuro-política).
    2. Perfil Psicométrico OCEAN.
    3. Vectores de Guerra Narrativa (Ataque/Defensa).
    4. Proyección Geográfica (Barrios/Zonas).
    5. Adaptación Demográfica (Tono/Jerga).
    6. Slogans de Combate (3).
    7. Cargas Virales (Format, Hook, Visual Prompt, Trigger).
    8. Redes Sociales (Platform, Copy, Visual Prompt, Objective).
    9. Mensaje WhatsApp y Fragmento Discurso.
    10. Eventos de Tierra.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            technicalJustification: { type: Type.STRING },
            psychometricProfile: { type: Type.OBJECT, properties: { openness: {type:Type.STRING}, conscientiousness: {type:Type.STRING}, extraversion: {type:Type.STRING}, agreeableness: {type:Type.STRING}, neuroticism: {type:Type.STRING} } },
            narrativeWarfare: { type: Type.OBJECT, properties: { attack_vector: {type:Type.STRING}, defense_vector: {type:Type.STRING} } },
            geographicFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            demographicAdaptation: { type: Type.STRING },
            slogans: { type: Type.ARRAY, items: { type: Type.STRING } },
            viralPayloads: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { format: {type:Type.STRING}, hook: {type:Type.STRING}, visual_prompt: {type:Type.STRING}, psychological_trigger: {type:Type.STRING} } } },
            socialMediaPosts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { platform: {type:Type.STRING}, copy: {type:Type.STRING}, visualPrompt: {type:Type.STRING}, objective: {type:Type.STRING} } } },
            whatsappMessage: { type: Type.STRING },
            speechFragment: { type: Type.STRING },
            groundEvents: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    };

    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const autoConfigureCronoposting = async (userPrompt: string): Promise<Partial<CronopostingConfig>> => {
    const prompt = `ROL: Analista Estrategia Digital. TAREA: Configurar campaña cronoposting basada en: "${userPrompt}".
    Salida JSON: duration, goal, platforms (array), frequency, tone, contentMix, keyFormats (array), kpiFocus, resourcesLevel.`;
    const schema: Schema = { type: Type.OBJECT, properties: { duration: {type:Type.STRING}, goal: {type:Type.STRING}, platforms: {type:Type.ARRAY, items:{type:Type.STRING}}, frequency: {type:Type.STRING}, tone: {type:Type.STRING}, contentMix: {type:Type.STRING}, keyFormats: {type:Type.ARRAY, items:{type:Type.STRING}}, kpiFocus: {type:Type.STRING}, resourcesLevel: {type:Type.STRING} } };
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const generateCronoposting = async (config: CronopostingConfig): Promise<CronopostingResult> => {
    const prompt = `
    ROL: Director Creativo G4 (Guerra Cognitiva). TAREA: Matriz Cronoposting Alta Frecuencia.
    PARAMS: ${JSON.stringify(config)}.
    INSTRUCCIONES (500% BOOST):
    - Secuencia narrativa coherente (Storytelling Arc).
    - Para CADA post: Fecha, Plataforma, Formato, Tema, Objetivo, ASSET PROMPT (Técnico Midjourney), COPY ANGLE (Psicológico), FRAMEWORK (AIDA/PAS), Hashtags, Best Time, Composición Visual.
    `;
    
    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            overview: { type: Type.STRING },
            strategic_rationale: { type: Type.STRING },
            schedule: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING },
                        platform: { type: Type.STRING },
                        format: { type: Type.STRING },
                        contentTheme: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        asset_prompt: { type: Type.STRING },
                        copy_angle: { type: Type.STRING },
                        copywriting_framework: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        best_time: { type: Type.STRING },
                        visual_composition: { type: Type.STRING }
                    },
                    required: ['date', 'platform', 'format', 'contentTheme', 'objective', 'asset_prompt', 'copy_angle', 'copywriting_framework', 'hashtags', 'best_time', 'visual_composition']
                }
            }
        }
    };

    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const generatePostStructure = async (entry: CronopostingEntry, candidateName: string, context: string): Promise<SocialPostResult> => {
    const prompt = `ROL: Copywriter Político Senior. TAREA: Redactar post. Candidato: ${candidateName}. Contexto: ${context}. Entry: ${JSON.stringify(entry)}. JSON: caption, hashtags, image_prompt (refinado), strategic_notes.`;
    const schema: Schema = { type: Type.OBJECT, properties: { caption: {type:Type.STRING}, hashtags: {type:Type.ARRAY, items:{type:Type.STRING}}, image_prompt: {type:Type.STRING}, strategic_notes: {type:Type.STRING} } };
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
    return JSON.parse(response.text || '{}');
};

export const generateNanoBananaImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ text: prompt }] } });
        for (const part of response.candidates[0].content.parts) { if (part.inlineData) return part.inlineData.data; }
        throw new Error("No image generated.");
    } catch (error) { console.error(error); throw new Error("Image generation failed."); }
};

export const generateCandidateProfile = async (candidateName: string, context: string, history: any[]): Promise<CandidateProfileResult> => {
    const prompt = `Perfil Político "${candidateName}". Contexto: ${context}. Historial: ${JSON.stringify(history)}. JSON: overview, opinionAnalysis, managementAnalysis, simulationParameters (base, floor, ceiling, volatility, trend). Usa Google Search.`;
    const schema: Schema = { type: Type.OBJECT, properties: { overview: {type:Type.STRING}, opinionAnalysis: {type:Type.STRING}, managementAnalysis: {type:Type.STRING}, simulationParameters: { type: Type.OBJECT, properties: { suggestedVoteBase: {type:Type.INTEGER}, suggestedVoteFloor: {type:Type.INTEGER}, suggestedVoteCeiling: {type:Type.INTEGER}, volatility: {type:Type.STRING}, growthTrend: {type:Type.STRING} } }, sources: {type:Type.ARRAY, items:{type:Type.OBJECT}} } };
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, tools: [{ googleSearch: {} }] } });
    const res = JSON.parse(response.text || '{}');
    res.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return res;
};

export const generateCandidateComparison = async (candidates: string[], context: string): Promise<CandidateComparisonResult> => {
    const prompt = `War Game Comparativo: ${JSON.stringify(candidates)}. Contexto: ${context}. JSON: listVerdict, partyMetrics (totalListVotes, candidateVotesSubtotal, logoVotes, logoPercentage), candidates (array), scenarios (array).`;
    const schema: Schema = { 
        type: Type.OBJECT, 
        properties: { 
            listVerdict: {type:Type.STRING}, 
            partyMetrics: {type:Type.OBJECT, properties:{totalListVotes:{type:Type.INTEGER}, candidateVotesSubtotal:{type:Type.INTEGER}, logoVotes:{type:Type.INTEGER}, logoPercentage:{type:Type.NUMBER}}}, 
            candidates: {type:Type.ARRAY, items:{type:Type.OBJECT, properties:{name:{type:Type.STRING}, probabilityScore:{type:Type.NUMBER}, calculatedBase:{type:Type.INTEGER}, trajectory:{type:Type.STRING}, scandals:{type:Type.STRING}, image:{type:Type.STRING}, structure:{type:Type.STRING}, management:{type:Type.STRING}, territory:{type:Type.STRING}, alliances:{type:Type.STRING}, pipeline:{type:Type.OBJECT, properties: {phase1_extraction: {type: Type.ARRAY, items: {type: Type.STRING}}, phase2_execution: {type: Type.ARRAY, items: {type: Type.STRING}}, phase3_conversion: {type: Type.ARRAY, items: {type: Type.STRING}}}}, scoring:{type:Type.OBJECT, properties:{trajectoryScore:{type:Type.NUMBER}, structureScore:{type:Type.NUMBER}, territoryScore:{type:Type.NUMBER}, managementScore:{type:Type.NUMBER}, internalDynamicsScore:{type:Type.NUMBER}, scandalPenalty:{type:Type.NUMBER}}}, voterAvatars:{type:Type.ARRAY, items:{type:Type.OBJECT, properties:{id:{type:Type.INTEGER}, archetype:{type:Type.STRING}, demographics:{type:Type.STRING}, painPoint:{type:Type.STRING}, channel:{type:Type.STRING}}}}, candidateAvatars:{type:Type.ARRAY, items:{type:Type.OBJECT, properties:{id:{type:Type.INTEGER}, archetype:{type:Type.STRING}, messaging_angle:{type:Type.STRING}, visual_style:{type:Type.STRING}, target_voter_ids:{type:Type.ARRAY, items:{type:Type.INTEGER}}}}}}}}, 
            scenarios: {type:Type.ARRAY, items:{type:Type.OBJECT, properties:{name:{type:Type.STRING}, description:{type:Type.STRING}, swingVotes:{type:Type.INTEGER}, winner:{type:Type.STRING}, voteProjections:{type:Type.ARRAY, items:{type:Type.OBJECT, properties:{candidateName:{type:Type.STRING}, votes:{type:Type.INTEGER}}}}}}} 
        } 
    };
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema, tools: [{ googleSearch: {} }] } });
    return JSON.parse(response.text || '{}');
};
