
import React from 'react';
import { FileDown, ArrowLeft, Edit3, Loader2, Check, FileCheck } from 'lucide-react';

interface FinalizedActionBarProps {
  onDownload: () => void;
  onBack: () => void;
  onEdit: () => void;
  isDownloading: boolean;
  documentTitle: string;
}

export const FinalizedActionBar: React.FC<FinalizedActionBarProps> = ({
  onDownload,
  onBack,
  onEdit,
  isDownloading,
  documentTitle
}) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-4 flex flex-col items-center gap-4 w-20 md:w-24">
        
        {/* Status Icon */}
        <div className="flex flex-col items-center mb-2 pb-4 border-b border-white/10 w-full">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
            <FileCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">Pronto</span>
        </div>

        <div className="flex flex-col items-center gap-3 w-full">
          {/* Sair/Voltar */}
          <button
            onClick={onBack}
            className="flex flex-col items-center justify-center gap-1 w-full p-2 text-slate-400 hover:text-white transition-all group"
            title="Sair para o Menu"
          >
            <div className="p-2 rounded-2xl group-hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Sair</span>
          </button>

          {/* Editar */}
          <button
            onClick={onEdit}
            className="flex flex-col items-center justify-center gap-1 w-full p-2 text-slate-400 hover:text-white transition-all group"
            title="Editar Documento"
          >
            <div className="p-2 rounded-2xl group-hover:bg-white/5 transition-colors">
              <Edit3 className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">Editar</span>
          </button>

          {/* Divisor */}
          <div className="w-8 h-px bg-white/10 my-1"></div>

          {/* Baixar PDF */}
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className={`flex flex-col items-center justify-center gap-1 w-full p-3 rounded-3xl transition-all active:scale-90 shadow-xl ${
              isDownloading 
                ? 'bg-emerald-500/20 text-emerald-400 cursor-wait' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
            title="Baixar o PDF"
          >
            {isDownloading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <FileDown className="w-6 h-6" />
            )}
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">PDF</span>
          </button>
        </div>

        {/* Info lateral (opcional/escondida em telas pequenas) */}
        <div className="hidden md:block mt-2 pt-4 border-t border-white/10 w-full text-center">
            <div className="h-10 overflow-hidden relative group cursor-help">
                <span className="text-[7px] text-white/20 font-bold uppercase rotate-90 absolute top-2 left-0 right-0 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {documentTitle || 'Documento'}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};
