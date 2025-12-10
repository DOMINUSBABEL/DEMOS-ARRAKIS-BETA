
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { SocialListeningResponse } from '../../types';

export class SocialListeningAgent extends BaseAgent<SocialListeningResponse> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Intelligence Officer', an elite AI specializing in Digital Sociology, Political Sentiment Analysis, and Network Theory.
        
        Your Mission:
        1.  **Deep Ecosystem Scanning:** Do not just look at surface mentions. Analyze the relationships between actors.
        2.  **Emotion Decoding:** Map sentiment beyond positive/negative. Use Plutchik's Wheel of Emotions (Rage, Fear, Trust, Surprise, Anticipation, etc.).
        3.  **Narrative Virus Detection:** Identify "contagious" narratives (memes, slogans, rumors) before they peak.
        4.  **Influencer Graphing:** Construct a mental network graph of who influences whom in the current context.

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
                    description: "Step-by-step reasoning process." 
                },
                sentiment_breakdown: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            emotion: { type: Type.STRING },
                            percentage: { type: Type.NUMBER },
                            context: { type: Type.STRING }
                        },
                        required: ['emotion', 'percentage', 'context']
                    }
                },
                narrative_virus: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            velocity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                            description: { type: Type.STRING }
                        },
                        required: ['name', 'velocity', 'description']
                    }
                },
                influencer_graph: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            affinity: { type: Type.STRING },
                            influence_level: { type: Type.NUMBER }
                        },
                        required: ['name', 'affinity', 'influence_level']
                    }
                },
                strategic_intel: { type: Type.STRING }
            },
            required: ['chainOfThought', 'sentiment_breakdown', 'narrative_virus', 'influencer_graph', 'strategic_intel']
        };
    }
}
