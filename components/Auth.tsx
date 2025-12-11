
import React, { useState, useEffect, useMemo } from 'react';
import { FingerPrintIcon, UserGroupIcon, LoadingSpinner, WarningIcon, TalleyrandLogoIcon, StarIcon, MapIcon, ChartBarIcon } from './Icons';
import { User, Language } from '../types';
import { getTranslation } from '../services/i18n';

interface AuthProps {
    onLogin: (user: User) => void;
    onLanguageChange?: (lang: Language) => void;
    language?: Language;
}

const LANGUAGES: { code: Language; label: string }[] = [
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' },
    { code: 'fr', label: 'FR' },
    { code: 'de', label: 'DE' },
    { code: 'ru', label: 'RU' },
    { code: 'zh', label: 'ZH' },
    { code: 'ar', label: 'AR' },
    { code: 'pt', label: 'PT' },
];

const Auth: React.FC<AuthProps> = ({ onLogin, onLanguageChange, language = 'es' }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Optimization: Memoize particles so they don't re-calculate on every render
    const particles = useMemo(() => {
        return Array.from({ length: 80 }).map((_, i) => {
            const size = Math.random() * 6 + 2; 
            const left = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 10;
            const opacity = Math.random() * 0.7 + 0.3;
            
            const variant = Math.random();
            let color, shadow;
            
            if (variant > 0.5) {
                // Rich Spice (Deep Orange/Gold)
                color = '#F59E0B'; 
                shadow = `0 0 ${size * 3}px #F59E0B, 0 0 ${size}px #D97706`;
            } else if (variant > 0.2) {
                // Bright Amber
                color = '#FCD34D';
                shadow = `0 0 ${size * 2}px #FCD34D`;
            } else {
                // Corporate Data (White/Blue tint)
                color = '#E0F2FE';
                shadow = `0 0 ${size * 2}px rgba(224, 242, 254, 0.8)`;
            }
            
            return (
                <div 
                    key={i}
                    className="data-particle"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        left: `${left}%`,
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                        opacity: opacity,
                        backgroundColor: color,
                        boxShadow: shadow
                    }}
                ></div>
            );
        });
    }, []);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            if (!username.trim() || !password.trim()) {
                throw new Error("Por favor completa todos los campos.");
            }

            const validUsers = ['DEMOS', 'ISAAC', 'BABEL'];
            const u = username.toUpperCase();
            const p = password.toUpperCase();

            if (validUsers.includes(u) && p === u) {
                const role = u === 'DEMOS' ? 'admin' : 'user';
                const userData = { username: u, role: role as 'admin' | 'user' };
                localStorage.setItem('demos_current_user', JSON.stringify(userData));
                onLogin(userData);
            } else {
                throw new Error("Credenciales inválidas o acceso denegado.");
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const t = (key: string) => getTranslation(language, key);

    return (
        <div className="min-h-screen bg-corporate-flow flex flex-col justify-center items-center p-4 relative overflow-hidden text-gray-200">
            
            {/* Background Audio - YouTube Embed */}
            <iframe 
                width="0" 
                height="0" 
                src="https://www.youtube.com/embed/gGqi8J9H4CA?autoplay=1&loop=1&playlist=gGqi8J9H4CA&controls=0&showinfo=0" 
                title="Ambient Audio"
                frameBorder="0" 
                allow="autoplay; encrypted-media" 
                allowFullScreen
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
            ></iframe>

            {/* ATMOSPHERIC LAYERS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-brand-primary/30 to-black/20 pointer-events-none z-0"></div>
            
            {/* Geometric Grid Animation */}
            <div className="absolute inset-0 z-0 bg-grid-pattern opacity-40 pointer-events-none"></div>

            {/* Floating Geometric Shapes */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="floating-shape-container" style={{ top: '10%', left: '5%', animationDelay: '0s' }}>
                    <MapIcon className="w-80 h-80 opacity-20 text-brand-accent transform rotate-12" />
                </div>
                <div className="floating-shape-container" style={{ top: '50%', left: '85%', animationDelay: '5s' }}>
                    <ChartBarIcon className="w-96 h-96 opacity-10 text-brand-secondary transform -rotate-12" />
                </div>
                <div className="floating-shape-container" style={{ top: '70%', left: '20%', animationDelay: '2s' }}>
                    <FingerPrintIcon className="w-64 h-64 opacity-15 text-white" />
                </div>
            </div>
            
            {/* Orbital Rings */}
            <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] orbital-ring animate-spin duration-[100s] z-0 opacity-30 border-brand-accent/40 shadow-[0_0_20px_rgba(2,132,199,0.2)]"></div>
            <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] orbital-ring animate-spin duration-[70s] z-0 opacity-40 border-white/20" style={{animationDirection: 'reverse'}}></div>
            
            {/* Floating Spice & Data Particles */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {particles}
            </div>

            {/* BRANDING HEADER */}
            <div className="absolute top-8 left-8 flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity z-10">
                <TalleyrandLogoIcon className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                <div className="flex flex-col">
                    <span className="text-sm font-serif font-bold text-white tracking-widest leading-none drop-shadow-md">CONSULTORA</span>
                    <span className="text-xs font-serif font-medium text-brand-accent tracking-[0.3em] leading-none drop-shadow-md">TALLEYRAND</span>
                </div>
            </div>

            {/* LANGUAGE SELECTOR */}
            <div className="absolute top-8 right-8 z-20 flex gap-2">
                {LANGUAGES.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => onLanguageChange?.(lang.code)}
                        className={`text-[10px] font-bold px-2 py-1 rounded border transition-all ${language === lang.code ? 'bg-brand-accent text-white border-brand-accent' : 'bg-transparent text-gray-400 border-gray-600 hover:text-white hover:border-white'}`}
                    >
                        {lang.label}
                    </button>
                ))}
            </div>

            {/* MAIN LOGIN CARD */}
            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                
                {/* Holographic Logo Top */}
                <div className="flex justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-brand-primary/80 blur-[60px] rounded-full"></div>
                    <div className="relative p-6 bg-white/5 border border-white/20 rounded-full shadow-[0_0_40px_rgba(0,40,85,0.8)] ring-1 ring-white/30 backdrop-blur-md">
                        <FingerPrintIcon className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl font-black text-white tracking-[0.1em] font-serif mb-2 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        {t('login.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent via-white to-brand-accent animate-pulse">{t('login.subtitle')}</span>
                    </h1>
                    <p className="text-[11px] font-mono text-blue-200 uppercase tracking-[0.3em] drop-shadow-sm font-bold">
                        {t('login.caption')}
                    </p>
                </div>

                <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Glowing Top Border */}
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-70 group-hover:opacity-100 transition-opacity"></div>

                    <form onSubmit={handleAction} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider ml-1">{t('login.username')}</label>
                            <div className="relative group/input">
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/50 outline-none transition-all text-white placeholder-gray-500 font-mono text-sm group-hover/input:bg-white/10 group-hover/input:border-white/30"
                                    placeholder="ID USUARIO"
                                />
                                <UserGroupIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3.5 group-focus-within/input:text-white transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider ml-1">{t('login.password')}</label>
                            <div className="relative group/input">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/50 outline-none transition-all text-white placeholder-gray-500 font-mono text-sm group-hover/input:bg-white/10 group-hover/input:border-white/30"
                                    placeholder="••••••••"
                                />
                                <div className="absolute left-3 top-3.5">
                                    <div className="w-4 h-4 border border-gray-500 rounded-sm flex items-center justify-center group-focus-within/input:border-white transition-colors">
                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full group-focus-within/input:bg-white transition-colors"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center p-3 bg-red-900/60 border border-red-500/50 text-red-200 rounded-lg text-xs animate-pulse backdrop-blur-sm">
                                <WarningIcon className="w-4 h-4 mr-2 flex-shrink-0 text-red-400" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-brand-primary hover:bg-brand-accent text-white font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(0,40,85,0.6)] hover:shadow-[0_0_30px_rgba(2,132,199,0.8)] transition-all transform active:scale-[0.98] flex justify-center items-center gap-3 relative overflow-hidden group/btn uppercase tracking-widest text-xs border border-white/10"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="w-4 h-4" />
                                    <span className="animate-pulse">{t('login.authenticating')}</span>
                                </>
                            ) : (
                                <>
                                    <span>{t('login.button')}</span>
                                    <StarIcon className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            {/* FOOTER INFO */}
            <div className="absolute bottom-6 text-center z-10 opacity-70 hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-gray-300 font-mono mb-1 tracking-wider drop-shadow-md">
                    {t('login.footer')}
                </p>
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto"></div>
            </div>
        </div>
    );
};

export default Auth;
