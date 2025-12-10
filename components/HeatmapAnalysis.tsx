
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { InformationCircleIcon, WarningIcon, LoadingSpinner, MapIcon, SparklesIcon, ChartBarIcon } from './Icons';
import AnalysisCard from './AnalysisCard';
import { getGeospatialAnalysis } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import { processData } from '../services/electoralProcessor'; // Assuming we have access to context or props
import { ElectoralDataset, PartyAnalysisData, HistoricalDataset } from '../types';
import { buildHistoricalDataset } from '../services/electoralProcessor';

// Lazy load the 3D map to prevent initial bundle crash if Three.js has issues
const AntioquiaHeatmap = lazy(() => import('./AntioquiaHeatmap'));

// ... (ResponseRenderer remains the same)
const ResponseRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(<ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2">{listItems}</ul>);
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('* ') || line.startsWith('- ')) {
            listItems.push(<li key={index}>{line.slice(2)}</li>);
        } else {
            flushList();
            if (line.trim() !== '') {
                if (/^#+\s/.test(line)) {
                    const level = line.match(/^#+/)?.[0].length || 1;
                    const content = line.replace(/^#+\s/, '');
                    switch (level) {
                        case 1: elements.push(<h4 key={index} className="font-bold mt-4 mb-2 text-dark-text-primary">{content}</h4>); break;
                        case 2: elements.push(<h5 key={index} className="font-bold mt-3 mb-1 text-dark-text-primary">{content}</h5>); break;
                        default: elements.push(<h6 key={index} className="font-bold mt-2 mb-1 text-dark-text-primary">{content}</h6>); break;
                    }
                } else {
                    elements.push(<p key={index} className="mb-2">{line}</p>);
                }
            }
        }
    });

    flushList(); 

    return (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-dark-text-primary dark:text-dark-text-primary">
            {elements}
        </div>
    );
};

// Props needed to access data
interface HeatmapAnalysisProps {
    datasets?: ElectoralDataset[];
    activeDataset?: HistoricalDataset | null;
}

const HeatmapAnalysis: React.FC<HeatmapAnalysisProps> = ({ datasets = [], activeDataset }) => {
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [query, setQuery] = useState<string>('¿Cuáles son las subregiones de Antioquia con mayor crecimiento del voto en blanco?');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [apiResponse, setApiResponse] = useState<GenerateContentResponse | null>(null);
    
    // Map State
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [heatmapMode, setHeatmapMode] = useState<'historical' | 'tactical'>('historical');

    // Extract parties for filter
    const politicalUnits = useMemo(() => {
        if (!activeDataset) return [];
        return [...new Set(activeDataset.processedData.map(d => d.UnidadPolitica))];
    }, [activeDataset]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation(position.coords);
                setGeoError(null);
            },
            (err: GeolocationPositionError) => {
                setGeoError(`Error al obtener geolocalización: ${err.message}. El análisis se realizará sin contexto de ubicación.`);
                setLocation(null);
            }
        );
    }, []);

    const handleGenerateAnalysis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            setAnalysisError("Por favor, ingresa una pregunta para el análisis.");
            return;
        }

        setIsLoading(true);
        setAnalysisError(null);
        setApiResponse(null);

        try {
            const locationCoords = location ? { latitude: location.latitude, longitude: location.longitude } : null;
            // Enrich prompt with dataset context if available
            const contextPrompt = activeDataset 
                ? `Basado en los datos de ${activeDataset.name} y conocimiento general. ${query}` 
                : query;
                
            const response = await getGeospatialAnalysis(contextPrompt, locationCoords);
            setApiResponse(response);
        } catch (e: any) {
            setAnalysisError(e.message || "Ocurrió un error desconocido al contactar la IA.");
        } finally {
            setIsLoading(false);
        }
    };

    const groundingChunks = apiResponse?.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px] lg:h-[600px]">
                {/* 3D Map Column - Takes Full Height */}
                <div className="h-full flex flex-col">
                    <AnalysisCard 
                        title="Centro de Comando Geoespacial (3D)" 
                        explanation="Visualización táctica del territorio basada en datos electorales. Utilice los controles para navegar el terreno virtual."
                        icon={<MapIcon />}
                        fullscreenable={true}
                    >
                        <div className="p-0 h-[500px] w-full relative flex flex-col">
                            {/* Controls Overlay */}
                            <div className="absolute top-0 right-0 z-20 p-2 w-full flex justify-end pointer-events-none">
                                <div className="pointer-events-auto bg-black/50 backdrop-blur p-2 rounded-bl-xl border-l border-b border-white/10">
                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Capa de Datos</label>
                                    <select 
                                        value={selectedParty} 
                                        onChange={(e) => setSelectedParty(e.target.value)}
                                        className="w-48 bg-gray-900 border border-gray-700 text-white rounded text-xs p-1 focus:ring-brand-primary"
                                    >
                                        <option value="">Votación Total (Global)</option>
                                        {politicalUnits.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-grow w-full bg-gray-900 overflow-hidden relative">
                                {activeDataset ? (
                                    <Suspense fallback={
                                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                                            <div className="text-center">
                                                <LoadingSpinner className="w-8 h-8 mx-auto mb-2 text-brand-primary" />
                                                <p className="text-xs tracking-widest uppercase">Inicializando Motor 3D...</p>
                                            </div>
                                        </div>
                                    }>
                                        <AntioquiaHeatmap 
                                            data={activeDataset.processedData} 
                                            partyFilter={selectedParty}
                                            mode="historical"
                                        />
                                    </Suspense>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-black/40">
                                        <MapIcon className="w-16 h-16 opacity-20 mb-4" />
                                        <p className="font-mono text-sm">SIN DATOS DE TELEMETRÍA</p>
                                        <p className="text-xs mt-2 opacity-60">Cargue un conjunto de datos para activar el satélite.</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-gray-900 border-t border-gray-800 p-2 flex justify-between items-center text-[10px] text-gray-500 font-mono">
                                <span>REG: {activeDataset ? activeDataset.processedData.length.toLocaleString() : 0}</span>
                                <span>LAT: 6.2442 | LON: -75.5812</span>
                            </div>
                        </div>
                    </AnalysisCard>
                </div>

                {/* AI Analysis Column */}
                <div className="h-full flex flex-col">
                    <AnalysisCard 
                        title="Consultor Geoespacial IA" 
                        explanation="Realiza preguntas sobre dinámicas territoriales. La IA cruzará tus datos con información de Google Maps y contexto político."
                        icon={<SparklesIcon />}
                        fullscreenable={false}
                    >
                        <div className="p-4 flex flex-col h-full">
                            <form onSubmit={handleGenerateAnalysis} className="space-y-4 mb-4">
                                <div>
                                    <label htmlFor="geospatial-query" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                                        Consulta al Estratega Territorial
                                    </label>
                                    <textarea
                                        id="geospatial-query"
                                        rows={4}
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Ej: ¿Dónde se encuentran los bastiones del Partido Conservador en el Valle de Aburrá y qué factores geográficos influyen?"
                                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-3 focus:ring-brand-primary focus:border-brand-primary text-sm shadow-inner"
                                    />
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg group">
                                    {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />}
                                    {isLoading ? 'Analizando Territorio...' : 'Ejecutar Análisis Táctico'}
                                </button>
                            </form>
                            
                            {apiResponse && (
                                <div className="flex-grow bg-white/5 rounded-lg p-4 border border-white/10 overflow-y-auto max-h-[350px] custom-scrollbar shadow-inner">
                                    <ResponseRenderer text={apiResponse.text || ''} />
                                    {groundingChunks && groundingChunks.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <p className="text-xs text-gray-500 uppercase mb-2 font-bold">Fuentes de Inteligencia:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {groundingChunks.map((chunk, i) => chunk.web ? (
                                                    <a key={i} href={chunk.web.uri} target="_blank" className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-1 rounded border border-blue-500/30 hover:bg-blue-800/50 truncate max-w-[150px] transition-colors">
                                                        {chunk.web.title}
                                                    </a>
                                                ) : null)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </AnalysisCard>
                </div>
            </div>
        </div>
    );
}

export default HeatmapAnalysis;
