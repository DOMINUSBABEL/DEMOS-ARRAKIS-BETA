import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData, ListAnalysisAIResponse, ProcessedElectionData, MarketingStrategyResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-3-pro-preview';

// --- CONTEXTO ESTRATÉGICO ESPECÍFICO (SOLO PARA ANTIOQUIA / CD) ---
const CD_ANTIOQUIA_METHODOLOGY = `
DATOS ESTRATÉGICOS INTERNOS (CENTRO DEMOCRÁTICO - ANTIOQUIA):
Utiliza EXCLUSIVAMENTE estos datos base para los siguientes precandidatos si son consultados EN EL CONTEXTO DE ANTIOQUIA.

METODOLOGÍA DE CÁLCULO (PROTOCOLOS INTERNOS):
1.  **Fuente de Datos:** Se toman los votos de la "Unidad Política" (estructura del candidato) en Cámara 2022, Senado 2022 y Asamblea 2023.
2.  **Factor Cabeza de Lista (K):** Si el candidato fue Cabeza de Lista (cerrada o preferente principal), su votación se divide por 2 (K=2). Si no, K=1.
3.  **Factor de Dispersión (A):** Los votos se dividen entre la cantidad de unidades políticas que apoyaron al candidato.
4.  **Resultado Final:** El "Poder Electoral Proyectado" es el PROMEDIO de los resultados ajustados de las tres elecciones: ((Cámara/K) + (Senado/K) + (Asamblea/K)) / 3.

TABLA MAESTRA DE DATOS (PRECANDIDATOS IDENTIFICADOS):
| Pre-candidato | Unidad Política | Promedio Proyectado (Resultado) |
|---|---|---|
| Juan Espinal | Paolos | 41.328 |
| Jhon Jairo Berrio | Valencia | 26.419 |
| (Equipo de todos) | Equipo de todos | 21.313 |
| Bello (esposa exalcalde)| Óscar Andrés | 18.296 |
| Yulieth Sánchez | Yulieth Sánchez | 18.296 |
| Andrés Guerra | Siembra | 29.348 |
| Ana Ligia | Hernán Cadavid | 19.812 |
| Óscar Darío Pérez | Óscar Darío Pérez | 28.900 |
| Anderson Duque | C. García / J.L. Noreña | 23.723 |
| Cabal | Cabalismo | 16.815 |
`;

const CSV_EXTRACTION_PROMPT_BASE = `
    Eres un asistente experto en extracción de datos electorales. Tu única tarea es convertir el contenido de un documento en una cadena de texto en formato CSV válida.

    REGLA CRÍTICA: Tu respuesta DEBE SER únicamente el contenido del CSV, sin explicaciones, introducciones, resúmenes, ni las vallas de código (''') al inicio o al final.
    
    Las columnas del CSV deben ser exactamente estas y en este orden:
    Eleccion,Año,UnidadPolitica,Candidato,Votos,EsCabezaDeLista,AlianzaHistoricaID,Departamento

    REGLA DE FORMATO CSV CRÍTICA: Si un valor en cualquier campo (especialmente 'UnidadPolitica' o 'Candidato') contiene una coma (,), DEBES encerrar todo el valor entre comillas dobles. Por ejemplo: "PARTIDO LIBERAL, ALIANZA VERDE".

    INSTRUCCIONES DETALLADAS DE EXTRACCIÓN:

    1.  **MAPEO DE COLUMNAS FUENTE:**
        *   'UnidadPolitica': Usa la columna llamada 'PARTIDO/MOVIMIENTO POLÍTICO' o similar.
        *   'Votos': Usa la columna numérica llamada 'TOTAL'. Ignora cualquier columna con votos escritos en letras (ej. 'VOTOS EN LETRAS').
        *   **IGNORA** columnas como 'CODIGO' o 'VOTOS EN LETRAS'. No las incluyas en el CSV.

    2.  **MANEJO DE CANDIDATOS Y VOTOS POR LOGO:**
        *   Si el documento **NO** lista candidatos individuales y solo muestra partidos (votación por lista cerrada o "voto por logo"), debes poner 'SOLO POR LA LISTA' en la columna 'Candidato' para CADA fila de partido.
        *   'EsCabezaDeLista': Pon 'TRUE' si el candidato es 'SOLO POR LA LISTA', de lo contrario, pon 'FALSE'.

    3.  **EXTRACCIÓN DE VOTOS NO VÁLIDOS:**
        *   Busca filas para 'VOTOS EN BLANCO' y 'VOTOS NULOS'. Si las encuentras, crea filas CSV separadas para cada una:
            *   Para VOTOS EN BLANCO: 'UnidadPolitica' = 'No Aplica', 'Candidato' = 'VOTOS EN BLANCO', 'Votos' = [número de votos].
            *   Para VOTOS NULOS: 'UnidadPolitica' = 'No Aplica', 'Candidato' = 'VOTOS NULOS', 'Votos' = [número de votos].
            *   El resto de las columnas pueden quedar vacías para estas filas.

    4.  **INFERENCIA DE DATOS GENERALES:**
        *   'Eleccion': Infiere el tipo de elección del título (ej. 'ASAMBLEA', 'SENADO', 'CÁMARA'). Si no se especifica, usa 'Desconocida'.
        *   'Año': Infiere el año de la elección. Si no se especifica, usa el año actual.
        *   'Departamento': Si el documento menciona un departamento (ej. "Antioquia", "Valle", "Cundinamarca"), extraelo. Si es Senado Nacional, pon "Nacional".
        *   'AlianzaHistoricaID': Déjalo vacío si no se especifica.

    5.  **INSTRUCCIONES PARA XLSX:**
        *   Mapea las columnas 'PARTIDO', 'CANDIDATO' y 'VOTOS' del XLSX a 'UnidadPolitica', 'Candidato' y 'Votos' del CSV.
        *   Si una fila en XLSX tiene 'PARTIDO' pero no 'CANDIDATO', considera los votos para 'SOLO POR LA LISTA'.

    Analiza el contenido completo y extrae todos los datos de partidos y candidatos que encuentres, aplicando estas reglas rigurosamente.
    `;


export const extractDataFromDocument = async (fileData: { mimeType: string; data: string }): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ 
          parts: [
            { text: CSV_EXTRACTION_PROMPT_BASE },
            { inlineData: { mimeType: fileData.mimeType, data: fileData.data } }
          ]
        }],
      });
      return response.text.replace(/```csv\n|```/g, '').trim();
    } catch (error) {
      console.error("Error calling Gemini API for document data extraction:", error);
      throw new Error("La IA no pudo procesar el documento. Revisa la consola.");
    }
}

export const extractDataFromText = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{
                parts: [
                    { text: CSV_EXTRACTION_PROMPT_BASE },
                    { text: "\nAquí está el texto extraído del documento para analizar:\n\n" + text }
                ]
            }]
        });
        return response.text.replace(/```csv\n|```/g, '').trim();
    } catch (error) {
        console.error("Error calling Gemini API for text data extraction:", error);
        throw new Error("La IA no pudo procesar el texto extraído. Revisa la consola.");
    }
};

export const getVoteTransferAnalysis = async (sourceParties: PartyData[], targetParties: PartyData[]): Promise<{ nodes: { name: string }[], links: { source: number, target: number, value: number }[] }> => {
    const prompt = `
    ROL: Analista de datos electorales experto en Colombia.
    TAREA: Estimar la transferencia de votos entre dos elecciones y generar los datos para un diagrama de Sankey.
    
    CONTEXTO:
    - Elección de Origen (Votos): ${JSON.stringify(sourceParties.map(p => ({ [p.name]: p.votes })))}
    - Elección de Destino (Votos): ${JSON.stringify(targetParties.map(p => ({ [p.name]: p.votes })))}
    - Total de votos en origen: ${sourceParties.reduce((sum, p) => sum + p.votes, 0)}
    - Total de votos en destino: ${targetParties.reduce((sum, p) => sum + p.votes, 0)}

    INSTRUSTRUCCIONES:
    1.  Analiza los partidos y sus resultados en ambas elecciones. Considera la afinidad ideológica, las trayectorias de los partidos y los movimientos políticos comunes en Colombia.
    2.  Estima cómo los votos de cada partido de la elección de origen se distribuyeron entre los partidos de la elección de destino.
    3.  Crea nodos para todos los partidos de origen y de destino. También puedes incluir nodos como 'Nuevos Votantes' o 'Abstención' si lo consideras necesario para que los totales cuadren de forma realista.
    4.  Crea los enlaces (links) que representen el flujo de votos. El 'value' de cada link debe ser el número estimado de votos transferidos.
    5.  La suma de los valores de los links que salen de un nodo de origen debe ser igual a los votos totales de ese partido en la elección de origen.
    6.  La suma de los valores de los links que llegan a un nodo de destino debe aproximarse a los votos totales de ese partido en la elección de destino.

    FORMATO DE SALIDA REQUERIDO:
    Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura, sin explicaciones ni texto adicional.
    {
      "nodes": [ { "name": "Nombre Partido 1" }, { "name": "Nombre Partido 2" }, ... ],
      "links": [ { "source": 0, "target": 1, "value": 15000 }, ... ]
    }
    Donde 'source' y 'target' son los ÍNDICES de los nodos en el array "nodes".
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (result && Array.isArray(result.nodes) && Array.isArray(result.links)) {
            const nodeCount = result.nodes.length;
            for (const link of result.links) {
                if (typeof link.source !== 'number' || typeof link.target !== 'number' || typeof link.value !== 'number' ||
                    link.source < 0 || link.source >= nodeCount ||
                    link.target < 0 || link.target >= nodeCount) {
                    console.error('Invalid link found in Gemini response:', link);
                    throw new Error(`La respuesta de la IA contiene un enlace inválido con índices fuera de rango.`);
                }
            }
            return result;
        }
        throw new Error("La respuesta de la IA no tiene el formato de Sankey esperado.");

    } catch (error) {
        console.error("Error llamando a Gemini para análisis de transferencia de votos:", error);
        throw new Error("No se pudo generar el análisis de transferencia de votos.");
    }
};

const getBaseRankingAnalysisPrompt = (baseRanking: CandidateRanking[], partyFilter?: string): string => `
  ROL: Analista de Datos Políticos Senior.
  AUDIENCIA: Comité Estratégico de Campaña.
  TAREA: Realizar un análisis técnico del Ranking de Poder Electoral Base.
  FORMATO: Texto simple, estructurado, sin markdown. Utiliza títulos claros.
  INSTRUCCIÓN ADICIONAL: Utiliza la búsqueda de Google para encontrar noticias recientes o análisis sobre el contexto político actual que puedan afectar la interpretación de estos datos. Incorpora estos hallazgos en tu análisis.

  DATOS:
  - Ranking de Poder Electoral Base (Top 20)
  ${partyFilter ? `- FILTRADO POR: ${partyFilter}` : ''}
  ${JSON.stringify(baseRanking.slice(0, 20), null, 2)}

  INFORME REQUERIDO:

  TÍTULO: Análisis Cuantitativo del Poder Electoral Base

  1. RESUMEN EJECUTIVO
  Breve descripción del panorama de fuerzas. Identifica la concentración o dispersión del poder electoral según los datos.

  2. ANÁLISIS DE CUANTILES
  - Líderes (Percentil 90+): Identifica a los candidatos que se encuentran en el decil superior. Cuantifica su ventaja promedio sobre la media.
  - Competidores Medios (Percentil 50-90): Describe el clúster principal de competencia. ¿Qué tan densa es esta franja?
  - Candidatos de Nicho (Bajo Percentil 50): Evalúa la situación de los candidatos en la mitad inferior del ranking.

  3. CLÚSTERES DE COMPETENCIA
  Identifica 2-3 grupos de candidatos con poder electoral similar (ej. clúster de 15k-20k votos). Describe la intensidad competitiva dentro de estos clústeres.

  4. CONCLUSIÓN ESTRATÉGICA
  Basado estrictamente en los datos, proporciona una recomendación inicial sobre dónde enfocar los recursos de campaña.
`;

const getSimulationAnalysisPrompt = (baseRanking: CandidateRanking[], simulationResults: SimulationResults): string => `
  ROL: Analista de Datos Políticos Senior.
  AUDIENCIA: Comité Estratégico de Campaña.
  TAREA: Realizar un análisis técnico y objetivo de los resultados de una simulación electoral.
  INSTRUCCIÓN ADICIONAL: Si es relevante, utiliza la búsqueda de Google para encontrar información contextual reciente que pueda afectar la interpretación de estas probabilidades (ej. un escándalo de un candidato, una nueva alianza, etc.).
  FORMATO: Texto simple, estructurado, sin markdown. Utiliza títulos claros.

  DATOS:
  - Ranking Base (Top 10): ${JSON.stringify(baseRanking.slice(0, 10).map(r => ({ C: r.candidato, PEB: r.poderElectoralBase })), null, 2)}
  - Probabilidades de Curul (Top 15): ${JSON.stringify(simulationResults.probabilities.slice(0, 15).map(p => ({ C: p.candidato, Prob: p.probabilidad_curul.toFixed(1) + '%' })), null, 2)}
  - Impacto de Fragmentación (Top 10): ${JSON.stringify(simulationResults.fragmentedRanking.slice(0, 10).map(r => ({ C: r.candidato, PEB_Frag: r.poderElectoralBase })), null, 2)}
  
  INFORME REQUERIDO:

  TÍTULO: Informe Técnico de Simulación Electoral

  1. DIAGNÓSTICO DE PROBABILIDADES
  Análisis de la distribución de probabilidades.
  - Zona de Certeza (Prob > 80%): Lista de candidatos con alta probabilidad de elección.
  - Zona de Incertidumbre (Prob 30-80%): Identifica el grupo de candidatos cuya elección es sensible a la estrategia de campaña y a la movilización.
  - Zona de Baja Probabilidad (Prob < 30%): Evalúa el estado de los candidatos con menor probabilidad. ¿Es su posición recuperable?

  2. ANÁLISIS DE SENSIBILIDAD
  - Impacto de la Fragmentación: Cuantifica la caída en el poder electoral para la unidad política afectada. Compara el ranking pre y post fragmentación.
  - Efecto de Factores Externos: Evalúa el cambio porcentual en el poder electoral debido a los factores aplicados.

  3. RECOMENDACIONES BASADAS EN DATOS
  - Optimización de Recursos: ¿En qué candidatos (de la zona de incertidumbre) debería invertirse más para maximizar el retorno en curules?
  - Alerta de Riesgos: ¿Qué candidato(s) sobreestimado(s) en el ranking base muestra(n) una baja probabilidad real? Advierte sobre este riesgo.
`;

export const getOpenVsClosedListAnalysis = async (partyName: string, historicalData: any[], summary: any, targetYear: number): Promise<ListAnalysisAIResponse> => {
    const schema = {
        type: Type.OBJECT,
        properties: {
            projections: {
                type: Type.OBJECT,
                properties: {
                    openList: { type: Type.OBJECT, nullable: true, properties: { baseline: { type: Type.NUMBER, nullable: true }, lowerBound: { type: Type.NUMBER, nullable: true }, upperBound: { type: Type.NUMBER, nullable: true } } },
                    closedList: { type: Type.OBJECT, nullable: true, properties: { baseline: { type: Type.NUMBER, nullable: true }, lowerBound: { type: Type.NUMBER, nullable: true }, upperBound: { type: Type.NUMBER, nullable: true } } }
                }
            },
            strategicRecommendation: { type: Type.STRING, enum: ['Abierta', 'Cerrada', 'Depende del Contexto'] },
            analysis: {
                type: Type.OBJECT,
                properties: {
                    voteProfile: { type: Type.STRING, enum: ['Elástico', 'Inelástico', 'Mixto'], description: 'Diagnóstico del perfil de voto predominante del partido.' },
                    prosOpen: { type: Type.STRING, description: 'Ventajas de la lista abierta para este partido.' },
                    consOpen: { type: Type.STRING, description: 'Desventajas de la lista abierta para este partido.' },
                    prosClosed: { type: Type.STRING, description: 'Ventajas de la lista cerrada para este partido.' },
                    consClosed: { type: Type.STRING, description: 'Desventajas de la lista cerrada para este partido.' },
                    finalVerdict: { type: Type.STRING, description: 'Conclusión y resumen del análisis estratégico.' }
                },
                required: ['voteProfile', 'prosOpen', 'consOpen', 'prosClosed', 'consClosed', 'finalVerdict']
            }
        },
        required: ['projections', 'strategicRecommendation', 'analysis']
    };

    const prompt = `
    ROL: Eres un experto estratega político y analista de datos cuantitativos colombiano.
    TAREA: Analizar el perfil de votación de un partido y recomendar el tipo de lista (abierta o cerrada) para ${targetYear}, basándote en un análisis estratégico profundo y una metodología de cálculo específica.

    CONCEPTOS ESTRATÉGICOS CLAVE:
    1.  **Voto Inelástico (Estructural):** Voto leal, ligado a líderes específicos, maquinarias, o estructuras políticas. Es un voto "duro". Una alta "voteConcentration" (desviación estándar de votos de candidatos) sugiere una alta dependencia de pocas figuras, indicando un perfil de voto más inelástico.
    2.  **Voto Elástico (De Opinión):** Voto más volátil, basado en la marca del partido, la coyuntura política o la opinión pública. Es un voto "blando" que se debe disputar en cada elección. Un buen rendimiento en listas cerradas sugiere una marca fuerte y un perfil de voto más elástico.

    ANÁLISIS DE TIPOS DE LISTA:
    -   **Lista Abierta:** BENEFICIA a partidos con voto INELÁSTICO. PERMITE que cada líder explote su caudal electoral. RIESGO: "Canibalización" (competencia interna destructiva) y desincentivo de candidatos con pocas opciones que no trabajan por la lista.
    -   **Lista Cerrada:** BENEFICIA a partidos con voto ELÁSTICO. CONSOLIDA la marca y optimiza recursos. INCENTIVA el esfuerzo colectivo. RIESGO: Desincentiva a las estructuras de líderes que no ocupan los primeros lugares.

    METODOLOGÍA DE CÁLCULO PARA PROYECCIONES:
    Para tus proyecciones cuantitativas, sigue este proceso de tres pasos, con el objetivo de lograr una proyección de lista abierta cercana a 464k y una de lista cerrada superior a 500k para un partido de referencia.

    PASO 1: ESTABLECER EL BASELINE ELECTORAL PARA 2026
    1.  Analiza la tendencia del rendimiento histórico del partido en listas abiertas.
    2.  Proyecta un baseline de votación para 2026. Este puede ser el promedio histórico o un valor ajustado si observas una clara tendencia de crecimiento. Para un partido con un promedio histórico de ~450k, una proyección optimista-realista para 2026, considerando el contexto político, podría ser de **~464,000 votos**. Este será tu punto de partida.

    PASO 2: CÁLCULO DE PROYECCIÓN PARA LISTA ABIERTA
    1.  **Proyección Final:** La proyección de lista abierta es directamente tu baseline calculado en el paso 1 (~464,000 votos). Se asume que los "desincentivos" de la competencia interna y la fuga de esfuerzo ya están implícitos en los resultados históricos, por lo que la tendencia ya los refleja. Simplemente establece el baseline, el límite inferior y el superior basados en este número.

    PASO 3: CÁLCULO DE PROYECCIÓN PARA LISTA CERRADA
    1.  **Baseline:** Comienza con la misma proyección de ~464,000 votos del paso 1.
    2.  **Añadir "Incentivo 1 - Recuperación de Votos":** Una lista cerrada simplifica la votación. Estima una recuperación de votos nulos y en blanco. Asume que se puede capturar un **25% de los votos nulos** y un **10% de los votos en blanco** promedio de los datos históricos proporcionados. Si el promedio de votos nulos es ~125k y de blancos ~260k, esto representa una ganancia de \`(0.25 * 125000) + (0.10 * 260000) = 31,250 + 26,000 = ~57,000\` votos.
    3.  **Añadir "Incentivo 2 - Sinergia de Esfuerzo Colectivo":** La lista cerrada elimina la "canibalización" interna. Cuantifica este efecto como un aumento adicional del **2.5% sobre el baseline**. Por ejemplo: \`0.025 * 464,000 = ~11,600\` votos.
    4.  **Cálculo Final Lista Cerrada:** Suma todos los componentes para obtener la proyección final. Ejemplo: \`464,000 (Baseline) + 57,000 (Recuperación) + 11,600 (Sinergia) = ~532,600 votos\`. Este resultado debe ser superior a 500k.

    DATOS DEL PARTIDO: ${partyName}
    1.  **Rendimiento Histórico Detallado (incluye votos nulos/blancos del certamen):** ${JSON.stringify(historicalData, null, 2)}
    2.  **Métricas Resumen:** ${JSON.stringify(summary, null, 2)}

    INSTRUCCIONES DE ANÁLISIS Y GENERACIÓN DE JSON:
    1.  **Diagnóstico del Perfil de Voto ('voteProfile'):** Basado en los datos y los conceptos estratégicos, clasifica el perfil de voto predominante del partido como 'Inelástico', 'Elástico' o 'Mixto'.
    2.  **Proyecciones Cuantitativas ('projections'):**
        *   Aplica la METODOLOGÍA DE CÁLCULO descrita anteriormente para estimar los votos base para ${targetYear} para 'openList' y 'closedList'.
        *   Calcula un intervalo de confianza del 5% para cada proyección (límites inferior y superior -2.5% y +2.5% del base).
        *   **INSTRUCCIÓN AGÉNTICA CRÍTICA:** Si no existen datos históricos para un tipo de lista, DEBES actuar como un agente experto y generar una proyección HIPOTÉTICA siguiendo la metodología y tu conocimiento del contexto político colombiano.
    3.  **Análisis Estratégico y Veredicto ('analysis' y 'strategicRecommendation'):**
        *   Resume las ventajas y desventajas de cada tipo de lista PARA ESTE PARTIDO específico.
        *   Proporciona un veredicto final que justifique tu recomendación ('Abierta', 'Cerrada' o 'Depende del Contexto').

    FORMATO DE SALIDA REQUERIDO: Responde ÚNICAMENTE con un objeto JSON válido que siga el esquema proporcionado.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (result && result.projections && result.analysis && result.strategicRecommendation) {
            const projections = result.projections;
            if (projections.openList && projections.openList.baseline !== null) {
                projections.openList.baseline = Math.round(projections.openList.baseline);
                projections.openList.lowerBound = Math.round(projections.openList.lowerBound);
                projections.openList.upperBound = Math.round(projections.openList.upperBound);
            }
             if (projections.closedList && projections.closedList.baseline !== null) {
                projections.closedList.baseline = Math.round(projections.closedList.baseline);
                projections.closedList.lowerBound = Math.round(projections.closedList.lowerBound);
                projections.closedList.upperBound = Math.round(projections.closedList.upperBound);
            }
            return result as ListAnalysisAIResponse;
        }
        throw new Error("La respuesta de la IA no tiene el formato JSON estructurado esperado.");

    } catch (error) {
        console.error("Error llamando a Gemini para análisis de tipo de lista:", error);
        throw new Error("No se pudo generar el análisis estratégico de tipo de lista.");
    }
};

export const getGeospatialAnalysis = async (
    prompt: string,
    location: { latitude: number; longitude: number; } | null
): Promise<GenerateContentResponse> => {
    try {
        const config: any = {
            tools: [{ googleMaps: {} }, { googleSearch: {} }],
        };
        if (location) {
            config.toolConfig = {
                retrievalConfig: {
                    latLng: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                }
            };
        }

        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: config,
        });

        return response;
    } catch (error) {
        console.error("Error calling Gemini API for geospatial analysis:", error);
        throw new Error("La IA no pudo procesar la consulta geoespacial.");
    }
};


export const classifyPartiesIdeology = async (partyNames: string[]): Promise<Record<string, string>> => {
    const prompt = `
      Rol: Eres un experto politólogo colombiano.
      Tarea: Clasifica los siguientes partidos o movimientos políticos de Colombia en un espectro ideológico.
      Categorías Permitidas: 'Izquierda', 'Centro-Izquierda', 'Centro', 'Centro-Derecha', 'Derecha', 'Atrapa-todo', 'Regionalista', 'Religioso', 'Otro'.
      Formato de Salida: Responde únicamente con un objeto JSON válido. Las claves deben ser los nombres de los partidos y los valores deben ser una de las categorías permitidas.
      
      Partidos a clasificar:
      ${partyNames.join(', ')}
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
            }
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Ensure result is in the expected format
        if (typeof result === 'object' && result !== null && !Array.isArray(result)) {
            return result as Record<string, string>;
        }
        throw new Error("La respuesta de la IA no es un objeto JSON válido.");

    } catch (error) {
        console.error("Error llamando a Gemini para clasificación ideológica:", error);
        throw new Error("No se pudo clasificar la ideología de los partidos.");
    }
};

const aggregateVotesByLocation = (data: ProcessedElectionData[], candidateName?: string, partyName?: string): string => {
    const locations = new Map<string, number>();
    
    // Check if we should use Department or Municipality aggregation based on available data
    const hasMunicipality = data.some(row => row.Municipio && row.Municipio.trim() !== '');
    const hasDepartment = data.some(row => row.Departamento && row.Departamento.trim() !== '');
    
    // For National elections (Senate), Department is usually more relevant for the top-level view unless specified otherwise
    const isNationalContext = data.length > 0 && (data[0].Eleccion.toLowerCase().includes('senado') || data[0].Eleccion.toLowerCase().includes('nacional'));
    const useDepartment = isNationalContext && hasDepartment;

    data.forEach(row => {
        let shouldCount = false;
        if (candidateName && row.Candidato.toUpperCase().includes(candidateName.toUpperCase())) {
            shouldCount = true;
        } else if (!candidateName && partyName && row.UnidadPolitica.toUpperCase() === partyName.toUpperCase()) {
            shouldCount = true;
        }

        if (shouldCount) {
            let locationName = 'Desconocido';
            if (useDepartment) {
                locationName = row.Departamento || 'Desconocido';
            } else {
                locationName = row.Municipio || row.Zona || row.Comuna || row.Departamento || 'Desconocido';
            }

            if (locationName && locationName !== 'Desconocido') {
                locations.set(locationName, (locations.get(locationName) || 0) + row.Votos);
            }
        }
    });

    if (locations.size === 0) return "No hay datos geográficos detallados disponibles en el set de datos.";

    // Sort by votes descending
    const sortedLocations = Array.from(locations.entries()).sort((a, b) => b[1] - a[1]);
    
    // Take top 20
    return JSON.stringify(sortedLocations.slice(0, 20).map(([loc, votes]) => ({ location: loc, votes })), null, 2);
};

export const generateStrategicReport = async (
    activeDataset: HistoricalDataset,
    partyAnalysis: Map<string, PartyAnalysisData>,
    targetParty: string,
    seatsToContest: number,
    focus?: string,
    query?: string,
): Promise<GenerateContentResponse> => {
    const historicalDataForPrompt = JSON.stringify(Array.from(partyAnalysis.values()).map(p => ({
        party: p.name,
        history: p.history.map(h => ({ election: h.datasetName, votes: h.votes }))
    })), null, 2);

    const activeDataForPrompt = JSON.stringify(activeDataset.partyData, null, 2);
    
    // Attempt to aggregate geographical data if fields exist
    const geoData = aggregateVotesByLocation(activeDataset.processedData, focus, targetParty);

    // --- CONTEXT DETECTION ---
    const datasetNameLower = activeDataset.name.toLowerCase();
    const isAntioquia = datasetNameLower.includes('antioquia') || 
                        activeDataset.processedData.some(r => r.Departamento?.toLowerCase().includes('antioquia') || r.Eleccion?.toLowerCase().includes('antioquia'));
    const isSenado = datasetNameLower.includes('senado') || activeDataset.processedData[0]?.Eleccion?.toLowerCase().includes('senado');
    const isCamara = datasetNameLower.includes('cámara') || datasetNameLower.includes('camara') || activeDataset.processedData[0]?.Eleccion?.toLowerCase().includes('camara');
    
    const scopeDescription = isSenado ? "NACIONAL (SENADO)" : (isAntioquia ? "DEPARTAMENTAL (ANTIOQUIA)" : `REGIONAL/DEPARTAMENTAL (${activeDataset.name})`);
    
    // Only apply the CD methodology if it's Antioquia AND Centro Democrático
    const isCD = targetParty.toLowerCase().includes('centro democrático') || targetParty.toLowerCase().includes('centro democratico') || targetParty.toLowerCase().includes('creemos'); // Extended slightly for coalition context
    const methodologyContext = (isAntioquia && isCD) ? CD_ANTIOQUIA_METHODOLOGY : "";

    let prompt = '';

    if (focus && focus.trim() !== '') {
        // Candidate-focused prompt
        prompt = `
    ROL: Eres un estratega político de élite y analista de datos. Tu cliente es el comando de campaña del candidato "${focus}" del partido "${targetParty}".
    ALCANCE DE LA ELECCIÓN: ${scopeDescription}.
    
    ${methodologyContext}

    INSTRUCCIÓN CRÍTICA: Debes generar un **INFORME ESTRATÉGICO EXTENSO Y PROFUNDO**. No seas superficial.
    Debes usar Google Search para obtener el contexto más reciente: noticias, perfil público, declaraciones, historial político y percepción pública del candidato "${focus}".
    Si la elección es al SENADO (Nacional), tu análisis debe considerar el impacto nacional y las regiones clave, no solo un departamento.

    DATOS DE CONTEXTO:
    - Elección de Referencia: ${activeDataset.name}
    - Partido: ${targetParty}
    - Escaños en Disputa: ${seatsToContest}
    - Datos Históricos Agregados: ${historicalDataForPrompt}
    - Datos Geográficos (Top Ubicaciones en Dataset): ${geoData}
    ${query ? `- PREGUNTA ESTRATÉGICA ADICIONAL: "${query}"` : ''}

    FORMATO DE SALIDA REQUERIDO:
    Respuesta en Markdown. USA TÍTULOS CLAROS.

    ESTRUCTURA DEL INFORME (DEBE CUBRIR TODOS LOS PUNTOS CON DETALLE):

    **Informe Estratégico de Candidato: ${focus}**
    **Fecha:** ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}

    **1. Pronóstico Electoral y Perfil (Ejecutivo)**
    - INICIO OBLIGATORIO: Tu primera frase DEBE SER un pronóstico claro del rango de votación estimada (Ej: "Se proyecta una votación estimada entre [X] y [Y] votos...").
    - Si aplica la "TABLA MAESTRA DE DATOS" (Solo CD/Antioquia), usa esos datos como base. Si no, usa la tendencia histórica y proyecciones racionales para ${scopeDescription}.
    - Resumen ejecutivo del perfil del candidato basado en tu búsqueda. Incluye trayectoria, ideología percibida, público objetivo y posicionamiento actual.

    **2. Análisis SWOT Visual**
    - Proporciona un análisis SWOT conciso.

    --- SWOT START ---
    STRENGTHS:
    - [Punto Fuerte 1]
    WEAKNESSES:
    - [Punto Débil 1]
    OPPORTUNITIES:
    - [Oportunidad 1]
    THREATS:
    - [Amenaza 1]
    --- SWOT END ---

    **3. Ecosistema Narrativo del Candidato**
    - Describe los temas principales.

    --- BARCHART START ---
    # Tema | Relevancia (1-100) | Sentimiento (Positivo/Neutro/Negativo)
    - [Tema 1] | [85] | [Positivo]
    --- BARCHART END ---

    **4. Proyecciones Cuantitativas Detalladas**
    - Análisis de proyecciones de votos.

    --- TABLE START: Proyecciones de Votos para ${focus} ---
    | Escenario | Votos Proyectados | Probabilidad de Éxito | Supuestos Clave |
    |---|---|---|---|
    | Pesimista | [Número] | [Baja/Media/Alta] | [Supuesto clave] |
    | Realista | [Número] | [Baja/Media/Alta] | [Supuesto clave] |
    | Optimista | [Número] | [Baja/Media/Alta] | [Supuesto clave] |
    --- TABLE END ---
    
    **5. Geografía Electoral (Estimación de Bastiones)**
    - Identifica los municipios o departamentos donde se concentra el voto.
    - SI SE PROVEYERON DATOS GEOGRÁFICOS EN EL CONTEXTO, ÚSALOS.
    
    --- GEO START ---
    # Ubicación | Intensidad (Alta/Media/Baja) | Notas Estratégicas
    - [Ubicación] | [Alta] | [Razón]
    --- GEO END ---

    **6. Perfil Psicográfico y Avatar del Votante (Targeting)**
    - Construye un "Avatar" detallado del votante probable de ${focus}.
    - **Edad y Género:** ¿Quién es el núcleo duro?
    - **Dolores y Necesidades:** ¿Qué le preocupa a este votante?
    - **Consumo de Medios:** ¿Dónde se informa?
    - **Valores:** ¿Qué busca en un líder?

    **7. Análisis de Elasticidad y Captura de Voto Blando**
    - ¿Qué tan elástico es el voto potencial de ${focus}?
    - Estrategias específicas para convertir a los indecisos y capturar voto de opinión.
    - Mensajes clave para expandir la base más allá del núcleo duro.

    **8. Matriz de Rivalidades y Canibalización**
    - **Amenazas Internas:** Identifica compañeros de lista que compiten por el mismo perfil de votante o zona geográfica.
    - **Amenazas Externas:** Candidatos de otros partidos con propuestas similares.
    - **Riesgo de Canibalización:** Evaluación del riesgo de dividir votos y tácticas para diferenciarse.

    **9. Recomendaciones Estratégicas Accionables**
    - Basado en TODO el análisis anterior, proporciona 3 a 5 recomendaciones claras y tácticas.
    `;
    } else {
        // Party-focused prompt
        prompt = `
    ROL: Eres un estratega político de élite y analista de datos cuantitativos. Tu cliente es el comando de campaña del "${targetParty}".
    ALCANCE DE LA ELECCIÓN: ${scopeDescription}.
    TAREA: Genera un **INFORME ESTRATÉGICO EXTENSO Y DE ALTO NIVEL** (Expandido un 200% respecto a análisis básicos) para la próxima elección (${activeDataset.name}), donde se disputan ${seatsToContest} curules.
    
    ${methodologyContext}

    INSTRUCCIÓN CRÍTICA: Debes usar la búsqueda de Google para obtener el contexto más reciente sobre el panorama político, noticias sobre "${targetParty}" y sus competidores. Integra esta información en tu análisis.
    
    ${focus ? `ENFOQUE ADICIONAL: Concéntrate particularmente en el siguiente tema o candidato: "${focus}".` : ''}
    ${query ? `PREGUNTA ESTRATÉGICA A RESPONDER: "${query}".` : ''}
    
    CONTEXTO Y DATOS:
    1.  **Datos de la Elección de Referencia (${activeDataset.name}):**
        ${activeDataForPrompt}
    
    2.  **Datos Históricos Agregados:**
        ${historicalDataForPrompt}
        
    3.  **Datos Geográficos (Top Ubicaciones en Dataset):** 
        ${geoData}

    FORMATO DE SALIDA REQUERIDO:
    Tu respuesta DEBE ser texto plano con formato similar a Markdown. USA TÍTULOS CLAROS Y SECCIONES BIEN DEFINIDAS.

    ESTRUCTURA DEL INFORME (sigue este orden rigurosamente y PROFUNDIZA en cada punto):
    
    **Fecha:** ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
    **Resumen Ejecutivo:**
    - INICIO OBLIGATORIO: Tu primer párrafo DEBE incluir el "Pronóstico de Votación Total Estimada" para el partido en el ámbito ${scopeDescription}.
    - Diagnóstico del nuevo paradigma electoral con ${seatsToContest} curules.
    - Conclusión estratégica central.
    
    **Sección 1: El Nuevo Paradigma Electoral: Análisis Técnico de un Escenario de ${seatsToContest} Curules**
    - 1.1. La Mecánica D'Hondt en un Entorno de Alta Competencia.
    - 1.2. Umbral Efectivo y Cifra Repartidora Estimada.
    
    **Sección 2: Diagnóstico Profundo de la Línea Base**
    - 2.1. Análisis Longitudinal de las Fuerzas Políticas: Analiza la evolución del "${targetParty}" frente a sus rivales.
    - 2.2. Tendencias de Crecimiento/Decrecimiento Histórico.
    
    **Sección 3: Geografía Electoral y Bastiones**
    - 3.1. Mapa de Calor: Identifica las zonas fuertes del partido basándote en los datos geográficos suministrados. Si es SENADO, enfócate en Departamentos clave; si es CÁMARA/ASAMBLEA, en Municipios/Zonas.
    - Genera la estructura GEO:
    --- GEO START ---
    # Ubicación | Intensidad (Alta/Media/Baja) | Notas Estratégicas
    - [Ubicación] | [Alta] | [Análisis detallado de por qué es fuerte/débil aquí]
    --- GEO END ---
    
    **Sección 4: El Campo de Batalla Central**
    - 4.1. Perfil del Votante del Competidor Principal.
    - 4.2. Vulnerabilidades Estratégicas de los Rivales.
    
    **Sección 5: Avatar del Votante (Buyer Persona Político)**
    - **El Votante Base (Inelástico):** Describe demografía, valores y motivaciones del núcleo leal del partido.
    - **El Votante Persuadible (Elástico):** Describe al votante indeciso o blando que podría ser capturado. ¿Qué le duele? ¿Qué espera?
    
    **Sección 6: Estrategias de Optimización del Voto Elástico**
    - Tácticas específicas para ampliar el techo electoral.
    - Mensajes clave para resonar con el votante elástico sin alienar a la base.
    - Canales recomendados para alcanzar estos segmentos.
    
    **Sección 7: Dinámica de Canibalización y Fuga de Votos**
    - **Riesgo de Canibalización Interna:** (Especialmente relevante si hay múltiples listas o candidatos fuertes). ¿Cómo evitar que los candidatos del mismo partido se quiten votos entre sí en lugar de traer nuevos?
    - **Fuga hacia Rivales:** ¿Hacia qué partidos se están yendo los votos perdidos? Análisis de flujo.
    
    **Sección 8: Proyecciones Cuantitativas para una Batalla a Dos Bandas**
    - 8.1. Escenario 1: Estabilidad Competitiva (Tendencial)
    - 8.2. Escenario 2: Oportunidad por Desgaste del Adversario
    
    **Sección 9: Tablas de Proyección y Análisis de Sensibilidad**
    - Incluye al menos 3 de las siguientes tablas.
    - Tabla 9.1: Análisis de Sensibilidad del "${targetParty}".
      --- TABLE START: Análisis de Sensibilidad ---
      | Votación Proyectada | Curules Probables | Análisis Táctico |
      |---|---|---|
      | [Votos] | [N] | [Análisis] |
      ...
      --- TABLE END ---
    - Tabla 9.2: Análisis de Costo Marginal por Curul.
      --- TABLE START: Costo Marginal por Curul ---
      | Curul Objetivo | Votos Totales Requeridos | Votos Adicionales (Costo Marginal) | Análisis Estratégico del Costo-Beneficio |
      |---|---|---|---|
      ...
      --- TABLE END ---
    - Tabla 9.3: Índice de Eficiencia Electoral (Votos por Curul).
      --- TABLE START: Eficiencia Electoral ---
      | Partido | Votos Proyectados | Curules Obtenidas | Votos por Curul | Análisis |
      |---|---|---|---|---|
      ...
      --- TABLE END ---
    `;
    }
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                tools: [{googleSearch: {}}]
            }
        });
        return response;
    } catch (error) {
        console.error("Error llamando a Gemini para generar informe estratégico:", error);
        throw new Error("No se pudo generar el informe estratégico.");
    }
};



export type AnalysisType = 
    | { type: 'base_ranking'; data: CandidateRanking[]; partyFilter?: string; }
    | { type: 'simulation'; data: { baseRanking: CandidateRanking[], results: SimulationResults }};

export const getAIAnalysis = async (analysisType: AnalysisType): Promise<GenerateContentResponse> => {
  let prompt = '';
  switch (analysisType.type) {
    case 'base_ranking':
        prompt = getBaseRankingAnalysisPrompt(analysisType.data, analysisType.partyFilter);
        break;
    case 'simulation':
        prompt = getSimulationAnalysisPrompt(analysisType.data.baseRanking, analysisType.data.results);
        break;
    default:
        throw new Error("Tipo de análisis no válido");
  }

  try {
    const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          tools: [{googleSearch: {}}],
        },
    });
    return response;
  } catch (error) {
    console.error("Error llamando a la API de Gemini:", error);
    throw new Error(`TÍTULO: Error de Conexión\n\nOcurrió un error al generar el análisis de IA. Por favor, revisa la consola para más detalles.`);
  }
};

export const generateMarketingStrategy = async (
    targetName: string,
    targetType: 'candidate' | 'party',
    context: string
): Promise<MarketingStrategyResult> => {
    const prompt = `
    ROL: Estratega Senior de Marketing Político experto en captura de voto elástico y de opinión.
    OBJETIVO: Crear un plan de marketing de "guerra" para optimizar el voto blando/elástico e incrementar las probabilidades de éxito electoral (más curules o ganar la elección).
    
    CLIENTE: ${targetType === 'candidate' ? 'Candidato' : 'Partido'} "${targetName}".
    CONTEXTO: ${context}

    INSTRUCCIÓN: Genera una estrategia detallada y accionable. No des consejos genéricos. Enfócate en CÓMO persuadir al indeciso.
    
    FORMATO DE RESPUESTA: JSON Estricto.

    STRUCTURE DEL JSON:
    {
        "candidateProfile": "Resumen ejecutivo de la marca política actual (Arquetipo, Tono, Posicionamiento percibido).",
        "elasticVoterPersona": {
            "demographics": "Edad, género, ubicación clave.",
            "interests": ["Interés 1", "Interés 2", ...],
            "painPoints": ["Dolor 1 (Miedo/Frustración)", "Dolor 2", ...],
            "mediaHabits": ["Canal 1", "Canal 2", ...]
        },
        "campaignPillars": {
            "rational": ["Propuesta lógica 1", "Propuesta lógica 2"],
            "emotional": ["Narrativa emocional 1", "Narrativa emocional 2"],
            "slogans": ["Slogan principal pegajoso", "Slogan secundario"]
        },
        "tactics": {
            "digital": ["Táctica redes 1 (ej: TikTok challenge)", "Táctica ads 2", ...],
            "territory": ["Táctica tierra 1 (ej: Activación BTL)", "Táctica tierra 2", ...]
        },
        "kpis": [
            { "metric": "Nombre Métrica", "target": "Objetivo numérico/cualitativo" },
            { "metric": "Nombre Métrica", "target": "Objetivo numérico/cualitativo" }
        ]
    }
    `;

    const schema = {
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
                }
            },
            campaignPillars: {
                type: Type.OBJECT,
                properties: {
                    rational: { type: Type.ARRAY, items: { type: Type.STRING } },
                    emotional: { type: Type.ARRAY, items: { type: Type.STRING } },
                    slogans: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            tactics: {
                type: Type.OBJECT,
                properties: {
                    digital: { type: Type.ARRAY, items: { type: Type.STRING } },
                    territory: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            },
            kpis: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        metric: { type: Type.STRING },
                        target: { type: Type.STRING }
                    }
                }
            }
        },
        required: ['candidateProfile', 'elasticVoterPersona', 'campaignPillars', 'tactics', 'kpis']
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as MarketingStrategyResult;
    } catch (error) {
        console.error("Error generating marketing strategy:", error);
        throw new Error("No se pudo generar la estrategia de marketing. Intenta de nuevo.");
    }
};
