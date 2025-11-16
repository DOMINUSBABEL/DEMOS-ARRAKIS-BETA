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

        let diagnostic = { text: 'Momentum Estable', color: 'text-dark-text-secondary' };
        if (lastRsi > 70) {
            diagnostic = { text: 'Sobre-expansión', color: 'text-red-400' };
        } else if (lastRsi < 30) {
            diagnostic = { text: 'Potencial de Recuperación', color: 'text-green-400' };
        }
        return (
            <div className="text-center mt-3">
                <p className="text-sm text-dark-text-secondary">Diagnóstico de Momentum (RSI)</p>
                <p className={`text-lg font-bold ${diagnostic.color}`}>{lastRsi.toFixed(1)}</p>
                <p className={`text-sm font-semibold ${diagnostic.color}`}>{diagnostic.text}</p>
            </div>
        );
    };

    const ToggleSwitch: React.FC<{ label: string; isChecked: boolean; onChange: () => void; color: string; }> = ({ label, isChecked, onChange, color }) => (
        <label className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
                <div className={`block w-10 h-6 rounded-full`} style={{backgroundColor: isChecked ? color : '#4f4235'}}></div>
                <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
            </div>
            <div className="ml-3 text-dark-text-primary text-sm font-medium" style={{color}}>
                {label}
            </div>
            <style>{`.dot { transform: ${isChecked ? 'translateX(100%)' : 'translateX(0)'}; }`}</style>
        </label>
    );

    return (
        <div className="space-y-4">
            <select
                value={selectedParty}
                onChange={(e) => setSelectedParty(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border text-dark-text-primary rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
            >
                {partyNames.map(name => <option key={name} value={name}>{name || 'Seleccionar Partido...'}</option>)}
            </select>
            
            <div style={{ width: '100%', height: 250 }}>
                {selectedParty && chartData.length > 0 ? (
                    <ResponsiveContainer>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#4f4235" />
                            <XAxis dataKey="name" stroke="#f5e5d5" tick={{ fontSize: 10, fill: '#f5e5d5' }} />
                            <YAxis yAxisId="left" stroke="#f5e5d5" tick={{ fontSize: 10, fill: '#f5e5d5' }} domain={['dataMin - 1000', 'dataMax + 1000']} tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString('es-CO') : value} />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 100]} tick={{ fontSize: 10, fill: '#82ca9d' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#2a221b', border: '1px solid #4f4235', color: '#f5e5d5' }}
                                itemStyle={{ color: '#f5e5d5' }}
                                formatter={(value: number, name: string) => [value.toLocaleString('es-CO'), name]}
                            />
                            <Legend wrapperStyle={{color: '#f5e5d5'}} />
                            {visibleLines.votes && <Line yAxisId="left" type="monotone" dataKey="votes" name="Votos" stroke={partyColor} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />}
                            {visibleLines.ema && <Line yAxisId="left" type="monotone" dataKey="ema" name="Tendencia (EMA)" stroke="#ffc658" strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                            {visibleLines.rsi && <Line yAxisId="right" type="monotone" dataKey="rsi" name="RSI" stroke="#82ca9d" strokeWidth={2} dot={false}/>}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-dark-text-secondary">
                        {selectedParty ? 'No hay suficientes datos históricos para este partido.' : 'Selecciona un partido para ver su tendencia.'}
                    </div>
                )}
            </div>
             {chartData.length > 1 && (
                <div className="flex justify-center items-center gap-6 p-2 bg-dark-bg/50 rounded-lg">
                    <ToggleSwitch label="Votos" isChecked={visibleLines.votes} onChange={() => handleLineToggle('votes')} color={partyColor}/>
                    <ToggleSwitch label="EMA" isChecked={visibleLines.ema} onChange={() => handleLineToggle('ema')} color="#ffc658"/>
                    <ToggleSwitch label="RSI" isChecked={visibleLines.rsi} onChange={() => handleLineToggle('rsi')} color="#82ca9d"/>
                </div>
            )}
            {chartData.length > 1 && visibleLines.rsi && <RsiDiagnostic />}
        </div>
    );
};

export default TrendsAnalysis;