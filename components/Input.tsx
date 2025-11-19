import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                        {icon}
                    </div>
                )}
                <input
                    className={`
            w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg 
            py-2 ${icon ? 'pl-10' : 'pl-3'} pr-3
            text-[var(--text-primary)] placeholder-[var(--text-secondary)]
            focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent
            transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-[var(--danger)] focus:ring-[var(--danger)]' : ''}
            ${className}
          `}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-sm text-[var(--danger)]">{error}</p>}
        </div>
    );
};

export default Input;
