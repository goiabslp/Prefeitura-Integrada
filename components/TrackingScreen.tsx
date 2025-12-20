
import React, { useState } from 'react';
import { 
  ArrowLeft, Search, PackageX, FileText, Clock, Trash2, 
  FileDown, Calendar, Edit3, TrendingUp, Loader2,
  CheckCircle2, AlertCircle, CalendarCheck, Check, RotateCcw
} from 'lucide-react';
import { User, Order, AppState, BlockType } from '../types';

const HashIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="9" x2="20" y2="9"></line>
    <line x1="4" y1="15" x2="20" y2="15"></line>
    <line x1="10" y1="3" x2="8" y2="21"></line>
    <line x1="16" y1="3" x2="14" y2="21"></line>
  </svg>
);

interface TrackingScreenProps {
  onBack: () => void;
  currentUser: User;
  activeBlock: BlockType | null;
  orders: Order[];
  onDownloadPdf: (snapshot?: AppState) => void;
  onClearAll: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: string) => void;
  totalCounter: number;
  onUpdatePaymentStatus?: (orderId: string, status: 'pending' | 'paid') => void;
}

export const TrackingScreen: React.FC<TrackingScreenProps> = ({ 
  onBack, 
  currentUser, 
  activeBlock,
  orders, 
  onDownloadPdf, 
  onClearAll, 
  onEditOrder,
  onDeleteOrder,
  totalCounter,
  onUpdatePaymentStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'admin';
  const isDiarias = activeBlock === 'diarias';

  const filteredOrders = orders.filter(order => {
    const matchesBlock = order.blockType === activeBlock;
    if (!matchesBlock) return false;

    const hasPermission = isAdmin || currentUser.role === 'licitacao' 
        ? true 
        : order.userId === currentUser.id;
    
    const matchesSearch = order.protocol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (order.documentSnapshot?.content.requesterName || '').toLowerCase().includes(searchTerm.toLowerCase());

    return hasPermission && matchesSearch;
  });

  const handleDownload = (order: Order) => {
    setDownloadingId(order.id);
    onDownloadPdf(order.documentSnapshot);
    setTimeout(() => setDownloadingId(null), 2000);
  };

  const getDepartureDate = (order: Order) => {
    const content = order.documentSnapshot?.content;
    if (!content?.departureDateTime) return '---';
    return new Date(content.departureDateTime).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen w-full bg-slate-100/50 backdrop-blur-sm font-sans flex items-center justify-center p-4 md:p-8 overflow-hidden animate-fade-in">
      <div className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden animate-slide-up flex flex-col h-full max-h-[90vh]">
        
        <div className="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
               <button 
                 onClick={onBack}
                 className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-bold uppercase tracking-widest mb-4 group"
               >
                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                 Voltar ao Menu
               </button>
               <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30">
                    <FileText className="w-6 h-6 text-white" />
                 </div>
                 Histórico: {activeBlock?.toUpperCase()}
               </h2>
               <p className="text-slate-500 text-sm mt-1 font-medium">
                 {isAdmin ? 'Gerenciamento global de registros.' : 'Seus documentos gerados neste módulo.'}
               </p>
             </div>
             
             <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-sm min-w-[200px]">
                <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-tight mb-1">Total Gerado</p>
                   <p className="text-3xl font-black text-indigo-900 leading-none">
                     {totalCounter.toString().padStart(3, '0')}
                   </p>
                </div>
             </div>
          </div>

          <div className="mt-8 flex items-center gap-3 w-full">
            <div className="relative flex-1 group">
               <input
                 type="text"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 placeholder="Buscar por Solicitante, Protocolo ou Título..."
                 className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
               />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>
            {isAdmin && filteredOrders.length > 0 && (
               <button 
                 onClick={onClearAll}
                 className="p-3.5 bg-red-50 text-red-500 border border-red-100 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center gap-2 font-bold text-xs uppercase"
               >
                 <Trash2 className="w-5 h-5" />
                 <span className="hidden lg:inline">Limpar Bloco</span>
               </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredOrders.length > 0 ? (
            <div className="min-w-full">
              <div className="border-b border-slate-100 bg-slate-50/50 hidden md:grid md:grid-cols-12 gap-4 px-8 py-4 sticky top-0 z-10">
                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <HashIcon className="w-3 h-3" /> Protocolo
                </div>
                <div className={`${isDiarias ? 'md:col-span-4' : 'md:col-span-6'} text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2`}>
                  <FileText className="w-3 h-3" /> Título (Solicitante + Destino)
                </div>
                {isDiarias && (
                  <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarCheck className="w-3 h-3" /> Saída
                  </div>
                )}
                <div className="md:col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  {isDiarias ? <><RotateCcw className="w-3 h-3" /> Pagamento</> : <><Calendar className="w-3 h-3" /> Criação</>}
                </div>
                <div className="md:col-span-2 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</div>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const content = order.documentSnapshot?.content;
                  const isPaid = order.paymentStatus === 'paid';
                  
                  return (
                    <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 px-8 py-5 hover:bg-slate-50/80 transition-colors items-center">
                      <div className="md:col-span-2">
                         <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100/50">
                            {order.protocol}
                         </span>
                      </div>
                      
                      <div className={`${isDiarias ? 'md:col-span-4' : 'md:col-span-6'}`}>
                         <h3 className="text-sm font-bold text-slate-800 leading-tight">
                           {isDiarias ? (content?.requesterName || '---') : order.title}
                         </h3>
                         <p className="text-[10px] text-slate-400 font-medium">
                           {isDiarias ? (content?.destination || '---') : `Por: ${order.userName}`}
                         </p>
                      </div>

                      {isDiarias && (
                         <div className="md:col-span-2 text-slate-600 text-xs font-bold">
                           {getDepartureDate(order)}
                         </div>
                      )}

                      {isDiarias ? (
                         <div className="md:col-span-2">
                            {isAdmin ? (
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => onUpdatePaymentStatus?.(order.id, isPaid ? 'pending' : 'paid')}
                                  className={`relative group flex items-center justify-between w-full max-w-[120px] px-3 py-2 rounded-xl border transition-all duration-300 active:scale-95 ${
                                    isPaid 
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm shadow-emerald-500/10' 
                                      : 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm shadow-amber-500/10'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-pulse" />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      {isPaid ? 'Pago' : 'Pendente'}
                                    </span>
                                  </div>
                                  <div className="hidden group-hover:block transition-all ml-1">
                                    <Edit3 className="w-3 h-3 opacity-40" />
                                  </div>
                                </button>
                                {isPaid && order.paymentDate && (
                                  <span className="text-[9px] font-bold text-emerald-500 ml-2 flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5" /> 
                                    {new Date(order.paymentDate).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                 <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border w-fit ${
                                   isPaid 
                                     ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm shadow-emerald-500/5' 
                                     : 'bg-amber-50 text-amber-600 border-amber-100 shadow-sm shadow-amber-500/5'
                                 }`}>
                                   {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                                   {isPaid ? 'Pago' : 'Pendente'}
                                 </div>
                                 {isPaid && order.paymentDate && (
                                   <span className="text-[9px] font-bold text-emerald-500 ml-3">
                                     Data: {new Date(order.paymentDate).toLocaleDateString('pt-BR')}
                                   </span>
                                 )}
                              </div>
                            )}
                         </div>
                      ) : (
                         <div className="md:col-span-2 flex items-center gap-2 text-slate-500 text-xs font-medium">
                            <Clock className="w-3 h-3 opacity-40" />
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                         </div>
                      )}

                      <div className="md:col-span-2 flex items-center justify-end gap-1">
                         <button onClick={() => onEditOrder(order)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Editar"><Edit3 className="w-5 h-5" /></button>
                         <button 
                          onClick={() => handleDownload(order)} 
                          disabled={downloadingId === order.id}
                          className={`p-2 rounded-xl transition-all ${downloadingId === order.id ? 'text-indigo-400 bg-indigo-50' : 'text-indigo-600 hover:bg-indigo-600 hover:text-white'}`} 
                          title="Download PDF"
                         >
                           {downloadingId === order.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                         </button>
                         <button onClick={() => onDeleteOrder(order.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
               <PackageX className="w-12 h-12 opacity-30 mb-4" />
               <p className="text-lg font-bold text-slate-500">Histórico Vazio</p>
               <p className="text-sm text-slate-400 mt-1 text-center">Nenhum registro encontrado para este módulo.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
           <span>Exibindo {filteredOrders.length} registros</span>
           <span>Sistema de Gestão Pública v1.2.0</span>
        </div>
      </div>
    </div>
  );
};
