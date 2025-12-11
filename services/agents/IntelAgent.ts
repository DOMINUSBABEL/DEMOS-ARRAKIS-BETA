
import { BaseAgent } from './BaseAgent';
import { Type, Schema, Tool } from "@google/genai";
import { IntelReport } from '../../types';

export class IntelAgent extends BaseAgent<IntelReport> {
    
    // Enable Deep Research capabilities
    protected getTools(): Tool[] | undefined {
        return [{ googleSearch: {} }];
    }

    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Inteligencia' (G2) de una campaña política de alto riesgo.
        
        PROTOCOLO "DEEP RESEARCH" ACTIVADO:
        1.  No asumas nada. Verifica cada afirmación usando la herramienta de búsqueda.
        2.  Busca fuentes locales específicas (periódicos regionales, blogs políticos locales, denuncias en X) para encontrar datos que no están en los grandes medios.
        3.  Prioriza la "Data Oscura": rumores confirmados, alianzas no oficiales, financiadores ocultos.

        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Mapeo Psicométrico (OCEAN):** Analiza el grupo demográfico objetivo utilizando los 5 grandes rasgos.
        2.  **Espectro de Sentimiento (Plutchik):** Mapea emociones complejas (Ira, Vigilancia, Éxtasis) basándote en eventos recientes reales encontrados en búsqueda.
        3.  **Triangulación Narrativa:** Identifica el "Paciente Cero" real de las narrativas clave usando búsqueda para rastrear el origen.
        4.  **Escaneo Profundo del Ecosistema:** Identifica actores específicos (nombres propios) y sus relaciones.

        Tu Salida DEBE incluir un array 'chainOfThought' explicando qué buscaste y cómo conectaste los puntos.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                psychometric_profile: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.STRING },
                        conscientiousness: { type: Type.STRING },
                        extraversion: { type: Type.STRING },
                        agreeableness: { type: Type.STRING },
                        neuroticism: { type: Type.STRING },
                        analysis: { type: Type.STRING }
                    },
                    required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism', 'analysis']
                },
                sentiment_spectrum: {
                    type: Type.OBJECT,
                    properties: {
                        rage: { type: Type.NUMBER },
                        vigilance: { type: Type.NUMBER },
                        ecstasy: { type: Type.NUMBER },
                        admiration: { type: Type.NUMBER },
                        terror: { type: Type.NUMBER },
                        amazement: { type: Type.NUMBER },
                        grief: { type: Type.NUMBER },
                        loathing: { type: Type.NUMBER }
                    },
                    required: ['rage', 'vigilance', 'ecstasy', 'admiration', 'terror', 'amazement', 'grief', 'loathing']
                },
                narrative_triangulation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            origin_point: { type: Type.STRING },
                            patient_zero: { type: Type.STRING },
                            vectors: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['origin_point', 'patient_zero', 'vectors']
                    }
                },
                ecosystem_scan: { type: Type.STRING }
            },
            required: ['chainOfThought', 'psychometric_profile', 'sentiment_spectrum', 'narrative_triangulation', 'ecosystem_scan']
        };
    }
}
