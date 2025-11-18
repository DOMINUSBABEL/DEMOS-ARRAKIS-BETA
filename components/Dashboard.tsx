import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SimulationResults, SimulationParams, PartyData } from '../types';
import ScenarioControls from './ScenarioControls';
import AnalysisCard from './AnalysisCard';
import DataTable from './DataTable';
import DHondtSimulator from './DHondtSimulator';
import HistoricalSimulator from './HistoricalSimulator';
import DataManager from './DataManager';
import { ManualRow } from './ManualEntryForm';
import TrendsAnalysis from './TrendsAnalysis';
import { BarChart } from './Charts';
import { SparklesIcon, LoadingSpinner, FilePdfIcon, FileExcelIcon } from './Icons';
import { getAIAnalysis } from '../services/geminiService';
import { generateGeneralAnalysisPDF } from '../services/reportGenerator';
import { exportGeneralAnalysisToXLSX } from '../services/spreadsheetGenerator';
import CoalitionAnalysis from './CoalitionAnalysis';
import VoteElasticityAnalysis from './VoteElasticityAnalysis';
import StrategicReportGenerator from './StrategicReportGenerator';
import Methodology from './Methodology';
import ListAnalysis from './ListAnalysis';
import HeatmapAnalysis from './HeatmapAnalysis';
import { 
  simulateVoteFragmentation,
  applyGovernmentOppositionFactor,
  runMonteCarloSimulation,
  buildHistoricalDataset,
  applyCoattailEffect,
  applyLocalSupportFactor,
  applyCampaignStrengthFactor
} from '../services/electoralProcessor';
import { ElectoralDataset, PartyAnalysisData, HistoricalDataset } from '../types';
import { GenerateContentResponse } from '@google/genai';


type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap';
type DataSource = 'local' | 'remote';

interface DashboardProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
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
  dataSource: DataSource;
  setDataSource: (source: DataSource) => void;
  remoteDataset: HistoricalDataset | null;
}

const ExportMenu: React.FC<{ onPdf: () => void; onXlsx: () => void }> = ({ onPdf, onXlsx }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
                Exportar Informe
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-light-card dark:bg-dark-card rounded-md shadow-lg z-20 border border-light-border dark:border-dark-border">
                    <button onClick={() => { onPdf(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2">
                        <FilePdfIcon className="w-5 h-5 text-red-500" />
                        Exportar a PDF
                    </button>
                    <button onClick={() => { onXlsx(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-border flex items-center gap-2">
                        <FileExcelIcon className="w-5 h-5 text-green-500" />
                        Exportar a Excel
                    </button>
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ 
    activeTab,
    setActiveTab,
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
    remoteDataset
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

  const handleSimulate = useCallback((params: SimulationParams) => {
    setIsSimulating(true);
    setSimulationResults(null);
    const rankingToSimulate = partyFilter ? filteredRanking : baseRanking;

    setTimeout(() => {
        const fragmentedRanking = simulateVoteFragmentation(rankingToSimulate, params.fragmentationUnit, params.numCandidates);
        const govFactoredRanking = applyGovernmentOppositionFactor(fragmentedRanking, params.governmentParties);
        const coattailFactoredRanking = applyCoattailEffect(govFactoredRanking, params.coattailEffect);
        const supportFactoredRanking = applyLocalSupportFactor(coattailFactoredRanking, params.localSupport);
        const finalFactoredRanking = applyCampaignStrengthFactor(supportFactoredRanking, params.campaignStrength);

        const probabilities = runMonteCarloSimulation(finalFactoredRanking, params.threshold, params.monteCarloIterations);

        setSimulationResults({ 
          fragmentedRanking, 
          factoredRanking: finalFactoredRanking, 
          probabilities 
        });
        setIsSimulating(false);
        setActiveTab('projections');
    }, 10);
}, [baseRanking, filteredRanking, partyFilter, setActiveTab]);
  
  const handleAiAnalysis = useCallback(async (key: 'general' | 'projections') => {
    setIsAiLoading(prev => ({ ...prev, [key]: true }));
    setAiAnalysis(prev => ({ ...prev, [key]: { text: '', sources: [] } }));

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
        setAiAnalysis(prev => ({...prev, [key]: { text: errorMessage, sources: [] }}));
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
  })).sort((a,b) => a.value - b.value);

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
  }, []);

  const renderContent = () => {
    if (noDataLoaded && activeTab !== 'data_manager' && activeTab !== 'methodology') {
        return (
            <div className="text-center py-10 bg-light-card dark:bg-dark-card rounded-lg mt-8">
                <h2 className="text-xl font-semibold">Dashboard Vacío</h2>
                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">Carga un conjunto de datos desde el "Gestor de Datos" para comenzar el análisis.</p>
            </div>
        );
    }

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
            <div className="bg-light-card dark:bg-dark-card/50 p-4 rounded-lg shadow-lg flex flex-wrap justify-between items-center gap-4 backdrop-blur-sm border border-light-border dark:border-dark-border">
                {dataSource === 'local' ? (
                  <div>
                      <label htmlFor="datasetSelector" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Seleccionar Conjunto de Datos Local</label>
                      <select
                          id="datasetSelector"
                          value={selectedDatasetId ?? ''}
                          onChange={(e) => { setSelectedDatasetId(e.target.value); setDataSource('local'); }}
                          className="w-full md:w-auto bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                      >
                          {datasets.map(ds => <option key={ds.id} value={ds.id}>{ds.name}</option>)}
                      </select>
                  </div>
                ) : (
                  <div>
                     <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Fuente de Datos Remota Activa</label>
                     <p className="font-semibold p-2">{activeDataset.name}</p>
                  </div>
                )}
                 <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} />
            </div>
            
            <div ref={generalAnalysisRef}>
                <div>
                    <h2 className="text-2xl font-bold mb-4">Análisis de: <span className="text-brand-primary">{activeDataset.name}</span></h2>
                    <div className="bg-light-card dark:bg-dark-card/50 backdrop-blur-sm border border-light-border dark:border-dark-border p-4 rounded-lg shadow-lg mb-6">
                        <label htmlFor="partyFilter" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Filtrar por Unidad Política</label>
                        <select
                            id="partyFilter"
                            value={partyFilter}
                            onChange={(e) => setPartyFilter(e.target.value)}
                            className="w-full md:w-1/3 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                        >
                            {politicalUnits.map(unit => <option key={unit} value={unit}>{unit || 'Todos los Partidos'}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="analysis-charts">
                        <AnalysisCard title={`Poder Electoral Base (Top 10${partyFilter ? ' - ' + partyFilter : ''})`} explanation={`Este gráfico muestra el 'Poder Electoral Base' de los 10 principales ${analysisSubjectPlural.toLowerCase()}. Esta métrica es el promedio de votos ajustados que un ${analysisSubject.toLowerCase()} ha obtenido, sirviendo como un indicador de su fuerza inicial.`} collapsible>
                            <BarChart data={chartData} />
                        </AnalysisCard>

                        <AnalysisCard title="Análisis del Estratega IA" explanation="Obtén un análisis estratégico instantáneo basado en el Ranking de Poder Electoral Base. La IA identificará fortalezas, debilidades y el panorama competitivo inicial, enriquecido con datos de Google Search." collapsible>
                            <button onClick={() => handleAiAnalysis('general')} disabled={isAiLoading['general']} className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-secondary transition-opacity disabled:opacity-50 disabled:cursor-wait">
                                <SparklesIcon className="w-5 h-5" />
                                Analizar Ranking con IA
                            </button>
                            {isAiLoading['general'] && (
                                <div className="mt-4 text-center py-8 bg-dark-bg/30 rounded-lg">
                                    <LoadingSpinner className="w-8 h-8 mx-auto text-brand-primary" />
                                    <p className="mt-3 font-semibold text-dark-text-secondary">Generando análisis del ranking...</p>
                                </div>
                            )}
                            {!isAiLoading['general'] && aiAnalysis['general']?.text && (
                                <>
                                    <pre id="ai-analysis-text" className="whitespace-pre-wrap font-sans text-sm max-w-none mt-4 bg-light-bg dark:bg-dark-bg p-4 rounded-md border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary">
                                        {aiAnalysis['general'].text}
                                    </pre>
                                    {aiAnalysis['general']?.sources && aiAnalysis['general'].sources.length > 0 && (
                                        <div className="mt-4 p-4 rounded-md bg-dark-bg/50 border border-dark-border">
                                            <h4 className="text-sm font-semibold text-dark-text-secondary">Fuentes de Google Search:</h4>
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                {aiAnalysis['general'].sources.map((source, index) => source.web && (
                                                    <li key={index} className="text-xs">
                                                        <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
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
                                    <div className="text-3xl font-bold text-light-text-secondary dark:text-dark-text-secondary">{invalidVoteCounts.blankVotes.toLocaleString('es-CO')}</div>
                                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Votos en Blanco</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-light-text-secondary dark:text-dark-text-secondary">{invalidVoteCounts.nullVotes.toLocaleString('es-CO')}</div>
                                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">Votos Nulos</div>
                                </div>
                            </div>
                        </AnalysisCard>
                        </div>
                    )}
                    <div className="mt-6" id="analysis-table">
                        <AnalysisCard title={`Ranking Base Completo (Poder Electoral por ${analysisSubject})`} explanation="Esta tabla muestra el ranking completo de todos los ${analysisSubjectPlural.toLowerCase()} basado en su Poder Electoral Base. Es la línea de base fundamental para todas las proyecciones y simulaciones." collapsible>
                            <DataTable title="" headers={headers} data={data} colorMap={partyColorMap} colorColumnKey="Unidad Política" />
                        </AnalysisCard>
                    </div>
                </div>
            </div>
            <div>
                <h2 className="text-2xl font-bold mb-4 mt-8">Análisis Histórico Global</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                    <VoteElasticityAnalysis partyAnalysis={partyAnalysis} />
                    <AnalysisCard title="Análisis Histórico: Techos y Pisos" explanation="Selecciona un partido para ver su mejor (techo) y peor (piso) desempeño electoral a través de todos los conjuntos de datos cargados." collapsible>
                        <div className="space-y-4">
                            <select
                                id="partyHistoryFilter"
                                value={selectedPartyForHistory}
                                onChange={(e) => setSelectedPartyForHistory(e.target.value)}
                                className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                            >
                                {allParties.map(unit => <option key={unit} value={unit}>{unit || 'Seleccionar Partido...'}</option>)}
                            </select>
                            {partyHistory && (
                                <div className="text-center space-y-3 mt-2">
                                    {partyHistory.techo ? (
                                        <div>
                                            <p className="text-sm text-green-500 dark:text-green-400 font-semibold">TECHO ELECTORAL</p>
                                            <p className="text-2xl font-bold">{partyHistory.techo.votes.toLocaleString('es-CO')} Votos</p>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">en "{partyHistory.techo.datasetName}"</p>
                                        </div>
                                    ) : selectedPartyForHistory ? <p className="text-gray-500">No hay datos para este partido.</p> : null}
                                    {partyHistory.piso && (
                                        <div>
                                            <p className="text-sm text-red-500 dark:text-red-400 font-semibold">PISO ELECTORAL</p>
                                            <p className="text-2xl font-bold">{partyHistory.piso.votes.toLocaleString('es-CO')} Votos</p>
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">en "{partyHistory.piso.datasetName}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </AnalysisCard>
                </div>
                 <div className="mt-6">
                    <AnalysisCard title="Análisis de Tendencias Históricas (EMA & RSI)" explanation="Visualiza el rendimiento histórico, la tendencia (EMA) y el momentum (RSI) de un partido. El RSI mide la velocidad y el cambio de los movimientos de votos; valores sobre 70 indican una posible sobre-expansión y bajo 30 un potencial de recuperación." collapsible defaultCollapsed>
                        <TrendsAnalysis partyAnalysis={partyAnalysis} />
                    </AnalysisCard>
                </div>
            </div>
        </div>;

      case 'd_hondt':
        return activeDataset && <div>
          <p className="text-center text-light-text-secondary dark:text-dark-text-secondary text-sm mb-4">Análisis para: <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{activeDataset.name}</span></p>
          <DHondtSimulator
            title="Simulador D'Hondt Interactivo"
            initialParties={dHondtPartiesOverride || initialPartyData}
            partyAnalysis={partyAnalysis}
            electionType={activeDataset.processedData[0]?.Eleccion}
            onReset={() => setDHondtPartiesOverride(null)}
            isOverride={!!dHondtPartiesOverride}
          />
        </div>;

      case 'projections':
        return activeDataset && <div className="space-y-6">
            <p className="text-center text-light-text-secondary dark:text-dark-text-secondary text-sm">Análisis para: <span className="font-semibold text-light-text-primary dark:text-dark-text-primary">{activeDataset.name}</span></p>
            <AnalysisCard title={`Módulo de Simulación de Escenarios (${analysisSubjectPlural})`} explanation={`Define y ejecuta simulaciones para entender cómo diferentes variables podrían impactar el resultado a nivel de ${analysisSubject.toLowerCase()}.`} collapsible fullscreenable={false}>
              <ScenarioControls baseRanking={filteredRanking} onSimulate={handleSimulate} disabled={isLoading || isSimulating}/>
            </AnalysisCard>
            {isSimulating && (
              <div className="text-center py-10 bg-dark-card rounded-lg">
                <LoadingSpinner className="w-8 h-8 mx-auto text-brand-primary" />
                <p className="mt-4 font-semibold">Ejecutando simulación...</p>
              </div>
            )}
            {simulationResults && (
                <div className="space-y-6">
                  <AnalysisCard title="Análisis IA de la Simulación" explanation={`Obtén un análisis estratégico de los resultados de la simulación de ${analysisSubjectPlural.toLowerCase()}.`} collapsible defaultCollapsed>
                    <button onClick={() => handleAiAnalysis('projections')} disabled={isAiLoading['projections']} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-wait">
                        <SparklesIcon className="w-5 h-5" />
                        Obtener Análisis de Simulación con IA
                    </button>
                    {isAiLoading['projections'] && (
                        <div className="mt-4 text-center py-8 bg-dark-bg/30 rounded-lg">
                            <LoadingSpinner className="w-8 h-8 mx-auto text-brand-primary" />
                            <p className="mt-3 font-semibold text-dark-text-secondary">Generando análisis de la simulación...</p>
                        </div>
                    )}
                    {!isAiLoading['projections'] && aiAnalysis['projections']?.text && (
                        <>
                            <pre className="whitespace-pre-wrap font-sans text-sm max-w-none mt-4 bg-dark-bg p-4 rounded-md border border-dark-border">
                              {aiAnalysis['projections'].text}
                            </pre>
                             {aiAnalysis['projections']?.sources && aiAnalysis['projections'].sources.length > 0 && (
                                <div className="mt-4 p-4 rounded-md bg-dark-bg/50 border border-dark-border">
                                    <h4 className="text-sm font-semibold text-dark-text-secondary">Fuentes de Google Search:</h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1">
                                        {aiAnalysis['projections'].sources.map((source, index) => source.web && (
                                            <li key={index} className="text-xs">
                                                <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
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
                  <AnalysisCard title="Oráculo Final (Probabilidad de Curul)" explanation="Resultado de la simulación de Monte Carlo. Muestra la probabilidad de que cada candidato obtenga una curul, basado en miles de micro-elecciones simuladas.">
                      <DataTable title="" headers={['#', 'Candidato', 'Votos Proyectados', 'Probabilidad de Curul (%)']} data={simulationResults.probabilities.map((p, i) => [i + 1, p.candidato, Math.round(p.votos_proyectados), p.probabilidad_curul.toFixed(2) + '%'])} highlightFirstN={5} />
                    </AnalysisCard>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <AnalysisCard title="Impacto: Fragmentación de Votos" explanation="Este ranking muestra cómo quedaría el poder electoral si la unidad política seleccionada se fragmenta entre varios candidatos.">
                            <DataTable title="" headers={['#', 'Candidato', 'Poder Electoral Fragmentado']} data={simulationResults.fragmentedRanking.map((c, i) => [i + 1, c.candidato, c.poderElectoralBase])} />
                        </AnalysisCard>
                        <AnalysisCard title="Ranking Final Simulado (Post-Factores)" explanation="Este es el ranking final después de aplicar todos los factores de simulación: fragmentación, posición política, efecto arrastre, apoyo estructural y fuerza de campaña. Este es el ranking que se usa para la simulación de Monte Carlo.">
                            <DataTable title="" headers={['#', 'Candidato', 'Poder Electoral con Factores']} data={simulationResults.factoredRanking.map((c, i) => [i + 1, c.candidato, c.poderElectoralBase])} />
                        </AnalysisCard>
                    </div>
                </div>
            )}
        </div>;

      case 'historical':
        return <HistoricalSimulator datasets={datasets} partyAnalysis={partyAnalysis} onClassifyIdeologies={onClassifyIdeologies} />;

      case 'coalitions':
        return <CoalitionAnalysis datasets={datasets} />;

      case 'list_analysis':
        return <ListAnalysis
          datasets={datasets}
          partyAnalysis={partyAnalysis}
          onProjectAndSimulate={handleProjectAndSimulate}
          activePartyData={initialPartyData}
        />;

      case 'strategist':
        return <StrategicReportGenerator 
            datasets={datasets}
            partyAnalysis={partyAnalysis}
            activeDataset={activeDataset}
        />;
      
      case 'methodology':
        return <Methodology />;

      case 'heatmap':
        return <HeatmapAnalysis />;

      default:
        return null;
    }
  };

  return <>{renderContent()}</>;
};

export default Dashboard;