
import React, { useState } from 'react';
import AnalysisCard from './AnalysisCard';
import { MegaphoneIcon, LoadingSpinner, UserGroupIcon, ChartBarIcon, MapIcon, SparklesIcon, WarningIcon } from './Icons';
import { generateMarketingStrategy } from '../services/geminiService';
import { MarketingStrategyResult } from '../types';

const MarketingStrategy: React.FC = () => {
    const [targetName, setTargetName] = useState('');
    const [targetType, setTargetType] = useState<'candidate' | 'party'>('candidate');
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [strategy, setStrategy] = useState<MarketingStrategyResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetName.trim() || !context.trim()) {
            setError("Por favor completa todos los campos requeridos.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setStrategy(null);

        try {
            const result = await generateMarketingStrategy(targetName, targetType, context);
            setStrategy(result);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al generar la estrategia.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <AnalysisCard
                title="Marketing de Guerra: Captura de Voto Elástico"
                explanation="Este módulo genera estrategias de marketing político de alto impacto enfocadas exclusivamente en capturar el voto indeciso (elástico) para maximizar la probabilidad de curul. Funciona para candidatos o partidos, hayan participado antes o no."
                icon={<MegaphoneIcon />}
                fullscreenable={false}
            >
                <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Nombre del Objetivo</label>
                            <input
                                type="text"
                                value={targetName}
                                onChange={(e) => setTargetName(e.target.value)}
                                placeholder="Ej: Juan Pérez o Partido Renovación"
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Tipo de Objetivo</label>
                            <div className="flex space-x-4 mt-2">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={targetType === 'candidate'}
                                        onChange={() => setTargetType('candidate')}
                                        className="form-radio text-brand-primary focus:ring-brand-primary bg-dark-bg border-dark-border"
                                    />
                                    <span className="ml-2 text-sm text-dark-text-primary">Candidato</span>
                                </label>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={targetType === 'party'}
                                        onChange={() => setTargetType('party')}
                                        className="form-radio text-brand-primary focus:ring-brand-primary bg-dark-bg border-dark-border"
                                    />
                                    <span className="ml-2 text-sm text-dark-text-primary">Partido/Movimiento</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Contexto Estratégico (Breve)</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Describe la situación actual: ¿Es nuevo? ¿Es gobierno u oposición? ¿A qué demografía apunta? Ej: Candidato joven de centro, busca renovar el concejo frente a maquinaria tradicional."
                            rows={3}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isLoading ? 'Generando Estrategia...' : 'Generar Plan de Batalla'}
                    </button>
                </form>
                {error && (
                    <div className="m-4 flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </AnalysisCard>

            {strategy && (
                <div className="space-y-6">
                    {/* Header Strategy Summary */}
                    <div className="glass-panel p-6 rounded-xl border border-brand-primary/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-mono uppercase tracking-widest">{targetName}</h2>
                        <div className="inline-block px-3 py-1 bg-brand-primary/20 border border-brand-primary/50 rounded text-brand-primary text-xs font-bold uppercase mb-4">
                            Perfil Estratégico
                        </div>
                        <p className="text-dark-text-primary leading-relaxed text-sm md:text-base">
                            {strategy.candidateProfile}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Column 1: The Elastic Voter (Persona) */}
                        <div className="lg:col-span-1 space-y-6">
                            <AnalysisCard title="Avatar: El Votante Elástico" explanation="Perfil del votante indeciso que definirá la elección." collapsible={false} icon={<UserGroupIcon />}>
                                <div className="p-4 space-y-4">
                                    <div className="text-center mb-4">
                                        <div className="w-20 h-20 mx-auto bg-gray-700 rounded-full flex items-center justify-center border-2 border-dashed border-gray-500 text-gray-400">
                                            <span className="text-2xl">?</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-brand-secondary mb-1">Demografía Clave</h4>
                                        <p className="text-sm text-dark-text-primary">{strategy.elasticVoterPersona.demographics}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-red-400 mb-1">Dolores & Miedos</h4>
                                        <ul className="list-disc pl-4 text-sm text-dark-text-secondary space-y-1">
                                            {strategy.elasticVoterPersona.painPoints.map((point, i) => <li key={i}>{point}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-green-400 mb-1">Intereses</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {strategy.elasticVoterPersona.interests.map((int, i) => (
                                                <span key={i} className="px-2 py-1 bg-white/5 rounded text-xs text-gray-300">{int}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AnalysisCard>
                        </div>

                        {/* Column 2: The Message (Pillars) */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnalysisCard title="Matriz de Mensaje y Narrativa" explanation="Ejes discursivos diseñados para conectar racional y emocionalmente." collapsible={false} icon={<MegaphoneIcon />}>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white border-b border-blue-500/30 pb-2 mb-2">Pilares Racionales (Lógica)</h4>
                                        {strategy.campaignPillars.rational.map((item, i) => (
                                            <div key={i} className="p-3 bg-blue-900/20 border-l-2 border-blue-500 rounded-r text-sm text-gray-300">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-white border-b border-purple-500/30 pb-2 mb-2">Pilares Emocionales (Sentimiento)</h4>
                                        {strategy.campaignPillars.emotional.map((item, i) => (
                                            <div key={i} className="p-3 bg-purple-900/20 border-l-2 border-purple-500 rounded-r text-sm text-gray-300">
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="md:col-span-2 mt-4">
                                        <h4 className="text-xs font-bold uppercase text-brand-glow mb-3 text-center tracking-widest">Slogans de Campaña Sugeridos</h4>
                                        <div className="flex flex-wrap justify-center gap-4">
                                            {strategy.campaignPillars.slogans.map((slogan, i) => (
                                                <div key={i} className="px-6 py-3 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold text-lg rounded-full shadow-lg transform hover:scale-105 transition-transform">
                                                    "{slogan}"
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </AnalysisCard>

                            <AnalysisCard title="Tácticas de Despliegue" explanation="Acciones concretas para tierra y aire (digital)." collapsible={false} icon={<MapIcon />}>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-white mb-3">
                                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                            Estrategia Digital (Aire)
                                        </h4>
                                        <ul className="space-y-2">
                                            {strategy.tactics.digital.map((tactic, i) => (
                                                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                                    <span className="text-cyan-500 mt-1">▹</span>
                                                    {tactic}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-bold text-white mb-3">
                                            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                            Estrategia Territorial (Tierra)
                                        </h4>
                                        <ul className="space-y-2">
                                            {strategy.tactics.territory.map((tactic, i) => (
                                                <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                                    <span className="text-emerald-500 mt-1">▹</span>
                                                    {tactic}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </AnalysisCard>
                        </div>
                    </div>

                    {/* KPIs Footer */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {strategy.kpis.map((kpi, i) => (
                            <div key={i} className="bg-dark-card border border-white/5 p-4 rounded-lg text-center">
                                <p className="text-xs text-dark-text-secondary uppercase tracking-wider mb-1">{kpi.metric}</p>
                                <p className="text-lg font-bold text-white font-mono">{kpi.target}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingStrategy;
