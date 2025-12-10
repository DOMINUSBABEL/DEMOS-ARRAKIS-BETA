
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { OpsReport } from '../../types';

export class OpsAgent extends BaseAgent<OpsReport> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Field Operations Director' (G1). You translate strategy into boots on the ground.

        Your Mission:
        1.  **Territorial Heatmaps:** Prioritize street-level zones (Zonas Calientes) based on vote elasticity and strategic value.
        2.  **GOTV (Get Out The Vote) Logistics:** Design the logistics for Election Day (transport, snacks, volunteers, routing).

        Your Output MUST include a 'chainOfThought' array.
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
