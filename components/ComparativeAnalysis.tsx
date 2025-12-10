
import React, { useState, useRef, useMemo } from 'react';
import AnalysisCard from './AnalysisCard';
import { UserGroupIcon, LoadingSpinner, ScaleIcon, PlusIcon, TrashIcon, ChartBarIcon, FingerPrintIcon, CpuChipIcon, FilePdfIcon, BuildingOfficeIcon, ShareIcon, WarningIcon, FunnelIcon, ArrowsUpDownIcon, ChevronDownIcon, ClipboardDocumentIcon, MegaphoneIcon } from './Icons';
import { generateCandidateComparison } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { CandidateComparisonResult, ComparisonScenario, CandidateAnalysis, PartyMetrics, VoterAvatar, CandidateAvatar } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';

interface ComparativeAnalysisProps {
    // No specific props needed as it manages its own state
}

const SAMPLE_DATASETS = {
    "sample1": {
        label: "Muestra 1: CD Antioquia",
        candidates: [
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
        ]
    },
    "sample2": {
        label: "Muestra 2: D&C / NL",
        candidates: [
            "101 Rafael Nanclares (D&C)",
            "102 Hanna Escobar (NL)",
            "103 Marcela Eusse (MIRA)",
            "104 Marcelo Betancur (NL)",
            "105 Eberto Saez (NL)",
            "106 Gilberto Torres (NL)",
            "107 Nelson Carmona (NL)",
            "108 Daniel Ospina (D&C)",
            "109 Cynthia Folleco (NL)",
            "110 Alejandro Arcila (D&C)",
            "111 Camilo Quintero (NL)",
            "112 Juan Camilo Salazar (D&C)",
            "113 Vladimir Ramírez (NL)",
            "114 Edilma Berrio (NL)",
            "115 Victor Correa (D&C)",
            "116 Tatiana Hidalgo (D&C)",
            "117 Alejandra Sánchez (D&C)"
        ]
    }
};

// --- Types for Sorting ---
type SortOption = 'probability' | 'name' | 'structure' | 'territory' | 'trajectory' | 'management' | 'internal' | 'scandal';

// --- Custom Tooltips for Enhanced Visualization ---

const CustomScenarioTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        // Sort payload by value descending to show winners first
        const sortedPayload = [...payload].sort((a: any, b: any) => b.value - a.value);
        
        return (
            <div className="bg-[#0f0a06]/95 border border-brand-primary/30 p-4 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl min-w-[280px] z-50">
                <p className="text-brand-glow text-xs font-mono uppercase tracking-widest mb-3 pb-2 border-b border-white/10 font-bold">{label}</p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {sortedPayload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-2 overflow-hidden w-full">
                                <div className="w-2 h-2 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                                <span className={`font-medium truncate ${entry.name === 'Votos en Disputa' ? 'text-gray-400 italic' : 'text-gray-200'}`} style={{maxWidth: '160px'}}>
                                    {entry.name}
                                </span>
                            </div>
                            <span className="font-mono font-bold text-white text-xs whitespace-nowrap">
                                {typeof entry.value === 'number' ? entry.value.toLocaleString('es-CO') : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CustomRadarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const sortedPayload = [...payload].sort((a: any, b: any) => b.value - a.value);
        return (
            <div className="bg-[#0f0a06]/95 border border-brand-primary/30 p-3 rounded-xl shadow-lg backdrop-blur-xl z-50">
                <p className="text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Factor: {label}</p>
                {sortedPayload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs mb-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-gray-300 w-32 truncate">{entry.name}:</span>
                        <span className="text-white font-bold font-mono">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Helper for Score Color ---
const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]';
    if (score >= 50) return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
    return 'bg-gradient-to-r from-red-600 to-red-400';
};

const getScoreTextColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 dark:text-emerald-400';
    if (score >= 50) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-red-700 dark:text-red-400';
};

// --- Attribute Row Component for Detailed Card ---
const AttributeRow: React.FC<{ 
    label: string; 
    score: number; 
    weight: string; 
    text: string; 
    colorClass: string; 
    barColor: string; 
}> = ({ label, score, weight, text, colorClass, barColor }) => {
    // Determine context style based on score
    // Updated for Light/Dark mode compatibility
    const contextStyle = score >= 70 
        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/10 dark:border-emerald-500/20 dark:text-emerald-100' 
        : score >= 40 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-500/20 dark:text-yellow-100' 
            : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-500/20 dark:text-red-100';

    return (
        <div className="mb-6 last:mb-0 group">
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2">
                    <span className={`w-1 h-4 rounded-full ${barColor.replace('bg-gradient-to-r from-', 'bg-').split(' ')[0]}`}></span>
                    <h4 className="text-xs font-black uppercase text-gray-600 dark:text-gray-300 tracking-widest">{label}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-500 font-mono border border-gray-200 dark:border-white/5">Weight: {weight}</span>
                </div>
                <span className={`text-sm font-bold font-mono ${colorClass}`}>{score}/100</span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-black/40 h-2 rounded-full mb-3 overflow-hidden border border-gray-300 dark:border-white/5">
                <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{width: `${score}%`}}></div>
            </div>
            
            {/* Technical Justification Block */}
            <div className={`p-3 rounded-md border text-xs leading-relaxed font-sans text-justify ${contextStyle} transition-all hover:bg-opacity-80 dark:hover:bg-opacity-20`}>
                <p className="opacity-90">
                    <strong className="uppercase text-[9px] tracking-wider opacity-70 block mb-1">Justificación Técnica:</strong>
                    {text}
                </p>
            </div>
        </div>
    );
};

// --- Avatar Component ---
const AvatarPair: React.FC<{ voter: VoterAvatar, candidate: CandidateAvatar }> = ({ voter, candidate }) => (
    <div className="min-w-[280px] bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors flex flex-col gap-3">
        {/* Voter Side */}
        <div className="pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-blue-500/10 text-blue-600">
                    <UserGroupIcon className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold uppercase text-blue-600 tracking-wider">Votante #{voter.id}</span>
            </div>
            <h5 className="text-xs font-bold text-gray-800 mb-1 truncate" title={voter.archetype}>{voter.archetype}</h5>
            <p className="text-[10px] text-gray-500 leading-tight line-clamp-2" title={voter.demographics}>{voter.demographics}</p>
            <p className="text-[10px] text-gray-400 mt-1 italic line-clamp-1">Dolor: {voter.painPoint}</p>
        </div>
        
        {/* Connection Icon */}
        <div className="flex justify-center -my-4 relative z-10">
            <div className="bg-brand-primary rounded-full p-1 border-2 border-white shadow-sm">
                <ArrowsUpDownIcon className="w-3 h-3 text-white" />
            </div>
        </div>

        {/* Candidate Side */}
        <div className="pt-2">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-brand-primary/10 text-brand-primary">
                    <MegaphoneIcon className="w-3 h-3" />
                </div>
                <span className="text-[10px] font-bold uppercase text-brand-primary tracking-wider">Ángulo #{candidate.id}</span>
            </div>
            <h5 className="text-xs font-bold text-gray-800 mb-1 truncate" title={candidate.archetype}>{candidate.archetype}</h5>
            <p className="text-[10px] text-gray-500 leading-tight line-clamp-2" title={candidate.messaging_angle}>{candidate.messaging_angle}</p>
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Estilo: {candidate.visual_style}</p>
        </div>
    </div>
);


const DetailedCandidateCard: React.FC<{ candidate: CandidateAnalysis; index: number }> = ({ candidate, index }) => {
    
    return (
        <div className="break-inside-avoid bg-white dark:bg-[#15100d] p-0 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-8 transition-transform hover:scale-[1.005] overflow-hidden">
            {/* Header: Candidate Identity & Probability */}
            <header className="flex flex-col md:flex-row justify-between items-stretch border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gradient-to-r dark:from-black/40 dark:to-transparent">
                <div className="p-6 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded text-[10px] font-bold uppercase tracking-widest">
                            Candidato #{index + 1}
                        </span>
                        {candidate.probabilityScore > 80 && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                <ScaleIcon className="w-3 h-3" /> Alta Probabilidad
                            </span>
                        )}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{candidate.name}</h3>
                    
                    {/* Calculated Base Display */}
                    <div className="mt-3 flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-brand-primary/5 border border-brand-primary/20 rounded-lg">
                            <span className="text-[10px] text-brand-primary uppercase font-bold tracking-wider block">Base Electoral Calculada (X)</span>
                            <span className="text-lg font-mono font-bold text-brand-primary">
                                {candidate.calculatedBase ? candidate.calculatedBase.toLocaleString('es-CO') : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-black/40 p-6 border-l border-gray-200 dark:border-white/10 min-w-[180px] flex flex-col justify-center items-end">
                    <div className={`text-4xl font-black font-mono ${getScoreTextColor(candidate.probabilityScore)} tracking-tighter`}>
                        {candidate.probabilityScore}%
                    </div>
                    <div className="text-[10px] uppercase text-gray-500 font-bold tracking-widest mt-1">Probabilidad de Curul</div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Column 1: Political Assets (Positive Drivers) */}
                <div className="p-6 border-r border-gray-200 dark:border-white/10 space-y-6">
                    <h5 className="text-xs font-bold text-brand-primary uppercase tracking-[0.2em] mb-4 border-b border-brand-primary/20 pb-2 flex items-center gap-2">
                        <CpuChipIcon className="w-4 h-4" />
                        Auditoría de Activos Políticos
                    </h5>

                    <AttributeRow 
                        label="Estructura & Maquinaria" 
                        score={candidate.scoring.structureScore} 
                        weight="30%" 
                        text={candidate.structure} 
                        colorClass={getScoreTextColor(candidate.scoring.structureScore)}
                        barColor={getScoreColor(candidate.scoring.structureScore)}
                    />

                    <AttributeRow 
                        label="Fortaleza Territorial" 
                        score={candidate.scoring.territoryScore} 
                        weight="20%" 
                        text={candidate.territory} 
                        colorClass={getScoreTextColor(candidate.scoring.territoryScore)}
                        barColor={getScoreColor(candidate.scoring.territoryScore)}
                    />

                    <AttributeRow 
                        label="Dinámica Interna" 
                        score={candidate.scoring.internalDynamicsScore} 
                        weight="20%" 
                        text={candidate.alliances} 
                        colorClass={getScoreTextColor(candidate.scoring.internalDynamicsScore)}
                        barColor={getScoreColor(candidate.scoring.internalDynamicsScore)}
                    />
                </div>

                {/* Column 2: Qualitative Metrics & Risk (Soft Power & Liabilities) */}
                <div className="p-6 space-y-6 bg-white dark:bg-white/[0.02]">
                    <h5 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4 border-b border-blue-500/20 pb-2 flex items-center gap-2">
                        <ClipboardDocumentIcon className="w-4 h-4" />
                        Métricas Cualitativas y Riesgo
                    </h5>

                    <AttributeRow 
                        label="Trayectoria & Opinión" 
                        score={candidate.scoring.trajectoryScore} 
                        weight="15%" 
                        text={candidate.trajectory} 
                        colorClass={getScoreTextColor(candidate.scoring.trajectoryScore)}
                        barColor={getScoreColor(candidate.scoring.trajectoryScore)}
                    />

                    <AttributeRow 
                        label="Gestión & Resultados" 
                        score={candidate.scoring.managementScore} 
                        weight="15%" 
                        text={candidate.management} 
                        colorClass={getScoreTextColor(candidate.scoring.managementScore)}
                        barColor={getScoreColor(candidate.scoring.managementScore)}
                    />

                    {/* Risk Section is Special */}
                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="text-xs font-black uppercase text-red-600 dark:text-red-400 tracking-widest flex items-center gap-2">
                                <WarningIcon className="w-4 h-4" /> Penalización por Riesgo
                            </h4>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded font-mono border border-red-200 dark:border-red-500/30">
                                -{candidate.scoring.scandalPenalty} pts
                            </span>
                        </div>
                        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-500/20 dark:text-red-200/80 text-xs leading-relaxed font-sans text-justify">
                            <strong className="uppercase text-[9px] tracking-wider opacity-70 block mb-1 text-red-600 dark:text-red-400">Análisis de Vulnerabilidad:</strong>
                            {candidate.scandals}
                        </div>
                    </div>
                </div>
            </div>

            {/* Strategy Pipeline Section */}
            {candidate.pipeline && (
                <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/30">
                    <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4" />
                        Pipeline Estratégico (3 Fases)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h6 className="text-[10px] font-bold text-blue-600 uppercase mb-2">1. Extracción & Diagnóstico</h6>
                            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                                {candidate.pipeline.phase1_extraction.slice(0,3).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <h6 className="text-[10px] font-bold text-purple-600 uppercase mb-2">2. Ejecución de Precisión</h6>
                            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                                {candidate.pipeline.phase2_execution.slice(0,3).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h6 className="text-[10px] font-bold text-green-600 uppercase mb-2">3. Conexión & Conversión</h6>
                            <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                                {candidate.pipeline.phase3_conversion.slice(0,3).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Voter Avatars Section - Horizontal Scroll */}
            {candidate.voterAvatars && candidate.voterAvatars.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-black/20">
                    <div className="flex justify-between items-center mb-4">
                        <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" />
                            Matriz de Match (10 vs 10)
                        </h5>
                        <span className="text-[10px] text-gray-500 italic">Desliza para ver todos</span>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar snap-x">
                        {candidate.voterAvatars.map((voter, idx) => {
                            const candidateAvatar = candidate.candidateAvatars && candidate.candidateAvatars[idx] 
                                ? candidate.candidateAvatars[idx] 
                                : { id: 0, archetype: "N/A", messaging_angle: "N/A", visual_style: "N/A", target_voter_ids: [] };
                            
                            return (
                                <div key={idx} className="snap-center">
                                    <AvatarPair voter={voter} candidate={candidateAvatar} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

const ScenarioChart: React.FC<{ scenarios: ComparisonScenario[], visibleCandidates: Set<string> }> = ({ scenarios, visibleCandidates }) => {
    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16',
        '#d946ef', '#06b6d4', '#f97316', '#a855f7', '#22c55e',
        '#be123c', '#1e40af', '#047857', '#7e22ce', '#b45309'
    ];
    
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
        <div className="h-[500px] w-full bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#6b7280" 
                        tick={{fontSize: 11, fontWeight: 'bold'}} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={10}
                    />
                    <YAxis 
                        stroke="#6b7280" 
                        tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} 
                        tick={{fontSize: 10}} 
                        axisLine={false} 
                        tickLine={false}
                    />
                    <Tooltip content={<CustomScenarioTooltip />} cursor={{fill: 'rgba(0,0,0,0.03)'}} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#6b7280' }} />
                    {activeCandidates.map((candidate, idx) => (
                        <Bar 
                            key={candidate} 
                            dataKey={candidate} 
                            fill={candidateColors[allCandidates.indexOf(candidate) % candidateColors.length]} 
                            name={candidate} 
                            radius={[2, 2, 0, 0]}
                            stackId={undefined} // Side by side bars for comparison
                            maxBarSize={60}
                        />
                    ))}
                    <Bar dataKey="indecisos" fill="#9ca3af" name="Votos en Disputa" radius={[2, 2, 0, 0]} fillOpacity={0.3} maxBarSize={60} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

const DetailedScenarioBreakdown: React.FC<{ scenarios: ComparisonScenario[], metrics?: PartyMetrics }> = ({ scenarios, metrics }) => {
    // Generate colors
    const getBarColor = (name: string, index: number) => {
        if (name === 'VOTO POR LOGO/LISTA') return '#6b7280'; // Gray for Logo
        const colors = [
            '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
            '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16'
        ];
        return colors[index % colors.length];
    };

    if (!metrics) return null;

    return (
        <div className="space-y-8">
            {scenarios.map((scenario, sIdx) => {
                // Prepare Data: Combine candidates + Logo
                const data = [
                    ...scenario.voteProjections.map(vp => ({ 
                        name: vp.candidateName, 
                        votes: vp.votes,
                        isLogo: false
                    })),
                    { 
                        name: 'VOTO POR LOGO/LISTA', 
                        votes: metrics.logoVotes, // Using static logo votes, could be scaled if scenario implies specific turnout change
                        isLogo: true
                    }
                ].sort((a, b) => b.votes - a.votes);

                // Calculate dynamic height based on number of items
                const height = Math.max(400, data.length * 35);

                return (
                    <div key={sIdx} className="bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/5">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                            <div>
                                <h4 className="text-lg font-bold text-brand-primary uppercase tracking-widest">{scenario.name}</h4>
                                <p className="text-xs text-gray-500 mt-1">{scenario.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-brand-primary uppercase">Total Proyectado</span>
                                <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                    {(data.reduce((sum, item) => sum + item.votes, 0)).toLocaleString('es-CO')}
                                </p>
                            </div>
                        </div>
                        
                        <div style={{ width: '100%', height: `${height}px` }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={data}
                                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                                    <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#4b5563" 
                                        tick={{ fontSize: 11, width: 200 }} 
                                        width={180}
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(0,0,0,0.03)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-xl">
                                                        <p className="text-xs text-gray-500 mb-1 font-mono uppercase">{d.name}</p>
                                                        <p className="text-lg font-bold text-gray-900 font-mono">{d.votes.toLocaleString('es-CO')} votos</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="votes" barSize={18} radius={[0, 4, 4, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={getBarColor(entry.name, index)} 
                                                fillOpacity={entry.isLogo ? 0.6 : 1}
                                                stroke={entry.isLogo ? '#9ca3af' : 'none'}
                                                strokeWidth={entry.isLogo ? 1 : 0}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ListCompositionChart: React.FC<{ metrics: PartyMetrics }> = ({ metrics }) => {
    if (!metrics) return null;
    
    const data = [
        { name: 'Votos Candidatos', value: metrics.candidateVotesSubtotal, color: '#3b82f6' },
        { name: 'Votos por Logo/Lista', value: metrics.logoVotes, color: '#9ca3af' }
    ];

    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-2 rounded shadow-lg text-xs text-gray-800">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p>{payload[0].value.toLocaleString('es-CO')} votos</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-black/20 p-6 rounded-xl border border-gray-200 dark:border-white/10 mb-8">
            <h4 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-brand-secondary" />
                Composición de Votación (Lista vs. Logo)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Votos Candidatos</p>
                        <p className="text-2xl font-bold text-gray-900 font-mono">{metrics.candidateVotesSubtotal.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-blue-600 font-bold mt-1">{(100 - metrics.logoPercentage).toFixed(1)}% del total</p>
                    </div>
                    <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Votos Solo por Lista/Logo</p>
                        <p className="text-2xl font-bold text-gray-900 font-mono">{metrics.logoVotes.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-gray-600 font-bold mt-1">{metrics.logoPercentage.toFixed(1)}% del total</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Proyección Total Lista</p>
                        <span className="text-xl text-gray-900 font-bold font-mono">{metrics.totalListVotes.toLocaleString('es-CO')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AttributeRadarChart: React.FC<{ candidates: CandidateAnalysis[], visibleCandidates: Set<string> }> = ({ candidates, visibleCandidates }) => {
    const data = [
        { subject: 'Estructura', fullMark: 100 },
        { subject: 'Territorio', fullMark: 100 },
        { subject: 'Trayectoria', fullMark: 100 },
        { subject: 'Gestión', fullMark: 100 },
        { subject: 'Cohesión', fullMark: 100 },
    ];

    const candidateColors = [
        '#d97706', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', 
        '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#84cc16',
        '#d946ef', '#06b6d4', '#f97316', '#a855f7', '#22c55e',
        '#be123c', '#1e40af', '#047857', '#7e22ce', '#b45309'
    ];

    const activeCandidates = candidates.filter(c => visibleCandidates.has(c.name));

    const chartData = data.map(dim => {
        const point: any = { subject: dim.subject, fullMark: 100 };
        activeCandidates.forEach(c => {
            const scores = c.scoring;
            let val = 0;
            switch(dim.subject) {
                case 'Estructura': val = scores.structureScore; break;
                case 'Territorio': val = scores.territoryScore; break;
                case 'Trayectoria': val = scores.trajectoryScore; break;
                case 'Gestión': val = scores.managementScore; break;
                case 'Cohesión': val = scores.internalDynamicsScore; break;
            }
            // @ts-ignore
            point[c.name] = val;
        });
        return point;
    });

    return (
        <div className="h-[500px] w-full bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
            <h4 className="text-sm font-bold text-center text-gray-500 uppercase tracking-widest mb-2">Radar de Capacidades Políticas</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#e5e7eb" strokeWidth={1} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {activeCandidates.map((candidate, idx) => ( 
                        <Radar
                            key={candidate.name}
                            name={candidate.name}
                            dataKey={candidate.name}
                            stroke={candidateColors[candidates.findIndex(c => c.name === candidate.name) % candidateColors.length]}
                            strokeWidth={2.5}
                            fill={candidateColors[candidates.findIndex(c => c.name === candidate.name) % candidateColors.length]}
                            fillOpacity={0.05}
                            dot={{ r: 3, fillOpacity: 1 }}
                        />
                    ))}
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Tooltip content={<CustomRadarTooltip />} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const ComparativeAnalysis: React.FC<ComparativeAnalysisProps> = () => {
    const [contenders, setContenders] = useState<string[]>(['', '']); 
    const [context, setContext] = useState('Análisis basado en Proyección Cámara Antioquia 2026 - Escenario A (Lista Abierta).');
    const [isLoading, setIsLoading] = useState(false);
    const [comparison, setComparison] = useState<CandidateComparisonResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    
    // State to toggle candidate visibility in charts without deleting data
    const [visibleCandidates, setVisibleCandidates] = useState<Set<string>>(new Set());

    // Sorting and Filtering State
    const [sortBy, setSortBy] = useState<SortOption>('probability');
    const [sortDesc, setSortDesc] = useState(true);
    const [minProbFilter, setMinProbFilter] = useState(0);
    const [isSampleMenuOpen, setIsSampleMenuOpen] = useState(false);

    const handleUpdateContender = (index: number, value: string) => {
        const newContenders = [...contenders];
        newContenders[index] = value;
        setContenders(newContenders);
    };

    const handleAddContender = () => {
        if (contenders.length < 25) { 
            setContenders([...contenders, '']);
        }
    };

    const handleRemoveContender = (index: number) => {
        if (contenders.length > 2) {
            setContenders(contenders.filter((_, i) => i !== index));
        }
    };

    const handleLoadSampleData = (key: keyof typeof SAMPLE_DATASETS) => {
        setContenders([...SAMPLE_DATASETS[key].candidates]);
        setIsSampleMenuOpen(false);
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

    // Filter and Sort Candidates
    const sortedAndFilteredCandidates = useMemo(() => {
        if (!comparison) return [];

        let result = comparison.candidates.filter(c => visibleCandidates.has(c.name));

        // Filter by Probability
        if (minProbFilter > 0) {
            result = result.filter(c => c.probabilityScore >= minProbFilter);
        }

        // Sort
        result.sort((a, b) => {
            let valA: number | string = 0;
            let valB: number | string = 0;

            switch (sortBy) {
                case 'probability':
                    valA = a.probabilityScore;
                    valB = b.probabilityScore;
                    break;
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'structure':
                    valA = a.scoring.structureScore;
                    valB = b.scoring.structureScore;
                    break;
                case 'territory':
                    valA = a.scoring.territoryScore;
                    valB = b.scoring.territoryScore;
                    break;
                case 'trajectory':
                    valA = a.scoring.trajectoryScore;
                    valB = b.scoring.trajectoryScore;
                    break;
                case 'management':
                    valA = a.scoring.managementScore;
                    valB = b.scoring.managementScore;
                    break;
                case 'internal':
                    valA = a.scoring.internalDynamicsScore;
                    valB = b.scoring.internalDynamicsScore;
                    break;
                case 'scandal':
                    valA = a.scoring.scandalPenalty;
                    valB = b.scoring.scandalPenalty;
                    break;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
            }
            // @ts-ignore
            return sortDesc ? valB - valA : valA - valB;
        });

        return result;
    }, [comparison, visibleCandidates, sortBy, sortDesc, minProbFilter]);


    return (
        <div className="space-y-8 animate-fade-in-up">
            <AnalysisCard 
                title="Comparador Avanzado de Listas (War Games)" 
                explanation="Módulo diseñado para el análisis masivo de candidatos (hasta 20+). Ideal para evaluar listas completas a corporaciones (Cámara/Asamblea/Concejo) y simular la competencia interna por curules. Incluye desglose de voto preferente vs. voto por logo."
                icon={<UserGroupIcon />}
                fullscreenable={false}
            >
                <div className="p-4">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Candidatos en Disputa</h4>
                            <p className="text-xs text-gray-500 mt-1">Ingresa los nombres manualmente o carga la lista de muestra.</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsSampleMenuOpen(!isSampleMenuOpen)}
                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-md text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-2"
                                >
                                    <UserGroupIcon className="w-4 h-4" />
                                    Cargar Muestra
                                    <ChevronDownIcon className="w-3 h-3" />
                                </button>
                                {isSampleMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-50 overflow-hidden">
                                        {Object.entries(SAMPLE_DATASETS).map(([key, data]) => (
                                            <button
                                                key={key}
                                                onClick={() => handleLoadSampleData(key as keyof typeof SAMPLE_DATASETS)}
                                                className="block w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                            >
                                                {data.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {comparison && (
                                <button 
                                    onClick={handleExportPdf}
                                    className="px-3 py-1.5 bg-green-50 text-green-600 border border-green-200 rounded-md text-xs font-bold hover:bg-green-100 transition-colors flex items-center gap-2"
                                >
                                    <FilePdfIcon className="w-4 h-4" />
                                    Exportar Informe
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider font-mono">Contexto de la Simulación</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary transition-all text-gray-900"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                        {contenders.map((contender, index) => (
                            <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200 hover:border-brand-primary/50 transition-colors">
                                <span className="text-xs font-mono text-gray-500 w-6 text-center">{index + 1}</span>
                                <input 
                                    type="text" 
                                    value={contender}
                                    onChange={(e) => handleUpdateContender(index, e.target.value)}
                                    placeholder={`Candidato ${index + 1}`}
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-400"
                                />
                                {contenders.length > 2 && (
                                    <button 
                                        onClick={() => handleRemoveContender(index)} 
                                        className="text-gray-400 hover:text-red-500 p-1"
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
                                className="h-full min-h-[42px] border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:text-brand-primary hover:border-brand-primary flex items-center justify-center gap-2 transition-colors"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase">Añadir</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t border-gray-100">
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
                    
                    {/* VISIBILITY & FILTERING CONTROL PANEL */}
                    <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100 pb-4">
                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                <FingerPrintIcon className="w-4 h-4" />
                                Panel de Visualización (Filtrar Gráficas)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setVisibleCandidates(new Set(comparison.candidates.map(c => c.name)))}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 border border-gray-200 transition-colors"
                                >
                                    Ver Todos
                                </button>
                                <button 
                                    onClick={() => setVisibleCandidates(new Set())}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-700 border border-gray-200 transition-colors"
                                >
                                    Ocultar Todos
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto custom-scrollbar">
                            {comparison.candidates.map((c, i) => (
                                <button
                                    key={i}
                                    onClick={() => toggleCandidateVisibility(c.name)}
                                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                                        visibleCandidates.has(c.name) 
                                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary font-bold' 
                                        : 'bg-transparent border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    {c.name.split(' ').slice(0, 2).join(' ')}...
                                </button>
                            ))}
                        </div>
                    </div>

                    <div ref={resultsRef} data-pdf-target="true">
                        {/* LIST VERDICT SECTION */}
                        <div className="mb-8 p-8 bg-gradient-to-r from-blue-50 to-white rounded-xl border border-blue-100 text-center shadow-md relative overflow-hidden">
                            <h4 className="text-sm font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                                <CpuChipIcon className="w-5 h-5" />
                                Veredicto de Inteligencia Artificial (Lista Completa)
                            </h4>
                            <p className="text-base text-gray-700 leading-relaxed max-w-5xl mx-auto italic border-l-4 border-brand-primary pl-6 py-2 bg-white rounded text-justify shadow-sm">
                                "{comparison.listVerdict}"
                            </p>
                        </div>

                        {/* LIST COMPOSITION */}
                        {comparison.partyMetrics && <ListCompositionChart metrics={comparison.partyMetrics} />}

                        {/* VISUALIZATIONS */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                            {/* Scenario Chart */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ChartBarIcon className="w-4 h-4 text-brand-secondary"/>
                                    Proyecciones de Votos (3 Escenarios)
                                </h4>
                                <ScenarioChart scenarios={comparison.scenarios} visibleCandidates={visibleCandidates} />
                            </div>
                            {/* Radar Chart */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FingerPrintIcon className="w-4 h-4 text-brand-secondary"/>
                                    Radar de Capacidades Políticas
                                </h4>
                                <AttributeRadarChart candidates={comparison.candidates} visibleCandidates={visibleCandidates} />
                            </div>
                        </div>

                        {/* DETAILED SCENARIO BREAKDOWN */}
                        {comparison.partyMetrics && (
                            <>
                                <h4 className="text-lg font-bold text-gray-800 uppercase tracking-widest mb-6 border-b border-gray-200 pb-2 flex items-center gap-3">
                                    <ChartBarIcon className="w-5 h-5 text-brand-secondary" />
                                    Desglose Detallado de Escenarios
                                </h4>
                                <DetailedScenarioBreakdown scenarios={comparison.scenarios} metrics={comparison.partyMetrics} />
                            </>
                        )}

                        {/* SORTING & FILTERING TOOLBAR FOR LIST */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-6 mt-8 sticky top-0 z-20 backdrop-blur-md">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <FunnelIcon className="w-5 h-5 text-brand-primary" />
                                <div className="flex flex-col w-full">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Filtrar por Probabilidad Mínima</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="90" 
                                            step="5" 
                                            value={minProbFilter} 
                                            onChange={(e) => setMinProbFilter(parseInt(e.target.value))}
                                            className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                        />
                                        <span className="text-xs font-bold text-brand-primary w-8">{minProbFilter}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex flex-col flex-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Ordenar Por</label>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                                    >
                                        <option value="probability">Probabilidad General</option>
                                        <option value="structure">Estructura y Maquinaria</option>
                                        <option value="territory">Fortaleza Territorial</option>
                                        <option value="trajectory">Trayectoria Política</option>
                                        <option value="management">Gestión y Resultados</option>
                                        <option value="internal">Dinámica Interna</option>
                                        <option value="scandal">Nivel de Riesgo (Escándalos)</option>
                                        <option value="name">Nombre (Alfabético)</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={() => setSortDesc(!sortDesc)}
                                    className="p-2 mt-4 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200 transition-colors"
                                    title={sortDesc ? "Orden Descendente" : "Orden Ascendente"}
                                >
                                    <ArrowsUpDownIcon className={`w-4 h-4 text-gray-600 transition-transform ${sortDesc ? 'rotate-0' : 'rotate-180'}`} />
                                </button>
                            </div>
                        </div>

                        {/* DETAILED EXECUTIVE REPORT CARDS */}
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-6">
                            <h4 className="text-lg font-bold text-gray-800 uppercase tracking-widest flex items-center gap-3">
                                <ShareIcon className="w-5 h-5 text-brand-secondary" />
                                Auditoría Técnica Individual
                            </h4>
                            <div className="px-3 py-1 bg-gray-100 rounded text-[10px] text-gray-500 font-mono border border-gray-200 flex items-center gap-2">
                                <ScaleIcon className="w-3 h-3" />
                                Metodología de Ponderación Activa
                            </div>
                        </div>
                        <div className="space-y-6">
                            {sortedAndFilteredCandidates.length > 0 ? (
                                sortedAndFilteredCandidates.map((cand, idx) => (
                                    <DetailedCandidateCard key={cand.name} candidate={cand} index={idx} />
                                ))
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                                    <p className="text-gray-500">No hay candidatos que cumplan con los filtros actuales.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComparativeAnalysis;
