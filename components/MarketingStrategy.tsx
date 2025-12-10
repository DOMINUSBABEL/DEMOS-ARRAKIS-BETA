
import React, { useState, useEffect } from 'react';
import AnalysisCard from './AnalysisCard';
import { MegaphoneIcon, LoadingSpinner, UserGroupIcon, ChartBarIcon, MapIcon, SparklesIcon, WarningIcon, CpuChipIcon, ArrowsUpDownIcon, DatabaseIcon, PencilIcon, PhotoIcon, ChatBubbleBottomCenterTextIcon, RocketLaunchIcon, CalendarIcon, ClockIcon } from './Icons';
import { generateMarketingStrategy, generateTacticalCampaign, generateCronoposting } from '../services/geminiService';
import { MarketingStrategyResult, TacticalCampaignResult, CronopostingResult } from '../types';
import AntioquiaHeatmap from './AntioquiaHeatmap'; // IMPORT HEATMAP

const MarketingStrategy: React.FC = () => {
    // ... (State initialization remains exactly the same) ...
    const [targetName, setTargetName] = useState('John Jairo Berrío');
    const [targetType, setTargetType] = useState<'candidate' | 'party'>('candidate');
    const [context, setContext] = useState('Diputado de Antioquia (Centro Democrático). Base: Medellín, Bello, Norte del Valle de Aburrá. Enfoque: Seguridad y Obras.');
    const [isLoading, setIsLoading] = useState(false);
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
    
    // Cronoposting State
    const [isGeneratingCronoposting, setIsGeneratingCronoposting] = useState(false);
    const [cronopostingResult, setCronopostingResult] = useState<CronopostingResult | null>(null);
    const [cronoDuration, setCronoDuration] = useState('1 mes');
    const [cronoStartDate, setCronoStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [cronoGoal, setCronoGoal] = useState('Incrementar reconocimiento de marca en un 20%');
    const [cronoIntensity, setCronoIntensity] = useState('Alta');
    const [cronoTone, setCronoTone] = useState('Inspirador y Propositivo');

    // ... (Handlers remain the same: handleSubmit, handleGenerateTactics, handleGenerateCronoposting) ...
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

        const voter = strategy.voterAvatars?.find(v => v.id === selectedAvatarId);
        const candidate = strategy.candidateAvatars?.find(c => c.id === selectedAvatarId) || strategy.candidateAvatars?.[0];

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

        try {
            const result = await generateCronoposting(cronoDuration, cronoStartDate, cronoGoal, enhancedContext, cronoIntensity, cronoTone);
            setCronopostingResult(result);
        } catch (err: any) {
            setError(err.message || "Error al generar el cronograma.");
        } finally {
            setIsGeneratingCronoposting(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* ... (First part of the component: AnalysisCard, form, Strategy Summary) ... */}
            <AnalysisCard
                title="Estrategia de Marketing Dinámico (Guerra Electoral)"
                explanation="Generación de pipeline estratégico, avatares de votantes y matrices de contenido táctico con cronogramas inteligentes."
                icon={<MegaphoneIcon />}
                fullscreenable={false}
            >
                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 gap-6 bg-white rounded-b-lg">
                    {/* ... (Form Inputs) ... */}
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
                    {/* ... (Header Strategy Summary & Pipeline cards) ... */}
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

                    {/* PIPELINE DISPLAY (With Safety Check) */}
                    {strategy.pipeline ? (
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
                                    {strategy.pipeline.phase1_extraction?.map((item, i) => (
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
                                    {strategy.pipeline.phase2_execution?.map((item, i) => (
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
                                    {strategy.pipeline.phase3_conversion?.map((item, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                                            <span className="text-red-200 font-bold text-xs mt-0.5">0{i+1}</span>
                                            <span className="leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            No se pudo generar el pipeline estratégico completo. Intente regenerar la estrategia.
                        </div>
                    )}

                    {/* Matrix 10x10 - Clean Layout with Interactions */}
                    <AnalysisCard title="Matriz de Conexión: Votante vs. Candidato" explanation="Selecciona una tarjeta para generar el despliegue táctico específico para ese micro-segmento." collapsible={false} icon={<ArrowsUpDownIcon />}>
                        <div className="p-6 bg-gray-50">
                            <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar snap-x items-stretch">
                                {strategy.voterAvatars?.map((voter, idx) => {
                                    const candidateAvatar = strategy.candidateAvatars?.[idx] || strategy.candidateAvatars?.[0] || {
                                        id: 0,
                                        archetype: "N/A",
                                        messaging_angle: "No disponible",
                                        visual_style: "No disponible",
                                        target_voter_ids: []
                                    };
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
                                            {/* ... (Card content) ... */}
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
                                {/* Technical Justification & Geographic Projection */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div className="bg-gray-50 border-l-4 border-brand-primary p-5 rounded-r-lg">
                                            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <CpuChipIcon className="w-4 h-4"/> Justificación Técnica
                                            </h4>
                                            <p className="text-sm text-gray-700 leading-relaxed text-justify">
                                                {tacticalPlan.technicalJustification}
                                            </p>
                                        </div>
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-lg">
                                            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0 mb-2 flex items-center gap-2">
                                                <UserGroupIcon className="w-4 h-4"/> Adaptación Demográfica
                                            </h4>
                                            <p className="text-xs text-gray-600 italic leading-relaxed">
                                                "{tacticalPlan.demographicAdaptation}"
                                            </p>
                                        </div>
                                    </div>

                                    {/* HEATMAP INTEGRATION */}
                                    <div className="h-full min-h-[300px] border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                        <div className="bg-white p-2 border-b border-gray-200 flex justify-between items-center">
                                            <h4 className="text-xs font-bold text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                                <MapIcon className="w-4 h-4"/> Geografía de Impacto
                                            </h4>
                                            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Objetivos Tácticos</span>
                                        </div>
                                        <div className="h-[300px] relative">
                                            <AntioquiaHeatmap 
                                                mode="tactical" 
                                                tacticalFocus={tacticalPlan.geographicFocus} 
                                            />
                                        </div>
                                        <div className="p-2 bg-white border-t border-gray-200">
                                            <p className="text-[10px] text-gray-500 mb-1 font-bold">Zonas Clave:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {tacticalPlan.geographicFocus?.map((zone, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[9px]">
                                                        {zone}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ... (CRONOPOSTING GENERATOR SECTION remains exactly the same) ... */}
                                <div className="mt-8 border-t-2 border-gray-100 pt-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <CalendarIcon className="w-6 h-6 text-brand-primary" />
                                        <h3 className="text-lg font-bold font-serif text-gray-800">CENTRO DE CONTENIDOS & SOCIAL LISTENING</h3>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Duración</label>
                                                <select 
                                                    value={cronoDuration}
                                                    onChange={(e) => setCronoDuration(e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                >
                                                    <option value="1 semana">1 Semana</option>
                                                    <option value="2 semanas">2 Semanas</option>
                                                    <option value="1 mes">1 Mes</option>
                                                    <option value="2 meses">2 Meses</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Inicio (X)</label>
                                                <input 
                                                    type="date" 
                                                    value={cronoStartDate}
                                                    onChange={(e) => setCronoStartDate(e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Intensidad</label>
                                                <select 
                                                    value={cronoIntensity}
                                                    onChange={(e) => setCronoIntensity(e.target.value)}
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                >
                                                    <option value="Baja">Baja (Mantenimiento)</option>
                                                    <option value="Media">Media (Crecimiento)</option>
                                                    <option value="Alta">Alta (Ataque/Viral)</option>
                                                </select>
                                            </div>
                                            <div className="lg:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tono Narrativo</label>
                                                <input 
                                                    type="text" 
                                                    value={cronoTone}
                                                    onChange={(e) => setCronoTone(e.target.value)}
                                                    placeholder="Ej: Inspirador, Confrontativo, Institucional"
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                />
                                            </div>
                                            <div className="md:col-span-4 lg:col-span-5">
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Objetivo Estratégico (Y)</label>
                                                <input 
                                                    type="text" 
                                                    value={cronoGoal}
                                                    onChange={(e) => setCronoGoal(e.target.value)}
                                                    placeholder="Ej: Aumentar reconocimiento en jóvenes en un 15%"
                                                    className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:ring-brand-primary"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <button 
                                                onClick={handleGenerateCronoposting}
                                                disabled={isGeneratingCronoposting}
                                                className="bg-brand-secondary hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm shadow-md"
                                            >
                                                {isGeneratingCronoposting ? <LoadingSpinner className="w-4 h-4"/> : <ClockIcon className="w-4 h-4"/>}
                                                {isGeneratingCronoposting ? 'Simulando Tendencias y Calendario...' : 'Generar Plan Maestro'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Cronoposting Results */}
                                    {cronopostingResult && (
                                        <div className="mt-8 animate-fade-in-up space-y-8">
                                            
                                            {/* TRENDS DASHBOARD */}
                                            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 text-white">
                                                <h4 className="text-sm font-bold text-brand-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <SparklesIcon className="w-4 h-4" />
                                                    Radar de Tendencias (Social Listening Simulado)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {cronopostingResult.detectedTrends.map((trend, idx) => (
                                                        <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700 relative overflow-hidden">
                                                            <div className={`absolute top-0 right-0 p-1 px-2 text-[9px] font-bold uppercase rounded-bl-lg ${
                                                                trend.volume === 'Alto' ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300'
                                                            }`}>
                                                                Vol: {trend.volume}
                                                            </div>
                                                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Tendencia #{idx + 1}</p>
                                                            <h5 className="text-lg font-bold text-white mb-2">"{trend.keyword}"</h5>
                                                            <p className="text-xs text-gray-300 mb-2">{trend.context}</p>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                                                trend.sentiment === 'Negativo' ? 'border-red-500 text-red-400 bg-red-500/10' : 
                                                                trend.sentiment === 'Positivo' ? 'border-green-500 text-green-400 bg-green-500/10' : 
                                                                'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                                                            }`}>
                                                                Sentimiento: {trend.sentiment}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* POST CARDS */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Calendario Táctico</h4>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">Total: {cronopostingResult.schedule.length} piezas</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-1 gap-6">
                                                    {cronopostingResult.schedule.map((entry, idx) => (
                                                        <div key={idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row">
                                                            {/* Sidebar Info */}
                                                            <div className="bg-gray-50 p-4 md:w-48 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between shrink-0">
                                                                <div>
                                                                    <div className="text-xs font-bold text-gray-400 uppercase mb-1">{entry.date}</div>
                                                                    <div className="text-lg font-bold text-gray-800 mb-2">{entry.time}</div>
                                                                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase mb-2 ${
                                                                        entry.platform.toLowerCase().includes('instagram') ? 'bg-pink-100 text-pink-600' :
                                                                        entry.platform.toLowerCase().includes('tiktok') ? 'bg-gray-800 text-white' :
                                                                        entry.platform.toLowerCase().includes('twitter') || entry.platform.toLowerCase().includes('x') ? 'bg-blue-100 text-blue-600' :
                                                                        'bg-green-100 text-green-600'
                                                                    }`}>
                                                                        {entry.platform}
                                                                    </span>
                                                                    <div className="text-[10px] text-gray-500 font-mono bg-white border border-gray-200 px-2 py-1 rounded text-center">
                                                                        {entry.format}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                                    <p className="text-[9px] text-gray-400 uppercase font-bold mb-1">Objetivo</p>
                                                                    <p className="text-xs text-gray-600 leading-tight">{entry.objective}</p>
                                                                </div>
                                                            </div>

                                                            {/* Main Content */}
                                                            <div className="p-5 flex-grow">
                                                                <div className="mb-4">
                                                                    <h5 className="text-md font-bold text-brand-primary mb-2 font-serif">{entry.headline}</h5>
                                                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
                                                                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Copy Sugerido</p>
                                                                        <p className="text-sm text-gray-800 whitespace-pre-line font-sans">{entry.copy}</p>
                                                                        <div className="mt-2 text-xs text-blue-600 font-medium">
                                                                            {entry.hashtags.map(tag => `${tag} `)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                                        <p className="text-[10px] text-blue-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                                            <PhotoIcon className="w-3 h-3"/> Instrucción Visual
                                                                        </p>
                                                                        <p className="text-xs text-blue-800 italic">{entry.visualCue}</p>
                                                                    </div>
                                                                    <div className="bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                                                        <p className="text-[10px] text-purple-400 uppercase font-bold mb-1 flex items-center gap-1">
                                                                            <SparklesIcon className="w-3 h-3"/> Listening Trigger
                                                                        </p>
                                                                        <p className="text-xs text-purple-800">
                                                                            Monitorear: <strong>"{entry.listeningFocus}"</strong>
                                                                            <br/>
                                                                            Meta Emocional: {entry.sentimentTarget}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
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
                        {strategy.kpis?.map((kpi, i) => (
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
