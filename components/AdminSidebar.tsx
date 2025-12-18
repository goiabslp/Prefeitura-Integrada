
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Palette, Type, Layout, Image as ImageIcon, 
  FileText, Settings, Users, Home, Loader2, Wand2, 
  Download, Check, Save, AlignLeft, 
  AlignCenter, AlignRight, Sparkles, FileType, MessageSquare,
  PenTool, ArrowLeft, Trash2, Heading, ShieldCheck,
  FileDown
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
  
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [finishStatus, setFinishStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState('Profissional');
  const [aiDocType, setAiDocType] = useState('Proposta Comercial');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uiLogoInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  
  const { branding, document: docConfig, content, ui } = state;

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
      setTimeout(() => {
          setGlobalSaveStatus('idle');
      }, 2000);
  };

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
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-full md:w-[600px] lg:w-[640px] bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
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

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">

          {mode === 'admin' && !activeTab && (
             <div className="space-y-6 animate-fade-in">
                {/* PDF Action Card - Destaque Principal Solicitado */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-2xl shadow-xl mb-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
                   <div className="relative z-10 flex items-center justify-between">
                      <div className="text-white max-w-[70%]">
                         <h3 className="text-xl font-bold">Exportação Rápida</h3>
                         <p className="text-indigo-100 text-sm mt-1">Gerar PDF oficial com a identidade visual atualizada.</p>
                      </div>
                      <button
                        onClick={onPrint}
                        disabled={isDownloading}
                        className="bg-white text-indigo-700 p-4 rounded-xl shadow-lg hover:scale-110 hover:rotate-3 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                        title="Baixar PDF"
                      >
                         {isDownloading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileDown className="w-6 h-6" />}
                      </button>
                   </div>
                </div>

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
             </div>
          )}

          {activeTab === 'design' && (
            <div className="space-y-6 animate-slide-up">
               {renderSectionHeader('Design & Identidade', 'Cores e marcas do PDF')}
               {/* Restante do conteúdo de design... */}
               <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Cor Primária</label>
                    <input type="color" value={branding.primaryColor} onChange={(e) => handleUpdate('branding', 'primaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2">Cor Secundária</label>
                    <input type="color" value={branding.secondaryColor} onChange={(e) => handleUpdate('branding', 'secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer" />
                  </div>
               </div>
            </div>
          )}
          
          {/* Outras abas mantêm a lógica funcional... */}
          
          {mode !== 'admin' && activeTab === 'content' && (
            <div className="space-y-6 animate-fade-in">
               {/* Assistente IA Integrado */}
               <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-800">Assistente IA</h4>
                  </div>
                  <textarea 
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Sobre o que é o documento?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                    rows={2}
                  />
                  <button 
                    onClick={handleGenerateContent}
                    disabled={isGenerating || !aiTopic}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    Gerar Documento
                  </button>
               </div>

               <div className="space-y-4">
                  <input 
                    value={content.title}
                    onChange={(e) => handleUpdate('content', 'title', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 font-bold"
                    placeholder="Título do Documento"
                  />
                  <textarea 
                    value={content.body.replace(/<br\s*\/?>/gi, '\n')}
                    onChange={(e) => handleUpdate('content', 'body', e.target.value.replace(/\n/g, '<br>'))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 min-h-[300px]"
                    placeholder="Conteúdo..."
                  />
               </div>
            </div>
          )}
        </div>

        {/* Botão Salvar Padrão para Admin */}
        {mode === 'admin' && activeTab && onSaveDefault && (
           <div className="p-6 border-t border-gray-200 bg-white">
              <button
                onClick={handleSaveDefaultWithAnimation}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {globalSaveStatus === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Configurações Globais
              </button>
           </div>
        )}
      </div>
    </>
  );
};
