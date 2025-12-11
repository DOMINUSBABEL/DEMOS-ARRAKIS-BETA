
import React, { useState, useEffect } from 'react';
import { saveAnalysis, getSavedAnalyses, deleteAnalysis } from '../services/storageService';
import { SavedAnalysis } from '../types';
import { DatabaseIcon, PlusIcon, TrashIcon, ClockIcon } from './Icons';

interface MemorySystemProps {
    type: SavedAnalysis['type'];
    dataToSave: any; // The current state to be saved
    onLoad: (data: any) => void;
    canSave: boolean; // Only allow save if data exists
}

const MemorySystem: React.FC<MemorySystemProps> = ({ type, dataToSave, onLoad, canSave }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'view' | 'save'>('view');
    const [saveName, setSaveName] = useState('');
    const [savedItems, setSavedItems] = useState<SavedAnalysis[]>([]);
    const [user, setUser] = useState<string>('');

    useEffect(() => {
        const storedUser = localStorage.getItem('demos_current_user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData.username);
            } catch(e) { console.error(e); }
        }
    }, []);

    const loadItems = () => {
        if (user) {
            const items = getSavedAnalyses(user, type);
            setSavedItems(items);
        }
    };

    useEffect(() => {
        if (isOpen && user) {
            loadItems();
        }
    }, [isOpen, user, type]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!saveName.trim() || !user) return;
        
        saveAnalysis(user, type, saveName, dataToSave);
        setSaveName('');
        setMode('view');
        loadItems(); // Refresh list
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        if (window.confirm("¿Estás seguro de eliminar este registro?")) {
            deleteAnalysis(user, id);
            loadItems();
        }
    };

    const handleLoad = (item: SavedAnalysis) => {
        if (window.confirm(`¿Cargar configuración "${item.name}"? Los datos actuales no guardados se perderán.`)) {
            onLoad(item.data);
            setIsOpen(false);
        }
    };

    if (!user) return null;

    return (
        <div className="relative z-40 inline-block">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full border transition-all shadow-md ${isOpen ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-500 border-gray-200 hover:text-brand-primary hover:border-brand-primary'}`}
                title="Memoria Caché / Guardar Análisis"
            >
                <DatabaseIcon className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1a1410] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                            <ClockIcon className="w-4 h-4"/> Memoria: {user}
                        </h4>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setMode('view')}
                                className={`p-1.5 rounded ${mode === 'view' ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                title="Ver Guardados"
                            >
                                <DatabaseIcon className="w-4 h-4"/>
                            </button>
                            <button 
                                onClick={() => setMode('save')}
                                disabled={!canSave}
                                className={`p-1.5 rounded ${mode === 'save' ? 'bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-white' : 'text-gray-400 hover:text-gray-600'} ${!canSave ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title="Guardar Actual"
                            >
                                <PlusIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>

                    <div className="p-4 max-h-[300px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#1a1410]">
                        {mode === 'save' ? (
                            <form onSubmit={handleSave} className="space-y-3">
                                <div>
                                    <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1">Nombre del Registro</label>
                                    <input 
                                        type="text" 
                                        autoFocus
                                        value={saveName}
                                        onChange={(e) => setSaveName(e.target.value)}
                                        placeholder="Ej: Escenario Optimista 1"
                                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded p-2 text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-brand-primary outline-none"
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!saveName.trim()}
                                    className="w-full bg-brand-primary text-white text-xs font-bold py-2 rounded hover:bg-brand-secondary transition-colors disabled:opacity-50"
                                >
                                    Confirmar Guardado
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-2">
                                {savedItems.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs italic">
                                        No hay registros guardados para este módulo.
                                    </div>
                                ) : (
                                    savedItems.map(item => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => handleLoad(item)}
                                            className="group flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 hover:border-brand-primary/50 hover:shadow-sm cursor-pointer transition-all"
                                        >
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{item.name}</p>
                                                <p className="text-[9px] text-gray-400">{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDelete(item.id, e)}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="Eliminar"
                                            >
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemorySystem;
