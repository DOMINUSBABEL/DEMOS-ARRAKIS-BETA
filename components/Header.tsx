
import React from 'react';
import { SunIcon, MoonIcon, MenuIcon } from './Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuClick }) => {
  return (
    <header className="py-3 px-6 bg-white border-b border-gray-200 shadow-sm z-30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation"
            >
            <MenuIcon className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
                <h2 className="text-sm font-bold text-brand-primary uppercase tracking-widest">Panel de Control Estratégico</h2>
            </div>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-gray-700">Usuario Administrador</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Acceso Total</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs border border-brand-primary/20 shadow-sm">
              AD
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
