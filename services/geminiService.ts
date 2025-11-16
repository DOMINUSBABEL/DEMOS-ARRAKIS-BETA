
import { GoogleGenAI, Type } from "@google/genai";
import { CandidateRanking, ProbabilityResult, SimulationResults, HistoricalDataset, PartyAnalysisData, PartyData } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = 'gemini-2.5-flash';

const CSV_EXTRACTION_PROMPT_BASE = `
    Eres un asistente experto en extracción de datos electorales. Tu única tarea es convertir el contenido de un documento en una cadena de texto en formato CSV válida.

    REGLA CRÍTICA: Tu respuesta DEBE SER únicamente el contenido del CSV, sin explicaciones, introducciones, resúmenes, ni las vallas de código (''') al inicio o al final.
    
    Las columnas del CSV deben ser exactamente estas y en este orden:
    Eleccion,Año,UnidadPolitica,Candidato,Votos,EsCabezaDeLista,AlianzaHistoricaID

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
        *   'Eleccion': Infiere el tipo de elección del título (ej. 'ASAMBLEA', 'SENADO'). Si no se especifica, usa 'Desconocida'.
        *   'Año': Infiere el año de la elección. Si no se especifica, usa el año actual.
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
        // The chunking logic has been removed. The Gemini API can handle large contexts natively,
        // so sending the entire text at once is more efficient and avoids potential errors
        // from splitting the data incorrectly.
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

    INSTRUCCIONES:
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
        
        // Basic validation + index validation
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

export const getOpenVsClosedListAnalysis = async (partyName: string, historicalData: any[], summary: any, targetYear: number): Promise<{ projections: any; analysisText: string; }> => {
    const prompt = `
    ROL: Eres un experto estratega político y analista de datos cuantitativos colombiano.
    TAREA: Basado en datos históricos, proyecta el rendimiento electoral para ${targetYear} del partido "${partyName}" bajo dos escenarios (lista abierta y lista cerrada) y proporciona un análisis estratégico.

    DATOS DEL PARTIDO: ${partyName}

    1.  **Rendimiento Histórico Detallado:**
        ${JSON.stringify(historicalData, null, 2)}
        * "voteConcentration": Es la desviación estándar de los votos de los candidatos en listas abiertas. Un valor alto significa alta dependencia en pocas figuras.

    2.  **Métricas Resumen:**
        ${JSON.stringify(summary, null, 2)}

    INSTRUCCIONES DE ANÁLISIS Y PROYECCIÓN:

    1.  **Proyección Base para ${targetYear}:**
        - Estima un **voto base proyectado** para un escenario de **Lista Abierta**. Considera el promedio histórico, la tendencia y la concentración de votos. Si no hay datos para listas abiertas, la proyección puede ser nula.
        - Estima un **voto base proyectado** para un escenario de **Lista Cerrada**. Considera la fuerza de la marca del partido y su rendimiento histórico sin candidatos individuales. Si no hay datos para listas cerradas, la proyección puede ser nula.

    2.  **Cálculo de Intervalos de Confianza (Rango del 5%):**
        - Para la proyección de Lista Abierta, calcula un intervalo:
            - Límite Inferior: Proyección Base - 2.5%
            - Límite Superior: Proyección Base + 2.5%
        - Para la proyección de Lista Cerrada, calcula un intervalo:
            - Límite Inferior: Proyección Base - 2.5%
            - Límite Superior: Proyección Base + 2.5%

    3.  **Análisis Estratégico (Texto):**
        - Realiza un análisis cualitativo como lo harías para un comité de campaña. Compara los pros y contras de cada tipo de lista basado en los datos.
        - Evalúa si la fuerza de la marca (lista cerrada) es suficiente o si el partido se beneficia más de la tracción individual de sus candidatos (lista abierta).
        - Concluye con una recomendación clara y justificada.

    FORMATO DE SALIDA REQUERIDO:
    Responde ÚNICAMENTE con un objeto JSON válido, sin explicaciones ni texto adicional fuera del JSON. La estructura debe ser la siguiente. Si no hay suficientes datos para un tipo de lista, su valor puede ser null.
    {
      "projections": {
        "openList": {
          "baseline": <número_entero_o_null>,
          "lowerBound": <número_entero_o_null>,
          "upperBound": <número_entero_o_null>
        },
        "closedList": {
          "baseline": <número_entero_o_null>,
          "lowerBound": <número_entero_o_null>,
          "upperBound": <número_entero_o_null>
        }
      },
      "analysisText": "<tu_analisis_estrategico_en_texto_plano_aqui>"
    }
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

        // Basic validation
        if (result && result.projections && result.analysisText) {
            // Ensure numeric values are integers
            const projections = result.projections;
            if (projections.openList && projections.openList.baseline) {
                projections.openList.baseline = Math.round(projections.openList.baseline);
                projections.openList.lowerBound = Math.round(projections.openList.lowerBound);
                projections.openList.upperBound = Math.round(projections.openList.upperBound);
            }
             if (projections.closedList && projections.closedList.baseline) {
                projections.closedList.baseline = Math.round(projections.closedList.baseline);
                projections.closedList.lowerBound = Math.round(projections.closedList.lowerBound);
                projections.closedList.upperBound = Math.round(projections.closedList.upperBound);
            }
            return result;
        }
        throw new Error("La respuesta de la IA no tiene el formato JSON esperado.");

    } catch (error) {
        console.error("Error llamando a Gemini para análisis de tipo de lista:", error);
        throw new Error("No se pudo generar el análisis estratégico de tipo de lista.");
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

export const generateStrategicReport = async (
    activeDataset: HistoricalDataset,
    partyAnalysis: Map<string, PartyAnalysisData>,
    targetParty: string,
    seatsToContest: number
): Promise<string> => {
    const historicalDataForPrompt = JSON.stringify(Array.from(partyAnalysis.values()).map(p => ({
        party: p.name,
        history: p.history.map(h => ({ election: h.datasetName, votes: h.votes }))
    })), null, 2);

    const activeDataForPrompt = JSON.stringify(activeDataset.partyData, null, 2);

    const prompt = `
    ROL: Eres un estratega político de élite y analista de datos cuantitativos. Tu cliente es el comando de campaña del "${targetParty}".
    TAREA: Genera un informe estratégico exhaustivo y accionable para la próxima elección, donde se disputan ${seatsToContest} curules. Tu análisis debe ser riguroso, basado en datos, y presentado en un formato de informe ejecutivo profesional.
    
    CONTEXTO Y DATOS:
    1.  **Datos de la Elección de Referencia (${activeDataset.name}):**
        ${activeDataForPrompt}
    
    2.  **Datos Históricos Agregados:**
        ${historicalDataForPrompt}

    FORMATO DE SALIDA REQUERIDO:
    Tu respuesta DEBE ser texto plano con formato similar a Markdown. USA TÍTULOS CLAROS para cada sección (ej. **Título de Sección**). Para listas, usa viñetas (* o -). Para tablas, usa delimitadores de pipe (|).

    ESTRUCTURA DEL INFORME (sigue este orden rigurosamente):
    
    **Fecha:** ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
    **Resumen Ejecutivo:**
    - Diagnóstico del nuevo paradigma electoral con ${seatsToContest} curules.
    - Análisis de la tendencia del "${targetParty}" y su competidor principal.
    - Definición de objetivos estratégicos clave (ej. "Alcanzar 5 curules") con los rangos de votos necesarios.
    - Conclusión estratégica central.
    
    **Sección 1: El Nuevo Paradigma Electoral: Análisis Técnico de un Escenario de ${seatsToContest} Curules**
    - 1.1. La Mecánica D'Hondt en un Entorno de Alta Competencia: Analiza la elevación de la cifra repartidora y el castigo a la ineficiencia.
    
    **Sección 2: Diagnóstico Profundo de la Línea Base**
    - 2.2. Análisis Longitudinal de las Fuerzas Políticas: Analiza la evolución del "${targetParty}", su competidor principal y otros bloques relevantes.
    
    **Sección 3: El Campo de Batalla Central: Un Análisis de la Competencia Directa**
    - 3.1. Perfil del Votante del Competidor Principal.
    - 3.2. Vulnerabilidades Estratégicas del Competidor (Puntos de Ataque).
    
    **Sección 4: Proyecciones Cuantitativas para una Batalla a Dos Bandas (${seatsToContest} Curules)**
    - 4.1. Escenario 1: Estabilidad Competitiva (Tendencial)
      - Asunciones claras.
      - Objetivo: Alcanzar [N] Curules.
      - Votos Necesarios, Votos Competidor, Cifra Repartidora.
      - Análisis Táctico.
    - 4.2. Escenario 2: Oportunidad por Desgaste del Adversario
      - Similar al Escenario 1 pero con diferentes asunciones y objetivos.
    
    **Sección 5: Tablas de Proyección y Análisis de Sensibilidad**
    - Incluye al menos 3 de las siguientes tablas, llenándolas con datos plausibles y proyecciones basadas en la información proporcionada.
    - Tabla 5.2: Análisis de Sensibilidad del "${targetParty}".
      --- TABLE START: Análisis de Sensibilidad ---
      | Votación Proyectada CD | Curules Probables | Análisis Táctico |
      |---|---|---|
      | [Votos] | [N] | [Análisis] |
      ...
      --- TABLE END ---
    - Tabla 5.4: Análisis de Costo Marginal por Curul.
      --- TABLE START: Costo Marginal por Curul ---
      | Curul Objetivo | Votos Totales Requeridos | Votos Adicionales (Costo Marginal) | Análisis Estratégico del Costo-Beneficio |
      |---|---|---|---|
      ...
      --- TABLE END ---
    - Tabla 5.8: Índice de Eficiencia Electoral (Votos por Curul).
      --- TABLE START: Eficiencia Electoral ---
      | Partido | Votos Proyectados | Curules Obtenidas | Votos por Curul | Análisis |
      |---|---|---|---|---|
      ...
      --- TABLE END ---
    `;
    
    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
        });
        return response.text;
    } catch (error) {
        console.error("Error llamando a Gemini para generar informe estratégico:", error);
        throw new Error("No se pudo generar el informe estratégico.");
    }
};



export type AnalysisType = 
    | { type: 'base_ranking'; data: CandidateRanking[]; partyFilter?: string; }
    | { type: 'simulation'; data: { baseRanking: CandidateRanking[], results: SimulationResults }};

export const getAIAnalysis = async (analysisType: AnalysisType): Promise<string> => {
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
    });
    return response.text;
  } catch (error) {
    console.error("Error llamando a la API de Gemini:", error);
    return `TÍTULO: Error de Conexión\n\nOcurrió un error al generar el análisis de IA. Por favor, revisa la consola para más detalles. El modelo podría estar sobrecargado o la clave de API podría ser incorrecta.`;
  }
};