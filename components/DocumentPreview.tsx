
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

  const pages = useMemo(() => {
    /**
     * Lógica de Paginação Otimizada
     */
    const isDiaria = content.subType !== undefined;
    // Para diárias, permitimos mais densidade e tentamos manter tudo em uma página
    const MAX_LINES_PER_PAGE = isDiaria ? 40 : 34; 
    const CHARS_PER_LINE = 75; 
    
    const titleFontSizeFactor = isDiaria ? 1.5 : (docConfig.titleStyle?.size || 32) / 12;
    const titleLines = Math.max(1, Math.ceil((content.title.length * titleFontSizeFactor) / CHARS_PER_LINE)) + 1;
    
    const LATERAL_BLOCKS_COST = (docConfig.showLeftBlock || docConfig.showRightBlock) ? 8 : 0;
    const SIGNATURE_COST = isDiaria ? 0 : 6; // Para diárias, a assinatura é parte do body estruturado em flexbox

    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    
    const resultPages: string[] = [];
    let currentPageContent = '';
    let currentLinesUsed = titleLines + LATERAL_BLOCKS_COST; 

    for (let i = 0; i < blocks.length; i++) {
      let blockHTML = blocks[i];
      if (blockHTML === undefined || blockHTML === null) continue;

      const isBlockTag = /^(<p|<div|<h|<ul|<ol|<li>|<table)/i.test(blockHTML.trim());
      
      if (!blockHTML.trim() && !isBlockTag) {
         blockHTML = '<div style="min-height: 1.1em;">&nbsp;</div>';
      } else if (!isBlockTag) {
         blockHTML = `<div>${blockHTML}</div>`;
      }

      const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' '; 
      
      // Tabelas têm custo fixo de altura em linhas estimado
      const isTable = /<table/i.test(blockHTML);
      const linesInBlock = isTable ? 10 : Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));
      const blockCost = linesInBlock;

      if ((currentLinesUsed + blockCost) > MAX_LINES_PER_PAGE && !isDiaria) {
        resultPages.push(currentPageContent);
        currentPageContent = blockHTML;
        currentLinesUsed = blockCost;
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += blockCost;
      }
    }
    
    if (currentPageContent) {
      if (docConfig.showSignature && !isDiaria && (currentLinesUsed + SIGNATURE_COST) > MAX_LINES_PER_PAGE) {
         resultPages.push(currentPageContent);
         resultPages.push(''); 
      } else {
         resultPages.push(currentPageContent);
      }
    } else if (docConfig.showSignature && !isDiaria && resultPages.length > 0) {
       resultPages.push(''); 
    }

    return resultPages.length > 0 ? resultPages : [''];
  }, [content.body, content.title, docConfig.showSignature, docConfig.showLeftBlock, docConfig.showRightBlock, docConfig.titleStyle?.size, content.subType]);

  const getBlockStyle = (styleConfig: { size: number, color: string }, isLeft: boolean) => ({
    fontSize: `${styleConfig.size}pt`,
    color: styleConfig.color,
    textAlign: isLeft ? 'left' as const : 'right' as const,
    lineHeight: '1.2',
    maxHeight: `calc(${styleConfig.size}pt * 1.2 * 6)`, 
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 6,
    WebkitBoxOrient: 'vertical' as const,
    wordBreak: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
  });

  return (
    <div className={`flex justify-center items-start overflow-auto w-full h-full ${isGenerating ? 'bg-white p-0 m-0' : 'bg-slate-100 pt-8 pb-20'}`}>
      <div id="preview-scaler" ref={ref} className={`origin-top transition-transform duration-300 ${isGenerating ? 'scale-100 transform-none' : 'scale-[0.55] md:scale-[0.65] xl:scale-[0.75]'}`}>
        <div id="document-preview-container" className={isGenerating ? 'block w-[210mm] mx-auto p-0 bg-white' : 'flex flex-col items-center'}>
          {pages.map((pageContent, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;
            const isDiaria = content.subType !== undefined;

            return (
              <div
                key={pageIndex}
                className={`bg-white mx-auto flex flex-col relative ${branding.fontFamily} ${isGenerating ? 'mb-0' : 'mb-8 shadow-2xl ring-1 ring-black/5'}`}
                style={{
                  width: '210mm', height: isGenerating ? '296.5mm' : '297mm',
                  padding: '20mm', paddingTop: '52mm', paddingBottom: '12mm',
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
                    <span className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">
                      {content.signatureSector || 'Prefeitura Municipal'}
                    </span>
                    <h2 className="text-sm font-bold tracking-widest uppercase mb-0.5" style={{ color: branding.secondaryColor }}>
                      {docConfig.city}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="absolute top-[40mm] left-[20mm] right-[20mm] border-b border-gray-400 z-20" />

                <main className={`flex-1 mt-1 relative z-10 flex flex-col overflow-hidden h-full`}>
                  {isFirstPage && (
                    <>
                      {(docConfig.showLeftBlock || docConfig.showRightBlock) && (
                        <div className="flex justify-between items-start mb-4 min-h-[22mm] w-full gap-8 shrink-0">
                           {docConfig.showRightBlock && (
                             <div className="w-1/2" style={getBlockStyle(docConfig.rightBlockStyle, true)}>
                               {content.rightBlockText}
                             </div>
                           )}
                           {docConfig.showLeftBlock && (
                             <div className="w-1/2 ml-auto" style={getBlockStyle(docConfig.leftBlockStyle, false)}>
                               {content.leftBlockText}
                             </div>
                           )}
                        </div>
                      )}

                      <h1 
                        className="font-bold mb-4 leading-tight tracking-tight break-words w-full overflow-hidden shrink-0" 
                        style={{ 
                          color: docConfig.titleStyle?.color || branding.primaryColor, 
                          fontSize: isDiaria ? '18pt' : `${docConfig.titleStyle?.size || 32}pt`, 
                          textAlign: docConfig.titleStyle?.alignment || 'left',
                          wordBreak: 'break-word',
                          maxWidth: '100%'
                        }}
                      >
                        {content.title}
                      </h1>
                    </>
                  )}
                  
                  <div className={`max-w-none text-gray-700 leading-relaxed text-justify break-words w-full rich-content flex-1 flex flex-col ${isDiaria ? 'text-[9.5pt]' : 'text-[11pt]'}`} dangerouslySetInnerHTML={{ __html: pageContent }} />

                  {isLastPage && docConfig.showSignature && !isDiaria && (
                    <div className={`${isDiaria ? 'mt-4' : 'mt-10'} mb-2 flex flex-col items-center justify-center pointer-events-none shrink-0`}>
                      <div className="w-80 border-t border-black pt-2 text-center">
                          <p className="text-gray-900 font-bold text-sm leading-tight uppercase">{content.signatureName}</p>
                          <p className="text-gray-600 text-xs mt-0.5">{content.signatureRole}</p>
                          {content.signatureSector && <p className="text-gray-400 text-[10px] mt-0.5 uppercase tracking-tighter">{content.signatureSector}</p>}
                      </div>
                    </div>
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
