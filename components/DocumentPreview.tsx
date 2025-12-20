
import React, { forwardRef, useMemo } from 'react';
import { AppState } from '../types';

interface DocumentPreviewProps {
  state: AppState;
  isGenerating?: boolean;
  mode?: 'admin' | 'editor';
}

export const DocumentPreview = forwardRef<HTMLDivElement, DocumentPreviewProps>(({ 
  state, 
  isGenerating = false, 
  mode = 'editor'
}, ref) => {
  const { branding, document: docConfig, content } = state;
  const watermarkImg = branding.watermark.imageUrl || branding.logoUrl;
  const isDiaria = content.subType !== undefined;

  /**
   * Lógica de Paginação
   */
  const pages = useMemo(() => {
    if (isDiaria) {
      const result: { type: 'diaria-fom' | 'extra-flow'; content: string }[] = [{ type: 'diaria-fom', content: '' }];
      
      if (content.showExtraField && content.extraFieldText) {
        const text = content.extraFieldText;
        const MAX_CHARS_PER_PAGE = 2500; 
        const paragraphs = text.split('\n');
        
        let currentPageText = '';
        let currentChars = 0;

        paragraphs.forEach((p) => {
          if ((currentChars + p.length) > MAX_CHARS_PER_PAGE && currentPageText) {
            result.push({ type: 'extra-flow', content: currentPageText });
            currentPageText = p + '\n';
            currentChars = p.length;
          } else {
            currentPageText += p + '\n';
            currentChars += p.length;
          }
        });

        if (currentPageText) {
          result.push({ type: 'extra-flow', content: currentPageText });
        }
      }
      return result;
    }

    const MAX_LINES_PER_PAGE = 34; 
    const CHARS_PER_LINE = 75; 
    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    const resultPages: { type: 'standard'; content: string }[] = [];
    let currentPageContent = '';
    let currentLinesUsed = 0;

    blocks.forEach((blockHTML) => {
      if (!blockHTML?.trim()) return;
      const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
      const linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));
      
      if ((currentLinesUsed + linesInBlock) > MAX_LINES_PER_PAGE) {
        resultPages.push({ type: 'standard', content: currentPageContent });
        currentPageContent = blockHTML;
        currentLinesUsed = linesInBlock;
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += linesInBlock;
      }
    });
    
    if (currentPageContent) resultPages.push({ type: 'standard', content: currentPageContent });
    return resultPages;
  }, [content.body, content.extraFieldText, content.showExtraField, isDiaria]);

  const renderDiariaPage1 = () => {
    const showSigs = content.showDiariaSignatures !== false;
    return (
      <div className="w-full flex flex-col gap-2 text-[9.5pt] leading-tight text-slate-800">
        {/* Bloco de Endereçamento Esquerdo (Protocolo/Ofício) */}
        {docConfig.showLeftBlock && content.leftBlockText && (
          <div className="mb-2 text-left">
            <div 
              className="whitespace-pre-wrap font-bold"
              style={{ 
                fontSize: `${docConfig.leftBlockStyle?.size || 9}pt`, 
                color: docConfig.leftBlockStyle?.color || '#475569' 
              }}
            >
              {content.leftBlockText}
            </div>
          </div>
        )}

        {/* CARD 01: Beneficiário */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 px-3 py-1 border-b border-slate-300">
            <span className="font-black text-[7pt] text-slate-500 uppercase">01. Dados do Beneficiário</span>
          </div>
          <div className="p-2 space-y-1">
            <div>
              <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Nome do Servidor</span>
              <span className="font-bold text-[10pt] text-slate-900">{content.requesterName || '---'}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Cargo</span>
                <span className="font-semibold">{content.requesterRole || '---'}</span>
              </div>
              <div>
                <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Setor</span>
                <span className="font-semibold">{content.requesterSector || '---'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 02: Logística */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 px-3 py-1 border-b border-slate-300">
            <span className="font-black text-[7pt] text-slate-500 uppercase">02. Logística e Itinerário</span>
          </div>
          <div className="p-2">
            <div className="mb-1">
              <span className="text-[6pt] font-black text-slate-400 uppercase block leading-none">Destino / UF</span>
              <span className="font-bold">{content.destination || '---'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-1">
              <div className="bg-slate-50 p-1.5 border border-slate-200 rounded">
                <span className="text-[5.5pt] font-black text-slate-500 uppercase block">Saída</span>
                <span className="font-bold text-[8.5pt]">{content.departureDateTime ? new Date(content.departureDateTime).toLocaleString('pt-BR') : '---'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 border border-slate-200 rounded">
                <span className="text-[5.5pt] font-black text-slate-500 uppercase block">Retorno</span>
                <span className="font-bold text-[8.5pt]">{content.returnDateTime ? new Date(content.returnDateTime).toLocaleString('pt-BR') : '---'}</span>
              </div>
            </div>
            <div className="flex gap-4 text-[8pt]">
              <span><b className="text-slate-400 uppercase text-[6pt]">Pernoites:</b> {content.lodgingCount || 0}</span>
              <span><b className="text-slate-400 uppercase text-[6pt]">Distância:</b> {content.distanceKm || 0} KM</span>
            </div>
          </div>
        </div>

        {/* CARD 03: Financeiro */}
        <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
          <div className="bg-slate-100 px-3 py-1 border-b border-slate-300">
            <span className="font-black text-[7pt] text-slate-500 uppercase">03. Resumo Financeiro</span>
          </div>
          <div className="p-2 flex items-center justify-between">
            <div>
              <span className="text-[6pt] font-black text-slate-400 uppercase block">Valor Solicitado</span>
              <span className="text-[13pt] font-black text-indigo-600">{content.requestedValue || 'R$ 0,00'}</span>
            </div>
            <div className="text-center bg-amber-50 border border-amber-200 px-3 py-1 rounded">
              <span className="text-[5.5pt] font-black text-amber-600 uppercase block">Previsão Pagamento</span>
              <span className="text-[9pt] font-black text-amber-800">{content.paymentForecast || '---'}</span>
            </div>
            <div className="text-right">
              <span className="text-[6pt] font-black text-slate-400 uppercase block">Autorizado por</span>
              <span className="font-bold text-[9pt]">{content.authorizedBy || '---'}</span>
            </div>
          </div>
        </div>

        {/* CARD 04: Justificativa */}
        <div className="flex-1 flex flex-col border border-slate-900 rounded-lg overflow-hidden min-h-[40mm]">
          <div className="bg-slate-900 px-3 py-1">
            <span className="font-black text-[7pt] text-white uppercase tracking-widest">04. Justificativa Resumida</span>
          </div>
          <div className="p-4 text-justify leading-relaxed whitespace-pre-wrap flex-1 bg-white italic text-[10pt]">
            {content.descriptionReason || 'Nenhuma justificativa informada.'}
          </div>
        </div>

        {/* Assinaturas Fixas na Base da Página 1 */}
        {showSigs && (
          <div className="mt-auto pt-24 flex flex-col items-center gap-20 w-full">
            <div className="w-64 border-t border-slate-900 pt-1 text-center">
              <p className="font-black uppercase text-[8.5pt]">{content.requesterName || 'SERVIDOR SOLICITANTE'}</p>
              <p className="text-[7pt] text-slate-500 font-bold uppercase">Requerente</p>
            </div>
            <div className="grid grid-cols-2 w-full gap-8">
              <div className="border-t border-slate-900 pt-1 text-center">
                <p className="font-black uppercase text-[8pt]">Visto Contabilidade</p>
                <p className="text-[6.5pt] text-slate-500 font-bold uppercase">Tesouraria</p>
              </div>
              <div className="border-t border-slate-900 pt-1 text-center">
                <p className="font-black uppercase text-[8pt]">{content.signatureName || 'AUTORIZADOR'}</p>
                <p className="text-[6.5pt] text-slate-500 font-bold uppercase leading-none">{content.signatureRole || 'Responsável'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex justify-center items-start overflow-auto w-full h-full ${isGenerating ? 'bg-white p-0 m-0' : 'bg-slate-100 pt-8 pb-20'}`}>
      <div id="preview-scaler" ref={ref} className={`origin-top transition-transform duration-300 ${isGenerating ? 'scale-100 transform-none' : 'scale-[0.55] md:scale-[0.65] xl:scale-[0.75]'}`}>
        <div id="document-preview-container" className={isGenerating ? 'block w-[210mm] mx-auto p-0 bg-white' : 'flex flex-col items-center'}>
          {pages.map((page, pageIndex) => {
            return (
              <div
                key={pageIndex}
                className={`bg-white mx-auto flex flex-col relative ${branding.fontFamily} ${isGenerating ? 'mb-0' : 'mb-8 shadow-2xl ring-1 ring-black/5'}`}
                style={{
                  width: '210mm', height: isGenerating ? '296.5mm' : '297mm',
                  padding: '20mm', paddingTop: '52mm', paddingBottom: '20mm',
                  position: 'relative', overflow: 'hidden' 
                }}
              >
                {branding.watermark.enabled && watermarkImg && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img src={watermarkImg} alt="" style={{ width: `${branding.watermark.size}%`, opacity: branding.watermark.opacity / 100, objectFit: 'contain', filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none' }} />
                  </div>
                )}
                
                <div className="absolute top-0 left-0 w-full h-3 z-10" style={{ backgroundColor: branding.primaryColor }} />

                <div className="absolute top-8 left-[20mm] right-[20mm] h-32 z-20">
                  <div className="absolute top-0 flex" style={{ left: branding.logoAlignment === 'left' ? 0 : branding.logoAlignment === 'center' ? '50%' : 'auto', right: branding.logoAlignment === 'right' ? 0 : 'auto', transform: branding.logoAlignment === 'center' ? 'translateX(-50%)' : 'none' }}>
                    {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="object-contain" style={{ width: `${branding.logoWidth}mm`, maxHeight: '30mm' }} /> : <div className="bg-slate-50 border rounded flex items-center justify-center text-[10px]" style={{ width: `${branding.logoWidth}mm`, height: '20mm' }}>Logo</div>}
                  </div>
                  
                  <div className="absolute top-0 right-0 text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">{content.signatureSector || 'Prefeitura Municipal'}</span>
                    <h2 className="text-sm font-bold tracking-widest uppercase mb-0.5" style={{ color: branding.secondaryColor }}>{docConfig.city}</h2>
                    <p className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="absolute top-[40mm] left-[20mm] right-[20mm] border-b border-gray-400 z-20" />

                <main className="flex-1 mt-1 relative z-10 flex flex-col overflow-hidden h-full">
                  {page.type === 'diaria-fom' ? (
                    <>
                      <h1 className="font-black mb-4 leading-tight tracking-tighter text-indigo-900 uppercase text-[18pt] text-center border-b-2 border-indigo-100 pb-2">
                        {content.title}
                      </h1>
                      {renderDiariaPage1()}
                    </>
                  ) : page.type === 'extra-flow' ? (
                    <div className="flex flex-col h-full">
                       <div className="bg-slate-600 px-3 py-1 rounded-t-lg">
                          <span className="font-black text-[7.5pt] text-white uppercase tracking-widest">Informações Adicionais / Anexo - Cont.</span>
                       </div>
                       <div className="flex-1 p-6 border border-slate-300 border-t-0 rounded-b-lg bg-slate-50/30 text-[10.5pt] leading-relaxed text-justify whitespace-pre-wrap">
                          {page.content}
                       </div>
                    </div>
                  ) : (
                    <>
                      {pageIndex === 0 && (
                        <h1 className="font-bold mb-4 leading-tight tracking-tight text-[28pt]" style={{ color: docConfig.titleStyle?.color || branding.primaryColor, textAlign: docConfig.titleStyle?.alignment || 'left' }}>
                          {content.title}
                        </h1>
                      )}
                      <div className="max-w-none text-gray-700 leading-relaxed text-justify text-[11pt] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: page.content }} />
                    </>
                  )}
                </main>

                <div className="absolute bottom-6 left-[20mm] right-[20mm] pt-2 border-t border-gray-300 flex justify-between items-end text-[9px] z-20 bg-white">
                  <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <span className="font-bold text-gray-800 uppercase tracking-tighter">Prefeitura de São José do Goiabal - Minas Gerais</span>
                      <span className="text-gray-400 font-light whitespace-pre-wrap leading-tight">{docConfig.footerText}</span>
                  </div>
                  {docConfig.showPageNumbers && (
                    <span className="bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-bold">Pág. {pageIndex + 1}/{pages.length}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

DocumentPreview.displayName = 'DocumentPreview';
