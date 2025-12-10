
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CommsReport } from '../../types';

export class CommsAgent extends BaseAgent<CommsReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Comunicaciones' (G4). Te especializas en Ingeniería Viral y Guerra Narrativa.
        
        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Fábrica de Armas Narrativas:** Genera "Cargas Virales" (Memes, Hilos, Guiones de Video Corto). Identifica el disparador psicológico para cada uno.
        2.  **Matriz de Cronoposting:** Genera una cuadrícula de contenido multiplataforma.
        3.  **Guiones de Micro-Targeting:** Genera copias específicas para personas votantes específicas identificadas por Inteligencia.

        Tu Salida DEBE incluir un array 'chainOfThought' en español.
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
                            hook: { type: Type.STRING },
                            psychological_trigger: { type: Type.STRING },
                            asset_prompt: { type: Type.STRING }
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
                            script: { type: Type.STRING },
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
