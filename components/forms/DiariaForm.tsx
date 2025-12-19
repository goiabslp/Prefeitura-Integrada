
import React, { useRef, useEffect } from 'react';
import { 
  Wallet, Banknote, CheckCircle2, FileText, Bold, Italic, AlignJustify, PenTool, ClipboardList
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
  docConfig, 
  allowedSignatures, 
  handleUpdate,
  onUpdate
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content.body) {
      editorRef.current.innerHTML = content.body;
    }
  }, [content.body]);

  const handleDiariaSubTypeChange = (type: 'diaria' | 'custeio') => {
    const newTitle = type === 'diaria' ? 'Requisição de Diária' : 'Requisição de Custeio';
    onUpdate({
        ...state,
        content: {
            ...state.content,
            subType: type,
            title: newTitle
        }
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-600" /> Selecione o Tipo
          </h3>
          <div className="grid grid-cols-2 gap-4">
             <button
               onClick={() => handleDiariaSubTypeChange('diaria')}
               className={`p-6 rounded-2xl border-2 text-left transition-all ${
                 content.subType === 'diaria' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200 hover:border-indigo-300'
               }`}
             >
                <div className="flex justify-between items-start">
                   <div className={`p-3 rounded-xl ${content.subType === 'diaria' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Wallet className="w-6 h-6" />
                   </div>
                   {content.subType === 'diaria' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <h4 className="mt-4 font-black text-lg text-slate-900">Diária</h4>
                <p className="text-xs text-slate-500">Solicitação de viagem/estadia.</p>
             </button>

             <button
               onClick={() => handleDiariaSubTypeChange('custeio')}
               className={`p-6 rounded-2xl border-2 text-left transition-all ${
                 content.subType === 'custeio' ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200 hover:border-indigo-300'
               }`}
             >
                <div className="flex justify-between items-start">
                   <div className={`p-3 rounded-xl ${content.subType === 'custeio' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Banknote className="w-6 h-6" />
                   </div>
                   {content.subType === 'custeio' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
                <h4 className="mt-4 font-black text-lg text-slate-900">Custeio</h4>
                <p className="text-xs text-slate-500">Reembolsos diversos.</p>
             </button>
          </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Título Automático</h3>
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold italic">
            {content.title || 'Selecione o tipo acima...'}
          </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Justificativa / Detalhes</h3>
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div 
              ref={editorRef}
              contentEditable
              onInput={(e) => handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML)}
              className="w-full bg-white p-6 text-sm leading-relaxed min-h-[300px] outline-none prose prose-slate max-w-none"
            />
         </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Responsável</h3>
         <div className="grid grid-cols-1 gap-3">
            {allowedSignatures.map((sig) => {
               const isSelected = content.signatureName === sig.name;
               return (
                  <button 
                    key={sig.id} 
                    onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} 
                    className={`text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                  >
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-bold text-slate-800">{sig.name}</p>
                           <p className="text-[10px] uppercase font-medium text-slate-500">{sig.role}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                     </div>
                  </button>
               );
            })}
         </div>
       </div>
    </div>
  );
};
