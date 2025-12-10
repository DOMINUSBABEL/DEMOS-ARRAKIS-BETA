
import React, { useState, useRef } from 'react';
import { runIntelDirector, runStrategyDirector, runCommsDirector, runCounterDirector, runOpsDirector } from '../services/geminiService';
import { IntelReport, StrategyReport, CommsReport, CounterReport, OpsReport } from '../types';
import { EyeIcon, UserGroupIcon, MegaphoneIcon, LoadingSpinner, SparklesIcon, ShareIcon, MapIcon, ChartBarIcon, CalendarIcon, CpuChipIcon, WarningIcon } from './Icons';

type DirectorType = 'G2' | 'G3' | 'G4' | 'G5' | 'G1';

// --- VISUALIZATION COMPONENTS ---

const DefconStatus: React.FC<{ level: number }> = ({ level }) => {
    const colors = [
        'bg-gray-500', 
        'bg-red-600 animate-pulse', // Defcon 1
        'bg-orange-500', // Defcon 2
        'bg-yellow-500', // Defcon 3
        'bg-green-600', // Defcon 4
        'bg-blue-600'  // Defcon 5
    ];
    
    return (
        <div className="flex items-center gap-4 bg-black/40 border border-white/10 px-4 py-2 rounded-lg">
            <span className="text-xs font-bold text-gray-400 font-mono uppercase tracking-widest">Estado de Campaña</span>
            <div className="flex gap-1">
                {[5, 4, 3, 2, 1].map(n => (
                    <div 
                        key={n} 
                        className={`w-8 h-2 rounded-sm transition-all duration-300 ${level <= n ? colors[n] : 'bg-gray-800'} ${level === n ? 'shadow-[0_0_10px_currentColor]' : ''}`}
                    ></div>
                ))}
            </div>
            <span className={`text-xl font-black font-mono ${level === 1 ? 'text-red-500' : 'text-white'}`}>DEFCON {level}</span>
        </div>
    );
};

const IntelConsole: React.FC<{ data: IntelReport }> = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
        <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><EyeIcon className="w-24 h-24 text-blue-500"/></div>
            <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Perfil Psicométrico (OCEAN)
            </h4>
            <div className="space-y-4">
                {Object.entries(data.psychometric_profile).filter(([k]) => k !== 'analysis').map(([trait, val]: [string, any]) => (
                    <div key={trait} className="group">
                        <div className="flex justify-between text-xs mb-1 uppercase font-mono text-gray-400">
                            <span>{trait}</span>
                            <span className="text-white group-hover:text-blue-400 transition-colors">{val}</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 w-3/4 rounded-full"></div> 
                        </div>
                    </div>
                ))}
            </div>
            <p className="mt-6 text-xs text-gray-300 leading-relaxed border-l-2 border-blue-900 pl-3 italic">
                "{data.psychometric_profile.analysis}"
            </p>
        </div>

        <div className="space-y-6">
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-pink-400 uppercase tracking-widest mb-4">Espectro de Sentimiento (Plutchik)</h4>
                <div className="grid grid-cols-4 gap-2">
                    {Object.entries(data.sentiment_spectrum).map(([emotion, val]) => (
                        <div key={emotion} className="text-center p-2 bg-white/5 rounded border border-white/5">
                            <div className="text-[10px] uppercase text-gray-500 mb-1">{emotion}</div>
                            <div className="text-lg font-bold text-white font-mono">{val}%</div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4">Triangulación de Narrativas</h4>
                <ul className="space-y-4">
                    {data.narrative_triangulation.map((narrative, i) => (
                        <li key={i} className="text-xs border-l-2 border-yellow-600 pl-3">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-white">Origen: {narrative.origin_point}</span>
                                <span className="text-gray-500 font-mono">Paciente 0: {narrative.patient_zero}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {narrative.vectors.map((v, j) => (
                                    <span key={j} className="px-2 py-0.5 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-200 text-[10px]">{v}</span>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const StrategyTable: React.FC<{ data: StrategyReport }> = ({ data }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-red-900/20 to-blue-900/20 border border-white/10 rounded-xl p-6 relative">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <CpuChipIcon className="w-4 h-4"/> War Gaming: Red vs Blue
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center relative z-10">
                <div className="p-4 bg-red-900/10 border border-red-500/30 rounded-lg">
                    <p className="text-[10px] font-bold text-red-500 uppercase mb-2">Movimiento Oponente</p>
                    <p className="text-sm text-gray-200 font-medium">"{data.war_game_scenario.red_team_move}"</p>
                </div>
                <div className="flex items-center justify-center">
                    <div className="text-2xl font-black text-gray-600">VS</div>
                </div>
                <div className="p-4 bg-blue-900/10 border border-blue-500/30 rounded-lg">
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-2">Contra-Estrategia</p>
                    <p className="text-sm text-gray-200 font-medium">"{data.war_game_scenario.blue_team_counter}"</p>
                </div>
            </div>
            <div className="mt-6 text-center">
                <span className="text-xs text-gray-400 uppercase tracking-wider mr-2">Impacto Proyectado:</span>
                <span className="text-sm font-bold text-white">{data.war_game_scenario.projected_impact}</span>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-green-400 uppercase tracking-widest mb-4">Modelo de Voto Dinámico</h4>
                <div className="flex items-end justify-between mb-2">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-white font-mono">{data.dynamic_vote_model.hard_vote_count.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Voto Duro</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400 font-mono">{data.dynamic_vote_model.swing_voters_count.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Voto Swing</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-400 font-mono">{data.dynamic_vote_model.vulnerability_index}/100</p>
                        <p className="text-[10px] text-gray-500 uppercase">Índice Vuln.</p>
                    </div>
                </div>
            </div>
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-yellow-400 uppercase tracking-widest mb-4">Asignación de Recursos (Algorítmica)</h4>
                <div className="space-y-3">
                    {data.resource_allocation.map((res, i) => (
                        <div key={i} className="flex items-center text-xs">
                            <div className="w-24 text-gray-400 font-bold">{res.channel}</div>
                            <div className="flex-1 bg-gray-800 h-2 rounded-full mx-3 overflow-hidden">
                                <div className="h-full bg-yellow-500" style={{width: `${res.budget_percent}%`}}></div>
                            </div>
                            <div className="w-12 text-right font-mono text-white">{res.budget_percent}%</div>
                            <div className="w-24 text-right text-gray-500 text-[9px] truncate ml-2">{res.roi_projection}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const CommsGrid: React.FC<{ data: CommsReport }> = ({ data }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.viral_payloads.map((payload, i) => (
                <div key={i} className="bg-[#1a1410] border border-white/10 rounded-xl p-5 hover:border-pink-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                        <span className="px-2 py-1 bg-pink-900/30 text-pink-300 text-[10px] font-bold uppercase rounded border border-pink-500/30">{payload.format}</span>
                        <MegaphoneIcon className="w-4 h-4 text-gray-600 group-hover:text-pink-500 transition-colors"/>
                    </div>
                    <h5 className="text-sm font-bold text-white mb-2 leading-snug">"{payload.hook}"</h5>
                    <p className="text-[10px] text-gray-400 mb-3 border-b border-white/5 pb-2">Trigger: {payload.psychological_trigger}</p>
                    <div className="bg-black/40 p-2 rounded text-[9px] text-gray-500 font-mono break-words">
                        Prompt: {payload.asset_prompt.substring(0, 60)}...
                    </div>
                </div>
            ))}
        </div>
        
        <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6 overflow-hidden">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-brand-primary"/> Matriz de Cronoposting (72h)
            </h4>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="text-gray-500 border-b border-white/5">
                            <th className="pb-2 font-mono uppercase">Día</th>
                            <th className="pb-2 font-mono uppercase">Hora</th>
                            <th className="pb-2 font-mono uppercase">Plataforma</th>
                            <th className="pb-2 font-mono uppercase">Tipo</th>
                            <th className="pb-2 font-mono uppercase">Objetivo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.cronoposting_matrix.map((row, i) => (
                            <tr key={i} className="group hover:bg-white/5 transition-colors">
                                <td className="py-3 text-white font-bold">Día {row.day}</td>
                                <td className="py-3 text-gray-400 font-mono">{row.time}</td>
                                <td className="py-3"><span className="text-brand-primary font-bold">{row.platform}</span></td>
                                <td className="py-3 text-gray-300">{row.content_type}</td>
                                <td className="py-3 text-gray-500 italic">{row.objective}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
);

const ThreatMonitor: React.FC<{ data: CounterReport }> = ({ data }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <WarningIcon className="w-4 h-4 animate-pulse"/> Threat Radar
            </h4>
            <div className="space-y-4">
                {data.threat_radar.map((threat, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-black/40 rounded-lg border border-red-500/10">
                        <div className={`w-2 h-2 rounded-full ${threat.status === 'Active' ? 'bg-red-500 animate-ping' : 'bg-gray-600'}`}></div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-white">{threat.threat}</p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{threat.origin} | {threat.status}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            threat.severity === 'Critical' ? 'bg-red-600 text-white' : 
                            threat.severity === 'High' ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
                        }`}>
                            {threat.severity}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-4">Estrategia de Inoculación</h4>
                <ul className="space-y-4">
                    {data.inoculation_strategy.map((strat, i) => (
                        <li key={i} className="text-xs space-y-1">
                            <p className="text-gray-500 uppercase text-[9px] font-bold">Narrativa a Pre-bunkear:</p>
                            <p className="text-gray-300 italic mb-2">"{strat.narrative_to_prebunk}"</p>
                            <div className="p-2 bg-blue-900/20 border-l-2 border-blue-500 rounded-r text-blue-200">
                                {strat.counter_message}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Análisis de Redes Bot</h4>
                <p className="text-sm text-gray-300 leading-relaxed font-mono text-justify">
                    {data.bot_network_analysis}
                </p>
            </div>
        </div>
    </div>
);

const OpsPanel: React.FC<{ data: OpsReport }> = ({ data }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <MapIcon className="w-4 h-4"/> Mapa de Calor Territorial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.territorial_heatmap.map((zone, i) => (
                        <div key={i} className="p-3 bg-black/40 rounded border border-white/5 flex flex-col gap-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-white">{zone.zone_name}</span>
                                <span className="text-orange-500 font-mono font-bold">{zone.heat_level}°</span>
                            </div>
                            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-yellow-600 to-red-600" style={{width: `${zone.heat_level}%`}}></div>
                            </div>
                            <p className="text-[10px] text-gray-400 leading-tight">{zone.priority_action}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gradient-to-b from-gray-800 to-[#1a1410] border border-white/10 rounded-xl p-6">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-2">Logística GOTV (Día D)</h4>
                <div className="space-y-6 text-center">
                    <div>
                        <p className="text-3xl font-black text-brand-primary">{data.gotv_logistics.transport_units}</p>
                        <p className="text-[10px] uppercase text-gray-500 tracking-wider">Unidades de Transporte</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-brand-secondary">{data.gotv_logistics.volunteers_needed}</p>
                        <p className="text-[10px] uppercase text-gray-500 tracking-wider">Voluntarios Requeridos</p>
                    </div>
                    <div className="text-left bg-black/20 p-3 rounded border border-white/5 mt-4">
                        <p className="text-[9px] uppercase text-gray-500 font-bold mb-1">Estrategia de Ruteo:</p>
                        <p className="text-xs text-gray-300 leading-snug">{data.gotv_logistics.routing_strategy}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

// --- MAIN LAYOUT ---

const WarRoom: React.FC = () => {
    const [activeDirector, setActiveDirector] = useState<DirectorType>('G2');
    const [jointMode, setJointMode] = useState(false);
    const [query, setQuery] = useState('');
    const [context, setContext] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    
    // State for Reports
    const [g2Report, setG2Report] = useState<IntelReport | null>(null);
    const [g3Report, setG3Report] = useState<StrategyReport | null>(null);
    const [g4Report, setG4Report] = useState<CommsReport | null>(null);
    const [g5Report, setG5Report] = useState<CounterReport | null>(null);
    const [g1Report, setG1Report] = useState<OpsReport | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleExecute = async () => {
        if (!query.trim()) return;
        setIsProcessing(true);

        try {
            if (jointMode) {
                // Execute Joint Operation (All Agents)
                const [r2, r3, r4, r5, r1] = await Promise.all([
                    runIntelDirector(query, context),
                    runStrategyDirector(query, context),
                    runCommsDirector(query, context),
                    runCounterDirector(query, context),
                    runOpsDirector(query, context)
                ]);
                setG2Report(r2);
                setG3Report(r3);
                setG4Report(r4);
                setG5Report(r5);
                setG1Report(r1);
            } else {
                // Single Agent Execution
                switch (activeDirector) {
                    case 'G2':
                        const r2 = await runIntelDirector(query, context);
                        setG2Report(r2);
                        break;
                    case 'G3':
                        const r3 = await runStrategyDirector(query, context);
                        setG3Report(r3);
                        break;
                    case 'G4':
                        const r4 = await runCommsDirector(query, context);
                        setG4Report(r4);
                        break;
                    case 'G5':
                        const r5 = await runCounterDirector(query, context);
                        setG5Report(r5);
                        break;
                    case 'G1':
                        const r1 = await runOpsDirector(query, context);
                        setG1Report(r1);
                        break;
                }
            }
        } catch (error) {
            console.error("Execution failed:", error);
        } finally {
            setIsProcessing(false);
        }
    };

    const DirectorTab = ({ id, label, icon, color }: { id: DirectorType, label: string, icon: React.ReactNode, color: string }) => (
        <button
            onClick={() => { setActiveDirector(id); setJointMode(false); }}
            className={`flex flex-col items-center justify-center p-4 border-b-2 transition-all w-full ${activeDirector === id && !jointMode ? `border-${color}-500 bg-white/5` : 'border-transparent opacity-50 hover:opacity-80'}`}
        >
            <div className={`mb-2 text-${color}-400`}>{icon}</div>
            <span className={`text-xs font-bold uppercase tracking-widest ${activeDirector === id && !jointMode ? 'text-white' : 'text-gray-500'}`}>{id} - {label}</span>
        </button>
    );

    return (
        <div className="bg-[#0f0a06] min-h-screen text-gray-200 font-sans selection:bg-brand-primary selection:text-white">
            {/* Top Bar: Status & Ticker */}
            <div className="border-b border-white/10 bg-[#140f0b] p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <CpuChipIcon className="w-8 h-8 text-brand-primary" />
                    <div>
                        <h1 className="text-xl font-black text-white uppercase tracking-widest font-mono leading-none">War Room</h1>
                        <span className="text-[10px] text-gray-500 font-mono">ESTADO MAYOR CONJUNTO - IA</span>
                    </div>
                </div>
                <DefconStatus level={3} />
            </div>

            {/* Main Grid */}
            <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
                
                {/* Left: Navigation & Context */}
                <div className="w-full lg:w-64 bg-[#140f0b] border-r border-white/10 flex flex-col">
                    <div className="p-4 border-b border-white/10">
                        <button 
                            onClick={() => setJointMode(!jointMode)}
                            className={`w-full py-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${jointMode ? 'bg-red-600 border-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] animate-pulse' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                        >
                            <WarningIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Operación Conjunta</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <DirectorTab id="G2" label="Inteligencia" icon={<EyeIcon className="w-6 h-6"/>} color="blue" />
                        <DirectorTab id="G3" label="Estrategia" icon={<ChartBarIcon className="w-6 h-6"/>} color="purple" />
                        <DirectorTab id="G4" label="Comunicaciones" icon={<MegaphoneIcon className="w-6 h-6"/>} color="pink" />
                        <DirectorTab id="G5" label="Contra-Intel" icon={<WarningIcon className="w-6 h-6"/>} color="red" />
                        <DirectorTab id="G1" label="Operaciones" icon={<MapIcon className="w-6 h-6"/>} color="orange" />
                    </div>
                    <div className="p-4 border-t border-white/10 bg-black/20">
                        <label className="block text-[9px] text-gray-500 uppercase font-bold mb-2 tracking-wider">Contexto de Batalla</label>
                        <textarea 
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            className="w-full bg-[#0f0a06] border border-white/10 rounded p-2 text-xs text-gray-300 resize-none h-32 focus:border-brand-primary outline-none custom-scrollbar"
                            placeholder="Pegue aquí reportes de inteligencia, noticias recientes o datos del terreno..."
                        ></textarea>
                    </div>
                </div>

                {/* Center: Command Interface */}
                <div className="flex-1 flex flex-col bg-[#0f0a06] relative">
                    {/* Display Area */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar scroll-smooth relative z-10" ref={chatEndRef}>
                        {/* Empty State */}
                        {!g2Report && !g3Report && !g4Report && !g5Report && !g1Report && !isProcessing && (
                            <div className="h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                <CpuChipIcon className="w-32 h-32 mb-6 text-white"/>
                                <h2 className="text-2xl font-bold uppercase tracking-widest text-white">Sistemas en Línea</h2>
                                <p className="font-mono text-sm mt-2">Esperando directriz del comandante...</p>
                            </div>
                        )}

                        {/* Rendering Active Report */}
                        {jointMode ? (
                            <div className="space-y-12">
                                {g2Report && <div className="border-b border-white/10 pb-8"><h3 className="text-xl font-bold text-blue-500 mb-4">G2: INTELIGENCIA</h3><IntelConsole data={g2Report} /></div>}
                                {g3Report && <div className="border-b border-white/10 pb-8"><h3 className="text-xl font-bold text-purple-500 mb-4">G3: ESTRATEGIA</h3><StrategyTable data={g3Report} /></div>}
                                {g4Report && <div className="border-b border-white/10 pb-8"><h3 className="text-xl font-bold text-pink-500 mb-4">G4: COMUNICACIONES</h3><CommsGrid data={g4Report} /></div>}
                                {g5Report && <div className="border-b border-white/10 pb-8"><h3 className="text-xl font-bold text-red-500 mb-4">G5: CONTRA-INTELIGENCIA</h3><ThreatMonitor data={g5Report} /></div>}
                                {g1Report && <div><h3 className="text-xl font-bold text-orange-500 mb-4">G1: OPERACIONES</h3><OpsPanel data={g1Report} /></div>}
                            </div>
                        ) : (
                            <>
                                {activeDirector === 'G2' && g2Report && <IntelConsole data={g2Report} />}
                                {activeDirector === 'G3' && g3Report && <StrategyTable data={g3Report} />}
                                {activeDirector === 'G4' && g4Report && <CommsGrid data={g4Report} />}
                                {activeDirector === 'G5' && g5Report && <ThreatMonitor data={g5Report} />}
                                {activeDirector === 'G1' && g1Report && <OpsPanel data={g1Report} />}
                            </>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-6 bg-[#140f0b] border-t border-white/10 relative z-20">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <input 
                                    type="text" 
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleExecute()}
                                    className="w-full bg-[#0f0a06] border border-white/10 rounded-lg py-4 pl-6 pr-4 text-gray-200 placeholder-gray-600 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all font-mono text-sm"
                                    placeholder={jointMode ? "Orden Ejecutiva para el Estado Mayor Conjunto..." : `Orden para Director ${activeDirector}...`}
                                />
                                {isProcessing && (
                                    <div className="absolute right-4 top-4">
                                        <LoadingSpinner className="w-5 h-5 text-brand-primary"/>
                                    </div>
                                )}
                            </div>
                            <button 
                                onClick={handleExecute}
                                disabled={isProcessing || !query.trim()}
                                className="px-8 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-lg uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
                            >
                                Ejecutar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarRoom;
