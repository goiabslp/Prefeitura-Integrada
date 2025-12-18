
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
     * Lógica de Paginação Otimizada para Máxima Área Útil
     * MAX_LINES_PER_PAGE: Aumentado para 32 para permitir que o texto desça até 15mm do rodapé.
     */
    const MAX_LINES_PER_PAGE = 32; 
    const CHARS_PER_LINE = 72; 
    
    // Estimativa de linhas do título com base no tamanho da fonte
    const titleFontSizeFactor = (docConfig.titleStyle?.size || 32) / 12;
    const titleLines = Math.max(1, Math.ceil((content.title.length * titleFontSizeFactor) / CHARS_PER_LINE)) + 1;
    
    // Espaço ocupado pelos blocos laterais no topo da página 1
    const LATERAL_BLOCKS_COST = (docConfig.showLeftBlock || docConfig.showRightBlock) ? 9 : 0;
    
    // Custo da assinatura (Espaço mt-[45px] + Linha + Nome + Cargo + Setor)
    const SIGNATURE_COST = 7; 

    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    
    const resultPages: string[] = [];
    let currentPageContent = '';
    
    // Inicialização da contagem na página 1 (Cabeçalho + Blocos Laterais + Título)
    let currentLinesUsed = titleLines + LATERAL_BLOCKS_COST; 

    for (let i = 0; i < blocks.length; i++) {
      let blockHTML = blocks[i];
      if (blockHTML === undefined || blockHTML === null) continue;

      const isBlockTag = /^(<p|<div|<h|<ul|<ol|<li>)/i.test(blockHTML.trim());
      
      if (!blockHTML.trim() && !isBlockTag) {
         blockHTML = '<div style="min-height: 1.2em;">&nbsp;</div>';
      } else if (!isBlockTag) {
         blockHTML = `<div>${blockHTML}</div>`;
      }

      const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' '; 
      const contentLength = plainText.length;
      
      const linesInBlock = Math.max(1, Math.ceil(contentLength / CHARS_PER_LINE));
      const blockCost = linesInBlock;

      // Verifica se o bloco cabe na página atual
      if ((currentLinesUsed + blockCost) > MAX_LINES_PER_PAGE) {
        resultPages.push(currentPageContent);
        currentPageContent = blockHTML;
        currentLinesUsed = blockCost; // Páginas seguintes não têm o custo do título inicial
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += blockCost;
      }
    }
    
    // Verificação final para posicionamento da assinatura
    if (currentPageContent) {
      if (docConfig.showSignature && (currentLinesUsed + SIGNATURE_COST) > MAX_LINES_PER_PAGE) {
         // Se a assinatura não couber no limite máximo (15mm antes do rodapé), move para nova página
         resultPages.push(currentPageContent);
         resultPages.push(''); 
      } else {
         // Assinatura cabe na mesma página, próxima ao texto
         resultPages.push(currentPageContent);
      }
    } else if (docConfig.showSignature && resultPages.length > 0) {
       resultPages.push(''); 
    }

    return resultPages.length > 0 ? resultPages : [''];
  }, [content.body, content.title, docConfig.showSignature, docConfig.showLeftBlock, docConfig.showRightBlock, docConfig.titleStyle?.size]);

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

            return (
              <div
                key={pageIndex}
                className={`bg-white mx-auto flex flex-col relative ${branding.fontFamily} ${isGenerating ? 'mb-0' : 'mb-8 shadow-2xl ring-1 ring-black/5'}`}
                style={{
                  width: '210mm', height: isGenerating ? '296.5mm' : '297mm',
                  // paddingBottom: 15mm para maximizar área útil até o limite do rodapé
                  padding: '20mm', paddingTop: '55mm', paddingBottom: '15mm',
                  position: 'relative', overflow: 'hidden' 
                }}
              >
                {branding.watermark.enabled && watermarkImg && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <img src={watermarkImg} alt="" style={{ width: `${branding.watermark.size}%`, opacity: branding.watermark.opacity / 100, objectFit: 'contain', filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none' }} />
                  </div>
                )}
                <div className="absolute top-0 left-0 w-full h-3 z-10" style={{ backgroundColor: branding.primaryColor }} />

                {/* Cabeçalho */}
                <div className="absolute top-8 left-[20mm] right-[20mm] h-32 z-20">
                  <div className="absolute top-0 flex" style={{ left: branding.logoAlignment === 'left' ? 0 : branding.logoAlignment === 'center' ? '50%' : 'auto', right: branding.logoAlignment === 'right' ? 0 : 'auto', transform: branding.logoAlignment === 'center' ? 'translateX(-50%)' : 'none' }}>
                    {branding.logoUrl ? <img src={branding.logoUrl} alt="Logo" className="object-contain" style={{ width: `${branding.logoWidth}mm`, maxHeight: '32mm' }} /> : <div className="bg-slate-50 border rounded flex items-center justify-center text-[10px]" style={{ width: `${branding.logoWidth}mm`, height: '20mm' }}>Logo</div>}
                  </div>
                  <div className="absolute top-0 right-0 text-right flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase text-gray-500 mb-0.5">{content.signatureSector || 'Departamento Administrativo'}</span>
                    <h2 className="text-sm font-bold tracking-widest uppercase mb-0.5" style={{ color: branding.secondaryColor }}>{docConfig.headerText}</h2>
                    <p className="text-[10px] text-gray-400 font-mono">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="absolute top-[42mm] left-[20mm] right-[20mm] border-b-2 border-gray-800 z-20" />

                <main className={`flex-1 mt-2 relative z-10 flex flex-col overflow-hidden`}>
                  {isFirstPage && (
                    <>
                      {/* Blocos Laterais */}
                      {(docConfig.showLeftBlock || docConfig.showRightBlock) && (
                        <div className="flex justify-between items-start mb-8 min-h-[30mm] w-full gap-8 shrink-0">
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

                      {/* Título Principal */}
                      <h1 
                        className="font-bold mb-8 leading-tight tracking-tight break-words w-full overflow-hidden shrink-0" 
                        style={{ 
                          color: docConfig.titleStyle?.color || branding.primaryColor, 
                          fontSize: `${docConfig.titleStyle?.size || 32}pt`, 
                          textAlign: docConfig.titleStyle?.alignment || 'left',
                          wordBreak: 'break-word',
                          maxWidth: '100%'
                        }}
                      >
                        {content.title}
                      </h1>
                    </>
                  )}
                  
                  {/* Conteúdo Dinâmico - Removido whitespace-pre-wrap para suportar HTML rico */}
                  <div className="max-w-none text-gray-700 leading-loose text-justify text-[11pt] break-words w-full rich-content" dangerouslySetInnerHTML={{ __html: pageContent }} />

                  {/* Assinatura colada ao texto (mt-[45px] garante proximidade com pequeno aumento conforme solicitado) */}
                  {isLastPage && docConfig.showSignature && (
                    <div className="mt-[45px] mb-4 flex flex-col items-center justify-center pointer-events-none shrink-0">
                      <div className="w-80 border-t border-black pt-4 text-center">
                          <p className="text-gray-900 font-bold text-sm leading-tight uppercase">{content.signatureName}</p>
                          <p className="text-gray-600 text-sm mt-1">{content.signatureRole}</p>
                          {content.signatureSector && <p className="text-gray-500 text-xs mt-0.5">{content.signatureSector}</p>}
                      </div>
                    </div>
                  )}
                </main>

                {/* Rodapé Fixo (Posicionado em bottom-8 para manter consistência visual) */}
                <div className="absolute bottom-8 left-[20mm] right-[20mm] pt-4 border-t-2 border-gray-800 flex justify-between items-end text-sm z-20 bg-white">
                  <div className="flex flex-col gap-1 max-w-[75%]">
                      <span className="font-bold text-gray-900">Prefeitura de São José do Goiabal - MG</span>
                      <span className="text-gray-500 font-light whitespace-pre-wrap text-[10px] leading-tight">{docConfig.footerText}</span>
                  </div>
                  {docConfig.showPageNumbers && (
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">Página {pageIndex + 1} de {pages.length}</span>
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
