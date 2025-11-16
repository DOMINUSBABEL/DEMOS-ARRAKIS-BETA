import React from 'react';

interface DataTableProps {
  title: string;
  headers: string[];
  data: (string | number)[][];
  highlightFirstN?: number;
  colorMap?: Map<string, string>;
  colorColumnKey?: string;
}

const DataTable: React.FC<DataTableProps> = ({ title, headers, data, highlightFirstN = 0, colorMap, colorColumnKey }) => {
  const colorColumnIndex = colorColumnKey ? headers.indexOf(colorColumnKey) : -1;

  return (
    <div className="bg-light-card dark:bg-gray-800/50 p-6 rounded-xl shadow-lg border border-light-border dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-light-text-primary dark:text-white mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-light-text-secondary dark:text-gray-300">
          <thead className="text-xs text-light-text-primary dark:text-gray-100 uppercase bg-gray-200/50 dark:bg-gray-700/50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="px-4 py-3 font-semibold tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border dark:divide-gray-700/50">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={`hover:bg-gray-200/50 dark:hover:bg-gray-700/50 transition-colors ${rowIndex < highlightFirstN ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`px-4 py-3 whitespace-nowrap ${cellIndex === 0 ? 'font-medium text-light-text-primary dark:text-white' : ''}`}>
                    {colorMap && colorColumnIndex === cellIndex ? (
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colorMap.get(cell as string) || '#ccc' }}></span>
                        <span>{typeof cell === 'number' ? cell.toLocaleString('es-CO') : cell}</span>
                      </div>
                    ) : (
                      typeof cell === 'number' ? cell.toLocaleString('es-CO') : cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
                <tr>
                    <td colSpan={headers.length} className="text-center py-8 text-gray-500">No hay datos para mostrar.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;