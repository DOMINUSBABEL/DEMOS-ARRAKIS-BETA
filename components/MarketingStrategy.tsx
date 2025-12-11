
import React, { useState, useEffect, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { MegaphoneIcon, LoadingSpinner, UserGroupIcon, ChartBarIcon, MapIcon, SparklesIcon, WarningIcon, CpuChipIcon, ArrowsUpDownIcon, DatabaseIcon, PencilIcon, PhotoIcon, ChatBubbleBottomCenterTextIcon, RocketLaunchIcon, CalendarIcon, ClockIcon, EyeIcon, FilePdfIcon, CloseIcon } from './Icons';
import { generateMarketingStrategy, generateTacticalCampaign, generateCronoposting, autoConfigureCronoposting, generatePostStructure, generateNanoBananaImage } from '../services/geminiService';
import { generateMarketingFullReportPDF } from '../services/reportGenerator';
import { MarketingStrategyResult, TacticalCampaignResult, CronopostingResult, CronopostingConfig, CronopostingEntry, SocialPostResult } from '../types';
import MemorySystem from './MemorySystem';

interface CanvasState {
    isOpen: boolean;
    entry: CronopostingEntry | null;
    isLoadingStructure: boolean;
    isLoadingImage: boolean;
    postStructure: SocialPostResult | null;
    generatedImage: string | null;
}

const MarketingStrategy: React.FC = () => {
    // Initial State Pre-filled with Simulation Data for John Jairo Berrío
    const [targetName, setTargetName] = useState('John Jairo Berrío');
    const [targetType, setTargetType] = useState<'candidate' | 'party'>('candidate');
    const [context, setContext] = useState('Diputado de Antioquia (Centro Democrático). Base: Medellín, Bello, Norte del Valle de Aburrá. Enfoque: Seguridad y Obras.');
    const [isLoading, setIsLoading] = useState(false);
    
    // Ref for Full Report Export
    const marketingRef = useRef<HTMLDivElement>(null);

    const [strategy, setStrategy] = useState<MarketingStrategyResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // --- New States for Tactical Interaction & Cronoposting ---
    const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
    const [isGeneratingTactics, setIsGeneratingTactics] = useState(false);
    const [tacticalPlan, setTacticalPlan] = useState<TacticalCampaignResult | null>(null);
    
    // Advanced Cronoposting State
    const [isGeneratingCronoposting, setIsGeneratingCronoposting] = useState(false);
    const [isAutoConfiguring, setIsAutoConfiguring] = useState(false);
    const [cronopostingResult, setCronopostingResult] = useState<CronopostingResult | null>(null);
    const [magicPrompt, setMagicPrompt] = useState('');
    
    // Canvas State
    const [canvasState, setCanvasState] = useState<CanvasState>({
        isOpen: false,
        entry: null,
        isLoadingStructure: false,
        isLoadingImage: false,
        postStructure: null,
        generatedImage: null
    });
    
    const [cronoConfig, setCronoConfig] = useState<CronopostingConfig>({
        duration: '1 mes',
        startDate: new Date().toISOString().split('T')[0],
        goal: 'Incrementar reconocimiento de marca en un 20%',
        context: '',
        platforms: ['Instagram', 'TikTok'],
        frequency: 'Media (Constancia)',
        tone: 'Cercano',
        contentMix: 'Educativo (70/20/10)',
        keyFormats: ['Reels', 'Historias'],
        kpiFocus: 'Engagement',
        resourcesLevel: 'Medio (Semi-Pro)'
    });

    const handleCronoConfigChange = (key: keyof CronopostingConfig, value: any) => {
        setCronoConfig(prev => ({ ...prev, [key]: value }));
    };

    const togglePlatform = (platform: string) => {
        setCronoConfig(prev => {
            const newPlatforms = prev.platforms.includes(platform)
                ? prev.platforms.filter(p => p !== platform)
                : [...prev.platforms, platform];
            return { ...prev, platforms: newPlatforms };
        });
    };

    const handleAutoConfigure = async () => {
        if (!magicPrompt.trim()) return;
        setIsAutoConfiguring(true);
        try {
            const config = await autoConfigureCronoposting(magicPrompt);
            setCronoConfig(prev => ({
                ...prev,
                ...config,
                startDate: config.startDate || prev.startDate
            }));
        } catch (e) {
            console.error("Auto-config failed", e);
        } finally {
            setIsAutoConfiguring(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetName.trim() || !context.trim()) {
            setError("Por favor completa todos los campos requeridos.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setStrategy(null);
        setTacticalPlan(null);
        setCronopostingResult(null);
        setSelectedAvatarId(null);

        try {
            const result = await generateMarketingStrategy(targetName, targetType, context);
            setStrategy(result);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al generar la estrategia.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateTactics = async () => {
        if (!strategy || selectedAvatarId === null) return;

        const voter = strategy.voterAvatars.find(v => v.id === selectedAvatarId);
        const candidate = strategy.candidateAvatars.find(c => c.id === selectedAvatarId) || strategy.candidateAvatars[0];

        if (!voter || !candidate) return;

        setIsGeneratingTactics(true);
        setTacticalPlan(null);
        setCronopostingResult(null); 
        setError(null);

        try {
            const result = await generateTacticalCampaign(
                targetName,
                `${voter.archetype} (${voter.demographics})`,
                `${candidate.archetype} (${candidate.messaging_angle})`,
                context
            );
            setTacticalPlan(result);
        } catch (err: any) {
            setError(err.message || "Error al generar la campaña táctica.");
        } finally {
            setIsGeneratingTactics(false);
        }
    };

    const handleGenerateCronoposting = async () => {
        if (!tacticalPlan || !strategy) return;
        
        setIsGeneratingCronoposting(true);
        setCronopostingResult(null);
        setError(null);

        const enhancedContext = `
            ${context}
            Perfil Táctico Seleccionado:
            Justificación: ${tacticalPlan.technicalJustification}
            Adaptación Demográfica: ${tacticalPlan.demographicAdaptation}
            Foco Geográfico: ${tacticalPlan.geographicFocus.join(', ')}
        `;

        const fullConfig = { ...cronoConfig, context: enhancedContext };

        try {
            const result = await generateCronoposting(fullConfig);
            setCronopostingResult(result);
        } catch (err: any) {
            setError(err.message || "Error al generar el cronograma.");
        } finally {
            setIsGeneratingCronoposting(false);
        }
    };

    const handleOpenCanvas = async (entry: CronopostingEntry) => {
        setCanvasState({
            isOpen: true,
            entry: entry,
            isLoadingStructure: true,
            isLoadingImage: false,
            postStructure: null,
            generatedImage: null
        });

        try {
            const structure = await generatePostStructure(entry, targetName, context);
            setCanvasState(prev => ({
                ...prev,
                isLoadingStructure: false,
                postStructure: structure
            }));
        } catch (e) {
            console.error(e);
            setCanvasState(prev => ({ ...prev, isLoadingStructure: false }));
        }
    };

    const handleGenerateImage = async () => {
        if (!canvasState.postStructure?.image_prompt) return;
        
        setCanvasState(prev => ({ ...prev, isLoadingImage: true }));
        try {
            const base64Image = await generateNanoBananaImage(canvasState.postStructure.image_prompt);
            setCanvasState(prev => ({
                ...prev,
                isLoadingImage: false,
                generatedImage: base64Image
            }));
        } catch (e) {
            console.error(e);
            setCanvasState(prev => ({ ...prev, isLoadingImage: false }));
            alert("Error al generar la imagen. Intenta nuevamente.");
        }
    };

    const handleExportFullReport = () => {
        if (marketingRef.current) {
            generateMarketingFullReportPDF(marketingRef.current, `Dossier_Marketing_${targetName.replace(/\s+/g, '_')}.pdf`);
        }
    };

    const handleLoadMemory = (data: any) => {
        if (data) {
            setStrategy(data.strategy);
            setTacticalPlan(data.tacticalPlan);
            setCronopostingResult(data.cronopostingResult);
            if(data.inputs) {
                setTargetName(data.inputs.targetName);
                setContext(data.inputs.context);
            }
        }
    };

    return (
        <div className="space-y-8 animate-fade-in" ref={marketingRef}>
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <MegaphoneIcon className="w-6 h-6 text-brand-primary" />
                    Marketing de Guerra Electoral
                </h2>
                <div className="flex items-center gap-2">
                    <MemorySystem 
                        type="marketing" 
                        dataToSave={{ strategy, tacticalPlan, cronopostingResult, inputs: { targetName, context } }} 
                        onLoad={handleLoadMemory} 
                        canSave={!!strategy} 
                    />
                    {strategy && (
                        <button onClick={handleExportFullReport} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm">
                            <FilePdfIcon className="w-5 h-5" /> Exportar Dossier
                        </button>
                    )}
                </div>
            </div>

            <AnalysisCard title="Configuración de Objetivo" explanation="Define el candidato o partido y el contexto estratégico para iniciar la generación de inteligencia de marketing." icon={<MegaphoneIcon />} fullscreenable={false} collapsible={true} defaultCollapsed={!!strategy}>
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-6 bg-white rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Objetivo</label>
                            <input type="text" value={targetName} onChange={(e) => setTargetName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Objetivo</label>
                            <div className="flex space-x-6 mt-3">
                                <label className="flex items-center cursor-pointer group"><input type="radio" checked={targetType === 'candidate'} onChange={() => setTargetType('candidate')} className="form-radio text-brand-primary h-4 w-4" /><span className="ml-2 text-sm text-gray-700 font-medium">Candidato</span></label>
                                <label className="flex items-center cursor-pointer group"><input type="radio" checked={targetType === 'party'} onChange={() => setTargetType('party')} className="form-radio text-brand-primary h-4 w-4" /><span className="ml-2 text-sm text-gray-700 font-medium">Partido</span></label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contexto Estratégico</label>
                        <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="Describe la situación actual..." rows={3} className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all" />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={isLoading} className="bg-brand-primary hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                            {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />} {isLoading ? 'Procesando...' : 'Generar Estrategia'}
                        </button>
                    </div>
                </form>
                {error && <div className="mx-6 mb-6 flex items-center p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg"><WarningIcon className="w-6 h-6 mr-3 flex-shrink-0 text-red-600" /><p>{error}</p></div>}
            </AnalysisCard>

            {strategy && (
                <div className="space-y-8 animate-fade-in-up">
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-report-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                            <div>
                                <h2 className="text-4xl font-serif font-bold text-brand-primary mb-4 tracking-tight">{targetName}</h2>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
                                        <CpuChipIcon className="w-4 h-4 text-brand-secondary"/>
                                        <span className="text-xs font-bold uppercase">Base Calculada:</span>
                                        <span className="text-sm font-mono font-bold text-brand-primary">{strategy.calculatedBase?.toLocaleString('es-CO')}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-base max-w-4xl border-l-4 border-gray-200 pl-4 italic">"{strategy.candidateProfile}"</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Pipelines rendered simplified */}
                        {['Diagnóstico', 'Ejecución', 'Conversión'].map((phase, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                                <div className={`absolute top-0 left-0 w-full h-1 ${i===0?'bg-gray-400':i===1?'bg-brand-primary':'bg-brand-secondary'}`}></div>
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4">Fase {i+1}: {phase}</h4>
                                <ul className="space-y-4">
                                    {(i===0 ? strategy.pipeline.phase1_extraction : i===1 ? strategy.pipeline.phase2_execution : strategy.pipeline.phase3_conversion).map((item, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-3"><span className="text-gray-400 font-bold text-xs mt-0.5">0{idx+1}</span><span className="leading-snug">{item}</span></li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <AnalysisCard title="Matriz de Conexión: Votante vs. Candidato" explanation="Selecciona una tarjeta para generar el despliegue táctico específico para ese micro-segmento." collapsible={false} icon={<ArrowsUpDownIcon />}>
                        <div className="p-6 bg-gray-50">
                            <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar snap-x items-stretch">
                                {strategy.voterAvatars.map((voter, idx) => {
                                    const candidateAvatar = strategy.candidateAvatars[idx] || strategy.candidateAvatars[0];
                                    const isSelected = selectedAvatarId === voter.id;
                                    return (
                                        <div key={idx} onClick={() => { setSelectedAvatarId(voter.id); setTacticalPlan(null); setCronopostingResult(null); }} className={`snap-center min-w-[320px] bg-white border cursor-pointer transition-all duration-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative group hover:-translate-y-1 hover:shadow-md ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' : 'border-gray-200 hover:border-gray-300'}`}>
                                            {isSelected && <div className="absolute top-2 right-2 bg-brand-primary text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm animate-fade-in">Seleccionado</div>}
                                            <div className={`p-5 border-b border-gray-100 ${isSelected ? 'bg-brand-primary/5' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                                                <div className="flex justify-between items-start mb-3"><span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Perfil Votante</span><UserGroupIcon className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} /></div>
                                                <h5 className="text-sm font-bold text-gray-800 mb-2 font-serif">{voter.archetype}</h5>
                                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{voter.demographics}</p>
                                                <div className="bg-red-50 border border-red-100 p-2 rounded text-[10px] text-red-800 italic">"{voter.painPoint}"</div>
                                            </div>
                                            <div className="p-5 bg-white flex-grow flex flex-col">
                                                <div className="flex justify-between items-start mb-3"><span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-primary' : 'text-gray-500'}`}>Ángulo Candidato</span><MegaphoneIcon className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} /></div>
                                                <h5 className={`text-sm font-bold mb-2 font-serif ${isSelected ? 'text-brand-primary' : 'text-gray-800'}`}>{candidateAvatar.archetype}</h5>
                                                <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium">"{candidateAvatar.messaging_angle}"</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {selectedAvatarId && (
                            <div className="border-t border-gray-100 p-4 bg-white flex justify-center animate-fade-in">
                                <button onClick={handleGenerateTactics} disabled={isGeneratingTactics} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isGeneratingTactics ? <LoadingSpinner className="w-5 h-5"/> : <RocketLaunchIcon className="w-5 h-5" />} {isGeneratingTactics ? 'Generando Tácticas...' : 'Diseñar Campaña Táctica para este Perfil'}
                                </button>
                            </div>
                        )}
                    </AnalysisCard>

                    {tacticalPlan && (
                        <div className="animate-fade-in-up bg-white rounded-xl border border-gray-200 shadow-report-lg overflow-hidden">
                            <div className="bg-brand-primary p-6 text-white">
                                <div className="flex items-center gap-3 mb-2"><SparklesIcon className="w-5 h-5 text-yellow-400" /><h3 className="text-lg font-bold font-serif tracking-wide">CENTRO DE COMANDO TÁCTICO</h3></div>
                                <p className="text-sm text-blue-100 opacity-90 max-w-3xl">Despliegue operativo personalizado.</p>
                            </div>
                            <div className="p-8 space-y-8">
                                <div className="bg-gray-50 border-l-4 border-brand-primary p-5 rounded-r-lg"><h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2"><CpuChipIcon className="w-4 h-4"/> Justificación Técnica & Psicometría</h4><p className="text-sm text-gray-700 leading-relaxed text-justify mb-4">{tacticalPlan.technicalJustification}</p></div>
                                
                                {/* CRONOPOSTING GENERATOR SECTION - RESTORED FULL UI */}
                                <div className="mt-8 border-t-2 border-gray-100 pt-8">
                                    <div className="flex items-center gap-3 mb-6"><CalendarIcon className="w-6 h-6 text-brand-primary" /><div><h3 className="text-lg font-bold font-serif text-gray-800">GENERADOR DE CRONOPOSTING (PROFESIONAL)</h3><p className="text-xs text-gray-500">Configuración Avanzada de Matriz de Contenidos - Alta Frecuencia</p></div></div>
                                    
                                    <div className="mb-6 p-4 bg-gradient-to-r from-brand-primary/5 to-white border border-brand-primary/20 rounded-xl">
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="flex-1 w-full">
                                                <label className="block text-xs font-bold text-brand-primary uppercase mb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4" /> Autoconfiguración Táctica (Magic Prompt)</label>
                                                <div className="relative">
                                                    <textarea value={magicPrompt} onChange={(e) => setMagicPrompt(e.target.value)} placeholder="Ej: Necesito una campaña de 2 semanas muy agresiva para TikTok e Instagram..." className="w-full bg-white border border-brand-primary/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary pr-12 min-h-[80px]" />
                                                    <button onClick={handleAutoConfigure} disabled={isAutoConfiguring || !magicPrompt} className="absolute bottom-3 right-3 p-2 bg-brand-primary text-white rounded-full hover:bg-brand-secondary transition-colors disabled:opacity-50" title="Autoconfigurar con IA">{isAutoConfiguring ? <LoadingSpinner className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Parámetros</h5>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duración</label><select value={cronoConfig.duration} onChange={(e) => handleCronoConfigChange('duration', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"><option value="1 semana">1 Semana (Intensiva)</option><option value="2 semanas">2 Semanas (Campaña)</option><option value="1 mes">1 Mes (Sostenimiento)</option><option value="2 meses">2 Meses (Largo Plazo)</option></select></div>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frecuencia</label><select value={cronoConfig.frequency} onChange={(e) => handleCronoConfigChange('frequency', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"><option value="Baja (Calidad)">Baja (Calidad)</option><option value="Media (Constancia)">Media (Constancia)</option><option value="Alta (Dominancia)">Alta (Dominancia)</option><option value="Enjambre (Viral)">Enjambre (Viral)</option></select></div>
                                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tono de Comunicación</label><select value={cronoConfig.tone} onChange={(e) => handleCronoConfigChange('tone', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"><option value="Institucional">Institucional</option><option value="Disruptivo">Disruptivo</option><option value="Empático">Empático</option><option value="Autoridad">Autoridad</option><option value="Cercano">Cercano</option></select></div>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Canales</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {['Instagram', 'TikTok', 'X', 'Facebook', 'LinkedIn'].map(p => (
                                                        <button key={p} onClick={() => togglePlatform(p)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${cronoConfig.platforms.includes(p) ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-500 border-gray-300'}`}>{p}</button>
                                                    ))}
                                                </div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 mt-4">Objetivo KPI</label>
                                                <select value={cronoConfig.kpiFocus} onChange={(e) => handleCronoConfigChange('kpiFocus', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"><option value="Alcance">Alcance</option><option value="Engagement">Engagement</option><option value="Conversión (Votos)">Conversión (Votos)</option><option value="Tráfico">Tráfico</option></select>
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Recursos</h5>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel de Producción</label>
                                                <select value={cronoConfig.resourcesLevel} onChange={(e) => handleCronoConfigChange('resourcesLevel', e.target.value)} className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"><option value="Bajo (Orgánico)">Bajo (Orgánico)</option><option value="Medio (Semi-Pro)">Medio (Semi-Pro)</option><option value="Alto (Producción)">Alto (Producción)</option></select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={handleGenerateCronoposting} disabled={isGeneratingCronoposting || cronoConfig.platforms.length === 0} className="bg-brand-secondary hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md">
                                                {isGeneratingCronoposting ? <LoadingSpinner className="w-5 h-5"/> : <ClockIcon className="w-5 h-5"/>} {isGeneratingCronoposting ? 'Diseñando Matriz...' : 'Proyectar Cronoposting Profesional'}
                                            </button>
                                        </div>
                                    </div>

                                    {cronopostingResult && (
                                        <div className="mt-6 animate-fade-in-up">
                                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-brand-secondary/10 p-6 border-b border-brand-secondary/20">
                                                    <h4 className="text-lg font-bold text-brand-secondary uppercase tracking-widest font-serif">Matriz Maestra de Contenidos</h4>
                                                    <p className="text-sm text-gray-600 mt-2 max-w-4xl italic">"{cronopostingResult.strategic_rationale}"</p>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                                                            <tr><th className="px-4 py-3 text-left">Fecha/Hora</th><th className="px-4 py-3 text-left">Canal</th><th className="px-4 py-3 text-left w-1/4">Estrategia Copy</th><th className="px-4 py-3 text-left">Dirección de Arte</th><th className="px-4 py-3 text-center">Canvas</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {cronopostingResult.schedule.map((entry, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                                    <td className="px-4 py-3 align-top"><div className="font-bold text-gray-700">{entry.date}</div><div className="text-[10px] text-gray-500">{entry.best_time}</div></td>
                                                                    <td className="px-4 py-3 align-top"><span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-600">{entry.platform}</span><div className="text-[10px] mt-1 text-gray-500">{entry.format}</div></td>
                                                                    <td className="px-4 py-3 align-top"><div className="text-[10px] font-bold text-purple-600 mb-1">{entry.copywriting_framework}</div><div className="text-gray-700">{entry.copy_angle}</div></td>
                                                                    <td className="px-4 py-3 align-top"><div className="bg-gray-100 p-2 rounded text-[9px] font-mono text-gray-600">{entry.asset_prompt.substring(0, 50)}...</div></td>
                                                                    <td className="px-4 py-3 align-middle text-center"><button onClick={() => handleOpenCanvas(entry)} className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:shadow-lg hover:scale-110 transition-all" title="Abrir Canvas Táctico"><SparklesIcon className="w-4 h-4" /></button></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TACTICAL CANVAS MODAL */}
            {canvasState.isOpen && canvasState.entry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b border-gray-800">
                            <div className="flex items-center gap-3"><SparklesIcon className="w-5 h-5 text-purple-400" /><div><h3 className="font-bold text-lg">Canvas Táctico: {canvasState.entry.platform}</h3><p className="text-xs text-gray-400">{canvasState.entry.contentTheme} | {canvasState.entry.copywriting_framework}</p></div></div>
                            <button onClick={() => setCanvasState(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white transition-colors"><CloseIcon className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            <div className="w-full md:w-1/2 p-6 border-r border-gray-200 overflow-y-auto bg-gray-50">
                                {canvasState.isLoadingStructure ? <div className="h-full flex flex-col items-center justify-center text-gray-500"><LoadingSpinner className="w-10 h-10 text-brand-primary mb-4" /><p className="animate-pulse font-medium">Estructurando Post con Gemini 3 Pro...</p></div> : canvasState.postStructure ? (
                                    <div className="space-y-6">
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Caption Generado (Copy)</label><textarea className="w-full h-40 p-4 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent font-sans leading-relaxed" defaultValue={canvasState.postStructure.caption} /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Hashtags Estratégicos</label><div className="bg-white p-3 border border-gray-300 rounded-lg text-xs text-blue-600 font-medium">{canvasState.postStructure.hashtags.join(' ')}</div></div>
                                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200"><label className="block text-xs font-bold text-yellow-800 uppercase mb-1">Notas Estratégicas</label><p className="text-xs text-yellow-900">{canvasState.postStructure.strategic_notes}</p></div>
                                    </div>
                                ) : null}
                            </div>
                            <div className="w-full md:w-1/2 p-6 bg-gray-900 text-white overflow-y-auto flex flex-col">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2"><PhotoIcon className="w-4 h-4" /> Estudio Visual (Nano Banana)</h4>
                                {canvasState.postStructure && <div className="mb-4"><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Prompt Técnico de Imagen</label><textarea className="w-full h-24 p-3 bg-black/30 border border-gray-700 rounded-lg text-xs text-gray-300 focus:border-purple-500 outline-none resize-none font-mono" defaultValue={canvasState.postStructure.image_prompt} /></div>}
                                <div className="flex-1 bg-black/50 rounded-xl border border-dashed border-gray-700 flex items-center justify-center relative overflow-hidden min-h-[300px]">
                                    {canvasState.isLoadingImage ? <div className="text-center"><LoadingSpinner className="w-10 h-10 text-purple-500 mx-auto mb-3" /><p className="text-xs text-purple-300 animate-pulse">Renderizando Imagen...</p></div> : canvasState.generatedImage ? <img src={`data:image/png;base64,${canvasState.generatedImage}`} alt="Generated Asset" className="w-full h-full object-contain" /> : <div className="text-center text-gray-600"><PhotoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-xs">La imagen aparecerá aquí</p></div>}
                                </div>
                                <button onClick={handleGenerateImage} disabled={canvasState.isLoadingImage || !canvasState.postStructure} className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-purple-900/50 disabled:opacity-50 flex items-center justify-center gap-2">
                                    {canvasState.isLoadingImage ? <LoadingSpinner className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />} Generar Imagen (Nano Banana)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingStrategy;
