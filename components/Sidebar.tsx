
import React from 'react';
import { ChartBarIcon, DatabaseIcon, ScaleIcon, BeakerIcon, CpuChipIcon, ShareIcon, BookOpenIcon, ListBulletIcon, MapIcon, ClockIcon, UserGroupIcon, CloseIcon, MegaphoneIcon } from './Icons';

type Tab = 'data_manager' | 'general' | 'd_hondt' | 'projections' | 'historical' | 'coalitions' | 'list_analysis' | 'strategist' | 'methodology' | 'heatmap' | 'marketing';

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
  index?: number;
}

const NavItem: React.FC<NavItemProps> = ({ tabId, activeTab, setActiveTab, icon, children, disabled = false, index = 0 }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => !disabled && setActiveTab(tabId)}
      disabled={disabled}
      style={{ animationDelay: `${index * 50}ms` }}
      className={`w-full group relative flex items-center gap-4 px-5 py-3.5 text-sm font-medium transition-all duration-300 animate-slide-in-right opacity-0 ${
        isActive
          ? 'text-brand-primary bg-white/5 shadow-[inset_4px_0_0_0_#d97706]'
          : 'text-dark-text-secondary hover:text-brand-glow hover:bg-white/5'
      } ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
    >
      <span className={`w-5 h-5 transition-all duration-500 ${isActive ? 'text-brand-primary drop-shadow-[0_0_8px_rgba(217,119,6,0.8)]' : 'group-hover:text-brand-primary'}`}>
        {icon}
      </span>
      <span className={`tracking-wide font-mono uppercase text-xs ${isActive ? 'font-bold text-shadow-glow' : ''}`}>
        {children}
      </span>
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 to-transparent opacity-50 pointer-events-none" />
      )}
      {/* Hover light leak effect */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-[2px]"></div>
    </button>
  );
};

interface RemoteButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
  index?: number;
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ onClick, icon, children, index = 0 }) => (
    <button
      onClick={onClick}
      style={{ animationDelay: `${index * 50 + 500}ms` }}
      className="w-full group flex items-center gap-3 px-5 py-2 text-xs font-medium transition-all text-dark-text-secondary hover:text-white hover:bg-brand-primary/10 border-l-2 border-transparent hover:border-brand-primary/50 animate-slide-in-right opacity-0"
    >
      <span className="w-4 h-4 text-brand-secondary group-hover:text-brand-glow transition-colors">{icon}</span>
      <span className="tracking-widest uppercase font-mono text-[10px] group-hover:translate-x-1 transition-transform">{children}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, loadRemoteData, isOpen, onClose }) => {
  return (
    <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#050403] border-r border-white/5 flex flex-col h-full shadow-[10px_0_40px_rgba(0,0,0,0.8)] transition-transform duration-300 ease-in-out backdrop-blur-3xl
        lg:translate-x-0 lg:static lg:shadow-[10px_0_40px_rgba(0,0,0,0.8)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header */}
      <div className="p-8 pb-6 border-b border-white/5 relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-primary to-transparent opacity-50"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2 rounded-lg border border-brand-primary/30 bg-brand-primary/5 shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)] transition-shadow duration-500">
             <ChartBarIcon className="w-6 h-6 text-brand-primary" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white tracking-tighter leading-none font-mono">
                DEMOS
            </h1>
            <span className="text-[10px] font-bold text-brand-primary tracking-[0.4em] uppercase mt-1 text-shadow-glow animate-pulse-slow">
                ARRAKIS
            </span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <CloseIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Scroll Area */}
      <nav className="flex-grow overflow-y-auto py-6 space-y-1 scrollbar-thin scrollbar-thumb-brand-secondary/20">
        <div className="px-6 mb-3 mt-2">
            <h3 className="text-[9px] font-bold uppercase text-brand-primary/60 tracking-[0.2em] mb-2 flex items-center gap-2 font-mono animate-fade-in">
                <span className="w-1 h-1 bg-brand-primary rounded-full animate-pulse"></span>
                Core Systems
            </h3>
        </div>
        <NavItem index={0} tabId="data_manager" activeTab={activeTab} setActiveTab={setActiveTab} icon={<DatabaseIcon />}>
          Gestor de Datos
        </NavItem>
        <NavItem index={1} tabId="general" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ChartBarIcon />}>
          Análisis General
        </NavItem>
        <NavItem index={2} tabId="d_hondt" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ScaleIcon />}>
          Simulador D'Hondt
        </NavItem>
         <NavItem index={3} tabId="historical" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ClockIcon />}>
          Simulación Histórica
        </NavItem>
        <NavItem index={4} tabId="coalitions" activeTab={activeTab} setActiveTab={setActiveTab} icon={<UserGroupIcon />}>
          Coaliciones
        </NavItem>
        <NavItem index={5} tabId="list_analysis" activeTab={activeTab} setActiveTab={setActiveTab} icon={<ListBulletIcon />}>
          Listas y Estrategia
        </NavItem>
        
        <div className="px-6 mt-8 mb-3">
            <h3 className="text-[9px] font-bold uppercase text-brand-accent/60 tracking-[0.2em] mb-2 flex items-center gap-2 font-mono animate-fade-in" style={{animationDelay: '300ms'}}>
                <span className="w-1 h-1 bg-brand-accent rounded-full animate-pulse"></span>
                Intelligence
            </h3>
        </div>
         <NavItem index={6} tabId="heatmap" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MapIcon />}>
          Mapa de Calor
        </NavItem>
        <NavItem index={7} tabId="projections" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BeakerIcon />}>
          Proyecciones
        </NavItem>
        <NavItem index={8} tabId="marketing" activeTab={activeTab} setActiveTab={setActiveTab} icon={<MegaphoneIcon />}>
          Marketing de Guerra
        </NavItem>
        <NavItem index={9} tabId="strategist" activeTab={activeTab} setActiveTab={setActiveTab} icon={<CpuChipIcon />}>
          Estratega IA
        </NavItem>
        
        <div className="my-6 mx-6 border-t border-white/5"></div>
        
        <div className="px-4">
          <h3 className="text-[9px] font-bold uppercase text-dark-text-muted tracking-[0.2em] mb-4 px-2 font-mono animate-fade-in" style={{animationDelay: '500ms'}}>External Feeds</h3>
           <RemoteButton index={0} onClick={() => { loadRemoteData('prediction', 2026, 'A'); onClose(); }} icon={<ShareIcon />}>
             Cámara 2026 (A)
           </RemoteButton>
            <RemoteButton index={1} onClick={() => { loadRemoteData('prediction', 2026, 'B'); onClose(); }} icon={<ShareIcon />}>
             Cámara 2026 (B)
           </RemoteButton>
            <RemoteButton index={2} onClick={() => { loadRemoteData('historical', 2022); onClose(); }} icon={<ShareIcon />}>
             Histórico 2022
           </RemoteButton>
        </div>

        <div className="my-6 mx-6 border-t border-white/5"></div>

        <NavItem index={10} tabId="methodology" activeTab={activeTab} setActiveTab={setActiveTab} icon={<BookOpenIcon />}>
            Metodología
        </NavItem>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></div>
            <p className="text-[10px] text-dark-text-muted uppercase tracking-widest font-mono">System Online v2.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
