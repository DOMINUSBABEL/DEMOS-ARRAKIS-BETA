import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Layer, Rectangle } from 'recharts';
import { HistoricalDataset, PartyAnalysisData } from '../types';
import { getVoteTransferAnalysis } from '../services/geminiService';
import AnalysisCard from './AnalysisCard';
import { LoadingSpinner, SparklesIcon, WarningIcon } from './Icons';

interface SankeyNodePayload {
    name: string;
    x?: number;
    y?: number;
    dx?: number;
    dy?: number;
    value?: number;
}

interface SankeyLinkPayload {
    source: number;
    target: number;
    value: number;
}

interface SankeyData {
    nodes: SankeyNodePayload[];
    links: SankeyLinkPayload[];
}

const SankeyDiagram: React.FC<{ datasets: HistoricalDataset[]; partyAnalysis: Map<string, PartyAnalysisData> }> = ({ datasets, partyAnalysis }) => {
    const [sourceDatasetId, setSourceDatasetId] = useState<string>('');
    const [targetDatasetId, setTargetDatasetId] = useState<string>('');
    const [sankeyData, setSankeyData] = useState<SankeyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalysis = async () => {
        const sourceDs = datasets.find(d => d.id === sourceDatasetId);
        const targetDs = datasets.find(d => d.id === targetDatasetId);

        if (!sourceDs || !targetDs) {
            setError("Debes seleccionar una elección de origen y una de destino.");
            return;
        }
        if (sourceDatasetId === targetDatasetId) {
            setError("Las elecciones de origen y destino deben ser diferentes.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSankeyData(null);

        try {
            const result = await getVoteTransferAnalysis(sourceDs.partyData, targetDs.partyData);
            setSankeyData(result);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const nodeColors = useMemo(() => {
        if (!sankeyData) return {};
        const colors: { [key: string]: string } = {};
        sankeyData.nodes.forEach(node => {
            const party = partyAnalysis.get(node.name);
            if (party) {
                colors[node.name] = party.color;
            } else {
                 // Generate a consistent color if not found
                let hash = 0;
                for (let i = 0; i < node.name.length; i++) {
                    hash = node.name.charCodeAt(i) + ((hash << 5) - hash);
                }
                let color = '#';
                for (let i = 0; i < 3; i++) {
                    const value = (hash >> (i * 8)) & 0xFF;
                    color += ('00' + value.toString(16)).substr(-2);
                }
                colors[node.name] = color;
            }
        });
        return colors;
    }, [sankeyData, partyAnalysis]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const { source, target, value } = payload[0].payload;
            return (
                <div className="bg-dark-card p-3 rounded-md border border-dark-border shadow-lg">
                    <p className="text-dark-text-primary">{`${source.name} → ${target.name}`}</p>
                    <p className="text-brand-primary font-bold">{`${value.toLocaleString('es-CO')} votos`}</p>
                </div>
            );
        }
        return null;
    };
    
    const SankeyNode = ({ x, y, dx, dy, index, payload, width: chartWidth }: any) => {
        const color = nodeColors[payload.name] || '#8884d8';
        const isRightSide = x > chartWidth / 2;
    
        return (
            <Layer key={`CustomNode${index}`}>
                <Rectangle x={x} y={y} width={dx} height={dy} fill={color} />
                 <text
                    x={isRightSide ? x - 6 : x + dx + 6}
                    y={y + dy / 2}
                    textAnchor={isRightSide ? 'end' : 'start'}
                    dy="0.35em"
                    fill="#f5e5d5"
                    fontSize={12}
                    fontWeight="600"
                    style={{
                        paintOrder: 'stroke',
                        stroke: '#2a221b',
                        strokeWidth: '3px',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                    }}
                >
                    {payload.name}
                </text>
                 <text
                    x={isRightSide ? x - 6 : x + dx + 6}
                    y={y + dy / 2 + 15}
                    textAnchor={isRightSide ? 'end' : 'start'}
                    fill="#a18f7c"
                    fontSize={10}
                     style={{
                        paintOrder: 'stroke',
                        stroke: '#2a221b',
                        strokeWidth: '2px',
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'miter',
                    }}
                >
                    {payload.value.toLocaleString('es-CO')}
                </text>
            </Layer>
        );
    };

    return (
        <div className="space-y-6">
            <AnalysisCard title="Análisis de Transferencia de Votos (Sankey)" explanation="Visualiza el flujo estimado de votantes entre dos elecciones. La IA estima cómo los votantes de los partidos en la elección de 'Origen' se distribuyeron entre los partidos de la elección de 'Destino'." collapsible={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Elección de Origen</label>
                        <select value={sourceDatasetId} onChange={e => setSourceDatasetId(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                            <option value="">Seleccionar...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-dark-text-secondary mb-1">Elección de Destino</label>
                         <select value={targetDatasetId} onChange={e => setTargetDatasetId(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                            <option value="">Seleccionar...</option>
                            {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleAnalysis}
                        disabled={isLoading || !sourceDatasetId || !targetDatasetId}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                        {isLoading ? 'Analizando...' : 'Analizar Transferencia'}
                    </button>
                </div>
                 {error && (
                     <div className="m-4 flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                        <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                        <p>{error}</p>
                    </div>
                )}
            </AnalysisCard>

            {isLoading && (
                 <div className="text-center py-10 bg-dark-card rounded-lg">
                    <LoadingSpinner className="w-10 h-10 mx-auto text-brand-secondary" />
                    <p className="mt-4 font-semibold">La IA está estimando la transferencia de votos...</p>
                    <p className="text-sm text-dark-text-secondary">Este proceso puede tardar unos momentos.</p>
                </div>
            )}
            
            {sankeyData && (
                <AnalysisCard title="Diagrama de Sankey de Transferencia de Votos" explanation="El grosor de cada flujo es proporcional a la cantidad de votos transferidos.">
                    <div className="w-full h-[700px] bg-dark-card/50 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey
                                data={sankeyData}
                                node={<SankeyNode />}
                                nodePadding={50}
                                margin={{
                                    left: 150,
                                    right: 150,
                                    top: 20,
                                    bottom: 20,
                                }}
                                link={{ stroke: '#4f4235', strokeOpacity: 0.6 }}
                            >
                                <Tooltip content={<CustomTooltip />} />
                            </Sankey>
                        </ResponsiveContainer>
                    </div>
                </AnalysisCard>
            )}
        </div>
    );
};

export default SankeyDiagram;