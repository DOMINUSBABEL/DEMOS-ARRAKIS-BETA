import React, { useState, useMemo, useEffect, useRef, Suspense, useCallback } from 'react';
import { ElectoralDataset, PartyAnalysisData, SimulationResults, PartyData, HistoricalDataset, CandidateRanking, ProcessedDataPayload } from '../types';
import { GenerateContentResponse } from '@google/genai';
import { getAIAnalysis } from '../services/geminiService';
import { buildHistoricalDataset, aggregateVotesByParty } from '../services/electoralProcessor';
import { generateGeneralAnalysisPDF } from '../services/reportGenerator';
import { exportGeneralAnalysisToXLSX } from '../services/spreadsheetGenerator';
import DataManager from './DataManager';
import AnalysisCard from './AnalysisCard';
import { BarChart } from './Charts';
import DataTable from './DataTable';
import { LoadingSpinner, SparklesIcon } from './Icons';
import VoteElasticityAnalysis from './VoteElasticityAnalysis';
import ExportMenu from './ExportMenu';
import { WorkerMessage } from '../services/worker';
import { ManualRow } from './ManualEntryForm';
import Card from './Card';
import Button from './Button';
import Input from './Input';

interface DashboardProps {
    datasets: ElectoralDataset[];
    partyAnalysis: Map<string, PartyAnalysisData>;
    onFileUpload: (files: File[], datasetName: string) => Promise<void>;
    onManualSubmit: (rows: ManualRow[], datasetName: string) => Promise<void>;
    onClassifyIdeologies: (partyNames: string[]) => Promise<void>;
    onDeleteDataset: (datasetId: string) => void;
    onEditDatasetName: (datasetId: string, newName: string) => void;
    onMergeDatasets: (idsToMerge: string[], newName: string) => Promise<void>;
    isLoading: boolean;
    loadingMessage: string;
    dataSource: 'local' | 'remote';
    setDataSource: (source: 'local' | 'remote') => void;
    remoteDataset: HistoricalDataset | null;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    runWorkerTask: (message: Omit<WorkerMessage, 'id'>) => Promise<any>;
}

const Dashboard: React.FC<DashboardProps> = ({
    datasets,
    partyAnalysis,
    onFileUpload,
    onManualSubmit,
    onClassifyIdeologies,
    onDeleteDataset,
    onEditDatasetName,
    onMergeDatasets,
    isLoading,
    loadingMessage,
    dataSource,
    setDataSource,
    remoteDataset,
    activeTab,
    setActiveTab,
    runWorkerTask
}) => {
    const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<{ [key: string]: { text: string; sources: any[] } }>({});
    const [isAiLoading, setIsAiLoading] = useState<Partial<{ [key: string]: boolean }>>({});
    const [isSimulating, setIsSimulating] = useState(false);
    const [partyFilter, setPartyFilter] = useState<string>('');
    const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
    const [dHondtPartiesOverride, setDHondtPartiesOverride] = useState<PartyData[] | null>(null);

    const generalAnalysisRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (dataSource === 'local' && datasets.length > 0 && (!selectedDatasetId || !datasets.some(d => d.id === selectedDatasetId))) {
            setSelectedDatasetId(datasets[datasets.length - 1].id);
        } else if (dataSource === 'local' && datasets.length === 0) {
            setSelectedDatasetId(null);
        }
    }, [datasets, selectedDatasetId, dataSource]);

    const activeDataset = useMemo((): HistoricalDataset | null => {
        if (dataSource === 'remote') {
            return remoteDataset;
        }

        if (!selectedDatasetId) return null;
        const electoralDataset = datasets.find(d => d.id === selectedDatasetId);
        if (!electoralDataset) return null;

        return buildHistoricalDataset(electoralDataset);
    }, [datasets, selectedDatasetId, dataSource, remoteDataset]);

    const baseRanking = activeDataset?.baseRanking ?? [];
    const initialPartyData = activeDataset?.partyData ?? [];
    const invalidVoteCounts = activeDataset?.invalidVoteCounts ?? { blankVotes: 0, nullVotes: 0 };
    const analysisType = activeDataset?.analysisType ?? 'party';

    const politicalUnits = useMemo(() => ['', ...new Set(baseRanking.map(c => c.unidadPolitica))], [baseRanking]);
    const partyColorMap = useMemo(() => new Map(initialPartyData.map(p => [p.name, p.color])), [initialPartyData]);

    const analysisSubject = useMemo(() => analysisType === 'candidate' ? 'Candidato' : 'Unidad Política', [analysisType]);
    const analysisSubjectPlural = useMemo(() => analysisType === 'candidate' ? 'Candidatos' : 'Unidades Políticas', [analysisType]);

    const filteredRanking = useMemo(() => {
        if (!partyFilter) return baseRanking;
        return baseRanking.filter(c => c.unidadPolitica === partyFilter);
    }, [baseRanking, partyFilter]);

    const handleAiAnalysis = useCallback(async (key: string) => {
        setIsAiLoading(prev => ({ ...prev, [key]: true }));
        try {
            let response: GenerateContentResponse;
            if (key === 'general' && activeDataset) {
                response = await getAIAnalysis({ type: 'base_ranking', data: filteredRanking, partyFilter: partyFilter || undefined });
            } else if (key === 'projections' && simulationResults && activeDataset) {
                response = await getAIAnalysis({ type: 'simulation', data: { baseRanking: filteredRanking, results: simulationResults } });
            } else {
                setIsAiLoading(prev => ({ ...prev, [key]: false }));
                return;
            }

            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            setAiAnalysis(prev => ({ ...prev, [key]: { text: response.text, sources } }));

        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "Ocurrió un error al generar el análisis de IA.";
            setAiAnalysis(prev => ({ ...prev, [key]: { text: errorMessage, sources: [] } }));
        } finally {
            setIsAiLoading(prev => ({ ...prev, [key]: false }));
        }
    }, [filteredRanking, simulationResults, partyFilter, activeDataset]);

    const [selectedPartyForHistory, setSelectedPartyForHistory] = useState('');
    const allParties = useMemo(() => ['', ...Array.from(partyAnalysis.keys()).sort()], [partyAnalysis]);

    const partyHistory = useMemo(() => {
        if (!selectedPartyForHistory) return null;

        const partyData = partyAnalysis.get(selectedPartyForHistory);
        if (!partyData || partyData.history.length === 0) return { techo: null, piso: null };

        const history = partyData.history;
        const techo = history.reduce((max, curr) => curr.votes > max.votes ? curr : max, history[0]);
        const piso = history.reduce((min, curr) => curr.votes < min.votes ? curr : min, history[0]);

        return { techo, piso };
    }, [partyAnalysis, selectedPartyForHistory]);

    const top10Ranking = filteredRanking.slice(0, 10);
    const chartData = top10Ranking.map(c => ({
        label: c.candidato,
        value: c.poderElectoralBase,
        color: partyColorMap.get(c.unidadPolitica)
    })).sort((a, b) => a.value - b.value);

    const headers = analysisType === 'candidate'
        ? ['#', 'Candidato', 'Unidad Política', 'Poder Electoral Base']
        : ['#', 'Unidad Política', 'Poder Electoral Base'];

    const data = filteredRanking.map((c, i) => (
        analysisType === 'candidate'
            ? [i + 1, c.candidato, c.unidadPolitica, c.poderElectoralBase]
            : [i + 1, c.unidadPolitica, c.poderElectoralBase]
    ));

    const noDataLoaded = datasets.length === 0 && !remoteDataset;

    const handleExportPdf = () => {
        if (generalAnalysisRef.current && activeDataset) {
            generateGeneralAnalysisPDF(generalAnalysisRef.current, `Informe_Analisis_${activeDataset.name}.pdf`);
        }
    };

    const handleExportXlsx = () => {
        if (activeDataset) {
            exportGeneralAnalysisToXLSX(activeDataset, partyAnalysis, partyFilter);
        }
    };

    const handleProjectAndSimulate = useCallback((projectedParties: PartyData[]) => {
        setDHondtPartiesOverride(projectedParties);
        setActiveTab('d_hondt');
    }, [setActiveTab]);

    const renderContent = () => {
        if (noDataLoaded && activeTab !== 'data_manager' && activeTab !== 'methodology') {
            return (
                <div className="text-center py-20 glass rounded-xl mt-8">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard Vacío</h2>
                    <p className="text-[var(--text-secondary)] mt-2">Carga un conjunto de datos desde el "Gestor de Datos" para comenzar el análisis.</p>
                </div>
            );
        }

        return (
            <Suspense fallback={
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner className="w-10 h-10 text-[var(--primary)]" />
                </div>
            }>
                {(() => {
                    switch (activeTab) {
                        case 'data_manager':
                            return <DataManager
                                datasets={datasets}
                                onFileUpload={onFileUpload}
                                onManualSubmit={onManualSubmit}
                                onDeleteDataset={onDeleteDataset}
                                onEditDatasetName={onEditDatasetName}
                                onMergeDatasets={onMergeDatasets}
                                isLoading={isLoading}
                                loadingMessage={loadingMessage}
                            />;

                        case 'general':
                            return activeDataset && <div className="space-y-8">
                                <Card className="flex flex-wrap justify-between items-center gap-4">
                                    {dataSource === 'local' ? (
                                        <div className="w-full md:w-auto">
                                            <label htmlFor="datasetSelector" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Seleccionar Conjunto de Datos Local</label>
                                            <select
                                                id="datasetSelector"
                                                value={selectedDatasetId ?? ''}
                                                onChange={(e) => { setSelectedDatasetId(e.target.value); setDataSource('local'); }}
                                                className="w-full md:w-auto bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)]"
                                            >
                                                {datasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Fuente de Datos Remota Activa</label>
                                            <p className="font-semibold p-2 text-[var(--primary)]">{activeDataset.name}</p>
                                        </div>
                                    )}
                                    <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} disabled={false} />
                                </Card>

                                <div ref={generalAnalysisRef}>
                                    <div>
                                        <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">Análisis de: <span className="text-[var(--primary)]">{activeDataset.name}</span></h2>

                                        <Card className="mb-6">
                                            <label htmlFor="partyFilter" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Filtrar por Unidad Política</label>
                                            <select
                                                id="partyFilter"
                                                value={partyFilter}
                                                onChange={(e) => setPartyFilter(e.target.value)}
                                                className="w-full md:w-1/3 bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)]"
                                            >
                                                {politicalUnits.map(unit => <option key={unit} value={unit}>{unit || 'Todos los Partidos'}</option>)}
                                            </select>
                                        </Card>

                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="analysis-charts">
                                            <AnalysisCard title={`Poder Electoral Base (Top 10${partyFilter ? ' - ' + partyFilter : ''})`} explanation={`Este gráfico muestra el 'Poder Electoral Base' de los 10 principales ${analysisSubjectPlural.toLowerCase()}. Esta métrica es el promedio de votos ajustados que un ${analysisSubject.toLowerCase()} ha obtenido, sirviendo como un indicador de su fuerza inicial.`} collapsible>
                                                <BarChart data={chartData} />
                                            </AnalysisCard>

                                            <AnalysisCard title="Análisis del Estratega IA" explanation="Obtén un análisis estratégico instantáneo basado en el Ranking de Poder Electoral Base. La IA identificará fortalezas, debilidades y el panorama competitivo inicial, enriquecido con datos de Google Search." collapsible>
                                                <Button
                                                    onClick={() => handleAiAnalysis('general')}
                                                    disabled={isAiLoading['general']}
                                                    isLoading={isAiLoading['general']}
                                                    variant="primary"
                                                    className="w-full"
                                                    icon={<SparklesIcon className="w-5 h-5" />}
                                                >
                                                    Analizar Ranking con IA
                                                </Button>

                                                {isAiLoading['general'] && (
                                                    <div className="mt-4 text-center py-8 bg-[var(--background)]/30 rounded-lg">
                                                        <p className="mt-3 font-semibold text-[var(--text-secondary)]">Generando análisis del ranking...</p>
                                                    </div>
                                                )}
                                                {!isAiLoading['general'] && aiAnalysis['general']?.text && (
                                                    <>
                                                        <pre id="ai-analysis-text" className="whitespace-pre-wrap font-sans text-sm max-w-none mt-4 bg-[var(--background)] p-4 rounded-lg border border-[var(--border)] text-[var(--text-primary)]">
                                                            {aiAnalysis['general'].text}
                                                        </pre>
                                                        {aiAnalysis['general']?.sources && aiAnalysis['general'].sources.length > 0 && (
                                                            <div className="mt-4 p-4 rounded-lg bg-[var(--background)]/50 border border-[var(--border)]">
                                                                <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Fuentes de Google Search:</h4>
                                                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                                                    {aiAnalysis['general'].sources.map((source, index) => source.web && (
                                                                        <li key={index} className="text-xs">
                                                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline">
                                                                                {source.web.title}
                                                                            </a>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </AnalysisCard>
                                        </div>
                                        {(invalidVoteCounts.blankVotes > 0 || invalidVoteCounts.nullVotes > 0) && (
                                            <div className="mt-6">
                                                <AnalysisCard title="Votos No Válidos" explanation="Total de votos en blanco y nulos identificados en los datos. Estos votos no se incluyen en los cálculos de asignación de escaños." collapsible>
                                                    <div className="flex justify-around text-center p-4">
                                                        <div>
                                                            <div className="text-3xl font-bold text-[var(--text-secondary)]">{invalidVoteCounts.blankVotes.toLocaleString('es-CO')}</div>
                                                            <div className="text-sm text-[var(--text-secondary)] mt-1">Votos en Blanco</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-3xl font-bold text-[var(--text-secondary)]">{invalidVoteCounts.nullVotes.toLocaleString('es-CO')}</div>
                                                            <div className="text-sm text-[var(--text-secondary)] mt-1">Votos Nulos</div>
                                                        </div>
                                                    </div>
                                                </AnalysisCard>
                                            </div>
                                        )}
                                        <div className="mt-6" id="analysis-table">
                                            <AnalysisCard title={`Ranking Base Completo (Poder Electoral por ${analysisSubject})`} explanation={`Esta tabla muestra el ranking completo de todos los ${analysisSubjectPlural.toLowerCase()} basado en su Poder Electoral Base. Es la línea de base fundamental para todas las proyecciones y simulaciones.`} collapsible>
                                                <DataTable title="" headers={headers} data={data} colorMap={partyColorMap} colorColumnKey="Unidad Política" />
                                            </AnalysisCard>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold mb-4 mt-8 text-[var(--text-primary)]">Análisis Histórico Global</h2>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <VoteElasticityAnalysis partyAnalysis={partyAnalysis} />
                                        <AnalysisCard title="Análisis Histórico" explanation="Selecciona un partido para ver su historial de votos." collapsible>
                                            <div className="p-4">
                                                <select
                                                    value={selectedPartyForHistory}
                                                    onChange={(e) => setSelectedPartyForHistory(e.target.value)}
                                                    className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg p-2 mb-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)]"
                                                >
                                                    <option value="">Seleccionar Partido</option>
                                                    {allParties.map(p => <option key={p} value={p}>{p}</option>)}
                                                </select>
                                                {partyHistory && partyHistory.techo && partyHistory.piso && (
                                                    <div className="space-y-2 text-[var(--text-primary)]">
                                                        <p><strong>Techo:</strong> {partyHistory.techo.votes.toLocaleString()} ({partyHistory.techo.datasetName})</p>
                                                        <p><strong>Piso:</strong> {partyHistory.piso.votes.toLocaleString()} ({partyHistory.piso.datasetName})</p>
                                                    </div>
                                                )}
                                            </div>
                                        </AnalysisCard>
                                    </div>
                                </div>
                            </div>;
                        default:
                            return null;
                    }
                })()}
            </Suspense>
        );
    };

    return renderContent();
};

export default Dashboard;