
import React, { useState } from 'react';
import { ArrowLeft, Search, PackageX, FileText, Clock, Trash2, FileDown, Calendar, Hash } from 'lucide-react';
import { User, Order, AppState } from '../types';

interface TrackingScreenProps {
  onBack: () => void;
  currentUser: User;
  orders: Order[];
  onDownloadPdf: (snapshot?: AppState) => void;
  onClearAll: () => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ onBack, currentUser, orders, onDownloadPdf, onClearAll }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(order => {
    const hasPermission = currentUser.role === 'admin' || currentUser.role === 'licitacao' 
        ? true 
        : order.userId === currentUser.id;
    
    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.title.toLowerCase().includes(searchTerm.toLowerCase());

    return hasPermission && matchesSearch;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'canceled': return 'bg-slate-50 text-slate-500 border-slate-100';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-[85vh]">
        
        {/* Header da Central de Pedidos */}
        <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
               <button 
                 onClick={onBack}
                 className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
               >
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 Voltar ao Dashboard
               </button>
               <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                 <HistoryIcon /> Histórico de Documentos
               </h2>
               <p className="text-slate-500 text-sm mt-1 font-medium">
                 {currentUser.role === 'admin' ? 'Gerenciamento global de registros.' : 'Seus documentos gerados recentemente.'}
               </p>
             </div>
             
             <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-80 group">
                   <input
                     type="text"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     placeholder="Buscar por Título ou Número..."
                     className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all group-hover:bg-white"
                   />
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                {currentUser.role === 'admin' && orders.length > 0 && (
                   <button 
                     onClick={onClearAll}
                     className="p-3.5 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase"
                     title="Limpar Todo o Histórico"
                   >
                     <Trash2 className="w-5 h-5" />
                     <span className="hidden lg:inline">Limpar Tudo</span>
                   </button>
                )}
             </div>
          </div>
        </div>

        {/* Listagem em Formato de Tabela/Linhas */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredOrders.length > 0 ? (
            <div className="min-w-full inline-block align-middle">
              <div className="border-b border-slate-100 bg-slate-50/50 hidden md:grid md:grid-cols-12 gap-4 px-8 py-4">
                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Hash className="w-3 h-3" /> Nº Ofício</div>
                <div className="md:col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3 h-3" /> Título do Documento</div>
                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Data de Criação</div>
                <div className="md:col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredOrders.map(order => (
                  <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 hover:bg-slate-50/80 transition-colors items-center">
                    
                    {/* Número do Ofício */}
                    <div className="md:col-span-2 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center md:hidden">
                          <Hash className="w-4 h-4" />
                       </div>
                       <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/50">
                          {order.protocol}
                       </span>
                    </div>

                    {/* Título */}
                    <div className="md:col-span-6">
                       <h3 className="text-sm font-bold text-slate-800 leading-tight">{order.title}</h3>
                    </div>

                    {/* Data */}
                    <div className="md:col-span-2 flex items-center gap-2 text-slate-500 text-xs font-medium">
                       <Clock className="w-3 h-3 opacity-40" />
                       {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {/* Ações */}
                    <div className="md:col-span-2 flex items-center justify-end gap-2 pt-3 md:pt-0">
                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status)} mr-2`}>
                          Concluído
                       </span>
                       <button 
                         onClick={() => onDownloadPdf(order.documentSnapshot)}
                         className="p-2 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20"
                         title="Baixar PDF Original"
                       >
                          <FileDown className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 animate-fade-in">
               <div className="p-6 bg-slate-50 rounded-full mb-6 ring-8 ring-slate-50/50">
                 <PackageX className="w-12 h-12 opacity-30" />
               </div>
               <p className="text-lg font-bold text-slate-500">Histórico Vazio</p>
               <p className="text-sm text-slate-400 mt-1 max-w-xs text-center">Nenhum documento foi finalizado até o momento. Seus ofícios aparecerão aqui após serem concluídos.</p>
            </div>
          )}
        </div>

        {/* Footer da Central */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <span>Total: {filteredOrders.length} registros</span>
           <span className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             Armazenamento IndexedDB Ativo
           </span>
        </div>
      </div>
    </div>
  );
};

const HistoryIcon = () => (
  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
    <FileText className="w-6 h-6 text-white" />
  </div>
);
