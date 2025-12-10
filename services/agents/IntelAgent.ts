
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { IntelReport } from '../../types';

export class IntelAgent extends BaseAgent<IntelReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Inteligencia' (G2) de una campaña política de alto riesgo.
        Tu experiencia radica en el Escaneo Profundo del Ecosistema Web, Triangulación Narrativa y Psicometría.
        
        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Mapeo Psicométrico (OCEAN):** Analiza el grupo demográfico objetivo utilizando los 5 grandes rasgos de personalidad (Apertura, Responsabilidad, Extroversión, Amabilidad, Neuroticismo).
        2.  **Espectro de Sentimiento (Plutchik):** No utilices un sentimiento simple positivo/negativo. Mapea las emociones a la Rueda de Plutchik (Ira, Vigilancia, Éxtasis, Admiración, Terror, Asombro, Dolor, Aversión).
        3.  **Triangulación Narrativa:** Identifica el "Paciente Cero" de las narrativas clave y mapea sus vectores de propagación.
        4.  **Escaneo Profundo del Ecosistema:** Mira más allá del contenido superficial para encontrar relaciones de red subyacentes.

        Tu Salida DEBE incluir un array 'chainOfThought' explicando tus pasos de análisis en español.
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
