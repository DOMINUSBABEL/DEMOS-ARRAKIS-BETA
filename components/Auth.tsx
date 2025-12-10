
import React, { useState } from 'react';
import { FingerPrintIcon, UserGroupIcon, LoadingSpinner, WarningIcon } from './Icons';
import { User } from '../types';

interface AuthProps {
    onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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

            const storedUsers = JSON.parse(localStorage.getItem('demos_users') || '[]');

            if (isRegistering) {
                if (password !== confirmPassword) {
                    throw new Error("Las contraseñas no coinciden.");
                }
                
                const userExists = storedUsers.find((u: any) => u.username === username);
                if (userExists) {
                    throw new Error("El usuario ya existe.");
                }

                const newUser = { username, password, role: 'admin' }; // Default to admin for this app
                localStorage.setItem('demos_users', JSON.stringify([...storedUsers, newUser]));
                
                // Auto login after register
                localStorage.setItem('demos_current_user', JSON.stringify({ username, role: 'admin' }));
                onLogin({ username, role: 'admin' });

            } else {
                const user = storedUsers.find((u: any) => u.username === username && u.password === password);
                if (!user) {
                    throw new Error("Credenciales inválidas.");
                }
                
                const userData = { username: user.username, role: user.role };
                localStorage.setItem('demos_current_user', JSON.stringify(userData));
                onLogin(userData as User);
            }
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-light-bg flex flex-col justify-center items-center p-4">
            <div className="mb-8 text-center animate-fade-in-up">
                <div className="inline-flex items-center justify-center p-4 bg-brand-primary rounded-xl shadow-lg mb-4">
                    <FingerPrintIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl font-black text-brand-primary tracking-tight font-serif">DEMOS ARRAKIS</h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.3em] mt-2">Sistema de Inteligencia Electoral</p>
            </div>

            <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-report-lg border border-gray-200 relative overflow-hidden animate-fade-in">
                {/* Decorative top bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-primary via-blue-500 to-brand-secondary"></div>

                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                    {isRegistering ? 'Crear Nueva Cuenta' : 'Acceso Autorizado'}
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
                                placeholder="Nombre de usuario"
                            />
                            <UserGroupIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {isRegistering && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirmar Contraseña</label>
                            <input 
                                type="password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

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
                        {isLoading ? <LoadingSpinner className="w-5 h-5" /> : (isRegistering ? 'Registrar Usuario' : 'Ingresar al Sistema')}
                    </button>
                </form>

                <div className="mt-6 text-center pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        {isRegistering ? '¿Ya tienes acceso?' : '¿No tienes cuenta?'}
                        <button 
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                            className="ml-2 font-bold text-brand-primary hover:underline"
                        >
                            {isRegistering ? 'Iniciar Sesión' : 'Crear Cuenta'}
                        </button>
                    </p>
                </div>
            </div>
            
            <p className="mt-8 text-[10px] text-gray-400 font-mono text-center max-w-xs">
                SISTEMA DE USO EXCLUSIVO PARA PERSONAL AUTORIZADO. <br/>
                DEMOS ARRAKIS v2.1
            </p>
        </div>
    );
};

export default Auth;
