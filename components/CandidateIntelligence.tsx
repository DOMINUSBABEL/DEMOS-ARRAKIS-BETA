
import React, { useState, useMemo } from 'react';
import AnalysisCard from './AnalysisCard';
import { FingerPrintIcon, LoadingSpinner, SparklesIcon, WarningIcon, ChartBarIcon, MapIcon, ShareIcon, BeakerIcon, ClipboardDocumentIcon, TableCellsIcon, ChevronDownIcon, ScaleIcon } from './Icons';
import { generateCandidateProfile, generateCandidateComparison, CandidateComparisonResult } from '../services/geminiService';
import { CandidateProfileResult, ElectoralDataset, PartyData, ProcessedElectionData } from '../types';
import { BarChart } from './Charts';

interface CandidateIntelligenceProps {
    datasets: ElectoralDataset[];
    onProjectAndSimulate: (projectedParties: PartyData[]) => void;
}

// Helper types for the breakdown view
interface LocationNode {
    name: string;
    type: 'municipio' | 'zona' | 'puesto';
    votes: number;
    children?: LocationNode[];
}

const CollapsibleNode: React.FC<{ node: LocationNode; level: number; totalVotes: number }> = ({ node, level, totalVotes }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = node.children && node.children.length > 0;
    const percentage = totalVotes > 0 ? (node.votes / totalVotes) * 100 : 0;

    // Define colors and icons based on level
    const colors = ['bg-brand-primary/10 border-brand-primary/30', 'bg-blue-500/10 border-blue-500/30', 'bg-purple-500/10 border-purple-500/30', 'bg-gray-800 border-gray-700'];
    const textColors = ['text-brand-primary', 'text-blue-400', 'text-purple-400', 'text-gray-400'];
    const currentBg = colors[Math.min(level, colors.length - 1)];
    const currentText = textColors[Math.min(level, textColors.length - 1)];

    return (
        <div className={`ml-${level * 4} mb-2`}>
            <div 
                className={`flex items-center justify-between p-3 rounded-lg border ${currentBg} cursor-pointer hover:bg-white/5 transition-colors`}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {hasChildren && (
                        <ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                    )}
                    {!hasChildren && <div className="w-4 h-4" />} {/* Spacer */}
                    
                    <span className={`font-mono font-bold text-sm ${currentText} uppercase`}>
                        {node.type === 'municipio' ? 'MUN: ' : node.type === 'zona' ? 'ZONA: ' : 'PUESTO: '}
                        {node.name}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="font-bold text-white font-mono">{node.votes.toLocaleString()}</span>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-white/50" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">{percentage.toFixed(1)}%</span>
                </div>
            </div>
            {isOpen && hasChildren && (
                <div className="mt-2 pl-4 border-l border-white/10 ml-4">
                    {node.children!.sort((a,b) => b.votes - a.votes).map((child, idx) => (
                        <CollapsibleNode key={idx} node={child} level={level + 1} totalVotes={node.votes} /> 
                    ))}
                </div>
            )}
        </div>
    );
};

const CandidateIntelligence: React.FC<CandidateIntelligenceProps> = ({ datasets, onProjectAndSimulate }) => {
    const [candidateName, setCandidateName] = useState('');
    const [candidateBName, setCandidateBName] = useState(''); // New for comparison
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<CandidateProfileResult | null>(null);
    const [comparison, setComparison] = useState<CandidateComparisonResult | null>(null); // New state
    const [error, setError] = useState<string | null>(null);
    const [localHistory, setLocalHistory] = useState<{ election: string; votes: number; party: string }[]>([]);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'forms' | 'comparison'>('profile');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidateName.trim()) return;

        setIsLoading(true);
        setError(null);
        setProfile(null);
        setComparison(null);
        setLocalHistory([]);
        setActiveTab('profile'); 

        try {
            // 1. Mining Internal Data
            const history: { election: string; votes: number; party: string }[] = [];
            
            datasets.forEach(ds => {
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

    const handleCompare = async () => {
        if (!candidateName || !candidateBName) return;
        setIsLoading(true);
        setError(null);
        setComparison(null);
        try {
            const result = await generateCandidateComparison(candidateName, candidateBName, context);
            setComparison(result);
        } catch (err: any) {
            setError(err.message || "Error al generar la comparación.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSimulate = () => {
        if (!profile || !profile.simulationParameters) return;
        
        const candidateParty: PartyData = {
            id: Date.now(), 
            name: candidateName.toUpperCase(),
            votes: profile.simulationParameters.suggestedVoteBase || 0,
            color: '#d97706' 
        };

        onProjectAndSimulate([candidateParty]);
    };

    const chartData = useMemo(() => {
        return localHistory.map(h => ({
            label: `${h.election} (${h.party})`,
            value: h.votes,
            color: '#3b82f6'
        }));
    }, [localHistory]);

    // --- LOGIC FOR FORMS BREAKDOWN ---
    const detailedBreakdown = useMemo(() => {
        if (!candidateName) return [];

        const breakdown: { election: string; totalVotes: number; tree: LocationNode[] }[] = [];

        datasets.forEach(ds => {
            const relevantRows = ds.processedData.filter(row => 
                row.Candidato.toLowerCase().includes(candidateName.toLowerCase()) || 
                (row.UnidadPolitica.toLowerCase() === candidateName.toLowerCase() && row.Candidato === 'SOLO POR LA LISTA')
            );

            if (relevantRows.length === 0) return;

            const totalVotes = relevantRows.reduce((sum, r) => sum + r.Votos, 0);
            
            const munMap = new Map<string, LocationNode>();

            relevantRows.forEach(row => {
                const munName = row.Municipio || row.Departamento || 'Desconocido'; 
                const zonaName = row.Zona || 'Zona Única';
                const puestoName = row.Puesto || 'Puesto Único';

                if (!munMap.has(munName)) {
                    munMap.set(munName, { name: munName, type: 'municipio', votes: 0, children: [] });
                }
                const munNode = munMap.get(munName)!;
                munNode.votes += row.Votos;

                let zonaNode = munNode.children!.find(c => c.name === zonaName);
                if (!zonaNode) {
                    zonaNode = { name: zonaName, type: 'zona', votes: 0, children: [] };
                    munNode.children!.push(zonaNode);
                }
                zonaNode.votes += row.Votos;

                let puestoNode = zonaNode.children!.find(c => c.name === puestoName);
                if (!puestoNode) {
                    puestoNode = { name: puestoName, type: 'puesto', votes: 0 };
                    zonaNode.children!.push(puestoNode);
                }
                puestoNode.votes += row.Votos;
            });

            breakdown.push({
                election: ds.name,
                totalVotes,
                tree: Array.from(munMap.values()).sort((a,b) => b.votes - a.votes)
            });
        });

        return breakdown;
    }, [candidateName, datasets]);


    return (
        <div className="space-y-8 animate-fade-in-up">
            <AnalysisCard
                title="Inteligencia de Candidatos (Perfil 360°)"
                explanation="Busca un candidato específico para analizar su desempeño histórico, ver su desglose territorial detallado (simulación de formularios E-24/E-26) y obtener un perfil de opinión generado por IA."
                icon={<FingerPrintIcon />}
                fullscreenable={false}
            >
                <div className="p-4 space-y-4">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">Nombre del Candidato Principal</label>
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
                </div>
                {error && (
                    <div className="m-4 flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}
            </AnalysisCard>

            {(profile || candidateName) && (
                <div className="space-y-6">
                    {/* Header */}
                    {profile && (
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
                                <p className="text-3xl font-bold text-brand-glow font-mono">{(profile.simulationParameters?.suggestedVoteBase || 0).toLocaleString('es-CO')}</p>
                                <p className="text-[10px] text-gray-500">Votos Estimados</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs Navigation */}
                    <div className="flex space-x-1 bg-dark-bg/50 p-1 rounded-lg border border-white/5 w-fit">
                        <button
                            onClick={() => setActiveTab('profile')}
                            disabled={!profile}
                            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'profile' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <FingerPrintIcon className="w-4 h-4" />
                            Perfil Estratégico
                        </button>
                        <button
                            onClick={() => setActiveTab('forms')}
                            disabled={!profile}
                            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'forms' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ClipboardDocumentIcon className="w-4 h-4" />
                            Rastro Electoral (Formularios)
                        </button>
                        <button
                            onClick={() => setActiveTab('comparison')}
                            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-all ${activeTab === 'comparison' ? 'bg-brand-primary text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ScaleIcon className="w-4 h-4" />
                            Comparar Candidatos
                        </button>
                    </div>

                    {/* CONTENT - STRATEGIC PROFILE */}
                    {activeTab === 'profile' && profile && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
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
                                    <AnalysisCard title="Historial Electoral Interno" explanation="Votos encontrados en los conjuntos de datos cargados actualmente." collapsible={false} icon={<ChartBarIcon />}>
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
                                                <span className="text-sm font-bold text-green-400">{(profile.simulationParameters?.suggestedVoteCeiling || 0).toLocaleString('es-CO')}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 h-1.5 rounded-full mb-3">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{width: '80%'}}></div>
                                            </div>
                                            
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400 uppercase">Piso (Min)</span>
                                                <span className="text-sm font-bold text-red-400">{(profile.simulationParameters?.suggestedVoteFloor || 0).toLocaleString('es-CO')}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 h-1.5 rounded-full">
                                                <div className="bg-red-500 h-1.5 rounded-full" style={{width: '40%'}}></div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-center">
                                                <p className="text-[10px] text-gray-500 uppercase">Volatilidad</p>
                                                <p className={`text-lg font-bold ${profile.simulationParameters?.volatility === 'Alta' ? 'text-red-400' : 'text-blue-400'}`}>
                                                    {profile.simulationParameters?.volatility || 'N/A'}
                                                </p>
                                            </div>
                                            <div className="bg-dark-bg p-3 rounded-lg border border-dark-border text-center">
                                                <p className="text-[10px] text-gray-500 uppercase">Tendencia</p>
                                                <p className={`text-lg font-bold ${profile.simulationParameters?.growthTrend === 'Positiva' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {profile.simulationParameters?.growthTrend || 'N/A'}
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
                                            Esto llevará al candidato al simulador como una lista independiente con {(profile.simulationParameters?.suggestedVoteBase || 0).toLocaleString()} votos.
                                        </p>
                                    </div>
                                </AnalysisCard>
                            </div>
                        </div>
                    )}

                    {/* CONTENT - ELECTORAL AUDIT / FORMS */}
                    {activeTab === 'forms' && (
                        <div className="space-y-6 animate-fade-in">
                            {detailedBreakdown.length > 0 ? (
                                detailedBreakdown.map((datasetResult, idx) => (
                                    <AnalysisCard 
                                        key={idx} 
                                        title={`Simulación E-26: ${datasetResult.election}`} 
                                        explanation="Desglose detallado de votos por jerarquía territorial (Municipio > Zona > Puesto). Esta vista simula la estructura de los formularios electorales oficiales E-26 (Municipal) y E-24 (Puesto)."
                                        collapsible
                                        defaultCollapsed={idx > 0}
                                        icon={<TableCellsIcon />}
                                    >
                                        <div className="p-2">
                                            <div className="bg-black/30 p-4 rounded-lg mb-4 flex justify-between items-center border border-white/5">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-widest">Total en Elección</p>
                                                    <p className="text-2xl font-bold text-white font-mono">{datasetResult.totalVotes.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="px-3 py-1 bg-blue-900/30 text-blue-400 text-xs font-bold rounded-full border border-blue-500/30">
                                                        {datasetResult.tree.length} Municipios
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                {datasetResult.tree.map((munNode, i) => (
                                                    <CollapsibleNode key={i} node={munNode} level={0} totalVotes={datasetResult.totalVotes} />
                                                ))}
                                            </div>
                                        </div>
                                    </AnalysisCard>
                                ))
                            ) : (
                                <div className="p-8 border border-dashed border-white/10 rounded-xl text-center bg-white/5">
                                    <ClipboardDocumentIcon className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                                    <h3 className="text-lg font-bold text-gray-300">No hay datos detallados disponibles</h3>
                                    <p className="text-sm text-gray-500 mt-2">
                                        No se encontró información de Municipios, Zonas o Puestos en los conjuntos de datos cargados para este candidato. 
                                        Asegúrate de cargar archivos que contengan estas columnas.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONTENT - COMPARISON */}
                    {activeTab === 'comparison' && (
                        <div className="space-y-6 animate-fade-in">
                            <AnalysisCard title="Comparador de Candidatos (Versus)" explanation="Enfrenta a dos candidatos para analizar sus probabilidades en un escenario competitivo.">
                                <div className="p-4">
                                    <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Candidato A (Principal)</label>
                                            <div className="w-full bg-black/40 border border-brand-primary/50 text-white rounded-lg p-3 font-mono">
                                                {candidateName}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center pb-2">
                                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">VS</span>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Candidato B (Rival)</label>
                                            <input 
                                                type="text" 
                                                value={candidateBName}
                                                onChange={(e) => setCandidateBName(e.target.value)}
                                                placeholder="Nombre del rival..."
                                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-3 focus:ring-red-500 focus:border-red-500"
                                            />
                                        </div>
                                        <button 
                                            onClick={handleCompare}
                                            disabled={isLoading || !candidateBName}
                                            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? <LoadingSpinner className="w-5 h-5"/> : <ScaleIcon className="w-5 h-5"/>}
                                            Comparar
                                        </button>
                                    </div>

                                    {comparison && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 relative">
                                            {/* Vertical divider */}
                                            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-white/10 -ml-px"></div>

                                            {/* Candidate A Column */}
                                            <div className="space-y-4">
                                                <div className="text-center pb-4 border-b border-white/5">
                                                    <h3 className="text-xl font-bold text-brand-primary">{candidateName}</h3>
                                                    <div className="mt-2 text-4xl font-mono font-bold text-white">{comparison.candidateA.probabilityScore}%</div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Probabilidad de Éxito</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-green-400 uppercase mb-2">Fortalezas</h4>
                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                                                        {comparison.candidateA.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Debilidades</h4>
                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                                                        {comparison.candidateA.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Candidate B Column */}
                                            <div className="space-y-4">
                                                <div className="text-center pb-4 border-b border-white/5">
                                                    <h3 className="text-xl font-bold text-red-500">{candidateBName}</h3>
                                                    <div className="mt-2 text-4xl font-mono font-bold text-white">{comparison.candidateB.probabilityScore}%</div>
                                                    <p className="text-xs text-gray-500 uppercase tracking-widest">Probabilidad de Éxito</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-green-400 uppercase mb-2">Fortalezas</h4>
                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                                                        {comparison.candidateB.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-bold text-red-400 uppercase mb-2">Debilidades</h4>
                                                    <ul className="list-disc pl-4 space-y-1 text-sm text-gray-300">
                                                        {comparison.candidateB.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Winner Summary */}
                                            <div className="md:col-span-2 mt-6 p-6 bg-gradient-to-r from-brand-primary/10 to-purple-600/10 rounded-xl border border-white/10 text-center">
                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Veredicto de la IA</h4>
                                                <p className="text-2xl font-bold text-brand-glow mb-2">Ganador Probable: {comparison.winner}</p>
                                                <p className="text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto">{comparison.winnerReason}</p>
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Factor Diferencial Clave:</span>
                                                    <p className="text-white font-medium mt-1">{comparison.keyDifferentiator}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AnalysisCard>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Add DatabaseIcon import if not available in context, reusing from existing imports
import { DatabaseIcon } from './Icons';

export default CandidateIntelligence;
