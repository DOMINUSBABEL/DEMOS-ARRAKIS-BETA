import React from 'react';
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip } from 'recharts';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: ChartData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f0a06]/90 border border-brand-primary/50 p-3 rounded shadow-[0_0_20px_rgba(217,119,6,0.2)] backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-brand-primary/20">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shadow-[0_0_5px_rgba(217,119,6,0.8)]"></div>
             <p className="text-gray-300 text-[10px] font-mono uppercase tracking-wider">{label}</p>
          </div>
          <p className="text-brand-glow text-xl font-bold font-mono tabular-nums">
            {payload[0].value.toLocaleString('es-CO')}
          </p>
          <p className="text-[9px] text-brand-secondary uppercase tracking-widest mt-1">Poder Electoral Base</p>
        </div>
      );
    }
    return null;
};

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-dark-text-secondary py-12 font-mono text-xs border border-dashed border-white/10 rounded-lg bg-white/5">No data available.</div>;
  }
  const yAxisWidth = Math.max(...data.map(d => d.label.length)) > 20 ? 150 : 100;

  // Calculate a dynamic height
  const calculatedHeight = Math.max(350, data.length * 50 + 60);

  return (
    <div style={{ width: '100%', height: `${calculatedHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={data}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#b45309" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={1}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255, 255, 255, 0.03)" horizontal={true} vertical={true} />
                <XAxis 
                    type="number" 
                    stroke="#4f4235" 
                    tick={{ fontSize: 10, fill: '#6b5a4e', fontFamily: 'JetBrains Mono' }} 
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#4f4235"
                    tick={{ fontSize: 11, fill: '#a18f7c', fontWeight: 500, fontFamily: 'Inter' }}
                    width={yAxisWidth}
                    tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 23)}...` : value}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
                <Bar dataKey="value" name="Poder Electoral Base" barSize={12} radius={[0, 6, 6, 0]} animationDuration={1500}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color ? entry.color : "url(#barGradient)"} 
                            stroke={entry.color ? 'transparent' : '#fbbf24'}
                            strokeWidth={entry.color ? 0 : 1}
                            className="hover:opacity-80 transition-opacity"
                        />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    </div>
  );
};