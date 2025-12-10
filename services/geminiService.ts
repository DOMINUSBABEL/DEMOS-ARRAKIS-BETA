
import { GoogleGenAI, Type, GenerateContentResponse, Schema } from "@google/genai";
import { 
    CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData, 
    ListAnalysisAIResponse, ProcessedElectionData, MarketingStrategyResult, CandidateProfileResult, 
    CandidateComparisonResult, TacticalCampaignResult, CronopostingResult, CronopostingConfig,
    SocialListeningResponse, CampaignPlanResponse, ContentCalendarResponse,
    IntelReport, StrategyReport, CommsReport, CounterReport, OpsReport 
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
const model = 'gemini-3-pro-preview';

// --- LEGACY AGENT ORCHESTRATORS (Kept for backward compatibility if needed) ---

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

// --- NEW GENERAL STAFF ORCHESTRATORS ---

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

// ... (Rest of existing functions: classifyPartiesIdeology, getAIAnalysis, etc. - KEPT FOR BACKWARD COMPATIBILITY) ...

export const classifyPartiesIdeology = async (partyNames: string[]): Promise<Record<string, string>> => {
    const prompt = `
    Clasifica los siguientes partidos políticos de Colombia en una de estas categorías ideológicas:
    'Izquierda', 'Centro-Izquierda', 'Centro', 'Centro-Derecha', 'Derecha', 'Religioso', 'Otro'.
    
    Partidos:
    ${JSON.stringify(partyNames)}
    
    Responde ÚNICAMENTE con un JSON que contenga un array de objetos con "party" y "ideology".
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                party: { type: Type.STRING },
                ideology: { type: Type.STRING }
            },
            required: ['party', 'ideology']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        const list = JSON.parse(response.text || '[]');
        const result: Record<string, string> = {};
        if (Array.isArray(list)) {
            list.forEach((item: any) => {
                if (item.party && item.ideology) {
                    result[item.party] = item.ideology;
                }
            });
        }
        return result;
    } catch (error) {
        console.error("Error classifying ideologies:", error);
        return {};
    }
};

export const getAIAnalysis = async (params: { type: 'base_ranking' | 'simulation'; data: any; partyFilter?: string }): Promise<GenerateContentResponse> => {
    let prompt = "";
    if (params.type === 'base_ranking') {
        prompt = `Analiza este ranking electoral base (Poder Electoral Base) de Colombia. 
        ${params.partyFilter ? `Filtro aplicado: ${params.partyFilter}.` : ''}
        Identifica tendencias, fortalezas y debilidades.
        Datos: ${JSON.stringify(params.data, null, 2)}`;
    } else {
        prompt = `Analiza los resultados de esta simulación electoral (Monte Carlo).
        Datos Base: ${JSON.stringify(params.data.baseRanking, null, 2)}
        Resultados Simulación: ${JSON.stringify(params.data.results, null, 2)}
        Ofrece una perspectiva estratégica.`;
    }

    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Using pro for complex analysis with search
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
};

export const extractDataFromText = async (text: string): Promise<string> => {
    const prompt = `
    Analiza el siguiente texto que contiene datos electorales y extrae la información en formato CSV estructurado.
    Columnas requeridas: Eleccion, Año, UnidadPolitica, Candidato, Votos, EsCabezaDeLista (TRUE/FALSE).
    Si faltan datos, infiérelos del contexto o déjalos vacíos.
    Texto:
    ${text.substring(0, 30000)}... (truncado)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // Simple heuristic to extract CSV part if wrapped in markdown code blocks
        let csv = response.text || "";
        csv = csv.replace(/```csv/g, '').replace(/```/g, '').trim();
        return csv;
    } catch (error) {
        console.error("Error extracting data from text:", error);
        throw new Error("Error al extraer datos del texto.");
    }
};

export const extractDataFromDocument = async (file: { mimeType: string; data: string }): Promise<string> => {
    const prompt = `
    Extrae los datos electorales de este documento/imagen y conviértelos a formato CSV.
    Columnas requeridas: Eleccion, Año, UnidadPolitica, Candidato, Votos, EsCabezaDeLista (TRUE/FALSE).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: file.mimeType,
                        data: file.data
                    }
                },
                { text: prompt }
            ]
        });
        let csv = response.text || "";
        csv = csv.replace(/```csv/g, '').replace(/```/g, '').trim();
        return csv;
    } catch (error) {
        console.error("Error extracting data from document:", error);
        throw new Error("Error al extraer datos del documento.");
    }
};

export const generateStrategicReport = async (
    dataset: HistoricalDataset,
    partyAnalysis: Map<string, PartyAnalysisData>,
    targetParty: string,
    seats: number,
    focus: string,
    query: string
): Promise<GenerateContentResponse> => {
    const partyData = partyAnalysis.get(targetParty);
    const contextData = {
        datasetName: dataset.name,
        partyStats: partyData,
        seatsAvailable: seats,
        userFocus: focus,
        userQuery: query
    };

    const prompt = `
    Genera un informe estratégico electoral detallado para el partido "${targetParty}".
    Contexto: ${JSON.stringify(contextData, null, 2)}
    
    Estructura del Informe (Usa Markdown):
    1. Resumen Ejecutivo.
    2. Análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas).
    3. Ecosistema Narrativo (Temas clave y sentimiento).
    4. Inteligencia Geo-Táctica (Lugares clave).
    5. Recomendaciones Estratégicas.
    
    Usa Google Search para complementar con información actual sobre el partido o candidato.
    `;

    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
};

export const getGeospatialAnalysis = async (query: string, location: { latitude: number, longitude: number } | null): Promise<GenerateContentResponse> => {
    const prompt = `
    Responde a la siguiente consulta sobre geografía electoral en Colombia: "${query}"
    ${location ? `Ubicación del usuario: Lat ${location.latitude}, Long ${location.longitude}` : ''}
    Usa Google Maps para identificar lugares y Google Search para contexto electoral.
    `;

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }, { googleSearch: {} }],
            toolConfig: location ? {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                }
            } : undefined
        }
    });
};

export const getVoteTransferAnalysis = async (sourcePartyData: PartyData[], targetPartyData: PartyData[]): Promise<any> => {
    const prompt = `
    Estima la transferencia de votos entre dos elecciones basándote en los nombres de los partidos y sus votos.
    Origen: ${JSON.stringify(sourcePartyData.slice(0, 20))}
    Destino: ${JSON.stringify(targetPartyData.slice(0, 20))}
    
    Genera un JSON para un diagrama de Sankey:
    {
        "nodes": [{ "name": "Partido A Origen" }, ...],
        "links": [{ "source": 0, "target": 5, "value": 1000 }, ...]
    }
    Asume afinidad ideológica para las transferencias.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { name: { type: Type.STRING } },
                    required: ['name']
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.INTEGER },
                        target: { type: Type.INTEGER },
                        value: { type: Type.INTEGER }
                    },
                    required: ['source', 'target', 'value']
                }
            }
        },
        required: ['nodes', 'links']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error getting vote transfer analysis:", error);
        throw error;
    }
};

export const getOpenVsClosedListAnalysis = async (
    partyName: string,
    history: any[],
    metrics: any,
    targetYear: number
): Promise<ListAnalysisAIResponse> => {
    const prompt = `
    Analiza si el partido "${partyName}" debería usar Lista Abierta o Cerrada para las elecciones de ${targetYear}.
    Historia: ${JSON.stringify(history)}
    Métricas: ${JSON.stringify(metrics)}
    
    Genera una recomendación estratégica y proyecciones.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            projections: {
                type: Type.OBJECT,
                properties: {
                    openList: {
                        type: Type.OBJECT,
                        properties: { baseline: { type: Type.INTEGER }, lowerBound: { type: Type.INTEGER }, upperBound: { type: Type.INTEGER } }
                    },
                    closedList: {
                        type: Type.OBJECT,
                        properties: { baseline: { type: Type.INTEGER }, lowerBound: { type: Type.INTEGER }, upperBound: { type: Type.INTEGER } }
                    }
                }
            },
            strategicRecommendation: { type: Type.STRING, enum: ['Abierta', 'Cerrada', 'Depende del Contexto'] },
            analysis: {
                type: Type.OBJECT,
                properties: {
                    voteProfile: { type: Type.STRING, enum: ['Elástico', 'Inelástico', 'Mixto'] },
                    prosOpen: { type: Type.STRING },
                    consOpen: { type: Type.STRING },
                    prosClosed: { type: Type.STRING },
                    consClosed: { type: Type.STRING },
                    finalVerdict: { type: Type.STRING }
                },
                required: ['voteProfile', 'prosOpen', 'consOpen', 'prosClosed', 'consClosed', 'finalVerdict']
            }
        },
        required: ['projections', 'strategicRecommendation', 'analysis']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error generating list analysis:", error);
        throw error;
    }
};

export const generateMarketingStrategy = async (
    targetName: string,
    targetType: 'candidate' | 'party',
    context: string
): Promise<MarketingStrategyResult> => {
    const prompt = `
    Genera una estrategia de "Marketing Dinámico" para: ${targetName} (${targetType}).
    Contexto: ${context}

    TU MISIÓN ES DEFINIR LA ESTRATEGIA EN 3 FASES Y CREAR UN MATCH PERFECTO ENTRE 10 AVATARES DE VOTANTES Y 10 ÁNGULOS DEL CANDIDATO.

    1. **CÁLCULO DE BASE ELECTORAL (Estimación):**
       - Estima una "Base Electoral X" (número de votos) partiendo de estructuras, maquinaria histórica, alianzas probables y apoyos. Sé realista.

    2. **PIPELINE DE INTELIGENCIA (3 Fases):**
       - **Fase 1: Extracción y Diagnóstico:** Qué datos buscar (histórico E-14, escucha social, validación en terreno).
       - **Fase 2: Ejecución de Precisión:** Tácticas de micro-segmentación y publicidad (Meta APIs, WhatsApp, Territorio).
       - **Fase 3: Conexión y Conversión:** El objetivo final. Transformar el dato en voto efectivo.

    3. **MATRIZ DE MATCH (10 vs 10):**
       - Genera **10 Avatares de Votantes** (VoterPersonas) muy específicos (ej: "La Madre Cabeza de Familia en Barrio Popular", "El Joven Universitario Desencantado").
       - Genera **10 Avatares de Candidato** (CandidatePersonas) que son "ángulos" o "máscaras" que el candidato debe adoptar para conectar con cada uno de esos votantes (ej: "El Protector", "El Innovador").
       - Asegura que cada avatar de candidato esté diseñado para conectar con uno o más avatares de votantes.

    FORMATO JSON ESTRICTO.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            candidateProfile: { type: Type.STRING },
            calculatedBase: { type: Type.INTEGER, description: "Base electoral estimada partiendo de estructuras y maquinaria." },
            pipeline: {
                type: Type.OBJECT,
                properties: {
                    phase1_extraction: { type: Type.ARRAY, items: { type: Type.STRING } },
                    phase2_execution: { type: Type.ARRAY, items: { type: Type.STRING } },
                    phase3_conversion: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['phase1_extraction', 'phase2_execution', 'phase3_conversion']
            },
            voterAvatars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        archetype: { type: Type.STRING },
                        demographics: { type: Type.STRING },
                        painPoint: { type: Type.STRING },
                        channel: { type: Type.STRING }
                    },
                    required: ['id', 'archetype', 'demographics', 'painPoint', 'channel']
                }
            },
            candidateAvatars: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.INTEGER },
                        archetype: { type: Type.STRING },
                        messaging_angle: { type: Type.STRING },
                        visual_style: { type: Type.STRING },
                        target_voter_ids: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                    },
                    required: ['id', 'archetype', 'messaging_angle', 'visual_style', 'target_voter_ids']
                }
            },
            kpis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: { metric: { type: Type.STRING }, target: { type: Type.STRING } },
                    required: ['metric', 'target']
                }
            }
        },
        required: ['candidateProfile', 'calculatedBase', 'pipeline', 'voterAvatars', 'candidateAvatars', 'kpis']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error generating marketing strategy:", error);
        throw error;
    }
};

export const generateTacticalCampaign = async (
    candidateName: string,
    voterProfile: string,
    angleProfile: string,
    context: string
): Promise<TacticalCampaignResult> => {
    // UPDATED PROMPT FOR G4/G2 AGENT DEPTH - ENFORCING SPANISH
    const prompt = `
    ROL: Comandante Estratégico Conjunto (Integrando G2 Inteligencia y G4 Comunicaciones).
    
    TAREA: Diseñar una campaña táctica de "Guerra de Guerrillas" digital y territorial para conectar al CANDIDATO con el VOTANTE OBJETIVO.
    
    IDIOMA DE SALIDA: ESPAÑOL.

    ENTRADA:
    - Candidato: ${candidateName}
    - Ángulo del Candidato: ${angleProfile}
    - Votante Objetivo: ${voterProfile}
    - Contexto General: ${context}

    REQUISITOS DE RIGOR MILITAR (300% CAPACIDAD AUMENTADA):
    1.  **Justificación Técnica:** Análisis de neuro-política de por qué funciona este match.
    2.  **Perfil Psicométrico (OCEAN):** Define el perfil Big 5 del votante (Apertura, Responsabilidad, Extroversión, Amabilidad, Neuroticismo) y cómo explotarlo.
    3.  **Vectores de Guerra Narrativa:** Define un vector de ATAQUE (para contrastar con oponentes) y uno de DEFENSA (para blindar al candidato).
    4.  **Proyección Geográfica:** Zonas específicas (Barrios/Comunas) inferidas del perfil.
    5.  **Adaptación Demográfica:** Tono exacto, jerga y ritmo de habla.
    6.  **Slogans de Combate:** 3 lemas cortos.
    7.  **Cargas Virales (Viral Payloads):** Genera 3 conceptos de contenido viral específicos con:
        - Formato (Meme, Reel, Hilo).
        - Hook (Gancho de atención).
        - Prompt Visual (Descripción exacta para DALL-E/Midjourney).
        - Disparador Psicológico.
    8.  **Redes Sociales:** 2 posts tácticos (Copy + Prompt Visual).
    9.  **Mensajería Directa:** WhatsApp cadena.
    10. **Hook de Discurso:** Apertura.
    11. **Acciones de Tierra:** Eventos de alto impacto.

    FORMATO JSON ESTRICTO.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            technicalJustification: { type: Type.STRING },
            psychometricProfile: {
                type: Type.OBJECT,
                properties: {
                    openness: { type: Type.STRING },
                    conscientiousness: { type: Type.STRING },
                    extraversion: { type: Type.STRING },
                    agreeableness: { type: Type.STRING },
                    neuroticism: { type: Type.STRING }
                },
                required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
            },
            narrativeWarfare: {
                type: Type.OBJECT,
                properties: {
                    attack_vector: { type: Type.STRING },
                    defense_vector: { type: Type.STRING }
                },
                required: ['attack_vector', 'defense_vector']
            },
            geographicFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            demographicAdaptation: { type: Type.STRING },
            slogans: { type: Type.ARRAY, items: { type: Type.STRING } },
            viralPayloads: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        format: { type: Type.STRING },
                        hook: { type: Type.STRING },
                        visual_prompt: { type: Type.STRING },
                        psychological_trigger: { type: Type.STRING }
                    },
                    required: ['format', 'hook', 'visual_prompt', 'psychological_trigger']
                }
            },
            socialMediaPosts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        copy: { type: Type.STRING },
                        visualPrompt: { type: Type.STRING },
                        objective: { type: Type.STRING }
                    },
                    required: ['platform', 'copy', 'visualPrompt', 'objective']
                }
            },
            whatsappMessage: { type: Type.STRING },
            speechFragment: { type: Type.STRING },
            groundEvents: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['technicalJustification', 'psychometricProfile', 'narrativeWarfare', 'geographicFocus', 'demographicAdaptation', 'slogans', 'viralPayloads', 'socialMediaPosts', 'whatsappMessage', 'speechFragment', 'groundEvents']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgrade to Pro for complexity
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error generating tactical campaign:", error);
        throw new Error("No se pudo generar la campaña táctica.");
    }
};

export const autoConfigureCronoposting = async (userPrompt: string): Promise<Partial<CronopostingConfig>> => {
    const prompt = `
    ROL: Analista Senior de Estrategia Digital.
    TAREA: Traducir una solicitud en lenguaje natural de un usuario a una configuración técnica estructurada para una campaña de Cronoposting.
    
    SOLICITUD DEL USUARIO: "${userPrompt}"
    
    TU OBJETIVO:
    Inferir los mejores parámetros (plataformas, tono, mix, etc.) basándote en la solicitud. Sé estratégico.
    
    Salida JSON Estricta:
    {
        "duration": "string (ej: 1 mes, 2 semanas)",
        "goal": "string (Objetivo estratégico conciso)",
        "platforms": ["array de strings (Instagram, TikTok, X, Facebook, LinkedIn)"],
        "frequency": "string (Baja (Calidad) | Media (Constancia) | Alta (Dominancia) | Enjambre (Viral))",
        "tone": "string (Institucional | Disruptivo | Empático | Autoridad | Cercano)",
        "contentMix": "string (Educativo (70/20/10) | Promocional (Agresivo) | Entretenimiento (Viral) | Storytelling (Marca))",
        "keyFormats": ["array de strings (Reels, Historias, Carruseles, Hilos, Video Largo, Imagen Estática)"],
        "kpiFocus": "string (Alcance | Engagement | Conversión (Votos) | Tráfico)",
        "resourcesLevel": "string (Bajo (Orgánico) | Medio (Semi-Pro) | Alto (Producción))"
    }
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            duration: { type: Type.STRING },
            goal: { type: Type.STRING },
            platforms: { type: Type.ARRAY, items: { type: Type.STRING } },
            frequency: { type: Type.STRING, enum: ['Baja (Calidad)', 'Media (Constancia)', 'Alta (Dominancia)', 'Enjambre (Viral)'] },
            tone: { type: Type.STRING, enum: ['Institucional', 'Disruptivo', 'Empático', 'Autoridad', 'Cercano'] },
            contentMix: { type: Type.STRING, enum: ['Educativo (70/20/10)', 'Promocional (Agresivo)', 'Entretenimiento (Viral)', 'Storytelling (Marca)'] },
            keyFormats: { type: Type.ARRAY, items: { type: Type.STRING } },
            kpiFocus: { type: Type.STRING, enum: ['Alcance', 'Engagement', 'Conversión (Votos)', 'Tráfico'] },
            resourcesLevel: { type: Type.STRING, enum: ['Bajo (Orgánico)', 'Medio (Semi-Pro)', 'Alto (Producción)'] }
        },
        required: ['duration', 'goal', 'platforms', 'frequency', 'tone', 'contentMix', 'keyFormats', 'kpiFocus', 'resourcesLevel']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error auto-configuring cronoposting:", error);
        return {};
    }
}

export const generateCronoposting = async (
    config: CronopostingConfig
): Promise<CronopostingResult> => {
    // UPDATED PROMPT FOR G4 AGENT DEPTH - 500% BOOST
    const prompt = `
    ROL: Director Creativo G4 (Chief Digital Officer) especializado en Cronoposting de Alta Frecuencia y Guerra Cognitiva.
    
    TAREA: Generar una "Cronoposting Matrix" EXTREMADAMENTE DETALLADA Y PROFESIONAL.
    
    IDIOMA DE SALIDA: ESPAÑOL.

    PARÁMETROS DE CONFIGURACIÓN AVANZADA:
    - Duración: ${config.duration}
    - Fecha Inicio: ${config.startDate}
    - Objetivo: ${config.goal}
    - Contexto: ${config.context}
    - Plataformas: ${config.platforms.join(', ')}
    - Frecuencia: ${config.frequency}
    - Tono: ${config.tone}
    - Mix de Contenido: ${config.contentMix}
    - Formatos Clave: ${config.keyFormats.join(', ')}
    - Enfoque KPI: ${config.kpiFocus}
    - Nivel de Recursos: ${config.resourcesLevel}

    INSTRUCCIONES DE ALTA CAPACIDAD (PROFESIONALISMO EXTREMO):
    1.  Calcula fechas exactas y reales.
    2.  Diseña una secuencia narrativa coherente (Storytelling Arc), no posts aleatorios.
    3.  Aplica la regla 70-20-10 o la definida en el mix.
    4.  Para CADA post, define:
        - **Asset Prompt (CRÍTICO):** Un prompt técnico para Midjourney/DALL-E (incluye: tipo de lente, iluminación, estilo, sujeto).
        - **Copy Angle:** El ángulo psicológico exacto.
        - **Copywriting Framework:** Especifica si usar AIDA, PAS, BAB, StoryBrand, etc.
        - **Hashtags:** Mix de nicho y masivos.
        - **Best Time:** Hora sugerida basada en comportamiento digital LATAM.
        - **Visual Composition:** Reglas de composición visual (ej. Regla de tercios, Espacio negativo).

    FORMATO JSON ESTRICTO.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            strategic_rationale: { type: Type.STRING, description: "Justificación de alto nivel de la estrategia de contenidos." },
            overview: { type: Type.STRING, description: "Resumen ejecutivo del plan." },
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
        },
        required: ['strategic_rationale', 'overview', 'schedule']
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgrade to Pro
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (error) {
        console.error("Error generating cronoposting:", error);
        throw new Error("No se pudo generar el cronoposting avanzado.");
    }
};

export const generateCandidateProfile = async (
    candidateName: string,
    context: string,
    historicalData: { election: string; votes: number; party: string }[]
): Promise<CandidateProfileResult> => {
    // ... (Existing generateCandidateProfile - no changes)
    const prompt = `
    ROL: Analista de Inteligencia Política y Electoral.
    OBJETIVO: Generar un perfil integral de un candidato político.
    
    CANDIDATO: ${candidateName}
    CONTEXTO ADICIONAL: ${context}
    
    HISTORIAL ELECTORAL INTERNO (Datos Proporcionados):
    ${JSON.stringify(historicalData, null, 2)}

    INSTRUCCIONES:
    1.  **Analiza la Opinión Pública (Google Search):** Noticias, polémicas, logros.
    2.  **Analiza la Gestión (Google Search):** Cargos públicos previos.
    3.  **Proyección Electoral:** Sugiere un "Poder Electoral Base" realista.
    4.  **Parámetros de Simulación:** Volatilidad y tendencia.

    FORMATO DE RESPUESTA: JSON Estricto.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            overview: { type: Type.STRING },
            opinionAnalysis: { type: Type.STRING },
            managementAnalysis: { type: Type.STRING },
            simulationParameters: {
                type: Type.OBJECT,
                properties: {
                    suggestedVoteBase: { type: Type.INTEGER },
                    suggestedVoteFloor: { type: Type.INTEGER },
                    suggestedVoteCeiling: { type: Type.INTEGER },
                    volatility: { type: Type.STRING, enum: ['Alta', 'Media', 'Baja'] },
                    growthTrend: { type: Type.STRING, enum: ['Positiva', 'Estable', 'Negativa'] }
                },
                required: ['suggestedVoteBase', 'suggestedVoteFloor', 'suggestedVoteCeiling', 'volatility', 'growthTrend']
            }
        },
        required: ['overview', 'opinionAnalysis', 'managementAnalysis', 'simulationParameters']
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                tools: [{ googleSearch: {} }]
            }
        });

        const jsonText = response.text || "{}";
        const profile = JSON.parse(jsonText) as CandidateProfileResult;
        profile.sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        return profile;
    } catch (error) {
        console.error("Error generating candidate profile:", error);
        throw new Error("No se pudo generar el perfil del candidato.");
    }
};

export const generateCandidateComparison = async (
    candidates: string[],
    context: string
): Promise<CandidateComparisonResult> => {
    // ... (Existing generateCandidateComparison - no changes)
    const prompt = `
    ROL: Consultor Senior de Estrategia Electoral (War Games).
    OBJETIVO: Realizar una "Due Diligence" rigurosa de los siguientes candidatos: ${candidates.join(', ')}.

    CONTEXTO ELECTORAL: ${context}
    
    *** INSTRUCCIONES CLAVE DE ANÁLISIS ***
    Para cada candidato, debes realizar lo siguiente:

    1.  **CÁLCULO DE BASE ELECTORAL X:**
        Estima un número concreto de votos base (piso sólido) analizando sus estructuras, maquinarias, historial electoral (votos previos), alianzas con clanes/partidos y apoyos financieros/políticos. NO ADIVINES, deduce lógicamente.

    2.  **PIPELINE ESTRATÉGICO (3 Fases):**
        Define brevemente cómo debe ejecutar su campaña en 3 fases: Extracción/Diagnóstico, Ejecución de Precisión, y Conexión/Conversión.

    3.  **MATRIZ DE MATCH (10 vs 10):**
        Genera EXACTAMENTE:
        - **10 Avatares de Votantes** (VoterPersonas) detallados que componen su target.
        - **10 Avatares de Candidato** (CandidatePersonas/Ángulos) que el candidato debe adoptar para conectar con esos votantes.

    4.  **PONDERACIÓN (Scoring):**
        Calcula el 'probabilityScore' basado en: Estructura (30%), Territorio (20%), Trayectoria (15%), Gestión (15%), Dinámica Interna (20%) y penaliza por Escándalos.

    *** ESCENARIOS DE CURULES ***
    Genera escenarios realistas (A, B, C) basados en la fuerza real de los partidos involucrados.

    FORMATO DE RESPUESTA: JSON Estricto.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            listVerdict: { type: Type.STRING },
            partyMetrics: {
                type: Type.OBJECT,
                properties: {
                    totalListVotes: { type: Type.INTEGER },
                    candidateVotesSubtotal: { type: Type.INTEGER },
                    logoVotes: { type: Type.INTEGER },
                    logoPercentage: { type: Type.NUMBER }
                },
                required: ['totalListVotes', 'candidateVotesSubtotal', 'logoVotes', 'logoPercentage']
            },
            candidates: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        probabilityScore: { type: Type.NUMBER },
                        calculatedBase: { type: Type.INTEGER, description: "Base electoral calculada según estructura y maquinaria." },
                        trajectory: { type: Type.STRING },
                        scandals: { type: Type.STRING },
                        image: { type: Type.STRING },
                        structure: { type: Type.STRING },
                        management: { type: Type.STRING },
                        territory: { type: Type.STRING },
                        alliances: { type: Type.STRING },
                        pipeline: {
                            type: Type.OBJECT,
                            properties: {
                                phase1_extraction: { type: Type.ARRAY, items: { type: Type.STRING } },
                                phase2_execution: { type: Type.ARRAY, items: { type: Type.STRING } },
                                phase3_conversion: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ['phase1_extraction', 'phase2_execution', 'phase3_conversion']
                        },
                        scoring: {
                            type: Type.OBJECT,
                            properties: {
                                trajectoryScore: { type: Type.NUMBER },
                                structureScore: { type: Type.NUMBER },
                                territoryScore: { type: Type.NUMBER },
                                managementScore: { type: Type.NUMBER },
                                internalDynamicsScore: { type: Type.NUMBER },
                                scandalPenalty: { type: Type.NUMBER },
                            },
                            required: ['trajectoryScore', 'structureScore', 'territoryScore', 'managementScore', 'internalDynamicsScore', 'scandalPenalty']
                        },
                        voterAvatars: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    archetype: { type: Type.STRING },
                                    demographics: { type: Type.STRING },
                                    painPoint: { type: Type.STRING },
                                    channel: { type: Type.STRING }
                                },
                                required: ['id', 'archetype', 'demographics', 'painPoint', 'channel']
                            }
                        },
                        candidateAvatars: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.INTEGER },
                                    archetype: { type: Type.STRING },
                                    messaging_angle: { type: Type.STRING },
                                    visual_style: { type: Type.STRING },
                                    target_voter_ids: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                                },
                                required: ['id', 'archetype', 'messaging_angle', 'visual_style', 'target_voter_ids']
                            }
                        }
                    },
                    required: ['name', 'probabilityScore', 'calculatedBase', 'trajectory', 'scandals', 'structure', 'pipeline', 'scoring', 'voterAvatars', 'candidateAvatars']
                }
            },
            scenarios: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        voteProjections: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    candidateName: { type: Type.STRING },
                                    votes: { type: Type.NUMBER }
                                },
                                required: ['candidateName', 'votes']
                            }
                        },
                        swingVotes: { type: Type.NUMBER },
                        winner: { type: Type.STRING }
                    },
                    required: ['name', 'description', 'voteProjections', 'swingVotes', 'winner']
                }
            }
        },
        required: ['listVerdict', 'partyMetrics', 'candidates', 'scenarios']
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                tools: [{ googleSearch: {} }]
            }
        });

        const jsonText = response.text || "{}";
        const result = JSON.parse(jsonText);
        
        return result as CandidateComparisonResult;
    } catch (error) {
        console.error("Error generating comparison:", error);
        throw new Error("No se pudo generar el informe detallado.");
    }
};
