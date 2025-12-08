
import React, { useState, useMemo, useEffect, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { FingerPrintIcon, LoadingSpinner, SparklesIcon, WarningIcon, ChartBarIcon, MapIcon, ShareIcon, BeakerIcon, ClipboardDocumentIcon, TableCellsIcon, ChevronDownIcon, ScaleIcon, PlusIcon, TrashIcon, UserGroupIcon, FilePdfIcon, CpuChipIcon, DatabaseIcon } from './Icons';
import { generateCandidateProfile, generateCandidateComparison } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { CandidateProfileResult, ElectoralDataset, PartyData, ProcessedElectionData, CandidateComparisonResult, ComparisonScenario, HistoricalDataset, CandidateAnalysis } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface CandidateIntelligenceProps {
    datasets: ElectoralDataset[];
    activeDataset: HistoricalDataset | null;
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
                    {!hasChildren && <div className="w-4 h-4" />} 
                    
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

const ScenarioChart: React.FC<{ scenarios: ComparisonScenario[] }> = ({ scenarios }) => {
    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16',
        '#d946ef', '#06b6d4', '#f97316', '#a855f7', '#22c55e',
        '#be123c', '#1e40af', '#047857', '#7e22ce', '#b45309'
    ];
    
    const candidates = scenarios.length > 0 
        ? scenarios[0].voteProjections.map(vp => vp.candidateName)
        : [];

    const data = scenarios.map(s => {
        const entry: any = { name: s.name, indecisos: s.swingVotes, desc: s.description };
        s.voteProjections.forEach(vp => {
            entry[vp.candidateName] = vp.votes;
        });
        return entry;
    });

    return (
        <div className="h-96 w-full mt-6 bg-black/20 p-4 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" tick={{fontSize: 12}} />
                    <YAxis stroke="#9ca3af" tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
                        formatter={(value: number) => value.toLocaleString('es-CO')}
                        labelStyle={{ color: '#d1d5db', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    {candidates.map((candidate, idx) => (
                        <Bar 
                            key={candidate} 
                            dataKey={candidate} 
                            fill={candidateColors[idx % candidateColors.length]} 
                            name={candidate} 
                            radius={[4, 4, 0, 0]} 
                        />
                    ))}
                    <Bar dataKey="indecisos" fill="#9ca3af" name="Votos en Disputa" stackId="a" radius={[4, 4, 0, 0]} fillOpacity={0.3} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const AttributeRadarChart: React.FC<{ candidates: CandidateAnalysis[] }> = ({ candidates }) => {
    const data = [
        { subject: 'Estructura', fullMark: 100 },
        { subject: 'Opinión', fullMark: 100 },
        { subject: 'Recursos', fullMark: 100 },
        { subject: 'Territorio', fullMark: 100 },
        { subject: 'Momentum', fullMark: 100 },
    ];

    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
    ];

    // Transform data for Recharts
    const chartData = data.map(dim => {
        const point: any = { subject: dim.subject, fullMark: 100 };
        candidates.forEach(c => {
            const key = dim.subject.toLowerCase() === 'estructura' ? 'structure' :
                        dim.subject.toLowerCase() === 'opinión' ? 'opinion' :
                        dim.subject.toLowerCase() === 'recursos' ? 'resources' :
                        dim.subject.toLowerCase() === 'territorio' ? 'territory' : 'momentum';
            // @ts-ignore
            point[c.name] = c.attributes[key];
        });
        return point;
    });

    return (
        <div className="h-[450px] w-full bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-widest mb-2">Radar de Atributos Competitivos</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {candidates.slice(0, 5).map((candidate, idx) => ( // Limit to 5 for readability on radar
                        <Radar
                            key={candidate.name}
                            name={candidate.name}
                            dataKey={candidate.name}
                            stroke={candidateColors[idx % candidateColors.length]}
                            fill={candidateColors[idx % candidateColors.length]}
                            fillOpacity={0.1}
                        />
                    ))}
                    <Legend />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const DetailedCandidateCard: React.FC<{ candidate: CandidateAnalysis; index: number }> = ({ candidate, index }) => (
    <div className="break-inside-avoid bg-white dark:bg-[#1a1410] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-6">
        <header className="flex justify-between items-start border-b border-gray-200 dark:border-white/10 pb-4 mb-4">
            <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary mb-1 block">Candidato #{index + 1}</span>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-sans">{candidate.name}</h3>
            </div>
            <div className="text-right">
                <div className="text-3xl font-bold text-brand-primary">{candidate.probabilityScore}%</div>
                <div className="text-[9px] uppercase text-gray-500 font-bold">Probabilidad</div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Trayectoria Política</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.trajectory}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-red-500 dark:text-red-400 mb-1">Escándalos y Ruido</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.scandals}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-green-500 dark:text-green-400 mb-1">Gestión Destacada</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.management}</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <h4 className="text-xs font-bold uppercase text-blue-500 dark:text-blue-400 mb-1">Estructura y Apoyos</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.structure}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-purple-500 dark:text-purple-400 mb-1">Fortaleza Territorial</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.territory}</p>
                </div>
                <div>
                    <h4 className="text-xs font-bold uppercase text-orange-500 dark:text-orange-400 mb-1">Dinámica Interna (Rivales/Aliados)</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed text-justify">{candidate.alliances}</p>
                </div>
            </div>
        </div>
        
        {/* Mini Attributes Bar for quick glance */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/5 grid grid-cols-5 gap-2">
            {Object.entries(candidate.attributes).map(([key, value]) => (
                <div key={key} className="text-center">
                    <div className="text-[9px] uppercase text-gray-500 mb-1">{key}</div>
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-primary" style={{width: `${value}%`}}></div>
                    </div>
                    <div className="text-[10px] font-bold mt-1 text-gray-700 dark:text-gray-300">{value}</div>
                </div>
            ))}
        </div>
    </div>
);

const CandidateIntelligence: React.FC<CandidateIntelligenceProps> = ({ datasets, activeDataset, onProjectAndSimulate }) => {
    const [candidateName, setCandidateName] = useState('');
    const [context, setContext] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<CandidateProfileResult | null>(null);
    const [comparison, setComparison] = useState<CandidateComparisonResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [localHistory, setLocalHistory] = useState<{ election: string; votes: number; party: string }[]>([]);
    
    const resultsRef = useRef<HTMLDivElement>(null);
    const [contenders, setContenders] = useState<string[]>(['', '']); 

    const [activeTab, setActiveTab] = useState<'profile' | 'forms' | 'comparison'>('profile');

    useEffect(() => {
        if (activeTab === 'comparison' && candidateName && contenders[0] === '' && contenders[1] === '') {
            const newContenders = [...contenders];
            newContenders[0] = candidateName;
            setContenders(newContenders);
        }
    }, [activeTab, candidateName]); 

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!candidateName.trim()) return;

        setIsLoading(true);
        setError(null);
        setProfile(null);
        setLocalHistory([]);
        setActiveTab('profile'); 

        try {
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
            const result = await generateCandidateProfile(candidateName, context, history);
            setProfile(result);
        } catch (err: any) {
            setError(err.message || "Error al analizar el candidato.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateContender = (index: number, value: string) => {
        const newContenders = [...contenders];
        newContenders[index] = value;
        setContenders(newContenders);
    };

    const handleAddContender = () => {
        if (contenders.length < 20) {
            setContenders([...contenders, '']);
        }
    };

    const handleRemoveContender = (index: number) => {
        if (contenders.length > 2) {
            setContenders(contenders.filter((_, i) => i !== index));
        }
    };

    const handleLoadTopCandidates = () => {
        if (!activeDataset) return;
        const topCandidates = activeDataset.baseRanking
            .slice(0, 17)
            .map(c => c.candidato);
        setContenders(topCandidates);
    };

    const handleCompare = async () => {
        const validCandidates = contenders.filter(c => c.trim() !== '');
        if (validCandidates.length < 2) {
            setError("Debes ingresar al menos 2 candidatos para comparar.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setComparison(null);
        try {
            const result = await generateCandidateComparison(validCandidates, context);
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
    
    const handleExportPdf = () => {
        if (resultsRef.current) {
            generateStrategicReportPDF(resultsRef.current, `Informe_Inteligencia_Candidato.pdf`);
        }
    };

    const chartData = useMemo(() => {
        return localHistory.map(h => ({
            label: `${h.election} (${h.party})`,
            value: h.votes,
            color: '#3b82f6'
        }));
    }, [localHistory]);

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

            {(profile || candidateName || activeTab === 'comparison') && (
                <div className="space-y-6">
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
                            Comparar Candidatos (Versus)
                        </button>
                    </div>

                    <div ref={resultsRef} className="bg-white p-4 rounded-lg hidden" data-pdf-target="true">
                    </div>

                    {activeTab === 'profile' && profile && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in" ref={resultsRef} data-pdf-target="true">
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
                                        
                                        <div className="pt-4 border-t border-white/10 mt-4">
                                            <button
                                                onClick={handleExportPdf}
                                                className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-xs border border-gray-600 transition-colors"
                                            >
                                                <FilePdfIcon className="w-4 h-4 text-red-400" />
                                                Exportar Informe Ejecutivo
                                            </button>
                                        </div>
                                    </div>
                                </AnalysisCard>
                            </div>
                        </div>
                    )}

                    {activeTab === 'forms' && (
                        <div className="space-y-6 animate-fade-in">
                            {detailedBreakdown.length > 0 ? (
                                detailedBreakdown.map((datasetResult, idx) => (
                                    <AnalysisCard 
                                        key={idx} 
                                        title={`Simulación E-26: ${datasetResult.election}`} 
                                        explanation="Desglose detallado de votos por jerarquía territorial."
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
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'comparison' && (
                        <div className="space-y-6 animate-fade-in" ref={resultsRef} data-pdf-target="true">
                            <AnalysisCard title="Comparador de Candidatos (War Games)" explanation="Simulación de enfrentamiento directo e informes de Due Diligence.">
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Candidatos en Disputa</h4>
                                        <div className="flex gap-2">
                                            {activeDataset && (
                                                <button 
                                                    onClick={handleLoadTopCandidates}
                                                    className="px-3 py-1.5 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded-md text-xs font-bold hover:bg-blue-800/50 transition-colors flex items-center gap-2"
                                                >
                                                    <UserGroupIcon className="w-4 h-4" />
                                                    Cargar Top 17
                                                </button>
                                            )}
                                            {comparison && (
                                                <button 
                                                    onClick={handleExportPdf}
                                                    className="px-3 py-1.5 bg-green-900/30 text-green-300 border border-green-500/30 rounded-md text-xs font-bold hover:bg-green-800/50 transition-colors flex items-center gap-2"
                                                >
                                                    <FilePdfIcon className="w-4 h-4" />
                                                    Exportar Informe
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                        {contenders.map((contender, index) => (
                                            <div key={index} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Candidato {index + 1}</label>
                                                    <input 
                                                        type="text" 
                                                        value={contender}
                                                        onChange={(e) => handleUpdateContender(index, e.target.value)}
                                                        placeholder={`Nombre Candidato ${index + 1}`}
                                                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                                                    />
                                                </div>
                                                {contenders.length > 2 && (
                                                    <button 
                                                        onClick={() => handleRemoveContender(index)} 
                                                        className="p-2 mb-[2px] bg-red-900/30 text-red-400 hover:text-red-200 rounded border border-red-500/30"
                                                        title="Eliminar candidato"
                                                    >
                                                        <TrashIcon className="w-5 h-5"/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {contenders.length < 20 && (
                                            <div className="flex items-end">
                                                <button 
                                                    onClick={handleAddContender}
                                                    className="w-full h-[42px] border-2 border-dashed border-gray-600 rounded-md text-gray-400 hover:text-brand-primary hover:border-brand-primary flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <PlusIcon className="w-5 h-5" />
                                                    <span className="text-sm font-bold">Añadir Candidato</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={handleCompare}
                                            disabled={isLoading || contenders.filter(c => c.trim()).length < 2}
                                            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? <LoadingSpinner className="w-5 h-5"/> : <ScaleIcon className="w-5 h-5"/>}
                                            Ejecutar Simulación Avanzada
                                        </button>
                                    </div>

                                    {comparison && (
                                        <div className="mt-8 relative animate-fade-in" data-pdf-target="true">
                                            {/* LIST VERDICT SECTION */}
                                            <div className="mb-8 p-6 bg-gradient-to-r from-brand-primary/10 to-blue-900/20 rounded-xl border border-white/10 text-center shadow-lg relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                                                    <CpuChipIcon className="w-5 h-5 text-brand-secondary" />
                                                    Veredicto de Inteligencia Artificial (Lista Completa)
                                                </h4>
                                                <p className="text-sm text-gray-200 leading-relaxed max-w-4xl mx-auto italic border-l-4 border-brand-primary pl-4 py-2 bg-black/20 rounded">
                                                    "{comparison.listVerdict}"
                                                </p>
                                            </div>

                                            {/* VISUALIZATIONS */}
                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                                                {/* Scenario Chart */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <ChartBarIcon className="w-4 h-4 text-brand-secondary"/>
                                                        Proyecciones de Votos (3 Escenarios)
                                                    </h4>
                                                    <ScenarioChart scenarios={comparison.scenarios} />
                                                </div>
                                                {/* Radar Chart */}
                                                <div>
                                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <FingerPrintIcon className="w-4 h-4 text-brand-secondary"/>
                                                        Radar de Capacidades Competitivas
                                                    </h4>
                                                    <AttributeRadarChart candidates={comparison.candidates} />
                                                </div>
                                            </div>

                                            {/* DETAILED EXECUTIVE REPORT CARDS */}
                                            <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Informe Ejecutivo Detallado por Candidato</h4>
                                            <div className="space-y-6">
                                                {comparison.candidates.map((cand, idx) => (
                                                    <DetailedCandidateCard key={idx} candidate={cand} index={idx} />
                                                ))}
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

export default CandidateIntelligence;
