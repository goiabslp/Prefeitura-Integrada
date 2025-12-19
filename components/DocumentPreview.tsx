
import React, { forwardRef, useMemo } from 'react';
import { AppState, BlockType } from '../types';

interface DocumentPreviewProps {
  state: AppState;
  isGenerating?: boolean;
  mode?: 'admin' | 'editor';
  activeBlock?: BlockType | null;
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(({ 
  state, 
  isGenerating = false, 
  activeBlock
}, ref) => {
  const { branding, document: docConfig, content } = state;
  const watermarkImg = branding.watermark.imageUrl || branding.logoUrl;

  const isDiaria = activeBlock === 'diarias' || !!content.subType;

  const tdLabelClass = "border border-slate-300 p-2 text-[8.5pt] font-black uppercase text-slate-500 bg-slate-50/50 w-[20%]";
  const tdValueClass = "border border-slate-300 p-2 text-[9.5pt] font-medium text-slate-800";

  return (
    <div className={`flex justify-center items-start w-full h-full ${isGenerating ? 'bg-white' : 'bg-slate-100 pt-8 pb-20'}`}>
      <div id="preview-scaler" ref={ref} className={`origin-top transition-transform ${isGenerating ? 'scale-100' : 'scale-[0.55] md:scale-[0.65] xl:scale-[0.75]'}`}>
        <div id="document-preview-container" className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative flex flex-col p-[20mm] pt-[55mm] pb-[15mm] font-sans">
          
          {branding.watermark.enabled && watermarkImg && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
              <img src={watermarkImg} alt="" style={{ width: `${branding.watermark.size}%`, opacity: branding.watermark.opacity / 100, filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none' }} />
            </div>
          )}

          <div className="absolute top-0 left-0 w-full h-3 z-10" style={{ backgroundColor: branding.primaryColor }} />

          <div className="absolute top-8 left-[20mm] right-[20mm] h-32 z-20 flex justify-between items-start">
            <div className="flex-1">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" style={{ width: `${branding.logoWidth}mm`, maxHeight: '28mm' }} className="object-contain" />
              ) : (
                <div className="w-20 h-10 bg-slate-100 rounded" />
              )}
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Prefeitura de</span>
              <h2 className="text-sm font-black text-slate-900 uppercase">{docConfig.city}</h2>
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="absolute top-[42mm] left-[20mm] right-[20mm] border-b-2 border-slate-800" />

          <main className="relative z-10 mt-6 flex-1">
            <h1 className="text-2xl font-black mb-8 tracking-tight" style={{ color: branding.primaryColor }}>
              {content.title}
            </h1>

            {isDiaria && content.diariaFields ? (
              <div className="space-y-6 animate-fade-in">
                {/* Tabela Proponente */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600">1. Identificação do Proponente</div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      <tr>
                        <td className={tdLabelClass}>Nome:</td>
                        <td colSpan={3} className={tdValueClass}>{content.diariaFields.nome}</td>
                      </tr>
                      <tr>
                        <td className={tdLabelClass}>Cargo:</td>
                        <td className={tdValueClass}>{content.diariaFields.cargo}</td>
                        <td className={tdLabelClass}>Setor:</td>
                        <td className={tdValueClass}>{content.diariaFields.setor}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Tabela Viagem */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600">2. Dados da Viagem / Percurso</div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      <tr>
                        <td className={tdLabelClass}>Destino:</td>
                        <td colSpan={3} className={tdValueClass}>{content.diariaFields.destino}</td>
                      </tr>
                      <tr>
                        <td className={tdLabelClass}>Saída:</td>
                        <td className={tdValueClass}>
                          {content.diariaFields.dataSaida ? new Date(content.diariaFields.dataSaida + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} às {content.diariaFields.horaSaida || '-'}
                        </td>
                        <td className={tdLabelClass}>Retorno:</td>
                        <td className={tdValueClass}>
                          {content.diariaFields.dataRetorno ? new Date(content.diariaFields.dataRetorno + 'T00:00:00').toLocaleDateString('pt-BR') : '-'} às {content.diariaFields.horaRetorno || '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className={tdLabelClass}>Hospedagem:</td>
                        <td className={tdValueClass}>{content.diariaFields.hospedagem} noites</td>
                        <td className={tdLabelClass}>Distância:</td>
                        <td className={tdValueClass}>{content.diariaFields.distancia} KM (Total)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Justificativa */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600">3. Justificativa / Motivo da Solicitação</div>
                  <div className="border border-slate-300 p-4 min-h-[120px] text-[10pt] text-slate-800 text-justify leading-relaxed whitespace-pre-wrap">
                    {content.diariaFields.motivoViagem || 'Descrição do motivo...'}
                  </div>
                </div>

                {/* Financeiro */}
                <div className="space-y-1.5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-600">4. Autorização Financeira</div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      <tr>
                        <td className={tdLabelClass}>Valor Requerido:</td>
                        <td className={`${tdValueClass} font-black text-indigo-700`}>{content.diariaFields.valorRequerido}</td>
                        <td className={tdLabelClass}>Autorizado por:</td>
                        <td className={tdValueClass}>{content.diariaFields.autorizacaoPor}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-slate-700 text-[11pt] leading-loose text-justify whitespace-pre-wrap rich-content" dangerouslySetInnerHTML={{ __html: content.body }} />
            )}

            <div className="mt-20 flex flex-col items-center">
               <div className="w-[300px] border-t border-slate-900 pt-3 text-center">
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900">{content.signatureName}</p>
                  <p className="text-[10px] font-medium text-slate-500">{content.signatureRole}</p>
                  {content.signatureSector && <p className="text-[9px] text-slate-400 italic">Setor: {content.signatureSector}</p>}
               </div>
            </div>
          </main>

          <div className="absolute bottom-8 left-[20mm] right-[20mm] border-t border-slate-200 pt-4 flex justify-between items-end">
            <div className="max-w-[70%]">
              <p className="text-[9px] font-black text-slate-900 uppercase">Prefeitura Municipal de São José do Goiabal</p>
              <p className="text-[8px] text-slate-400 mt-1 whitespace-pre-wrap leading-tight">{docConfig.footerText}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';
