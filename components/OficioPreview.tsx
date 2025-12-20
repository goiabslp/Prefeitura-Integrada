
import React, { useMemo } from 'react';
import { AppState } from '../types';
import { PageWrapper } from './PageWrapper';

interface OficioPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const OficioPreview: React.FC<OficioPreviewProps> = ({ state, isGenerating }) => {
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
            <div className="flex flex-col gap-6 mb-4">
              <div className="flex justify-between items-start">
                {docConfig.showLeftBlock && content.leftBlockText && (
                  <div 
                    className="whitespace-pre-wrap font-bold max-w-[45%]"
                    style={{ fontSize: `${docConfig.leftBlockStyle?.size || 10}pt`, color: docConfig.leftBlockStyle?.color || '#191822' }}
                  >
                    {content.leftBlockText}
                  </div>
                )}
                {docConfig.showRightBlock && content.rightBlockText && (
                  <div 
                    className="whitespace-pre-wrap font-bold text-right max-w-[45%]"
                    style={{ fontSize: `${docConfig.rightBlockStyle?.size || 10}pt`, color: docConfig.rightBlockStyle?.color || '#191822' }}
                  >
                    {content.rightBlockText}
                  </div>
                )}
              </div>
              <h1 className="font-bold leading-tight tracking-tight text-[28pt]" style={{ color: docConfig.titleStyle?.color || branding.primaryColor, textAlign: docConfig.titleStyle?.alignment || 'left' }}>
                {content.title}
              </h1>
            </div>
          )}
          <div className="max-w-none text-gray-700 leading-relaxed text-justify text-[11pt] whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: pageHtml }} />
          
          {pageIndex === pages.length - 1 && docConfig.showSignature && (
            <div className="mt-auto pt-12 flex flex-col items-center text-center">
              <div className="w-64 border-t border-slate-900 pt-2">
                <p className="font-bold uppercase text-[10pt]">{content.signatureName}</p>
                <p className="text-[8pt] text-slate-500">{content.signatureRole}</p>
                <p className="text-[7pt] text-slate-400 uppercase tracking-widest">{content.signatureSector}</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};
