
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Palette, Image as ImageIcon, 
  FileText, Settings, Users, Home, Loader2, 
  Check, Save, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify,
  PenTool, ArrowLeft, Heading, Columns,
  Bold, Italic, Underline, Highlighter, Quote, RemoveFormatting, Droplets, Maximize,
  Monitor, Layout, LogIn, MapPin, ChevronRight, CheckCircle2, User as UserIcon,
  Wallet, Banknote, ClipboardList, Calendar, Clock, Map, UserCheck, DollarSign
} from 'lucide-react';
import { AppState, User, Signature, BlockType, DiariaFields } from '../types';

interface AdminSidebarProps {
  state: AppState;
  onUpdate: (newState: AppState) => void;
  onPrint: (customState?: AppState) => void;
  isOpen: boolean;
  onClose: () => void;
  isDownloading: boolean;
  currentUser: User;
  mode: 'admin' | 'editor';
  onSaveDefault?: () => void;
  onFinish?: () => void;
  activeTab: string | null;
  onTabChange: (tab: any) => void;
  availableSignatures: Signature[];
  activeBlock: BlockType | null;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  state,
  onUpdate,
  onPrint,
  isOpen,
  onClose,
  isDownloading,
  currentUser,
  mode,
  onSaveDefault,
  onFinish,
  activeTab,
  onTabChange,
  availableSignatures,
  activeBlock
}) => {
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [finishStatus, setFinishStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loginLogoInputRef = useRef<HTMLInputElement>(null);
  const headerLogoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { branding, document: docConfig, content, ui } = state;

  const allowedSignatures = availableSignatures.filter(sig => 
    currentUser.role === 'admin' || (currentUser.allowedSignatureIds || []).includes(sig.id)
  );

  useEffect(() => {
    if (editorRef.current && mode === 'editor' && activeTab === 'content' && activeBlock !== 'diarias') {
      if (editorRef.current.innerHTML !== content.body) {
        editorRef.current.innerHTML = content.body;
      }
    }
  }, [activeTab, mode, content.body, activeBlock]);

  const handleUpdate = (section: keyof AppState, key: string, value: any) => {
    onUpdate({
      ...state,
      [section]: {
        ...state[section],
        [key]: value
      }
    });
  };

  const handleDeepUpdate = (section: keyof AppState, subSection: string, key: string, value: any) => {
    onUpdate({
      ...state,
      [section]: {
        ...(state[section] as any),
        [subSection]: {
          ...(state[section] as any)[subSection],
          [key]: value
        }
      }
    } as AppState);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('branding', 'logoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLoginLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('ui', 'loginLogoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleHeaderLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('ui', 'headerLogoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleDeepUpdate('branding', 'watermark', 'imageUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleUpdate('content', 'body', editorRef.current.innerHTML);
    }
  };

  const applyFontSize = (size: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    document.execCommand('fontSize', false, '7');
    
    const fontTags = editorRef.current?.querySelectorAll('font[size="7"]');
    fontTags?.forEach(tag => {
      const span = document.createElement('span');
      span.style.fontSize = size;
      span.innerHTML = tag.innerHTML;
      tag.parentNode?.replaceChild(span, tag);
    });
    
    if (editorRef.current) {
      handleUpdate('content', 'body', editorRef.current.innerHTML);
    }
  };

  const applyCitation = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    document.execCommand('foreColor', false, '#f0000f');
    
    const highlightedTags = editorRef.current?.querySelectorAll('font[color="#f0000f"]');
    highlightedTags?.forEach(tag => {
      const span = document.createElement('span');
      span.style.fontFamily = "'Merriweather', serif";
      span.style.fontStyle = 'italic';
      span.style.color = 'inherit';
      
      const cleanText = (tag as HTMLElement).innerText?.trim() || '';
      if (!cleanText.startsWith('"') && !cleanText.endsWith('"')) {
        span.innerHTML = `"${tag.innerHTML}"`;
      } else {
        span.innerHTML = tag.innerHTML;
      }
      
      tag.parentNode?.replaceChild(span, tag);
    });

    if (editorRef.current) {
      handleUpdate('content', 'body', editorRef.current.innerHTML);
    }
  };

  const formatCurrency = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) return "R$ 0,00";
    const numericValue = parseInt(cleanValue, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue);
  };

  const handleDiariaSubTypeChange = (type: 'diaria' | 'custeio') => {
    const newTitle = type === 'diaria' ? 'Requisição de Diária' : 'Requisição de Custeio';
    onUpdate({
      ...state,
      content: {
        ...state.content,
        subType: type,
        title: newTitle,
        diariaFields: state.content.diariaFields || {
          nome: currentUser.name,
          cargo: currentUser.jobTitle || '',
          setor: currentUser.sector || '',
          destino: '',
          dataSaida: '',
          horaSaida: '',
          dataRetorno: '',
          horaRetorno: '',
          hospedagem: 0,
          autorizacaoPor: '',
          distancia: 0,
          valorRequerido: 'R$ 0,00',
          motivoViagem: ''
        }
      }
    });
  };

  const handleDiariaFieldUpdate = (field: keyof DiariaFields, value: any) => {
    if (!content.diariaFields) return;
    onUpdate({
      ...state,
      content: {
        ...state.content,
        diariaFields: {
          ...content.diariaFields,
          [field]: value
        }
      }
    });
  };

  const handleFinishWithAnimation = async () => {
      if (activeBlock === 'diarias') {
          if (!content.subType) {
              alert("Por favor, selecione se a requisição é do tipo Diária ou Custeio.");
              return;
          }
          const f = content.diariaFields;
          if (!f?.nome || !f?.destino || !f?.motivoViagem) {
              alert("Por favor, preencha os campos obrigatórios (Nome, Destino e Motivo).");
              return;
          }
      }
      setFinishStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      if (onFinish) onFinish();
      setFinishStatus('success');
      setTimeout(() => {
          setFinishStatus('idle');
          onClose();
      }, 1000);
  };

  const handleSaveDefaultWithAnimation = async () => {
      if (!onSaveDefault) return;
      setGlobalSaveStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 800));
      onSaveDefault();
      setGlobalSaveStatus('success');
      setTimeout(() => setGlobalSaveStatus('idle'), 2000);
  };

  const renderSectionHeader = (title: string, subtitle?: string) => (
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
         {mode === 'admin' && (
             <button onClick={() => onTabChange(null)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors" title="Voltar ao Menu">
                <ArrowLeft className="w-5 h-5" />
             </button>
         )}
         <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
         </div>
      </div>
  );

  const inputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none";
  const labelClass = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1";

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity md:hidden" onClick={onClose} />}
      <div className={`fixed inset-y-0 left-0 w-full md:w-[600px] lg:w-[640px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div><h2 className="text-lg font-black text-slate-900 tracking-tight">{activeBlock === 'diarias' ? 'Requisição de Diárias' : mode === 'admin' ? 'Painel Administrativo' : 'Editor de Documento'}</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          {mode !== 'admin' && activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              {activeBlock === 'diarias' ? (
                <div className="space-y-8">
                  {/* Seletor de Tipo */}
                  <div className="space-y-4">
                    <label className={labelClass}>Selecione o Tipo de Requisição</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => handleDiariaSubTypeChange('diaria')}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${content.subType === 'diaria' ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-500/10' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                      >
                        <Wallet className={`w-8 h-8 mb-3 ${content.subType === 'diaria' ? 'text-indigo-600' : 'text-slate-300'}`} />
                        <h4 className="font-bold text-slate-900">Diária</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">Viagem / Hospedagem</p>
                      </button>
                      <button 
                        onClick={() => handleDiariaSubTypeChange('custeio')}
                        className={`p-6 rounded-2xl border-2 text-left transition-all ${content.subType === 'custeio' ? 'bg-indigo-50 border-indigo-600 ring-4 ring-indigo-500/10' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                      >
                        <Banknote className={`w-8 h-8 mb-3 ${content.subType === 'custeio' ? 'text-indigo-600' : 'text-slate-300'}`} />
                        <h4 className="font-bold text-slate-900">Custeio</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase">Despesas Diversas</p>
                      </button>
                    </div>
                  </div>

                  {content.subType && content.diariaFields && (
                    <div className="space-y-8 animate-slide-up pb-10">
                      {/* Dados Pessoais */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 flex items-center gap-2"><UserIcon className="w-3 h-3" /> 1. Dados do Proponente</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className={labelClass}>Nome Completo</label>
                            <input type="text" value={content.diariaFields.nome} onChange={e => handleDiariaFieldUpdate('nome', e.target.value)} className={inputClass} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Cargo</label>
                              <input type="text" value={content.diariaFields.cargo} onChange={e => handleDiariaFieldUpdate('cargo', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Setor</label>
                              <input type="text" value={content.diariaFields.setor} onChange={e => handleDiariaFieldUpdate('setor', e.target.value)} className={inputClass} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dados Viagem */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 flex items-center gap-2"><Map className="w-3 h-3" /> 2. Detalhes da Viagem</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label className={labelClass}>Cidade de Destino / Órgão</label>
                            <input type="text" value={content.diariaFields.destino} onChange={e => handleDiariaFieldUpdate('destino', e.target.value)} className={inputClass} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Data Saída</label>
                              <input type="date" value={content.diariaFields.dataSaida} onChange={e => handleDiariaFieldUpdate('dataSaida', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Hora Saída</label>
                              <input type="time" value={content.diariaFields.horaSaida} onChange={e => handleDiariaFieldUpdate('horaSaida', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Data Retorno</label>
                              <input type="date" value={content.diariaFields.dataRetorno} onChange={e => handleDiariaFieldUpdate('dataRetorno', e.target.value)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Hora Retorno</label>
                              <input type="time" value={content.diariaFields.horaRetorno} onChange={e => handleDiariaFieldUpdate('horaRetorno', e.target.value)} className={inputClass} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>Hospedagem (Noites)</label>
                              <input type="number" min="0" value={content.diariaFields.hospedagem} onChange={e => handleDiariaFieldUpdate('hospedagem', parseInt(e.target.value) || 0)} className={inputClass} />
                            </div>
                            <div>
                              <label className={labelClass}>Distância (KM)</label>
                              <input type="number" min="0" value={content.diariaFields.distancia} onChange={e => handleDiariaFieldUpdate('distancia', parseInt(e.target.value) || 0)} className={inputClass} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Motivo e Financeiro */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-2 flex items-center gap-2"><DollarSign className="w-3 h-3" /> 3. Motivo e Financeiro</h3>
                        <div>
                          <label className={labelClass}>Descrição / Motivo da Viagem</label>
                          <textarea rows={4} value={content.diariaFields.motivoViagem} onChange={e => handleDiariaFieldUpdate('motivoViagem', e.target.value)} className={`${inputClass} resize-none`} placeholder="Descreva o motivo detalhadamente..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Valor Requerido</label>
                            <div className="relative">
                              < DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input type="text" value={content.diariaFields.valorRequerido} onChange={e => handleDiariaFieldUpdate('valorRequerido', formatCurrency(e.target.value))} className={`${inputClass} pl-10`} />
                            </div>
                          </div>
                          <div>
                            <label className={labelClass}>Autorização Por</label>
                            <input type="text" value={content.diariaFields.autorizacaoPor} onChange={e => handleDiariaFieldUpdate('autorizacaoPor', e.target.value)} className={inputClass} placeholder="Nome do Gestor" />
                          </div>
                        </div>
                      </div>

                      {/* Seleção de Assinatura */}
                      <div className="pt-6 border-t border-slate-200">
                        <label className={labelClass}>Responsável pela Assinatura</label>
                        <div className="grid gap-2 mt-3">
                          {allowedSignatures.map(sig => (
                            <button 
                              key={sig.id} 
                              onClick={() => onUpdate({...state, content: {...content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector}})}
                              className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${content.signatureName === sig.name ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/10' : 'bg-white border-slate-200'}`}
                            >
                              <div className={`p-2 rounded-lg ${content.signatureName === sig.name ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><PenTool className="w-4 h-4" /></div>
                              <div><p className="text-xs font-bold">{sig.name}</p><p className="text-[10px] uppercase font-medium opacity-60">{sig.role}</p></div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <label className={labelClass}>Título do Documento</label>
                    <input 
                      value={content.title} 
                      onChange={(e) => handleUpdate('content', 'title', e.target.value)} 
                      className={inputClass} 
                      placeholder="Ex: Ofício nº 001/2024" 
                    />
                  </div>
                  {/* Outros campos de Ofício padrão... */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div ref={editorRef} contentEditable onInput={e => handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML)} className="p-6 min-h-[400px] outline-none text-sm leading-relaxed" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab === 'content' && (
          <div className="p-6 border-t border-slate-100 bg-white">
            <button 
              onClick={handleFinishWithAnimation} 
              disabled={finishStatus === 'loading'}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${finishStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-xl'}`}
            >
              {finishStatus === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {finishStatus === 'loading' ? 'Salvando...' : finishStatus === 'success' ? 'Salvo!' : 'Finalizar e Salvar'}
            </button>
          </div>
        )}
      </div>
    </>
  );
};
