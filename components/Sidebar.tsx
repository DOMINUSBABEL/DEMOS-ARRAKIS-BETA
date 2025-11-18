
import React from 'react';
import { ChartBarIcon, DatabaseIcon, ScaleIcon, BeakerIcon, EyeIcon, ClockIcon, UserGroupIcon, CpuChipIcon, ShareIcon, BookOpenIcon, ListBulletIcon, MapIcon } from './Icons';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap';

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  loadRemoteData: (type: 'prediction' | 'historical', year: number) => Promise<void>;
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-dark-text-secondary hover:bg-dark-card hover:text-dark-text-primary'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{children}</span>
    </button>
  );
};

const RemoteButton: React.FC<{ onClick: () => void; icon: React.ReactNode; children: React.ReactNode; }> = ({ onClick, icon, children }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-dark-text-secondary hover:bg-dark-card hover:text-dark-text-primary"
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{children}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, loadRemoteData }) => {
  return (
    <aside className="w-64 bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border flex-shrink-0 p-4 flex flex-col">
      <div className="flex items-center gap-2 px-2 mb-8">
        <ChartBarIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary tracking-tight">
            DEMOS <span className="text-brand-primary">ARRAKIS</span>
        </h1>
      </div>

      <nav className="flex-grow space-y-2">
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
          Análisis de Coaliciones
        </NavItem>
        <NavItem tabId="list_analysis" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ListBulletIcon />}>
          Análisis de Listas
        </NavItem>
         <NavItem tabId="heatmap" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MapIcon />}>
          Mapa de Calor
        </NavItem>
        <NavItem tabId="projections" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BeakerIcon />}>
          Proyecciones
        </NavItem>
        <NavItem tabId="strategist" activeTab={activeTab} setActiveTab={setActiveTab} icon={<CpuChipIcon />}>
          Estratega IA
        </NavItem>
        
        <div className="!mt-4 pt-4 border-t border-dark-border">
          <h3 className="px-3 text-xs font-semibold uppercase text-dark-text-secondary tracking-wider mb-2">Fuentes Externas</h3>
           <RemoteButton onClick={() => loadRemoteData('prediction', 2026)} icon={<ShareIcon />}>
             Cargar Predicción 2026
           </RemoteButton>
            <RemoteButton onClick={() => loadRemoteData('historical', 2022)} icon={<ShareIcon />}>
             Cargar Histórico 2022
           </RemoteButton>
        </div>

        <div className="!mt-4 pt-4 border-t border-dark-border">
          <NavItem tabId="methodology" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BookOpenIcon />}>
            Metodología
          </NavItem>
        </div>
      </nav>
      
      <div className="mt-auto text-center text-xs text-dark-text-secondary p-2">
        <p>&copy; {new Date().getFullYear()} DEMOS ARRAKIS</p>
        <p>Análisis Electoral Avanzado</p>
      </div>
    </aside>
  );
};

export default Sidebar;
