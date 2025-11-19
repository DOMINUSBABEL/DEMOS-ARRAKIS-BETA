import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeToggle }) => {
  return (
    <header
      className="py-4 px-8 backdrop-blur-sm transition-all duration-300"
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)'
      }}
    >
      <div className="flex items-center justify-end">
        <button
          onClick={onThemeToggle}
          className="p-2 rounded-full transition-all duration-300 hover:scale-110"
          style={{
            color: 'var(--text-secondary)',
            background: 'var(--background)',
            border: '1px solid var(--border)'
          }}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;