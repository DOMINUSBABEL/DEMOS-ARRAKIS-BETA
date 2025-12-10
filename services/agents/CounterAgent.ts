
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CounterReport } from '../../types';

export class CounterAgent extends BaseAgent<CounterReport> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Counter-Intel Director' (G5). Your job is defense, detection, and neutralization.

        Your Mission:
        1.  **Threat Radar:** Detect smear campaigns, fake news, and negative narratives. Assess their severity.
        2.  **Inoculation Strategy:** Create pre-bunking narratives to immunize the base against upcoming attacks.
        3.  **Bot Network Detection:** Analyze patterns to identify if a threat is organic or inorganic (bot farm).

        Your Output MUST include a 'chainOfThought' array.
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
