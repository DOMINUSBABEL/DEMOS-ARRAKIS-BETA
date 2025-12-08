
import { GoogleGenAI, Type, GenerateContentResponse, Schema } from "@google/genai";
import { CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData, ListAnalysisAIResponse, ProcessedElectionData, MarketingStrategyResult, CandidateProfileResult, CandidateComparisonResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-3-pro-preview';

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
    Genera una estrategia de marketing político de guerra para capturar el voto elástico.
    Objetivo: ${targetName} (${targetType}).
    Contexto: ${context}
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            candidateProfile: { type: Type.STRING },
            elasticVoterPersona: {
                type: Type.OBJECT,
                properties: {
                    demographics: { type: Type.STRING },
                    interests: { type: Type.ARRAY, items: { type: Type.STRING } },
                    painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    mediaHabits: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['demographics', 'interests', 'painPoints', 'mediaHabits']
            },
            campaignPillars: {
                type: Type.OBJECT,
                properties: {
                    rational: { type: Type.ARRAY, items: { type: Type.STRING } },
                    emotional: { type: Type.ARRAY, items: { type: Type.STRING } },
                    slogans: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['rational', 'emotional', 'slogans']
            },
            tactics: {
                type: Type.OBJECT,
                properties: {
                    digital: { type: Type.ARRAY, items: { type: Type.STRING } },
                    territory: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['digital', 'territory']
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
        required: ['candidateProfile', 'elasticVoterPersona', 'campaignPillars', 'tactics', 'kpis']
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

export const generateCandidateProfile = async (
    candidateName: string,
    context: string,
    historicalData: { election: string; votes: number; party: string }[]
): Promise<CandidateProfileResult> => {
    const prompt = `
    ROL: Analista de Inteligencia Política y Electoral.
    OBJETIVO: Generar un perfil integral de un candidato político para uso en simulaciones electorales.
    
    CANDIDATO: ${candidateName}
    CONTEXTO ADICIONAL: ${context}
    
    HISTORIAL ELECTORAL INTERNO (Datos Proporcionados):
    ${JSON.stringify(historicalData, null, 2)}

    INSTRUCCIONES:
    1.  **Analiza la Opinión Pública (Google Search):** Busca noticias recientes, polémicas, logros y percepción general. ¿Es favorable? ¿Polarizante?
    2.  **Analiza la Gestión (Google Search):** Si ha tenido cargos públicos (Alcalde, Concejal, Congresista), resume sus hitos de gestión o proyectos de ley. Si no, analiza su trayectoria profesional.
    3.  **Proyección Electoral (Simulación):** Basado en su historial y el "momentum" actual (opinión), sugiere un "Poder Electoral Base" para una simulación actual. Define un techo y un piso realistas.
    4.  **Parámetros de Simulación:** Define la volatilidad de su voto (¿es un voto duro o de opinión volátil?) y su tendencia de crecimiento.

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
    const prompt = `
    ROL: Consultor Estratégico Político Senior (Especialista en Modelos Predictivos).
    OBJETIVO: Realizar un análisis profundo ("War Games") de TODOS los siguientes candidatos: ${candidates.join(', ')}.

    CONTEXTO ELECTORAL: ${context}

    *** REGLAS DE ORO DE COHERENCIA Y PONDERACIÓN HISTÓRICA (SANITY CHECK) ***
    1.  **PONDERACIÓN HISTÓRICA VS OPINIÓN:** El historial electoral (votos previos reales) es el factor MÁS importante. 
        *   CRÍTICO: Un candidato con una votación histórica pequeña (ej. 3.500 votos como Julián Lopera o similar) **JAMÁS** debe aparecer con mayor probabilidad que un gran elector histórico (ej. 33.000 votos como John Jairo o similar) a menos que exista un evento catastrófico documentado (inhabilidad, cárcel, pérdida total de estructura).
        *   No sobrevalores el "ruido" en redes sociales sobre los votos reales de maquinaria y estructura.
    
    2.  **ESCENARIOS DE CURULES (MODELO DE 3 NIVELES):**
        Calcula la probabilidad asumiendo que la lista obtendrá entre 5 y 7 curules.
        *   **Escenario A (Probable - 5 Curules):** Los 5 candidatos más fuertes deben tener una 'probabilityScore' ALTA (>85%).
        *   **Escenario B (Posible - 6 Curules):** El 6º candidato fuerte está en zona de disputa ('probabilityScore' entre 40% y 60%).
        *   **Escenario C (Improbable/Techo - 7 Curules):** El 7º candidato tiene opciones remotas ('probabilityScore' entre 10% y 30%).
        *   **Resto de la Lista:** Candidatos por debajo del puesto 7 deben tener probabilidades residuales (< 5%).

    INSTRUCCIONES CLAVE PARA EL INFORME:
    
    1.  **DUE DILIGENCE (Google Search):** Investiga a CADA candidato. Busca:
        *   Votaciones anteriores (Cámara 2018, 2022, Asamblea, Concejo).
        *   Estructura actual (¿Quiénes son sus padrinos? ¿Qué alcaldías tienen?).
        *   Escándalos recientes que afecten su viabilidad.

    2.  **ESCENARIOS CUANTITATIVOS:**
        Genera 3 escenarios numéricos de votación para CADA candidato. Asegúrate de que las cifras proyectadas sean coherentes con su historial (un candidato de 3k no salta a 40k mágicamente).
        *   Escenario 1: Base (5 Curules Efectivas).
        *   Escenario 2: Optimista (6 Curules Efectivas).
        *   Escenario 3: Techo (7 Curules Efectivas).

    FORMATO DE RESPUESTA: JSON Estricto. Incluye TODOS los candidatos.
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            listVerdict: { type: Type.STRING, description: "Análisis estratégico de la lista. Quiénes son los fijos (1-5), quién pelea la 6ta, quién sueña con la 7ma." },
            candidates: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        probabilityScore: { type: Type.NUMBER, description: "Probabilidad General de Victoria (0-100). Respetar jerarquía histórica." },
                        trajectory: { type: Type.STRING, description: "Resumen detallado de carrera política y VOTOS ANTERIORES." },
                        scandals: { type: Type.STRING, description: "Investigaciones activas o ruido negativo." },
                        image: { type: Type.STRING, description: "Percepción de imagen." },
                        structure: { type: Type.STRING, description: "Apoyos de maquinaria y padrinos." },
                        management: { type: Type.STRING, description: "Hitos de gestión." },
                        territory: { type: Type.STRING, description: "Fortalezas territoriales." },
                        alliances: { type: Type.STRING, description: "Alianzas y rivalidades." },
                        attributes: {
                            type: Type.OBJECT,
                            properties: {
                                structure: { type: Type.NUMBER },
                                opinion: { type: Type.NUMBER },
                                resources: { type: Type.NUMBER },
                                territory: { type: Type.NUMBER },
                                momentum: { type: Type.NUMBER },
                            },
                            required: ['structure', 'opinion', 'resources', 'territory', 'momentum']
                        }
                    },
                    required: ['name', 'probabilityScore', 'trajectory', 'scandals', 'image', 'structure', 'management', 'territory', 'alliances', 'attributes']
                }
            },
            scenarios: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Nombre del escenario (ej: Base 5 Curules, Optimista 6 Curules)" },
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
        required: ['listVerdict', 'candidates', 'scenarios']
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
        return JSON.parse(jsonText) as CandidateComparisonResult;
    } catch (error) {
        console.error("Error generating comparison:", error);
        throw new Error("No se pudo generar el informe detallado.");
    }
};
