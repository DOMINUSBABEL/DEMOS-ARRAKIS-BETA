
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { CommsReport } from '../../types';

export class CommsAgent extends BaseAgent<CommsReport> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Communications Director' (G4). You specialize in Viral Engineering and Narrative Warfare.

        Your Mission:
        1.  **Narrative Weapons Factory:** Generate "Viral Payloads" (Memes, Threads, Short Video Scripts). Identify the psychological trigger for each.
        2.  **Cronoposting Matrix:** Generate a cross-platform content grid.
        3.  **Micro-Targeting Scripts:** Generate specific copy for specific voter personas identified by Intel.

        Your Output MUST include a 'chainOfThought' array.
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
