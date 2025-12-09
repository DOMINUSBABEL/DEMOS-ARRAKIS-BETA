
import React, { useState, useEffect } from 'react';
import AnalysisCard from './AnalysisCard';
import { MegaphoneIcon, LoadingSpinner, UserGroupIcon, ChartBarIcon, MapIcon, SparklesIcon, WarningIcon, CpuChipIcon, ArrowsUpDownIcon, DatabaseIcon } from './Icons';
import { generateMarketingStrategy } from '../services/geminiService';
import { MarketingStrategyResult } from '../types';

const MarketingStrategy: React.FC = () => {
    // Initial State Pre-filled with Simulation Data for John Jairo Berrío
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetName.trim() || !context.trim()) {
            setError("Por favor completa todos los campos requeridos.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setStrategy(null);

        try {
            const result = await generateMarketingStrategy(targetName, targetType, context);
            setStrategy(result);
        } catch (err: any) {
            setError(err.message || "Ocurrió un error al generar la estrategia.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <AnalysisCard
                title="Estrategia de Campaña y Marketing Político"
                explanation="Generación de pipeline estratégico, avatares de votantes y mensajes clave basados en inteligencia de datos."
                icon={<MegaphoneIcon />}
                fullscreenable={false}
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

                    {/* Matrix 10x10 - Clean Layout */}
                    <AnalysisCard title="Matriz de Conexión: Votante vs. Candidato" explanation="Alineación estratégica del mensaje." collapsible={false} icon={<ArrowsUpDownIcon />}>
                        <div className="p-6 bg-gray-50">
                            <div className="flex overflow-x-auto gap-6 pb-4 custom-scrollbar snap-x">
                                {strategy.voterAvatars.map((voter, idx) => {
                                    const candidateAvatar = strategy.candidateAvatars[idx] || strategy.candidateAvatars[0]; // Fallback
                                    return (
                                        <div key={idx} className="snap-center min-w-[320px] bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                                            {/* Voter Card */}
                                            <div className="p-5 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Perfil Votante</span>
                                                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <h5 className="text-sm font-bold text-gray-800 mb-2 font-serif">{voter.archetype}</h5>
                                                <p className="text-xs text-gray-500 mb-3 leading-relaxed">{voter.demographics}</p>
                                                <div className="bg-red-50 border border-red-100 p-2 rounded text-[10px] text-red-800 italic">
                                                    "{voter.painPoint}"
                                                </div>
                                            </div>

                                            {/* Connection Line */}
                                            <div className="h-1 bg-gray-100 relative">
                                                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 text-gray-400">
                                                    <ArrowsUpDownIcon className="w-3 h-3" />
                                                </div>
                                            </div>

                                            {/* Candidate Card */}
                                            <div className="p-5 bg-white">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-[10px] font-bold uppercase text-brand-primary tracking-wider">Ángulo Candidato</span>
                                                    <MegaphoneIcon className="w-4 h-4 text-brand-primary" />
                                                </div>
                                                <h5 className="text-sm font-bold text-brand-primary mb-2 font-serif">{candidateAvatar.archetype}</h5>
                                                <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium">"{candidateAvatar.messaging_angle}"</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-brand-primary"></span>
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{candidateAvatar.visual_style}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </AnalysisCard>

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
