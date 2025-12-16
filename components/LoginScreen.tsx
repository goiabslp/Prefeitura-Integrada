
import React, { useState } from 'react';
import { User, Lock, ArrowRight, FileText, Sparkles } from 'lucide-react';
import { UIConfig } from '../types';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => boolean;
  uiConfig: UIConfig;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, uiConfig }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simula um pequeno delay para a UX
    setTimeout(() => {
        const success = onLogin(username, password);
        if (!success) {
          setError('Usuário ou senha incorretos.');
          setLoading(false);
        }
    }, 600);
  };

  const logoUrl = uiConfig?.homeLogoUrl;
  // Aumenta um pouco o tamanho base para a tela de login para ter mais impacto
  const logoHeight = uiConfig?.homeLogoHeight ? uiConfig.homeLogoHeight * 1.5 : 80;

  return (
    <div className="min-h-screen font-sans flex items-center justify-center p-6 relative overflow-hidden bg-slate-900">
      
      {/* Background Dinâmico */}
      <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 rounded-full blur-[120px] animate-fade-in delay-100"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[60%] bg-purple-600/20 rounded-full blur-[100px] animate-fade-in delay-300"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-slide-up relative z-10 flex flex-col">
        
        {/* Logo Section */}
        <div className="pt-10 pb-6 text-center flex flex-col items-center justify-center relative">
           <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
           
           <div className="mb-6 relative group">
              {logoUrl ? (
                 <div className="relative z-10 p-2">
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      style={{ height: `${logoHeight}px` }}
                      className="object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105"
                    />
                 </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/40 flex items-center justify-center mx-auto transform rotate-3 transition-transform duration-500 hover:rotate-6">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              )}
              
              {/* Glow effect behind logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 blur-xl rounded-full -z-10 group-hover:bg-white/30 transition-all duration-500"></div>
           </div>

           {!logoUrl && <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">BrandDoc Pro</h1>}
           <p className="text-sm text-indigo-100/80 mt-2 font-medium">Acesse seu ambiente de trabalho</p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-100 uppercase ml-1 tracking-wider opacity-80">Usuário</label>
            <div className="relative group">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:bg-slate-900/60 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 backdrop-blur-md"
                placeholder="Digite seu usuário"
              />
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/70 group-focus-within:text-indigo-400 transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-indigo-100 uppercase ml-1 tracking-wider opacity-80">Senha</label>
            <div className="relative group">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:bg-slate-900/60 focus:border-indigo-400/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 backdrop-blur-md"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300/70 group-focus-within:text-indigo-400 transition-colors" />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-200 text-xs font-medium text-center animate-fade-in flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all duration-300 flex items-center justify-center gap-2 group mt-6 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
        
        <div className="bg-slate-950/30 p-4 text-center border-t border-white/5 backdrop-blur-md flex items-center justify-center gap-2 text-indigo-200/40">
           <Sparkles className="w-3 h-3" />
           <p className="text-[10px] font-medium tracking-widest uppercase">Plataforma Segura v1.0.0</p>
        </div>
      </div>
    </div>
  );
};
