import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ToonDataset, CoalitionBreakdown, HistoricalDataset } from '../types';
import { calculateCoalitionBreakdown } from '../services/coalitionAnalysisService';
import { generateCoalitionAnalysisPDF } from '../services/reportGenerator';
import { exportCoalitionAnalysisToXLSX } from '../services/spreadsheetGenerator';
import { PieChart, ResponsiveContainer, Cell, Tooltip, Legend, Pie } from 'recharts';
import AnalysisCard from './AnalysisCard';
import { WarningIcon, FilePdfIcon, FileExcelIcon } from './Icons';
import { parseToon } from '../services/toonParser';
// FIX: Import calculateBaseRanking to correctly construct the HistoricalDataset object.
import { aggregateVotesByParty, calculateBaseRanking } from '../services/electoralProcessor';

const ExportMenu: React.FC<{ onPdf: () => void; onXlsx: () => void; disabled: boolean }> = ({ onPdf, onXlsx, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
                Exportar
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


const CoalitionAnalysis: React.FC<{ datasets: ToonDataset[] }> = ({ datasets }) => {
    const [coalitionDatasetId, setCoalitionDatasetId] = useState<string>('');
    const [referenceDatasetId, setReferenceDatasetId] = useState<string>('');
    const [selectedCoalition, setSelectedCoalition] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [breakdown, setBreakdown] = useState<CoalitionBreakdown[] | null>(null);

    const resultsRef = useRef<HTMLDivElement>(null);

    const parseDataset = useCallback((datasetId: string): HistoricalDataset | null => {
        if (!datasetId) return null;
        const ds = datasets.find(d => d.id === datasetId);
        if (!ds) return null;
        const processedData = parseToon(ds.toonData);
        // FIX: Construct a complete HistoricalDataset object, including the missing `baseRanking`.
        return {
            id: ds.id,
            name: ds.name,
            analysisType: ds.analysisType,
            invalidVoteCounts: ds.invalidVoteCounts,
            processedData,
            partyData: aggregateVotesByParty(processedData),
            baseRanking: calculateBaseRanking(processedData),
        };
    }, [datasets]);

    const coalitionDataset = useMemo(() => parseDataset(coalitionDatasetId), [parseDataset, coalitionDatasetId]);

    const coalitionParties = useMemo(() => {
        if (!coalitionDataset) return [];
        return coalitionDataset.partyData.filter(p => p.name.includes('-') || p.name.includes('COALICI') || p.name.length > 25).map(p => p.name);
    }, [coalitionDataset]);

    const handleCalculate = () => {
        setError(null);
        setBreakdown(null);
        try {
            const referenceDataset = parseDataset(referenceDatasetId);

            if (!coalitionDataset || !referenceDataset || !selectedCoalition) {
                throw new Error("Por favor, selecciona todos los campos requeridos.");
            }

            const result = calculateCoalitionBreakdown(coalitionDataset, referenceDataset, selectedCoalition);
            setBreakdown(result);
        } catch (e: any) {
            setError(e.message);
        }
    };
    
    const chartData = useMemo(() => {
        if (!breakdown) return [];
        return breakdown.map(b => ({
            name: b.party,
            value: b.estimatedVotes,
            color: b.color,
        }));
    }, [breakdown]);

    const handleExportPdf = () => {
        if(resultsRef.current) {
            generateCoalitionAnalysisPDF(resultsRef.current, `Analisis_Coalicion_${selectedCoalition}.pdf`);
        }
    };
    
    const handleExportXlsx = () => {
        if(breakdown) {
            exportCoalitionAnalysisToXLSX(breakdown, selectedCoalition);
        }
    };


    return (
        <div className="space-y-6">
            <AnalysisCard title="Configuración del Análisis de Coaliciones" explanation="Realiza 'ingeniería inversa' electoral. Selecciona una elección donde compitió una coalición y una elección de referencia donde sus miembros compitieron por separado para estimar el aporte de votos de cada uno." collapsible>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">1. Elección con Coalición</label>
                        <select value={coalitionDatasetId} onChange={e => setCoalitionDatasetId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            <option value="">Seleccionar...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">2. Coalición a Analizar</label>
                         <select value={selectedCoalition} onChange={e => setSelectedCoalition(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2" disabled={!coalitionDatasetId}>
                            <option value="">Seleccionar...</option>
                            {coalitionParties.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">3. Elección de Referencia</label>
                         <select value={referenceDatasetId} onChange={e => setReferenceDatasetId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2">
                            <option value="">Seleccionar...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                </div>
                 <div className="px-4 pb-4">
                    <button onClick={handleCalculate} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg transition-colors">
                        Calcular Desglose de Coalición
                    </button>
                </div>
            </AnalysisCard>

             {error && (
                 <div className="flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                    <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                    <p>{error}</p>
                </div>
            )}
            
            {breakdown && (
                <AnalysisCard title={`Resultados del Desglose: ${selectedCoalition}`} explanation="A continuación se muestra el aporte estimado de cada partido miembro a la votación total de la coalición." collapsible>
                    <div className="flex justify-end mb-4">
                        <ExportMenu onPdf={handleExportPdf} onXlsx={handleExportXlsx} disabled={!breakdown}/>
                    </div>
                    <div ref={resultsRef} className="p-4 bg-white dark:bg-gray-800">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm text-left text-light-text-secondary dark:text-gray-300">
                                    <thead className="text-xs text-light-text-primary dark:text-gray-100 uppercase bg-gray-200/50 dark:bg-gray-700/50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 font-semibold tracking-wider">Partido Miembro</th>
                                            <th scope="col" className="px-4 py-3 font-semibold tracking-wider text-right">Votos Aportados</th>
                                            <th scope="col" className="px-4 py-3 font-semibold tracking-wider text-right">Aporte (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-light-border dark:divide-gray-700/50">
                                        {breakdown.map((item) => (
                                            <tr key={item.party} className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap font-medium text-light-text-primary dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                                                        <span>{item.party}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right">{item.estimatedVotes.toLocaleString('es-CO')}</td>
                                                <td className="px-4 py-3 text-right">{(item.contributionPercentage * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                            {chartData.map((entry) => (
                                                <Cell key={`cell-${entry.name}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </AnalysisCard>
            )}
        </div>
    );
};

// FIX: Add default export for the component.
export default CoalitionAnalysis;
