
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Palette, Image as ImageIcon, 
  FileText, Settings, Users, Home, Loader2, 
  Check, Save, AlignLeft, 
  AlignCenter, AlignRight, AlignJustify,
  PenTool, ArrowLeft, Heading, Columns,
  Bold, Italic, Underline, Highlighter, Quote, RemoveFormatting
} from 'lucide-react';
import { AppState, User, Signature } from '../types';

interface AdminSidebarProps {
  state: AppState;
  onUpdate: (newState: AppState) => void;
  onPrint: () => void;
  isOpen: boolean;
  onClose: () => void;
  isDownloading: boolean;
  currentUser: User;
  mode: 'admin' | 'editor';
  onSaveDefault?: () => void;
  activeTab: string | null;
  onTabChange: (tab: any) => void;
  availableSignatures: Signature[];
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
  activeTab,
  onTabChange,
  availableSignatures
}) => {
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [finishStatus, setFinishStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uiLogoInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
  const { branding, document: docConfig, content, ui } = state;

  const allowedSignatures = availableSignatures.filter(sig => 
    currentUser.role === 'admin' || (currentUser.allowedSignatureIds || []).includes(sig.id)
  );

  // Sincroniza o conteúdo inicial do editor
  useEffect(() => {
    if (editorRef.current && mode === 'editor' && activeTab === 'content') {
      if (editorRef.current.innerHTML !== content.body) {
        editorRef.current.innerHTML = content.body;
      }
    }
  }, [activeTab, mode, content.body]);

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

  const handleHomeLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleUpdate('ui', 'homeLogoUrl', reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      handleUpdate('content', 'body', editorRef.current.innerHTML);
    }
  };

  // Função personalizada para aplicar tamanho de fonte em PT
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

  // Função personalizada para aplicar Citação (Aspas, Itálico e Fonte distinta)
  const applyCitation = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    // Marcamos a seleção temporariamente
    document.execCommand('foreColor', false, '#f0000f'); // Cor arbitrária para identificação
    
    const highlightedTags = editorRef.current?.querySelectorAll('font[color="#f0000f"]');
    highlightedTags?.forEach(tag => {
      const span = document.createElement('span');
      // Estilo de citação: Fonte distinta (Serif), itálico e aspas
      span.style.fontFamily = "'Merriweather', serif";
      span.style.fontStyle = 'italic';
      span.style.color = 'inherit'; // Resetamos a cor usada para marcação
      
      // Fix: Cast 'tag' to HTMLElement to access 'innerText' property which is not available on base 'Element' type
      const cleanText = (tag as HTMLElement).innerText?.trim() || '';
      // Adicionamos aspas se já não houver
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

  const handleFinishWithAnimation = async () => {
      setFinishStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 800));
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

  const adminModules = [
    { id: 'users', title: 'Usuários', description: 'Gerencie acessos e equipe', icon: <Users className="w-6 h-6 text-indigo-600" />, colorClass: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-500/10' },
    { id: 'signatures', title: 'Assinaturas', description: 'Cadastre assinantes do sistema', icon: <PenTool className="w-6 h-6 text-emerald-600" />, colorClass: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/10' },
    { id: 'ui', title: 'Interface', description: 'Personalize a tela inicial', icon: <Home className="w-6 h-6 text-blue-600" />, colorClass: 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:shadow-blue-500/10' },
    { id: 'design', title: 'Design Doc', description: 'Identidade visual do PDF', icon: <Palette className="w-6 h-6 text-purple-600" />, colorClass: 'bg-purple-50 border-purple-100 hover:border-purple-300 hover:shadow-purple-500/10' }
  ];

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

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity md:hidden" onClick={onClose} />}
      <div className={`fixed inset-y-0 left-0 w-full md:w-[600px] lg:w-[640px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div><h2 className="text-lg font-bold text-slate-900">{mode === 'admin' ? 'Painel Administrativo' : 'Editor de Documento'}</h2></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          {mode === 'admin' && !activeTab && (
             <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {adminModules.map((mod) => (
                      <button key={mod.id} onClick={() => onTabChange(mod.id)} className={`p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 ${mod.colorClass}`}>
                         <div className="p-3 bg-white rounded-xl w-fit shadow-sm">{mod.icon}</div>
                         <div><h3 className="font-bold text-slate-900 text-lg">{mod.title}</h3><p className="text-sm text-slate-500 mt-1 font-medium opacity-80">{mod.description}</p></div>
                      </button>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6 animate-slide-up">
               {renderSectionHeader('Design & Identidade', 'Configure cores, logos e fontes do documento')}
               
               <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Logotipo do Documento</h3>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem do Logo</label>
                        <div className="flex items-center gap-4">
                           <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                              {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" /> : <span className="text-xs text-slate-400 font-medium">Sem Logo</span>}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button onClick={() => handleUpdate('branding', 'logoUrl', null)} className="text-white text-xs hover:underline">Remover</button>
                              </div>
                           </div>
                           <div className="flex-1">
                              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"><Upload className="w-4 h-4" />Carregar Imagem</button>
                           </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-2">Tamanho (mm)</label>
                           <input type="range" min="20" max="100" value={branding.logoWidth} onChange={(e) => handleUpdate('branding', 'logoWidth', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                           <div className="text-right text-xs text-slate-400 mt-1">{branding.logoWidth}mm</div>
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-2">Alinhamento</label>
                           <div className="flex bg-slate-100 p-1 rounded-lg">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <button key={align} onClick={() => handleUpdate('branding', 'logoAlignment', align)} className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${branding.logoAlignment === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>
                                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                  </div>
               </div>

               {/* Estilo dos Blocos Laterais (Invertidos para refletir o preview) */}
               <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Columns className="w-4 h-4" /> Design dos Blocos Laterais</h3>
                  <div className="grid grid-cols-2 gap-4">
                      {/* Bloco Direito (Agora na Esquerda no painel para casar com o preview) */}
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloco Direito (Endereçamento)</span>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Fonte (pt)</label>
                            <input type="number" value={docConfig.rightBlockStyle.size} onChange={(e) => handleDeepUpdate('document', 'rightBlockStyle', 'size', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" />
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor</label>
                            <input type="color" value={docConfig.rightBlockStyle.color} onChange={(e) => handleDeepUpdate('document', 'rightBlockStyle', 'color', e.target.value)} className="w-full h-6 rounded cursor-pointer border-0 p-0" />
                         </div>
                      </div>
                      {/* Bloco Esquerdo (Agora na Direita no painel para casar com o preview) */}
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bloco Esquerdo (Ofício Info)</span>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Fonte (pt)</label>
                            <input type="number" value={docConfig.leftBlockStyle.size} onChange={(e) => handleDeepUpdate('document', 'leftBlockStyle', 'size', Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs" />
                         </div>
                         <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Cor</label>
                            <input type="color" value={docConfig.leftBlockStyle.color} onChange={(e) => handleDeepUpdate('document', 'leftBlockStyle', 'color', e.target.value)} className="w-full h-6 rounded cursor-pointer border-0 p-0" />
                         </div>
                      </div>
                  </div>
               </div>

               <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Heading className="w-4 h-4" /> Estilo do Título</h3>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Tamanho (pt)</label>
                            <input type="range" min="10" max="72" value={docConfig.titleStyle?.size || 32} onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'size', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                            <div className="text-right text-xs text-slate-400 mt-1">{docConfig.titleStyle?.size || 32}pt</div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor do Título</label>
                            <div className="flex items-center gap-2"><input type="color" value={docConfig.titleStyle?.color || branding.primaryColor} onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'color', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" /><span className="text-xs font-mono text-slate-500">{docConfig.titleStyle?.color}</span></div>
                        </div>
                      </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ui' && (
            <div className="space-y-6 animate-slide-up">
              {renderSectionHeader('Interface do App', 'Personalize a tela de login e home')}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-3">Logo da Aplicação</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                            {ui.homeLogoUrl ? <img src={ui.homeLogoUrl} alt="Logo Home" className="w-full h-full object-contain p-2" /> : <span className="text-xs text-slate-500 font-medium">Sem Logo</span>}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => handleUpdate('ui', 'homeLogoUrl', null)} className="text-white text-xs hover:underline">Remover</button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <input type="file" ref={uiLogoInputRef} onChange={handleHomeLogoUpload} accept="image/*" className="hidden" />
                            <button onClick={() => uiLogoInputRef.current?.click()} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"><Upload className="w-4 h-4" />Carregar Imagem</button>
                        </div>
                    </div>
                  </div>
              </div>
            </div>
          )}

          {mode !== 'admin' && activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Columns className="w-4 h-4" /> Blocos de Texto Laterais</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ativação Bloco Direito (Agora na Esquerda no painel para casar com o preview) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase">Bloco Direito (Endereçamento)</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={docConfig.showRightBlock} onChange={(e) => handleUpdate('document', 'showRightBlock', e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                       </div>
                       {docConfig.showRightBlock && (
                          <textarea 
                            value={content.rightBlockText} 
                            onChange={(e) => handleUpdate('content', 'rightBlockText', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all"
                            placeholder="Ex: Ao Excelentíssimo..."
                          />
                       )}
                    </div>

                    {/* Ativação Bloco Esquerdo (Agora na Direita no painel para casar com o preview) */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                       <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase">Bloco Esquerdo (Ofício Info)</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={docConfig.showLeftBlock} onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                       </div>
                       {docConfig.showLeftBlock && (
                          <textarea 
                            value={content.leftBlockText} 
                            onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all"
                            placeholder="Ex: Ofício nº 001/2024..."
                          />
                       )}
                    </div>
                 </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-6">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Conteúdo Principal</h3>
                 <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Título do Documento</label>
                      <input value={content.title} onChange={(e) => handleUpdate('content', 'title', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800" placeholder="Ex: Proposta Comercial" />
                   </div>
                   
                   {/* Editor de Texto Rico */}
                   <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Conteúdo do Documento</label>
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        {/* Toolbar do Editor */}
                        <div className="p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 sticky top-0 z-10">
                          <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Negrito"><Bold className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Itálico"><Italic className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Sublinhado"><Underline className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('hiliteColor', 'yellow')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Grifar"><Highlighter className="w-4 h-4" /></button>
                          
                          <div className="w-px h-4 bg-slate-300 mx-1 self-center" />
                          
                          <select 
                            onChange={(e) => applyFontSize(e.target.value)} 
                            className="bg-white border border-slate-200 rounded text-[10px] px-1 h-7 focus:outline-none" 
                            title="Tamanho da Fonte (pt)"
                            defaultValue="11pt"
                          >
                            <option value="10pt">10pt</option>
                            <option value="11pt">11pt (Padrão)</option>
                            <option value="12pt">12pt</option>
                            <option value="14pt">14pt</option>
                            <option value="16pt">16pt</option>
                            <option value="18pt">18pt</option>
                            <option value="20pt">20pt</option>
                            <option value="24pt">24pt</option>
                            <option value="28pt">28pt</option>
                          </select>
                          
                          <div className="w-px h-4 bg-slate-300 mx-1 self-center" />
                          
                          <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Alinhar Esquerda"><AlignLeft className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Centralizar"><AlignCenter className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Alinhar Direita"><AlignRight className="w-4 h-4" /></button>
                          <button onClick={() => execCommand('justifyFull')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600" title="Justificar"><AlignJustify className="w-4 h-4" /></button>
                          
                          <div className="w-px h-4 bg-slate-300 mx-1 self-center" />
                          
                          <button onClick={applyCitation} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-indigo-600" title="Inserir Citação"><Quote className="w-4 h-4" /></button>
                          
                          <div className="w-px h-4 bg-slate-300 mx-1 self-center" />
                          
                          <button onClick={() => execCommand('removeFormat')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-red-500" title="Limpar Formatação"><RemoveFormatting className="w-4 h-4" /></button>
                        </div>
                        
                        {/* Área Editável */}
                        <div 
                          ref={editorRef}
                          contentEditable
                          onInput={(e) => handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML)}
                          className="w-full bg-white p-4 text-sm leading-relaxed min-h-[400px] outline-none prose prose-slate max-w-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">* Use a barra de ferramentas para formatar o texto selecionado.</p>
                   </div>
                 </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Settings className="w-4 h-4" /> Assinatura</h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={docConfig.showSignature} onChange={(e) => handleUpdate('document', 'showSignature', e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
                 {docConfig.showSignature && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-fade-in">
                        {allowedSignatures.map((sig) => {
                           const isSelected = content.signatureName === sig.name;
                           return (
                              <button key={sig.id} onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} className={`text-left relative p-4 rounded-xl border transition-all duration-200 group ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                 <div className="flex items-start justify-between gap-3">
                                    <div><p className={`text-sm font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>{sig.name}</p><p className={`text-xs mt-1 ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>{sig.role}</p></div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{isSelected && <Check className="w-3 h-3 text-white" />}</div>
                                 </div>
                              </button>
                           );
                        })}
                    </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {mode === 'admin' && activeTab && onSaveDefault && (
           <div className="p-6 border-t border-gray-200 bg-white z-20">
              <button onClick={handleSaveDefaultWithAnimation} disabled={globalSaveStatus === 'loading' || globalSaveStatus === 'success'} className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${globalSaveStatus === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-900 text-white'}`}>
                {globalSaveStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Salvando...</span></> : globalSaveStatus === 'success' ? <><Check className="w-4 h-4 animate-bounce" /><span>Salvo!</span></> : <><Save className="w-4 h-4" /><span>Salvar Padrão Global</span></>}
              </button>
           </div>
        )}

        {mode !== 'admin' && activeTab === 'content' && (
           <div className="p-6 border-t border-gray-200 bg-white/80 backdrop-blur-xl sticky bottom-0 z-20">
              <button onClick={handleFinishWithAnimation} disabled={finishStatus === 'loading' || finishStatus === 'success'} className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-xl transform transition-all duration-300 flex items-center justify-center gap-3 ${finishStatus === 'success' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                  {finishStatus === 'loading' ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Processando...</span></> : finishStatus === 'success' ? <><Check className="w-4 h-4" /><span>Finalizado!</span></> : <><Check className="w-4 h-4" /><span>Finalizar</span></>}
              </button>
           </div>
        )}
      </div>
    </>
  );
};
