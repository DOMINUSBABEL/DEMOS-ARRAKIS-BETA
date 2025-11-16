import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ToonDataset, PartyAnalysisData, HistoricalDataset } from '../types';
import { generateStrategicReport } from '../services/geminiService';
import { generateStrategicReportPDF } from '../services/reportGenerator';
import { exportStrategicReportToXLSX } from '../services/spreadsheetGenerator';
import AnalysisCard from './AnalysisCard';
import { LoadingSpinner, SparklesIcon, FilePdfIcon, FileExcelIcon, WarningIcon } from './Icons';

interface StrategicReportGeneratorProps {
    datasets: ToonDataset[];
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


const ReportRenderer: React.FC<{ text: string }> = ({ text }) => {
    const renderContent = () => {
        const lines = text.split('\n');
        const elements = [];
        let inTable = false;
        let tableHeaders: string[] = [];
        let tableRows: string[][] = [];

        const flushTable = () => {
            if (tableRows.length > 0) {
                elements.push(
                    <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
                        <table className="min-w-full text-sm border border-gray-600">
                            <thead className="bg-gray-700">
                                <tr>{tableHeaders.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold">{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {tableRows.map((row, i) => (
                                    <tr key={i} className="border-t border-gray-600 bg-gray-800 hover:bg-gray-700/50">
                                        {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            }
            inTable = false;
            tableHeaders = [];
            tableRows = [];
        };

        for (const line of lines) {
            if (line.startsWith('--- TABLE START:')) {
                flushTable();
                inTable = true;
                const title = line.replace('--- TABLE START:', '').replace('---', '').trim();
                elements.push(<h4 key={`h4-${elements.length}`} className="text-md font-semibold mt-6 mb-2">{title}</h4>);
                continue;
            }
            if (line.startsWith('--- TABLE END ---')) {
                flushTable();
                continue;
            }

            if (inTable) {
                const cells = line.split('|').map(c => c.trim()).slice(1, -1);
                if (cells.length > 0) {
                    if (tableHeaders.length === 0) {
                        tableHeaders = cells;
                    } else if (!line.includes('---')) {
                        tableRows.push(cells);
                    }
                }
            } else if (line.startsWith('**') && line.endsWith('**')) {
                elements.push(<h3 key={`h3-${elements.length}`} className="text-xl font-bold mt-6 mb-3 border-b border-gray-700 pb-2">{line.slice(2, -2)}</h3>);
            } else if (line.startsWith('* ') || line.startsWith('- ')) {
                elements.push(<li key={`li-${elements.length}`} className="ml-6 mb-1">{line.slice(2)}</li>);
            } else if (line.trim()) {
                elements.push(<p key={`p-${elements.length}`} className="mb-3 leading-relaxed">{line}</p>);
            }
        }
        flushTable(); // flush any remaining table
        return elements;
    };

    return <>{renderContent()}</>;
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
    const [report, setReport] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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
            const result = await generateStrategicReport(activeDataset, partyAnalysis, targetParty, seats);
            setReport(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, [targetParty, seats, activeDataset, partyAnalysis]);

    const handleExportPdf = () => {
        if (reportRef.current) {
            generateStrategicReportPDF(reportRef.current, `Informe_Estrategico_${targetParty}.pdf`);
        }
    };

    const handleExportXlsx = () => {
        if (report) {
            exportStrategicReportToXLSX(report, `Tablas_Informe_${targetParty}`);
        }
    };


    return (
        <div className="space-y-6">
            <AnalysisCard
                title="Generador de Informes Estratégicos con IA"
                explanation="Selecciona un partido y el número de escaños en disputa. La IA analizará todos los datos disponibles para generar un informe cuantitativo completo, incluyendo proyecciones y análisis de sensibilidad."
                fullscreenable={false}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
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
                    <div ref={reportRef} className="p-6 bg-white dark:bg-gray-900/50 text-light-text-primary dark:text-gray-200 rounded-lg prose prose-invert max-w-none">
                        <ReportRenderer text={report} />
                    </div>
                </AnalysisCard>
            )}

        </div>
    );
};

export default StrategicReportGenerator;