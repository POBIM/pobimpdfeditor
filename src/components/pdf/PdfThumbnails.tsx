'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/lib/pdfWorker';
import Button from '@/components/ui/Button';
import PageManagementBar from '@/components/pdf/PageManagementBar';
import { usePdf } from '@/store/PdfContext';
import { useCanvas } from '@/store/CanvasContext';
import { useEditor } from '@/store/EditorContext';
import { deletePages, reorderPages, rotatePage, splitPdf } from '@/lib/pdfOperations';
import { downloadPdf } from '@/lib/downloadHelper';

export default function PdfThumbnails() {
  const t = useTranslations('pageManagement');
  const { editorMode } = useEditor();
  const {
    pdfFile,
    numPages,
    currentPage,
    setCurrentPage,
    updatePdfFile,
    rotatePageBy,
    pageRotations,
    remapPageRotations,
    removePageRotations,
    fileName,
    pdfRevision,
  } = usePdf();
  const { remapCanvasPages, removeCanvasPages, setActiveCanvas } = useCanvas();

  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [draggedPage, setDraggedPage] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [menuPage, setMenuPage] = useState<number | null>(null);

  const selectedPageSet = useMemo(() => new Set(selectedPages), [selectedPages]);

  const fileData = useMemo(() => {
    if (!pdfFile) {
      return null;
    }
    return { data: new Uint8Array(pdfFile.slice(0)) };
  }, [pdfFile]);

  const pageNumbers = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  );

  const exportBaseName = useMemo(() => {
    if (!fileName) {
      return 'document';
    }

    return fileName.toLowerCase().endsWith('.pdf')
      ? fileName.slice(0, fileName.length - 4)
      : fileName;
  }, [fileName]);

  useEffect(() => {
    setSelectedPages((prev) => prev.filter((pageNumber) => pageNumber <= numPages));
  }, [numPages]);

  useEffect(() => {
    function handleWindowClick() {
      setMenuPage(null);
    }

    window.addEventListener('click', handleWindowClick);
    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, []);

  const handleThumbnailClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, page: number) => {
      if (event.ctrlKey || event.metaKey) {
        setSelectedPages((prev) => {
          if (prev.includes(page)) {
            return prev.filter((value) => value !== page);
          }

          return [...prev, page].sort((a, b) => a - b);
        });
      } else {
        setSelectedPages([page]);
      }

      setCurrentPage(page);
      if (editorMode === 'edit') {
        setActiveCanvas(page);
      }
      setMenuPage(null);
    },
    [editorMode, setActiveCanvas, setCurrentPage]
  );

  const handleExtractPages = useCallback(
    async (pagesToExtract: number[]) => {
      if (!pdfFile || pagesToExtract.length === 0) {
        return;
      }

      const extractedPdf = await splitPdf(
        pdfFile,
        pagesToExtract.map((pageNumber) => pageNumber - 1)
      );
      const suffix = pagesToExtract.length === 1 ? `page-${pagesToExtract[0]}` : 'selected-pages';
      downloadPdf(extractedPdf, `${exportBaseName}-${suffix}.pdf`);
    },
    [pdfFile, exportBaseName]
  );

  const handleDeletePages = useCallback(
    async (pagesToDelete: number[]) => {
      if (!pdfFile || pagesToDelete.length === 0 || pagesToDelete.length >= numPages) {
        return;
      }

      const confirmed = window.confirm(t('confirmDelete', { count: pagesToDelete.length }));
      if (!confirmed) {
        return;
      }

      const normalizedPages = [...pagesToDelete].sort((a, b) => a - b);
      const remainingPages = pageNumbers.filter(
        (pageNumber) => !normalizedPages.includes(pageNumber)
      );

      const updatedPdf = await deletePages(
        pdfFile,
        normalizedPages.map((pageNumber) => pageNumber - 1)
      );

      removeCanvasPages(normalizedPages);
      removePageRotations(normalizedPages);
      updatePdfFile(updatedPdf);
      setSelectedPages([]);
      setMenuPage(null);

      const preservedIndex = remainingPages.indexOf(currentPage);
      if (preservedIndex >= 0) {
        setCurrentPage(preservedIndex + 1);
      } else {
        setCurrentPage(Math.max(1, Math.min(currentPage, remainingPages.length)));
      }
    },
    [
      pdfFile,
      numPages,
      t,
      pageNumbers,
      removeCanvasPages,
      removePageRotations,
      updatePdfFile,
      currentPage,
      setCurrentPage,
    ]
  );

  const handleRotatePages = useCallback(
    async (pagesToRotate: number[], amount: number) => {
      if (!pdfFile || pagesToRotate.length === 0) {
        return;
      }

      let updatedPdf = pdfFile;
      for (const pageNumber of pagesToRotate) {
        const nextRotation = (pageRotations.get(pageNumber) ?? 0) + amount;
        updatedPdf = await rotatePage(updatedPdf, pageNumber - 1, nextRotation);
        rotatePageBy(pageNumber, amount);
      }

      updatePdfFile(updatedPdf);
      setMenuPage(null);
    },
    [pdfFile, pageRotations, rotatePageBy, updatePdfFile]
  );

  const handleReorderDrop = useCallback(
    async (targetIndex: number) => {
      if (!pdfFile || draggedPage === null) {
        return;
      }

      const newPageOrder = [...pageNumbers];
      const fromIndex = newPageOrder.indexOf(draggedPage);
      if (fromIndex < 0) {
        return;
      }

      const [movedPage] = newPageOrder.splice(fromIndex, 1);
      const insertIndex = Math.max(0, Math.min(targetIndex, newPageOrder.length));
      newPageOrder.splice(insertIndex, 0, movedPage);

      const unchanged = newPageOrder.every(
        (pageNumber, index) => pageNumber === pageNumbers[index]
      );
      if (unchanged) {
        return;
      }

      const reorderedPdf = await reorderPages(
        pdfFile,
        newPageOrder.map((pageNumber) => pageNumber - 1)
      );

      remapCanvasPages(newPageOrder);
      remapPageRotations(newPageOrder);
      updatePdfFile(reorderedPdf);

      setSelectedPages((prev) => {
        const selected = new Set(prev);
        const nextSelection: number[] = [];

        newPageOrder.forEach((oldPageNumber, index) => {
          if (selected.has(oldPageNumber)) {
            nextSelection.push(index + 1);
          }
        });

        return nextSelection;
      });

      const nextCurrentPageIndex = newPageOrder.indexOf(currentPage);
      if (nextCurrentPageIndex >= 0) {
        setCurrentPage(nextCurrentPageIndex + 1);
      }
    },
    [
      pdfFile,
      draggedPage,
      pageNumbers,
      remapCanvasPages,
      remapPageRotations,
      updatePdfFile,
      currentPage,
      setCurrentPage,
    ]
  );

  if (!fileData) {
    return null;
  }

  return (
    <Document key={pdfRevision} file={fileData} loading={null}>
      <div className="flex h-full flex-col">
        <div className="mb-2 text-[10px] text-text-tertiary">{t('reorderHint')}</div>

        {selectedPages.length > 1 && (
          <div className="mb-2">
            <Button size="sm" variant="secondary" onClick={() => void handleDeletePages(selectedPages)} className="w-full">
              {t('deleteSelected', { count: selectedPages.length })}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center gap-2 pb-2">
            {pageNumbers.map((pageNum, index) => {
              const isCurrent = currentPage === pageNum;
              const isSelected = selectedPageSet.has(pageNum);
              const showDropBefore = draggedPage !== null && dropIndex === index;
              const showDropAfter =
                draggedPage !== null && dropIndex === pageNumbers.length && index === pageNumbers.length - 1;

              return (
                <div key={pageNum} className="w-full flex flex-col items-center">
                  {showDropBefore && (
                    <div className="mb-1 h-1.5 w-[172px] rounded-full bg-accent-500/80" />
                  )}

                  <div className="relative w-[164px]">
                    <button
                      type="button"
                      draggable
                      onDragStart={() => {
                        setDraggedPage(pageNum);
                        setDropIndex(index);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        const rect = event.currentTarget.getBoundingClientRect();
                        const shouldInsertBefore = event.clientY < rect.top + rect.height / 2;
                        setDropIndex(shouldInsertBefore ? index : index + 1);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const target = dropIndex ?? index;
                        void handleReorderDrop(target);
                        setDraggedPage(null);
                        setDropIndex(null);
                      }}
                      onDragEnd={() => {
                        setDraggedPage(null);
                        setDropIndex(null);
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault();
                        setSelectedPages((prev) => (prev.includes(pageNum) ? prev : [pageNum]));
                        setMenuPage((prev) => (prev === pageNum ? null : pageNum));
                      }}
                      onClick={(event) => handleThumbnailClick(event, pageNum)}
                      className={`group relative w-full overflow-hidden rounded-md transition-all duration-200 cursor-pointer
                        ${
                          isCurrent
                            ? 'ring-2 ring-accent-500 ring-offset-2 ring-offset-surface-800 shadow-lg shadow-accent-500/10'
                            : 'ring-1 ring-border-subtle hover:ring-border-strong'
                        }
                        ${isSelected ? 'bg-accent-500/10' : ''}
                        ${draggedPage === pageNum ? 'opacity-45' : ''}`}
                    >
                      <Page
                        pageNumber={pageNum}
                        width={160}
                        rotate={pageRotations.get(pageNum) ?? 0}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />

                      <span className="absolute left-1 top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface-900/90 px-1 text-[10px] font-mono text-white tabular-nums">
                        {pageNum}
                      </span>
                    </button>

                    {menuPage === pageNum && (
                      <div className="absolute right-1 top-1 z-20 w-40 rounded-md border border-border-default bg-surface-700 shadow-xl shadow-black/30">
                        <button
                          type="button"
                          onClick={() => void handleRotatePages([pageNum], 90)}
                          className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary"
                        >
                          {t('rotateCW')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRotatePages([pageNum], -90)}
                          className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary"
                        >
                          {t('rotateCCW')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeletePages([pageNum])}
                          className="w-full px-3 py-2 text-left text-xs text-error hover:bg-surface-600"
                        >
                          {t('deletePage')}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleExtractPages([pageNum])}
                          className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary"
                        >
                          {t('extractPage')}
                        </button>
                      </div>
                    )}
                  </div>

                  {showDropAfter && (
                    <div className="mt-1 h-1.5 w-[172px] rounded-full bg-accent-500/80" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <PageManagementBar
          selectedCount={selectedPages.length}
          onDeleteSelected={() => void handleDeletePages(selectedPages)}
          onRotateClockwise={() => void handleRotatePages(selectedPages, 90)}
          onRotateCounterclockwise={() => void handleRotatePages(selectedPages, -90)}
          onExtractSelected={() => void handleExtractPages(selectedPages)}
        />
      </div>
    </Document>
  );
}
