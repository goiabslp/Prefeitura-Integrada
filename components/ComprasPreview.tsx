
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
    // Calibração ultra-conservadora para evitar transbordo no rodapé
    // Uma linha em 11pt/leading-relaxed tem aprox. 5-6mm. 
    // O limite de 3 linhas antes do rodapé exige ~18mm de folga extra.
    const SECURITY_MARGIN_LINES = 4; 
    const TOTAL_LINES_CAPACITY = 32; // Reduzido drasticamente para garantir a margem de 3 linhas em todas as páginas
    const CHARS_PER_LINE = 65;
    
    // Calcula linhas ocupadas pela justificativa geral (body) na primeira página
    const justificationLines = content.body 
      ? content.body.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0) + 3
      : 0;

    // Calcula linhas ocupadas pela justificativa de prioridade (nota final)
    const priorityJustificationLines = content.priorityJustification
      ? content.priorityJustification.split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / CHARS_PER_LINE)), 0) + 4
      : 0;

    // Espaço para assinatura (aprox 6 linhas + as 2 extras solicitadas)
    // Aumentado para 9 para o algoritmo de paginação considerar o espaço extra
    const SIGNATURE_LINES = 9;

    // Limites de linhas por página
    // Na pág 1, o cabeçalho e títulos ocupam cerca de 12-14 linhas "virtuais"
    const LIMIT_FIRST_PAGE = 20 - justificationLines;
    const LIMIT_NORMAL = TOTAL_LINES_CAPACITY - SECURITY_MARGIN_LINES;

    const items = [...(content.purchaseItems || [])];
    const resultPages: PurchaseItem[][] = [];
    let currentPageItems: PurchaseItem[] = [];
    let currentLinesUsed = 0;
    let isFirstPage = true;

    // Função para obter o limite da página atual
    const getCurrentLimit = () => isFirstPage ? LIMIT_FIRST_PAGE : LIMIT_NORMAL;

    // Loop de distribuição de itens
    while (items.length > 0) {
      const item = items[0];
      const linesForName = Math.max(1, Math.ceil((item.name || '').length / CHARS_PER_LINE));
      const totalItemLines = linesForName + 1.2; // Item + margem

      const limit = getCurrentLimit();

      // Verifica se o item cabe na página atual
      if ((currentLinesUsed + totalItemLines) <= limit) {
        currentPageItems.push(items.shift()!);
        currentLinesUsed += totalItemLines;

        // Se for o último item, verifica se o bloco de fechamento cabe nesta página
        if (items.length === 0) {
          const closingSpaceNeeded = priorityJustificationLines + SIGNATURE_LINES;
          // Se o fechamento não couber, ele irá para uma nova página (tratado após o loop)
          if ((currentLinesUsed + closingSpaceNeeded) > limit) {
            resultPages.push(currentPageItems);
            currentPageItems = []; // Força a criação de uma página de fechamento se necessário
          } else {
            resultPages.push(currentPageItems);
            currentPageItems = [];
          }
        }
      } else {
        // Página cheia, rotaciona
        resultPages.push(currentPageItems);
        currentPageItems = [];
        currentLinesUsed = 0;
        isFirstPage = false;
      }
    }

    // Se terminamos os itens mas não criamos nenhuma página (lista vazia), ou se a última página
    // de itens foi fechada e não temos onde colocar a assinatura, adicionamos uma página final
    if (resultPages.length === 0) {
      resultPages.push([]);
    }
    
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

              {/* Espaço de 02 linhas */}
              <div className="h-10" />

              {/* 2. Cabeçalho de Identificação (Verde Suave) */}
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl flex justify-between items-center">
                <span className="font-black text-[7pt] uppercase tracking-[0.2em] text-emerald-800">Pedido de Compra Administrativo</span>
                <span className="font-mono text-[8pt] text-black">
                  Protocolo: <span className="font-normal">{content.protocol || 'AGUARDANDO FINALIZAÇÃO'}</span>
                </span>
              </div>

              {/* Espaço de 01 linha */}
              <div className="h-5" />

              {/* 3. Título / Finalidade */}
              <div className="flex items-center gap-3 border-b-2 border-emerald-100 pb-2">
                <div className="flex-1 flex flex-col gap-1">
                  <h1 className="font-bold leading-tight tracking-tight text-[16pt] text-black">
                    {content.title}
                  </h1>
                </div>
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
          
          <div className="flex-1 flex flex-col pb-12"> {/* pb-12 garante o gap visual de 3 linhas antes do rodapé */}
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
                pageIndex === 0 && itemsOnPage.length === 0 && <p className="text-slate-400 italic text-sm">Nenhum item listado.</p>
             )}

             {/* Justificativa de Prioridade e Assinatura na última página */}
             {pageIndex === pages.length - 1 && (
               <div className="mt-6">
                 {content.priorityJustification && (
                   <div className="mb-8 bg-emerald-50/10 p-4 rounded-xl border-l-4 border-emerald-200">
                      <p className="text-[7pt] font-black text-emerald-800 uppercase tracking-widest mb-1">Nota de Prioridade ({content.priority}):</p>
                      <p className="text-[10pt] text-black leading-relaxed italic whitespace-pre-wrap">
                        {content.priorityJustification}
                      </p>
                   </div>
                 )}

                 {/* Adicionado mais 02 linhas de espaço (pt-24 em vez de pt-12) */}
                 <div className="pt-24 flex justify-center">
                   <div className="w-72 border-t-2 border-slate-950 pt-2 text-center">
                     <p className="font-black uppercase text-[10pt] text-black">{content.signatureName || 'Solicitante'}</p>
                     <p className="text-[8pt] font-bold text-slate-500 uppercase tracking-widest">{content.signatureRole}</p>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </PageWrapper>
      ))}
    </>
  );
};
