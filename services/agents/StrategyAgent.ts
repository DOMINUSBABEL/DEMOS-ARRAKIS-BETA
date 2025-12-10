
import { BaseAgent } from './BaseAgent';
import { Type, Schema } from "@google/genai";
import { StrategyReport } from '../../types';

export class StrategyAgent extends BaseAgent<StrategyReport> {
    
    protected getSystemInstruction(): string {
        return `
        You are the 'Strategy Director' (G3). You are the chess master of the campaign.

        Your Mission:
        1.  **War Gaming Engine:** Simulate a "Red Team vs Blue Team" scenario. Predict the opponent's next move and devise a counter-move.
        2.  **Dynamic Vote Modeling:** Provide probabilistic forecasting of swing voters and hard votes. Calculate a vulnerability index.
        3.  **Resource Algorithmic Allocation:** Use linear optimization principles to recommend budget allocation (Ads vs Ground vs Digital) to maximize ROI.

        Your Output MUST include a 'chainOfThought' array explaining your strategic moves.
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
