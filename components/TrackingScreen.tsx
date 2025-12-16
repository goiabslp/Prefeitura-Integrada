
import React, { useState } from 'react';
import { ArrowLeft, Search, PackageX, FileText, Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react';
import { User, Order } from '../types';

interface TrackingScreenProps {
  onBack: () => void;
  currentUser: User;
  orders: Order[];
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ onBack, currentUser, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Lógica de filtragem
  const filteredOrders = orders.filter(order => {
    // Regra 1: Colaborador vê apenas seus pedidos. Admin e Licitação veem todos.
    const hasPermission = currentUser.role === 'admin' || currentUser.role === 'licitacao' 
        ? true 
        : order.userId === currentUser.id;
    
    // Regra 2: Busca por texto (Protocolo ou Título)
    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.title.toLowerCase().includes(searchTerm.toLowerCase());

    return hasPermission && matchesSearch;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'canceled': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Em Análise';
      case 'canceled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-[85vh]">
        <div className="p-8 border-b border-slate-100 shrink-0">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-semibold mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </button>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
             <div>
               <h2 className="text-2xl font-bold text-slate-900 mb-1">Central de Pedidos</h2>
               <p className="text-slate-500 text-sm">
                 {currentUser.role === 'collaborator' 
                   ? 'Histórico dos seus pedidos recentes.' 
                   : 'Visão geral de todos os pedidos do sistema.'}
               </p>
             </div>
             
             <div className="relative w-full md:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar por protocolo..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
               {filteredOrders.map(order => (
                 <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                       <div className={`p-3 rounded-xl mt-1 ${
                          order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-50 text-slate-400'
                       }`}>
                          <FileText className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{order.protocol}</span>
                             <span className="text-xs text-slate-400 flex items-center gap-1">
                               <Clock className="w-3 h-3" /> {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                             </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800">{order.title}</h3>
                          {(currentUser.role === 'admin' || currentUser.role === 'licitacao') && (
                            <p className="text-xs text-indigo-600 font-medium mt-1">Solicitante: {order.userName}</p>
                          )}
                       </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                       <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)} flex items-center gap-1.5`}>
                          {order.status === 'completed' && <CheckCircle2 className="w-3 h-3"/>}
                          {order.status === 'pending' && <AlertCircle className="w-3 h-3"/>}
                          {getStatusLabel(order.status)}
                       </span>
                       <button className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                          Detalhes
                       </button>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 animate-fade-in">
               <div className="p-4 bg-slate-50 rounded-full mb-4">
                 <Filter className="w-8 h-8 opacity-50" />
               </div>
               <p className="font-medium">Nenhum pedido encontrado.</p>
               <p className="text-sm">Tente ajustar seus filtros de busca.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
