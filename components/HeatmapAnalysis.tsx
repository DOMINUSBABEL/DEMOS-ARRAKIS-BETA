import React, { useState, useEffect } from 'react';
import { InformationCircleIcon, WarningIcon, LoadingSpinner, MapIcon, SparklesIcon } from './Icons';
import AnalysisCard from './AnalysisCard';
import { getGeospatialAnalysis } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

// Simple markdown-like renderer for the response
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

    flushList(); // Flush any remaining list items at the end

    return (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-dark-text-primary dark:text-dark-text-primary">
            {elements}
        </div>
    );
};

const HeatmapAnalysis: React.FC = () => {
    const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [query, setQuery] = useState<string>('¿Cuáles son las zonas con mayor potencial de crecimiento para el Partido Alianza Verde cerca de mi ubicación actual?');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [apiResponse, setApiResponse] = useState<GenerateContentResponse | null>(null);

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
            const response = await getGeospatialAnalysis(query, locationCoords);
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
            <AnalysisCard 
                title="Análisis Geoespacial Electoral con IA" 
                explanation="Realiza preguntas en lenguaje natural sobre datos electorales en un contexto geográfico. La IA utilizará Google Maps y Google Search para obtener información actualizada y relevante. Proporciona tu ubicación para análisis más precisos."
                icon={<MapIcon />}
                fullscreenable={false}
            >
                <form onSubmit={handleGenerateAnalysis} className="p-4 space-y-4">
                    <div>
                        <label htmlFor="geospatial-query" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-2">
                            Ingresa tu pregunta
                        </label>
                        <textarea
                            id="geospatial-query"
                            rows={3}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Ej: ¿Dónde se encuentran los bastiones del Partido Conservador en el Valle de Aburrá?"
                            className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 flex items-center justify-center">
                        {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Analizando...' : 'Generar Análisis Geoespacial'}
                    </button>
                </form>
            </AnalysisCard>
            
            {analysisError && (
                 <div className="flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                    <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                    <p>{analysisError}</p>
                </div>
            )}

            {apiResponse && (
                <AnalysisCard title="Resultados del Análisis" explanation="Respuesta generada por la IA, enriquecida con datos de Google Maps y Google Search.">
                    <div className="p-4 space-y-4">
                        <ResponseRenderer text={apiResponse.text} />
                        
                        {groundingChunks && groundingChunks.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-light-border dark:border-dark-border">
                                <h4 className="text-md font-semibold text-light-text-secondary dark:text-dark-text-secondary mb-3">Fuentes de Datos</h4>
                                <ul className="space-y-2 list-disc list-inside">
                                    {groundingChunks.map((chunk, index) => {
                                        if (chunk.maps) {
                                            return (
                                                <li key={`map-${index}`} className="text-sm">
                                                    <a href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                                                        {chunk.maps.title || 'Ver en Google Maps'}
                                                    </a>
                                                </li>
                                            );
                                        }
                                        if (chunk.web) {
                                            return (
                                                <li key={`web-${index}`} className="text-sm">
                                                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                                                        {chunk.web.title || 'Ver en Web'}
                                                    </a>
                                                </li>
                                            );
                                        }
                                        return null;
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>
                </AnalysisCard>
            )}

            <AnalysisCard title="Estado de la Geolocalización" explanation="Para análisis geográficos más precisos, la aplicación puede utilizar tu ubicación actual." fullscreenable={false}>
                <div className="p-4">
                    {geoError && (
                         <div className="flex items-center p-3 bg-yellow-900/50 border border-yellow-500 text-yellow-300 rounded-lg text-sm">
                            <WarningIcon className="w-5 h-5 mr-2 flex-shrink-0"/>
                            <span>{geoError}</span>
                        </div>
                    )}
                    {location && (
                        <div className="text-sm">
                            <p className="text-green-400">Ubicación obtenida con éxito.</p>
                            <p><span className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">Latitud:</span> {location.latitude.toFixed(4)}</p>
                            <p><span className="font-semibold text-light-text-secondary dark:text-dark-text-secondary">Longitud:</span> {location.longitude.toFixed(4)}</p>
                        </div>
                    )}
                     {!location && !geoError && <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm">Obteniendo ubicación...</p>}
                </div>
            </AnalysisCard>
        </div>
    );
}

export default HeatmapAnalysis;