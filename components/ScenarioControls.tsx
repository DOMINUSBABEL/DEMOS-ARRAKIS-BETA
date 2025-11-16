
import React, { useState, useEffect } from 'react';
import { SimulationParams, CandidateRanking } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface ScenarioControlsProps {
    baseRanking: CandidateRanking[];
    onSimulate: (params: SimulationParams) => void;
    disabled: boolean;
}

const ScenarioControls: React.FC<ScenarioControlsProps> = ({ baseRanking, onSimulate, disabled }) => {
    const [politicalUnits, setPoliticalUnits] = useState<string[]>([]);
    const [params, setParams] = useState<SimulationParams>({
        fragmentationUnit: '',
        numCandidates: 2,
        governmentParties: [],
        threshold: 15000,
        monteCarloIterations: 5000,
    });

    useEffect(() => {
        const units = [...new Set(baseRanking.map(c => c.unidadPolitica))];
        setPoliticalUnits(units);
        if (units.length > 0 && !params.fragmentationUnit) {
            setParams(p => ({ ...p, fragmentationUnit: units[0] }));
        }
    }, [baseRanking, params.fragmentationUnit]);

    const handleInputChange = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const addGovernmentParty = (party: string) => {
        setParams(prev => ({
            ...prev,
            governmentParties: [...prev.governmentParties, party]
        }));
    };
    
    const removeGovernmentParty = (party: string) => {
        setParams(prev => ({
            ...prev,
            governmentParties: prev.governmentParties.filter(p => p !== party)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSimulate(params);
    };
    
    const availableParties = politicalUnits.filter(p => !params.governmentParties.includes(p));

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4">Módulo de Simulación de Escenarios</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vote Fragmentation */}
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-medium text-gray-300">Simular Fragmentación de Votos</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fragmentationUnit" className="block text-sm font-medium text-gray-300 mb-1">Unidad Política</label>
                            <select
                                id="fragmentationUnit"
                                value={params.fragmentationUnit}
                                onChange={(e) => handleInputChange('fragmentationUnit', e.target.value)}
                                disabled={disabled}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
                            >
                                <option value="">Seleccionar...</option>
                                {politicalUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="numCandidates" className="block text-sm font-medium text-gray-300 mb-1">Número de Candidatos</label>
                            <input
                                type="number"
                                id="numCandidates"
                                value={params.numCandidates}
                                min="1"
                                onChange={(e) => handleInputChange('numCandidates', parseInt(e.target.value))}
                                disabled={disabled}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
                            />
                        </div>
                    </div>
                </fieldset>

                {/* Government / Opposition Adjustment */}
                 <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-medium text-gray-300">Ajuste por Posición Política (Gobierno/Oposición)</legend>
                    <p className="text-xs text-gray-400 mb-4">Aplica una variación negativa de votos (entre -15% y -20%) a los partidos que designes como 'de Gobierno'.</p>
                     <div className="grid grid-cols-2 gap-4" style={{ minHeight: '200px' }}>
                         <div>
                             <h4 className="font-semibold text-sm mb-2 text-center text-gray-300">Partidos de Oposición / Independientes</h4>
                            <div className="bg-gray-700/50 rounded-md p-2 h-48 overflow-y-auto space-y-1">
                                {availableParties.map(party => (
                                    <div key={party} className="flex items-center justify-between p-1.5 bg-gray-900 rounded group">
                                        <span className="text-xs truncate pr-2" title={party}>{party}</span>
                                        <button 
                                            type="button" 
                                            onClick={() => addGovernmentParty(party)} 
                                            disabled={disabled} 
                                            className="p-1 bg-green-600 text-white rounded-full hover:bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={`Marcar ${party} como Gobierno`}>
                                            <PlusIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                ))}
                                {availableParties.length === 0 && <p className="text-xs text-gray-500 text-center pt-4">Todos los partidos han sido designados como de gobierno.</p>}
                            </div>
                         </div>
                         <div>
                            <h4 className="font-semibold text-sm mb-2 text-center text-gray-300">Partidos de Gobierno</h4>
                            <div className="bg-gray-700/50 rounded-md p-2 h-48 overflow-y-auto space-y-1">
                                {params.governmentParties.map(party => (
                                     <div key={party} className="flex items-center justify-between p-1.5 bg-blue-900/50 rounded group">
                                        <span className="text-xs truncate pr-2" title={party}>{party}</span>
                                         <button 
                                            type="button" 
                                            onClick={() => removeGovernmentParty(party)} 
                                            disabled={disabled} 
                                            className="p-1 bg-red-600 text-white rounded-full hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title={`Quitar ${party} de Gobierno`}>
                                            <TrashIcon className="w-3 h-3"/>
                                        </button>
                                    </div>
                                ))}
                                {params.governmentParties.length === 0 && <p className="text-xs text-gray-500 text-center pt-4">Añade partidos a este grupo.</p>}
                            </div>
                         </div>
                     </div>
                </fieldset>

                {/* Probability Engine */}
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-medium text-gray-300">Motor de Probabilidad (Monte Carlo)</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                            <label htmlFor="threshold" className="block text-sm font-medium text-gray-300 mb-1">Umbral de Votos para Curul</label>
                            <input
                                type="number"
                                id="threshold"
                                value={params.threshold}
                                min="1"
                                onChange={(e) => handleInputChange('threshold', parseInt(e.target.value))}
                                disabled={disabled}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
                            />
                        </div>
                        <div>
                            <label htmlFor="monteCarloIterations" className="block text-sm font-medium text-gray-300 mb-1">Nº Simulaciones</label>
                            <input
                                type="number"
                                id="monteCarloIterations"
                                value={params.monteCarloIterations}
                                min="100"
                                max="100000"
                                step="100"
                                onChange={(e) => handleInputChange('monteCarloIterations', parseInt(e.target.value))}
                                disabled={disabled}
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-brand-secondary focus:border-brand-secondary"
                            />
                        </div>
                    </div>
                </fieldset>
                
                <button
                    type="submit"
                    disabled={disabled}
                    className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    Ejecutar Simulación y Análisis
                </button>
            </form>
        </div>
    );
};

export default ScenarioControls;