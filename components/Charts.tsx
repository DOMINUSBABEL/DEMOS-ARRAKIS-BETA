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
        <div className="bg-[#1c1611]/90 border border-[#4f4235] p-3 rounded-lg shadow-xl backdrop-blur-sm">
          <p className="text-gray-400 text-xs font-mono mb-1 uppercase tracking-wider">{label}</p>
          <p className="text-brand-primary text-lg font-bold font-mono">
            {payload[0].value.toLocaleString('es-CO')}
          </p>
          <p className="text-[10px] text-gray-500">Poder Electoral Base</p>
        </div>
      );
    }
    return null;
};

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-dark-text-secondary py-8 font-mono text-sm">No hay datos para mostrar.</div>;
  }
  const yAxisWidth = Math.max(...data.map(d => d.label.length)) > 20 ? 150 : 100;

  // Calculate a dynamic height to prevent the chart from stretching excessively.
  const calculatedHeight = Math.max(300, data.length * 45 + 60);

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
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="barGradientDark" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4b5563" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#9ca3af" stopOpacity={1}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(161, 143, 124, 0.1)" horizontal={false} />
                <XAxis 
                    type="number" 
                    stroke="#6b5a4e" 
                    tick={{ fontSize: 11, fill: '#a18f7c', fontFamily: 'Inter' }} 
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#6b5a4e"
                    tick={{ fontSize: 11, fill: '#f5e5d5', fontWeight: 500, fontFamily: 'Inter' }}
                    width={yAxisWidth}
                    tickFormatter={(value) => value.length > 25 ? `${value.substring(0, 23)}...` : value}
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                <Bar dataKey="value" name="Poder Electoral Base" barSize={12} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color ? entry.color : "url(#barGradient)"} 
                            stroke={entry.color}
                            strokeOpacity={0.2}
                        />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    </div>
  );
};