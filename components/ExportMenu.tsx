import React, { useState, useRef, useEffect } from 'react';
import { FilePdfIcon, FileExcelIcon } from './Icons';

const ExportMenu: React.FC<{ onPdf: () => void; onXlsx: () => void, disabled: boolean }> = ({ onPdf, onXlsx, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="bg-brand-primary/80 hover:bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm border border-white/10 shadow-[0_0_15px_rgba(217,119,6,0.3)]"
            >
                Exportar Informe
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1410] border border-brand-primary/30 rounded-md shadow-[0_0_30px_rgba(0,0,0,0.8)] z-20 backdrop-blur-xl">
                    <button onClick={() => { onPdf(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-brand-primary/20 flex items-center gap-2 transition-colors">
                        <FilePdfIcon className="w-5 h-5 text-red-500" />
                        Exportar a PDF
                    </button>
                    <button onClick={() => { onXlsx(); setIsOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-brand-primary/20 flex items-center gap-2 transition-colors border-t border-white/5">
                        <FileExcelIcon className="w-5 h-5 text-green-500" />
                        Exportar a Excel
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExportMenu;
