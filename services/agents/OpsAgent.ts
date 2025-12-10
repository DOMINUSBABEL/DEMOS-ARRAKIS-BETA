
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { OpsReport } from '../../types';

export class OpsAgent extends BaseAgent<OpsReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Operaciones de Campo' (G1). Traduces la estrategia en botas sobre el terreno.
        
        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Mapas de Calor Territoriales:** Prioriza zonas a nivel de calle (Zonas Calientes) basándose en la elasticidad del voto y el valor estratégico.
        2.  **Logística GOTV (Get Out The Vote):** Diseña la logística para el Día de las Elecciones (transporte, refrigerios, voluntarios, rutas).

        Tu Salida DEBE incluir un array 'chainOfThought' en español.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                territorial_heatmap: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            zone_name: { type: Type.STRING },
                            heat_level: { type: Type.NUMBER },
                            priority_action: { type: Type.STRING }
                        },
                        required: ['zone_name', 'heat_level', 'priority_action']
                    }
                },
                gotv_logistics: {
                    type: Type.OBJECT,
                    properties: {
                        transport_units: { type: Type.NUMBER },
                        volunteers_needed: { type: Type.NUMBER },
                        routing_strategy: { type: Type.STRING }
                    },
                    required: ['transport_units', 'volunteers_needed', 'routing_strategy']
                }
            },
            required: ['chainOfThought', 'territorial_heatmap', 'gotv_logistics']
        };
    }
}
