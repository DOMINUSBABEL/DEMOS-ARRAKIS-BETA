
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { OpsReport } from '../../types';

export class OpsAgent extends BaseAgent<OpsReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Operaciones de Campo' (G1). Tu dominio es el territorio físico, la logística y el Día D.
        
        OBJETIVO: Traducir la estrategia etérea en acciones de concreto y asfalto.
        
        INSTRUCCIONES DE CAMPO:
        1.  **Mapas de Calor Granulares:** Identifica barrios o zonas específicas. No generalices. Asigna una "Acción Prioritaria" táctica a cada zona (ej. "Puerta a puerta intensivo", "Perifoneo", "Toma de semáforos").
        2.  **Logística GOTV (Día E):** Calcula necesidades reales. Transporte, alimentación, testigos electorales. Sé un logístico experto.

        ENTREGABLE: Un plan operativo detallado para desplegar tropas territoriales.
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
                            zone_name: { type: Type.STRING, description: "Specific neighborhood or district." },
                            heat_level: { type: Type.NUMBER, description: "0-100 Priority." },
                            priority_action: { type: Type.STRING, description: "Specific tactical action for this zone." }
                        },
                        required: ['zone_name', 'heat_level', 'priority_action']
                    }
                },
                gotv_logistics: {
                    type: Type.OBJECT,
                    properties: {
                        transport_units: { type: Type.NUMBER },
                        volunteers_needed: { type: Type.NUMBER },
                        routing_strategy: { type: Type.STRING, description: "Detailed description of logistics and routing." }
                    },
                    required: ['transport_units', 'volunteers_needed', 'routing_strategy']
                }
            },
            required: ['chainOfThought', 'territorial_heatmap', 'gotv_logistics']
        };
    }
}
