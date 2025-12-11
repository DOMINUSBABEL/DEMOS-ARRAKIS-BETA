
import React, { useState } from 'react';
import { FingerPrintIcon, UserGroupIcon, LoadingSpinner, WarningIcon, TalleyrandLogoIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        // Simulate network delay for effect
        await new Promise(resolve => setTimeout(resolve, 800));

        try {
            if (!username.trim() || !password.trim()) {
                throw new Error("Por favor completa todos los campos.");
            }

            const validUsers = ['DEMOS', 'ISAAC', 'BABEL'];
            const u = username.toUpperCase();
            const p = password.toUpperCase();

            // Check if username is valid and password matches username
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
        <div className="min-h-screen bg-light-bg flex flex-col justify-center items-center p-4 relative">
            {/* Branding Corner Logo */}
            <div className="absolute top-6 left-6 flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                <TalleyrandLogoIcon className="w-12 h-12" />
                <div className="flex flex-col">
                    <span className="text-xl font-serif font-bold text-brand-primary tracking-wide leading-none">CONSULTORA</span>
                    <span className="text-lg font-serif font-bold text-brand-primary tracking-[0.2em] leading-none">TALLEYRAND</span>
                </div>
            </div>

            <div className="mb-8 text-center animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-4 bg-brand-primary rounded-xl shadow-lg mb-4">
                    <FingerPrintIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-black text-brand-primary tracking-tight font-serif">DEMOS ARRAKIS</h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Sistema de Inteligencia Electoral</p>
                <div className="mt-3 inline-block px-3 py-1 bg-white border border-gray-200 rounded-full shadow-sm">
                    <p className="text-[10px] text-brand-primary font-serif font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="text-gray-400">By</span> Consultora Talleyrand
                    </p>
                </div>
            </div>

            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-report-lg border border-gray-200 relative overflow-hidden animate-fade-in">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-blue-500 to-brand-secondary"></div>

                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                    Acceso Autorizado
                </h2>

                <form onSubmit={handleAction} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Usuario</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="ID Operativo"
                            />
                            <UserGroupIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Clave de Acceso</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                            <WarningIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-[0.98] flex justify-center items-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : 'Iniciar Sesión Segura'}
                    </button>
                </form>
            </div>
            
            <div className="mt-8 text-center max-w-xs space-y-2">
                <p className="text-[10px] text-gray-400 font-mono">
                    SISTEMA DE USO EXCLUSIVO PARA PERSONAL AUTORIZADO (DEMOS/ISAAC/BABEL). <br/>
                    DEMOS ARRAKIS v3.0
                </p>
                <p className="text-[9px] text-brand-primary/60 font-serif italic border-t border-gray-200 pt-2">
                    Desarrollado por Consultora Talleyrand © 2025
                </p>
            </div>
        </div>
    );
};

export default Auth;
