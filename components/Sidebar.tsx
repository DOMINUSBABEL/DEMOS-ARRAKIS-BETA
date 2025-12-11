
import React from 'react';
import { ChartBarIcon, DatabaseIcon, ScaleIcon, BeakerIcon, CpuChipIcon, ShareIcon, BookOpenIcon, ListBulletIcon, MapIcon, ClockIcon, UserGroupIcon, CloseIcon, MegaphoneIcon, FingerPrintIcon } from './Icons';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap' | 'marketing' | 'candidate_intelligence' | 'comparative_analysis' | 'agent_center';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  loadRemoteData: (type: 'prediction' | 'historical', year: number, scenario?: 'A' | 'B') => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemProps {
  tabId: Tab;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ tabId, activeTab, setActiveTab, icon, children, disabled = false }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => !disabled && setActiveTab(tabId)}
      disabled={disabled}
      className={`w-full group relative flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all duration-200 border-l-4 ${
        isActive
          ? 'bg-brand-primary text-white border-brand-secondary shadow-md' // Active: Navy bg, Red left border, White text
          : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary border-transparent' // Inactive: Slate text, light hover
      } ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
    >
      <span className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-primary'}`}>
        {icon}
      </span>
      <span className={`tracking-wide font-sans ${isActive ? 'font-bold' : ''}`}>
        {children}
      </span>
    </button>
  );
};

interface RemoteButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ onClick, icon, children }) => (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-3 px-6 py-2.5 text-xs font-semibold transition-all text-slate-500 hover:text-brand-primary hover:bg-blue-50 rounded-r-full mr-4"
    >
      <span className="w-4 h-4 text-brand-secondary group-hover:text-brand-primary transition-colors">{icon}</span>
      <span className="tracking-wider uppercase font-mono group-hover:translate-x-1 transition-transform">{children}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, loadRemoteData, isOpen, onClose }) => {
  return (
    <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col h-full shadow-xl transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-brand-primary text-white shadow-sm">
             <ChartBarIcon className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-brand-primary tracking-tight leading-none font-serif">
                DEMOS
            </h1>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-0.5">
                ARRAKIS v3.0
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-brand-primary">
            <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-grow overflow-y-auto py-6 space-y-1 bg-white custom-scrollbar">
        <div className="px-6 mb-2 mt-1">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2 font-mono">
                Sistemas Centrales
            </h3>
        </div>
        <NavItem tabId="data_manager" activeTab={activeTab} setActiveTab={setActiveTab} icon={<DatabaseIcon />}>
          Gestor de Datos
        </NavItem>
        <NavItem tabId="general" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ChartBarIcon />}>
          Análisis General
        </NavItem>
        <NavItem tabId="d_hondt" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ScaleIcon />}>
          Simulador D'Hondt
        </NavItem>
         <NavItem tabId="historical" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ClockIcon />}>
          Simulación Histórica
        </NavItem>
        <NavItem tabId="coalitions" activeTab={activeTab} setActiveTab={setActiveTab} icon={<UserGroupIcon />}>
          Coaliciones
        </NavItem>
        <NavItem tabId="list_analysis" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ListBulletIcon />}>
          Listas y Estrategia
        </NavItem>
        
        <div className="px-6 mt-8 mb-2">
            <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mb-2 font-mono">
                Inteligencia Electoral
            </h3>
        </div>
         <NavItem tabId="heatmap" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MapIcon />}>
          Mapa de Calor
        </NavItem>
        <NavItem tabId="projections" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BeakerIcon />}>
          Proyecciones de Riesgo
        </NavItem>
        <NavItem tabId="marketing" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MegaphoneIcon />}>
          Marketing Dinámico
        </NavItem>
        <NavItem tabId="candidate_intelligence" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FingerPrintIcon />}>
          Perfil 360° Candidato
        </NavItem>
        <NavItem tabId="comparative_analysis" activeTab={activeTab} setActiveTab={setActiveTab} icon={<UserGroupIcon />}>
          War Games (Comparador)
        </NavItem>
        <NavItem tabId="agent_center" activeTab={activeTab} setActiveTab={setActiveTab} icon={<CpuChipIcon />}>
          Centro de Mando IA
        </NavItem>
        
        <div className="my-6 mx-6 border-t border-gray-100"></div>
        
        <div className="px-0">
          <h3 className="text-[9px] font-bold uppercase text-slate-400 tracking-widest mb-3 px-6 font-mono">Fuentes Externas</h3>
           <RemoteButton onClick={() => { loadRemoteData('prediction', 2026, 'A'); onClose(); }} icon={<ShareIcon />}>
             Cámara 2026 (A)
           </RemoteButton>
            <RemoteButton onClick={() => { loadRemoteData('prediction', 2026, 'B'); onClose(); }} icon={<ShareIcon />}>
             Cámara 2026 (B)
           </RemoteButton>
            <RemoteButton onClick={() => { loadRemoteData('historical', 2022); onClose(); }} icon={<ShareIcon />}>
             Histórico 2022
           </RemoteButton>
        </div>

        <div className="my-6 mx-6 border-t border-gray-100"></div>

        <NavItem tabId="methodology" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BookOpenIcon />}>
            Documentación
        </NavItem>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-col items-center gap-2 justify-center text-center">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono">Sistema Online v3.0</p>
            </div>
            <div className="mt-1 pt-2 border-t border-gray-100 w-full">
                <p className="text-[9px] text-slate-400 font-serif leading-tight">
                    Desarrollado por<br/>
                    <span className="font-bold text-brand-primary">CONSULTORA TALLEYRAND</span><br/>
                    © 2025
                </p>
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
