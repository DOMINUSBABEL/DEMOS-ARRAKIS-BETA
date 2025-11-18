import React, { useState } from 'react';
import FileUpload from './FileUpload';
import ManualEntryForm, { ManualRow } from './ManualEntryForm';
import { ElectoralDataset } from '../types';
import { LoadingSpinner, ChartBarIcon, EditIcon, TrashIcon, MergeIcon } from './Icons';
import AnalysisCard from './AnalysisCard';

interface DataManagerProps {
    datasets: ElectoralDataset[];
    onFileUpload: (files: File[], datasetName: string) => Promise<void>;
    onManualSubmit: (rows: ManualRow[], datasetName: string) => Promise<void>;
    onDeleteDataset: (datasetId: string) => void;
    onEditDatasetName: (datasetId: string, newName: string) => void;
    onMergeDatasets: (idsToMerge: string[], newName: string) => Promise<void>;
    isLoading: boolean;
    loadingMessage: string;
}

type EntryMode = 'upload' | 'manual';

const DataManager: React.FC<DataManagerProps> = ({ 
    datasets, 
    onFileUpload, 
    onManualSubmit,
    onDeleteDataset,
    onEditDatasetName,
    onMergeDatasets, 
    isLoading, 
    loadingMessage 
}) => {
    const [entryMode, setEntryMode] = useState<EntryMode>('upload');
    const [datasetName, setDatasetName] = useState('');
    const [selectedToMerge, setSelectedToMerge] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleFileUpload = (files: File[]) => {
        if (!datasetName.trim()) {
            alert("Por favor, asigna un nombre al conjunto de datos antes de cargarlo.");
            return;
        }
        onFileUpload(files, datasetName);
        setDatasetName('');
    };

    const handleManualSubmit = (rows: ManualRow[]) => {
        if (!datasetName.trim()) {
            alert("Por favor, asigna un nombre al conjunto de datos antes de procesarlo.");
            return;
        }
        onManualSubmit(rows, datasetName);
        setDatasetName('');
    };

    const handleToggleMerge = (id: string) => {
        setSelectedToMerge(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleMerge = () => {
        const newName = prompt("Ingresa un nombre para el nuevo conjunto de datos fusionado:", "Datos Fusionados");
        if (newName && newName.trim()) {
            onMergeDatasets(Array.from(selectedToMerge), newName.trim());
            setSelectedToMerge(new Set());
        }
    };
    
    const handleStartEditing = (dataset: ElectoralDataset) => {
        setEditingId(dataset.id);
        setEditingName(dataset.name);
    };

    const handleCancelEditing = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEditing = (id: string) => {
        if (editingName.trim()) {
            onEditDatasetName(id, editingName.trim());
        }
        handleCancelEditing();
    };

    const handleDelete = (id: string, name: string) => {
        if(window.confirm(`¿Estás seguro de que quieres eliminar el conjunto de datos "${name}"?`)) {
            onDeleteDataset(id);
        }
    }


    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <AnalysisCard title="Conjuntos de Datos Cargados" explanation="Gestiona los datos electorales que has cargado. Puedes editar sus nombres, eliminarlos o fusionar varios conjuntos en uno solo para análisis combinados.">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleMerge}
                                disabled={selectedToMerge.size < 2}
                                className="flex items-center gap-2 text-sm bg-indigo-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <MergeIcon className="w-4 h-4" />
                                Fusionar ({selectedToMerge.size})
                            </button>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                            {datasets.length === 0 && !isLoading ? (
                                <div className="text-center py-10 border-2 border-dashed border-light-border dark:border-dark-border rounded-lg">
                                    <p className="text-light-text-secondary dark:text-dark-text-secondary">Aún no se han cargado datos.</p>
                                </div>
                            ) : (
                                datasets.map(ds => (
                                    <div key={ds.id} className="bg-light-bg dark:bg-dark-bg p-3 rounded-md flex items-center gap-4 group">
                                        <input
                                            type="checkbox"
                                            checked={selectedToMerge.has(ds.id)}
                                            onChange={() => handleToggleMerge(ds.id)}
                                            className="form-checkbox h-5 w-5 bg-gray-300 dark:bg-dark-border border-gray-400 dark:border-dark-border rounded text-brand-primary focus:ring-brand-primary"
                                        />
                                        <ChartBarIcon className="w-6 h-6 text-brand-primary flex-shrink-0" />
                                        <div className="flex-grow">
                                        {editingId === ds.id ? (
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                onBlur={() => handleSaveEditing(ds.id)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing(ds.id)}
                                                autoFocus
                                                className="w-full bg-gray-100 dark:bg-dark-card border border-brand-primary rounded-md p-1 text-sm"
                                            />
                                        ) : (
                                            <p className="font-semibold text-light-text-primary dark:text-dark-text-primary truncate cursor-pointer" title={ds.name} onClick={() => handleStartEditing(ds)}>
                                                {ds.name}
                                            </p>
                                        )}
                                            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                                                {ds.processedData.length.toLocaleString('es-CO')} registros | {ds.analysisType === 'candidate' ? 'Por Candidato' : 'Por Partido'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleStartEditing(ds)} className="p-1 text-dark-text-secondary hover:text-brand-primary" title="Editar Nombre"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(ds.id, ds.name)} className="p-1 text-dark-text-secondary hover:text-red-500" title="Eliminar Dataset"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </AnalysisCard>
                </div>
                 <div className="lg:col-span-2">
                    <AnalysisCard title="Añadir Nuevos Datos" explanation="Nombra tu conjunto de datos, luego elige si quieres cargar archivos (como PDF, Excel, CSV) o ingresar los datos manualmente.">
                         {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-10 rounded-lg text-center h-full">
                                <LoadingSpinner className="w-12 h-12 text-brand-primary" />
                                <p className="mt-4 text-lg font-semibold">{loadingMessage}</p>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary">Por favor, espera.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="datasetName" className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">1. Nombra el Conjunto de Datos</label>
                                    <input
                                        type="text"
                                        id="datasetName"
                                        value={datasetName}
                                        onChange={(e) => setDatasetName(e.target.value)}
                                        placeholder="Ej: Concejo Medellín 2019"
                                        className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-primary dark:text-dark-text-primary rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
                                    />
                                </div>
                                <div className="flex justify-center">
                                    <div className="bg-light-bg dark:bg-dark-bg p-1 rounded-lg flex space-x-1">
                                        <button onClick={() => setEntryMode('upload')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${entryMode === 'upload' ? 'bg-brand-primary text-white' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border'}`}>
                                            Cargar Archivos
                                        </button>
                                        <button onClick={() => setEntryMode('manual')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${entryMode === 'manual' ? 'bg-brand-primary text-white' : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border'}`}>
                                            Ingreso Manual
                                        </button>
                                    </div>
                                </div>
                                {entryMode === 'upload' ?
                                    <FileUpload onFileSelect={handleFileUpload} disabled={isLoading || !datasetName} /> :
                                    <ManualEntryForm onSubmit={handleManualSubmit} disabled={isLoading || !datasetName} />
                                }
                            </div>
                        )}
                    </AnalysisCard>
                </div>
            </div>
        </>
    );
};

export default DataManager;