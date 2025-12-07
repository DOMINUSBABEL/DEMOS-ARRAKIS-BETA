
import React, { useState, useMemo } from 'react';
import { ElectoralDataset, PartyAnalysisData, ListAnalysisAIResponse, PartyData } from '../types';
import { getOpenVsClosedListAnalysis } from '../services/geminiService';
import AnalysisCard from './AnalysisCard';
import { LoadingSpinner, SparklesIcon, WarningIcon, CheckCircleIcon } from './Icons';

interface ListAnalysisProps {
    datasets: ElectoralDataset[];
    partyAnalysis: Map<string, PartyAnalysisData>;
    onProjectAndSimulate: (projectedParties: PartyData[]) => void;
    activePartyData: PartyData[];
}

interface PartyPerformance {
    electionName: string;
    year: string;
    listType: 'Abierta' | 'Cerrada';
    votes: number;
    voteConcentration?: number; // Standard deviation of candidate votes for open lists
    invalidVoteCounts: { blankVotes: number; nullVotes: number };
}

const calculateStdDev = (arr: number[]): number => {
    if (arr.length < 2) return 0;
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
};

const ProjectionInterval: React.FC<{ title: string; data: { baseline: number; lowerBound: number; upperBound: number; } | null; color: string; }> = ({ title, data, color }) => {
    if (!data || data.baseline === null || data.baseline === undefined) {
        return (
            <div className="bg-dark-bg p-4 rounded-lg">
                <p className="text-sm font-semibold text-dark-text-secondary">{title}</p>
                <p className="text-dark-text-secondary text-xs mt-2">No hay datos históricos suficientes para generar una proyección.</p>
            </div>
        );
    }
    
    const totalRange = data.upperBound - data.lowerBound;
    const baselinePosition = totalRange > 0 ? ((data.baseline - data.lowerBound) / totalRange) * 100 : 50;

    return (
        <div className="bg-dark-bg p-4 rounded-lg">
            <p className="text-sm font-semibold" style={{color}}>{title}</p>
            <div className="mt-4 relative h-8">
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-dark-border rounded-full">
                    <div className="h-full rounded-full" style={{ background: color, opacity: 0.6 }}></div>
                </div>
                <div className="absolute h-4 w-1 bg-white rounded-full top-1/2 -translate-y-1/2" style={{ left: `calc(${baselinePosition}% - 2px)` }}>
                     <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-center">
                        <p className="font-bold text-sm whitespace-nowrap">{data.baseline.toLocaleString('es-CO')}</p>
                        <p className="text-xs text-dark-text-secondary whitespace-nowrap">Proyectado</p>
                    </div>
                </div>
            </div>
             <div className="flex justify-between mt-2 text-xs text-dark-text-secondary">
                <div className="text-left">
                    <p className="font-semibold">{data.lowerBound.toLocaleString('es-CO')}</p>
                    <p>-2.5%</p>
                </div>
                 <div className="text-right">
                    <p className="font-semibold">{data.upperBound.toLocaleString('es-CO')}</p>
                    <p>+2.5%</p>
                </div>
            </div>
        </div>
    );
};

const ProsCons: React.FC<{ title: string; pros: string; cons: string; }> = ({ title, pros, cons }) => (
    <div className="bg-dark-bg p-4 rounded-lg">
        <h4 className="font-semibold text-md mb-3 text-center text-dark-text-primary">{title}</h4>
        <div className="space-y-3">
            <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-text-secondary"><strong className="text-dark-text-primary">Ventaja:</strong> {pros}</p>
            </div>
            <div className="flex items-start gap-2">
                <WarningIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-dark-text-secondary"><strong className="text-dark-text-primary">Desventaja:</strong> {cons}</p>
            </div>
        </div>
    </div>
);


const ListAnalysis: React.FC<ListAnalysisProps> = ({ datasets, partyAnalysis, onProjectAndSimulate, activePartyData }) => {
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [analysisResult, setAnalysisResult] = useState<ListAnalysisAIResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const partyNames = useMemo(() => ['', ...Array.from(partyAnalysis.keys()).sort()], [partyAnalysis]);

    const partyPerformanceHistory = useMemo((): PartyPerformance[] => {
        if (!selectedParty) return [];

        const partyData = partyAnalysis.get(selectedParty);
        if (!partyData) return [];

        return partyData.history.map((historyPoint): PartyPerformance | null => {
            const dataset = datasets.find(d => d.id === historyPoint.datasetId);
            if (!dataset) return null;

            // Exclude future projections (e.g., 2026) from historical analysis.
            if (dataset.name.includes('2026')) {
                return null;
            }

            const listType: 'Abierta' | 'Cerrada' = dataset.analysisType === 'candidate' ? 'Abierta' : 'Cerrada';
            let voteConcentration: number | undefined = undefined;
            
            const yearMatch = dataset.name.match(/\d{4}/);
            const year = yearMatch ? yearMatch[0] : 'N/A';

            if (listType === 'Abierta') {
                const processedData = dataset.processedData;
                const candidateVotes = processedData
                    .filter(row => row.UnidadPolitica === selectedParty && row.Candidato.toUpperCase() !== 'SOLO POR LA LISTA')
                    .map(row => row.Votos);
                
                voteConcentration = calculateStdDev(candidateVotes);
            }

            return {
                electionName: dataset.name,
                year,
                listType,
                votes: historyPoint.votes,
                voteConcentration,
                invalidVoteCounts: dataset.invalidVoteCounts,
            };
        }).filter((p): p is PartyPerformance => p !== null)
          .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    }, [selectedParty, partyAnalysis, datasets]);
    
    const summaryMetrics = useMemo(() => {
        const openListPerformances = partyPerformanceHistory.filter(p => p.listType === 'Abierta');
        const closedListPerformances = partyPerformanceHistory.filter(p => p.listType === 'Cerrada');

        const avgOpenVotes = openListPerformances.length > 0
            ? openListPerformances.reduce((sum, p) => sum + p.votes, 0) / openListPerformances.length
            : null;
        
        const avgClosedVotes = closedListPerformances.length > 0
            ? closedListPerformances.reduce((sum, p) => sum + p.votes, 0) / closedListPerformances.length
            : null;

        const avgConcentration = openListPerformances.length > 0
            ? openListPerformances.reduce((sum, p) => sum + (p.voteConcentration || 0), 0) / openListPerformances.length
            : null;
        
        return { avgOpenVotes, avgClosedVotes, avgConcentration };
    }, [partyPerformanceHistory]);

    const handleGenerateAnalysis = async () => {
        if (!selectedParty) {
            setError("Por favor, selecciona un partido para analizar.");
            return;
        }
        if (partyPerformanceHistory.length < 1) {
            setError("No hay suficientes datos históricos para este partido para generar un análisis prospectivo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        try {
            const result = await getOpenVsClosedListAnalysis(selectedParty, partyPerformanceHistory, summaryMetrics, 2026);
            setAnalysisResult(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSimulateProjection = (strategy: 'open' | 'closed') => {
        if (!analysisResult || !activePartyData || !selectedParty) return;

        const projection = strategy === 'open' ? analysisResult.projections.openList : analysisResult.projections.closedList;

        if (!projection || projection.baseline === null || projection.baseline === undefined) {
             setError(`No hay una proyección de línea base para la estrategia de lista ${strategy === 'open' ? 'abierta' : 'cerrada'}.`);
            return;
        }
        
        const projectedVoteCount = projection.baseline;
        
        const newPartyData = activePartyData.map(party => {
            if (party.name === selectedParty) {
                return { ...party, votes: projectedVoteCount };
            }
            return party;
        });
        
        onProjectAndSimulate(newPartyData);
    };

    return (
        <div className="space-y-6">
            <AnalysisCard
                title="Análisis Estratégico: Lista Abierta vs. Cerrada"
                explanation="Este módulo analiza el rendimiento histórico de un partido para recomendar qué tipo de lista (abierta o cerrada) podría ser más beneficiosa en una elección futura."
                fullscreenable={false}
            >
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Selecciona un Partido</label>
                        <select value={selectedParty} onChange={e => setSelectedParty(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                            {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar...'}</option>)}
                        </select>
                    </div>
                    {selectedParty && (
                         <button
                            onClick={handleGenerateAnalysis}
                            disabled={isLoading}
                            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            Generar Análisis Estratégico
                        </button>
                    )}
                </div>
            </AnalysisCard>

            {isLoading && (
                <AnalysisCard title="Procesando Análisis" explanation="La IA está trabajando en su recomendación estratégica.">
                    <div className="text-center py-10">
                        <LoadingSpinner className="w-10 h-10 mx-auto text-brand-primary" />
                        <p className="mt-4 font-semibold">Generando análisis estratégico...</p>
                        <p className="text-sm text-dark-text-secondary">La IA está procesando datos históricos y proyecciones.</p>
                    </div>
                </AnalysisCard>
            )}
            
            {error && (
                 <div className="flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                    <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                    <p>{error}</p>
                </div>
            )}
            
            {!isLoading && partyPerformanceHistory.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AnalysisCard title="Rendimiento Histórico por Tipo de Lista" explanation="Tabla que muestra el desempeño del partido en elecciones pasadas, diferenciando entre lista abierta y cerrada.">
                        <div className="overflow-x-auto max-h-96">
                            <table className="min-w-full text-sm">
                                <thead className="bg-dark-card sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Elección</th>
                                        <th className="px-3 py-2 text-left">Tipo</th>
                                        <th className="px-3 py-2 text-right">Votos</th>
                                        <th className="px-3 py-2 text-right">Concentración</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-dark-border">
                                    {partyPerformanceHistory.map((p, i) => (
                                        <tr key={i} className="hover:bg-dark-card/50">
                                            <td className="px-3 py-2 truncate" title={p.electionName}>{p.electionName}</td>
                                            <td className="px-3 py-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.listType === 'Abierta' ? 'bg-blue-900 text-blue-300' : 'bg-purple-900 text-purple-300'}`}>
                                                    {p.listType}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-right font-mono">{p.votes.toLocaleString('es-CO')}</td>
                                            <td className="px-3 py-2 text-right font-mono">{p.voteConcentration ? p.voteConcentration.toLocaleString('es-CO', { maximumFractionDigits: 0 }) : 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AnalysisCard>
                     <AnalysisCard title="Métricas Resumen" explanation="Promedios de rendimiento para cada tipo de lista y la concentración de votos promedio para las listas abiertas.">
                         <div className="space-y-4 p-4 text-center">
                            {summaryMetrics.avgClosedVotes !== null && (
                                <div className="bg-dark-bg p-3 rounded-lg">
                                    <p className="text-sm text-purple-400 font-semibold">VOTOS PROMEDIO (LISTA CERRADA)</p>
                                    <p className="text-2xl font-bold font-mono">{Math.round(summaryMetrics.avgClosedVotes).toLocaleString('es-CO')}</p>
                                </div>
                            )}
                             {summaryMetrics.avgOpenVotes !== null && (
                                <div className="bg-dark-bg p-3 rounded-lg">
                                    <p className="text-sm text-blue-400 font-semibold">VOTOS PROMEDIO (LISTA ABIERTA)</p>
                                    <p className="text-2xl font-bold font-mono">{Math.round(summaryMetrics.avgOpenVotes).toLocaleString('es-CO')}</p>
                                </div>
                            )}
                             {summaryMetrics.avgConcentration !== null && (
                                <div className="bg-dark-bg p-3 rounded-lg">
                                    <p className="text-sm text-yellow-400 font-semibold">CONCENTRACIÓN PROMEDIO (LISTA ABIERTA)</p>
                                    <p className="text-2xl font-bold font-mono">{Math.round(summaryMetrics.avgConcentration).toLocaleString('es-CO')}</p>
                                    <p className="text-xs text-dark-text-secondary">(Mayor valor = más dependencia de figuras)</p>
                                </div>
                            )}
                             {summaryMetrics.avgOpenVotes === null && summaryMetrics.avgClosedVotes === null && <p className="text-dark-text-secondary">No hay suficientes datos.</p>}
                         </div>
                     </AnalysisCard>
                </div>
            )}

            {!isLoading && analysisResult && (
                 <>
                    <AnalysisCard title="Proyecciones Cuantitativas para 2026" explanation="Estimación de rendimiento electoral con un intervalo de confianza del 5% (-2.5% a +2.5%) basado en la proyección central de la IA.">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ProjectionInterval 
                                title="Proyección: Lista Abierta"
                                data={analysisResult.projections.openList}
                                color="#3b82f6"
                            />
                            <ProjectionInterval 
                                title="Proyección: Lista Cerrada"
                                data={analysisResult.projections.closedList}
                                color="#8b5cf6"
                            />
                        </div>
                    </AnalysisCard>
                    <AnalysisCard title="Diagnóstico y Análisis Estratégico de la IA" explanation="Análisis detallado de la IA sobre el perfil del partido y las implicaciones de cada tipo de lista.">
                        <div className="space-y-6">
                            <div className="text-center bg-dark-bg p-4 rounded-lg">
                                <p className="text-sm uppercase font-bold tracking-wider text-dark-text-secondary">Perfil de Voto Diagnosticado</p>
                                <p className="text-2xl font-bold text-brand-primary mt-1">{analysisResult.analysis.voteProfile}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ProsCons 
                                    title="Evaluación: Lista Abierta"
                                    pros={analysisResult.analysis.prosOpen}
                                    cons={analysisResult.analysis.consOpen}
                                />
                                <ProsCons 
                                    title="Evaluación: Lista Cerrada"
                                    pros={analysisResult.analysis.prosClosed}
                                    cons={analysisResult.analysis.consClosed}
                                />
                            </div>
                            <div>
                                <h4 className="font-semibold text-lg mb-2 text-dark-text-primary">Veredicto y Recomendación Estratégica</h4>
                                <div className="bg-dark-bg p-4 rounded-lg">
                                    <p className="text-sm text-dark-text-secondary italic leading-relaxed">{analysisResult.analysis.finalVerdict}</p>
                                    <div className="mt-4 pt-4 border-t border-dark-border text-center">
                                        <p className="text-sm uppercase font-bold tracking-wider text-dark-text-secondary">Recomendación Final</p>
                                        <p className="text-3xl font-bold text-brand-primary mt-1">{analysisResult.strategicRecommendation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AnalysisCard>
                    <AnalysisCard title="Simular Proyecciones en D'Hondt" explanation="Lleva estas proyecciones al simulador D'Hondt para ver su impacto en la asignación de escaños. Esto modificará temporalmente los datos en la pestaña 'Simulador D'Hondt'.">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => handleSimulateProjection('open')}
                                disabled={!analysisResult.projections.openList || analysisResult.projections.openList.baseline === null}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simular con Lista Abierta
                            </button>
                             <button 
                                onClick={() => handleSimulateProjection('closed')}
                                disabled={!analysisResult.projections.closedList || analysisResult.projections.closedList.baseline === null}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Simular con Lista Cerrada
                            </button>
                        </div>
                    </AnalysisCard>
                </>
            )}
        </div>
    );
};

export default ListAnalysis;
