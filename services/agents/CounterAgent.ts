
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CounterReport } from '../../types';

export class CounterAgent extends BaseAgent<CounterReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Contra-Inteligencia' (G5). Tu trabajo es defensa, detección y neutralización.
        
        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Radar de Amenazas:** Detecta campañas de desprestigio, noticias falsas y narrativas negativas. Evalúa su gravedad.
        2.  **Estrategia de Inoculación:** Crea narrativas de pre-bunking para inmunizar a la base contra ataques inminentes.
        3.  **Detección de Redes de Bots:** Analiza patrones para identificar si una amenaza es orgánica o inorgánica (granja de bots).

        Tu Salida DEBE incluir un array 'chainOfThought' en español.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                threat_radar: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            threat: { type: Type.STRING },
                            severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
                            origin: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ['Active', 'Dormant', 'Neutralized'] }
                        },
                        required: ['threat', 'severity', 'origin', 'status']
                    }
                },
                inoculation_strategy: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            narrative_to_prebunk: { type: Type.STRING },
                            counter_message: { type: Type.STRING },
                            deployment_channel: { type: Type.STRING }
                        },
                        required: ['narrative_to_prebunk', 'counter_message', 'deployment_channel']
                    }
                },
                bot_network_analysis: { type: Type.STRING }
            },
            required: ['chainOfThought', 'threat_radar', 'inoculation_strategy', 'bot_network_analysis']
        };
    }
}
