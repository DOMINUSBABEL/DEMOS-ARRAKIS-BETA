import React, { useState } from 'react';
import { InformationCircleIcon, ExpandIcon, CloseIcon, ChevronDownIcon } from './Icons';

interface AnalysisCardProps {
  title: string;
  explanation: string;
  children: React.ReactNode;
  fullscreenable?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  modalChildren?: React.ReactNode;
  icon?: React.ReactNode;
}

const FullScreenModal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => {
    return (
        <div className="fixed inset-0 bg-[#050403]/90 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-8 animate-fade-in" onClick={onClose}>
            <div className="glass-panel w-full h-full flex flex-col relative rounded-2xl overflow-hidden ring-1 ring-brand-primary/20 shadow-[0_0_50px_rgba(0,0,0,0.8)]" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b border-white/5 flex justify-between items-center flex-shrink-0 bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-1 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(217,119,6,0.8)]"></div>
                        <h3 className="text-2xl font-bold text-white tracking-tight font-mono uppercase">{title}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-dark-text-secondary hover:text-white transition-all duration-200 group">
                        <CloseIcon className="w-8 h-8 group-hover:rotate-90 transition-transform text-brand-primary" />
                    </button>
                </header>
                <div className="p-8 flex-grow overflow-auto bg-gradient-to-b from-transparent to-black/40">
                    {children}
                </div>
            </div>
        </div>
    );
};

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, explanation, children, fullscreenable = true, collapsible = false, defaultCollapsed = false, modalChildren, icon }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(collapsible && defaultCollapsed);

  return (
    <>
      <div className={`glass-panel rounded-xl flex flex-col transition-all duration-500 group hover:shadow-glow hover:border-brand-primary/20 hover:scale-[1.005] ${isCollapsed ? 'h-auto' : ''}`}>
        <header 
            className={`flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent transition-colors duration-300 ${collapsible ? 'cursor-pointer select-none hover:bg-white/10' : ''}`} 
            onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        >
            <div className="flex items-center gap-3 flex-grow">
                 {collapsible && (
                    <ChevronDownIcon className={`w-4 h-4 text-brand-primary transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                 )}
                {icon && <div className="p-1.5 bg-brand-primary/10 rounded border border-brand-primary/30 text-brand-primary shadow-[0_0_10px_rgba(217,119,6,0.2)]">{icon}</div>}
                <h3 className="text-sm font-bold text-light-text-primary dark:text-gray-100 tracking-widest uppercase font-mono">{title}</h3>
            </div>
          
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {fullscreenable && !isCollapsed && (
                    <button onClick={() => setIsModalOpen(true)} className="p-1.5 rounded-md text-dark-text-secondary hover:text-brand-primary hover:bg-brand-primary/10 transition-all duration-200 opacity-0 group-hover:opacity-100" title="Expandir vista">
                        <ExpandIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="group/tooltip relative">
                    <div className="p-1.5 rounded-md cursor-help text-dark-text-secondary hover:text-brand-primary transition-colors">
                        <InformationCircleIcon className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-72 p-4 bg-[#1a1410]/95 border border-brand-primary/30 text-gray-300 text-xs leading-relaxed rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.8)] opacity-0 group-hover/tooltip:opacity-100 transition-all duration-300 pointer-events-none z-30 backdrop-blur-xl translate-y-2 group-hover/tooltip:translate-y-0">
                        <div className="text-brand-primary font-bold mb-1 text-[10px] uppercase tracking-widest font-mono border-b border-brand-primary/20 pb-1">Intel Data</div>
                        {explanation}
                    </div>
                </div>
            </div>
        </header>

        <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
            <div className="p-6 relative">
                <div className="relative z-10">
                    {children}
                </div>
            </div>
        </div>
      </div>
      {isModalOpen && fullscreenable && (
          <FullScreenModal title={title} onClose={() => setIsModalOpen(false)}>
              {modalChildren || children}
          </FullScreenModal>
      )}
    </>
  );
};

export default AnalysisCard;