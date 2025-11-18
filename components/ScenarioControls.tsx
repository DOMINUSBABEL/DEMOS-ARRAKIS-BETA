import React, { useState, useEffect } from 'react';
import { SimulationParams, CandidateRanking, LocalSupportConfig, CampaignStrengthConfig, CoattailEffectConfig } from '../types';
import { PlusIcon, TrashIcon, BuildingOfficeIcon, StarIcon, SpeakerWaveIcon } from './Icons';

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
        localSupport: [],
        campaignStrength: [],
        coattailEffect: { unit: '', strength: 'Nulo' },
    });

    useEffect(() => {
        const units = [...new Set(baseRanking.map(c => c.unidadPolitica))];
        setPoliticalUnits(units);
        if (units.length > 0 && !params.fragmentationUnit) {
            setParams(p => ({ ...p, fragmentationUnit: units[0] }));
        }
         if (units.length > 0 && !params.coattailEffect.unit) {
            setParams(p => ({ ...p, coattailEffect: { ...p.coattailEffect, unit: units[0] } }));
        }
    }, [baseRanking, params.fragmentationUnit, params.coattailEffect.unit]);

    const handleInputChange = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };
    
    const handleCoattailChange = (key: keyof CoattailEffectConfig, value: string) => {
        setParams(prev => ({ ...prev, coattailEffect: { ...prev.coattailEffect, [key]: value }}));
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
    
    const addFactor = (factorType: 'localSupport' | 'campaignStrength', config: LocalSupportConfig | CampaignStrengthConfig) => {
        setParams(prev => {
            const existing = prev[factorType].filter((item: any) => item.unit !== config.unit);
            return { ...prev, [factorType]: [...existing, config] };
        });
    };
    
    const removeFactor = (factorType: 'localSupport' | 'campaignStrength', unit: string) => {
        setParams(prev => {
             const updated = prev[factorType].filter((item: any) => item.unit !== unit);
             return { ...prev, [factorType]: updated };
        });
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
                
                <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-medium text-gray-300">Factores Cuantitativos</legend>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="fragmentationUnit" className="block text-sm font-medium text-gray-300 mb-1">Unidad a Fragmentar</label>
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
                            <label htmlFor="numCandidates" className="block text-sm font-medium text-gray-300 mb-1">Dividir Votos Entre</label>
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

                 <fieldset className="border border-gray-600 p-4 rounded-md">
                    <legend className="px-2 font-medium text-gray-300">Factores Políticos</legend>
                    <p className="text-xs text-gray-400 mb-4">Aplica una penalización de votos (entre -15% y -20%) a los partidos que designes como 'de Gobierno'.</p>
                     <div className="grid grid-cols-2 gap-4" style={{ minHeight: '200px' }}>
                         <div>
                             <h4 className="font-semibold text-sm mb-2 text-center text-gray-300">Oposición / Independientes</h4>
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

                <fieldset className="border border-gray-600 p-4 rounded-md space-y-4">
                    <legend className="px-2 font-medium text-gray-300">Factores Estratégicos Cualitativos</legend>
                    
                    {/* Coattail Effect */}
                    <div className="bg-gray-700/50 p-3 rounded-md">
                         <div className="flex items-center gap-2 mb-2">
                            <StarIcon className="w-5 h-5 text-yellow-400"/>
                            <h4 className="font-semibold text-sm text-gray-300">Efecto Arrastre (Candidatura Principal)</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                             <select value={params.coattailEffect.unit} onChange={(e) => handleCoattailChange('unit', e.target.value)} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                                {politicalUnits.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                            </select>
                            <select value={params.coattailEffect.strength} onChange={(e) => handleCoattailChange('strength', e.target.value as CoattailEffectConfig['strength'])} disabled={disabled} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm focus:ring-brand-secondary focus:border-brand-secondary">
                                <option value="Nulo">Nulo (+0%)</option>
                                <option value="Moderado">Moderado (+15%)</option>
                                <option value="Fuerte">Fuerte (+25%)</option>
                            </select>
                        </div>
                    </div>

                    {/* Local Support & Campaign Strength */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Local Support */}
                        <div>
                             <div className="flex items-center gap-2 mb-2">
                                <BuildingOfficeIcon className="w-5 h-5 text-cyan-400"/>
                                <h4 className="font-semibold text-sm text-gray-300">Apoyo Estructural Local</h4>
                            </div>
                            <div className="bg-gray-700/50 p-2 rounded-md h-48 overflow-y-auto space-y-1">
                               {params.localSupport.map(s => (
                                   <div key={s.unit} className="flex items-center justify-between p-1.5 bg-cyan-900/50 rounded group text-xs">
                                       <span className="truncate pr-2" title={s.unit}>{s.unit}: <strong>{s.level}</strong></span>
                                       <button type="button" onClick={() => removeFactor('localSupport', s.unit)} disabled={disabled} className="... opacity-0 group-hover:opacity-100"><TrashIcon className="w-3 h-3 text-red-400"/></button>
                                   </div>
                               ))}
                            </div>
                            <button type="button" onClick={() => addFactor('localSupport', { unit: politicalUnits[0], level: 'Medio' })} disabled={disabled} className="text-xs text-cyan-400 hover:text-cyan-300 mt-1">+ Añadir/Modificar Partido</button>
                        </div>
                        {/* Campaign Strength */}
                        <div>
                             <div className="flex items-center gap-2 mb-2">
                                <SpeakerWaveIcon className="w-5 h-5 text-green-400"/>
                                <h4 className="font-semibold text-sm text-gray-300">Fuerza de Campaña</h4>
                            </div>
                            <div className="bg-gray-700/50 p-2 rounded-md h-48 overflow-y-auto space-y-1">
                                {params.campaignStrength.map(s => (
                                   <div key={s.unit} className="flex items-center justify-between p-1.5 bg-green-900/50 rounded group text-xs">
                                       <span className="truncate pr-2" title={s.unit}>{s.unit}: <strong>{s.level}</strong></span>
                                       <button type="button" onClick={() => removeFactor('campaignStrength', s.unit)} disabled={disabled} className="... opacity-0 group-hover:opacity-100"><TrashIcon className="w-3 h-3 text-red-400"/></button>
                                   </div>
                               ))}
                            </div>
                             <button type="button" onClick={() => addFactor('campaignStrength', { unit: politicalUnits[0], level: 'Media' })} disabled={disabled} className="text-xs text-green-400 hover:text-green-300 mt-1">+ Añadir/Modificar Partido</button>
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