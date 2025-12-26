
import React, { useMemo } from 'react';
import { AppState, PurchaseItem } from '../types';
import { PageWrapper } from './PageWrapper';

interface ComprasPreviewProps {
  state: AppState;
  isGenerating: boolean;
}

export const ComprasPreview: React.FC<ComprasPreviewProps> = ({ state, isGenerating }) => {
  const { branding, document: docConfig, content } = state;

  const pages = useMemo(() => {
    const SECURITY_MARGIN_LINES = 3; 
    const TOTAL_LINES_CAPACITY = 38; 
    const CHARS_PER_LINE = 65;
    
    // Calcula linhas ocupadas pela justificativa geral (body)
    const justificationLines = content.body 
      ? content.body.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0) + 2
      : 0;

    const LIMIT_FIRST_PAGE = 22 - justificationLines;
    const LIMIT_NORMAL = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES;

    const items = content.purchaseItems || [];
    const resultPages: PurchaseItem[][] = [];
    let currentPageItems: PurchaseItem[] = [];
    let currentLinesUsed = 0;
    let isFirstPage = true;

    const getLimit = () => isFirstPage ? LIMIT_FIRST_PAGE : LIMIT_NORMAL;

    items.forEach((item) => {
      const linesForName = Math.max(1, Math.ceil((item.name || '').length / CHARS_PER_LINE));
      const totalItemLines = linesForName + 0.5; 

      const limit = getLimit();

      if ((currentLinesUsed + totalItemLines) <= limit) {
        currentPageItems.push(item);
        currentLinesUsed += totalItemLines;
      } else {
        resultPages.push(currentPageItems);
        currentPageItems = [item];
        currentLinesUsed = totalItemLines;
        isFirstPage = false;
      }
    });

    if (currentPageItems.length > 0) resultPages.push(currentPageItems);
    if (resultPages.length === 0) resultPages.push([]);
    
    return resultPages;
  }, [content.purchaseItems, content.body, content.priorityJustification]);

  const priorityStyles = {
    'Normal': 'bg-slate-100 text-slate-600 border-slate-200',
    'Média': 'bg-slate-100 text-slate-800 border-slate-300',
    'Alta': 'bg-amber-50 text-amber-700 border-amber-200',
    'Urgência': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <>
      {pages.map((itemsOnPage, pageIndex) => (
        <PageWrapper key={pageIndex} state={state} pageIndex={pageIndex} totalPages={pages.length} isGenerating={isGenerating}>
          {pageIndex === 0 && (
            <div className="mb-6">
              
              {/* 1. Blocos de Endereçamento (Topo) */}
              <div className="flex justify-between items-start text-[9.5pt]">
                {docConfig.showLeftBlock && content.leftBlockText && (
                  <div 
                    className="whitespace-pre-wrap max-w-[45%] leading-snug text-black"
                    style={{ 
                      fontSize: `${docConfig.leftBlockStyle?.size || 9}pt`, 
                      color: '#000000'
                    }}
                  >
                    {content.leftBlockText}
                  </div>
                )}
                {docConfig.showRightBlock && content.rightBlockText && (
                  <div 
                    className="whitespace-pre-wrap text-right max-w-[45%] leading-snug text-black"
                    style={{ 
                      fontSize: `${docConfig.rightBlockStyle?.size || 9}pt`, 
                      color: '#000000'
                    }}
                  >
                    {content.rightBlockText}
                  </div>
                )}
              </div>

              {/* Espaço de 02 linhas (h-10 aprox 40px) */}
              <div className="h-10" />

              {/* 2. Cabeçalho de Identificação (Verde Suave) */}
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex justify-between items-center">
                <span className="font-black text-[7pt] uppercase tracking-[0.2em] text-emerald-800">Pedido de Compra Administrativo</span>
                <span className="font-mono text-[8pt] text-black">
                  Protocolo: <span className="font-normal">{content.protocol || 'AGUARDANDO FINALIZAÇÃO'}</span>
                </span>
              </div>

              {/* Espaço de 01 linha (h-5 aprox 20px) */}
              <div className="h-5" />

              {/* 3. Título / Finalidade */}
              <div className="flex items-center gap-3 border-b-2 border-emerald-100 pb-2">
                <div className="flex-1 flex flex-col gap-1">
                  <h1 className="font-bold leading-tight tracking-tight text-[16pt] text-black">
                    {content.title}
                  </h1>
                </div>
                {/* Badge de Prioridade */}
                <div className={`px-3 py-1 rounded-full text-[8pt] font-black uppercase tracking-widest border shrink-0 ${priorityStyles[content.priority || 'Normal']}`}>
                  {content.priority || 'Normal'}
                </div>
              </div>

              {/* Justificativa Geral */}
              {content.body && (
                <div className="bg-emerald-50/20 p-4 rounded-xl border-l-4 border-emerald-200 my-4">
                  <p className="text-[7pt] font-black text-emerald-800 uppercase tracking-widest mb-1">Justificativa do Pedido:</p>
                  <p className="text-[10pt] text-black leading-relaxed italic whitespace-pre-wrap">
                    {content.body}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex-1">
             {itemsOnPage.length > 0 ? (
                <div className="space-y-3">
                   {itemsOnPage.map((item, idx) => {
                      const absoluteIndex = pages.slice(0, pageIndex).reduce((acc, curr) => acc + curr.length, 0) + idx + 1;
                      return (
                        <div key={item.id} className="flex items-start gap-3 text-[11pt] border-b border-emerald-50 pb-2">
                           <span className="font-black text-emerald-700 min-w-[30px]">{absoluteIndex.toString().padStart(2, '0')}.</span>
                           <div className="flex-1">
                              <span className="text-black font-medium leading-relaxed">{item.name || '---'}</span>
                              <div className="flex gap-4 mt-0.5 text-[8.5pt] font-bold uppercase tracking-widest text-slate-500">
                                 <span>Quantidade: <span className="text-black">{item.quantity}</span></span>
                                 <span>Unidade: <span className="text-black">{item.unit}</span></span>
                              </div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             ) : (
                pageIndex === 0 && <p className="text-slate-400 italic text-sm">Nenhum item listado.</p>
             )}

             {/* Justificativa de Prioridade */}
             {pageIndex === pages.length - 1 && content.priorityJustification && (
               <div className="mt-8 bg-emerald-50/10 p-4 rounded-xl border-l-4 border-emerald-200">
                  <p className="text-[7pt] font-black text-emerald-800 uppercase tracking-widest mb-1">Nota de Prioridade ({content.priority}):</p>
                  <p className="text-[10pt] text-black leading-relaxed italic whitespace-pre-wrap">
                    {content.priorityJustification}
                  </p>
               </div>
             )}
          </div>
          
          {pageIndex === pages.length - 1 && (
            <div className="mt-auto pt-16 flex justify-center">
              <div className="w-72 border-t-2 border-slate-950 pt-2 text-center">
                <p className="font-black uppercase text-[10pt] text-black">{content.signatureName || 'Solicitante'}</p>
                <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">{content.signatureRole}</p>
              </div>
            </div>
          )}
        </PageWrapper>
      ))}
    </>
  );
};
