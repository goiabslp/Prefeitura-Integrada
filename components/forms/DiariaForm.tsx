
import React, { useEffect } from 'react';
import { 
  Wallet, Banknote, CheckCircle2, FileText, PenTool, ClipboardList,
  User, Briefcase, MapPin, Calendar, Clock, Bed, ShieldCheck, Route, 
  DollarSign, MessageSquare, CreditCard, Eye, EyeOff, PlusCircle, Columns
} from 'lucide-react';
import { AppState, ContentData, Signature } from '../../types';

interface DiariaFormProps {
  state: AppState;
  content: ContentData;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
}

export const DiariaForm: React.FC<DiariaFormProps> = ({ 
  state, 
  content, 
  allowedSignatures, 
  handleUpdate,
  onUpdate
}) => {
  
  const calculatePaymentForecast = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 2; 
    if (month > 12) {
      month = 1;
      year++;
    }
    return `10/${month.toString().padStart(2, '0')}/${year}`;
  };

  useEffect(() => {
    if (content.subType) {
      if (!content.paymentForecast) {
        handleUpdate('content', 'paymentForecast', calculatePaymentForecast());
      }
      if (state.document.showSignature) {
        handleUpdate('document', 'showSignature', false);
      }
      if (content.showDiariaSignatures === undefined) {
        handleUpdate('content', 'showDiariaSignatures', true);
      }
      if (content.showExtraField === undefined) {
        handleUpdate('content', 'showExtraField', false);
      }
    }
  }, [content.subType, handleUpdate, state.document.showSignature, content.showDiariaSignatures, content.showExtraField]);

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    const numericValue = (Number(cleanValue) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return numericValue;
  };

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    handleUpdate('content', 'requestedValue', formatted);
  };

  const handleDiariaSubTypeChange = (type: 'diaria' | 'custeio') => {
    const newTitle = type === 'diaria' ? 'Requisição de Diária' : 'Requisição de Custeio';
    onUpdate({
        ...state,
        content: {
            ...state.content,
            subType: type,
            title: newTitle,
            paymentForecast: calculatePaymentForecast(),
            showDiariaSignatures: true,
            showExtraField: false,
            body: '' 
        },
        document: {
          ...state.document,
          showSignature: false 
        }
    });
  };

  const inputGroupClass = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4";
  const labelClass = "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";
  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all";

  return (
    <div className="space-y-8 animate-fade-in pb-12">
       <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600" /> Modalidade de Requisição
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <button
               onClick={() => handleDiariaSubTypeChange('diaria')}
               className={`group p-6 rounded-3xl border-2 text-left transition-all duration-300 ${
                 content.subType === 'diaria' ? 'bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-white border-slate-100 hover:border-indigo-300'
               }`}
             >
                <div className="flex justify-between items-start">
                   <div className={`p-3 rounded-2xl transition-colors ${content.subType === 'diaria' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      <Wallet className="w-6 h-6" />
                   </div>
                   {content.subType === 'diaria' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <h4 className="mt-4 font-black text-lg text-slate-900">Diária</h4>
                <p className="text-xs text-slate-500 font-medium">Viagens e estadias.</p>
             </button>

             <button
               onClick={() => handleDiariaSubTypeChange('custeio')}
               className={`group p-6 rounded-3xl border-2 text-left transition-all duration-300 ${
                 content.subType === 'custeio' ? 'bg-indigo-50 border-indigo-600 shadow-lg shadow-indigo-600/10' : 'bg-white border-slate-100 hover:border-indigo-300'
               }`}
             >
                <div className="flex justify-between items-start">
                   <div className={`p-3 rounded-2xl transition-colors ${content.subType === 'custeio' ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                      <Banknote className="w-6 h-6" />
                   </div>
                   {content.subType === 'custeio' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <h4 className="mt-4 font-black text-lg text-slate-900">Custeio</h4>
                <p className="text-xs text-slate-500 font-medium">Reembolsos diversos.</p>
             </button>
          </div>
       </div>

       {content.subType ? (
         <>
            {/* NOVO: Bloco de Protocolo / Endereçamento */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Columns className="w-4 h-4 text-indigo-600" /> Bloco de Endereçamento (Protocolo)
                </h3>
                <button 
                  onClick={() => handleUpdate('document', 'showLeftBlock', !state.document.showLeftBlock)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    state.document.showLeftBlock 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {state.document.showLeftBlock ? <><Eye className="w-3 h-3" /> Visível</> : <><EyeOff className="w-3 h-3" /> Oculto</>}
                </button>
              </div>
              {state.document.showLeftBlock && (
                <div className={inputGroupClass}>
                  <label className={labelClass}><Hash className="w-3 h-3" /> Texto do Protocolo / Ofício</label>
                  <textarea 
                    value={content.leftBlockText || ''} 
                    onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)} 
                    className={`${inputClass} min-h-[80px] font-mono text-xs`}
                    placeholder="Ex: Protocolo nº DIARIAS-001/2024..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Dados do Requerente
              </h3>
              <div className={inputGroupClass}>
                <div className="grid grid-cols-1 gap-4">
                   <div>
                      <label className={labelClass}><User className="w-3 h-3" /> Nome Completo</label>
                      <input 
                        type="text" value={content.requesterName || ''} 
                        onChange={(e) => handleUpdate('content', 'requesterName', e.target.value)} 
                        className={inputClass} placeholder="Digite o nome do servidor" 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}><Briefcase className="w-3 h-3" /> Cargo</label>
                        <input 
                          type="text" value={content.requesterRole || ''} 
                          onChange={(e) => handleUpdate('content', 'requesterRole', e.target.value)} 
                          className={inputClass} placeholder="Ex: Analista" 
                        />
                      </div>
                      <div>
                        <label className={labelClass}><ShieldCheck className="w-3 h-3" /> Setor</label>
                        <input 
                          type="text" value={content.requesterSector || ''} 
                          onChange={(e) => handleUpdate('content', 'requesterSector', e.target.value)} 
                          className={inputClass} placeholder="Ex: Financeiro" 
                        />
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" /> Logística e Período
              </h3>
              <div className={inputGroupClass}>
                 <div>
                    <label className={labelClass}><MapPin className="w-3 h-3" /> Cidade / UF</label>
                    <input 
                      type="text" value={content.destination || ''} 
                      onChange={(e) => handleUpdate('content', 'destination', e.target.value)} 
                      className={inputClass} placeholder="Ex: Belo Horizonte - MG" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><Calendar className="w-3 h-3" /> Saída</label>
                      <input 
                        type="datetime-local" value={content.departureDateTime || ''} 
                        onChange={(e) => handleUpdate('content', 'departureDateTime', e.target.value)} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}><Clock className="w-3 h-3" /> Retorno</label>
                      <input 
                        type="datetime-local" value={content.returnDateTime || ''} 
                        onChange={(e) => handleUpdate('content', 'returnDateTime', e.target.value)} 
                        className={inputClass} 
                      />
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-600" /> Custos e Prazos
              </h3>
              <div className={inputGroupClass}>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><Bed className="w-3 h-3" /> Hospedagens</label>
                      <input 
                        type="number" min="0" value={content.lodgingCount || 0} 
                        onChange={(e) => handleUpdate('content', 'lodgingCount', Number(e.target.value))} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}><Route className="w-3 h-3" /> Distância (KM)</label>
                      <input 
                        type="number" min="0" value={content.distanceKm || 0} 
                        onChange={(e) => handleUpdate('content', 'distanceKm', Number(e.target.value))} 
                        className={inputClass} 
                      />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><DollarSign className="w-3 h-3" /> Valor Requerido</label>
                      <input 
                        type="text" value={content.requestedValue || ''} 
                        onChange={handleCurrencyInput} 
                        className={`${inputClass} font-bold text-indigo-700`} placeholder="R$ 0,00" 
                      />
                    </div>
                    <div>
                      <label className={labelClass}><CreditCard className="w-3 h-3" /> Previsão de Pagamento</label>
                      <input 
                        type="text" value={content.paymentForecast || ''} 
                        readOnly
                        className={`${inputClass} bg-amber-50 border-amber-200 text-amber-700 cursor-not-allowed`}
                      />
                    </div>
                 </div>
                 <div>
                    <label className={labelClass}><ShieldCheck className="w-3 h-3" /> Autorizado Por</label>
                    <input 
                      type="text" value={content.authorizedBy || ''} 
                      onChange={(e) => handleUpdate('content', 'authorizedBy', e.target.value)} 
                      className={inputClass} placeholder="Nome do autorizador" 
                    />
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" /> Justificativa da Viagem
              </h3>
              <div className={inputGroupClass}>
                <label className={labelClass}><FileText className="w-3 h-3" /> Justificativa Resumida (Página 1)</label>
                <textarea 
                  value={content.descriptionReason || ''} 
                  onChange={(e) => handleUpdate('content', 'descriptionReason', e.target.value)} 
                  className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
                  placeholder="Descreva o objetivo da viagem..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-slate-600" /> Informações Adicionais (Anexo)
                </h3>
                <button 
                  onClick={() => handleUpdate('content', 'showExtraField', !content.showExtraField)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    content.showExtraField === true 
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {content.showExtraField === true ? <><Eye className="w-3 h-3" /> Ativado</> : <><EyeOff className="w-3 h-3" /> Desativado</>}
                </button>
              </div>

              {content.showExtraField && (
                <div className={`${inputGroupClass} animate-fade-in`}>
                  <label className={labelClass}><FileText className="w-3 h-3" /> Texto do Anexo (Páginas 2+)</label>
                  <textarea 
                    value={content.extraFieldText || ''} 
                    onChange={(e) => handleUpdate('content', 'extraFieldText', e.target.value)} 
                    className={`${inputClass} min-h-[200px] resize-none leading-relaxed bg-indigo-50/10`}
                    placeholder="Este conteúdo fluirá automaticamente para as páginas seguintes se for muito extenso..."
                  />
                  <p className="text-[9px] text-slate-400 font-medium italic">O conteúdo acima será paginado automaticamente a partir da Página 2.</p>
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Autorização Final</h3>
                  <button 
                    onClick={() => handleUpdate('content', 'showDiariaSignatures', !content.showDiariaSignatures)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                      content.showDiariaSignatures !== false 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {content.showDiariaSignatures !== false ? <><Eye className="w-3 h-3" /> Assinaturas Visíveis</> : <><EyeOff className="w-3 h-3" /> Assinaturas Ocultas</>}
                  </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                  {allowedSignatures.map((sig) => {
                    const isSelected = content.signatureName === sig.name;
                    return (
                        <button 
                          key={sig.id} 
                          onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} 
                          className={`text-left p-4 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                        >
                          <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{sig.name}</p>
                                <p className="text-[10px] uppercase font-medium text-slate-500 tracking-wider">{sig.role}</p>
                              </div>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                          </div>
                        </button>
                    );
                  })}
              </div>
            </div>
         </>
       ) : (
         <div className="p-12 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-4 bg-white/50">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300"><ClipboardList className="w-8 h-8" /></div>
            <p className="font-bold text-slate-600">Selecione o tipo acima para começar.</p>
         </div>
       )}
    </div>
  );
};

const Hash = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>
);
