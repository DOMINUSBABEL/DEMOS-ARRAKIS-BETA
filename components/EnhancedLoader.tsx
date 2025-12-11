
import React, { useState, useEffect } from 'react';
import { CpuChipIcon, LoadingSpinner } from './Icons';

interface EnhancedLoaderProps {
    loading: boolean;
    messages?: string[];
}

const DEFAULT_MESSAGES = [
    "Inicializando núcleos de procesamiento...",
    "Conectando con la base de conocimiento global...",
    "Analizando vectores de datos...",
    "Calculando probabilidades estocásticas...",
    "Sintetizando inteligencia estratégica...",
    "Generando reporte ejecutivo..."
];

const EnhancedLoader: React.FC<EnhancedLoaderProps> = ({ loading, messages = DEFAULT_MESSAGES }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        if (!loading) return;
        
        const interval = setInterval(() => {
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000); // Change message every 2 seconds

        return () => clearInterval(interval);
    }, [loading, messages]);

    if (!loading) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/90 dark:bg-[#0f0a06]/90 backdrop-blur-sm transition-all duration-300 rounded-xl">
            <div className="relative">
                <div className="absolute inset-0 bg-brand-primary/20 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-white dark:bg-black p-4 rounded-full border border-brand-primary/20 shadow-xl">
                    <LoadingSpinner className="w-12 h-12 text-brand-primary" />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-brand-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                    AI
                </div>
            </div>
            
            <div className="mt-8 text-center space-y-2">
                <h4 className="text-lg font-bold text-brand-primary dark:text-white font-mono tracking-widest uppercase animate-pulse">
                    Procesando
                </h4>
                <div className="h-6 overflow-hidden">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono transition-all duration-500 transform">
                        {messages[currentMessageIndex]}
                    </p>
                </div>
            </div>

            <div className="mt-8 w-64 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-primary to-brand-accent w-1/3 animate-[translateX_3s_ease-in-out_infinite]"></div>
            </div>
        </div>
    );
};

export default EnhancedLoader;
