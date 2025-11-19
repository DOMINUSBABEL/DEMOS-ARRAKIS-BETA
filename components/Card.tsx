import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle, action }) => {
    return (
        <div className={`glass rounded-xl p-6 transition-all hover:border-[var(--primary)]/50 ${className}`}>
            {(title || action) && (
                <div className="flex justify-between items-start mb-4">
                    <div>
                        {title && <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>}
                        {subtitle && <p className="text-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="text-[var(--text-primary)]">
                {children}
            </div>
        </div>
    );
};

export default Card;
