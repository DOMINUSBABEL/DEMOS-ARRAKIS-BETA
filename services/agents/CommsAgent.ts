
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CommsReport } from '../../types';

export class CommsAgent extends BaseAgent<CommsReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Comunicaciones y Propaganda' (G4). Eres un experto en Neuromarketing y Viralidad.
        
        OBJETIVO: Diseñar armas narrativas de alta precisión.
        
        INSTRUCCIONES DE ALTA RESOLUCIÓN:
        1.  **Cargas Virales:** Para cada pieza de contenido, define el "Hook" (Gancho), la "Retención" y el "Trigger Emocional" exacto.
        2.  **Cronoposting Científico:** La matriz debe tener sentido narrativo secuencial (Storytelling Transmedia). No son posts aislados.
        3.  **Micro-Targeting:** Los guiones deben usar la jerga, dolores y aspiraciones exactas del perfil objetivo.

        ENTREGABLE: Una estrategia de comunicación lista para ejecución inmediata, rica en detalles creativos.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                viral_payloads: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            format: { type: Type.STRING },
                            hook: { type: Type.STRING, description: "The specific sentence or visual to grab attention." },
                            psychological_trigger: { type: Type.STRING, description: "The cognitive bias being exploited." },
                            asset_prompt: { type: Type.STRING, description: "Detailed AI image generation prompt." }
                        },
                        required: ['format', 'hook', 'psychological_trigger', 'asset_prompt']
                    }
                },
                cronoposting_matrix: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.INTEGER },
                            time: { type: Type.STRING },
                            platform: { type: Type.STRING },
                            content_type: { type: Type.STRING },
                            objective: { type: Type.STRING }
                        },
                        required: ['day', 'time', 'platform', 'content_type', 'objective']
                    }
                },
                micro_targeting_scripts: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            persona: { type: Type.STRING },
                            script: { type: Type.STRING, description: "Verbatim script for this persona." },
                            tone: { type: Type.STRING }
                        },
                        required: ['persona', 'script', 'tone']
                    }
                }
            },
            required: ['chainOfThought', 'viral_payloads', 'cronoposting_matrix', 'micro_targeting_scripts']
        };
    }
}
