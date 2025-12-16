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

  // 1. Lógica de Paginação (Memoizada)
  const pages = useMemo(() => {
    // Mantém 25 linhas para segurança do rodapé
    const MAX_LINES_PER_PAGE = 25; 
    // REDUZIDO: de 82 para 76 para garantir que o texto quebre antes de estourar a largura visual
    const CHARS_PER_LINE = 76; 
    const TITLE_COST = 3; 
    // AUMENTADO: de 6 para 8 para compensar o aumento da margem superior da assinatura (mt-24)
    const SIGNATURE_COST = 8; 
    const PARAGRAPH_SPACING_COST = 0; 

    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    
    const resultPages: string[] = [];
    let currentPageContent = '';
    let currentLinesUsed = TITLE_COST; 

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
      const blockCost = linesInBlock + PARAGRAPH_SPACING_COST;

      if ((currentLinesUsed + blockCost) > MAX_LINES_PER_PAGE) {
        resultPages.push(currentPageContent);
        currentPageContent = blockHTML;
        currentLinesUsed = blockCost; 
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += blockCost;
      }
    }
    
    if (currentPageContent) {
      if (docConfig.showSignature && (currentLinesUsed + SIGNATURE_COST) > MAX_LINES_PER_PAGE) {
         resultPages.push(currentPageContent);
         resultPages.push(''); 
      } else {
         resultPages.push(currentPageContent);
      }
    } else if (docConfig.showSignature && resultPages.length > 0) {
       resultPages.push(''); 
    }

    return resultPages.length > 0 ? resultPages : [''];
  }, [content.body, content.title, docConfig.showSignature]);

  return (
    <div className={`flex justify-center items-start overflow-auto w-full h-full ${isGenerating ? 'bg-white p-0 m-0' : 'bg-slate-100 pt-8 pb-20'}`}>
      
      <div 
        id="preview-scaler"
        ref={ref}
        className={`origin-top transition-transform duration-300 ${isGenerating ? 'scale-100 transform-none' : 'scale-[0.55] md:scale-[0.65] xl:scale-[0.75]'}`}
      >
        <div 
          id="document-preview-container" 
          className={isGenerating ? 'block w-[210mm] mx-auto p-0 bg-white' : 'flex flex-col items-center'}
        >
          {pages.map((pageContent, pageIndex) => {
            const isFirstPage = pageIndex === 0;
            const isLastPage = pageIndex === pages.length - 1;

            return (
              <div
                key={pageIndex}
                className={`bg-white mx-auto flex flex-col relative ${branding.fontFamily} ${
                  isGenerating ? 'mb-0 shadow-none border-0' : 'mb-8 shadow-2xl transition-all duration-300 ring-1 ring-black/5'
                }`}
                style={{
                  width: '210mm',
                  height: isGenerating ? '296.5mm' : '297mm', 
                  minHeight: isGenerating ? '296.5mm' : '297mm',
                  padding: '20mm',
                  paddingTop: '55mm',
                  paddingBottom: isFirstPage ? '35mm' : '25mm',
                  breakAfter: isLastPage ? 'auto' : 'page',
                  pageBreakAfter: isLastPage ? 'auto' : 'always',
                  position: 'relative',
                  overflow: 'hidden' 
                }}
              >
                {/* ELEMENTOS ESTÁTICOS (Cabeçalho, Logo, etc) */}
                {branding.watermark.enabled && watermarkImg && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
                    <img 
                      src={watermarkImg}
                      alt=""
                      style={{
                        width: `${branding.watermark.size}%`,
                        opacity: branding.watermark.opacity / 100,
                        objectFit: 'contain',
                        filter: branding.watermark.grayscale ? 'grayscale(100%)' : 'none'
                      }}
                    />
                  </div>
                )}

                <div className="absolute top-0 left-0 w-full h-3 z-10" style={{ backgroundColor: branding.primaryColor }} />

                <div className="absolute top-8 left-[20mm] right-[20mm] h-32 pointer-events-none z-20">
                  <div 
                    className="absolute top-0 transition-all duration-300 flex"
                    style={{
                      left: branding.logoAlignment === 'left' ? 0 : branding.logoAlignment === 'center' ? '50%' : 'auto',
                      right: branding.logoAlignment === 'right' ? 0 : 'auto',
                      transform: branding.logoAlignment === 'center' ? 'translateX(-50%)' : 'none',
                    }}
                  >
                    {branding.logoUrl ? (
                      <img 
                        src={branding.logoUrl} 
                        alt="Company Logo" 
                        className="object-contain"
                        style={{ width: `${branding.logoWidth}mm`, maxHeight: '32mm' }}
                      />
                    ) : (
                      <div className="flex items-center justify-center rounded bg-slate-50 border border-slate-200 text-[10px] text-slate-400 font-bold uppercase" style={{ width: `${branding.logoWidth}mm`, height: `${branding.logoWidth * 0.5}mm` }}>
                        Logo
                      </div>
                    )}
                  </div>
                  
                  {/* Novo Cabeçalho em Cascata (3 Linhas) */}
                  <div className="absolute top-0 right-0 text-right z-10 mix-blend-multiply flex flex-col items-end">
                    {/* Linha 1: Setor/Departamento */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                        {content.signatureSector || 'Departamento Administrativo'}
                    </span>
                    
                    {/* Linha 2: Cidade (Texto Principal) */}
                    <h2 className="text-sm font-bold tracking-widest uppercase mb-0.5" style={{ color: branding.secondaryColor }}>
                      {docConfig.headerText}
                    </h2>
                    
                    {/* Linha 3: Data */}
                    <p className="text-[10px] text-gray-400 font-mono">
                       {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="absolute top-[42mm] left-[20mm] right-[20mm] border-b-2 border-gray-800 z-20" />

                <main className={`flex-1 ${branding.fontFamily} mt-2 relative z-10 flex flex-col mb-[10px]`}>
                  {isFirstPage && (
                    <h1 
                      className="font-bold mb-8 leading-tight tracking-tight"
                      style={{ 
                        color: docConfig.titleStyle?.color || branding.primaryColor,
                        fontSize: `${docConfig.titleStyle?.size || 32}pt`,
                        textAlign: docConfig.titleStyle?.alignment || 'left'
                      }}
                    >
                      {content.title}
                    </h1>
                  )}
                  
                  {/* --- ÁREA DE CONTEÚDO (APENAS LEITURA) --- */}
                  <div 
                    className="max-w-none text-gray-700 whitespace-pre-wrap leading-loose text-justify text-[11pt] break-words w-full"
                    dangerouslySetInnerHTML={{ __html: pageContent }}
                  />

                  {isLastPage && docConfig.showSignature && (
                    <div className="mt-24 mb-8 break-inside-avoid flex flex-col items-center justify-center pointer-events-none content-none">
                      <div className="w-80 border-t border-black pt-4 text-center">
                          <p className="text-gray-900 font-bold text-sm leading-tight uppercase tracking-wide">
                            {content.signatureName}
                          </p>
                          <p className="text-gray-600 text-sm leading-tight mt-1">
                            {content.signatureRole}
                          </p>
                          {content.signatureSector && (
                            <p className="text-gray-500 text-xs mt-0.5">
                              {content.signatureSector}
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </main>

                <div className="absolute bottom-8 left-[20mm] right-[20mm] pt-4 border-t-2 border-gray-800 flex justify-between items-end text-sm z-20">
                  <div className="flex flex-col gap-1 max-w-[75%]">
                      <span className="font-bold text-gray-900 tracking-wide">Prefeitura de São José do Goiabal - MG</span>
                      <span className="text-gray-500 font-light whitespace-pre-wrap">{docConfig.footerText}</span>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                      {docConfig.showPageNumbers && (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider">
                          Página {pageIndex + 1} de {pages.length}
                        </span>
                      )}
                      <div className="h-1.5 w-24 mt-2 rounded-full opacity-80" style={{ backgroundColor: branding.secondaryColor }} />
                  </div>
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