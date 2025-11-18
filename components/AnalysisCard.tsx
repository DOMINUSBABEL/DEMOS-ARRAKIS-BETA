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
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4 sm:p-8 animate-fade-in" onClick={onClose}>
            <div className="glass-panel w-full h-full flex flex-col relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <header className="p-6 border-b border-white/10 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-white/5 to-transparent">
                    <h3 className="text-2xl font-bold text-light-text-primary dark:text-white tracking-tight">{title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-light-text-secondary dark:text-gray-400 hover:text-white transition-colors">
                        <CloseIcon className="w-8 h-8" />
                    </button>
                </header>
                <div className="p-8 flex-grow overflow-auto bg-dark-bg/50">
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
      <div className={`glass-panel rounded-xl flex flex-col transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] hover:border-brand-primary/30 ${isCollapsed ? 'h-auto' : ''}`}>
        <header 
            className={`flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-white/5 to-transparent ${collapsible ? 'cursor-pointer select-none' : ''}`} 
            onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
        >
            <div className="flex items-center gap-3 flex-grow">
                 {collapsible && (
                    <ChevronDownIcon className={`w-4 h-4 text-brand-primary/70 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                 )}
                {icon && <div className="p-1.5 bg-brand-primary/10 rounded-md text-brand-primary">{icon}</div>}
                <h3 className="text-base font-bold text-light-text-primary dark:text-gray-100 tracking-wide">{title}</h3>
            </div>
          
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {fullscreenable && !isCollapsed && (
                    <button onClick={() => setIsModalOpen(true)} className="p-1.5 rounded-md text-dark-text-secondary hover:text-brand-primary hover:bg-white/5 transition-colors" title="Expandir vista">
                        <ExpandIcon className="w-4 h-4" />
                    </button>
                )}
                <div className="group relative">
                    <div className="p-1.5 rounded-md cursor-help text-dark-text-secondary hover:text-brand-primary hover:bg-white/5 transition-colors">
                        <InformationCircleIcon className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-[#1a1410] border border-brand-primary/20 text-gray-300 text-xs leading-relaxed rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 backdrop-blur-xl">
                        {explanation}
                    </div>
                </div>
            </div>
        </header>

        <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
            <div className="p-5">
                {children}
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