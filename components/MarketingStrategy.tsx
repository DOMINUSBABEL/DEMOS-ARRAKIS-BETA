
import React, { useState, useEffect, useRef } from 'react';
import AnalysisCard from './AnalysisCard';
import { MegaphoneIcon, LoadingSpinner, UserGroupIcon, ChartBarIcon, MapIcon, SparklesIcon, WarningIcon, CpuChipIcon, ArrowsUpDownIcon, DatabaseIcon, PencilIcon, PhotoIcon, ChatBubbleBottomCenterTextIcon, RocketLaunchIcon, CalendarIcon, ClockIcon, EyeIcon, FilePdfIcon } from './Icons';
import { generateMarketingStrategy, generateTacticalCampaign, generateCronoposting } from '../services/geminiService';
import { generateMarketingFullReportPDF } from '../services/reportGenerator';
import { MarketingStrategyResult, TacticalCampaignResult, CronopostingResult, CronopostingConfig } from '../types';

const MarketingStrategy: React.FC = () => {
    // Initial State Pre-filled with Simulation Data for John Jairo Berrío
    const [targetName, setTargetName] = useState('John Jairo Berrío');
    const [targetType, setTargetType] = useState<'candidate' | 'party'>('candidate');
    const [context, setContext] = useState('Diputado de Antioquia (Centro Democrático). Base: Medellín, Bello, Norte del Valle de Aburrá. Enfoque: Seguridad y Obras.');
    const [isLoading, setIsLoading] = useState(false);
    
    // Ref for Full Report Export
    const marketingRef = useRef<HTMLDivElement>(null);

    const [strategy, setStrategy] = useState<MarketingStrategyResult | null>({
        candidateProfile: "Perfil: 'El Hombre del Orden y las Obras'. John Jairo Berrío se posiciona como la figura de autoridad necesaria para recuperar la seguridad en Medellín y el Valle de Aburrá. Su discurso evita tecnicismos fiscales, traduciendo 'gestión de recursos' en 'cemento y patrullas'. Representa la tradición política antioqueña combinada con resultados tangibles.",
        calculatedBase: 34425,
        pipeline: {
            phase1_extraction: [
                "Auditoría Forense E-14 (2018-2022) en Comunas 1 (Popular), 2 (Santa Cruz) y 3 (Manrique).",
                "Mapeo de líderes comunales en Bello desconectados de la administración actual.",
                "Identificación de zonas con aumento de hurtos (Heatmap de inseguridad)."
            ],
            phase2_execution: [
                "Campaña de Micro-segmentación en WhatsApp: 'Reporte Seguro' (Canal de denuncia directa).",
                "Publicidad OOH (Vallas): Mensajes de alto contraste 'Mano Dura = Barrio Seguro'.",
                "Tomas de barrio con 'Brigadas de Pequeñas Obras' (reparcheo simbólico, iluminación)."
            ],
            phase3_conversion: [
                "Eventos 'Café con Berrío': Reuniones cerradas con madres cabeza de familia para discutir seguridad barrial.",
                "Activación de Testimoniales: Vecinos agradeciendo obras específicas gestionadas en el pasado.",
                "Día D: Operación Remate con transporte organizado en zonas de alta fidelidad."
            ]
        },
        voterAvatars: [
            {
                id: 1,
                archetype: "Doña Gloria (La Matriarca Preocupada)",
                demographics: "Mujer, 55 años, Ama de casa/Ventas por catálogo, Barrio Popular 1.",
                painPoint: "Le da miedo que sus nietos salgan al parque por los viciosos.",
                channel: "WhatsApp (Cadenas de oración y noticias), Radio AM."
            },
            {
                id: 2,
                archetype: "El 'Mono' (El Comerciante Informal)",
                demographics: "Hombre, 35 años, Vendedor ambulante/Pequeño comerciante, Centro de Medellín.",
                painPoint: "La 'vacuna' y la inseguridad no lo dejan trabajar. Siente que paga impuestos para nada.",
                channel: "Facebook (Grupos de compra/venta), Voz a voz."
            }
        ],
        candidateAvatars: [
            {
                id: 1,
                archetype: "El Protector (Autoridad Paternal)",
                messaging_angle: "No me tiembla la mano. La seguridad no se negocia, se impone. Protegeré a su familia como a la mía.",
                visual_style: "Traje sin corbata, mangas arremangadas, rodeado de fuerza pública o comunidad.",
                target_voter_ids: [1]
            },
            {
                id: 2,
                archetype: "El Ejecutor (El Ingeniero de Obras)",
                messaging_angle: "Menos discurso, más cemento. Sus impuestos se verán en la calle, no en los bolsillos de la burocracia.",
                visual_style: "Casco de obra, chaleco, señalando planos o maquinaria.",
                target_voter_ids: [2]
            }
        ],
        kpis: [
            { metric: "Base de Datos Calificada", target: "15,000 Registros" },
            { metric: "Alcance WhatsApp", target: "80,000 Impactos Semanales" },
            { metric: "Líderes Barriales Activos", target: "120 Coordinadores" },
            { metric: "Intención de Voto (Encuesta Interna)", target: "14% en Target Objetivo" }
        ]
    });
    const [error, setError] = useState<string | null>(null);

    // --- New States for Tactical Interaction & Cronoposting ---
    const [selectedAvatarId, setSelectedAvatarId] = useState<number | null>(null);
    const [isGeneratingTactics, setIsGeneratingTactics] = useState(false);
    const [tacticalPlan, setTacticalPlan] = useState<TacticalCampaignResult | null>(null);
    
    // Advanced Cronoposting State (500% more parameters)
    const [isGeneratingCronoposting, setIsGeneratingCronoposting] = useState(false);
    const [cronopostingResult, setCronopostingResult] = useState<CronopostingResult | null>(null);
    
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

    const toggleFormat = (format: string) => {
        setCronoConfig(prev => {
            const newFormats = prev.keyFormats.includes(format)
                ? prev.keyFormats.filter(f => f !== format)
                : [...prev.keyFormats, format];
            return { ...prev, keyFormats: newFormats };
        });
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

        // Enhance context with the specific tactical plan details
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

    const handleExportFullReport = () => {
        if (marketingRef.current) {
            generateMarketingFullReportPDF(marketingRef.current, `Dossier_Marketing_${targetName.replace(/\s+/g, '_')}.pdf`);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in" ref={marketingRef}>
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                    <MegaphoneIcon className="w-6 h-6 text-brand-primary" />
                    Marketing de Guerra Electoral
                </h2>
                {strategy && (
                    <button 
                        onClick={handleExportFullReport}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-md flex items-center gap-2 text-sm"
                    >
                        <FilePdfIcon className="w-5 h-5" />
                        Exportar Dossier Completo (PDF)
                    </button>
                )}
            </div>

            <AnalysisCard
                title="Configuración de Objetivo"
                explanation="Define el candidato o partido y el contexto estratégico para iniciar la generación de inteligencia de marketing."
                icon={<MegaphoneIcon />}
                fullscreenable={false}
                collapsible={true}
                defaultCollapsed={!!strategy}
            >
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-6 bg-white rounded-b-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre del Objetivo</label>
                            <input
                                type="text"
                                value={targetName}
                                onChange={(e) => setTargetName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tipo de Objetivo</label>
                            <div className="flex space-x-6 mt-3">
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={targetType === 'candidate'}
                                        onChange={() => setTargetType('candidate')}
                                        className="form-radio text-brand-primary focus:ring-brand-primary border-gray-300 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium group-hover:text-brand-primary transition-colors">Candidato</span>
                                </label>
                                <label className="flex items-center cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={targetType === 'party'}
                                        onChange={() => setTargetType('party')}
                                        className="form-radio text-brand-primary focus:ring-brand-primary border-gray-300 h-4 w-4"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium group-hover:text-brand-primary transition-colors">Partido/Movimiento</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contexto Estratégico</label>
                        <textarea
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="Describe la situación actual..."
                            rows={3}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-all"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-primary hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-lg transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoading ? 'Procesando...' : 'Generar Estrategia'}
                        </button>
                    </div>
                </form>
                {error && (
                    <div className="mx-6 mb-6 flex items-center p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0 text-red-600" />
                        <p>{error}</p>
                    </div>
                )}
            </AnalysisCard>

            {strategy && (
                <div className="space-y-8 animate-fade-in-up">
                    {/* Header Strategy Summary - Corporate Style */}
                    <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-report-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="px-3 py-1 bg-brand-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-sm">Candidato Oficial</span>
                                    <span className="text-gray-400 text-xs font-mono uppercase">{new Date().getFullYear()} Strategy</span>
                                </div>
                                <h2 className="text-4xl font-serif font-bold text-brand-primary mb-4 tracking-tight">{targetName}</h2>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
                                        <CpuChipIcon className="w-4 h-4 text-brand-secondary"/>
                                        <span className="text-xs font-bold uppercase">Base Calculada:</span>
                                        <span className="text-sm font-mono font-bold text-brand-primary">{strategy.calculatedBase?.toLocaleString('es-CO')}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 leading-relaxed text-base max-w-4xl border-l-4 border-gray-200 pl-4 italic">
                                    "{strategy.candidateProfile}"
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3-Phase Pipeline - Corporate Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Phase 1 */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gray-400"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                    <DatabaseIcon className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                                    Fase 1: Diagnóstico
                                </h4>
                            </div>
                            <ul className="space-y-4">
                                {strategy.pipeline.phase1_extraction.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                                        <span className="text-gray-400 font-bold text-xs mt-0.5">0{i+1}</span>
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Phase 2 */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-brand-primary">
                                    <MapIcon className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-brand-primary uppercase tracking-widest">
                                    Fase 2: Ejecución
                                </h4>
                            </div>
                            <ul className="space-y-4">
                                {strategy.pipeline.phase2_execution.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                                        <span className="text-blue-200 font-bold text-xs mt-0.5">0{i+1}</span>
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Phase 3 */}
                        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-brand-secondary"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg text-brand-secondary">
                                    <UserGroupIcon className="w-6 h-6" />
                                </div>
                                <h4 className="text-sm font-bold text-brand-secondary uppercase tracking-widest">
                                    Fase 3: Conversión
                                </h4>
                            </div>
                            <ul className="space-y-4">
                                {strategy.pipeline.phase3_conversion.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                                        <span className="text-red-200 font-bold text-xs mt-0.5">0{i+1}</span>
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Matrix 10x10 - Clean Layout with Interactions */}
                    <AnalysisCard title="Matriz de Conexión: Votante vs. Candidato" explanation="Selecciona una tarjeta para generar el despliegue táctico específico para ese micro-segmento." collapsible={false} icon={<ArrowsUpDownIcon />}>
                        <div className="p-6 bg-gray-50">
                            <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar snap-x items-stretch">
                                {strategy.voterAvatars.map((voter, idx) => {
                                    const candidateAvatar = strategy.candidateAvatars[idx] || strategy.candidateAvatars[0];
                                    const isSelected = selectedAvatarId === voter.id;
                                    
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => {
                                                setSelectedAvatarId(voter.id);
                                                setTacticalPlan(null); // Reset plan when changing selection
                                                setCronopostingResult(null);
                                            }}
                                            className={`snap-center min-w-[320px] bg-white border cursor-pointer transition-all duration-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative group hover:-translate-y-1 hover:shadow-md
                                                ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' : 'border-gray-200 hover:border-gray-300'}
                                            `}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-2 right-2 bg-brand-primary text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10 shadow-sm animate-fade-in">
                                                    Seleccionado
                                                </div>
                                            )}
                                            
                                            {/* Voter Card */}
                                            <div className={`p-5 border-b border-gray-100 ${isSelected ? 'bg-brand-primary/5' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Perfil Votante</span>
                                                    <UserGroupIcon className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                                                </div>
                                                <h5 className="text-sm font-bold text-gray-800 mb-2 font-serif">{voter.archetype}</h5>
                                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{voter.demographics}</p>
                                                <div className="bg-red-50 border border-red-100 p-2 rounded text-[10px] text-red-800 italic">
                                                    "{voter.painPoint}"
                                                </div>
                                            </div>

                                            {/* Connection Line */}
                                            <div className="h-1 bg-gray-100 relative">
                                                <div className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border rounded-full p-1 ${isSelected ? 'border-brand-primary text-brand-primary' : 'border-gray-200 text-gray-400'}`}>
                                                    <ArrowsUpDownIcon className="w-3 h-3" />
                                                </div>
                                            </div>

                                            {/* Candidate Card */}
                                            <div className="p-5 bg-white flex-grow flex flex-col">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-brand-primary' : 'text-gray-500'}`}>Ángulo Candidato</span>
                                                    <MegaphoneIcon className={`w-4 h-4 ${isSelected ? 'text-brand-primary' : 'text-gray-400'}`} />
                                                </div>
                                                <h5 className={`text-sm font-bold mb-2 font-serif ${isSelected ? 'text-brand-primary' : 'text-gray-800'}`}>{candidateAvatar.archetype}</h5>
                                                <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium">"{candidateAvatar.messaging_angle}"</p>
                                                <div className="mt-auto flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-primary' : 'bg-gray-300'}`}></span>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{candidateAvatar.visual_style}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        
                        {/* Tactical Action Bar */}
                        {selectedAvatarId && (
                            <div className="border-t border-gray-100 p-4 bg-white flex justify-center animate-fade-in">
                                <button
                                    onClick={handleGenerateTactics}
                                    disabled={isGeneratingTactics}
                                    className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingTactics ? <LoadingSpinner className="w-5 h-5"/> : <RocketLaunchIcon className="w-5 h-5" />}
                                    {isGeneratingTactics ? 'Generando Tácticas...' : 'Diseñar Campaña Táctica para este Perfil'}
                                </button>
                            </div>
                        )}
                    </AnalysisCard>

                    {/* TACTICAL CAMPAIGN OUTPUT SECTION */}
                    {tacticalPlan && (
                        <div className="animate-fade-in-up bg-white rounded-xl border border-gray-200 shadow-report-lg overflow-hidden">
                            <div className="bg-brand-primary p-6 text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <SparklesIcon className="w-5 h-5 text-yellow-400" />
                                    <h3 className="text-lg font-bold font-serif tracking-wide">CENTRO DE COMANDO TÁCTICO</h3>
                                </div>
                                <p className="text-sm text-blue-100 opacity-90 max-w-3xl">
                                    Despliegue operativo personalizado para conectar el ángulo del candidato con el votante seleccionado con alto rigor técnico.
                                </p>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Technical Justification & Psychographics */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 border-l-4 border-brand-primary p-5 rounded-r-lg">
                                        <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <CpuChipIcon className="w-4 h-4"/> Justificación Técnica & Psicometría
                                        </h4>
                                        <p className="text-sm text-gray-700 leading-relaxed text-justify mb-4">
                                            {tacticalPlan.technicalJustification}
                                        </p>
                                        
                                        {/* Psychometric Radar Mini-Vis */}
                                        {tacticalPlan.psychometricProfile && (
                                            <div className="bg-white p-3 rounded border border-gray-200">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Perfil OCEAN (Big 5)</p>
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>Apertura:</span> <span className="font-bold text-blue-600">{tacticalPlan.psychometricProfile.openness}</span></div>
                                                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>Responsabilidad:</span> <span className="font-bold text-blue-600">{tacticalPlan.psychometricProfile.conscientiousness}</span></div>
                                                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>Extroversión:</span> <span className="font-bold text-blue-600">{tacticalPlan.psychometricProfile.extraversion}</span></div>
                                                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>Amabilidad:</span> <span className="font-bold text-blue-600">{tacticalPlan.psychometricProfile.agreeableness}</span></div>
                                                    <div className="flex justify-between border-b border-gray-100 pb-1"><span>Neuroticismo:</span> <span className="font-bold text-red-600">{tacticalPlan.psychometricProfile.neuroticism}</span></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <MapIcon className="w-4 h-4"/> Proyección Geográfica (Zonas Objetivo)
                                            </h4>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {tacticalPlan.geographicFocus?.map((zone, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-white border border-blue-200 rounded-full text-xs font-bold text-blue-700 shadow-sm">
                                                        {zone}
                                                    </span>
                                                ))}
                                            </div>
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <UserGroupIcon className="w-4 h-4"/> Adaptación Demográfica
                                            </h4>
                                            <p className="text-xs text-gray-600 italic leading-relaxed">
                                                "{tacticalPlan.demographicAdaptation}"
                                            </p>
                                        </div>

                                        {/* Narrative Warfare */}
                                        {tacticalPlan.narrativeWarfare && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-red-50 p-3 rounded border border-red-100">
                                                    <p className="text-[10px] font-bold text-red-500 uppercase">Vector de Ataque</p>
                                                    <p className="text-xs text-gray-700 mt-1">{tacticalPlan.narrativeWarfare.attack_vector}</p>
                                                </div>
                                                <div className="bg-green-50 p-3 rounded border border-green-100">
                                                    <p className="text-[10px] font-bold text-green-600 uppercase">Vector de Defensa</p>
                                                    <p className="text-xs text-gray-700 mt-1">{tacticalPlan.narrativeWarfare.defense_vector}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* VIRAL PAYLOADS SECTION */}
                                {tacticalPlan.viralPayloads && tacticalPlan.viralPayloads.length > 0 && (
                                    <div className="mt-8">
                                        <h4 className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-purple-100 pb-2">
                                            <SparklesIcon className="w-5 h-5"/> Fábrica de Cargas Virales
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {tacticalPlan.viralPayloads.map((payload, i) => (
                                                <div key={i} className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded">{payload.format}</span>
                                                        <span className="text-[10px] text-gray-400">Concepto #{i+1}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-800 mb-2 leading-tight">"{payload.hook}"</p>
                                                    <p className="text-xs text-gray-500 mb-3 italic">Trigger: {payload.psychological_trigger}</p>
                                                    
                                                    <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                            <PhotoIcon className="w-3 h-3"/> Prompt Visual
                                                        </p>
                                                        <p className="text-[10px] text-gray-600 font-mono break-words leading-tight">{payload.visual_prompt}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                                    {/* Column 1: Copywriting & Speech */}
                                    <div className="space-y-6">
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <MegaphoneIcon className="w-4 h-4 text-red-500"/> Slogans de Combate
                                            </h4>
                                            <ul className="space-y-3">
                                                {tacticalPlan.slogans.map((slogan, i) => (
                                                    <li key={i} className="text-sm font-bold text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                                        "{slogan}"
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <ChatBubbleBottomCenterTextIcon className="w-4 h-4 text-green-500"/> Hook de Discurso
                                            </h4>
                                            <p className="text-sm text-gray-600 leading-relaxed italic bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                                "{tacticalPlan.speechFragment}"
                                            </p>
                                        </div>
                                        
                                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <MapIcon className="w-4 h-4 text-brand-primary"/> Acciones de Tierra
                                            </h4>
                                            <ul className="space-y-2 list-disc pl-5 text-sm text-gray-600">
                                                {tacticalPlan.groundEvents.map((event, i) => (
                                                    <li key={i}>{event}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Column 2: Digital Assets */}
                                    <div className="space-y-6">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <PencilIcon className="w-4 h-4 text-blue-500"/> Activos Digitales Tácticos
                                        </h4>
                                        
                                        {/* Social Media Posts */}
                                        {tacticalPlan.socialMediaPosts.map((post, i) => (
                                            <div key={i} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-gray-600 uppercase">{post.platform}</span>
                                                    <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">Obj: {post.objective}</span>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Copy</p>
                                                        <p className="text-sm text-gray-800 whitespace-pre-line">{post.copy}</p>
                                                    </div>
                                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                        <p className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                            <PhotoIcon className="w-3 h-3"/> Prompt Visual (Imagen)
                                                        </p>
                                                        <p className="text-xs text-blue-800 italic">{post.visualPrompt}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                        {/* WhatsApp Message */}
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                Cadena de WhatsApp
                                            </h4>
                                            <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                                                <p className="text-sm text-gray-800 whitespace-pre-line">{tacticalPlan.whatsappMessage}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ADVANCED CRONOPOSTING GENERATOR SECTION */}
                                <div className="mt-8 border-t-2 border-gray-100 pt-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <CalendarIcon className="w-6 h-6 text-brand-primary" />
                                        <div>
                                            <h3 className="text-lg font-bold font-serif text-gray-800">GENERADOR DE CRONOPOSTING (PROFESIONAL)</h3>
                                            <p className="text-xs text-gray-500">Configuración Avanzada de Matriz de Contenidos - Alta Frecuencia</p>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                            {/* Column 1: Basics */}
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Parámetros Temporales</h5>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duración</label>
                                                    <select 
                                                        value={cronoConfig.duration}
                                                        onChange={(e) => handleCronoConfigChange('duration', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="1 semana">1 Semana (Intensiva)</option>
                                                        <option value="2 semanas">2 Semanas (Campaña)</option>
                                                        <option value="1 mes">1 Mes (Sostenimiento)</option>
                                                        <option value="2 meses">2 Meses (Largo Plazo)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Inicio</label>
                                                    <input 
                                                        type="date" 
                                                        value={cronoConfig.startDate}
                                                        onChange={(e) => handleCronoConfigChange('startDate', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frecuencia de Publicación</label>
                                                    <select 
                                                        value={cronoConfig.frequency}
                                                        onChange={(e) => handleCronoConfigChange('frequency', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="Baja (Calidad)">Baja (Enfoque en Calidad)</option>
                                                        <option value="Media (Constancia)">Media (Constancia Diaria)</option>
                                                        <option value="Alta (Dominancia)">Alta (Dominancia de Algoritmo)</option>
                                                        <option value="Enjambre (Viral)">Enjambre (Viral/Ataque)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Column 2: Strategy */}
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Estrategia de Contenido</h5>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tono de Comunicación</label>
                                                    <select 
                                                        value={cronoConfig.tone}
                                                        onChange={(e) => handleCronoConfigChange('tone', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="Institucional">Institucional / Serio</option>
                                                        <option value="Cercano">Cercano / Ciudadano</option>
                                                        <option value="Disruptivo">Disruptivo / Polémico</option>
                                                        <option value="Empático">Empático / Emocional</option>
                                                        <option value="Autoridad">Autoridad / Experto</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mix de Contenido (Regla)</label>
                                                    <select 
                                                        value={cronoConfig.contentMix}
                                                        onChange={(e) => handleCronoConfigChange('contentMix', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="Educativo (70/20/10)">Educativo (70/20/10)</option>
                                                        <option value="Promocional (Agresivo)">Promocional (Venta Directa)</option>
                                                        <option value="Entretenimiento (Viral)">Entretenimiento (Viralidad)</option>
                                                        <option value="Storytelling (Marca)">Storytelling (Construcción de Marca)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">KPI Principal</label>
                                                    <select 
                                                        value={cronoConfig.kpiFocus}
                                                        onChange={(e) => handleCronoConfigChange('kpiFocus', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="Alcance">Alcance (Visibilidad)</option>
                                                        <option value="Engagement">Engagement (Interacción)</option>
                                                        <option value="Conversión (Votos)">Conversión (Intención de Voto)</option>
                                                        <option value="Tráfico">Tráfico (Web/WhatsApp)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Column 3: Logistics */}
                                            <div className="space-y-4">
                                                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-1">Canales y Recursos</h5>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nivel de Recursos (Producción)</label>
                                                    <select 
                                                        value={cronoConfig.resourcesLevel}
                                                        onChange={(e) => handleCronoConfigChange('resourcesLevel', e.target.value)}
                                                        className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                    >
                                                        <option value="Bajo (Orgánico)">Bajo (Orgánico/Selfie)</option>
                                                        <option value="Medio (Semi-Pro)">Medio (Semi-Pro/Edición)</option>
                                                        <option value="Alto (Producción)">Alto (Producción/Estudio)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Plataformas Activas</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Instagram', 'TikTok', 'X', 'Facebook', 'LinkedIn'].map(p => (
                                                            <button
                                                                key={p}
                                                                type="button"
                                                                onClick={() => togglePlatform(p)}
                                                                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                                                    cronoConfig.platforms.includes(p) 
                                                                    ? 'bg-brand-primary text-white border-brand-primary' 
                                                                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {p}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Formatos Clave</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {['Reels', 'Historias', 'Carruseles', 'Hilos', 'Video Largo', 'Imagen Estática'].map(f => (
                                                            <button
                                                                key={f}
                                                                type="button"
                                                                onClick={() => toggleFormat(f)}
                                                                className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                                                    cronoConfig.keyFormats.includes(f) 
                                                                    ? 'bg-brand-secondary text-white border-brand-secondary' 
                                                                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                {f}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objetivo Estratégico (Y)</label>
                                            <input 
                                                type="text" 
                                                value={cronoConfig.goal}
                                                onChange={(e) => handleCronoConfigChange('goal', e.target.value)}
                                                className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary font-medium"
                                            />
                                        </div>

                                        <div className="flex justify-end">
                                            <button 
                                                onClick={handleGenerateCronoposting}
                                                disabled={isGeneratingCronoposting || cronoConfig.platforms.length === 0}
                                                className="bg-brand-secondary hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md"
                                            >
                                                {isGeneratingCronoposting ? <LoadingSpinner className="w-5 h-5"/> : <ClockIcon className="w-5 h-5"/>}
                                                {isGeneratingCronoposting ? 'Diseñando Matriz...' : 'Proyectar Cronoposting Profesional'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cronoposting Results */}
                                    {cronopostingResult && (
                                        <div className="mt-6 animate-fade-in-up">
                                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <div className="bg-brand-secondary/10 p-6 border-b border-brand-secondary/20">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h4 className="text-lg font-bold text-brand-secondary uppercase tracking-widest font-serif">Matriz Maestra de Contenidos</h4>
                                                            <p className="text-sm text-gray-600 mt-2 max-w-4xl italic">
                                                                "{cronopostingResult.strategic_rationale}"
                                                            </p>
                                                        </div>
                                                        <div className="text-right hidden md:block">
                                                            <div className="inline-block bg-white px-3 py-1 rounded border border-brand-secondary/30 text-xs font-bold text-brand-secondary shadow-sm">
                                                                Plan {cronoConfig.frequency}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 p-3 bg-white/50 rounded-lg border border-brand-secondary/10 text-xs text-gray-700">
                                                        <strong>Overview:</strong> {cronopostingResult.overview}
                                                    </div>
                                                </div>
                                                
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left w-24">Fecha/Hora</th>
                                                                <th className="px-4 py-3 text-left w-24">Canal</th>
                                                                <th className="px-4 py-3 text-left w-24">Formato</th>
                                                                <th className="px-4 py-3 text-left w-1/5">Tema & Objetivo</th>
                                                                <th className="px-4 py-3 text-left w-1/4">Estrategia Copy (Copywriting)</th>
                                                                <th className="px-4 py-3 text-left">Dirección de Arte (Asset Prompt)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {cronopostingResult.schedule.map((entry, idx) => (
                                                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                                                    <td className="px-4 py-3 align-top">
                                                                        <div className="font-mono font-bold text-gray-700">{entry.date}</div>
                                                                        <div className="text-[10px] text-gray-500 mt-1 bg-gray-100 px-1 rounded inline-block">{entry.best_time}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase block w-fit mb-1 ${
                                                                            entry.platform.toLowerCase().includes('instagram') ? 'bg-pink-100 text-pink-600' :
                                                                            entry.platform.toLowerCase().includes('tiktok') ? 'bg-gray-800 text-white' :
                                                                            entry.platform.toLowerCase().includes('twitter') || entry.platform.toLowerCase().includes('x') ? 'bg-blue-100 text-blue-600' :
                                                                            entry.platform.toLowerCase().includes('linkedin') ? 'bg-blue-800 text-white' :
                                                                            'bg-green-100 text-green-600'
                                                                        }`}>
                                                                            {entry.platform}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top text-gray-600 font-medium">{entry.format}</td>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <p className="font-bold text-gray-800 leading-tight mb-1">{entry.contentTheme}</p>
                                                                        <p className="text-[10px] text-gray-500 italic">Obj: {entry.objective}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <div className="mb-1">
                                                                            <span className="text-[9px] font-bold uppercase text-purple-600 bg-purple-50 px-1 rounded border border-purple-100 mr-2">
                                                                                {entry.copywriting_framework}
                                                                            </span>
                                                                            <span className="text-[10px] font-medium text-gray-700">{entry.copy_angle}</span>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                                            {entry.hashtags.slice(0, 3).map((tag, tIdx) => (
                                                                                <span key={tIdx} className="text-[9px] text-blue-500">#{tag}</span>
                                                                            ))}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3 align-top">
                                                                        <div className="bg-gray-100 p-2 rounded border border-gray-200 font-mono text-[9px] text-gray-600 leading-relaxed mb-1">
                                                                            <span className="font-bold text-gray-400 block mb-1">PROMPT:</span>
                                                                            {entry.asset_prompt}
                                                                        </div>
                                                                        <div className="text-[9px] text-gray-400 italic">
                                                                            Comp: {entry.visual_composition}
                                                                        </div>
                                                                    </td>
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

                    {/* KPIs Footer */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {strategy.kpis.map((kpi, i) => (
                            <div key={i} className="bg-white border border-gray-200 p-5 rounded-lg text-center shadow-sm">
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 font-bold">{kpi.metric}</p>
                                <p className="text-xl font-bold text-brand-primary font-mono">{kpi.target}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingStrategy;
