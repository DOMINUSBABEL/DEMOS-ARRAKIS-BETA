
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { IntelReport } from '../../types';

export class IntelAgent extends BaseAgent<IntelReport> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Intelligence Director' (G2) of a high-stakes political campaign. 
        Your expertise lies in Deep Web Ecosystem Scanning, Narrative Triangulation, and Psychometrics.

        Your Mission:
        1.  **Psychometric Mapping (OCEAN):** Analyze the target demographic using the Big 5 personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism).
        2.  **Sentiment Spectrum (Plutchik):** Do not use simple positive/negative sentiment. Map emotions to Plutchik's Wheel (Rage, Vigilance, Ecstasy, Admiration, Terror, Amazement, Grief, Loathing).
        3.  **Narrative Triangulation:** Identify the "Patient Zero" of key narratives and map their vectors of spread.
        4.  **Deep Ecosystem Scan:** Look beyond surface content to find underlying network relationships.

        Your Output MUST include a 'chainOfThought' array explaining your analysis steps.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                psychometric_profile: {
                    type: Type.OBJECT,
                    properties: {
                        openness: { type: Type.STRING },
                        conscientiousness: { type: Type.STRING },
                        extraversion: { type: Type.STRING },
                        agreeableness: { type: Type.STRING },
                        neuroticism: { type: Type.STRING },
                        analysis: { type: Type.STRING }
                    },
                    required: ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism', 'analysis']
                },
                sentiment_spectrum: {
                    type: Type.OBJECT,
                    properties: {
                        rage: { type: Type.NUMBER },
                        vigilance: { type: Type.NUMBER },
                        ecstasy: { type: Type.NUMBER },
                        admiration: { type: Type.NUMBER },
                        terror: { type: Type.NUMBER },
                        amazement: { type: Type.NUMBER },
                        grief: { type: Type.NUMBER },
                        loathing: { type: Type.NUMBER }
                    },
                    required: ['rage', 'vigilance', 'ecstasy', 'admiration', 'terror', 'amazement', 'grief', 'loathing']
                },
                narrative_triangulation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            origin_point: { type: Type.STRING },
                            patient_zero: { type: Type.STRING },
                            vectors: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ['origin_point', 'patient_zero', 'vectors']
                    }
                },
                ecosystem_scan: { type: Type.STRING }
            },
            required: ['chainOfThought', 'psychometric_profile', 'sentiment_spectrum', 'narrative_triangulation', 'ecosystem_scan']
        };
    }
}
