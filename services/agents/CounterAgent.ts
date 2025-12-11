
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CounterReport } from '../../types';

export class CounterAgent extends BaseAgent<CounterReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Contra-Inteligencia y Defensa Digital' (G5). Tu trabajo es proteger la campaña de ataques asimétricos.
        
        OBJETIVO: Análisis forense de amenazas y neutralización preventiva.
        
        INSTRUCCIONES CRÍTICAS:
        1.  **Radar de Amenazas:** Clasifica amenazas con precisión militar. Diferencia entre críticas orgánicas y ataques coordinados.
        2.  **Inoculación (Pre-bunking):** Diseña narrativas que "vacunen" a los votantes antes de que llegue el ataque. Escribe el mensaje exacto.
        3.  **Análisis de Bots:** Busca patrones de comportamiento inorgánico. Explica POR QUÉ crees que es una granja de bots (patrones de tiempo, sintaxis, red).

        ENTREGABLE: Un reporte detallado de ciberseguridad política y defensa de reputación.
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
                            threat: { type: Type.STRING, description: "Detailed description of the threat." },
                            severity: { type: Type.STRING, enum: ['Critical', 'High', 'Medium', 'Low'] },
                            origin: { type: Type.STRING, description: "Suspected source (Organic/Inorganic)." },
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
                            counter_message: { type: Type.STRING, description: "The exact message to deploy." },
                            deployment_channel: { type: Type.STRING }
                        },
                        required: ['narrative_to_prebunk', 'counter_message', 'deployment_channel']
                    }
                },
                bot_network_analysis: { type: Type.STRING, description: "Detailed forensic analysis of potential bot networks." }
            },
            required: ['chainOfThought', 'threat_radar', 'inoculation_strategy', 'bot_network_analysis']
        };
    }
}
