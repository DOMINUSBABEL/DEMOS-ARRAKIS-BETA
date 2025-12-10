
import { GoogleGenAI, Type, GenerateContentResponse, Schema } from "@google/genai";
import { CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData, ListAnalysisAIResponse, ProcessedElectionData, MarketingStrategyResult, CandidateProfileResult, CandidateComparisonResult, TacticalCampaignResult, CronopostingResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-3-pro-preview';

// ... (Existing exports: classifyPartiesIdeology, getAIAnalysis, etc. - keep them unchanged) ...
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
    const prompt = `
    ROL: Jefe de Campaña Estratégica Digital y de Campo con Especialización en Geografía Electoral.
    
    TAREA: Diseñar una campaña táctica de marketing dinámico para conectar al CANDIDATO con el VOTANTE.
    
    ENTRADA:
    - Candidato: ${candidateName}
    - Ángulo del Candidato: ${angleProfile}
    - Votante Objetivo: ${voterProfile}
    - Contexto General: ${context}

    REQUISITOS DE RIGOR TÉCNICO:
    1.  **Justificación Técnica:** Explica en 2 párrafos técnicos por qué este votante conecta con este ángulo. Usa terminología de psicología política y neuromarketing.
    2.  **Proyección Geográfica (Geographic Focus):** Basado en los perfiles demográficos típicos del contexto (ej: Medellín, Antioquia), infiere y lista 3 Zonas, Comunas o Barrios específicos donde históricamente reside este tipo de votante. Sé preciso (ej: "Comuna 13 - San Javier", "Barrio El Poblado").
    3.  **Adaptación Demográfica (Demographic Adaptation):** Instrucción específica de cómo calibrar el discurso para este segmento. Define el tono, el vocabulario (slang, formal, técnico) y el ritmo.
    4.  **Slogans de Combate:** 3 lemas cortos y potentes.
    5.  **Contenido Redes:** 2 posts detallados.
    6.  **Mensajería Directa:** Un mensaje para WhatsApp.
    7.  **Hook de Discurso:** Apertura impactante.
    8.  **Acciones de Tierra:** 2 eventos tácticos.

    FORMATO JSON ESTRICTO.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            technicalJustification: { type: Type.STRING },
            geographicFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            demographicAdaptation: { type: Type.STRING },
            slogans: { type: Type.ARRAY, items: { type: Type.STRING } },
            socialMediaPosts: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        platform: { type: Type.STRING },
                        copy: { type: Type.STRING },
                        visualPrompt: { type: Type.STRING }
                    },
                    required: ['platform', 'copy', 'visualPrompt']
                }
            },
            whatsappMessage: { type: Type.STRING },
            speechFragment: { type: Type.STRING },
            groundEvents: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['technicalJustification', 'geographicFocus', 'demographicAdaptation', 'slogans', 'socialMediaPosts', 'whatsappMessage', 'speechFragment', 'groundEvents']
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
        console.error("Error generating tactical campaign:", error);
        throw new Error("No se pudo generar la campaña táctica.");
    }
};

export const generateCronoposting = async (
    duration: string,
    startDate: string,
    goal: string,
    context: string,
    intensity: string, // 'Baja', 'Media', 'Alta'
    tone: string // 'Inspirador', 'Confrontativo', etc.
): Promise<CronopostingResult> => {
    const prompt = `
    ROL: Estratega Senior de Contenidos Digitales y Especialista en Social Listening.
    
    TAREA: Generar un plan maestro de contenidos (Cronoposting) de ALTO NIVEL Y COMPLEJIDAD.
    
    PARÁMETROS:
    - Duración: ${duration}
    - Fecha de Inicio: ${startDate}
    - Objetivo Estratégico (Fin Y): ${goal}
    - Intensidad de Campaña: ${intensity}
    - Tono Narrativo: ${tone}
    - Contexto del Perfil/Campaña: ${context}

    FASE 1: SOCIAL LISTENING (SIMULACIÓN)
    Detecta 3 tendencias probables (simuladas) en la conversación digital actual relacionadas con el contexto político/social que justifiquen el contenido.

    FASE 2: CRONOGRAMA DE PRECISIÓN
    1.  Calcula las fechas reales.
    2.  Distribuye el contenido estratégicamente.
    3.  Define plataformas (Instagram, TikTok, X/Twitter, WhatsApp).
    4.  **COPYWRITING:** Escribe el copy COMPLETO, persuasivo y adaptado a la plataforma (incluye emojis).
    5.  **VISUAL CUE:** Instrucciones precisas para el equipo de diseño/video.
    6.  **LISTENING TRIGGER:** Define qué palabra clave o sentimiento monitorear en los comentarios de ese post para medir el éxito.

    FORMATO JSON ESTRICTO.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            overview: { type: Type.STRING, description: "Resumen estratégico del plan de contenidos." },
            detectedTrends: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        keyword: { type: Type.STRING },
                        sentiment: { type: Type.STRING, enum: ['Positivo', 'Negativo', 'Neutro'] },
                        volume: { type: Type.STRING, enum: ['Alto', 'Medio', 'Bajo'] },
                        context: { type: Type.STRING }
                    },
                    required: ['keyword', 'sentiment', 'volume', 'context']
                }
            },
            schedule: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING },
                        time: { type: Type.STRING },
                        platform: { type: Type.STRING },
                        format: { type: Type.STRING },
                        headline: { type: Type.STRING },
                        contentTheme: { type: Type.STRING },
                        copy: { type: Type.STRING },
                        visualCue: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sentimentTarget: { type: Type.STRING },
                        listeningFocus: { type: Type.STRING }
                    },
                    required: ['date', 'time', 'platform', 'format', 'headline', 'contentTheme', 'copy', 'visualCue', 'objective', 'hashtags', 'sentimentTarget', 'listeningFocus']
                }
            }
        },
        required: ['overview', 'detectedTrends', 'schedule']
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
        console.error("Error generating cronoposting:", error);
        throw new Error("No se pudo generar el cronoposting complejo.");
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
