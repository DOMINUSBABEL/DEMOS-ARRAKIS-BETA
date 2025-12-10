
import { GoogleGenAI, Schema, Type, GenerateContentResponse } from "@google/genai";
import { 
    CronopostingResult, 
    MarketingStrategyResult, 
    TacticalCampaignResult, 
    CandidateProfileResult, 
    CandidateComparisonResult, 
    ListAnalysisAIResponse,
    SankeyData,
    PartyData,
    HistoricalDataset,
    PartyAnalysisData,
    CandidateRanking,
    SimulationResults
} from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Data Extraction
export const extractDataFromText = async (text: string): Promise<string> => {
    const prompt = `
    Analiza el siguiente texto y extrae datos electorales estructurados.
    Devuelve ÚNICAMENTE un formato CSV válido con las siguientes columnas:
    Eleccion, Año, UnidadPolitica, Candidato, Votos, EsCabezaDeLista
    
    Reglas:
    - Si el candidato representa solo a la lista/partido, pon 'SOLO POR LA LISTA' en Candidato y TRUE en EsCabezaDeLista.
    - Si es un candidato específico, pon su nombre en Candidato y FALSE en EsCabezaDeLista.
    - Limpia los nombres de partidos y candidatos.
    - Ignora encabezados o texto irrelevante. Solo datos.
    
    Texto:
    ${text.substring(0, 30000)} // Limit input length
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return response.text || '';
};

export const extractDataFromDocument = async (file: { mimeType: string; data: string }): Promise<string> => {
    const prompt = `
    Extrae los datos electorales de este documento.
    Devuelve ÚNICAMENTE un formato CSV válido con las columnas:
    Eleccion, Año, UnidadPolitica, Candidato, Votos, EsCabezaDeLista
    
    Reglas:
    - Normaliza los nombres.
    - 'EsCabezaDeLista' debe ser TRUE o FALSE.
    - Si es voto por partido/logo, Candidato = 'SOLO POR LA LISTA'.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: file.mimeType, data: file.data } },
                { text: prompt }
            ]
        }
    });
    return response.text || '';
};

// 2. Classifications
export const classifyPartiesIdeology = async (partyNames: string[]): Promise<Record<string, string>> => {
    const prompt = `
    Clasifica los siguientes partidos políticos colombianos en una de estas categorías ideológicas:
    'Izquierda', 'Centro-Izquierda', 'Centro', 'Centro-Derecha', 'Derecha', 'Religioso', 'Otro'.
    
    Partidos: ${partyNames.join(', ')}
    
    Devuelve un JSON exacto: { "Nombre Partido": "Ideología", ... }
    `;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            classifications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        party: { type: Type.STRING },
                        ideology: { type: Type.STRING }
                    }
                }
            }
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            }
        });
        const json = JSON.parse(response.text || '{}');
        // Handle potentially different JSON structures if the model hallucinates a wrapper
        const result: Record<string, string> = {};
        if (Array.isArray(json)) {
             json.forEach((item: any) => {
                 if (item.party && item.ideology) result[item.party] = item.ideology;
             });
        } else if (json.classifications && Array.isArray(json.classifications)) {
             json.classifications.forEach((item: any) => {
                 if (item.party && item.ideology) result[item.party] = item.ideology;
             });
        } else {
             // Fallback for direct object mapping
             Object.entries(json).forEach(([k, v]) => {
                 if (typeof v === 'string') result[k] = v;
             });
        }
        return result;
    } catch (e) {
        console.error("Error classifying ideologies", e);
        return {};
    }
};

// 3. Analysis & Reports
export const getAIAnalysis = async (context: { type: 'base_ranking' | 'simulation'; data: any; partyFilter?: string }): Promise<GenerateContentResponse> => {
    let prompt = "";
    if (context.type === 'base_ranking') {
        const ranking = context.data as CandidateRanking[];
        const top5 = ranking.slice(0, 5).map(c => `${c.candidato} (${c.unidadPolitica}): ${c.poderElectoralBase}`).join(', ');
        prompt = `
        Analiza este Ranking de Poder Electoral Base en Colombia.
        Filtro actual: ${context.partyFilter || 'Todos los partidos'}.
        Top 5 Candidatos: ${top5}.
        
        Usa Google Search para buscar noticias recientes, escándalos o logros de estos candidatos y partidos en el último año.
        Provee un análisis estratégico corto (3 párrafos):
        1. Fortalezas detectadas.
        2. Debilidades o riesgos (basado en noticias recientes).
        3. Oportunidades en el contexto actual.
        `;
    } else {
        const results = context.data.results as SimulationResults;
        const winners = results.probabilities.filter(p => p.probabilidad_curul > 50).map(p => `${p.candidato} (${p.probabilidad_curul.toFixed(1)}%)`).join(', ');
        prompt = `
        Analiza los resultados de esta simulación electoral Monte Carlo.
        Candidatos con >50% de probabilidad de éxito: ${winners}.
        
        Usa Google Search para validar si estos candidatos tienen la maquinaria o apoyo popular real para lograr estos números.
        Provee un análisis de viabilidad política.
        `;
    }

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
};

export const generateStrategicReport = async (
    dataset: HistoricalDataset | null, 
    partyAnalysis: Map<string, PartyAnalysisData>, 
    targetParty: string, 
    seats: number, 
    focus: string, 
    query: string
): Promise<GenerateContentResponse> => {
    if (!dataset) throw new Error("No dataset provided");
    
    const partyData = partyAnalysis.get(targetParty);
    const totalVotes = dataset.partyData.reduce((acc, p) => acc + p.votes, 0);
    const targetVotes = partyData ? partyData.history.find(h => h.datasetId === dataset.id)?.votes || 0 : 0;
    
    const prompt = `
    GENERAR INFORME ESTRATÉGICO CUANTITATIVO Y CUALITATIVO.
    
    Objetivo: ${targetParty}
    Contexto Electoral: ${dataset.name} (Escaños en juego: ${seats})
    Votación Registrada: ${targetVotes.toLocaleString()} (${((targetVotes/totalVotes)*100).toFixed(2)}% del total)
    Enfoque Especial: ${focus}
    Consulta Usuario: ${query}
    
    Usa Google Search para investigar:
    1. Coyuntura política actual del partido/candidato en la región.
    2. Alianzas recientes o rupturas.
    3. Temas que mueven la opinión pública localmente.
    
    Estructura del Informe (Markdown):
    ### RESUMEN EJECUTIVO
    > Insight clave.
    
    ### ANÁLISIS SWOT (DOFA)
    Genera una matriz detallada.
    
    --- SWOT START ---
    * STRENGTHS: ...
    * WEAKNESSES: ...
    * OPPORTUNITIES: ...
    * THREATS: ...
    --- SWOT END ---
    
    ### ECOSISTEMA NARRATIVO
    Temas clave mencionados en medios/redes.
    
    --- BARCHART START ---
    Seguridad | 80 | [Positivo]
    Corrupción | 60 | [Negativo]
    Empleo | 40 | [Neutro]
    --- BARCHART END ---
    
    ### INTELIGENCIA GEO-TÁCTICA
    Zonas clave mencionadas en noticias o históricamente fuertes.
    
    --- GEO START ---
    * Zona Norte | Alta | Bastión histórico.
    * Centro | Media | En disputa.
    --- GEO END ---
    
    ### RESPUESTA A CONSULTA ESTRATÉGICA
    Responde directamente a: "${query}" con datos y hechos.
    `;

    return await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }]
        }
    });
};

export const getGeospatialAnalysis = async (query: string, location: { latitude: number; longitude: number } | null): Promise<GenerateContentResponse> => {
    const prompt = `
    Eres un estratega electoral experto en geografía política.
    Pregunta del usuario: "${query}"
    
    ${location ? `Ubicación del usuario: Lat ${location.latitude}, Long ${location.longitude}` : 'Ubicación no provista, asume contexto general de la región mencionada en la pregunta o Colombia.'}
    
    Usa Google Maps para identificar lugares, barrios o zonas mencionadas.
    Usa Google Search para encontrar datos electorales recientes de esas zonas.
    
    Responde con un análisis detallado de las dinámicas territoriales.
    `;

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }, { googleMaps: {} }]
        }
    });
};

// 4. Advanced Simulations
export const getVoteTransferAnalysis = async (sourceParties: PartyData[], targetParties: PartyData[]): Promise<SankeyData> => {
    const prompt = `
    Analiza la transferencia de votos entre dos elecciones.
    Origen: ${sourceParties.map(p => `${p.name} (${p.votes})`).join(', ')}
    Destino: ${targetParties.map(p => `${p.name} (${p.votes})`).join(', ')}
    
    Genera un JSON para un diagrama de Sankey que explique cómo se movieron los votos.
    Asume transferencias lógicas basadas en ideología política colombiana y tendencias.
    
    Formato JSON:
    {
      "nodes": [ { "name": "Partido Origen" }, ... { "name": "Partido Destino" } ],
      "links": [ { "source": index, "target": index, "value": number }, ... ]
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    
    return JSON.parse(response.text || '{ "nodes": [], "links": [] }');
};

export const getOpenVsClosedListAnalysis = async (
    partyName: string, 
    history: any[], 
    metrics: any, 
    targetYear: number
): Promise<ListAnalysisAIResponse> => {
    const prompt = `
    Analiza si el partido "${partyName}" debe usar Lista Abierta o Cerrada para ${targetYear}.
    Historia: ${JSON.stringify(history)}
    Métricas Promedio: ${JSON.stringify(metrics)}
    
    Devuelve un JSON con la estructura ListAnalysisAIResponse definida.
    Incluye proyecciones numéricas (baseline, lowerBound, upperBound).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateMarketingStrategy = async (
    targetName: string, 
    targetType: 'candidate' | 'party', 
    context: string
): Promise<MarketingStrategyResult> => {
    const prompt = `
    Genera una estrategia de marketing político de GUERRA para ${targetName} (${targetType}).
    Contexto: ${context}
    
    Define:
    1. Perfil del Candidato (Narrativa).
    2. Base Electoral Calculada (Estimada).
    3. Pipeline de 3 fases (Extracción, Ejecución, Conversión).
    4. 2 Avatares de Votantes detallados.
    5. 2 Avatares de Candidato (Ángulos) que hacen match con los votantes.
    6. KPIs objetivos.
    
    Formato JSON estricto compatible con MarketingStrategyResult.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateTacticalCampaign = async (
    targetName: string, 
    voterProfile: string, 
    candidateAngle: string, 
    context: string
): Promise<TacticalCampaignResult> => {
    const prompt = `
    Genera una campaña táctica específica para conectar a ${targetName} con el perfil de votante "${voterProfile}" usando el ángulo "${candidateAngle}".
    Contexto: ${context}
    
    Incluye justificación técnica, foco geográfico (barrios/zonas), adaptación demográfica del discurso, slogans, posts de redes y mensajes de WhatsApp.
    
    Formato JSON compatible con TacticalCampaignResult.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateCronoposting = async (
    duration: string,
    startDate: string,
    goal: string,
    context: string,
    intensity: string,
    tone: string
): Promise<CronopostingResult> => {
    const prompt = `
    Genera un plan de contenidos (Cronoposting) detallado.
    Duración: ${duration}, Inicio: ${startDate}, Meta: ${goal}.
    Contexto: ${context}. Intensidad: ${intensity}. Tono: ${tone}.
    
    1. Simula 3 tendencias de social listening relevantes.
    2. Crea un calendario de publicaciones.
    
    Formato JSON compatible con CronopostingResult.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{}');
};

export const generateCandidateProfile = async (
    candidateName: string, 
    context: string, 
    history: any[]
): Promise<CandidateProfileResult> => {
    const prompt = `
    Genera un perfil de inteligencia política 360 para el candidato "${candidateName}".
    Contexto: ${context}
    Historial Votos (si existe): ${JSON.stringify(history)}
    
    Usa Google Search para encontrar:
    - Escándalos recientes.
    - Logros de gestión.
    - Posiciones ideológicas.
    - Opinión pública.
    
    Devuelve JSON con overview, opinionAnalysis, managementAnalysis, y simulationParameters (suelo, techo, volatilidad).
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: 'application/json',
            tools: [{ googleSearch: {} }] 
        }
    });
    // Note: When using tools with JSON response, sometimes the text is not purely JSON if the model explains.
    // However, Gemini 2.5/3 with responseMimeType usually returns clean JSON.
    // If googleSearch is used, response might contain grounding chunks but text should be JSON if enforced.
    // Wait, Google Search tool with responseMimeType JSON is allowed now? The guidelines say:
    // "Only tools: googleSearch is permitted. Do not use it with other tools. DO NOT set responseMimeType."
    // Ah, guidelines say DO NOT set responseMimeType if using googleSearch.
    // So I must remove responseMimeType and parse manually or ask for JSON in prompt text.
    
    // Correcting strategy for this function:
    const correctPrompt = `
    Genera un perfil de inteligencia política 360 para el candidato "${candidateName}".
    Contexto: ${context}
    Historial Votos: ${JSON.stringify(history)}
    
    Devuelve un JSON VÁLIDO (sin bloques de código markdown) con la siguiente estructura:
    {
      "overview": "...",
      "opinionAnalysis": "...",
      "managementAnalysis": "...",
      "simulationParameters": {
        "suggestedVoteBase": number,
        "suggestedVoteFloor": number,
        "suggestedVoteCeiling": number,
        "volatility": "Baja" | "Media" | "Alta",
        "growthTrend": "Positiva" | "Estable" | "Negativa"
      }
    }
    `;
    
    const correctResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: correctPrompt,
        config: { 
            tools: [{ googleSearch: {} }] 
        }
    });
    
    const text = correctResponse.text || '{}';
    // Clean markdown code blocks if present
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
};

export const generateCandidateComparison = async (candidates: string[], context: string): Promise<CandidateComparisonResult> => {
    const prompt = `
    Realiza una comparación "War Games" entre los candidatos: ${candidates.join(', ')}.
    Contexto: ${context}
    
    Simula 3 escenarios electorales y evalúa a cada candidato en 5 dimensiones (0-100).
    Calcula una base electoral probable para cada uno.
    
    Devuelve JSON VÁLIDO (sin markdown):
    {
      "listVerdict": "...",
      "partyMetrics": { "totalListVotes": 0, "candidateVotesSubtotal": 0, "logoVotes": 0, "logoPercentage": 0 },
      "candidates": [ { "name": "", "probabilityScore": 0, "calculatedBase": 0, "trajectory": "", "scandals": "", "image": "", "structure": "", "management": "", "territory": "", "alliances": "", "scoring": {...} } ],
      "scenarios": [ { "name": "", "description": "", "voteProjections": [{"candidateName": "", "votes": 0}], "swingVotes": 0, "winner": "" } ]
    }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            tools: [{ googleSearch: {} }] 
        }
    });
    
    const text = response.text || '{}';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
};
