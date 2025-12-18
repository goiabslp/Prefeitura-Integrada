import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Palette, Type, Layout, Image as ImageIcon, 
  FileText, Settings, Users, Home, Loader2, Wand2, 
  Download, Check, Save, ChevronDown, AlignLeft, 
  AlignCenter, AlignRight, Sparkles, FileType, MessageSquare,
  Bold, Italic, Underline, Highlighter, CaseUpper, MousePointerClick,
  PenTool, ChevronRight, ArrowLeft, Trash2, Heading, ShieldCheck
} from 'lucide-react';
import { AppState, FontFamily, User, Signature } from '../types';
import { FONT_OPTIONS } from '../constants';
import { generateDocumentContent } from '../services/geminiService';

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Estados para animação dos botões
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [finishStatus, setFinishStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Profissional');
  const [aiDocType, setAiDocType] = useState('Proposta Comercial');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uiLogoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  
  const { branding, document: docConfig, content, ui } = state;

  // Filtra assinaturas permitidas para o usuário atual
  const allowedSignatures = availableSignatures.filter(sig => 
    currentUser.role === 'admin' || (currentUser.allowedSignatureIds || []).includes(sig.id)
  );

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
        ...state[section],
        [subSection]: {
          ...(state[section] as any)[subSection],
          [key]: value
        }
      }
    });
  };

  // Função para processar upload de imagem (Logo do Documento)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdate('branding', 'logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para processar upload de imagem (Logo da Home)
  const handleHomeLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdate('ui', 'homeLogoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para processar upload de imagem (Marca D'água)
  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleDeepUpdate('branding', 'watermark', 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateContent = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const { title, body } = await generateDocumentContent(aiTopic, aiTone, aiDocType);
      
      const htmlBody = body.replace(/\n/g, '<br>');

      onUpdate({
        ...state,
        content: {
          ...state.content,
          body: htmlBody,
          title: title
        }
      });
      
    } catch (error) {
      alert('Erro ao gerar conteúdo. Verifique a API Key.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Wrapper com animação para Finalizar
  const handleFinishWithAnimation = async () => {
      setFinishStatus('loading');
      // Simula processamento
      await new Promise(resolve => setTimeout(resolve, 800));
      setFinishStatus('success');
      
      // Fecha após mostrar o sucesso
      setTimeout(() => {
          setFinishStatus('idle');
          onClose();
      }, 1000);
  };

  // Wrapper com animação para Salvar Global
  const handleSaveDefaultWithAnimation = async () => {
      if (!onSaveDefault) return;
      
      setGlobalSaveStatus('loading');
      await new Promise(resolve => setTimeout(resolve, 800)); // Simula delay de rede/processamento
      
      onSaveDefault();
      setGlobalSaveStatus('success');
      
      setTimeout(() => {
          setGlobalSaveStatus('idle');
      }, 2000);
  };

  // Definição dos módulos do painel administrativo
  const adminModules = [
    {
       id: 'users',
       title: 'Usuários',
       description: 'Gerencie acessos e equipe',
       icon: <Users className="w-6 h-6 text-indigo-600" />,
       colorClass: 'bg-indigo-50 border-indigo-100 hover:border-indigo-300 hover:shadow-indigo-500/10'
    },
    {
       id: 'signatures',
       title: 'Assinaturas',
       description: 'Cadastre assinantes do sistema',
       icon: <PenTool className="w-6 h-6 text-emerald-600" />,
       colorClass: 'bg-emerald-50 border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-500/10'
    },
    {
       id: 'ui',
       title: 'Interface',
       description: 'Personalize a tela inicial',
       icon: <Home className="w-6 h-6 text-blue-600" />,
       colorClass: 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:shadow-blue-500/10'
    },
    {
       id: 'design',
       title: 'Design Doc',
       description: 'Identidade visual do PDF',
       icon: <Palette className="w-6 h-6 text-purple-600" />,
       colorClass: 'bg-purple-50 border-purple-100 hover:border-purple-300 hover:shadow-purple-500/10'
    }
  ];

  // Helper para renderizar cabeçalho da seção
  const renderSectionHeader = (title: string, subtitle?: string) => (
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
         {mode === 'admin' && (
             <button 
               onClick={() => onTabChange(null)}
               className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
               title="Voltar ao Menu"
             >
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
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel - LARGURA AUMENTADA PARA 600px/640px */}
      <div className={`fixed inset-y-0 left-0 w-full md:w-[600px] lg:w-[640px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Main Header (Close Button) */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'admin' ? 'Painel Administrativo' : 'Editor de Documento'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">

          {/* MODO ADMIN: MENU DE MÓDULOS (Se nenhuma aba ativa) */}
          {mode === 'admin' && !activeTab && (
             <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {adminModules.map((mod) => (
                      <button
                        key={mod.id}
                        onClick={() => onTabChange(mod.id)}
                        className={`p-6 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] flex flex-col gap-4 ${mod.colorClass}`}
                      >
                         <div className="p-3 bg-white rounded-xl w-fit shadow-sm">
                            {mod.icon}
                         </div>
                         <div>
                            <h3 className="font-bold text-slate-900 text-lg">{mod.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium opacity-80">{mod.description}</p>
                         </div>
                      </button>
                   ))}
                </div>
                
                <div className="p-6 bg-slate-100 rounded-2xl border border-slate-200 mt-8 text-center">
                   <p className="text-slate-500 text-sm">Selecione um módulo acima para editar suas configurações.</p>
                </div>
             </div>
          )}

          {/* Design Tab Content */}
          {activeTab === 'design' && (
            <div className="space-y-6 animate-slide-up">
               {renderSectionHeader('Design & Identidade', 'Configure cores, logos e fontes do documento')}
               
               {/* Seção Logotipo */}
               <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> Logotipo do Documento
                  </h3>
                  
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      {/* Upload de Logo */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-3">Imagem do Logo</label>
                        <div className="flex items-center gap-4">
                           <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                              {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Sem Logo</span>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button 
                                   onClick={() => handleUpdate('branding', 'logoUrl', null)}
                                   className="text-white text-xs hover:underline"
                                 >
                                   Remover
                                 </button>
                              </div>
                           </div>
                           <div className="flex-1">
                              <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleLogoUpload}
                                accept="image/*"
                                className="hidden"
                              />
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Carregar Imagem
                              </button>
                              <p className="text-[10px] text-slate-400 mt-2">Formatos: PNG, JPG (Fundo transparente recomendado)</p>
                           </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-2">Tamanho (mm)</label>
                           <input 
                              type="range" 
                              min="20" max="100" 
                              value={branding.logoWidth}
                              onChange={(e) => handleUpdate('branding', 'logoWidth', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                           />
                           <div className="text-right text-xs text-slate-400 mt-1">{branding.logoWidth}mm</div>
                        </div>
                        <div>
                           <label className="block text-xs font-semibold text-slate-500 mb-2">Alinhamento</label>
                           <div className="flex bg-slate-100 p-1 rounded-lg">
                              {(['left', 'center', 'right'] as const).map((align) => (
                                <button
                                  key={align}
                                  onClick={() => handleUpdate('branding', 'logoAlignment', align)}
                                  className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${branding.logoAlignment === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                                >
                                  {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                  {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                  {align === 'right' && <AlignRight className="w-4 h-4" />}
                                </button>
                              ))}
                           </div>
                        </div>
                      </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Cor Primária</label>
                        <div className="flex items-center gap-2">
                           <input 
                              type="color" 
                              value={branding.primaryColor}
                              onChange={(e) => handleUpdate('branding', 'primaryColor', e.target.value)}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                           />
                           <span className="text-xs font-mono text-slate-500">{branding.primaryColor}</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Cor Secundária</label>
                        <div className="flex items-center gap-2">
                           <input 
                              type="color" 
                              value={branding.secondaryColor}
                              onChange={(e) => handleUpdate('branding', 'secondaryColor', e.target.value)}
                              className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                           />
                           <span className="text-xs font-mono text-slate-500">{branding.secondaryColor}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Seção Cabeçalho e Rodapé */}
               <div className="space-y-4 border-t border-slate-200 pt-6">
                   <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                       <Layout className="w-4 h-4" /> Cabeçalho e Rodapé
                     </h3>
                   </div>
                   
                   <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Cidade do Cabeçalho</label>
                        <input 
                          value={docConfig.headerText}
                          onChange={(e) => handleUpdate('document', 'headerText', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                          placeholder="Ex: São José do Goiabal - MG"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Texto do Rodapé</label>
                        <textarea 
                          value={docConfig.footerText}
                          onChange={(e) => handleUpdate('document', 'footerText', e.target.value)}
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-4 pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                                type="checkbox"
                                checked={docConfig.showDate}
                                onChange={(e) => handleUpdate('document', 'showDate', e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                             />
                             <span className="text-sm text-slate-600">Mostrar Data</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                                type="checkbox"
                                checked={docConfig.showPageNumbers}
                                onChange={(e) => handleUpdate('document', 'showPageNumbers', e.target.checked)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                             />
                             <span className="text-sm text-slate-600">Numeração</span>
                          </label>
                      </div>
                   </div>
               </div>

               <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Type className="w-4 h-4" /> Tipografia
                  </h3>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                     <div className="grid grid-cols-1 gap-2">
                        {FONT_OPTIONS.map(font => (
                           <button
                              key={font.value}
                              onClick={() => handleUpdate('branding', 'fontFamily', font.value)}
                              className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                                branding.fontFamily === font.value 
                                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500' 
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                           >
                              <span className={font.value}>{font.label}</span>
                              {branding.fontFamily === font.value && <Check className="w-4 h-4" />}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Section: Estilo do Título */}
               <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Heading className="w-4 h-4" /> Estilo do Título
                  </h3>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Size */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Tamanho (pt)</label>
                            <input
                              type="range"
                              min="10" max="72"
                              value={docConfig.titleStyle?.size || 32}
                              onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'size', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-xs text-slate-400 mt-1">{docConfig.titleStyle?.size || 32}pt</div>
                        </div>

                        {/* Color */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-2">Cor do Título</label>
                            <div className="flex items-center gap-2">
                              <input
                                  type="color"
                                  value={docConfig.titleStyle?.color || branding.primaryColor}
                                  onChange={(e) => handleDeepUpdate('document', 'titleStyle', 'color', e.target.value)}
                                  className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
                              />
                              <span className="text-xs font-mono text-slate-500">{docConfig.titleStyle?.color}</span>
                            </div>
                        </div>
                      </div>

                      {/* Alignment */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">Alinhamento</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                onClick={() => handleDeepUpdate('document', 'titleStyle', 'alignment', align)}
                                className={`flex-1 p-1.5 rounded flex items-center justify-center transition-all ${
                                    (docConfig.titleStyle?.alignment || 'left') === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400'
                                }`}
                              >
                                {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                {align === 'right' && <AlignRight className="w-4 h-4" />}
                              </button>
                            ))}
                        </div>
                      </div>
                  </div>
               </div>
               
               <div className="space-y-4 border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Marca D'água
                  </h3>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Ativar Marca D'água</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={branding.watermark.enabled}
                            onChange={(e) => handleDeepUpdate('branding', 'watermark', 'enabled', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                     </div>
                     
                     {branding.watermark.enabled && (
                       <div className="space-y-4 pt-2 animate-fade-in">
                          {/* Upload da Marca D'água */}
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                              <label className="block text-xs font-semibold text-slate-500 mb-2">Imagem da Marca D'água</label>
                              <div className="flex items-center gap-4">
                                  {/* Preview */}
                                  <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden relative group">
                                      {branding.watermark.imageUrl ? (
                                          <img src={branding.watermark.imageUrl} alt="Watermark" className="w-full h-full object-contain p-1" />
                                      ) : (
                                          <div className="flex flex-col items-center justify-center text-slate-300">
                                            <ImageIcon className="w-6 h-6 mb-1" />
                                            <span className="text-[8px] uppercase font-bold">Padrão</span>
                                          </div>
                                      )}
                                      
                                      {branding.watermark.imageUrl && (
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button 
                                              onClick={() => handleDeepUpdate('branding', 'watermark', 'imageUrl', null)}
                                              className="text-white hover:text-red-300 transition-colors"
                                              title="Remover Imagem"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                      )}
                                  </div>

                                  {/* Upload Button */}
                                  <div>
                                     <input 
                                        type="file" 
                                        ref={watermarkInputRef}
                                        onChange={handleWatermarkUpload}
                                        accept="image/*"
                                        className="hidden"
                                     />
                                     <button 
                                        onClick={() => watermarkInputRef.current?.click()}
                                        className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2 shadow-sm"
                                     >
                                        <Upload className="w-3 h-3" />
                                        Carregar
                                     </button>
                                  </div>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2">
                                  Se nenhuma imagem for carregada, o logo principal será utilizado.
                              </p>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Opacidade (%)</label>
                            <input 
                              type="range" 
                              min="5" max="50" 
                              value={branding.watermark.opacity}
                              onChange={(e) => handleDeepUpdate('branding', 'watermark', 'opacity', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-xs text-slate-400">{branding.watermark.opacity}%</div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Tamanho (%)</label>
                            <input 
                              type="range" 
                              min="20" max="100" 
                              value={branding.watermark.size}
                              onChange={(e) => handleDeepUpdate('branding', 'watermark', 'size', Number(e.target.value))}
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="text-right text-xs text-slate-400">{branding.watermark.size}%</div>
                          </div>

                          <div className="flex items-center gap-2">
                             <input 
                               type="checkbox"
                               id="wm-grayscale"
                               checked={branding.watermark.grayscale}
                               onChange={(e) => handleDeepUpdate('branding', 'watermark', 'grayscale', e.target.checked)}
                               className="rounded text-indigo-600 focus:ring-indigo-500"
                             />
                             <label htmlFor="wm-grayscale" className="text-sm text-slate-700">Converter para Preto e Branco</label>
                          </div>
                       </div>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* UI Config Tab Content */}
          {activeTab === 'ui' && (
            <div className="space-y-6 animate-slide-up">
              {renderSectionHeader('Interface do App', 'Personalize a tela de login e home')}
              
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4">
                  {/* Upload Logo Home */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-3">Logo da Aplicação</label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-lg flex items-center justify-center overflow-hidden relative group">
                            {ui.homeLogoUrl ? (
                            <img src={ui.homeLogoUrl} alt="Logo Home" className="w-full h-full object-contain p-2" />
                            ) : (
                            <span className="text-xs text-slate-500 font-medium">Sem Logo</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                onClick={() => handleUpdate('ui', 'homeLogoUrl', null)}
                                className="text-white text-xs hover:underline"
                                >
                                Remover
                                </button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <input 
                            type="file" 
                            ref={uiLogoInputRef}
                            onChange={handleHomeLogoUpload}
                            accept="image/*"
                            className="hidden"
                            />
                            <button 
                            onClick={() => uiLogoInputRef.current?.click()}
                            className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-indigo-600 transition-colors flex items-center gap-2"
                            >
                            <Upload className="w-4 h-4" />
                            Carregar Imagem
                            </button>
                            <p className="text-[10px] text-slate-400 mt-2">Será exibido na tela de login e barra de navegação.</p>
                        </div>
                    </div>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-2">Altura do Logo (px)</label>
                     <input 
                        type="range" 
                        min="40" max="120" 
                        value={ui.homeLogoHeight}
                        onChange={(e) => handleUpdate('ui', 'homeLogoHeight', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                     />
                     <div className="text-right text-xs text-slate-400 mt-1">{ui.homeLogoHeight}px</div>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 mb-2">Posição na Navbar</label>
                     <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                          onClick={() => handleUpdate('ui', 'homeLogoPosition', 'left')}
                          className={`flex-1 p-2 rounded text-xs font-bold transition-all ${ui.homeLogoPosition === 'left' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                        >
                          Esquerda
                        </button>
                        <button
                          onClick={() => handleUpdate('ui', 'homeLogoPosition', 'center')}
                          className={`flex-1 p-2 rounded text-xs font-bold transition-all ${ui.homeLogoPosition === 'center' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                        >
                          Centro
                        </button>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {/* Content Tab (SOMENTE PARA MODO EDITOR) */}
          {mode !== 'admin' && activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
              {/* Assistente IA Modernizado */}
              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-violet-700 p-0.5 rounded-2xl shadow-lg shadow-indigo-500/20">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                 <div className="bg-white rounded-[14px] p-5 relative z-10">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                       <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                          <Sparkles className="w-4 h-4" />
                       </div>
                       <h4 className="text-sm font-bold text-slate-800">Assistente Inteligente</h4>
                       <span className="text-[10px] font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-0.5 rounded-full ml-auto">AI PRO</span>
                    </div>

                    <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <FileType className="w-3 h-3" /> Tipo
                             </label>
                             <select 
                                value={aiDocType}
                                onChange={(e) => setAiDocType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                             >
                                <option>Proposta Comercial</option>
                                <option>Relatório Técnico</option>
                                <option>Ofício</option>
                                <option>Memorando</option>
                                <option>Carta de Apresentação</option>
                                <option>Declaração</option>
                             </select>
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> Tom
                             </label>
                             <select 
                                value={aiTone}
                                onChange={(e) => setAiTone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
                             >
                                <option>Profissional</option>
                                <option>Persuasivo</option>
                                <option>Formal</option>
                                <option>Amigável</option>
                                <option>Direto</option>
                             </select>
                          </div>
                       </div>

                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                             Contexto / Pontos Chave
                          </label>
                          <textarea 
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            placeholder="Descreva o objetivo do documento, nomes importantes, valores ou dados técnicos..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none resize-none transition-all"
                            rows={3}
                          />
                       </div>

                       <button 
                          onClick={handleGenerateContent}
                          disabled={isGenerating || !aiTopic}
                          className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95 group"
                        >
                           {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                           <span>Gerar Conteúdo</span>
                        </button>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                   <FileText className="w-4 h-4" /> Informações
                 </h3>
                 
                 <div className="space-y-4">
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Título do Documento</label>
                      <input 
                        value={content.title}
                        onChange={(e) => handleUpdate('content', 'title', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-slate-800"
                        placeholder="Ex: Proposta Comercial"
                      />
                   </div>
                   
                   {/* Edição do Conteúdo (Textarea) */}
                   <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Conteúdo do Documento</label>
                      <textarea 
                        value={content.body.replace(/<br\s*\/?>/gi, '\n')}
                        onChange={(e) => handleUpdate('content', 'body', e.target.value.replace(/\r?\n/g, '<br>'))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none leading-relaxed"
                        rows={12}
                        placeholder="Digite o conteúdo do documento aqui..."
                      />
                      <p className="text-[10px] text-slate-400 mt-1 text-right">Use Enter para quebrar linhas.</p>
                   </div>
                 </div>
              </div>

              <div className="space-y-4 border-t border-slate-200 pt-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4" /> Assinatura
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={docConfig.showSignature}
                        onChange={(e) => handleUpdate('document', 'showSignature', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>

                 {docConfig.showSignature && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-4 animate-fade-in">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                           Selecione o Responsável
                        </h4>

                        {allowedSignatures.length > 0 ? (
                           <div className="grid grid-cols-1 gap-3">
                              {allowedSignatures.map((sig) => {
                                 const isSelected = content.signatureName === sig.name;
                                 return (
                                    <button
                                       key={sig.id}
                                       onClick={() => {
                                          onUpdate({
                                             ...state,
                                             content: {
                                                ...state.content,
                                                signatureName: sig.name,
                                                signatureRole: sig.role,
                                                signatureSector: sig.sector
                                             }
                                          });
                                       }}
                                       className={`text-left relative p-4 rounded-xl border transition-all duration-200 group ${
                                          isSelected
                                             ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                                             : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                                       }`}
                                    >
                                       <div className="flex items-start justify-between gap-3">
                                          <div>
                                             <p className={`text-sm font-bold leading-tight ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {sig.name}
                                             </p>
                                             <p className={`text-xs mt-1 ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                {sig.role}
                                             </p>
                                             {sig.sector && (
                                                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                                                   {sig.sector}
                                                </p>
                                             )}
                                          </div>
                                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                              isSelected 
                                                 ? 'bg-indigo-600 border-indigo-600' 
                                                 : 'bg-white border-slate-300 group-hover:border-indigo-400'
                                          }`}>
                                             {isSelected && <Check className="w-3 h-3 text-white" />}
                                          </div>
                                       </div>
                                    </button>
                                 );
                              })}
                           </div>
                        ) : (
                           <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center gap-2">
                              <ShieldCheck className="w-8 h-8 text-slate-300" />
                              <p className="text-sm text-slate-500">
                                 Você não possui assinaturas vinculadas.
                              </p>
                           </div>
                        )}
                    </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-slide-up">
               {renderSectionHeader('Gestão de Usuários')}
               <div className="p-4 bg-indigo-50 rounded-full">
                  <Users className="w-8 h-8 text-indigo-500" />
               </div>
               <div className="max-w-xs">
                 <h3 className="font-bold text-slate-900">Módulo Ativo</h3>
                 <p className="text-sm text-slate-500 mt-1">Utilize a tabela principal (à direita ou abaixo) para adicionar, editar ou remover usuários do sistema.</p>
               </div>
            </div>
          )}

          {activeTab === 'signatures' && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-slide-up">
               {renderSectionHeader('Gestão de Assinaturas')}
               <div className="p-4 bg-emerald-50 rounded-full">
                  <PenTool className="w-8 h-8 text-emerald-500" />
               </div>
               <div className="max-w-xs">
                 <h3 className="font-bold text-slate-900">Módulo Ativo</h3>
                 <p className="text-sm text-slate-500 mt-1">Utilize a tabela principal para cadastrar as assinaturas disponíveis.</p>
               </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {mode === 'admin' && activeTab && onSaveDefault && (
           <div className="p-6 border-t border-gray-200 bg-white z-20">
              <button
                onClick={handleSaveDefaultWithAnimation}
                disabled={globalSaveStatus === 'loading' || globalSaveStatus === 'success'}
                className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 ${
                    globalSaveStatus === 'success'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {globalSaveStatus === 'loading' ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                    </>
                ) : globalSaveStatus === 'success' ? (
                    <>
                        <Check className="w-4 h-4 animate-bounce" />
                        <span>Salvo!</span>
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        <span>Salvar Padrão Global</span>
                    </>
                )}
              </button>
           </div>
        )}

        {mode !== 'admin' && activeTab === 'content' && (
           <div className="p-6 border-t border-gray-200 bg-white/80 backdrop-blur-xl sticky bottom-0 z-20">
              <button
                  onClick={handleFinishWithAnimation}
                  disabled={finishStatus === 'loading' || finishStatus === 'success'}
                  className={`w-full font-bold py-3.5 px-6 rounded-xl shadow-xl transform hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 group ${
                      finishStatus === 'success'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {finishStatus === 'loading' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processando...</span>
                      </>
                  ) : finishStatus === 'success' ? (
                      <>
                        <span>Finalizado!</span>
                        <Check className="w-4 h-4 scale-110" />
                      </>
                  ) : (
                      <>
                        <span>Finalizar</span>
                        <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </>
                  )}
                </button>
           </div>
        )}

      </div>
    </>
  );
};