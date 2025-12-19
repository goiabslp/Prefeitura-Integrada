
import React, { useState } from 'react';
import { FilePlus, Package, LayoutDashboard, History, FileText, ShieldAlert, ArrowRight, ArrowLeft, ShoppingCart, ShoppingBag, ListChecks, Gavel, FileSignature, ClipboardList, Wallet, UserCheck, ReceiptText } from 'lucide-react';
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
  stats: {
    totalGenerated: number;
    historyCount: number;
    activeUsers: number;
  };
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onNewOrder, 
  onTrackOrder,
  userName,
  permissions = [],
  stats
}) => {
  const [activeParent, setActiveParent] = useState<'oficio' | 'compras' | 'licitacao' | 'diarias' | null>(null);
  
  const canAccessOficio = permissions.includes('parent_criar_oficio');
  const canAccessCompras = permissions.includes('parent_compras');
  const canAccessLicitacao = permissions.includes('parent_licitacao');
  const canAccessDiarias = permissions.includes('parent_diarias');

  const hasAnyPermission = canAccessOficio || canAccessCompras || canAccessLicitacao || canAccessDiarias;
  const firstName = userName.split(' ')[0];

  const getBlockName = () => {
    switch (activeParent) {
      case 'oficio': return "Módulo de Ofícios";
      case 'compras': return "Módulo de Compras";
      case 'licitacao': return "Módulo de Licitação";
      case 'diarias': return "Diárias e Custeio";
      default: return "";
    }
  };

  return (
    <div className="flex-1 bg-slate-50 font-sans flex flex-col overflow-hidden">
      <main className="flex-1 flex flex-col items-center pt-12 px-6 overflow-y-auto bg-gradient-to-b from-white to-slate-50 pb-12 custom-scrollbar">
        
        {!activeParent && (
          <div className="w-full max-w-6xl animate-fade-in space-y-10">
            <div className="text-center">
              <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tighter mb-2">
                Olá, <span className="text-indigo-600">{firstName}</span>!
              </h1>
              <p className="text-slate-500 text-base font-medium">
                {hasAnyPermission ? 'Selecione um módulo para começar:' : 'Você não possui permissões de acesso.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up w-full">
              {canAccessOficio && (
                <button onClick={() => setActiveParent('oficio')} className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 hover:shadow-indigo-500/15 hover:border-indigo-300 h-64 scale-100 hover:scale-[1.02]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-indigo-600 to-indigo-700"><FileText className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Ofícios</h2>
                    <p className="text-slate-500 text-xs font-medium">Geração e histórico sequencial.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                </button>
              )}

              {canAccessCompras && (
                <button onClick={() => setActiveParent('compras')} className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 hover:shadow-emerald-500/15 hover:border-emerald-300 h-64 scale-100 hover:scale-[1.02]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-emerald-600 to-emerald-700"><ShoppingCart className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Compras</h2>
                    <p className="text-slate-500 text-xs font-medium">Pedidos e solicitações.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                </button>
              )}

              {canAccessLicitacao && (
                <button onClick={() => setActiveParent('licitacao')} className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 hover:shadow-blue-500/15 hover:border-blue-300 h-64 scale-100 hover:scale-[1.02]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-blue-600 to-blue-700"><Gavel className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight">Licitação</h2>
                    <p className="text-slate-500 text-xs font-medium">Processos licitatórios.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                </button>
              )}

              {canAccessDiarias && (
                <button onClick={() => setActiveParent('diarias')} className="group relative p-8 rounded-[2rem] border shadow-xl transition-all duration-500 text-center flex flex-col items-center justify-center overflow-hidden w-full bg-white border-slate-200 hover:shadow-amber-500/15 hover:border-amber-300 h-64 scale-100 hover:scale-[1.02]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-8 -mt-8 transition-transform duration-700 group-hover:scale-125 opacity-40"></div>
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-[1.2rem] flex items-center justify-center shadow-lg mb-3 transition-all duration-500 bg-gradient-to-br from-amber-600 to-amber-700"><Wallet className="w-8 h-8 text-white" /></div>
                    <h2 className="text-2xl font-black text-slate-900 mb-1 tracking-tight leading-tight">Diárias e Custeio</h2>
                    <p className="text-slate-500 text-xs font-medium">Gestão de despesas e diárias.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">Acessar <ArrowRight className="w-4 h-4" /></div>
                </button>
              )}
            </div>
          </div>
        )}

        {activeParent && (
          <div className="w-full max-w-6xl animate-fade-in flex flex-col items-center">
            <div className="space-y-6 w-full max-w-5xl">
              <button onClick={() => setActiveParent(null)} className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold mb-4 transition-all"><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /><span className="text-xs uppercase tracking-widest">Módulos</span></button>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">{getBlockName()}</h2>

              <div className={`grid grid-cols-1 ${activeParent === 'diarias' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8 pt-4`}>
                {activeParent === 'oficio' ? (
                  <>
                    <button onClick={onNewOrder} className="group p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl transition-all flex flex-col items-center text-center h-56 justify-center">
                      <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform"><FilePlus className="w-7 h-7 text-white" /></div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">Novo Ofício</h3>
                      <p className="text-slate-500 text-xs font-medium">Nº Atual: {(stats.totalGenerated + 1).toString().padStart(3, '0')}</p>
                    </button>
                    <button onClick={onTrackOrder} className="group p-8 bg-white border border-slate-200 rounded-[2rem] shadow-lg hover:shadow-xl transition-all flex flex-col items-center text-center h-56 justify-center">
                      <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform"><History className="w-7 h-7 text-white" /></div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">Histórico</h3>
                      <p className="text-slate-500 text-xs font-medium">Consulte documentos criados.</p>
                    </button>
                  </>
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 font-medium bg-slate-100/50 rounded-3xl border border-dashed border-slate-200">Este módulo está sendo preparado para sua prefeitura.</div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-auto py-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] shrink-0">
          <Package className="w-4 h-4" /><span>BrandDoc Integrado v1.1.2</span>
        </div>
      </main>
    </div>
  );
};
