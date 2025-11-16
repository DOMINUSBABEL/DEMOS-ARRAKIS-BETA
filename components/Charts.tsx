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

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="text-center text-dark-text-secondary py-8">No hay datos para mostrar.</div>;
  }
  const yAxisWidth = Math.max(...data.map(d => d.label.length)) > 20 ? 150 : 100;

  // Calculate a dynamic height to prevent the chart from stretching excessively.
  // 40px per bar + 60px for top/bottom padding and axes. A minimum height is also set.
  const calculatedHeight = Math.max(200, data.length * 40 + 60);

  return (
    <div style={{ width: '100%', height: `${calculatedHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
                data={data}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(161, 143, 124, 0.3)" />
                <XAxis type="number" stroke="#f5e5d5" tick={{ fontSize: 12, fill: '#f5e5d5' }} />
                <YAxis
                    type="category"
                    dataKey="label"
                    stroke="#f5e5d5"
                    tick={{ fontSize: 12, fill: '#f5e5d5' }}
                    width={yAxisWidth}
                    tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 18)}...` : value}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(217, 119, 6, 0.1)' }}
                    contentStyle={{
                        backgroundColor: '#1c1611',
                        borderColor: '#4f4235',
                        borderRadius: '0.5rem',
                    }}
                    labelStyle={{ color: '#f5e5d5' }}
                    itemStyle={{ color: '#f5e5d5' }}
                    formatter={(value: number) => [value.toLocaleString('es-CO'), 'Poder Electoral Base']}
                />
                <Bar dataKey="value" name="Poder Electoral Base" barSize={20} radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#d97706'} />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    </div>
  );
};