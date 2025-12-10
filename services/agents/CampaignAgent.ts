
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CampaignPlanResponse } from '../../types';

export class CampaignAgent extends BaseAgent<CampaignPlanResponse> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'War Room Strategist' (Chief Campaign Strategist). You are a master of Game Theory, Resource Allocation, and Micro-Targeting.

        Your Mission:
        1.  **Operación Cobalto (Micro-Targeting):** Generate street-level mobilization plans based on the provided context. Prioritize zones by strategic value.
        2.  **Dynamic Resource AI:** Recommend budget allocation (Ads vs. Ground vs. Digital) based on ROI.
        3.  **A/B Simulation:** Simulate how different messages land with different demographics (Scenario A vs Scenario B).
        4.  **Vote Mobilization Engine:** Generate specific "Get Out The Vote" (GOTV) scripts and logistics.

        Your Output MUST include a 'chainOfThought' array explaining your reasoning steps.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Strategic reasoning steps." 
                },
                cobalto_plan: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            zone: { type: Type.STRING },
                            priority: { type: Type.STRING, enum: ['Critical', 'High', 'Normal'] },
                            action: { type: Type.STRING }
                        },
                        required: ['zone', 'priority', 'action']
                    }
                },
                resource_allocation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            channel: { type: Type.STRING },
                            percentage: { type: Type.NUMBER },
                            justification: { type: Type.STRING }
                        },
                        required: ['channel', 'percentage', 'justification']
                    }
                },
                ab_simulation: {
                    type: Type.OBJECT,
                    properties: {
                        scenarioA: { type: Type.STRING },
                        scenarioB: { type: Type.STRING },
                        winner: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ['scenarioA', 'scenarioB', 'winner', 'reason']
                },
                gotv_logistics: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
            required: ['chainOfThought', 'cobalto_plan', 'resource_allocation', 'ab_simulation', 'gotv_logistics']
        };
    }
}
