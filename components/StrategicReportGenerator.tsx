
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
                disabled={disabled}
                className="bg-brand-primary/80 hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-white/10 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
            >
                Exportar Informe
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1410] border border-brand-primary/30 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20 backdrop-blur-xl">
                    <button onClick={() => { onPdf(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-brand-primary/20 flex items-center gap-2 transition-colors">
                        <FilePdfIcon className="w-5 h-5 text-red-500" />
                        Exportar a PDF
                    </button>
                    <button onClick={() => { onXlsx(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-brand-primary/20 flex items-center gap-2 transition-colors border-t border-white/5">
                        <FileExcelIcon className="w-5 h-5 text-green-500" />
                        Exportar a Excel
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

    const Section: React.FC<{ title: string, items: string[], colorClass: string, glowClass: string }> = ({ title, items, colorClass, glowClass }) => (
        <div className={`glass-panel p-5 rounded-xl border border-white/5 relative overflow-hidden group transition-all duration-300 hover:border-white/20`}>
             <div className={`absolute top-0 right-0 w-20 h-20 ${glowClass} blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <h5 className={`font-mono font-bold text-sm mb-4 uppercase tracking-widest ${colorClass} border-b border-white/10 pb-2`}>{title}</h5>
            <ul className="space-y-2 text-xs text-gray-300 font-sans">
                {items.map((item, i) => <li key={i} className="leading-relaxed">• {item}</li>)}
            </ul>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
            <Section title="Strengths (Fortalezas)" items={sections.STRENGTHS} colorClass="text-green-400" glowClass="bg-green-500" />
            <Section title="Weaknesses (Debilidades)" items={sections.WEAKNESSES} colorClass="text-red-400" glowClass="bg-red-500" />
            <Section title="Opportunities (Oportunidades)" items={sections.OPPORTUNITIES} colorClass="text-blue-400" glowClass="bg-blue-500" />
            <Section title="Threats (Amenazas)" items={sections.THREATS} colorClass="text-yellow-400" glowClass="bg-yellow-500" />
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
        'Positivo': 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
        'Neutro': 'bg-gray-500 shadow-[0_0_10px_rgba(107,114,128,0.5)]',
        'Negativo': 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]',
    };

    return (
        <div className="space-y-4 my-8 p-6 glass-panel rounded-xl border border-white/10">
             <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary mb-6 font-mono">Temas Clave en la Narrativa</h4>
            {data.map((item, index) => (
                <div key={index} className="group">
                    <div className="flex justify-between items-center mb-2 text-xs">
                        <span className="font-bold text-gray-200">{item.theme}</span>
                        <span className="text-gray-400 font-mono">{item.relevance}%</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5" title={`Sentimiento: ${item.sentiment}`}>
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${sentimentColors[item.sentiment] || 'bg-gray-500'}`}
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
                elements.push(<ul key={`ul-${key}-${elements.length}`} className="list-disc pl-6 my-4 space-y-2 text-gray-300 text-sm marker:text-brand-primary">{listItems}</ul>);
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
                        // Section Header
                         elements.push(
                            <h3 key={`h3-${key}-${index}`} className="text-lg font-bold mt-8 mb-4 text-brand-primary font-mono uppercase tracking-widest border-b border-brand-primary/30 pb-2 flex items-center gap-3">
                                <span className="w-2 h-2 bg-brand-primary rotate-45"></span>
                                {line.slice(2, -2)}
                            </h3>
                        );
                    } else {
                        elements.push(<p key={`p-${key}-${index}`} className="mb-4 leading-7 text-gray-300 text-sm font-sans text-justify">{line}</p>);
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
                    <div key={`table-container-${i}`} className="my-8">
                         <h4 key={`h4-${i}`} className="text-xs font-bold mb-3 uppercase tracking-[0.2em] text-gray-400 font-mono flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 text-brand-secondary"/>
                            {tableTitle}
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                            <table className="min-w-full text-sm text-left">
                                <thead className="bg-white/5 text-brand-primary font-mono text-xs uppercase">
                                    <tr>{tableHeaders.map((h, idx) => <th key={`th-${h}-${idx}`} className="px-6 py-4 font-bold tracking-wider">{h}</th>)}</tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-black/20 backdrop-blur-sm">
                                    {tableBody.map((row, idx) => (
                                        <tr key={`tr-${idx}`} className="hover:bg-white/5 transition-colors group">
                                            {row.map((cell, j) => (
                                                <td key={`td-${idx}-${j}`} className={`px-6 py-4 text-gray-300 font-medium ${j === 0 ? 'text-white group-hover:text-brand-glow' : ''} ${cell.includes('%') || !isNaN(Number(cell.replace(/\./g, ''))) ? 'font-mono' : ''}`}>
                                                    {cell}
                                                </td>
                                            ))}
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
        <div className="space-y-8">
            <AnalysisCard
                title="Generador de Informes Estratégicos con IA"
                explanation="Selecciona un partido y el número de escaños en disputa. La IA analizará todos los datos disponibles y usará Google Search para el contexto actual, generando un informe cuantitativo completo."
                fullscreenable={false}
            >
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">1. Partido de Interés</label>
                            <select value={targetParty} onChange={e => setTargetParty(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all">
                                {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar...'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">2. Escaños en Disputa</label>
                            <input
                                type="number"
                                value={seats}
                                onChange={(e) => setSeats(parseInt(e.target.value, 10) || 1)}
                                min="1"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all font-mono"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">3. Enfoque Específico (Opcional)</label>
                            <input
                                type="text"
                                value={focus}
                                onChange={(e) => setFocus(e.target.value)}
                                placeholder="Ej: Candidato Juan Pérez"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider font-mono">4. Consulta Estratégica Adicional</label>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ej: ¿Debilidades frente a jóvenes?"
                                className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-3 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex items-end pt-2">
                        <button
                            onClick={handleGenerateReport}
                            disabled={isLoading || !targetParty}
                            className="w-full bg-gradient-to-r from-brand-secondary to-brand-primary hover:from-brand-primary hover:to-brand-glow text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? <LoadingSpinner className="w-6 h-6" /> : <SparklesIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />}
                            <span className="tracking-widest font-mono uppercase text-sm">{isLoading ? 'Procesando Datos...' : 'Generar Informe Estratégico'}</span>
                        </button>
                    </div>
                </div>
            </AnalysisCard>

            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-brand-primary/30 border-t-brand-primary animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <SparklesIcon className="w-6 h-6 text-brand-glow animate-pulse"/>
                        </div>
                    </div>
                    <p className="mt-6 font-mono font-bold text-lg text-brand-primary tracking-widest animate-pulse">ANALIZANDO VECTORES ELECTORALES</p>
                    <p className="text-sm text-gray-400 mt-2">Procesando datos históricos y contexto en tiempo real...</p>
                </div>
            )}

            {error && (
                 <div className="flex items-center p-6 bg-red-900/20 border border-red-500/50 text-red-200 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] backdrop-blur-md">
                    <WarningIcon className="w-8 h-8 mr-4 flex-shrink-0 text-red-500"/>
                    <div>
                        <h4 className="font-bold text-red-400 uppercase tracking-wider font-mono mb-1">Error en el Sistema</h4>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}

            {report && (
                <AnalysisCard title={`Informe Estratégico: ${targetParty} ${focus ? `(${focus})` : ''}`} explanation="Informe generado por la IA basado en datos históricos y metodologías internas.">
                    <div className="flex justify-end mb-6">
                        <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} disabled={!report} />
                    </div>
                     <div className="p-8 bg-[#0f0a06] text-gray-200 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                        {/* Watermark-like background element */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
                        
                        <div ref={reportRef} className="relative z-10">
                             {/* Header of the report */}
                             <div className="border-b border-white/10 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                                <div>
                                    <p className="text-brand-primary font-mono text-xs uppercase tracking-[0.3em] mb-2">Documento Confidencial</p>
                                    <h2 className="text-3xl font-bold text-white font-sans tracking-tight">Informe de Inteligencia Electoral</h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-xs font-mono uppercase">Generado por DEMOS ARRAKIS</p>
                                    <p className="text-gray-400 text-sm font-mono">{new Date().toLocaleDateString()}</p>
                                </div>
                             </div>
                            
                            <ReportRenderer text={report.text} />
                        </div>
                        
                        {report.sources && report.sources.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-white/10">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4 font-mono">Fuentes de Inteligencia Externa (Google Search)</h4>
                                <ul className="space-y-2">
                                    {report.sources.map((source, index) => source.web && (
                                        <li key={index} className="text-xs font-mono flex items-center gap-2 text-gray-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="hover:text-brand-glow hover:underline truncate max-w-full block transition-colors">
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
