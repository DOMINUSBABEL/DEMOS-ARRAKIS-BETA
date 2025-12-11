
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
        Eres el 'Director de Inteligencia Estratégica' (G2) de una campaña de nivel presidencial. 
        Tu estándar de salida es: **INFORME DE INTELIGENCIA DE ALTA DENSIDAD**.

        OBJETIVO: Proporcionar 300% más profundidad que un análisis estándar. No seas superficial.
        
        PROTOCOLO "DEEP RESEARCH" OBLIGATORIO:
        1.  **Verificación Forense:** Cada afirmación debe estar respaldada por lógica o datos encontrados.
        2.  **Análisis de 2do y 3er Orden:** No digas solo "la gente está enojada". Di: "La ira actual derivará en abstencionismo en la zona X y radicalización en la zona Y".
        3.  **Data Oscura:** Busca lo que no es obvio. Alianzas tácitas, flujos de dinero no reportados, rumores de pasillo confirmados.

        ESTRUCTURA DE RESPUESTA REQUERIDA (RICH MARKDOWN):
        - **Mapeo Psicométrico (OCEAN):** No uses adjetivos simples. Describe la psiquis colectiva. ¿Tienen alta Neurosis? ¿Baja Apertura? ¿Por qué?
        - **Espectro de Sentimiento (Plutchik):** Analiza combinaciones complejas (ej. Miedo + Sorpresa = Alarma).
        - **Triangulación Narrativa:** Rastrea el "Paciente Cero" de los rumores. ¿Quién empezó la narrativa? ¿Cuándo? ¿Cómo mutó?
        - **Escaneo del Ecosistema:** Nombres propios. Organizaciones específicas. Relaciones de poder ocultas.

        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL Y EXTENSAS.
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
                        openness: { type: Type.STRING, description: "Detailed analysis of Openness trait in the target demographic." },
                        conscientiousness: { type: Type.STRING, description: "Detailed analysis of Conscientiousness." },
                        extraversion: { type: Type.STRING, description: "Detailed analysis of Extraversion." },
                        agreeableness: { type: Type.STRING, description: "Detailed analysis of Agreeableness." },
                        neuroticism: { type: Type.STRING, description: "Detailed analysis of Neuroticism." },
                        analysis: { type: Type.STRING, description: "Comprehensive synthesis of the psychometric profile (Min 200 words)." }
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
                            origin_point: { type: Type.STRING, description: "Where the narrative started (Platform/Group)." },
                            patient_zero: { type: Type.STRING, description: "Specific account/person/event that triggered it." },
                            vectors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Channels of propagation." }
                        },
                        required: ['origin_point', 'patient_zero', 'vectors']
                    }
                },
                ecosystem_scan: { type: Type.STRING, description: "A dense, multi-paragraph analysis of the political ecosystem using Markdown for structure." }
            },
            required: ['chainOfThought', 'psychometric_profile', 'sentiment_spectrum', 'narrative_triangulation', 'ecosystem_scan']
        };
    }
}
