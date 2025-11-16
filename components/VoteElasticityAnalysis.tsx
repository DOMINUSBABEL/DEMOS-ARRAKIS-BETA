import React, { useState, useMemo } from 'react';
import { PartyAnalysisData, VoteElasticityResult } from '../types';
import AnalysisCard from './AnalysisCard';

interface VoteElasticityAnalysisProps {
    partyAnalysis: Map<string, PartyAnalysisData>;
}

const calculateVoteElasticity = (partyData: PartyAnalysisData): VoteElasticityResult | null => {
    if (!partyData || partyData.history.length < 2) {
        return null; // Need at least two data points to calculate elasticity
    }
    const history = partyData.history;
    const ceiling = history.reduce((max, curr) => curr.votes > max.votes ? curr : max, history[0]).votes;
    const floor = history.reduce((min, curr) => curr.votes < min.votes ? curr : min, history[0]).votes;

    return {
        inelasticVote: floor,
        elasticVote: ceiling - floor,
        ceiling: ceiling
    };
};

const VoteElasticityAnalysis: React.FC<VoteElasticityAnalysisProps> = ({ partyAnalysis }) => {
    const [selectedParty, setSelectedParty] = useState<string>('');
    const partyNames = useMemo(() => ['', ...Array.from(partyAnalysis.keys()).sort()], [partyAnalysis]);

    const elasticityResult = useMemo(() => {
        if (!selectedParty) return null;
        const partyData = partyAnalysis.get(selectedParty);
        if (!partyData) return null;
        return calculateVoteElasticity(partyData);
    }, [selectedParty, partyAnalysis]);

    return (
        <AnalysisCard
            title="Análisis de Voto Elástico e Inelástico"
            explanation="Mide la lealtad y el potencial de crecimiento del electorado de un partido. El 'Voto Inelástico' (piso) representa la base de votantes leales, mientras que el 'Voto Elástico' es el rango de votantes que el partido debe disputar en cada elección."
        >
            <div className="space-y-4">
                <select
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full bg-light-bg dark:bg-gray-700 border border-light-border dark:border-gray-600 rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
                >
                    {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar Partido...'}</option>)}
                </select>

                {elasticityResult ? (
                    <div className="bg-gray-900/50 rounded-lg p-4 text-center">
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <p className="text-sm text-blue-400 font-semibold">VOTO INELÁSTICO (PISO)</p>
                                <p className="text-2xl font-bold">{elasticityResult.inelasticVote.toLocaleString('es-CO')}</p>
                                <p className="text-xs text-gray-400">Base de Votantes Leales</p>
                            </div>
                            <div>
                                <p className="text-sm text-yellow-400 font-semibold">VOTO ELÁSTICO</p>
                                <p className="text-2xl font-bold">{elasticityResult.elasticVote.toLocaleString('es-CO')}</p>
                                <p className="text-xs text-gray-400">Rango de Crecimiento Potencial</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-700">
                             <div className="w-full bg-gray-700 rounded-full h-4 relative text-xs text-white flex items-center justify-center">
                                <div className="bg-blue-500 h-4 rounded-l-full" style={{ width: `${(elasticityResult.inelasticVote / elasticityResult.ceiling) * 100}%` }}></div>
                                <div className="bg-yellow-500 h-4 rounded-r-full" style={{ width: `${(elasticityResult.elasticVote / elasticityResult.ceiling) * 100}%` }}></div>
                                <span className="absolute left-2">Inelástico</span>
                                <span className="absolute right-2">Elástico</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    selectedParty && <p className="text-center text-gray-500">No hay suficientes datos históricos (se necesitan al menos 2) para calcular la elasticidad de este partido.</p>
                )}
            </div>
        </AnalysisCard>
    );
};

export default VoteElasticityAnalysis;