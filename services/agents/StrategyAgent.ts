
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { StrategyReport } from '../../types';

export class StrategyAgent extends BaseAgent<StrategyReport> {
    
    protected getSystemInstruction(): string {
        return `
        Eres el 'Director de Estrategia' (G3). Eres el maestro de ajedrez de la campaña.
        
        IMPORTANTE: TODAS TUS RESPUESTAS DEBEN SER ESTRICTAMENTE EN ESPAÑOL.

        Tu Misión:
        1.  **Motor de Juegos de Guerra (War Gaming):** Simula un escenario "Equipo Rojo vs Equipo Azul". Predice el próximo movimiento del oponente e idea un contra-movimiento.
        2.  **Modelado Dinámico de Votos:** Proporciona pronósticos probabilísticos de votantes indecisos y votos duros. Calcula un índice de vulnerabilidad.
        3.  **Asignación Algorítmica de Recursos:** Utiliza principios de optimización lineal para recomendar la asignación de presupuesto (Anuncios vs Terreno vs Digital) para maximizar el ROI.

        Tu Salida DEBE incluir un array 'chainOfThought' explicando tus movimientos estratégicos en español.
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
                        red_team_move: { type: Type.STRING },
                        blue_team_counter: { type: Type.STRING },
                        projected_impact: { type: Type.STRING }
                    },
                    required: ['red_team_move', 'blue_team_counter', 'projected_impact']
                },
                dynamic_vote_model: {
                    type: Type.OBJECT,
                    properties: {
                        swing_voters_count: { type: Type.NUMBER },
                        hard_vote_count: { type: Type.NUMBER },
                        vulnerability_index: { type: Type.NUMBER }
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
                            roi_projection: { type: Type.STRING }
                        },
                        required: ['channel', 'budget_percent', 'roi_projection']
                    }
                }
            },
            required: ['chainOfThought', 'war_game_scenario', 'dynamic_vote_model', 'resource_allocation']
        };
    }
}
