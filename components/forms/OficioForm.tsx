
import React, { useRef, useEffect } from 'react';
import { 
  FileText, Columns, Bold, Italic, Underline, Highlighter, Quote, 
  RemoveFormatting, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  PenTool, CheckCircle2, ChevronRight
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

export const OficioForm: React.FC<OficioFormProps> = ({ 
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

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) handleUpdate('content', 'body', editorRef.current.innerHTML);
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
      span.innerHTML = `"${tag.innerHTML}"`;
      tag.parentNode?.replaceChild(span, tag);
    });
    if (editorRef.current) handleUpdate('content', 'body', editorRef.current.innerHTML);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Identificação do Ofício</h3>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-semibold text-slate-500 mb-2">Assunto / Título</label>
            <input 
              value={content.title} 
              onChange={(e) => handleUpdate('content', 'title', e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:bg-white transition-all outline-none" 
              placeholder="Ex: Solicitação de Material" 
            />
        </div>
      </div>

      <div className="space-y-6 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><Columns className="w-4 h-4" /> Blocos de Endereçamento</h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">Bloco Direito (Destino)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={docConfig.showRightBlock} onChange={(e) => handleUpdate('document', 'showRightBlock', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
               </div>
               {docConfig.showRightBlock && (
                  <textarea 
                    value={content.rightBlockText} 
                    onChange={(e) => handleUpdate('content', 'rightBlockText', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all"
                  />
               )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase">Bloco Esquerdo (Ref)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={docConfig.showLeftBlock} onChange={(e) => handleUpdate('document', 'showLeftBlock', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
               </div>
               {docConfig.showLeftBlock && (
                  <textarea 
                    value={content.leftBlockText} 
                    onChange={(e) => handleUpdate('content', 'leftBlockText', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs h-24 resize-none focus:bg-white transition-all"
                  />
               )}
            </div>
         </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><FileText className="w-4 h-4" /> Corpo do Ofício</h3>
         <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-2 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1">
              <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600"><Bold className="w-4 h-4" /></button>
              <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600"><Italic className="w-4 h-4" /></button>
              <button onClick={() => execCommand('justifyFull')} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-slate-600"><AlignJustify className="w-4 h-4" /></button>
              <button onClick={applyCitation} className="p-1.5 hover:bg-slate-200 rounded transition-colors text-indigo-600"><Quote className="w-4 h-4" /></button>
            </div>
            <div 
              ref={editorRef}
              contentEditable
              onInput={(e) => handleUpdate('content', 'body', (e.target as HTMLDivElement).innerHTML)}
              className="w-full bg-white p-6 text-sm leading-relaxed min-h-[300px] outline-none prose prose-slate max-w-none"
            />
         </div>
      </div>

      <div className="space-y-4 border-t border-slate-200 pt-6">
         <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2"><PenTool className="w-4 h-4" /> Assinatura</h3>
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
