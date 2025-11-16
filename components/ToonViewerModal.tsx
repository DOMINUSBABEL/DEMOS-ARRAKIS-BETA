import React, { useMemo } from 'react';
import { parseToon } from '../services/toonParser';
import { ToonDataset } from '../types';
import { CloseIcon } from './Icons';

interface ToonViewerModalProps {
    dataset: ToonDataset;
    onClose: () => void;
}

const ToonViewerModal: React.FC<ToonViewerModalProps> = ({ dataset, onClose }) => {
    
    const toonString = dataset.toonData;

    // Parse TOON on demand for JSON view
    const { jsonString, recordCount } = useMemo(() => {
        const allData = parseToon(toonString);
        const dataSlice = allData.slice(0, 50);
        return {
            jsonString: JSON.stringify(dataSlice, null, 2),
            recordCount: dataSlice.length
        };
    }, [toonString]);


    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-dark-card rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col relative border border-dark-border" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-dark-border flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-dark-text-primary">
                        Comparación de Formatos: JSON vs. TOON
                    </h3>
                    <button onClick={onClose} className="text-dark-text-secondary hover:text-dark-text-primary transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 flex-grow overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <h4 className="text-xl font-bold text-center mb-2 text-blue-400">JSON</h4>
                        <div className="flex-grow bg-dark-bg p-3 rounded-lg overflow-auto border border-dark-border">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                                <code>{jsonString}</code>
                            </pre>
                        </div>
                        <p className="text-center mt-3 font-mono text-sm text-dark-text-secondary">
                            TAMAÑO JSON: <span className="font-bold text-dark-text-primary">{jsonString.length.toLocaleString('es-CO')}</span> caracteres
                        </p>
                    </div>
                     <div className="flex flex-col">
                        <h4 className="text-xl font-bold text-center mb-2" style={{color: '#c084fc'}}>TOON</h4>
                         <div className="flex-grow bg-dark-bg p-3 rounded-lg overflow-auto border border-dark-border">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">
                                <code>{toonString}</code>
                            </pre>
                        </div>
                        <p className="text-center mt-3 font-mono text-sm text-dark-text-secondary">
                            TAMAÑO TOON: <span className="font-bold text-dark-text-primary">{toonString.length.toLocaleString('es-CO')}</span> caracteres
                        </p>
                    </div>
                </div>
                 <footer className="p-4 border-t border-dark-border text-center text-xs text-dark-text-secondary">
                   Mostrando una vista previa de los primeros {recordCount} registros del conjunto de datos "{dataset.name}".
                </footer>
            </div>
        </div>
    );
};

export default ToonViewerModal;