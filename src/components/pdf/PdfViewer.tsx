'use client';

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { Document, Page } from 'react-pdf';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/lib/pdfWorker';
import { useTranslations } from 'next-intl';
import { usePdf } from '@/store/PdfContext';
import { useEditor } from '@/store/EditorContext';
import { useCanvas } from '@/store/CanvasContext';
import FabricCanvas from '@/components/canvas/FabricCanvas';
import FormLayer from '@/components/pdf/FormLayer';

function PageSkeleton() {
  return (
    <div className="w-[595px] h-[842px] rounded-lg animate-shimmer" />
  );
}

export default function PdfViewer() {
  const t = useTranslations('viewer');
  const { editorMode } = useEditor();
  const { activePageNumber } = useCanvas();
  const {
    pdfFile,
    numPages,
    setNumPages,
    currentPage,
    setCurrentPage,
    zoom,
    pageRotations,
    pdfRevision,
  } = usePdf();
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentPageRef = useRef(currentPage);
  const isObserverDrivenPageChangeRef = useRef(false);
  const [pageSizes, setPageSizes] = useState<Record<number, { width: number; height: number }>>({});

  const scale = zoom / 100;

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setPageSizes({});
    },
    [setNumPages]
  );

  const setPageRef = useCallback((pageNum: number, el: HTMLDivElement | null) => {
    if (el) {
      pageRefs.current.set(pageNum, el);
    } else {
      pageRefs.current.delete(pageNum);
    }
  }, []);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    if (!containerRef.current || numPages === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let visiblePage: number | null = null;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            const pageNum = Number(entry.target.getAttribute('data-page'));
            if (!isNaN(pageNum)) {
              visiblePage = pageNum;
            }
          }
        });

        if (
          maxRatio > 0 &&
          visiblePage !== null &&
          visiblePage !== currentPageRef.current
        ) {
          isObserverDrivenPageChangeRef.current = true;
          setCurrentPage(visiblePage);
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    pageRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [numPages, setCurrentPage]);

  const scrollToPage = useCallback((page: number) => {
    const el = pageRefs.current.get(page);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  useEffect(() => {
    if (isObserverDrivenPageChangeRef.current) {
      isObserverDrivenPageChangeRef.current = false;
      return;
    }

    const el = pageRefs.current.get(currentPage);
    if (el && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const isVisible =
        elRect.top >= containerRect.top - 50 &&
        elRect.top <= containerRect.bottom - 100;
      if (!isVisible) {
        scrollToPage(currentPage);
      }
    }
  }, [currentPage, scrollToPage]);

  const fileData = useMemo(() => {
    if (!pdfFile) return null;
    return { data: new Uint8Array(pdfFile.slice(0)), source: pdfFile };
  }, [pdfFile]);

  const updatePageSize = useCallback((pageNum: number, fallbackWidth: number, fallbackHeight: number) => {
    const wrapper = pageRefs.current.get(pageNum);
    const canvas = wrapper?.querySelector<HTMLCanvasElement>('.react-pdf__Page__canvas');
    const measuredWidth = canvas?.getBoundingClientRect().width ?? fallbackWidth;
    const measuredHeight = canvas?.getBoundingClientRect().height ?? fallbackHeight;

    if (measuredWidth <= 0 || measuredHeight <= 0) {
      return;
    }

    setPageSizes((prev) => {
      const current = prev[pageNum];
      if (current && current.width === measuredWidth && current.height === measuredHeight) {
        return prev;
      }

      return {
        ...prev,
        [pageNum]: {
          width: measuredWidth,
          height: measuredHeight,
        },
      };
    });
  }, []);

  const handlePageRenderSuccess = useCallback(
    (pageNum: number, page: PageCallback) => {
      const viewport = page.getViewport({
        scale,
        rotation: pageRotations.get(pageNum) ?? 0,
      });

      requestAnimationFrame(() => {
        updatePageSize(pageNum, viewport.width, viewport.height);
      });
    },
    [scale, pageRotations, updatePageSize]
  );

  if (!fileData) {
    return null;
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto">
      <div className="flex flex-col items-center gap-10 py-10 px-4 min-h-full">
        <Document
          key={pdfRevision}
          file={fileData}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-text-secondary">{t('loading')}</span>
            </div>
          }
          error={
            <div className="flex flex-col items-center gap-3 py-20">
              <svg className="w-12 h-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true" role="img">
                <title>{t('error')}</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm text-error">{t('error')}</span>
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={`${pdfRevision}-${pageNum}`}
              ref={(el) => setPageRef(pageNum, el)}
              data-page={pageNum}
              className="relative overflow-hidden bg-canvas-page rounded-md border-2 border-surface-300/45 shadow-lg shadow-canvas-shadow"
              style={{
                animationDelay: `${Math.min(pageNum * 50, 300)}ms`,
                animation: 'slide-up-fade 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards',
                width: pageSizes[pageNum]?.width,
                height: pageSizes[pageNum]?.height,
              }}
            >
              <Page
                pageNumber={pageNum}
                scale={scale}
                rotate={pageRotations.get(pageNum) ?? 0}
                loading={<PageSkeleton />}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                onRenderSuccess={(page) => handlePageRenderSuccess(pageNum, page)}
              />
              {pageSizes[pageNum] && (
                <>
                  <FormLayer
                    pdfFile={fileData.source}
                    pageNumber={pageNum}
                    pageWidth={pageSizes[pageNum].width}
                    pageHeight={pageSizes[pageNum].height}
                    rotation={pageRotations.get(pageNum) ?? 0}
                  />
                  <div className="absolute inset-0 z-10">
                    <FabricCanvas
                      pageNumber={pageNum}
                      width={pageSizes[pageNum].width}
                      height={pageSizes[pageNum].height}
                      scale={scale}
                      isEditable={editorMode === 'edit' && (activePageNumber ?? currentPage) === pageNum}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
