
import React, { useState } from 'react';
import { FilePlus, Package, ArrowRight, LogOut, LayoutDashboard, History, ArrowLeft, FileText, Sparkles } from 'lucide-react';
import { UserRole, UIConfig } from '../types';

interface HomeScreenProps {
  onNewOrder: () => void;
  onTrackOrder: () => void;
  onLogout: () => void;
  onOpenAdmin: (tab?: string | null) => void;
  userRole: UserRole;
  userName: string;
  userJobTitle?: string;
  uiConfig?: UIConfig;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNewOrder, 
  onTrackOrder,
  onLogout, 
  onOpenAdmin,
  userRole, 
  userName,
  userJobTitle,
  uiConfig
}) => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const isAdmin = userRole === 'admin';
  const canCreateOrder = userRole === 'admin' || userRole === 'collaborator';
  
  const logoUrl = uiConfig?.homeLogoUrl || "https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png";
  const logoHeight = uiConfig?.homeLogoHeight || 56;
  const isLogoCentered = uiConfig?.homeLogoPosition === 'center';

  const handleMainClick = () => {
    if (canCreateOrder) {
      setShowSubMenu(true);
    }
  };

  // Pega apenas o primeiro nome para uma saudação mais amigável
  const firstName = userName.split(' ')[0];

  return (
    <div className="h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-hidden">
      {/* Navbar com Separador Visual */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0 shadow-sm z-30">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full relative">
          <div className="flex items-center gap-4 z-20">
             {isAdmin && (
               <button 
                 onClick={() => onOpenAdmin(null)}
                 className="p-2 -ml-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md text-slate-700 transition-all hover:text-indigo-600"
                 title="Painel Administrativo"
               >
                 <LayoutDashboard className="w-6 h-6" />
               </button>
             )}
             
             {!isLogoCentered && (
               <div className="flex items-center gap-2">
                 {logoUrl ? (
                   <img 
                     src={logoUrl} 
                     alt="Logo" 
                     style={{ height: `${logoHeight * 0.8}px` }}
                     className="w-auto object-contain transition-all duration-300" 
                   />
                 ) : (
                   <span className="text-xl font-bold text-slate-900 tracking-tight">BrandDoc Pro</span>
                 )}
               </div>
             )}
          </div>

          {isLogoCentered && logoUrl && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
               <img 
                  src={logoUrl} 
                  alt="Logo" 
                  style={{ height: `${logoHeight * 0.8}px` }}
                  className="w-auto object-contain transition-all duration-300" 
               />
            </div>
          )}

          <div className="flex items-center gap-4 z-20">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{userName}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                   {userJobTitle ? userJobTitle : (userRole === 'admin' ? 'Administrador' : userRole === 'licitacao' ? 'Licitação' : 'Colaborador')}
                </p>
             </div>
             <button 
               onClick={onLogout}
               className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all hover:rotate-12"
               title="Sair"
             >
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </nav>
      </header>

      {/* Área de Conteúdo Principal com Espaçamento Superior (pt-12) */}
      <main className="flex-1 flex flex-col items-center justify-center pt-12 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        
        {/* Mensagem de Boas-Vindas Mais Compacta */}
        {!showSubMenu && (
          <div className="text-center mb-8 animate-fade-in shrink-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-1">
              Olá, <span className="text-indigo-600">{firstName}</span>!
            </h1>
            <p className="text-slate-500 text-base font-medium">
              O que você deseja fazer hoje?
            </p>
          </div>
        )}

        <div className="w-full max-w-4xl transition-all duration-500 ease-in-out flex flex-col items-center">
          {!showSubMenu ? (
            <div className="flex flex-col items-center animate-slide-up w-full">
              <button
                onClick={handleMainClick}
                disabled={!canCreateOrder}
                className={`group relative p-8 md:p-10 rounded-[2.5rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full max-w-xl h-64 md:h-[280px] ${
                  canCreateOrder 
                    ? 'bg-white border-slate-200 shadow-indigo-500/5 hover:shadow-indigo-500/15 hover:border-indigo-300 cursor-pointer scale-100 hover:scale-[1.01]' 
                    : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-50 rounded-tr-full -ml-8 -mb-8 transition-transform duration-700 group-hover:scale-125 opacity-30"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] flex items-center justify-center shadow-xl mb-4 transition-all duration-500 ${
                     canCreateOrder 
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3' 
                      : 'bg-slate-300'
                  }`}>
                    <FileText className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  
                  <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
                     Criar Ofício
                  </h2>
                  
                  <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base max-w-sm mx-auto">
                    {canCreateOrder 
                      ? 'Crie documentos de maneira rápida e profissional'
                      : 'Sua permissão não permite criar novos documentos.'}
                  </p>
                </div>

                {canCreateOrder && (
                  <div className="relative z-10 flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] mt-6 group-hover:gap-5 transition-all duration-300">
                    Acessar Opções
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in w-full">
              <div className="flex flex-col items-center text-center mb-4">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Escolha uma ação</h2>
                <p className="text-slate-500 text-sm font-medium">Selecione entre criar ou consultar.</p>
              </div>

              <button 
                onClick={() => setShowSubMenu(false)}
                className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all mb-2"
              >
                <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-xs">Voltar</span>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Opção: Novo Ofício */}
                <button
                  onClick={onNewOrder}
                  className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-indigo-300 hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-48 md:h-56 justify-center"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <FilePlus className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Novo Ofício</h3>
                  <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">
                    Inicie a criação de um novo documento.
                  </p>
                  
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                    Criar <ArrowRight className="w-3 h-3" />
                  </div>
                </button>

                {/* Opção: Histórico */}
                <button
                  onClick={onTrackOrder}
                  className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-purple-300 hover:shadow-purple-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-48 md:h-56 justify-center"
                >
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                  
                  <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                    <History className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Histórico</h3>
                  <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">
                    Gerencie ofícios já criados.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                    Acessar <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto py-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] shrink-0">
          <Package className="w-4 h-4" />
          <span>BrandDoc Integrado v1.0.0</span>
        </div>
      </main>
    </div>
  );
};
