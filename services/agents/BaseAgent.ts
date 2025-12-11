
import { GoogleGenAI, Type, Schema, Tool } from "@google/genai";

export abstract class BaseAgent<T> {
    protected ai: GoogleGenAI;
    // Using gemini-3-pro-preview for complex reasoning tasks as required by the "Complex Text Tasks" guideline
    protected modelName: string = 'gemini-3-pro-preview'; 

    constructor() {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }

    protected abstract getSystemInstruction(): string;
    protected abstract getSchema(): Schema;
    
    // New method to be overridden by agents needing Deep Research capabilities
    protected getTools(): Tool[] | undefined {
        return undefined;
    }

    /**
     * Executes the agent's logic.
     * @param prompt The specific task or query for the agent.
     * @param context Optional context object (e.g., historical data, previous chat).
     */
    async generate(prompt: string, context?: any): Promise<T> {
        const fullPrompt = `
        CONTEXT:
        ${context ? JSON.stringify(context, null, 2) : 'No specific context provided.'}

        TASK:
        ${prompt}

        IMPORTANT:
        - Think step-by-step before answering (Chain of Thought).
        - Ensure strict adherence to the requested JSON schema.
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: this.modelName,
                contents: fullPrompt,
                config: {
                    systemInstruction: this.getSystemInstruction(),
                    responseMimeType: "application/json",
                    responseSchema: this.getSchema(),
                    tools: this.getTools(), // Inject tools here
                }
            });

            if (!response.text) {
                throw new Error("Agent returned empty response.");
            }

            const parsed = JSON.parse(response.text);
            return parsed as T;

        } catch (error) {
            console.error(`Agent Error (${this.constructor.name}):`, error);
            throw new Error(`Agent failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
