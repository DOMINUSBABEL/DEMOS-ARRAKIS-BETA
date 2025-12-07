
import React, { useState, useMemo } from 'react';
import AnalysisCard from './AnalysisCard';
import { FingerPrintIcon, LoadingSpinner, SparklesIcon, WarningIcon, ChartBarIcon, MapIcon, ShareIcon, BeakerIcon } from './Icons';
import { generateCandidateProfile } from '../services/geminiService';
import { CandidateProfileResult, ElectoralDataset, PartyData } from '../types';
import { BarChart } from './Charts';

interface CandidateIntelligenceProps {
    datasets: ElectoralDataset[];
    onProjectAndSimulate: (projectedParties: PartyData[]) => void;
}

const CandidateIntelligence: React.FC<CandidateIntelligenceProps> = ({ datasets, onProjectAndSimulate }) => {
    const [candidateName, setCandidateName] = useState('');
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<CandidateProfileResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [localHistory, setLocalHistory] = useState<{ election: string; votes: number; party: string }[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidateName.trim()) return;

        setIsLoading(true);
        setError(null);
        setProfile(null);
        setLocalHistory([]);

        try {
            // 1. Mining Internal Data
            const history: { election: string; votes: number; party: string }[] = [];
            
            datasets.forEach(ds => {
                // Fuzzy matching for candidate name
                const matches = ds.processedData.filter(row => 
                    row.Candidato.toLowerCase().includes(candidateName.toLowerCase()) && 
                    !row.Candidato.toLowerCase().includes('solo por la lista')
                );

                matches.forEach(match => {
                    history.push({
                        election: ds.name,
                        votes: match.Votos,
                        party: match.UnidadPolitica
                    });
                });
            });

            setLocalHistory(history);

            // 2. AI Profile Generation
            const result = await generateCandidateProfile(candidateName, context, history);
            setProfile(result);

        } catch (err: any) {
            setError(err.message || "Error al analizar el candidato.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulate = () => {
        if (!profile) return;
        
        // Create a PartyData object representing this candidate/list
        // We use the "Suggested Vote Base" from the AI analysis
        const candidateParty: PartyData = {
            id: Date.now(), // Temporary ID
            name: candidateName.toUpperCase(),
            votes: profile.simulationParameters.suggestedVoteBase,
            color: '#d97706' // Brand primary color
        };

        // We need to inject this into the D'Hondt simulator.
        // The most robust way is to pass it as a single-item array or append to existing.
        // However, onProjectAndSimulate usually overrides the simulator state.
        // To make it useful, users usually want to see this candidate AGAINST others.
        // For now, we will create a simulation with JUST this candidate to start, 
        // OR ideally, we'd append. But `onProjectAndSimulate` in App/Dashboard typically SETS the state.
        // Let's rely on the user to use the "Manual Entry" or "Party Settings" in D'Hondt to combine.
        // BUT to be more helpful, we will pass this single entry. 
        // Ideally, Dashboard should handle merging if we want to "add" to current scenario.
        // Given the interface, let's pass it and let the simulator render it. 
        
        onProjectAndSimulate([candidateParty]);
    };

    const chartData = useMemo(() => {
        return localHistory.map(h => ({
            label: `${h.election} (${h.party})`,
            value: h.votes,
            color: '#3b82f6'
        }));
    }, [localHistory]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <AnalysisCard
                title="Inteligencia de Candidatos (Perfil 360°)"
                explanation="Busca un candidato específico para analizar su desempeño histórico en tus bases de datos, y complementa con un perfil de opinión y gestión generado por IA."
                icon={<FingerPrintIcon />}
                fullscreenable={false}
            >
                <form onSubmit={handleSearch} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Nombre del Candidato</label>
                        <input
                            type="text"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Ej: Fulanito de Tal"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Contexto (Opcional)</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Ej: Para Cámara Antioquia 2026"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !candidateName}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isLoading ? 'Analizando...' : 'Generar Perfil'}
                    </button>
                </form>
                {error && (
                    <div className="m-4 flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </AnalysisCard>

            {profile && (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="glass-panel p-6 rounded-xl border border-brand-primary/30 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/20 border border-brand-primary/50 rounded-full text-brand-primary text-xs font-bold uppercase mb-2">
                                <FingerPrintIcon className="w-4 h-4"/>
                                Perfil Verificado
                            </div>
                            <h2 className="text-3xl font-bold text-white font-mono uppercase tracking-tight">{candidateName}</h2>
                            <p className="text-dark-text-secondary text-sm max-w-2xl mt-2">{profile.overview}</p>
                        </div>
                        <div className="text-right bg-black/40 p-4 rounded-lg border border-white/5">
                            <p className="text-xs text-dark-text-secondary uppercase tracking-widest mb-1">Proyección Base</p>
                            <p className="text-3xl font-bold text-brand-glow font-mono">{profile.simulationParameters.suggestedVoteBase.toLocaleString('es-CO')}</p>
                            <p className="text-[10px] text-gray-500">Votos Estimados</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Col: Analysis */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnalysisCard title="Análisis de Opinión Pública" explanation="Sentimiento general y percepción pública basada en búsquedas recientes." collapsible={false} icon={<ShareIcon />}>
                                <div className="p-4 text-sm text-dark-text-primary leading-relaxed whitespace-pre-wrap">
                                    {profile.opinionAnalysis}
                                </div>
                            </AnalysisCard>
                            
                            <AnalysisCard title="Trayectoria y Gestión" explanation="Resumen de logros, cargos previos y desempeño administrativo o legislativo." collapsible={false} icon={<ChartBarIcon />}>
                                <div className="p-4 text-sm text-dark-text-primary leading-relaxed whitespace-pre-wrap">
                                    {profile.managementAnalysis}
                                </div>
                            </AnalysisCard>

                            {localHistory.length > 0 ? (
                                <AnalysisCard title="Historial Electoral Interno" explanation="Votos encontrados en los conjuntos de datos cargados actualmente." collapsible={false} icon={<DatabaseIcon />}>
                                    <BarChart data={chartData} />
                                </AnalysisCard>
                            ) : (
                                <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-dark-text-muted text-sm">
                                    No se encontraron registros de votación en los archivos cargados.
                                </div>
                            )}
                        </div>

                        {/* Right Col: Simulation Parameters */}
                        <div className="lg:col-span-1 space-y-6">
                            <AnalysisCard title="Parámetros de Simulación" explanation="Variables sugeridas por la IA para utilizar en los modelos predictivos." collapsible={false} icon={<BeakerIcon />}>
                                <div className="p-4 space-y-4">
                                    <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-gray-400 uppercase">Techo (Max)</span>
                                            <span className="text-sm font-bold text-green-400">{profile.simulationParameters.suggestedVoteCeiling.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 h-1.5 rounded-full mb-3">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{width: '80%'}}></div>
                                        </div>
                                        
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-gray-400 uppercase">Piso (Min)</span>
                                            <span className="text-sm font-bold text-red-400">{profile.simulationParameters.suggestedVoteFloor.toLocaleString('es-CO')}</span>
                                        </div>
                                        <div className="w-full bg-gray-700 h-1.5 rounded-full">
                                            <div className="bg-red-500 h-1.5 rounded-full" style={{width: '40%'}}></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Volatilidad</p>
                                            <p className={`text-lg font-bold ${profile.simulationParameters.volatility === 'Alta' ? 'text-red-400' : 'text-blue-400'}`}>
                                                {profile.simulationParameters.volatility}
                                            </p>
                                        </div>
                                        <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-center">
                                            <p className="text-[10px] text-gray-500 uppercase">Tendencia</p>
                                            <p className={`text-lg font-bold ${profile.simulationParameters.growthTrend === 'Positiva' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                {profile.simulationParameters.growthTrend}
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={handleSimulate}
                                        className="w-full mt-4 bg-gradient-to-r from-brand-secondary to-brand-primary text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-glow transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        <SparklesIcon className="w-5 h-5" />
                                        Simular en D'Hondt
                                    </button>
                                    <p className="text-[10px] text-center text-gray-500 mt-2">
                                        Esto llevará al candidato al simulador como una lista independiente con {profile.simulationParameters.suggestedVoteBase.toLocaleString()} votos.
                                    </p>
                                </div>
                            </AnalysisCard>

                            {profile.sources && profile.sources.length > 0 && (
                                <div className="p-4 bg-dark-bg/50 rounded-lg border border-dark-border">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Fuentes de Inteligencia</h4>
                                    <ul className="space-y-2">
                                        {profile.sources.map((source, index) => source.web && (
                                            <li key={index} className="text-xs truncate">
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline flex items-center gap-2">
                                                    <span className="w-1 h-1 bg-cyan-500 rounded-full"></span>
                                                    {source.web.title}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Add DatabaseIcon import if not available in context, reusing from existing imports
import { DatabaseIcon } from './Icons';

export default CandidateIntelligence;
