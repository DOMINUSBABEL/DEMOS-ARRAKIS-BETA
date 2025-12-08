
import React, { useState, useMemo, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { UserGroupIcon, LoadingSpinner, ScaleIcon, PlusIcon, TrashIcon, ChartBarIcon, FingerPrintIcon, CpuChipIcon, FilePdfIcon, ShareIcon } from './Icons';
import { generateCandidateComparison } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { CandidateComparisonResult, ComparisonScenario, CandidateAnalysis } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface ComparativeAnalysisProps {
    // No specific props needed as it manages its own state
}

const DEFAULT_CANDIDATES = [
    "101 Andres Guerra Hoyos",
    "102 Oscar Dario Pérez Pineda",
    "103 Lina Marcela Mena Cordova",
    "104 Federico Eduardo Hoyos Salazar",
    "105 Maria Teresa Montoya Álvarez",
    "106 Andres Felipe Gaviria Cano",
    "107 Juan David Zuluaga Zuluaga",
    "108 Yuliet Andrea Sanchez Carreño",
    "109 Julian Fernando Lopera Garzon",
    "110 John Jairo Berrio Lopez",
    "111 Ligia Estela Gil Perez",
    "112 Sergio Osvaldo Molina Perez",
    "113 Melissa Orrego Eusse",
    "114 Osbaldo Ángulo de la Rosa",
    "115 José Gregorio Orjuela Perez",
    "116 David Toledo Ospina",
    "117 Ana Ligia Mora Martínez"
];

const ScenarioChart: React.FC<{ scenarios: ComparisonScenario[], visibleCandidates: Set<string> }> = ({ scenarios, visibleCandidates }) => {
    // Extended color palette to support up to 20 distinct candidates clearly
    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16',
        '#d946ef', '#06b6d4', '#f97316', '#a855f7', '#22c55e',
        '#be123c', '#1e40af', '#047857', '#7e22ce', '#b45309'
    ];
    
    // Filter candidates based on visibility toggle
    const allCandidates = scenarios.length > 0 
        ? scenarios[0].voteProjections.map(vp => vp.candidateName)
        : [];
        
    const activeCandidates = allCandidates.filter(c => visibleCandidates.has(c));

    const data = scenarios.map(s => {
        const entry: any = { name: s.name, indecisos: s.swingVotes, desc: s.description };
        s.voteProjections.forEach(vp => {
            if (visibleCandidates.has(vp.candidateName)) {
                entry[vp.candidateName] = vp.votes;
            }
        });
        return entry;
    });

    return (
        <div className="h-[500px] w-full bg-black/20 p-4 rounded-xl border border-white/5">
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
                    {activeCandidates.map((candidate, idx) => (
                        <Bar 
                            key={candidate} 
                            dataKey={candidate} 
                            fill={candidateColors[allCandidates.indexOf(candidate) % candidateColors.length]} 
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

const AttributeRadarChart: React.FC<{ candidates: CandidateAnalysis[], visibleCandidates: Set<string> }> = ({ candidates, visibleCandidates }) => {
    const data = [
        { subject: 'Estructura', fullMark: 100 },
        { subject: 'Opinión', fullMark: 100 },
        { subject: 'Recursos', fullMark: 100 },
        { subject: 'Territorio', fullMark: 100 },
        { subject: 'Momentum', fullMark: 100 },
    ];

    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16',
        '#d946ef', '#06b6d4', '#f97316', '#a855f7', '#22c55e',
        '#be123c', '#1e40af', '#047857', '#7e22ce', '#b45309'
    ];

    const activeCandidates = candidates.filter(c => visibleCandidates.has(c.name));

    // Transform data for Recharts
    const chartData = data.map(dim => {
        const point: any = { subject: dim.subject, fullMark: 100 };
        activeCandidates.forEach(c => {
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
        <div className="h-[500px] w-full bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-widest mb-2">Radar de Atributos Competitivos</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {activeCandidates.map((candidate, idx) => ( 
                        <Radar
                            key={candidate.name}
                            name={candidate.name}
                            dataKey={candidate.name}
                            stroke={candidateColors[candidates.findIndex(c => c.name === candidate.name) % candidateColors.length]}
                            fill={candidateColors[candidates.findIndex(c => c.name === candidate.name) % candidateColors.length]}
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

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = () => {
    const [contenders, setContenders] = useState<string[]>(['', '']); 
    const [context, setContext] = useState('Análisis para Cámara de Representantes Antioquia 2026. Partido Centro Democrático.');
    const [isLoading, setIsLoading] = useState(false);
    const [comparison, setComparison] = useState<CandidateComparisonResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    
    // State to toggle candidate visibility in charts without deleting data
    const [visibleCandidates, setVisibleCandidates] = useState<Set<string>>(new Set());

    const handleUpdateContender = (index: number, value: string) => {
        const newContenders = [...contenders];
        newContenders[index] = value;
        setContenders(newContenders);
    };

    const handleAddContender = () => {
        if (contenders.length < 25) { // Increased limit
            setContenders([...contenders, '']);
        }
    };

    const handleRemoveContender = (index: number) => {
        if (contenders.length > 2) {
            setContenders(contenders.filter((_, i) => i !== index));
        }
    };

    const handleLoadSampleData = () => {
        setContenders([...DEFAULT_CANDIDATES]);
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
            // Initialize all candidates as visible
            setVisibleCandidates(new Set(result.candidates.map(c => c.name)));
        } catch (err: any) {
            setError(err.message || "Error al generar la comparación.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPdf = () => {
        if (resultsRef.current) {
            generateStrategicReportPDF(resultsRef.current, `Informe_Comparativo_Lista.pdf`);
        }
    };

    const toggleCandidateVisibility = (name: string) => {
        setVisibleCandidates(prev => {
            const newSet = new Set(prev);
            if (newSet.has(name)) {
                newSet.delete(name);
            } else {
                newSet.add(name);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <AnalysisCard 
                title="Comparador Avanzado de Listas (War Games)" 
                explanation="Módulo diseñado para el análisis masivo de candidatos (hasta 20+). Ideal para evaluar listas completas a corporaciones (Cámara/Asamblea/Concejo) y simular la competencia interna por curules."
                icon={<UserGroupIcon />}
                fullscreenable={false}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wide">Candidatos en Disputa</h4>
                            <p className="text-xs text-gray-500 mt-1">Ingresa los nombres manualmente o carga la lista de muestra.</p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleLoadSampleData}
                                className="px-3 py-1.5 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded-md text-xs font-bold hover:bg-blue-800/50 transition-colors flex items-center gap-2"
                            >
                                <UserGroupIcon className="w-4 h-4" />
                                Cargar Muestra (Cámara ANT)
                            </button>
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

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">Contexto de la Simulación</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                        {contenders.map((contender, index) => (
                            <div key={index} className="flex gap-2 items-center bg-white/5 p-2 rounded-lg border border-white/5 hover:border-brand-primary/30 transition-colors">
                                <span className="text-xs font-mono text-gray-500 w-6 text-center">{index + 1}</span>
                                <input 
                                    type="text" 
                                    value={contender}
                                    onChange={(e) => handleUpdateContender(index, e.target.value)}
                                    placeholder={`Candidato ${index + 1}`}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-gray-600"
                                />
                                {contenders.length > 2 && (
                                    <button 
                                        onClick={() => handleRemoveContender(index)} 
                                        className="text-gray-500 hover:text-red-400 p-1"
                                        title="Eliminar"
                                    >
                                        <TrashIcon className="w-4 h-4"/>
                                    </button>
                                )}
                            </div>
                        ))}
                        {contenders.length < 25 && (
                            <button 
                                onClick={handleAddContender}
                                className="h-full min-h-[42px] border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:text-brand-primary hover:border-brand-primary flex items-center justify-center gap-2 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Añadir</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button 
                            onClick={handleCompare}
                            disabled={isLoading || contenders.filter(c => c.trim()).length < 2}
                            className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50 shadow-glow hover:shadow-[0_0_20px_rgba(217,119,6,0.4)]"
                        >
                            {isLoading ? <LoadingSpinner className="w-5 h-5"/> : <ScaleIcon className="w-5 h-5"/>}
                            Ejecutar War Games (Simulación Masiva)
                        </button>
                    </div>
                </div>
            </AnalysisCard>

            {comparison && (
                <div className="mt-8 relative animate-fade-in" data-pdf-target="true">
                    
                    {/* VISIBILITY CONTROL PANEL */}
                    <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <FingerPrintIcon className="w-4 h-4" />
                            Panel de Visualización (Filtrar Gráficas)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <button 
                                onClick={() => setVisibleCandidates(new Set(comparison.candidates.map(c => c.name)))}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white border border-white/10"
                            >
                                Ver Todos
                            </button>
                            <button 
                                onClick={() => setVisibleCandidates(new Set())}
                                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white border border-white/10"
                            >
                                Ocultar Todos
                            </button>
                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                            {comparison.candidates.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleCandidateVisibility(c.name)}
                                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                                        visibleCandidates.has(c.name) 
                                        ? 'bg-brand-primary/20 border-brand-primary text-brand-primary font-bold shadow-[0_0_10px_rgba(217,119,6,0.2)]' 
                                        : 'bg-transparent border-white/10 text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {c.name.split(' ').slice(0, 2).join(' ')}...
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={resultsRef} data-pdf-target="true">
                        {/* LIST VERDICT SECTION */}
                        <div className="mb-8 p-8 bg-gradient-to-r from-brand-primary/10 to-blue-900/20 rounded-xl border border-white/10 text-center shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-brand-secondary" />
                                Veredicto de Inteligencia Artificial (Lista Completa)
                            </h4>
                            <p className="text-base text-gray-200 leading-relaxed max-w-5xl mx-auto italic border-l-4 border-brand-primary pl-6 py-2 bg-black/20 rounded text-justify">
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
                                <ScenarioChart scenarios={comparison.scenarios} visibleCandidates={visibleCandidates} />
                            </div>
                            {/* Radar Chart */}
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FingerPrintIcon className="w-4 h-4 text-brand-secondary"/>
                                    Radar de Capacidades Competitivas
                                </h4>
                                <AttributeRadarChart candidates={comparison.candidates} visibleCandidates={visibleCandidates} />
                            </div>
                        </div>

                        {/* DETAILED EXECUTIVE REPORT CARDS */}
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                            <ShareIcon className="w-5 h-5 text-brand-secondary" />
                            Informe Ejecutivo Detallado
                        </h4>
                        <div className="space-y-6">
                            {comparison.candidates.map((cand, idx) => (
                                <DetailedCandidateCard key={idx} candidate={cand} index={idx} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparativeAnalysis;
