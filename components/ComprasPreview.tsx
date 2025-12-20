
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface ComprasPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const ComprasPreview: React.FC<ComprasPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  const pages = useMemo(() => {
    const MAX_LINES_PER_PAGE = 34; 
    const CHARS_PER_LINE = 75; 
    const blocks = content.body.split(/(?<=<\/p>)|(?<=<\/div>)|<br\s*\/?>/g);
    const resultPages: string[] = [];
    let currentPageContent = '';
    let currentLinesUsed = 0;

    blocks.forEach((blockHTML) => {
      if (!blockHTML?.trim()) return;
      const plainText = blockHTML.replace(/<[^>]+>/g, '') || ' ';
      const linesInBlock = Math.max(1, Math.ceil(plainText.length / CHARS_PER_LINE));
      
      if ((currentLinesUsed + linesInBlock) > MAX_LINES_PER_PAGE) {
        resultPages.push(currentPageContent);
        currentPageContent = blockHTML;
        currentLinesUsed = linesInBlock;
      } else {
        currentPageContent += blockHTML;
        currentLinesUsed += linesInBlock;
      }
    });
    
    if (currentPageContent) resultPages.push(currentPageContent);
    return resultPages;
  }, [content.body]);

  return (
    <>
      {pages.map((pageHtml, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="mb-6">
              <div className="bg-emerald-600 text-white px-4 py-2 rounded-t-lg font-black text-xs uppercase tracking-[0.2em] mb-4">
                Pedido de Compra nº {content.title.split(' ')[2] || '---'}
              </div>
              <h1 className="font-bold leading-tight tracking-tight text-[22pt] text-emerald-900 border-b-2 border-emerald-100 pb-2">
                {content.title}
              </h1>
            </div>
          )}
          <div className="max-w-none text-gray-700 leading-relaxed text-justify text-[11pt] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: pageHtml }} />
          
          {pageIndex === pages.length - 1 && (
            <div className="mt-auto pt-16 flex justify-center">
              <div className="w-72 border-t-2 border-emerald-900 pt-2 text-center">
                <p className="font-black uppercase text-[9pt] text-emerald-900">{content.signatureName || 'Solicitante'}</p>
                <p className="text-[7.5pt] font-bold text-emerald-600 uppercase tracking-widest">{content.signatureRole}</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};
