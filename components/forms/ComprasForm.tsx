
import React, { useRef, useEffect } from 'react';
import { ShoppingCart, FileText, PenTool, CheckCircle2 } from 'lucide-react';
import { AppState, ContentData, DocumentConfig, Signature } from '../../types';

interface ComprasFormProps {
  state: AppState;
  content: ContentData;
  docConfig: DocumentConfig;
  allowedSignatures: Signature[];
  handleUpdate: (section: keyof AppState, key: string, value: any) => void;
  onUpdate: (newState: AppState) => void;
}

export const ComprasForm: React.FC<ComprasFormProps> = ({ 
  state, 
  content, 
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

  return (
    <div className="space-y-8 animate-fade-in">
       <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-600" /> Requisição de Compra
          </h3>
          <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-semibold text-slate-500 mb-2">Finalidade da Compra</label>
              <input 
                value={content.title} 
                onChange={(e) => handleUpdate('content', 'title', e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none" 
                placeholder="Ex: Aquisição de Toners para TI" 
              />
          </div>
       </div>

       <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Itens e Quantidades</h3>
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
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Solicitante</h3>
         <div className="grid grid-cols-1 gap-3">
            {allowedSignatures.map((sig) => {
               const isSelected = content.signatureName === sig.name;
               return (
                  <button 
                    key={sig.id} 
                    onClick={() => onUpdate({ ...state, content: { ...state.content, signatureName: sig.name, signatureRole: sig.role, signatureSector: sig.sector }})} 
                    className={`text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-md' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                  >
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="text-sm font-bold text-slate-800">{sig.name}</p>
                           <p className="text-[10px] uppercase font-medium text-slate-500">{sig.role}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                     </div>
                  </button>
               );
            })}
         </div>
       </div>
    </div>
  );
};
