import React from 'react';
import { ChartBarIcon, DatabaseIcon, ScaleIcon, BeakerIcon, EyeIcon, ClockIcon, UserGroupIcon, CpuChipIcon, ShareIcon, BookOpenIcon, ListBulletIcon, MapIcon } from './Icons';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  loadRemoteData: (type: 'prediction' | 'historical', year: number, scenario?: 'A' | 'B') => Promise<void>;
}

const NavItem: React.FC<{
  tabId: Tab, 
  activeTab: Tab, 
  setActiveTab: (tab: Tab) => void, 
  icon: React.ReactNode, 
  children: React.ReactNode,
  disabled?: boolean
}> = ({ tabId, activeTab, setActiveTab, icon, children, disabled = false }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => !disabled && setActiveTab(tabId)}
      disabled={disabled}
      className={`w-full group relative flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 overflow-hidden rounded-r-lg ${
        isActive
          ? 'text-brand-primary bg-glow-gradient border-l-2 border-brand-primary'
          : 'text-dark-text-secondary hover:text-light-text-primary dark:hover:text-white hover:bg-white/5 border-l-2 border-transparent'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(217,119,6,0.5)]' : 'group-hover:scale-110'}`}>
        {icon}
      </span>
      <span className="tracking-wide">{children}</span>
      {isActive && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-primary/10 to-transparent pointer-events-none" />
      )}
    </button>
  );
};

const RemoteButton: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode; }> = ({ onClick, icon, children }) => (
    <button
      onClick={onClick}
      className="w-full group flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all text-dark-text-secondary hover:text-brand-glow hover:bg-white/5 rounded-md"
    >
      <span className="w-4 h-4 transition-transform group-hover:rotate-12">{icon}</span>
      <span className="tracking-wider uppercase">{children}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, loadRemoteData }) => {
  return (
    <aside className="w-72 bg-light-card dark:bg-[#0a0604] border-r border-light-border dark:border-dark-border/50 flex-shrink-0 flex flex-col h-full backdrop-blur-md shadow-2xl z-20">
      {/* Header */}
      <div className="p-6 pb-8 border-b border-dark-border/30 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/20 rounded-lg border border-brand-primary/30">
             <ChartBarIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-light-text-primary dark:text-white tracking-tight leading-none">
                DEMOS
            </h1>
            <span className="text-xs font-bold text-brand-primary tracking-[0.2em] uppercase text-shadow-glow">
                ARRAKIS
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-grow overflow-y-auto py-4 space-y-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-dark-border">
        <div className="px-3 mb-2">
            <h3 className="px-4 text-[10px] font-bold uppercase text-dark-text-muted tracking-widest mb-2">Análisis</h3>
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
        
        <div className="px-3 mt-6 mb-2">
            <h3 className="px-4 text-[10px] font-bold uppercase text-dark-text-muted tracking-widest mb-2">IA & Geo</h3>
        </div>
         <NavItem tabId="heatmap" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MapIcon />}>
          Mapa de Calor
        </NavItem>
        <NavItem tabId="projections" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BeakerIcon />}>
          Proyecciones Monte Carlo
        </NavItem>
        <NavItem tabId="strategist" activeTab={activeTab} setActiveTab={setActiveTab} icon={<CpuChipIcon />}>
          Estratega IA
        </NavItem>
        
        <div className="my-6 mx-4 border-t border-dark-border/30"></div>
        
        <div className="px-3">
          <h3 className="px-4 text-[10px] font-bold uppercase text-dark-text-muted tracking-widest mb-2">Datos Externos</h3>
           <RemoteButton onClick={() => loadRemoteData('prediction', 2026, 'A')} icon={<ShareIcon />}>
             Cámara 2026 (Esc. A)
           </RemoteButton>
            <RemoteButton onClick={() => loadRemoteData('prediction', 2026, 'B')} icon={<ShareIcon />}>
             Cámara 2026 (Esc. B)
           </RemoteButton>
            <RemoteButton onClick={() => loadRemoteData('historical', 2022)} icon={<ShareIcon />}>
             Histórico 2022
           </RemoteButton>
        </div>

        <div className="my-6 mx-4 border-t border-dark-border/30"></div>

        <NavItem tabId="methodology" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BookOpenIcon />}>
            Metodología
        </NavItem>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-dark-border/30 bg-black/20">
        <div className="flex items-center gap-3 px-2 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <p className="text-[10px] text-dark-text-secondary uppercase tracking-wider font-mono">Sistema Online</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;