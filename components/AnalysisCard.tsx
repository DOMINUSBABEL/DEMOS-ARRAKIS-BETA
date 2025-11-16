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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-light-card dark:bg-dark-card rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[90vh] flex flex-col relative border border-dark-border" onClick={(e) => e.stopPropagation()}>
                <header className="p-4 border-b border-dark-border flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
                    <button onClick={onClose} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>
                <div className="p-6 flex-grow overflow-auto">
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
      <div className="bg-light-card dark:bg-dark-card/50 rounded-xl shadow-2xl border border-light-border dark:border-dark-border flex flex-col backdrop-blur-lg">
        <header className={`flex items-center justify-between p-6 ${collapsible ? 'cursor-pointer' : ''}`} onClick={() => collapsible && setIsCollapsed(!isCollapsed)}>
            <div className="flex items-center gap-3 flex-grow">
                 {collapsible && (
                    <ChevronDownIcon className={`w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                 )}
                {icon && <div className="w-6 h-6 text-brand-primary">{icon}</div>}
                <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
            </div>
          
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                {fullscreenable && !isCollapsed && (
                    <button onClick={() => setIsModalOpen(true)} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary" title="Expandir vista">
                        <ExpandIcon className="w-5 h-5" />
                    </button>
                )}
                <div className="group relative">
                    <InformationCircleIcon className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text-primary dark:group-hover:text-dark-text-primary" />
                    <div className="absolute bottom-full right-0 mb-2 w-72 p-3 bg-dark-bg border border-dark-border text-dark-text-primary text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                        {explanation}
                        <div className="absolute top-full right-4 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-dark-bg"></div>
                    </div>
                </div>
            </div>
        </header>

        <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[5000px] opacity-100'}`}>
            <div className="px-6 pb-6 pt-0">
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