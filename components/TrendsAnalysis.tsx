import React, { useState, useMemo } from 'react';
import { PartyAnalysisData } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';

interface TrendsAnalysisProps {
    partyAnalysis: Map<string, PartyAnalysisData>;
}

const calculateEMA = (data: { name: string, votes: number }[], period: number): { name: string, ema: number | null }[] => {
    if (data.length === 0) return [];
    const safePeriod = Math.min(period, data.length);
    const alpha = 2 / (safePeriod + 1);
    let emaArray: { name: string, ema: number | null }[] = [];
    
    emaArray.push({ name: data[0].name, ema: data[0].votes });

    for (let i = 1; i < data.length; i++) {
        const ema = data[i].votes * alpha + emaArray[i - 1].ema! * (1 - alpha);
        emaArray.push({ name: data[i].name, ema: Math.round(ema) });
    }
    
    return emaArray;
};

const calculateRSI = (data: { votes: number }[]): (number | null)[] => {
    if (data.length < 2) return data.map(() => null);

    const rsiValues: (number | null)[] = [null]; // No RSI for the first point

    for(let i = 1; i < data.length; i++) {
        const relevantChanges = data.slice(1, i + 1).map((d, j) => d.votes - data[j].votes);
        
        const gains = relevantChanges.filter(c => c > 0);
        const losses = relevantChanges.filter(c => c < 0).map(c => -c);

        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / gains.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

        if (avgLoss === 0) {
            rsiValues.push(100);
            continue;
        }
        
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        rsiValues.push(rsi);
    }
    return rsiValues;
};


const TrendsAnalysis: React.FC<TrendsAnalysisProps> = ({ partyAnalysis }) => {
    const [selectedParty, setSelectedParty] = useState<string>('');
    const [visibleLines, setVisibleLines] = useState({
        votes: true,
        ema: true,
        rsi: true,
    });
    
    const partyNames = useMemo(() => ['', ...Array.from(partyAnalysis.keys()).sort()], [partyAnalysis]);

    const chartData = useMemo(() => {
        if (!selectedParty) return [];
        const partyData = partyAnalysis.get(selectedParty);
        if (!partyData) return [];

        const historyData = partyData.history.map(h => ({ name: h.datasetName, votes: h.votes }));
        
        historyData.sort((a, b) => {
            const yearA = a.name.match(/\d{4}/);
            const yearB = b.name.match(/\d{4}/);
            if (yearA && yearB) {
                return parseInt(yearA[0]) - parseInt(yearB[0]);
            }
            return a.name.localeCompare(b.name);
        });

        if (historyData.length < 2) {
             return historyData.map(d => ({...d, ema: d.votes, rsi: null}));
        }

        const emaData = calculateEMA(historyData, 3);
        const rsiData = calculateRSI(historyData);

        return historyData.map((d, i) => ({
            ...d,
            ema: emaData[i]?.ema ?? null,
            rsi: rsiData[i] ?? null,
        }));

    }, [selectedParty, partyAnalysis]);
    
    const partyColor = useMemo(() => {
        return partyAnalysis.get(selectedParty)?.color || '#8884d8';
    }, [selectedParty, partyAnalysis]);

    const handleLineToggle = (line: keyof typeof visibleLines) => {
        setVisibleLines(prev => ({ ...prev, [line]: !prev[line] }));
    };

    const RsiDiagnostic: React.FC = () => {
        if (!chartData || chartData.length < 2) return null;
        const lastRsi = chartData[chartData.length - 1]?.rsi;
        if (lastRsi === null || lastRsi === undefined) return null;

        let diagnostic = { text: 'Momentum Estable', color: 'text-gray-400' };
        if (lastRsi > 70) {
            diagnostic = { text: 'Sobre-expansión (Riesgo)', color: 'text-red-400' };
        } else if (lastRsi < 30) {
            diagnostic = { text: 'Potencial de Recuperación', color: 'text-green-400' };
        }
        return (
            <div className="text-center mt-3 p-3 bg-white/5 rounded-lg border border-white/5 backdrop-blur-sm">
                <p className="text-xs text-dark-text-secondary uppercase tracking-wider mb-1">Diagnóstico RSI</p>
                <p className={`text-2xl font-bold font-mono ${diagnostic.color}`}>{lastRsi.toFixed(1)}</p>
                <p className={`text-xs font-semibold ${diagnostic.color}`}>{diagnostic.text}</p>
            </div>
        );
    };

    const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onChange: () => void; color: string; }> = ({ label, isChecked, onChange, color }) => (
        <label className="flex items-center cursor-pointer group">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
                <div className={`block w-8 h-4 rounded-full transition-colors duration-200 ${isChecked ? 'opacity-100' : 'opacity-30'}`} style={{backgroundColor: color}}></div>
                <div className={`dot absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${isChecked ? 'translate-x-4' : 'translate-x-0'}`}></div>
            </div>
            <div className="ml-3 text-gray-300 text-xs font-medium group-hover:text-white transition-colors">
                {label}
            </div>
        </label>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#1c1611]/90 border border-[#4f4235] p-3 rounded-lg shadow-xl backdrop-blur-sm">
                    <p className="text-gray-400 text-xs font-mono mb-2 border-b border-white/10 pb-1">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center gap-2 text-xs mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-gray-300">{entry.name}:</span>
                            <span className="font-mono font-bold text-white">
                                {typeof entry.value === 'number' ? entry.value.toLocaleString('es-CO') : entry.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="relative">
                <select
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border text-white rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-transparent appearance-none"
                >
                    {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar Partido...'}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            <div style={{ width: '100%', height: 300 }}>
                {selectedParty && chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#a18f7c' }} />
                            <YAxis yAxisId="left" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#a18f7c' }} domain={['auto', 'auto']} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} tick={{ fontSize: 10, fill: '#82ca9d' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{paddingTop: '10px'}} iconType="circle"/>
                            
                            {visibleLines.votes && (
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="votes" 
                                    name="Votos Reales" 
                                    stroke={partyColor} 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: '#1c1611', strokeWidth: 2 }} 
                                    activeDot={{ r: 6, fill: partyColor, stroke: '#fff' }} 
                                />
                            )}
                            {visibleLines.ema && (
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="ema" 
                                    name="Tendencia (EMA)" 
                                    stroke="#f59e0b" 
                                    strokeWidth={2} 
                                    strokeDasharray="4 4" 
                                    dot={false} 
                                />
                            )}
                            {visibleLines.rsi && (
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="rsi" 
                                    name="RSI" 
                                    stroke="#10b981" 
                                    strokeWidth={2} 
                                    dot={false} 
                                    strokeOpacity={0.7}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-dark-text-secondary bg-white/5 rounded-xl border border-dashed border-white/10">
                        <p className="text-sm">{selectedParty ? 'No hay suficientes datos históricos para graficar.' : 'Selecciona un partido para analizar su trayectoria.'}</p>
                    </div>
                )}
            </div>
             {chartData.length > 1 && (
                <div className="flex justify-center items-center gap-6 p-3 bg-black/20 rounded-full border border-white/5 w-fit mx-auto">
                    <ToggleSwitch label="Votos" isChecked={visibleLines.votes} onChange={() => handleLineToggle('votes')} color={partyColor}/>
                    <ToggleSwitch label="EMA" isChecked={visibleLines.ema} onChange={() => handleLineToggle('ema')} color="#f59e0b"/>
                    <ToggleSwitch label="RSI" isChecked={visibleLines.rsi} onChange={() => handleLineToggle('rsi')} color="#10b981"/>
                </div>
            )}
            {chartData.length > 1 && visibleLines.rsi && <RsiDiagnostic />}
        </div>
    );
};

export default TrendsAnalysis;