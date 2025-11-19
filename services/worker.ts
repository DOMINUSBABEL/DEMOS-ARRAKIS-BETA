import { processData, runMonteCarloSimulation, simulateVoteFragmentation, applyGovernmentOppositionFactor, applyCoattailEffect, applyLocalSupportFactor, applyCampaignStrengthFactor } from './electoralProcessor';
import { SimulationParams, CandidateRanking } from '../types';

// Define message types
export type WorkerMessage =
    | { type: 'PROCESS_DATA'; id: string; payload: { csvText: string } }
    | { type: 'RUN_SIMULATION'; id: string; payload: { params: SimulationParams; ranking: CandidateRanking[] } };

export type WorkerResponse =
    | { type: 'PROCESS_DATA_SUCCESS'; id: string; payload: any }
    | { type: 'RUN_SIMULATION_SUCCESS'; id: string; payload: any }
    | { type: 'ERROR'; id: string; payload: string };

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, id, payload } = e.data;

    try {
        switch (type) {
            case 'PROCESS_DATA':
                const result = await processData(payload.csvText);
                self.postMessage({ type: 'PROCESS_DATA_SUCCESS', id, payload: result });
                break;

            case 'RUN_SIMULATION':
                const { params, ranking } = payload;

                // Run simulation steps
                const fragmentedRanking = simulateVoteFragmentation(ranking, params.fragmentationUnit, params.numCandidates);
                const govFactoredRanking = applyGovernmentOppositionFactor(fragmentedRanking, params.governmentParties);
                const coattailFactoredRanking = applyCoattailEffect(govFactoredRanking, params.coattailEffect);
                const supportFactoredRanking = applyLocalSupportFactor(coattailFactoredRanking, params.localSupport);
                const finalFactoredRanking = applyCampaignStrengthFactor(supportFactoredRanking, params.campaignStrength);

                const probabilities = runMonteCarloSimulation(finalFactoredRanking, params.threshold, params.monteCarloIterations);

                self.postMessage({
                    type: 'RUN_SIMULATION_SUCCESS',
                    id,
                    payload: {
                        fragmentedRanking,
                        factoredRanking: finalFactoredRanking,
                        probabilities
                    }
                });
                break;

            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown worker error';
        self.postMessage({ type: 'ERROR', id, payload: errorMessage });
    }
};
