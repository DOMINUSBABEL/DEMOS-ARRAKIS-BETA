import React from 'react';
import { SunIcon, MoonIcon, MenuIcon } from './Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle, onMenuClick }) => {
  return (
    <header className="py-4 px-4 md:px-8 bg-light-card/80 dark:bg-dark-card/50 backdrop-blur-sm border-b border-light-border dark:border-dark-border">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md text-light-text-secondary dark:text-dark-text-secondary hover:bg-light-border dark:hover:bg-dark-border transition-colors"
          aria-label="Toggle navigation"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
        <div className="flex-1 flex justify-end">
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary bg-light-bg dark:bg-dark-bg hover:bg-light-border dark:hover:bg-dark-border transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;