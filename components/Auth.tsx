
import React, { useState, useEffect } from 'react';
import { FingerPrintIcon, UserGroupIcon, LoadingSpinner, WarningIcon, TalleyrandLogoIcon, StarIcon, MapIcon, ChartBarIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [particles, setParticles] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        // Generate "Spice Particles" floating over the corporate data stream
        const newParticles = Array.from({ length: 60 }).map((_, i) => {
            const size = Math.random() * 3 + 1;
            const left = Math.random() * 100;
            const duration = Math.random() * 20 + 10;
            const delay = Math.random() * 10;
            const opacity = Math.random() * 0.6 + 0.1;
            
            // Mix of Spice (Orange/Amber) and Data (White/Blue) for a hybrid aesthetic
            const variant = Math.random();
            let color, shadow;
            
            if (variant > 0.6) {
                // Spice Mote (Orange/Gold)
                color = '#D97706'; 
                shadow = `0 0 ${size * 4}px #D97706`;
            } else if (variant > 0.3) {
                // Refined Spice (Amber)
                color = '#F59E0B';
                shadow = `0 0 ${size * 3}px #F59E0B`;
            } else {
                // Raw Data (White)
                color = '#FFFFFF';
                shadow = `0 0 ${size * 2}px rgba(255, 255, 255, 0.5)`;
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
        setParticles(newParticles);
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

    return (
        <div className="min-h-screen bg-corporate-flow flex flex-col justify-center items-center p-4 relative overflow-hidden text-gray-200">
            
            {/* ATMOSPHERIC LAYERS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-brand-primary/20 to-transparent pointer-events-none z-0"></div>
            
            {/* Geometric Grid Animation */}
            <div className="absolute inset-0 z-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

            {/* Floating Geometric Shapes */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="floating-shape-container" style={{ top: '15%', left: '10%', animationDelay: '0s' }}>
                    <MapIcon className="w-64 h-64 opacity-5 text-brand-accent" />
                </div>
                <div className="floating-shape-container" style={{ top: '60%', left: '80%', animationDelay: '2s' }}>
                    <ChartBarIcon className="w-96 h-96 opacity-5 text-brand-secondary" />
                </div>
                <div className="floating-shape-container" style={{ top: '40%', left: '40%', animationDelay: '4s' }}>
                    <FingerPrintIcon className="w-48 h-48 opacity-5 text-white" />
                </div>
            </div>
            
            {/* Orbital Rings */}
            <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] orbital-ring animate-spin duration-[120s] z-0 opacity-10 border-brand-accent/30"></div>
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] orbital-ring animate-spin duration-[90s] z-0 opacity-20 border-white/10" style={{animationDirection: 'reverse'}}></div>
            
            {/* Floating Spice & Data Particles */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                {particles}
            </div>

            {/* BRANDING HEADER */}
            <div className="absolute top-8 left-8 flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity z-10">
                <TalleyrandLogoIcon className="w-10 h-10 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                <div className="flex flex-col">
                    <span className="text-sm font-serif font-bold text-gray-200 tracking-widest leading-none">CONSULTORA</span>
                    <span className="text-xs font-serif font-medium text-brand-accent tracking-[0.3em] leading-none">TALLEYRAND</span>
                </div>
            </div>

            {/* MAIN LOGIN CARD */}
            <div className="w-full max-w-md relative z-10 animate-fade-in-up">
                
                {/* Holographic Logo Top */}
                <div className="flex justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-brand-primary/60 blur-[40px] rounded-full"></div>
                    <div className="relative p-5 bg-white/5 border border-white/10 rounded-full shadow-[0_0_30px_rgba(0,40,85,0.5)] ring-1 ring-white/20 backdrop-blur-sm">
                        <FingerPrintIcon className="w-10 h-10 text-white" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white tracking-[0.1em] font-serif mb-1 drop-shadow-lg">
                        DEMOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-white">ARRAKIS</span>
                    </h1>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.4em]">
                        Inteligencia Predictiva v3.0
                    </p>
                </div>

                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
                    {/* Glowing Top Border */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-accent to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <form onSubmit={handleAction} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Identificador Operativo</label>
                            <div className="relative group/input">
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/50 outline-none transition-all text-white placeholder-gray-500 font-mono text-sm group-hover/input:bg-white/10"
                                    placeholder="ID USUARIO"
                                />
                                <UserGroupIcon className="w-4 h-4 text-gray-500 absolute left-3 top-3.5 group-focus-within/input:text-white transition-colors" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Código de Acceso</label>
                            <div className="relative group/input">
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-brand-accent focus:border-brand-accent/50 outline-none transition-all text-white placeholder-gray-500 font-mono text-sm group-hover/input:bg-white/10"
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
                            <div className="flex items-center p-3 bg-red-900/40 border border-red-500/50 text-red-200 rounded-lg text-xs animate-pulse">
                                <WarningIcon className="w-4 h-4 mr-2 flex-shrink-0 text-red-400" />
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-brand-primary hover:bg-brand-accent text-white font-bold py-3.5 rounded-lg shadow-[0_0_20px_rgba(0,40,85,0.4)] hover:shadow-[0_0_30px_rgba(2,132,199,0.5)] transition-all transform active:scale-[0.98] flex justify-center items-center gap-3 relative overflow-hidden group/btn uppercase tracking-widest text-xs border border-white/10"
                        >
                            {isLoading ? (
                                <>
                                    <LoadingSpinner className="w-4 h-4" />
                                    <span className="animate-pulse">Autenticando...</span>
                                </>
                            ) : (
                                <>
                                    <span>Iniciar Sistema</span>
                                    <StarIcon className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
            
            {/* FOOTER INFO */}
            <div className="absolute bottom-6 text-center z-10 opacity-50 hover:opacity-80 transition-opacity">
                <p className="text-[9px] text-gray-400 font-mono mb-1">
                    SISTEMA ESTRATÉGICO DE ACCESO RESTRINGIDO
                </p>
                <div className="w-12 h-[1px] bg-white/30 mx-auto"></div>
            </div>
        </div>
    );
};

export default Auth;
