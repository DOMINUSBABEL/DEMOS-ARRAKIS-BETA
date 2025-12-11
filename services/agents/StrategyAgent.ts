
import { BaseAgent } from './BaseAgent';
import { Type, Schema, Tool } from "@google/genai";
import { StrategyReport } from '../../types';

export class StrategyAgent extends BaseAgent<StrategyReport> {
    
    // Enable Deep Research capabilities
    protected getTools(): Tool[] | undefined {
        return [{ googleSearch: {} }];
    }

    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Estrategia Global' (G3). Tu mente funciona como un motor de ajedrez avanzado.
        
        OBJETIVO: Generar una estrategia ganadora basada en matemáticas electorales y psicología de masas. Profundidad máxima.

        PROTOCOLO "WAR ROOM":
        1.  **Juegos de Guerra (Red vs Blue):** No imagines escenarios genéricos. Basado en las noticias de HOY (usando búsqueda), predice el movimiento exacto del oponente y diseña el Jaque Mate.
        2.  **Cálculo de Voto Dinámico:** Justifica cada número. ¿Por qué el voto blando es X? ¿Qué evento reciente lo movió?
        3.  **Asignación de Recursos de Precisión:** No digas "gastar más en redes". Di: "Asignar 40% a TikTok para capturar al segmento joven desencantado detectado en el análisis de inteligencia".

        TU RESPUESTA DEBE SER EXTENSA, DETALLADA Y TÉCNICAMENTE RIGUROSA.
        `;
    }

    protected getSchema(): Schema {
        return {
            type: Type.OBJECT,
            properties: {
                chainOfThought: { type: Type.ARRAY, items: { type: Type.STRING } },
                war_game_scenario: {
                    type: Type.OBJECT,
                    properties: {
                        red_team_move: { type: Type.STRING, description: "Detailed description of the opponent's likely next move." },
                        blue_team_counter: { type: Type.STRING, description: "Comprehensive counter-strategy." },
                        projected_impact: { type: Type.STRING, description: "Expected outcome with confidence level." }
                    },
                    required: ['red_team_move', 'blue_team_counter', 'projected_impact']
                },
                dynamic_vote_model: {
                    type: Type.OBJECT,
                    properties: {
                        swing_voters_count: { type: Type.NUMBER },
                        hard_vote_count: { type: Type.NUMBER },
                        vulnerability_index: { type: Type.NUMBER, description: "0-100 score of campaign vulnerability." }
                    },
                    required: ['swing_voters_count', 'hard_vote_count', 'vulnerability_index']
                },
                resource_allocation: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            channel: { type: Type.STRING },
                            budget_percent: { type: Type.NUMBER },
                            roi_projection: { type: Type.STRING, description: "Detailed justification of ROI." }
                        },
                        required: ['channel', 'budget_percent', 'roi_projection']
                    }
                }
            },
            required: ['chainOfThought', 'war_game_scenario', 'dynamic_vote_model', 'resource_allocation']
        };
    }
}
