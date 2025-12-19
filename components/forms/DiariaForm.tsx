
import React, { useRef, useEffect } from 'react';
import { 
  Wallet, Banknote, CheckCircle2, FileText, PenTool, ClipboardList,
  User, Briefcase, MapPin, Calendar, Clock, Bed, ShieldCheck, Route, 
  DollarSign, MessageSquare, CreditCard
} from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface DiariaFormProps {
  state: AppState;
  content: ContentData;
  docConfig: DocumentConfig;
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
  
  // Função para calcular previsão de pagamento (dia 10 do próximo mês)
  const calculatePaymentForecast = () => {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth() + 2; // +1 para o próximo mês, +1 porque getMonth é 0-indexed
    
    if (month > 12) {
      month = 1;
      year++;
    }
    
    return `10/${month.toString().padStart(2, '0')}/${year}`;
  };

  // Atualiza a previsão ao montar ou quando o subtipo muda
  useEffect(() => {
    if (content.subType && !content.paymentForecast) {
      handleUpdate('content', 'paymentForecast', calculatePaymentForecast());
    }
  }, [content.subType]);

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

  // Efeito para sincronizar os campos estruturados com o "body" do documento (Layout Compacto)
  useEffect(() => {
    if (content.subType) {
      const htmlBody = `
        <div style="font-family: inherit; line-height: 1.3; color: #1e293b; font-size: 10pt;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid #334155;">
            <tr>
              <td colspan="2" style="padding: 6px 10px; border: 1px solid #94a3b8; background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 8.5pt;">Dados do Beneficiário</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; width: 25%;">Nome:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8;">${content.requesterName || '---'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold;">Cargo / Setor:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8;">${content.requesterRole || '---'} — ${content.requesterSector || '---'}</td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px 10px; border: 1px solid #94a3b8; background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 8.5pt;">Logística da Viagem</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold;">Destino:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8;">${content.destination || '---'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold;">Período:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8;">
                Saída: ${content.departureDateTime ? new Date(content.departureDateTime).toLocaleString('pt-BR') : '---'} | 
                Retorno: ${content.returnDateTime ? new Date(content.returnDateTime).toLocaleString('pt-BR') : '---'}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 6px 10px; border: 1px solid #94a3b8; background: #f1f5f9; font-weight: 800; text-transform: uppercase; font-size: 8.5pt;">Resumo Financeiro e Autorização</td>
            </tr>
          </table>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1.5px solid #334155;">
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; width: 25%;">Hospedagens:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; width: 25%;">${content.lodgingCount || 0}</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; width: 25%;">Distância (KM):</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; width: 25%;">${content.distanceKm || 0} km</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold;">Valor Solicitado:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; color: #111827;">${content.requestedValue || 'R$ 0,00'}</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; background: #fffbeb;">Previsão Pgto:</td>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold; color: #b45309; background: #fffbeb;">${content.paymentForecast || '---'}</td>
            </tr>
            <tr>
              <td style="padding: 5px 10px; border: 1px solid #94a3b8; font-weight: bold;">Autorizado por:</td>
              <td colspan="3" style="padding: 5px 10px; border: 1px solid #94a3b8;">${content.authorizedBy || '---'}</td>
            </tr>
          </table>
          
          <div style="margin-top: 10px; page-break-inside: avoid;">
            <p style="font-weight: 900; margin-bottom: 5px; text-transform: uppercase; font-size: 8.5pt; color: #475569;">Descrição Detalhada / Motivo da Viagem:</p>
            <div style="padding: 10px; border: 1px solid #cbd5e1; min-height: 80px; text-align: justify; background: #fcfcfc; font-size: 10.5pt; line-height: 1.4;">
              ${content.descriptionReason || 'Nenhuma justificativa informada.'}
            </div>
          </div>
        </div>
      `;
      
      if (state.content.body !== htmlBody) {
        handleUpdate('content', 'body', htmlBody);
      }
    }
  }, [
    content.requesterName, content.requesterRole, content.requesterSector,
    content.destination, content.departureDateTime, content.returnDateTime,
    content.lodgingCount, content.authorizedBy, content.distanceKm,
    content.requestedValue, content.descriptionReason, content.subType, content.paymentForecast
  ]);

  const handleDiariaSubTypeChange = (type: 'diaria' | 'custeio') => {
    const newTitle = type === 'diaria' ? 'Requisição de Diária' : 'Requisição de Custeio';
    onUpdate({
        ...state,
        content: {
            ...state.content,
            subType: type,
            title: newTitle,
            paymentForecast: calculatePaymentForecast() // Garante atualização imediata
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
                    <label className={labelClass}><MapPin className="w-3 h-3" /> Destino</label>
                    <input 
                      type="text" value={content.destination || ''} 
                      onChange={(e) => handleUpdate('content', 'destination', e.target.value)} 
                      className={inputClass} placeholder="Cidade / Estado de destino" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}><Calendar className="w-3 h-3" /> Saída (Data/Hora)</label>
                      <input 
                        type="datetime-local" value={content.departureDateTime || ''} 
                        onChange={(e) => handleUpdate('content', 'departureDateTime', e.target.value)} 
                        className={inputClass} 
                      />
                    </div>
                    <div>
                      <label className={labelClass}><Clock className="w-3 h-3" /> Retorno (Data/Hora)</label>
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
                        title="Calculado automaticamente para o dia 10 do próximo mês"
                      />
                    </div>
                 </div>
                 <div>
                    <label className={labelClass}><ShieldCheck className="w-3 h-3" /> Autorizado por</label>
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
                <label className={labelClass}><FileText className="w-3 h-3" /> Detalhamento / Motivo</label>
                <textarea 
                  value={content.descriptionReason || ''} 
                  onChange={(e) => handleUpdate('content', 'descriptionReason', e.target.value)} 
                  className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
                  placeholder="Descreva detalhadamente o objetivo da viagem, reuniões agendadas ou eventos a participar..."
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Responsável pela Assinatura</h3>
              <div className="grid grid-cols-1 gap-3">
                  {allowedSignatures.map((sig) => {
                    const isSelected = content.signatureName === sig.name;
                    return (
                        <button 
                          key={sig.id} 
                          onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} 
                          className={`text-left p-4 rounded-2xl border transition-all duration-300 ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500/10' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
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
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
               <ClipboardList className="w-8 h-8" />
            </div>
            <div>
               <p className="font-bold text-slate-600">Aguardando Seleção</p>
               <p className="text-xs text-slate-400 max-w-[200px] mt-1">Escolha entre Diária ou Custeio no topo para liberar o formulário.</p>
            </div>
         </div>
       )}
    </div>
  );
};
