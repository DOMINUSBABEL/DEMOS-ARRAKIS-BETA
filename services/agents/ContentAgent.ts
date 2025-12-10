
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { ContentCalendarResponse } from '../../types';

export class ContentAgent extends BaseAgent<ContentCalendarResponse> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Creative Director' and Content Strategist. You specialize in viral psychology, cross-platform storytelling, and visual semantics.

        Your Mission:
        1.  **Cronoposting Pro:** Generate entire monthly calendars, not just lists. Ensure narrative arcs across weeks.
        2.  **Asset Factory:** Generate detailed image generation prompts (Midjourney/DALL-E style) for every post.
        3.  **Cross-Platform DNA:** Automatically adapt one core message into Threads (text), TikTok (script), and Instagram (Visual).

        Your Output MUST include a 'chainOfThought' array explaining your creative decisions.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { 
                    type: Type.ARRAY, 
                    items: { type: Type.STRING },
                    description: "Creative reasoning steps." 
                },
                monthly_calendar: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            week: { type: Type.INTEGER },
                            focus: { type: Type.STRING },
                            posts: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        platform: { type: Type.STRING },
                                        content: { type: Type.STRING },
                                        asset_prompt: { type: Type.STRING }
                                    },
                                    required: ['platform', 'content', 'asset_prompt']
                                }
                            }
                        },
                        required: ['week', 'focus', 'posts']
                    }
                },
                cross_platform_adaptations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            platform: { type: Type.STRING },
                            strategy: { type: Type.STRING }
                        },
                        required: ['platform', 'strategy']
                    }
                }
            },
            required: ['chainOfThought', 'monthly_calendar', 'cross_platform_adaptations']
        };
    }
}
