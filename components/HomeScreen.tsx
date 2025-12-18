
import React, { useState } from 'react';
import { FilePlus, Package, LogOut, LayoutDashboard, History, FileText, ShieldAlert, ArrowRight, ArrowLeft, ShoppingCart, ShoppingBag, ListChecks, Gavel, FileSignature, ClipboardList, Wallet, Banknote, UserCheck, ReceiptText } from 'lucide-react';
import { UserRole, UIConfig, AppPermission } from '../types';

interface HomeScreenProps {
  onNewOrder: () => void;
  onTrackOrder: () => void;
  onLogout: () => void;
  onOpenAdmin: (tab?: string | null) => void;
  userRole: UserRole;
  userName: string;
  userJobTitle?: string;
  uiConfig?: UIConfig;
  permissions: AppPermission[];
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNewOrder, 
  onTrackOrder,
  onLogout, 
  onOpenAdmin,
  userRole, 
  userName,
  userJobTitle,
  uiConfig,
  permissions = []
}) => {
  const [activeParent, setActiveParent] = useState<'oficio' | 'compras' | 'licitacao' | 'diarias' | null>(null);
  
  const canAccessAdmin = permissions.includes('parent_admin');
  const canAccessOficio = permissions.includes('parent_criar_oficio');
  const canAccessCompras = permissions.includes('parent_compras');
  const canAccessLicitacao = permissions.includes('parent_licitacao');
  const canAccessDiarias = permissions.includes('parent_diarias');

  const hasAnyPermission = canAccessOficio || canAccessCompras || canAccessLicitacao || canAccessDiarias;

  const logoUrl = uiConfig?.headerLogoUrl || "https://saojosedogoiabal.mg.gov.br/wp-content/uploads/2021/01/logo.png";
  const logoHeight = uiConfig?.headerLogoHeight || 40;
  const isLogoCentered = uiConfig?.homeLogoPosition === 'center';

  const firstName = userName.split(' ')[0];

  // Determina o nome do bloco atual para exibição no header
  const getBlockName = () => {
    if (!activeParent) return "Início";
    switch (activeParent) {
      case 'oficio': return "Módulo de Ofícios";
      case 'compras': return "Módulo de Compras";
      case 'licitacao': return "Módulo de Licitação";
      case 'diarias': return "Diárias e Custeio";
      default: return "Início";
    }
  };

  return (
    <div className="h-screen bg-slate-50 font-sans selection:bg-indigo-500 selection:text-white flex flex-col overflow-hidden">
      {/* Navbar - Bloco Pai Admin */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0 shadow-sm z-30">
        <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full relative">
          <div className="flex items-center gap-4 z-20">
             {/* Validação Bloco Pai: Painel Administrativo */}
             {canAccessAdmin && (
               <button 
                 onClick={() => onOpenAdmin(null)}
                 className="p-2 -ml-2 rounded-xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md text-slate-700 transition-all hover:text-indigo-600"
                 title="Painel Administrativo"
               >
                 <LayoutDashboard className="w-6 h-6" />
               </button>
             )}
             
             <div className="flex items-center gap-3">
               {!isLogoCentered && logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    style={{ height: `${logoHeight}px` }}
                    className="w-auto object-contain transition-all duration-300" 
                  />
               )}
               <span className="text-xl font-bold text-slate-900 tracking-tight transition-all duration-300">
                  {getBlockName()}
               </span>
             </div>
          </div>

          {isLogoCentered && logoUrl && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
               <img 
                  src={logoUrl} 
                  alt="Logo" 
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
      </header>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center justify-center pt-8 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50">
        
        {!activeParent && (
          <div className="text-center mb-10 animate-fade-in shrink-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Olá, <span className="text-indigo-600">{firstName}</span>!
            </h1>
            <p className="text-slate-500 text-base font-medium">
              {hasAnyPermission ? 'Selecione um bloco para começar:' : 'Você não possui permissões de acesso.'}
            </p>
          </div>
        )}

        <div className="w-full max-w-6xl transition-all duration-500 ease-in-out flex flex-col items-center">
          {!activeParent ? (
            <div className={`grid grid-cols-1 ${[canAccessOficio, canAccessCompras, canAccessLicitacao, canAccessDiarias].filter(Boolean).length > 1 ? 'md:grid-cols-2 lg:grid-cols-4' : 'max-w-xl mx-auto'} gap-6 animate-slide-up w-full`}>
              {/* Bloco Pai: Criar Ofício */}
              {canAccessOficio && (
                <button
                  onClick={() => setActiveParent('oficio')}
                  className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 shadow-indigo-500/5 hover:shadow-indigo-500/15 hover:border-indigo-300 cursor-pointer h-64 scale-100 hover:scale-[1.01]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-indigo-500/30 group-hover:scale-110 group-hover:rotate-3">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Ofícios</h2>
                    <p className="text-slate-500 font-medium leading-relaxed text-xs max-w-[200px] mx-auto">Documentos oficiais e histórico.</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-indigo-600 font-black text-[9px] uppercase tracking-[0.2em] mt-4 group-hover:gap-4 transition-all duration-300">
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Bloco Pai: Compras */}
              {canAccessCompras && (
                <button
                  onClick={() => setActiveParent('compras')}
                  className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 shadow-emerald-500/5 hover:shadow-emerald-500/15 hover:border-emerald-300 cursor-pointer h-64 scale-100 hover:scale-[1.01]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/30 group-hover:scale-110 group-hover:-rotate-3">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Compras</h2>
                    <p className="text-slate-500 font-medium leading-relaxed text-xs max-w-[200px] mx-auto">Pedidos e solicitações.</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-[0.2em] mt-4 group-hover:gap-4 transition-all duration-300">
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Bloco Pai: Licitação */}
              {canAccessLicitacao && (
                <button
                  onClick={() => setActiveParent('licitacao')}
                  className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 shadow-blue-500/5 hover:shadow-blue-500/15 hover:border-blue-300 cursor-pointer h-64 scale-100 hover:scale-[1.01]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6">
                      <Gavel className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Licitação</h2>
                    <p className="text-slate-500 font-medium leading-relaxed text-xs max-w-[200px] mx-auto">Processos licitatórios.</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-blue-600 font-black text-[9px] uppercase tracking-[0.2em] mt-4 group-hover:gap-4 transition-all duration-300">
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Bloco Pai: Diárias e Custeio */}
              {canAccessDiarias && (
                <button
                  onClick={() => setActiveParent('diarias')}
                  className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 shadow-amber-500/5 hover:shadow-amber-500/15 hover:border-amber-300 cursor-pointer h-64 scale-100 hover:scale-[1.01]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-amber-600 to-amber-700 shadow-amber-500/30 group-hover:scale-110 group-hover:-rotate-6">
                      <Wallet className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight leading-tight">Diárias e Custeio</h2>
                    <p className="text-slate-500 font-medium leading-relaxed text-xs max-w-[200px] mx-auto">Gestão de despesas e diárias.</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-2 text-amber-600 font-black text-[9px] uppercase tracking-[0.2em] mt-4 group-hover:gap-4 transition-all duration-300">
                    Acessar <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {!hasAnyPermission && (
                <div className="p-10 rounded-[2.5rem] border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center w-full max-w-xl mx-auto opacity-60 col-span-full">
                   <ShieldAlert className="w-12 h-12 text-slate-300 mb-4" />
                   <h2 className="text-xl font-bold text-slate-600">Acesso Restrito</h2>
                   <p className="text-slate-500 text-sm mt-2">Você não possui blocos funcionais ativos. Contate o administrador.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in w-full max-w-5xl">
              <div className="flex flex-col items-center text-center mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {getBlockName()}
                </h2>
                <p className="text-slate-500 text-sm font-medium">Funcionalidades do bloco pai selecionado.</p>
              </div>

              <button 
                onClick={() => setActiveParent(null)}
                className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold transition-all mb-4"
              >
                <div className="p-1.5 rounded-full bg-white border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-xs">Voltar aos Blocos</span>
              </button>

              <div className={`grid grid-cols-1 ${activeParent === 'diarias' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8`}>
                {activeParent === 'oficio' ? (
                  <>
                    <button
                      onClick={onNewOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-indigo-300 hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <FilePlus className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Novo Ofício</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Inicie a criação de um novo documento oficial.</p>
                      <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Criar <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={onTrackOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-purple-300 hover:shadow-purple-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <History className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Histórico</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Consulte todos os documentos criados.</p>
                      <div className="mt-4 flex items-center gap-2 text-purple-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Ver <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                ) : activeParent === 'compras' ? (
                  <>
                    <button
                      onClick={onNewOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-emerald-300 hover:shadow-emerald-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <ShoppingBag className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Novo Pedido</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Solicite novos suprimentos ou serviços.</p>
                      <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Abrir <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={onTrackOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-blue-300 hover:shadow-blue-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <ListChecks className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Acompanhar Pedido</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Verifique o status das suas compras.</p>
                      <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Ver <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                ) : activeParent === 'licitacao' ? (
                  <>
                    <button
                      onClick={onNewOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-blue-400 hover:shadow-blue-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <FileSignature className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Nova Demanda</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Inicie uma solicitação de processo licitatório.</p>
                      <div className="mt-4 flex items-center gap-2 text-blue-700 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Criar <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={onTrackOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-indigo-400 hover:shadow-indigo-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <ClipboardList className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Acompanhar Demanda</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Gestão de todas as demandas enviadas.</p>
                      <div className="mt-4 flex items-center gap-2 text-indigo-700 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Ver <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onNewOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-amber-400 hover:shadow-amber-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <UserCheck className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Nova Diária</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Solicite uma nova diária de viagem.</p>
                      <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Criar <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={onNewOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-rose-400 hover:shadow-rose-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <ReceiptText className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Novo Custeio</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Inicie uma solicitação de custeio/reembolso.</p>
                      <div className="mt-4 flex items-center gap-2 text-rose-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Criar <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>

                    <button
                      onClick={onTrackOrder}
                      className="group relative p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl hover:border-slate-400 hover:shadow-slate-500/5 transition-all duration-500 flex flex-col items-center text-center overflow-hidden h-56 justify-center"
                    >
                      <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-50 rounded-full opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center shadow-lg shadow-slate-500/20 mb-4 group-hover:scale-110 transition-all duration-300 relative z-10">
                        <History className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">Histórico</h3>
                      <p className="text-slate-500 font-medium text-xs relative z-10 max-w-[180px]">Gestão de todas as solicitações enviadas.</p>
                      <div className="mt-4 flex items-center gap-2 text-slate-700 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                        Ver <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto py-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] shrink-0">
          <Package className="w-4 h-4" />
          <span>BrandDoc Integrado v1.1.0</span>
        </div>
      </main>
    </div>
  );
};
