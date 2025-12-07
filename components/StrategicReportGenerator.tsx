
// ... imports remain the same ...
import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ElectoralDataset, PartyAnalysisData, HistoricalDataset } from '../types';
import { generateStrategicReport } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { exportStrategicReportToXLSX } from '../services/spreadsheetGenerator';
import AnalysisCard from './AnalysisCard';
import { LoadingSpinner, SparklesIcon, FilePdfIcon, FileExcelIcon, WarningIcon, MapIcon, ChartBarIcon, ScaleIcon, ShareIcon, CpuChipIcon } from './Icons';
import { GenerateContentResponse } from '@google/genai';

// ... ExportMenu, MarkdownText, InsightCard remain the same ...

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
                className="bg-brand-primary/80 hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-white/10 shadow-[0_0_15px_rgba(217,119,6,0.3)] text-sm"
            >
                <ShareIcon className="w-4 h-4"/>
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

const MarkdownText: React.FC<{ text: string, className?: string }> = ({ text, className = "" }) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <em key={i} className="text-brand-glow font-medium not-italic">{part.slice(1, -1)}</em>;
                }
                return part;
            })}
        </span>
    );
};

const InsightCard: React.FC<{ title: string, children: React.ReactNode, type?: 'info' | 'alert' | 'success' }> = ({ title, children, type = 'info' }) => {
    const styles = {
        info: 'border-brand-primary/30 bg-brand-primary/5',
        alert: 'border-red-500/30 bg-red-500/5',
        success: 'border-green-500/30 bg-green-500/5'
    };
    
    return (
        <div className={`p-4 rounded-xl border ${styles[type]} backdrop-blur-sm my-4 transition-all hover:scale-[1.01]`}>
            <h5 className="text-xs font-bold uppercase tracking-widest mb-2 opacity-80 flex items-center gap-2">
                <SparklesIcon className="w-3 h-3"/>
                {title}
            </h5>
            <div className="text-sm text-gray-300 leading-relaxed">
                {children}
            </div>
        </div>
    );
};

// --- Visualization Components ---

const SWOTGrid: React.FC<{ content: string }> = ({ content }) => {
    const sections: { [key: string]: string[] } = {
        STRENGTHS: [], WEAKNESSES: [], OPPORTUNITIES: [], THREATS: []
    };
    
    const detectSection = (line: string): keyof typeof sections | null => {
        const upper = line.toUpperCase();
        // Ensure strictly headers or very short lines to avoid false positives in content
        if (line.length > 50) return null; 

        if (upper.includes('STRENGTH') || upper.includes('FORTALEZA')) return 'STRENGTHS';
        if (upper.includes('WEAKNESS') || upper.includes('DEBILIDAD')) return 'WEAKNESSES';
        if (upper.includes('OPPORTUNIT') || upper.includes('OPORTUNIDAD')) return 'OPPORTUNITIES';
        if (upper.includes('THREAT') || upper.includes('AMENAZA')) return 'THREATS';
        return null;
    };

    let currentSection: keyof typeof sections | null = null;

    content.split('\n').forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const sectionKey = detectSection(trimmedLine);
        
        // Priority Fix: Check for section key FIRST.
        // This handles cases where AI formats headers as bullets (e.g., "* WEAKNESSES:")
        if (sectionKey) {
            currentSection = sectionKey;
        } else if (currentSection && (trimmedLine.startsWith('-') || trimmedLine.startsWith('*') || trimmedLine.match(/^\d+\./))) {
             const item = trimmedLine.replace(/^[-*\d\.]+\s*/, '').trim();
             if (item) sections[currentSection].push(item);
        }
    });

    const Section: React.FC<{ title: string, items: string[], colorClass: string, bgClass: string }> = ({ title, items, colorClass, bgClass }) => (
        <div className={`relative p-5 rounded-xl border border-white/5 overflow-hidden group transition-all duration-300 hover:border-white/20 hover:shadow-lg bg-black/20`}>
             <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity rounded-full -mr-10 -mt-10`}></div>
            <h5 className={`font-mono font-bold text-sm mb-4 uppercase tracking-widest ${colorClass} border-b border-white/5 pb-2 flex justify-between items-center`}>
                {title}
                <span className="text-[10px] opacity-50 bg-white/5 px-2 py-0.5 rounded">{items.length}</span>
            </h5>
            {items.length > 0 ? (
                <ul className="space-y-3 text-xs text-gray-300 font-sans">
                    {items.map((item, i) => (
                        <li key={i} className="leading-relaxed flex items-start gap-2">
                            <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${bgClass.replace('bg-', 'bg-')}`}></span>
                            <MarkdownText text={item} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-gray-500 italic">Sin datos detectados.</p>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <Section title="Fortalezas" items={sections.STRENGTHS} colorClass="text-emerald-400" bgClass="bg-emerald-500" />
            <Section title="Debilidades" items={sections.WEAKNESSES} colorClass="text-rose-400" bgClass="bg-rose-500" />
            <Section title="Oportunidades" items={sections.OPPORTUNITIES} colorClass="text-blue-400" bgClass="bg-blue-500" />
            <Section title="Amenazas" items={sections.THREATS} colorClass="text-amber-400" bgClass="bg-amber-500" />
        </div>
    );
};

// ... GeoTacticalAnalysis, ThemesBarChart, ReportRenderer, StrategicReportGenerator remain the same ...
// ... Copying the rest of the file content to ensure context is maintained ...

interface GeoData {
    location: string;
    intensity: 'Alta' | 'Media' | 'Baja';
    notes: string;
}

const GeoTacticalAnalysis: React.FC<{ content: string }> = ({ content }) => {
    const data: GeoData[] = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => (line.startsWith('-') || line.startsWith('*')) && !line.startsWith('#'))
        .map(line => {
            const parts = line.slice(1).split('|').map(p => p.trim());
            if (parts.length >= 2) {
                return {
                    location: parts[0],
                    intensity: (parts[1] as any) || 'Media',
                    notes: parts[2] || ''
                };
            }
            return null;
        })
        .filter((item): item is GeoData => item !== null);

    if (data.length === 0) return null;

    const intensityConfig = {
        'Alta': { color: 'text-emerald-400', bg: 'bg-emerald-500', width: 100 },
        'Media': { color: 'text-amber-400', bg: 'bg-amber-500', width: 60 },
        'Baja': { color: 'text-rose-400', bg: 'bg-rose-500', width: 30 },
    };

    return (
        <div className="my-6 p-6 bg-black/20 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 font-mono flex items-center gap-2">
                <MapIcon className="w-4 h-4 text-brand-secondary"/>
                Inteligencia Geo-Táctica
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.map((item, index) => {
                    const config = intensityConfig[item.intensity as keyof typeof intensityConfig] || intensityConfig['Media'];
                    return (
                        <div key={index} className="relative overflow-hidden flex flex-col p-4 bg-[#1a1410] rounded-lg border border-white/5 hover:border-brand-primary/30 transition-all group">
                            <div className="flex justify-between items-center mb-2 z-10">
                                <span className="font-bold text-gray-200 text-sm">{item.location}</span>
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 ${config.color}`}>
                                    {item.intensity}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-800 rounded-full mb-3 overflow-hidden z-10">
                                <div className={`h-full rounded-full ${config.bg} shadow-[0_0_8px_currentColor] transition-all duration-1000`} style={{ width: `${config.width}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-400 leading-tight z-10"><MarkdownText text={item.notes} /></p>
                            {/* Background decoration */}
                            <div className={`absolute -bottom-4 -right-4 w-16 h-16 ${config.bg} opacity-5 blur-[30px] rounded-full group-hover:opacity-10 transition-opacity`}></div>
                        </div>
                    );
                })}
            </div>
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
            if (parts.length >= 2) {
                const relevance = parseInt(parts[1].replace(/\D/g, ''), 10);
                return {
                    theme: parts[0],
                    relevance: isNaN(relevance) ? 0 : relevance,
                    sentiment: parts[2] ? parts[2].replace(/[\[\]]/g, '') : 'Neutro',
                };
            }
            return null;
        })
        .filter((item): item is BarChartData => item !== null);

    if (data.length === 0) return null;

    const sentimentConfig: Record<string, string> = {
        'Positivo': 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]',
        'Neutro': 'bg-gradient-to-r from-gray-600 to-gray-400',
        'Negativo': 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.3)]',
    };

    return (
        <div className="space-y-5 my-6 p-6 bg-black/20 rounded-xl border border-white/5">
             <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 font-mono flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-brand-secondary"/>
                Ecosistema Narrativo
            </h4>
            {data.map((item, index) => (
                <div key={index} className="group">
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                        <span className="font-bold text-gray-200 group-hover:text-white transition-colors">{item.theme}</span>
                        <span className="text-gray-500 font-mono group-hover:text-brand-primary transition-colors">{item.relevance}%</span>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110 ${sentimentConfig[item.sentiment] || sentimentConfig['Neutro']}`}
                            style={{ width: `${item.relevance}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Main Report Renderer ---

const ReportSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-8 animate-fade-in-up">
        {title && (
            <h3 className="text-lg font-bold text-brand-primary mb-4 pb-2 border-b border-white/10 font-mono tracking-wide uppercase flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-brand-primary rotate-45"></span>
                {title}
            </h3>
        )}
        <div className="text-gray-300 space-y-4">
            {children}
        </div>
    </section>
);

const ReportRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Split by custom markers
    const parts = text.split(/(---\s*(?:SWOT|BARCHART|TABLE|GEO)\s*(?:START|END)(?:.*?)---)/g);
    
    const elements: React.ReactNode[] = [];
    
    let textBuffer = '';
    let currentSectionTitle = '';
    let sectionContent: React.ReactNode[] = [];

    const flushTextBuffer = (keyPrefix: string) => {
        if (!textBuffer.trim()) return;

        const lines = textBuffer.split('\n');
        let listItems: React.ReactNode[] = [];
        const flushList = () => {
            if (listItems.length > 0) {
                sectionContent.push(
                    <ul key={`${keyPrefix}-ul-${sectionContent.length}`} className="list-none space-y-2 my-3 pl-4 border-l-2 border-white/10">
                        {listItems}
                    </ul>
                );
                listItems = [];
            }
        };

        lines.forEach((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return;

            if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50 && !trimmed.includes(':'))) {
                flushList();
                if (sectionContent.length > 0 || currentSectionTitle) {
                    elements.push(
                        <ReportSection key={`${keyPrefix}-sec-${elements.length}`} title={currentSectionTitle}>
                            {[...sectionContent]}
                        </ReportSection>
                    );
                    sectionContent = [];
                }
                currentSectionTitle = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
                return;
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                listItems.push(
                    <li key={`${keyPrefix}-li-${i}`} className="text-sm text-gray-300 relative pl-4">
                        <span className="absolute left-0 top-1.5 w-1 h-1 bg-brand-primary rounded-full"></span>
                        <MarkdownText text={trimmed.slice(2)} />
                    </li>
                );
                return;
            }

            if (trimmed.startsWith('>')) {
                flushList();
                sectionContent.push(
                    <InsightCard key={`${keyPrefix}-quote-${i}`} title="Insight Estratégico">
                        <MarkdownText text={trimmed.replace(/^>\s*/, '')} />
                    </InsightCard>
                );
                return;
            }

            flushList();
            sectionContent.push(
                <p key={`${keyPrefix}-p-${i}`} className="text-sm leading-7 text-justify text-gray-300/90">
                    <MarkdownText text={trimmed} />
                </p>
            );
        });

        flushList();
        textBuffer = '';
    };

    let i = 0;
    while(i < parts.length) {
        const part = parts[i];

        if (part.includes('START ---')) {
            flushTextBuffer(`chunk-${i}`);
            
            const content = parts[i+1];
            if (part.includes('SWOT')) {
                sectionContent.push(<SWOTGrid key={`swot-${i}`} content={content} />);
            } else if (part.includes('BARCHART')) {
                sectionContent.push(<ThemesBarChart key={`bar-${i}`} content={content} />);
            } else if (part.includes('GEO')) {
                sectionContent.push(<GeoTacticalAnalysis key={`geo-${i}`} content={content} />);
            } else if (part.includes('TABLE')) {
                const titleMatch = part.match(/TABLE START: (.*?)---/);
                const title = titleMatch ? titleMatch[1].trim() : 'Datos Detallados';
                const rows = content.split('\n').filter(r => r.trim() && !r.includes('---'));
                if (rows.length > 1) {
                    const headers = rows[0].split('|').map(c => c.trim()).filter(c => c);
                    const body = rows.slice(1).map(r => r.split('|').map(c => c.trim()).filter(c => c));
                    sectionContent.push(
                        <div key={`table-${i}`} className="my-6 overflow-hidden rounded-xl border border-white/10 bg-black/20 shadow-lg">
                            <div className="bg-white/5 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                                <ScaleIcon className="w-4 h-4 text-brand-secondary"/>
                                <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{title}</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-gray-400">
                                    <thead className="bg-white/5 text-xs uppercase text-brand-primary">
                                        <tr>
                                            {headers.map((h, idx) => <th key={idx} className="px-6 py-3 font-semibold">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {body.map((row, rIdx) => (
                                            <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                                                {row.map((cell, cIdx) => (
                                                    <td key={cIdx} className={`px-6 py-3 ${cIdx === 0 ? 'text-white font-medium' : ''} ${cell.includes('%') ? 'font-mono text-brand-glow' : ''}`}>
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
            }
            i += 3;
        } else if (part.includes('END ---')) {
            i++; 
        } else {
            textBuffer += part;
            i++;
        }
    }
    
    flushTextBuffer('final');
    if (sectionContent.length > 0 || currentSectionTitle) {
        elements.push(
            <ReportSection key="sec-final" title={currentSectionTitle}>
                {sectionContent}
            </ReportSection>
        );
    }

    return (
        <div className="space-y-2">
            {elements}
        </div>
    );
};

export interface StrategicReportGeneratorProps {
    datasets: ElectoralDataset[];
    partyAnalysis: Map<string, PartyAnalysisData>;
    activeDataset: HistoricalDataset | null;
}

const StrategicReportGenerator: React.FC<StrategicReportGeneratorProps> = ({ datasets, partyAnalysis, activeDataset }) => {
    const [targetParty, setTargetParty] = useState('');
    
    const getDefaultSeats = useCallback((dataset: HistoricalDataset | null) => {
        if (!dataset || !dataset.processedData || dataset.processedData.length === 0) return 17;
        const name = dataset.name.toLowerCase();
        const type = dataset.processedData[0].Eleccion;
        const lowerType = type.toLowerCase();
        
        if (lowerType.includes('senado') || name.includes('senado')) {
            return 100;
        }
        if (lowerType.includes('asamblea') || lowerType.includes('concejo')) {
            return 26;
        }
        if (lowerType.includes('cámara') || lowerType.includes('camara')) {
             if (name.includes('antioquia') || dataset.processedData[0].Departamento?.toLowerCase().includes('antioquia')) return 17;
             return 5;
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
            setReport({ text: response.text || '', sources });
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
                explanation="Selecciona un partido y el número de escaños en disputa. La IA analizará todos los datos disponibles y usará Google Search para el contexto actual, generando un informe cuantitativo completo. Ahora compatible con análisis de Senado y otros departamentos."
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
                <div className="animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <CpuChipIcon className="w-8 h-8 text-brand-primary" />
                            <span className="text-brand-glow">Informe Generado</span>
                        </h2>
                        <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} disabled={!report} />
                    </div>
                    
                     <div className="p-8 bg-[#0f0a06] text-gray-200 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden" data-pdf-target="true">
                        {/* Watermark-like background element */}
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>
                        
                        <div ref={reportRef} className="relative z-10" data-pdf-target="true">
                             {/* Header of the report */}
                             <div className="border-b border-white/10 pb-8 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded text-[10px] font-bold uppercase tracking-widest text-brand-primary">Confidencial</div>
                                        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold uppercase tracking-widest text-gray-400">Inteligencia Artificial</div>
                                    </div>
                                    <h2 className="text-4xl font-bold text-white font-sans tracking-tight mb-1">{targetParty}</h2>
                                    {focus && <p className="text-lg text-brand-glow font-medium">Enfoque: {focus}</p>}
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-xs font-mono uppercase tracking-widest mb-1">Generado por</p>
                                    <p className="text-white font-bold font-mono text-sm">DEMOS ARRAKIS</p>
                                    <p className="text-brand-secondary text-xs font-mono mt-1">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                             </div>
                            
                            <ReportRenderer text={report.text} />
                        </div>
                        
                        {report.sources && report.sources.length > 0 && (
                            <div className="mt-12 pt-8 border-t border-white/10">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 font-mono flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Fuentes de Inteligencia (Google Search)
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {report.sources.map((source, index) => source.web && (
                                        <a 
                                            key={index} 
                                            href={source.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="block p-3 rounded bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                                        >
                                            <p className="text-xs font-bold text-gray-300 group-hover:text-white truncate mb-1">{source.web.title}</p>
                                            <p className="text-[10px] text-gray-500 font-mono truncate">{source.web.uri}</p>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
};

export default StrategicReportGenerator;
