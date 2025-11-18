import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ElectoralDataset, PartyAnalysisData, HistoricalDataset } from '../types';
import { generateStrategicReport } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { exportStrategicReportToXLSX } from '../services/spreadsheetGenerator';
import AnalysisCard from './AnalysisCard';
import { LoadingSpinner, SparklesIcon, FilePdfIcon, FileExcelIcon, WarningIcon } from './Icons';
import { GenerateContentResponse } from '@google/genai';

interface StrategicReportGeneratorProps {
    datasets: ElectoralDataset[];
    partyAnalysis: Map<string, PartyAnalysisData>;
    activeDataset: HistoricalDataset | null;
}

const ExportMenu: React.FC<{ onPdf: () => void; onXlsx: () => void, disabled: boolean }> = ({ onPdf, onXlsx, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                Exportar Informe
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20">
                    <button onClick={() => { onPdf(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                        <FilePdfIcon className="w-5 h-5 text-red-500" />
                        a PDF
                    </button>
                    <button onClick={() => { onXlsx(); setIsOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-light-text-primary dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2">
                        <FileExcelIcon className="w-5 h-5 text-green-500" />
                        a Excel
                    </button>
                </div>
            )}
        </div>
    );
};

const SWOTGrid: React.FC<{ content: string }> = ({ content }) => {
    const sections: { [key: string]: string[] } = {
        STRENGTHS: [], WEAKNESSES: [], OPPORTUNITIES: [], THREATS: []
    };
    let currentSection: keyof typeof sections | null = null;

    content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.endsWith(':')) {
            const sectionName = trimmedLine.slice(0, -1).toUpperCase();
            if (sectionName in sections) {
                currentSection = sectionName as keyof typeof sections;
            }
        } else if (currentSection && (trimmedLine.startsWith('-') || trimmedLine.startsWith('*'))) {
            sections[currentSection].push(trimmedLine.slice(1).trim());
        }
    });

    const Section: React.FC<{ title: string, items: string[], color: string, bgColor: string }> = ({ title, items, color, bgColor }) => (
        <div className={`p-4 rounded-lg ${bgColor}`}>
            <h5 className={`font-bold text-lg mb-2 ${color}`}>{title}</h5>
            <ul className="space-y-2 list-disc pl-5 text-sm">
                {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <Section title="Strengths (Fortalezas)" items={sections.STRENGTHS} color="text-green-300" bgColor="bg-green-900/50" />
            <Section title="Weaknesses (Debilidades)" items={sections.WEAKNESSES} color="text-red-300" bgColor="bg-red-900/50" />
            <Section title="Opportunities (Oportunidades)" items={sections.OPPORTUNITIES} color="text-blue-300" bgColor="bg-blue-900/50" />
            <Section title="Threats (Amenazas)" items={sections.THREATS} color="text-yellow-300" bgColor="bg-yellow-900/50" />
        </div>
    );
};

interface BarChartData {
    theme: string;
    relevance: number;
    sentiment: 'Positivo' | 'Neutro' | 'Negativo' | string;
}

const ThemesBarChart: React.FC<{ content: string }> = ({ content }) => {
    const data: BarChartData[] = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => (line.startsWith('-') || line.startsWith('*')) && !line.startsWith('#'))
        .map(line => {
            const parts = line.slice(1).split('|').map(p => p.trim());
            if (parts.length === 3) {
                const relevance = parseInt(parts[1].replace(/\D/g, ''), 10);
                return {
                    theme: parts[0],
                    relevance: isNaN(relevance) ? 0 : relevance,
                    sentiment: parts[2].replace(/[\[\]]/g, ''),
                };
            }
            return null;
        })
        .filter((item): item is BarChartData => item !== null);

    if (data.length === 0) return null;

    const sentimentColors: Record<string, string> = {
        'Positivo': 'bg-green-500',
        'Neutro': 'bg-gray-500',
        'Negativo': 'bg-red-500',
    };

    return (
        <div className="space-y-3 my-4 p-4 bg-gray-800/50 rounded-lg">
             <h4 className="text-md font-semibold mb-4">Temas Clave en la Narrativa</h4>
            {data.map((item, index) => (
                <div key={index}>
                    <div className="flex justify-between items-center mb-1 text-sm">
                        <span className="font-semibold">{item.theme}</span>
                        <span className="text-dark-text-secondary">{item.relevance}% Relevancia</span>
                    </div>
                    <div className="w-full bg-dark-border rounded-full h-4" title={`Sentimiento: ${item.sentiment}`}>
                        <div
                            className={`h-4 rounded-full ${sentimentColors[item.sentiment] || 'bg-gray-500'}`}
                            style={{ width: `${item.relevance}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};


const ReportRenderer: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(---\s*(?:SWOT|BARCHART|TABLE)\s*(?:START|END)\s*---)/g);
    
    const elements: React.ReactNode[] = [];
    let buffer = '';

    const renderBuffer = (key: string) => {
        if (buffer.trim() === '') return;

        const lines = buffer.split('\n');
        let listItems: React.ReactNode[] = [];

        const flushList = () => {
            if (listItems.length > 0) {
                elements.push(<ul key={`ul-${key}-${elements.length}`} className="list-disc pl-6 my-3 space-y-1">{listItems}</ul>);
                listItems = [];
            }
        };

        for (const [index, line] of lines.entries()) {
            if (line.startsWith('* ') || line.startsWith('- ')) {
                listItems.push(<li key={`li-${key}-${index}`}>{line.slice(2)}</li>);
            } else {
                flushList();
                if (line.trim()) {
                    if (line.startsWith('**') && line.endsWith('**')) {
                        elements.push(<h3 key={`h3-${key}-${index}`} className="text-xl font-bold mt-6 mb-3 border-b border-gray-700 pb-2">{line.slice(2, -2)}</h3>);
                    } else {
                        elements.push(<p key={`p-${key}-${index}`} className="mb-3 leading-relaxed">{line}</p>);
                    }
                }
            }
        }
        flushList();
        buffer = '';
    };

    let i = 0;
    while(i < parts.length) {
        const part = parts[i];

        if (part.startsWith('--- SWOT START ---')) {
            renderBuffer(`text-${i}`);
            elements.push(<SWOTGrid key={`swot-${i}`} content={parts[i+1]} />);
            i += 3; 
        } else if (part.startsWith('--- BARCHART START ---')) {
            renderBuffer(`text-${i}`);
            elements.push(<ThemesBarChart key={`barchart-${i}`} content={parts[i+1]} />);
            i += 3;
        } else if (part.startsWith('--- TABLE START:')) {
            renderBuffer(`text-${i}`);
            const tableTitle = part.replace('--- TABLE START:', '').replace('---', '').trim();
            const tableContent = parts[i+1];
            const tableRows = tableContent.split('\n').map(row => row.split('|').map(cell => cell.trim()).filter(cell => cell)).filter(row => row.length > 0 && !row.every(cell => cell.startsWith('-')));
            if(tableRows.length > 1) {
                const tableHeaders = tableRows[0];
                const tableBody = tableRows.slice(1);
                 elements.push(
                    <div key={`table-container-${i}`}>
                        <h4 key={`h4-${i}`} className="text-md font-semibold mt-6 mb-2">{tableTitle}</h4>
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full text-sm border border-gray-600">
                                <thead className="bg-gray-700">
                                    <tr>{tableHeaders.map((h, idx) => <th key={`th-${h}-${idx}`} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {tableBody.map((row, idx) => (
                                        <tr key={`tr-${idx}`} className="border-t border-gray-600 bg-gray-800 hover:bg-gray-700/50">
                                            {row.map((cell, j) => <td key={`td-${idx}-${j}`} className="px-3 py-2">{cell}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            i += 3;
        } else if (part.startsWith('---') && (part.includes('END') || part.includes('START'))) {
            i++;
        } else {
            buffer += part;
            i++;
        }
    }
    renderBuffer(`text-final`);

    return <>{elements}</>;
};


const StrategicReportGenerator: React.FC<StrategicReportGeneratorProps> = ({ datasets, partyAnalysis, activeDataset }) => {
    const [targetParty, setTargetParty] = useState('');
    
    const getDefaultSeats = useCallback((dataset: HistoricalDataset | null) => {
        if (!dataset || !dataset.processedData || dataset.processedData.length === 0) return 17;
        const type = dataset.processedData[0].Eleccion;
        const lowerType = type.toLowerCase();
        if (lowerType === 'asamblea' || lowerType === 'concejo') {
            return 26;
        }
        return 17;
    }, []);

    const [seats, setSeats] = useState(getDefaultSeats(activeDataset));
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<{ text: string, sources: any[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [focus, setFocus] = useState('');
    const [query, setQuery] = useState('');

    const reportRef = useRef<HTMLDivElement>(null);
    const partyNames = useMemo(() => ['', ...Array.from(partyAnalysis.keys()).sort()], [partyAnalysis]);

    useEffect(() => {
        setSeats(getDefaultSeats(activeDataset));
    }, [activeDataset, getDefaultSeats]);

    const handleGenerateReport = useCallback(async () => {
        if (!targetParty || !activeDataset) {
            setError("Por favor, selecciona un partido de interés y asegúrate de que haya un conjunto de datos activo.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setReport(null);
        try {
            const response = await generateStrategicReport(activeDataset, partyAnalysis, targetParty, seats, focus, query);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
            setReport({ text: response.text, sources });
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [targetParty, seats, activeDataset, partyAnalysis, focus, query]);

    const handleExportPdf = () => {
        if (reportRef.current) {
            generateStrategicReportPDF(reportRef.current, `Informe_Estrategico_${targetParty}.pdf`);
        }
    };

    const handleExportXlsx = () => {
        if (report) {
            exportStrategicReportToXLSX(report.text, `Tablas_Informe_${targetParty}`);
        }
    };


    return (
        <div className="space-y-6">
            <AnalysisCard
                title="Generador de Informes Estratégicos con IA"
                explanation="Selecciona un partido y el número de escaños en disputa. La IA analizará todos los datos disponibles y usará Google Search para el contexto actual, generando un informe cuantitativo completo."
                fullscreenable={false}
            >
                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">1. Partido de Interés</label>
                            <select value={targetParty} onChange={e => setTargetParty(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                                {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar...'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">2. Escaños en Disputa</label>
                            <input
                                type="number"
                                value={seats}
                                onChange={(e) => setSeats(parseInt(e.target.value, 10) || 1)}
                                min="1"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">3. Enfoque Específico (Opcional)</label>
                            <input
                                type="text"
                                value={focus}
                                onChange={(e) => setFocus(e.target.value)}
                                placeholder="Ej: Candidato Juan Pérez"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">4. Consulta Estratégica Adicional</label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ej: ¿Debilidades frente a jóvenes?"
                                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isLoading || !targetParty}
                            className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                            {isLoading ? 'Analizando...' : 'Generar Informe'}
                        </button>
                    </div>
                </div>
            </AnalysisCard>

            {isLoading && (
                <div className="text-center py-10 bg-gray-800 rounded-lg">
                    <LoadingSpinner className="w-10 h-10 mx-auto text-brand-secondary" />
                    <p className="mt-4 font-semibold">Generando informe estratégico...</p>
                    <p className="text-sm text-gray-400">Este proceso puede tardar unos momentos.</p>
                </div>
            )}

            {error && (
                 <div className="flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                    <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                    <p>{error}</p>
                </div>
            )}

            {report && (
                <AnalysisCard title={`Informe Estratégico para ${targetParty}`} explanation="Informe generado por la IA. Usa los botones para exportar los resultados.">
                    <div className="flex justify-end mb-4">
                        <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} disabled={!report} />
                    </div>
                     <div className="p-6 bg-white dark:bg-gray-900/50 text-light-text-primary dark:text-gray-200 rounded-lg">
                        <div ref={reportRef} className="prose prose-invert max-w-none">
                            <ReportRenderer text={report.text} />
                        </div>
                        {report.sources && report.sources.length > 0 && (
                            <div className="mt-8 pt-4 border-t border-gray-700">
                                <h4 className="text-md font-semibold text-dark-text-secondary mb-3">Fuentes de Google Search</h4>
                                <ul className="space-y-2 list-disc list-inside">
                                    {report.sources.map((source, index) => source.web && (
                                        <li key={index} className="text-sm">
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </AnalysisCard>
            )}

        </div>
    );
};

export default StrategicReportGenerator;