
import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from './Icons';

export interface ManualRow {
  id: number;
  candidato: string;
  unidadPolitica: string;
  votos: number;
}

interface ManualEntryFormProps {
  onSubmit: (rows: ManualRow[]) => void;
  disabled: boolean;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit, disabled }) => {
  const [rows, setRows] = useState<ManualRow[]>([
    { id: 1, candidato: '', unidadPolitica: '', votos: 0 }
  ]);
  const [nextId, setNextId] = useState(2);

  const handleInputChange = (id: number, field: keyof Omit<ManualRow, 'id'>, value: string | number) => {
    let finalValue = value;
    if (field === 'votos' && typeof value === 'number') {
        finalValue = Math.min(value, 3000000);
    }
    setRows(rows.map(row => 
      row.id === id ? { ...row, [field]: finalValue } : row
    ));
  };

  const addRow = () => {
    setRows([...rows, { id: nextId, candidato: '', unidadPolitica: '', votos: 0 }]);
    setNextId(nextId + 1);
  };

  const removeRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty rows before submitting
    const validRows = rows.filter(r => r.candidato.trim() && r.unidadPolitica.trim() && r.votos > 0);
    if (validRows.length > 0) {
        onSubmit(validRows);
    } else {
        alert("Por favor, ingresa al menos una fila de datos válida.");
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-4">Ingreso Manual de Datos</h3>
      <p className="text-sm text-gray-400 mb-4">
          Añade candidatos y sus votos para crear un conjunto de datos personalizado para el análisis.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-700/50 rounded-md">
                <div className="col-span-12 md:col-span-4">
                    <label className="text-xs text-gray-400">Candidato</label>
                    <input
                        type="text"
                        placeholder="Nombre del Candidato"
                        value={row.candidato}
                        onChange={(e) => handleInputChange(row.id, 'candidato', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                        disabled={disabled}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                     <label className="text-xs text-gray-400">Unidad Política</label>
                    <input
                        type="text"
                        placeholder="Partido Político"
                        value={row.unidadPolitica}
                        onChange={(e) => handleInputChange(row.id, 'unidadPolitica', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                        disabled={disabled}
                    />
                </div>
                <div className="col-span-10 md:col-span-3">
                     <label className="text-xs text-gray-400">Votos</label>
                    <input
                        type="number"
                        placeholder="Votos"
                        value={row.votos}
                        min="0"
                        max="3000000"
                        onChange={(e) => handleInputChange(row.id, 'votos', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 text-sm"
                        disabled={disabled}
                    />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end justify-end h-full">
                    <button type="button" onClick={() => removeRow(row.id)} disabled={disabled || rows.length <= 1} className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50">
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
            ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <button type="button" onClick={addRow} disabled={disabled} className="flex items-center gap-2 text-sm text-brand-secondary font-semibold hover:text-blue-400">
                <PlusIcon className="w-5 h-5"/>
                Añadir Fila
            </button>
            <button
                type="submit"
                disabled={disabled}
                className="bg-brand-secondary text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
                Procesar Datos
            </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEntryForm;
