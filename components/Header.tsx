import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle }) => {
  return (
    <header className="py-4 px-8 bg-light-card/80 dark:bg-dark-card/50 backdrop-blur-sm border-b border-light-border dark:border-dark-border">
      <div className="flex items-center justify-end">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary bg-light-bg dark:bg-dark-bg hover:bg-light-border dark:hover:bg-dark-border transition-colors"
          aria-label="Toggle theme"
         >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
         </button>
      </div>
    </header>
  );
};

export default Header;