
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ElectoralDataset, VoteTransferModel, PartyData, VoteTransferModelResult, PartyAnalysisData, HistoricalDataset } from '../types';
import { calculateTransferModel, applyTransferModel } from '../services/voteTransferService';
import { buildHistoricalDataset } from '../services/electoralProcessor';
import AnalysisCard from './AnalysisCard';
import DHondtSimulator from './DHondtSimulator';
import { WarningIcon, ShareIcon } from './Icons';

// --- NEW PIE CHART LABEL RENDERER ---
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    // Do not render labels for very small slices to avoid clutter
    if (percent < 0.05) {
        return null;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight="bold"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};


interface HistoricalSimulatorProps {
    datasets: ElectoralDataset[];
    partyAnalysis: Map<string, PartyAnalysisData>;
    onClassifyIdeologies: (partyNames: string[]) => Promise<void>;
}

type SimulationMode = 'existing' | 'hypothetical';

const HistoricalSimulator: React.FC<HistoricalSimulatorProps> = ({ datasets, partyAnalysis, onClassifyIdeologies }) => {
    const [simulationMode, setSimulationMode] = useState<SimulationMode>('existing');
    
    // State for 'existing' mode
    const [baseElectionId, setBaseElectionId] = useState<string>('');
    const [refPreElectionId, setRefPreElectionId] = useState<string>('');
    const [refPostElectionId, setRefPostElectionId] = useState<string>('');
    const [newPartyName, setNewPartyName] = useState<string>('');
    
    // State for 'hypothetical' mode
    const [hypotheticalPartyName, setHypotheticalPartyName] = useState('');
    const [hypotheticalPartyVotes, setHypotheticalPartyVotes] = useState(100000);
    const [manualTransferModel, setManualTransferModel] = useState<Record<string, number>>({});

    const [error, setError] = useState<string | null>(null);
    const [simulationResult, setSimulationResult] = useState<{
      model: VoteTransferModel;
      simulatedPartyData: PartyData[];
    } | null>(null);
    
    const selectedBaseElection = useMemo(() => {
        const ds = datasets.find(d => d.id === baseElectionId);
        return ds ? buildHistoricalDataset(ds) : null;
    }, [datasets, baseElectionId]);

    const preElection = useMemo(() => {
        const ds = datasets.find(d => d.id === refPreElectionId);
        return ds ? buildHistoricalDataset(ds) : null;
    }, [datasets, refPreElectionId]);

    const postElection = useMemo(() => {
        const ds = datasets.find(d => d.id === refPostElectionId);
        return ds ? buildHistoricalDataset(ds) : null;
    }, [datasets, refPostElectionId]);

    const potentialNewParties = useMemo(() => {
        if (!preElection || !postElection) return [];
        const prePartyNames = new Set(preElection.partyData.map(p => p.name));
        return postElection.partyData
            .filter(p => !prePartyNames.has(p.name))
            .map(p => p.name);
    }, [preElection, postElection]);
    
    const totalManualPercentage = useMemo(() => {
        return Object.values(manualTransferModel).reduce((sum: number, val: number) => sum + (val || 0), 0);
    }, [manualTransferModel]);

    useEffect(() => {
        setNewPartyName('');
    }, [refPreElectionId, refPostElectionId]);
    
     useEffect(() => {
        if (selectedBaseElection) {
            const initialModel = selectedBaseElection.partyData.reduce((acc: Record<string, number>, party: PartyData): Record<string, number> => {
                acc[party.name] = 0;
                return acc;
            }, {});
            setManualTransferModel(initialModel);
        }
    }, [selectedBaseElection]);


    const handleSimulation = async () => {
        setError(null);
        setSimulationResult(null);

        if (!selectedBaseElection) {
            setError("Por favor, selecciona una 'Elección Histórica Base'.");
            return;
        }

        try {
            let modelResult: VoteTransferModelResult;
            let finalNewPartyName: string;

            if (simulationMode === 'existing') {
                if (!preElection || !postElection || !newPartyName) {
                    throw new Error("Para simular un partido existente, selecciona todas las elecciones de referencia y el partido a analizar.");
                }
                const allInvolvedParties = [...preElection.partyData.map(p => p.name), ...postElection.partyData.map(p => p.name)];
                await onClassifyIdeologies(allInvolvedParties);
                
                const ideologies: Record<string, string> = {};
                partyAnalysis.forEach((data, name) => { if (data.ideology) { ideologies[name] = data.ideology; } });

                modelResult = calculateTransferModel(preElection.processedData, postElection.processedData, newPartyName, ideologies);
                finalNewPartyName = newPartyName;
            
            } else { // 'hypothetical' mode
                if (!hypotheticalPartyName.trim() || hypotheticalPartyVotes <= 0) {
                     throw new Error("Ingresa un nombre y una meta de votos válida para el partido hipotético.");
                }
                if (Math.abs(totalManualPercentage - 100) > 0.1) {
                    throw new Error(`El modelo de transferencia manual debe sumar 100%. Actualmente suma ${totalManualPercentage.toFixed(1)}%.`);
                }

                const finalModel: VoteTransferModel = {};
                Object.entries(manualTransferModel).forEach(([party, percentage]: [string, number]) => {
                    if (percentage > 0) {
                        finalModel[party] = percentage / 100;
                    }
                });
                modelResult = { model: finalModel };
                finalNewPartyName = hypotheticalPartyName.trim().toUpperCase();
            }
            
            const simulatedData = applyTransferModel(selectedBaseElection.processedData, modelResult.model, finalNewPartyName);
            
            setSimulationResult({
                model: modelResult.model,
                simulatedPartyData: simulatedData
            });

        } catch (e: any) {
            setError(e.message);
        }
    };
    
    const handleManualModelChange = (partyName: string, value: string) => {
        const percentage = parseInt(value, 10);
        setManualTransferModel(prev => ({
            ...prev,
            [partyName]: isNaN(percentage) ? 0 : Math.max(0, Math.min(100, percentage))
        }));
    };

    const pieChartData = useMemo(() => {
        if (!simulationResult || Object.keys(simulationResult.model).length === 0) return null;
        
        const { model } = simulationResult;
        
        return Object.entries(model)
            .map(([partyName, percentage]: [string, number]) => ({
                name: partyName,
                value: Number((percentage * 100).toFixed(2)),
                color: partyAnalysis.get(partyName)?.color || '#cccccc'
            }))
            .sort((a, b) => b.value - a.value);
    }, [simulationResult, partyAnalysis]);

    const simplifiedPieChartData = useMemo(() => {
        if (!pieChartData) return null;
        const SIMPLIFICATION_THRESHOLD = 5;
        if (pieChartData.length <= SIMPLIFICATION_THRESHOLD) { 
            return pieChartData;
        }

        const topDonors = pieChartData.slice(0, SIMPLIFICATION_THRESHOLD);
        const otherDonors = pieChartData.slice(SIMPLIFICATION_THRESHOLD);
        
        const othersValue = otherDonors.reduce((sum: number, donor: { value: number }) => sum + donor.value, 0);

        if (othersValue > 0.1) { // Only add "Otros" if it's a meaningful slice
            return [
                ...topDonors,
                { name: 'Otros', value: Number(othersValue.toFixed(2)), color: '#6b7280' }
            ];
        }
        
        return topDonors;
    }, [pieChartData]);
    
    const renderPieChart = (data: NonNullable<typeof pieChartData>) => (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius="80%"
                    dataKey="value"
                    nameKey="name"
                >
                    {data.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} stroke={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Aporte']}
                    contentStyle={{
                        backgroundColor: '#111827',
                        borderColor: '#1f2937',
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{
                        color: '#f3f4f6',
                        fontSize: '12px',
                        paddingTop: '20px',
                    }}
                />
            </PieChart>
        </ResponsiveContainer>
    );

    return (
        <div className="space-y-6">
            <AnalysisCard title="Configuración de la Simulación Histórica" explanation="Simula la irrupción de un nuevo partido en una elección pasada. Usa el modo 'Existente' para analizar un partido que ya compitió, o el modo 'Hipotético' para proyectar un partido nuevo." collapsible>
                <div className="p-4">
                    <div className="bg-dark-bg p-1 rounded-lg flex space-x-1 justify-center mb-4">
                        <button onClick={() => setSimulationMode('existing')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'existing' ? 'bg-brand-primary text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                            Simular Partido Existente
                        </button>
                        <button onClick={() => setSimulationMode('hypothetical')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${simulationMode === 'hypothetical' ? 'bg-brand-primary text-white' : 'text-dark-text-secondary hover:bg-dark-border'}`}>
                            Simular Partido Hipotético
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-text-secondary mb-1">1. Elección Histórica Base</label>
                            <select value={baseElectionId} onChange={e => setBaseElectionId(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                                <option value="">Seleccionar...</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        {simulationMode === 'existing' ? (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">2. Ref. (Antes del Partido)</label>
                                    <select value={refPreElectionId} onChange={e => setRefPreElectionId(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                                        <option value="">Seleccionar...</option>
                                        {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">3. Ref. (Con el Partido)</label>
                                    <select value={refPostElectionId} onChange={e => setRefPostElectionId(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2">
                                        <option value="">Seleccionar...</option>
                                        {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">4. Nuevo Partido</label>
                                    <select value={newPartyName} onChange={e => setNewPartyName(e.target.value)} className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2" disabled={potentialNewParties.length === 0}>
                                        <option value="">Seleccionar...</option>
                                        {potentialNewParties.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </>
                        ) : (
                             <>
                                <div className="lg:col-span-2">
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">2. Nombre del Partido Hipotético</label>
                                    <input type="text" value={hypotheticalPartyName} onChange={e => setHypotheticalPartyName(e.target.value)} placeholder="Ej: Partido del Futuro 2026" className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-dark-text-secondary mb-1">3. Meta de Votos</label>
                                    <input type="number" value={hypotheticalPartyVotes} onChange={e => setHypotheticalPartyVotes(Number(e.target.value))} min="0" className="w-full bg-dark-bg border border-dark-border text-white rounded-md p-2" />
                                </div>
                            </>
                        )}
                    </div>

                    {simulationMode === 'hypothetical' && selectedBaseElection && (
                        <div className="mt-6">
                            <h4 className="font-semibold text-dark-text-primary mb-2">4. Definir Origen de Votos (Modelo de Transferencia Manual)</h4>
                            <div className={`p-3 rounded-md border ${Math.abs(totalManualPercentage - 100) > 0.1 ? 'border-red-500' : 'border-green-500'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 max-h-60 overflow-y-auto">
                                    {selectedBaseElection.partyData.map(party => (
                                        <div key={party.id} className="flex items-center gap-2">
                                            <label htmlFor={`model-${party.id}`} className="text-sm text-dark-text-secondary truncate flex-1" title={party.name}>{party.name}</label>
                                            <input
                                                id={`model-${party.id}`}
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={manualTransferModel[party.name] || 0}
                                                onChange={(e) => handleManualModelChange(party.name, e.target.value)}
                                                className="w-20 bg-dark-bg border border-dark-border rounded-md p-1 text-center"
                                            />
                                            <span className="text-dark-text-secondary">%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className={`mt-3 text-center font-bold text-lg ${Math.abs(totalManualPercentage - 100) > 0.1 ? 'text-red-400' : 'text-green-400'}`}>
                                    Total: {totalManualPercentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-4 pb-4">
                    <button onClick={handleSimulation} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 rounded-lg transition-colors">
                        Calcular Modelo y Ejecutar Simulación
                    </button>
                </div>
            </AnalysisCard>

            {error && (
                 <div className="flex items-center p-4 bg-red-900/50 border border-red-500 text-red-300 rounded-lg shadow-lg">
                    <WarningIcon className="w-6 h-6 mr-3 flex-shrink-0"/>
                    <div>
                        <h3 className="font-bold">Error de Simulación</h3>
                        <p>{error}</p>
                    </div>
                </div>
            )}

            {simulationResult && (
              <div className="space-y-6">
                 <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <AnalysisCard title="Modelo de Transferencia de Votos (Porcentual)" explanation="Este modelo muestra el origen estimado del caudal electoral del nuevo partido, ponderado por afinidad y datos históricos.">
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="min-w-full text-sm text-left text-dark-text-primary">
                                <thead className="text-xs text-dark-text-primary uppercase bg-dark-card sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Partido Donante</th>
                                        <th className="px-4 py-3 text-right">Aporte al Nuevo Partido (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(simulationResult.model).sort(([,a], [,b]) => Number(b) - Number(a)).map(([party, percentage]) => (
                                        <tr key={party} className="border-b border-dark-border">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{backgroundColor: partyAnalysis.get(party)?.color || '#ccc'}}></span>
                                                    {party}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">{(Number(percentage) * 100).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </AnalysisCard>
                     <AnalysisCard 
                        title="Visualización de Origen de Votos (Torta)" 
                        explanation="Este gráfico de torta muestra el origen estimado del caudal electoral del nuevo partido. La vista principal muestra los 5 donantes principales; expande para ver el detalle completo."
                        fullscreenable={!!pieChartData}
                        modalChildren={pieChartData ? (
                            <div className="w-full h-full min-h-[600px]">
                                {renderPieChart(pieChartData)}
                            </div>
                        ) : undefined}
                    >
                        {simplifiedPieChartData ? (
                            <div className="w-full h-[400px]">
                                {renderPieChart(simplifiedPieChartData)}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-[400px] text-gray-500 text-center p-8">
                                <div>
                                    <ShareIcon className="w-12 h-12 mx-auto text-gray-600 mb-2" />
                                    <p className="font-semibold">Visualización de Origen de Votos</p>
                                    <p className="text-sm mt-1">Ejecuta una simulación para ver el desglose de votos que componen el nuevo partido.</p>
                                </div>
                            </div>
                        )}
                    </AnalysisCard>
                </div>
              </div>
            )}

            {selectedBaseElection && simulationResult?.simulatedPartyData && (
                 <AnalysisCard title="Comparación de Escenarios D'Hondt" explanation="Compara lado a lado la asignación de escaños del escenario histórico original con el escenario simulado que incluye al nuevo partido." collapsible fullscreenable={false}>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-6">
                        <DHondtSimulator
                            key={`original-${baseElectionId}`}
                            title="Resultado Histórico Original"
                            initialParties={selectedBaseElection.partyData}
                            partyAnalysis={partyAnalysis}
                            readOnly
                            electionType={selectedBaseElection.processedData[0]?.Eleccion}
                        />
                        <DHondtSimulator
                            key={`simulated-${baseElectionId}`}
                            title="Resultado Simulado con Nuevo Partido"
                            initialParties={simulationResult.simulatedPartyData}
                            partyAnalysis={partyAnalysis}
                            readOnly
                            electionType={selectedBaseElection.processedData[0]?.Eleccion}
                        />
                    </div>
                 </AnalysisCard>
            )}
        </div>
    );
}

export default HistoricalSimulator;
