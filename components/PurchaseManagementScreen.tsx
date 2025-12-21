
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, Search, Inbox, Clock, Trash2, 
  FileDown, CheckCircle2, XCircle, AlertCircle, Loader2,
  User, ShoppingBag, Eye, X, Lock, ChevronDown, PackageCheck, Truck, ShoppingCart, CheckCircle,
  History, Calendar, UserCheck, ArrowDown
} from 'lucide-react';
import { User as UserType, Order, AppState, StatusMovement } from '../types';
import { DocumentPreview } from './DocumentPreview';

interface PurchaseManagementScreenProps {
  onBack: () => void;
  currentUser: UserType;
  orders: Order[];
  onDownloadPdf: (snapshot?: AppState) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  onUpdatePurchaseStatus?: (orderId: string, purchaseStatus: Order['purchaseStatus']) => void;
  onDeleteOrder: (id: string) => void;
}

export const PurchaseManagementScreen: React.FC<PurchaseManagementScreenProps> = ({ 
  onBack, 
  currentUser,
  orders, 
  onDownloadPdf, 
  onUpdateStatus,
  onUpdatePurchaseStatus,
  onDeleteOrder
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Order['status'] | 'all'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [openStatusDropdown, setOpenStatusDropdown] = useState<string | null>(null);
  const [historyOrder, setHistoryOrder] = useState<Order | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenStatusDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = currentUser.role === 'admin';
  const isComprasUser = currentUser.role === 'compras';

  const purchaseOrders = orders.filter(order => order.blockType === 'compras');

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.userName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    if (isComprasUser) {
      const isFinalized = order.status === 'approved' || order.status === 'rejected';
      return matchesSearch && matchesStatus && isFinalized;
    }

    return matchesSearch && matchesStatus;
  });

  const handleDownload = (order: Order) => {
    setDownloadingId(order.id);
    onDownloadPdf(order.documentSnapshot);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black uppercase tracking-widest"><XCircle className="w-3 h-3" /> Rejeitado</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-black uppercase tracking-widest"><Clock className="w-3 h-3 animate-pulse" /> Pendente</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-100 text-[10px] font-black uppercase tracking-widest"><AlertCircle className="w-3 h-3" /> Recebido</span>;
    }
  };

  const purchaseStatusMap = {
    recebido: { label: 'Pedido Recebido', icon: <PackageCheck className="w-3.5 h-3.5" />, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    andamento: { label: 'Em andamento', icon: <Truck className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    realizado: { label: 'Pedido Realizado', icon: <ShoppingCart className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    concluido: { label: 'Concluído', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-slate-900 text-white border-slate-900' },
    cancelado: { label: 'Cancelado', icon: <XCircle className="w-3.5 h-3.5" />, color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const PurchaseStatusSelector = ({ order }: { order: Order }) => {
    const current = purchaseStatusMap[order.purchaseStatus || 'recebido'];
    const isApproved = order.status === 'approved';
    const lastMovement = order.statusHistory && order.statusHistory.length > 0 
      ? order.statusHistory[order.statusHistory.length - 1] 
      : null;

    if (!isApproved) return null;

    return (
      <div className="flex flex-col gap-1.5 items-end">
        <div className="flex items-center gap-2">
          {/* Botão de Histórico que abre o MODAL GRANDE */}
          <button 
            onClick={() => setHistoryOrder(order)}
            className="p-2 rounded-xl border bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:bg-indigo-50/50"
            title="Ver Histórico de Movimentação"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Seletor ou Badge de Status */}
          {isComprasUser ? (
            <div className="relative" ref={openStatusDropdown === order.id ? dropdownRef : null}>
              <button
                onClick={() => setOpenStatusDropdown(openStatusDropdown === order.id ? null : order.id)}
                className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border transition-all duration-300 hover:shadow-lg active:scale-95 group ${current.color}`}
              >
                <div className="flex items-center gap-2">
                  {current.icon}
                  <span className="text-[10px] font-black uppercase tracking-widest">{current.label}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${openStatusDropdown === order.id ? 'rotate-180' : ''}`} />
              </button>

              {openStatusDropdown === order.id && (
                <div className="absolute z-50 right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slide-up p-1.5 ring-4 ring-slate-900/5">
                   <p className="px-3 py-2 text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Alterar Status Interno</p>
                   {(Object.keys(purchaseStatusMap) as Array<keyof typeof purchaseStatusMap>).map((key) => {
                     const opt = purchaseStatusMap[key];
                     const isSelected = order.purchaseStatus === key || (!order.purchaseStatus && key === 'recebido');
                     
                     return (
                       <button
                         key={key}
                         onClick={() => {
                           onUpdatePurchaseStatus?.(order.id, key);
                           setOpenStatusDropdown(null);
                         }}
                         className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                           isSelected 
                             ? 'bg-slate-50 text-slate-900' 
                             : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                         }`}
                       >
                         <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${isSelected ? (key === 'cancelado' ? 'bg-rose-600' : 'bg-indigo-600') + ' text-white shadow-md' : 'bg-slate-100 text-slate-400'}`}>
                              {opt.icon}
                            </div>
                            {opt.label}
                         </div>
                         {isSelected && <CheckCircle2 className={`w-4 h-4 ${key === 'cancelado' ? 'text-rose-600' : 'text-indigo-600'}`} />}
                       </button>
                     );
                   })}
                </div>
              )}
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${current.color}`}>
              {current.icon} {current.label}
            </div>
          )}
        </div>

        {lastMovement && (
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight italic bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100/50">
             <UserCheck className="w-3 h-3 text-emerald-500" />
             <span>Atualizado por: <span className="text-slate-600 not-italic">{lastMovement.userName}</span></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/50 backdrop-blur-sm font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden animate-fade-in">
      <div className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-full max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
               <button 
                 onClick={onBack}
                 className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
               >
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 Voltar ao Menu
               </button>
               <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    <Inbox className="w-6 h-6 text-white" />
                 </div>
                 {isComprasUser ? 'Atendimento de Pedidos' : 'Gestão de Pedidos de Compras'}
               </h2>
               <p className="text-slate-500 text-sm mt-1 font-medium">
                 {isComprasUser 
                   ? 'Acompanhe e atualize o status de atendimento das requisições autorizadas.' 
                   : 'Somente administradores podem aprovar ou rejeitar requisições.'}
               </p>
             </div>

             <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 w-fit">
                {['all', 'pending', 'approved', 'rejected']
                  .filter(s => !isComprasUser || s !== 'pending')
                  .map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      statusFilter === s ? 'bg-white shadow-sm text-emerald-600 border border-emerald-100' : 'text-slate-400 hover:bg-white/50'
                    }`}
                  >
                    {s === 'all' ? 'Todos' : s === 'pending' ? 'Pendentes' : s === 'approved' ? 'Aprovados' : 'Rejeitados'}
                  </button>
                ))}
             </div>
          </div>

          <div className="mt-8 flex items-center gap-3 w-full">
            <div className="relative flex-1 group">
               <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Buscar por Protocolo, Título ou Solicitante..."
                 className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredOrders.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-slate-50/80 transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                       <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow-sm shrink-0">
                          <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(order.createdAt).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                          <span className="text-lg font-black text-emerald-600 leading-none">{new Date(order.createdAt).getDate()}</span>
                       </div>
                       
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                             <span className="font-mono text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/50">
                                {order.protocol}
                             </span>
                             {getStatusBadge(order.status)}
                             {order.documentSnapshot?.content.priority !== 'Normal' && (
                               <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase tracking-widest">
                                 Prioridade: {order.documentSnapshot?.content.priority}
                               </span>
                             )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-tight mb-1">{order.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                             <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {order.userName}</div>
                             <div className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> {(order.documentSnapshot?.content.purchaseItems || []).length} itens</div>
                          </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm opacity-100 transition-opacity">
                       
                       <PurchaseStatusSelector order={order} />

                       <div className="w-px h-6 bg-slate-200 mx-1"></div>

                       <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAdmin && (
                            <>
                              <button 
                                onClick={() => onUpdateStatus(order.id, 'approved')} 
                                className={`p-2 rounded-xl transition-all ${order.status === 'approved' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                title="Aprovar Pedido"
                              >
                                <CheckCircle2 className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => onUpdateStatus(order.id, 'rejected')} 
                                className={`p-2 rounded-xl transition-all ${order.status === 'rejected' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                title="Rejeitar Pedido"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                              <div className="w-px h-6 bg-slate-200 mx-1"></div>
                              <button 
                                onClick={() => { if(window.confirm("Excluir este pedido permanentemente?")) onDeleteOrder(order.id); }} 
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          
                          <button 
                            onClick={() => setPreviewOrder(order)} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Visualizar Preview"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDownload(order)} 
                            disabled={downloadingId === order.id}
                            className={`p-2 rounded-xl transition-all ${downloadingId === order.id ? 'text-emerald-400' : 'text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                            title="Baixar PDF Original"
                          >
                            {downloadingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 text-center">
               <Inbox className="w-16 h-16 opacity-10 mb-4" />
               <p className="text-xl font-bold text-slate-500 tracking-tight">Nenhum pedido encontrado</p>
               <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                 {isComprasUser 
                   ? 'Somente pedidos que já foram finalizados (Aprovados ou Rejeitados) aparecem para seu perfil.' 
                   : 'As requisições de compra aparecerão aqui quando forem enviadas pelos colaboradores.'}
               </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <div className="flex gap-4">
             {!isComprasUser && <span>Pendentes: {purchaseOrders.filter(o => o.status === 'pending' || !o.status).length}</span>}
             <span className="text-emerald-500">Aprovados: {purchaseOrders.filter(o => o.status === 'approved').length}</span>
             <span className="text-rose-500">Rejeitados: {purchaseOrders.filter(o => o.status === 'rejected').length}</span>
           </div>
           <span>Atendimento de Compras • Sistema de Rastreabilidade Integrado</span>
        </div>
      </div>

      {/* Modal de Histórico de Movimentação (Grande com Blur) */}
      {historyOrder && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-slide-up max-h-[85vh]">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                       <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">Auditoria de Movimentação</h3>
                       <p className="text-xs font-bold text-indigo-600 font-mono">{historyOrder.protocol} • {historyOrder.title}</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setHistoryOrder(null)}
                   className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"
                 >
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                 <div className="relative">
                    {/* Linha da Timeline */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-1 bg-gradient-to-b from-indigo-500 via-indigo-200 to-slate-100 rounded-full"></div>

                    <div className="space-y-10">
                       {historyOrder.statusHistory && historyOrder.statusHistory.length > 0 ? (
                         [...historyOrder.statusHistory].reverse().map((move, idx) => {
                           const isFirst = idx === 0;
                           return (
                             <div key={idx} className="relative pl-14 group animate-fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Círculo da Timeline */}
                                <div className={`absolute left-0 top-0 w-10 h-10 rounded-2xl border-4 border-white shadow-md flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${
                                  isFirst ? (move.statusLabel.includes('Cancela') ? 'bg-rose-600' : 'bg-indigo-600') + ' text-white ring-4 ring-indigo-100' : 'bg-white text-indigo-500 border-indigo-100'
                                }`}>
                                   {move.statusLabel.includes('Aprova') ? <CheckCircle2 className="w-5 h-5" /> : 
                                    move.statusLabel.includes('Cancela') ? <XCircle className="w-5 h-5" /> :
                                    move.statusLabel.includes('Recebido') ? <PackageCheck className="w-5 h-5" /> : 
                                    move.statusLabel.includes('Concluído') ? <CheckCircle className="w-5 h-5" /> :
                                    move.statusLabel.includes('Realizado') ? <ShoppingCart className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                </div>

                                <div className={`p-6 rounded-[2rem] border transition-all ${
                                  isFirst ? (move.statusLabel.includes('Cancela') ? 'bg-rose-50/50 border-rose-100' : 'bg-indigo-50/50 border-indigo-100') + ' shadow-sm' : 'bg-white border-slate-100'
                                }`}>
                                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                      <h4 className={`text-sm font-black uppercase tracking-wider ${isFirst ? (move.statusLabel.includes('Cancela') ? 'text-rose-900' : 'text-indigo-900') : 'text-slate-800'}`}>
                                        {move.statusLabel}
                                      </h4>
                                      <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-100 text-[10px] font-bold text-slate-500 shadow-sm">
                                         <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                         {new Date(move.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-2">
                                      <div className={`w-6 h-6 rounded-lg ${move.statusLabel.includes('Cancela') ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'} flex items-center justify-center`}>
                                         <User className="w-3.5 h-3.5" />
                                      </div>
                                      <p className="text-xs font-black text-slate-600">
                                        Responsável: <span className={`${move.statusLabel.includes('Cancela') ? 'text-rose-600' : 'text-indigo-600'} ml-1`}>{move.userName}</span>
                                      </p>
                                   </div>
                                </div>
                             </div>
                           );
                         })
                       ) : (
                         <div className="py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
                               <Clock className="w-10 h-10 text-slate-300" />
                            </div>
                            <div>
                               <p className="text-lg font-black text-slate-400 uppercase tracking-tighter">Nenhum histórico</p>
                               <p className="text-sm text-slate-400 font-medium">Este pedido ainda não possui movimentações registradas.</p>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
                 <button 
                   onClick={() => setHistoryOrder(null)}
                   className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/20 hover:bg-indigo-600 transition-all active:scale-95"
                 >
                    Fechar Auditoria
                 </button>
              </div>
           </div>
        </div>,
        document.body
      )}

      {/* Modal de Preview */}
      {previewOrder && previewOrder.documentSnapshot && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full h-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-slide-up">
            
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">Visualização do Documento</h3>
                    <p className="text-xs text-slate-500 font-medium">{previewOrder.protocol} • {previewOrder.title}</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownload(previewOrder)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <FileDown className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => setPreviewOrder(null)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-hidden relative bg-slate-200/50">
               <div className="h-full overflow-y-auto custom-scrollbar p-8">
                  <div className="flex justify-center">
                    <DocumentPreview 
                      state={previewOrder.documentSnapshot} 
                      mode="admin"
                      blockType="compras"
                    />
                  </div>
               </div>

               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-slate-900/90 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl border border-white/10 pointer-events-none flex items-center gap-2">
                 <Lock className="w-3.5 h-3.5" /> Modo de Visualização Protegido
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
