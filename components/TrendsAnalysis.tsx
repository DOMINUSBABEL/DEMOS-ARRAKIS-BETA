import React, { useState, useMemo } from 'react';
import { PartyAnalysisData } from '../types';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area } from 'recharts';

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

        let diagnostic = { text: 'MOMENTUM ESTABLE', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' };
        if (lastRsi > 70) {
            diagnostic = { text: 'SOBRE-EXPANSIÓN (RIESGO)', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
        } else if (lastRsi < 30) {
            diagnostic = { text: 'POTENCIAL DE RECUPERACIÓN', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
        }
        return (
            <div className={`text-center mt-4 p-4 rounded-xl border backdrop-blur-md ${diagnostic.bg}`}>
                <p className="text-[10px] text-dark-text-secondary uppercase tracking-[0.2em] mb-2 font-mono">Diagnóstico RSI</p>
                <div className="flex items-baseline justify-center gap-2">
                    <p className={`text-3xl font-bold font-mono ${diagnostic.color}`}>{lastRsi.toFixed(1)}</p>
                </div>
                <p className={`text-xs font-bold mt-1 ${diagnostic.color}`}>{diagnostic.text}</p>
            </div>
        );
    };

    const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onChange: () => void; color: string; }> = ({ label, isChecked, onChange, color }) => (
        <label className="flex items-center cursor-pointer group">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
                <div className={`block w-10 h-5 rounded-full transition-all duration-300 ${isChecked ? 'opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'opacity-20'}`} style={{backgroundColor: isChecked ? color : '#333'}}></div>
                <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform duration-300 ${isChecked ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
            <div className="ml-3 text-gray-400 text-[10px] font-bold tracking-wider group-hover:text-white transition-colors uppercase font-mono">
                {label}
            </div>
        </label>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0f0a06]/90 border border-white/10 p-4 rounded shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                    <p className="text-gray-400 text-[10px] font-mono uppercase tracking-widest mb-3 pb-2 border-b border-white/10">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs mb-2 last:mb-0">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
                                <span className="text-gray-300 font-medium">{entry.name}:</span>
                            </div>
                            <span className="font-mono font-bold text-white text-sm">
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
            <div className="relative z-20">
                <select
                    value={selectedParty}
                    onChange={(e) => setSelectedParty(e.target.value)}
                    className="w-full bg-[#1a1410]/80 border border-brand-primary/30 text-white rounded p-3 focus:ring-1 focus:ring-brand-primary focus:border-brand-primary appearance-none backdrop-blur-sm transition-shadow hover:shadow-[0_0_15px_rgba(217,119,6,0.1)] text-sm"
                >
                    {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar Partido...'}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-primary">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            <div style={{ width: '100%', height: 320 }} className="relative">
                {selectedParty && chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                            <defs>
                                <filter id="glow-line" height="300%" width="300%" x="-100%" y="-100%">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                                <linearGradient id="voteArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={partyColor} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={partyColor} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
                            <XAxis dataKey="name" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#6b5a4e', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="left" stroke="#6b5a4e" tick={{ fontSize: 10, fill: '#6b5a4e', fontFamily: 'JetBrains Mono' }} domain={['auto', 'auto']} tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value} axisLine={false} tickLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#10b981" domain={[0, 100]} tick={{ fontSize: 10, fill: '#10b981', fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} hide={!visibleLines.rsi}/>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{paddingTop: '20px'}} iconType="circle" formatter={(value) => <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold ml-1">{value}</span>}/>
                            
                            {visibleLines.votes && (
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="votes" 
                                    name="Votos Reales" 
                                    stroke={partyColor} 
                                    strokeWidth={2} 
                                    dot={{ r: 3, fill: '#0f0a06', stroke: partyColor, strokeWidth: 2 }} 
                                    activeDot={{ r: 6, fill: partyColor, stroke: '#fff', strokeWidth: 2 }}
                                    animationDuration={1500}
                                    filter="url(#glow-line)"
                                />
                            )}
                            {visibleLines.ema && (
                                <Line 
                                    yAxisId="left" 
                                    type="monotone" 
                                    dataKey="ema" 
                                    name="Tendencia (EMA)" 
                                    stroke="#fbbf24" 
                                    strokeWidth={2} 
                                    strokeDasharray="3 3" 
                                    dot={false} 
                                    animationDuration={1500}
                                />
                            )}
                            {visibleLines.rsi && (
                                <Line 
                                    yAxisId="right" 
                                    type="monotone" 
                                    dataKey="rsi" 
                                    name="RSI (Momentum)" 
                                    stroke="#10b981" 
                                    strokeWidth={1} 
                                    dot={false} 
                                    strokeOpacity={0.5}
                                    animationDuration={1500}
                                />
                            )}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-dark-text-muted bg-white/5 rounded border border-dashed border-white/10 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-mono">{selectedParty ? 'Datos Insuficientes' : 'Esperando Selección'}</p>
                    </div>
                )}
            </div>
             {chartData.length > 1 && (
                <div className="flex justify-center items-center gap-8 p-3 bg-black/40 rounded-full border border-white/5 w-fit mx-auto backdrop-blur-md shadow-lg">
                    <ToggleSwitch label="Votos" isChecked={visibleLines.votes} onChange={() => handleLineToggle('votes')} color={partyColor}/>
                    <ToggleSwitch label="EMA Trend" isChecked={visibleLines.ema} onChange={() => handleLineToggle('ema')} color="#fbbf24"/>
                    <ToggleSwitch label="RSI Index" isChecked={visibleLines.rsi} onChange={() => handleLineToggle('rsi')} color="#10b981"/>
                </div>
            )}
            {chartData.length > 1 && visibleLines.rsi && <RsiDiagnostic />}
        </div>
    );
};

export default TrendsAnalysis;