
import React from 'react';
import { SunIcon, MoonIcon, MenuIcon, CloseIcon } from './Icons'; // Reusing CloseIcon for Logout visually or add a proper one
import { User } from '../types';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onMenuClick: () => void;
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuClick, user, onLogout }) => {
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
                <h2 className="text-sm font-bold text-brand-primary uppercase tracking-widest font-sans">Panel de Control Estratégico</h2>
            </div>
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-gray-700">{user?.username || 'Usuario'}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">{user?.role === 'admin' ? 'Acceso Total' : 'Usuario'}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs border border-brand-primary/20 shadow-sm uppercase">
              {user?.username.substring(0, 2) || 'US'}
          </div>
          <button 
            onClick={onLogout}
            className="ml-2 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
            title="Cerrar Sesión"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
