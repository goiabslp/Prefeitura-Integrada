
import React, { useRef, useEffect } from 'react';
import { 
  Wallet, Banknote, CheckCircle2, FileText, PenTool, ClipboardList,
  User, Briefcase, MapPin, Calendar, Clock, Bed, ShieldCheck, Route, 
  DollarSign, MessageSquare, CreditCard
} from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface OficioFormProps {
  state: AppState;
  content: ContentData;
  docConfig: DocumentConfig;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
}

export const DiariaForm: React.FC<OficioFormProps> = ({ 
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
    let month = now.getMonth() + 2; 
    
    if (month > 12) {
      month = 1;
      year++;
    }
    
    return `10/${month.toString().padStart(2, '0')}/${year}`;
  };

  // Atualiza a previsão e garante que showSignature do documento esteja desativado para Diárias
  useEffect(() => {
    if (content.subType) {
      if (!content.paymentForecast) {
        handleUpdate('content', 'paymentForecast', calculatePaymentForecast());
      }
      if (state.document.showSignature) {
        handleUpdate('document', 'showSignature', false);
      }
    }
  }, [content.subType, handleUpdate, state.document.showSignature]);

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

  // Efeito para sincronizar os campos estruturados + Assinaturas Triplas no "body"
  useEffect(() => {
    if (content.subType) {
      // Usando medidas em PT/MM para maior precisão no motor de renderização do PDF
      const htmlBody = `
        <div style="display: flex; flex-direction: column; width: 100%; height: 232mm; font-family: inherit; line-height: 1.1; color: #1e293b; font-size: 9pt; box-sizing: border-box;">
          
          <div style="flex: 0 0 auto;">
            <!-- CARD 01: Dados do Beneficiário -->
            <div style="margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
              <div style="background: #f1f5f9; padding: 4px 10px; border-bottom: 1px solid #cbd5e1;">
                <span style="font-weight: 800; font-size: 7.5pt; color: #475569; text-transform: uppercase;">01. Dados do Beneficiário</span>
              </div>
              <div style="padding: 8px 10px;">
                <div style="margin-bottom: 4px;">
                  <span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block;">Nome do Servidor</span>
                  <span style="color: #0f172a; font-weight: 700; font-size: 9.5pt;">${content.requesterName || '---'}</span>
                </div>
                <div style="display: flex; gap: 20px;">
                  <div style="flex: 1;">
                    <span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block;">Cargo</span>
                    <span style="color: #334155; font-weight: 600;">${content.requesterRole || '---'}</span>
                  </div>
                  <div style="flex: 1;">
                    <span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block;">Setor</span>
                    <span style="color: #334155; font-weight: 600;">${content.requesterSector || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CARD 02: Logística -->
            <div style="margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
              <div style="background: #f1f5f9; padding: 4px 10px; border-bottom: 1px solid #cbd5e1;">
                <span style="font-weight: 800; font-size: 7.5pt; color: #475569; text-transform: uppercase;">02. Logística e Itinerário</span>
              </div>
              <div style="padding: 8px 10px;">
                <div style="margin-bottom: 6px;">
                  <span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; display: block;">Cidade / UF</span>
                  <span style="color: #0f172a; font-weight: 700;">${content.destination || '---'}</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
                  <div style="padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
                    <span style="font-size: 6pt; font-weight: 800; color: #64748b; text-transform: uppercase; display: block;">Saída</span>
                    <span style="color: #0f172a; font-weight: 700; font-size: 8pt;">${content.departureDateTime ? new Date(content.departureDateTime).toLocaleString('pt-BR') : '---'}</span>
                  </div>
                  <div style="padding: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
                    <span style="font-size: 6pt; font-weight: 800; color: #64748b; text-transform: uppercase; display: block;">Retorno</span>
                    <span style="color: #0f172a; font-weight: 700; font-size: 8pt;">${content.returnDateTime ? new Date(content.returnDateTime).toLocaleString('pt-BR') : '---'}</span>
                  </div>
                </div>
                <div style="display: flex; gap: 15px;">
                  <div><span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Pernoites:</span> <span style="font-weight: 700; color: #1e293b;">${content.lodgingCount || 0}</span></div>
                  <div><span style="font-size: 6.5pt; font-weight: 800; color: #94a3b8; text-transform: uppercase;">Distância:</span> <span style="font-weight: 700; color: #1e293b;">${content.distanceKm || 0} KM</span></div>
                </div>
              </div>
            </div>

            <!-- CARD 03: Financeiro -->
            <div style="margin-bottom: 8px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
              <div style="background: #f1f5f9; padding: 4px 10px; border-bottom: 1px solid #cbd5e1;">
                <span style="font-weight: 800; font-size: 7.5pt; color: #475569; text-transform: uppercase;">03. Resumo Financeiro</span>
              </div>
              <div style="padding: 8px 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="flex: 1;">
                  <span style="font-size: 6.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; display: block;">Valor Solicitado</span>
                  <span style="font-size: 12pt; font-weight: 900; color: #4f46e5;">${content.requestedValue || 'R$ 0,00'}</span>
                </div>
                <div style="flex: 1; padding: 6px 10px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; text-align: center;">
                  <span style="font-size: 6pt; font-weight: 900; color: #92400e; text-transform: uppercase; display: block;">Previsão Pgto</span>
                  <span style="font-size: 10pt; font-weight: 900; color: #b45309;">${content.paymentForecast || '---'}</span>
                </div>
                <div style="flex: 1.5; text-align: right;">
                  <span style="font-size: 6.5pt; font-weight: 800; color: #64748b; text-transform: uppercase; display: block;">Autorizado Por</span>
                  <span style="font-size: 8.5pt; font-weight: 700; color: #334155;">${content.authorizedBy || '---'}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- CARD 04: Justificativa -->
          <div style="flex: 1 1 auto; display: flex; flex-direction: column; overflow: hidden;">
            <div style="background: #0f172a; padding: 4px 10px; border-radius: 8px 8px 0 0;">
                <span style="font-weight: 800; font-size: 7.5pt; color: #ffffff; text-transform: uppercase; letter-spacing: 0.05em;">04. Justificativa Resumida</span>
            </div>
            <div style="padding: 10px 14px; border: 1px solid #0f172a; border-top: none; border-radius: 0 0 8px 8px; flex: 1 1 auto; max-height: 75mm; min-height: 25mm; text-align: justify; background: #ffffff; font-size: 9.5pt; line-height: 1.4; overflow: hidden; box-sizing: border-box; color: #0f172a;">
              ${content.descriptionReason || 'A justificativa será exibida aqui após o preenchimento.'}
            </div>
          </div>

          <!-- BLOCO DE ASSINATURAS REORGANIZADO -->
          <div style="flex: 0 0 auto; width: 100%; text-align: center; margin-top: auto;">
             
             <!-- 1. Assinatura do Requerente (Cascata Superior) -->
             <div style="width: 260px; margin: 0 auto; border-top: 1.2px solid #0f172a; padding-top: 5px; margin-top: 5.5em;">
                <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 9pt; color: #0f172a;">${content.requesterName || 'NOME DO SERVIDOR SOLICITANTE'}</p>
                <p style="margin: 1px 0 0 0; font-size: 7.5pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Servidor Requerente</p>
             </div>

             <!-- 2. Assinaturas de Controle e Autorização (Cascata Inferior) -->
             <table style="width: 100%; border-collapse: collapse; border: none; margin: 5.5em 0 0 0; padding: 0;">
                <tr>
                   <!-- Lado Esquerdo: Contabilidade -->
                   <td style="width: 50%; vertical-align: top; text-align: center; padding: 0 10px;">
                      <div style="width: 220px; margin: 0 auto; border-top: 1.2px solid #0f172a; padding-top: 5px;">
                         <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 8.5pt; color: #0f172a;">Visto Contabilidade</p>
                         <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Tesouraria / Fazenda</p>
                      </div>
                   </td>

                   <!-- Lado Direito: Responsável Autorizador -->
                   <td style="width: 50%; vertical-align: top; text-align: center; padding: 0 10px;">
                      <div style="width: 220px; margin: 0 auto; border-top: 1.2px solid #0f172a; padding-top: 5px;">
                         <p style="margin: 0; font-weight: 800; text-transform: uppercase; font-size: 8.5pt; color: #0f172a;">${content.signatureName || 'ORDENADOR DE DESPESA'}</p>
                         <p style="margin: 1px 0 0 0; font-size: 7pt; color: #64748b; font-weight: 700; text-transform: uppercase; line-height: 1.2;">${content.signatureRole || 'Responsável'}</p>
                      </div>
                   </td>
                </tr>
             </table>
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
    content.requestedValue, content.descriptionReason, content.subType, content.paymentForecast,
    content.signatureName, content.signatureRole, content.signatureSector,
    state.content.body, handleUpdate
  ]);

  const handleDiariaSubTypeChange = (type: 'diaria' | 'custeio') => {
    const newTitle = type === 'diaria' ? 'Requisição de Diária' : 'Requisição de Custeio';
    onUpdate({
        ...state,
        content: {
            ...state.content,
            subType: type,
            title: newTitle,
            paymentForecast: calculatePaymentForecast()
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
                        title="Calculado automaticamente para o dia 10 do próximo mês"
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
                <label className={labelClass}><FileText className="w-3 h-3" /> Justificativa Resumida</label>
                <textarea 
                  value={content.descriptionReason || ''} 
                  onChange={(e) => handleUpdate('content', 'descriptionReason', e.target.value)} 
                  className={`${inputClass} min-h-[120px] resize-none leading-relaxed`}
                  placeholder="Descreva detalhadamente o objetivo da viagem..."
                />
              </div>
            </div>

            <div className="space-y-4 border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Autorização Final (Responsável)</h3>
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
