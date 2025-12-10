
import React, { useState, useRef, useEffect } from 'react';
import { runAgentSocial, runAgentCampaign, runAgentContent } from '../services/geminiService';
import { SocialListeningResponse, CampaignPlanResponse, ContentCalendarResponse } from '../types';
import { EyeIcon, UserGroupIcon, MegaphoneIcon, LoadingSpinner, SparklesIcon, ShareIcon, MapIcon, ChartBarIcon, CalendarIcon, CpuChipIcon } from './Icons';

type AgentType = 'social' | 'campaign' | 'content';

const AgentCommandCenter: React.FC = () => {
    const [selectedAgent, setSelectedAgent] = useState<AgentType>('social');
    const [query, setQuery] = useState('');
    const [context, setContext] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<any | null>(null);
    const [chainOfThought, setChainOfThought] = useState<string[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    const handleRunAgent = async () => {
        if (!query.trim()) return;
        setIsProcessing(true);
        setResult(null);
        setChainOfThought([]);

        try {
            let response;
            if (selectedAgent === 'social') {
                response = await runAgentSocial(query, context);
            } else if (selectedAgent === 'campaign') {
                response = await runAgentCampaign(query, context);
            } else {
                response = await runAgentContent(query, context);
            }
            
            setChainOfThought(response.chainOfThought || []);
            setResult(response);
        } catch (error) {
            console.error("Agent Error:", error);
            setChainOfThought(["Error executing agent protocol.", String(error)]);
        } finally {
            setIsProcessing(false);
        }
    };

    // --- Renderers for Complex Artifacts ---

    const renderSocialArtifact = (data: SocialListeningResponse) => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-brand-primary font-bold mb-3 flex items-center gap-2">
                        <ShareIcon className="w-4 h-4"/> Rueda de Emociones
                    </h4>
                    <div className="space-y-2">
                        {data.sentiment_breakdown.map((s, i) => (
                            <div key={i} className="flex items-center text-xs">
                                <div className="w-20 font-bold text-gray-300">{s.emotion}</div>
                                <div className="flex-1 bg-gray-700 h-2 rounded-full mx-2 overflow-hidden">
                                    <div className="h-full bg-brand-secondary" style={{width: `${s.percentage}%`}}></div>
                                </div>
                                <div className="w-10 text-right text-gray-400">{s.percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                        <WarningIcon className="w-4 h-4"/> Virus Narrativos
                    </h4>
                    <ul className="space-y-3">
                        {data.narrative_virus.map((n, i) => (
                            <li key={i} className="text-xs border-l-2 border-red-500 pl-3">
                                <span className={`uppercase font-bold text-[10px] px-1 rounded ${n.velocity === 'High' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>{n.velocity} Vel</span>
                                <p className="font-bold text-white mt-1">{n.name}</p>
                                <p className="text-gray-400">{n.description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-blue-400 font-bold mb-3">Grafo de Influencia</h4>
                <div className="flex flex-wrap gap-2">
                    {data.influencer_graph.map((inf, i) => (
                        <div key={i} className="px-3 py-2 bg-gray-700 rounded-md border border-gray-600 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <div>
                                <p className="text-xs font-bold text-white">{inf.name}</p>
                                <p className="text-[10px] text-gray-400">Nvl {inf.influence_level} | {inf.affinity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 font-mono text-xs text-green-400 leading-relaxed">
                <strong className="block text-gray-500 mb-2 uppercase">Inteligencia Estratégica:</strong>
                {data.strategic_intel}
            </div>
        </div>
    );

    const renderCampaignArtifact = (data: CampaignPlanResponse) => (
        <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-brand-primary font-bold mb-3 flex items-center gap-2">
                    <MapIcon className="w-4 h-4"/> Operación Cobalto (Micro-Targeting)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {data.cobalto_plan.map((zone, i) => (
                        <div key={i} className={`p-3 rounded border ${zone.priority === 'Critical' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-700/30 border-gray-600'}`}>
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-white text-xs">{zone.zone}</span>
                                <span className="text-[9px] uppercase font-bold text-gray-400">{zone.priority}</span>
                            </div>
                            <p className="text-[10px] text-gray-300">{zone.action}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                        <ChartBarIcon className="w-4 h-4"/> Asignación de Recursos
                    </h4>
                    {data.resource_allocation.map((r, i) => (
                        <div key={i} className="mb-2 last:mb-0">
                            <div className="flex justify-between text-xs text-gray-300 mb-1">
                                <span>{r.channel}</span>
                                <span className="font-mono">{r.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500" style={{width: `${r.percentage}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-purple-400 font-bold mb-3 flex items-center gap-2">
                        <CpuChipIcon className="w-4 h-4"/> Simulación A/B
                    </h4>
                    <div className="text-xs space-y-2">
                        <p><strong className="text-gray-400">Escenario A:</strong> <span className="text-gray-200">{data.ab_simulation.scenarioA}</span></p>
                        <p><strong className="text-gray-400">Escenario B:</strong> <span className="text-gray-200">{data.ab_simulation.scenarioB}</span></p>
                        <div className="mt-3 p-2 bg-green-900/30 border border-green-500/30 rounded text-green-300">
                            <strong>Ganador: {data.ab_simulation.winner}</strong>
                            <p className="mt-1 opacity-80">{data.ab_simulation.reason}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContentArtifact = (data: ContentCalendarResponse) => (
        <div className="space-y-6">
            <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4">
                    {data.monthly_calendar.map((week, i) => (
                        <div key={i} className="min-w-[280px] bg-gray-800 rounded-lg border border-gray-700 p-4">
                            <div className="border-b border-gray-600 pb-2 mb-3">
                                <h5 className="font-bold text-white text-sm">Semana {week.week}</h5>
                                <p className="text-[10px] text-brand-primary uppercase tracking-wider">{week.focus}</p>
                            </div>
                            <div className="space-y-4">
                                {week.posts.map((post, j) => (
                                    <div key={j} className="bg-gray-700/50 p-2 rounded text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-gray-300">{post.platform}</span>
                                        </div>
                                        <p className="text-gray-200 mb-2 italic">"{post.content}"</p>
                                        <div className="bg-black/30 p-1.5 rounded border border-white/5 font-mono text-[9px] text-gray-500">
                                            PROMPT: {post.asset_prompt}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h4 className="text-pink-400 font-bold mb-3 flex items-center gap-2">
                    <ShareIcon className="w-4 h-4"/> Adaptación Cross-Platform
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {data.cross_platform_adaptations.map((a, i) => (
                        <div key={i} className="p-3 bg-gray-700/50 rounded border border-gray-600">
                            <strong className="block text-white text-xs mb-1 uppercase">{a.platform}</strong>
                            <p className="text-xs text-gray-300">{a.strategy}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const WarningIcon = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
    );

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 bg-[#0f0a06] text-gray-200 p-4 md:p-6 rounded-xl border border-white/5 shadow-2xl overflow-hidden font-sans">
            
            {/* Sidebar Controls */}
            <div className="w-full md:w-64 flex flex-col gap-4 border-r border-white/10 pr-6">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                        <CpuChipIcon className="w-5 h-5 text-brand-primary" />
                        Centro de Mando
                    </h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">SISTEMA AGENTES AUTÓNOMOS v3.0</p>
                </div>

                <button 
                    onClick={() => setSelectedAgent('social')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${selectedAgent === 'social' ? 'bg-blue-900/20 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    <EyeIcon className="w-5 h-5" />
                    <div>
                        <span className="block text-xs font-bold uppercase">Oficial de Inteligencia</span>
                        <span className="text-[9px] opacity-70">Escucha Social y Redes</span>
                    </div>
                </button>

                <button 
                    onClick={() => setSelectedAgent('campaign')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${selectedAgent === 'campaign' ? 'bg-red-900/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    <MapIcon className="w-5 h-5" />
                    <div>
                        <span className="block text-xs font-bold uppercase">Estratega de Guerra</span>
                        <span className="text-[9px] opacity-70">Campaña y Territorio</span>
                    </div>
                </button>

                <button 
                    onClick={() => setSelectedAgent('content')}
                    className={`p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${selectedAgent === 'content' ? 'bg-pink-900/20 border-pink-500 text-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.3)]' : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    <MegaphoneIcon className="w-5 h-5" />
                    <div>
                        <span className="block text-xs font-bold uppercase">Director Creativo</span>
                        <span className="text-[9px] opacity-70">Contenido y Viralidad</span>
                    </div>
                </button>

                <div className="mt-auto pt-4 border-t border-white/10">
                    <label className="block text-[10px] text-gray-500 uppercase font-bold mb-2">Contexto Global (Opcional)</label>
                    <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-gray-300 resize-none h-24 focus:border-brand-primary outline-none"
                        placeholder="Pegue aquí datos demográficos, noticias recientes o contexto específico..."
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                    ></textarea>
                </div>
            </div>

            {/* Main Interface */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#1a1410] rounded-xl border border-white/5 relative overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}></div>

                {/* Output Area */}
                <div className="flex-1 overflow-y-auto p-6 relative z-10 custom-scrollbar scroll-smooth" ref={chatEndRef}>
                    {!result && !isProcessing && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                            <CpuChipIcon className="w-16 h-16 mb-4" />
                            <p className="text-sm font-mono uppercase tracking-widest">Sistema en espera de órdenes</p>
                        </div>
                    )}

                    {/* Chain of Thought Stream */}
                    {chainOfThought.length > 0 && (
                        <div className="mb-8 font-mono text-[10px] space-y-1">
                            <p className="text-brand-primary uppercase font-bold mb-2 tracking-widest">/// PROCESO DE RAZONAMIENTO ///</p>
                            {chainOfThought.map((thought, i) => (
                                <div key={i} className="flex gap-3 text-gray-500 animate-fade-in">
                                    <span className="w-4 text-right opacity-50">{i+1}.</span>
                                    <span className="opacity-80">{thought}</span>
                                </div>
                            ))}
                            {isProcessing && <div className="text-brand-primary animate-pulse ml-7">>> Analizando vectores de datos...</div>}
                        </div>
                    )}

                    {/* Final Artifact */}
                    {result && (
                        <div className="animate-fade-in-up">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                                <SparklesIcon className="w-6 h-6 text-brand-secondary" />
                                <h3 className="text-xl font-bold text-white font-serif">Artefacto de Inteligencia Generado</h3>
                            </div>
                            {selectedAgent === 'social' && renderSocialArtifact(result)}
                            {selectedAgent === 'campaign' && renderCampaignArtifact(result)}
                            {selectedAgent === 'content' && renderContentArtifact(result)}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#0f0a06] border-t border-white/10 relative z-20">
                    <div className="relative">
                        <input 
                            type="text" 
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-6 pr-32 text-gray-200 placeholder-gray-600 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                            placeholder={
                                selectedAgent === 'social' ? "Ej: Analiza el sentimiento actual sobre la propuesta de seguridad en Medellín..." :
                                selectedAgent === 'campaign' ? "Ej: Diseña un plan de movilización para la Comuna 13..." :
                                "Ej: Crea un calendario mensual enfocado en jóvenes universitarios..."
                            }
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !isProcessing && handleRunAgent()}
                        />
                        <button 
                            onClick={handleRunAgent}
                            disabled={isProcessing || !query.trim()}
                            className="absolute right-2 top-2 bottom-2 px-6 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-xs uppercase tracking-wider"
                        >
                            {isProcessing ? <LoadingSpinner className="w-4 h-4" /> : "Ejecutar"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentCommandCenter;
