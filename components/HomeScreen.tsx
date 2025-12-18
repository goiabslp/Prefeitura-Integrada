
import React from 'react';
import { FilePlus, Search, Package, ArrowRight, FileText, LogOut, Lock, Menu, LayoutDashboard } from 'lucide-react';
import { UserRole, UIConfig } from '../types';
import { AdminDashboard } from './AdminDashboard';

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
  const isAdmin = userRole === 'admin';
  const canCreateOrder = userRole === 'admin' || userRole === 'collaborator';
  
  // Fallbacks
  const logoUrl = uiConfig?.homeLogoUrl || "https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png";
  const logoHeight = uiConfig?.homeLogoHeight || 56;
  const isLogoCentered = uiConfig?.homeLogoPosition === 'center';

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white flex flex-col">
      {/* Navbar Dinâmica */}
      <nav className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full relative shrink-0">
        <div className="flex items-center gap-4 z-20">
           {isAdmin && (
             <button 
               onClick={() => onOpenAdmin(null)}
               className="p-2 -ml-2 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md text-slate-700 transition-all hover:text-indigo-600"
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
                   alt="Logo Aplicação" 
                   style={{ height: `${logoHeight}px` }}
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
                alt="Logo Aplicação" 
                style={{ height: `${logoHeight}px` }}
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

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-20 overflow-y-auto custom-scrollbar">
        {isAdmin ? (
          <AdminDashboard 
            userName={userName}
            onNewOrder={onNewOrder}
            onManageUsers={() => onOpenAdmin('users')}
            onSettings={() => onOpenAdmin('design')}
            onHistory={onTrackOrder}
            onSignatures={() => onOpenAdmin('signatures')}
          />
        ) : (
          <div className="h-full flex flex-col justify-center items-center max-w-7xl mx-auto">
            <div className="text-center mb-12 space-y-4 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                Olá, <span className="text-indigo-600">{userName.split(' ')[0]}</span>
              </h1>
              <p className="text-lg text-slate-500 max-w-xl mx-auto font-medium">
                {userRole === 'licitacao' 
                  ? 'Acompanhe todos os pedidos e processos em andamento.'
                  : 'Gerencie seus documentos e propostas de forma centralizada.'}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full animate-slide-up">
              {/* Card Novo Pedido */}
              <button
                onClick={onNewOrder}
                disabled={!canCreateOrder}
                className={`group relative p-8 rounded-[2.5rem] border shadow-xl transition-all duration-300 text-left flex flex-col justify-between overflow-hidden h-64 md:h-80 ${
                  canCreateOrder 
                    ? 'bg-white border-slate-200 shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 cursor-pointer' 
                    : 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                {canCreateOrder ? (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
                ) : null}
                
                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg mb-6 transition-all duration-300 ${
                     canCreateOrder ? 'bg-indigo-600 shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3' : 'bg-slate-300'
                  }`}>
                    {canCreateOrder ? <FilePlus className="w-8 h-8 text-white" /> : <Lock className="w-6 h-6 text-slate-500"/>}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                     {canCreateOrder ? 'Novo Pedido' : 'Criação Restrita'}
                  </h2>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">
                    {canCreateOrder 
                      ? 'Crie uma nova proposta, personalize a identidade visual e gere o PDF com IA.'
                      : 'Seu perfil permite apenas a visualização e acompanhamento de pedidos.'}
                  </p>
                </div>

                {canCreateOrder && (
                  <div className="relative z-10 flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mt-4 group-hover:translate-x-2 transition-transform">
                    Começar Agora
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>

              {/* Card Acompanhar Pedido */}
              <button
                onClick={onTrackOrder}
                className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-200 transition-all duration-300 text-left flex flex-col justify-between overflow-hidden h-64 md:h-80"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Acompanhar</h2>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">
                     {userRole === 'collaborator' 
                        ? 'Verifique o status e histórico dos seus documentos gerados recentemente.'
                        : 'Acesso completo ao status de todos os pedidos do sistema municipal.'}
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mt-4 group-hover:translate-x-2 transition-transform">
                  Consultar Status
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          <Package className="w-4 h-4" />
          <span>BrandDoc Integrado v1.0.0</span>
        </div>
      </main>
    </div>
  );
};
