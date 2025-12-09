
import React, { useState, useRef, useMemo } from 'react';
import AnalysisCard from './AnalysisCard';
import { UserGroupIcon, LoadingSpinner, ScaleIcon, PlusIcon, TrashIcon, ChartBarIcon, FingerPrintIcon, CpuChipIcon, FilePdfIcon, BuildingOfficeIcon, ShareIcon, WarningIcon, FunnelIcon, ArrowsUpDownIcon } from './Icons';
import { generateCandidateComparison } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { CandidateComparisonResult, ComparisonScenario, CandidateAnalysis, PartyMetrics } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell } from 'recharts';

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
    if (score >= 80) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
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
        <div className="h-[500px] w-full bg-black/20 p-4 rounded-xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af" 
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
                    <Tooltip content={<CustomScenarioTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                    <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', color: '#9ca3af' }} />
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
                    <Bar dataKey="indecisos" fill="#4b5563" name="Votos en Disputa" radius={[2, 2, 0, 0]} fillOpacity={0.3} maxBarSize={60} />
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
                    <div key={sIdx} className="bg-black/20 p-6 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white uppercase tracking-widest">{scenario.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{scenario.description}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-bold text-brand-primary uppercase">Total Proyectado</span>
                                <p className="text-xl font-bold text-white font-mono">
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#9ca3af" 
                                        tick={{ fontSize: 11, width: 200 }} 
                                        width={180}
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.03)'}}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                return (
                                                    <div className="bg-[#0f0a06]/95 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
                                                        <p className="text-xs text-gray-400 mb-1 font-mono uppercase">{d.name}</p>
                                                        <p className="text-lg font-bold text-white font-mono">{d.votes.toLocaleString('es-CO')} votos</p>
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
                <div className="bg-[#0f0a06]/90 border border-white/10 p-2 rounded shadow-lg backdrop-blur-md text-xs text-white">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p>{payload[0].value.toLocaleString('es-CO')} votos</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-black/20 p-6 rounded-xl border border-white/10 mb-8">
            <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
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
                    <div className="bg-white/5 p-4 rounded-lg border-l-4 border-blue-500">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total Votos Candidatos</p>
                        <p className="text-2xl font-bold text-white font-mono">{metrics.candidateVotesSubtotal.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-blue-400 font-bold mt-1">{(100 - metrics.logoPercentage).toFixed(1)}% del total</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border-l-4 border-gray-500">
                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Votos Solo por Lista/Logo</p>
                        <p className="text-2xl font-bold text-white font-mono">{metrics.logoVotes.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-gray-400 font-bold mt-1">{metrics.logoPercentage.toFixed(1)}% del total</p>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest">Proyección Total Lista</p>
                        <span className="text-xl text-white font-bold font-mono">{metrics.totalListVotes.toLocaleString('es-CO')}</span>
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
        <div className="h-[500px] w-full bg-black/20 p-4 rounded-xl border border-white/5">
            <h4 className="text-sm font-bold text-center text-gray-400 uppercase tracking-widest mb-2">Radar de Capacidades Políticas</h4>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                    <PolarGrid stroke="#374151" strokeWidth={1} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 'bold' }} />
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

const DetailedCandidateCard: React.FC<{ candidate: CandidateAnalysis; index: number }> = ({ candidate, index }) => (
    <div className="break-inside-avoid bg-white dark:bg-[#1a1410] p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-8 transition-transform hover:scale-[1.005]">
        <header className="flex justify-between items-start border-b-2 border-gray-100 dark:border-white/5 pb-6 mb-6">
            <div>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2 block flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                    Candidato #{index + 1}
                </span>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-sans tracking-tight">{candidate.name}</h3>
            </div>
            <div className="text-right bg-black/20 p-3 rounded-lg border border-white/5 min-w-[120px]">
                <div className={`text-3xl font-bold ${getScoreTextColor(candidate.probabilityScore)}`}>{candidate.probabilityScore}%</div>
                <div className="text-[9px] uppercase text-gray-500 font-bold tracking-wider mt-1">Probabilidad</div>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
                {/* Section 1 */}
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-blue-500 rounded-full"></span> Trayectoria
                        </h4>
                        <span className={`text-xs font-bold ${getScoreTextColor(candidate.scoring.trajectoryScore)}`}>{candidate.scoring.trajectoryScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(candidate.scoring.trajectoryScore)}`} style={{width: `${candidate.scoring.trajectoryScore}%`}}></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal border-l-2 border-transparent group-hover:border-blue-500/20 pl-2 transition-all">{candidate.trajectory}</p>
                </div>
                
                {/* Section 2 */}
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-green-500 rounded-full"></span> Gestión
                        </h4>
                        <span className={`text-xs font-bold ${getScoreTextColor(candidate.scoring.managementScore)}`}>{candidate.scoring.managementScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(candidate.scoring.managementScore)}`} style={{width: `${candidate.scoring.managementScore}%`}}></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal border-l-2 border-transparent group-hover:border-green-500/20 pl-2 transition-all">{candidate.management}</p>
                </div>

                {/* Section 3 - Negative */}
                <div className="bg-red-500/5 p-4 rounded-lg border border-red-500/10">
                    <div className="flex justify-between items-baseline mb-2">
                        <h4 className="text-xs font-black uppercase text-red-500 dark:text-red-400 tracking-widest flex items-center gap-2">
                            <WarningIcon className="w-3 h-3" /> Riesgo & Ruido
                        </h4>
                        <span className="text-xs font-bold text-red-400 bg-red-900/20 px-2 py-0.5 rounded">-{candidate.scoring.scandalPenalty} pts</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal">{candidate.scandals}</p>
                </div>
            </div>
            
            <div className="space-y-8">
                {/* Section 4 */}
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-purple-500 rounded-full"></span> Estructura
                        </h4>
                        <span className={`text-xs font-bold ${getScoreTextColor(candidate.scoring.structureScore)}`}>{candidate.scoring.structureScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(candidate.scoring.structureScore)}`} style={{width: `${candidate.scoring.structureScore}%`}}></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal border-l-2 border-transparent group-hover:border-purple-500/20 pl-2 transition-all">{candidate.structure}</p>
                </div>

                {/* Section 5 */}
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-orange-500 rounded-full"></span> Territorio
                        </h4>
                        <span className={`text-xs font-bold ${getScoreTextColor(candidate.scoring.territoryScore)}`}>{candidate.scoring.territoryScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(candidate.scoring.territoryScore)}`} style={{width: `${candidate.scoring.territoryScore}%`}}></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal border-l-2 border-transparent group-hover:border-orange-500/20 pl-2 transition-all">{candidate.territory}</p>
                </div>

                {/* Section 6 */}
                <div className="group">
                    <div className="flex justify-between items-end mb-2">
                        <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2">
                            <span className="w-1 h-3 bg-cyan-500 rounded-full"></span> Dinámica Interna
                        </h4>
                        <span className={`text-xs font-bold ${getScoreTextColor(candidate.scoring.internalDynamicsScore)}`}>{candidate.scoring.internalDynamicsScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full mb-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${getScoreColor(candidate.scoring.internalDynamicsScore)}`} style={{width: `${candidate.scoring.internalDynamicsScore}%`}}></div>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed text-justify font-normal border-l-2 border-transparent group-hover:border-cyan-500/20 pl-2 transition-all">{candidate.alliances}</p>
                </div>
            </div>
        </div>
    </div>
);

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
                    
                    {/* VISIBILITY & FILTERING CONTROL PANEL */}
                    <div className="mb-6 p-4 bg-black/40 rounded-xl border border-white/10 space-y-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5 pb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <FingerPrintIcon className="w-4 h-4" />
                                Panel de Visualización (Filtrar Gráficas)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setVisibleCandidates(new Set(comparison.candidates.map(c => c.name)))}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white border border-white/10 transition-colors"
                                >
                                    Ver Todos
                                </button>
                                <button 
                                    onClick={() => setVisibleCandidates(new Set())}
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white border border-white/10 transition-colors"
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

                        {/* LIST COMPOSITION */}
                        {comparison.partyMetrics && <ListCompositionChart metrics={comparison.partyMetrics} />}

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
                                    Radar de Capacidades Políticas
                                </h4>
                                <AttributeRadarChart candidates={comparison.candidates} visibleCandidates={visibleCandidates} />
                            </div>
                        </div>

                        {/* DETAILED SCENARIO BREAKDOWN - GUARDED TO PREVENT CRASH */}
                        {comparison.partyMetrics && (
                            <>
                                <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                                    <ChartBarIcon className="w-5 h-5 text-brand-secondary" />
                                    Desglose Detallado de Escenarios
                                </h4>
                                <DetailedScenarioBreakdown scenarios={comparison.scenarios} metrics={comparison.partyMetrics} />
                            </>
                        )}

                        {/* SORTING & FILTERING TOOLBAR FOR LIST */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/30 p-4 rounded-lg border border-white/5 mb-6 mt-8 sticky top-0 z-20 backdrop-blur-md">
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
                                            className="w-32 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                                        />
                                        <span className="text-xs font-bold text-brand-glow w-8">{minProbFilter}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="flex flex-col flex-1">
                                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Ordenar Por</label>
                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="bg-black/40 border border-white/10 text-white text-xs rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
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
                                    className="p-2 mt-4 bg-white/5 hover:bg-white/10 rounded-md border border-white/10 transition-colors"
                                    title={sortDesc ? "Orden Descendente" : "Orden Ascendente"}
                                >
                                    <ArrowsUpDownIcon className={`w-4 h-4 text-gray-300 transition-transform ${sortDesc ? 'rotate-0' : 'rotate-180'}`} />
                                </button>
                            </div>
                        </div>

                        {/* DETAILED EXECUTIVE REPORT CARDS */}
                        <h4 className="text-lg font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2 flex items-center gap-3">
                            <ShareIcon className="w-5 h-5 text-brand-secondary" />
                            Informe Ejecutivo Detallado
                        </h4>
                        <div className="space-y-6">
                            {sortedAndFilteredCandidates.length > 0 ? (
                                sortedAndFilteredCandidates.map((cand, idx) => (
                                    <DetailedCandidateCard key={cand.name} candidate={cand} index={idx} />
                                ))
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-700 rounded-xl">
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
