'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import '@/lib/pdfWorker';
import Button from '@/components/ui/Button';
import { usePdf } from '@/store/PdfContext';
import { downloadPdf } from '@/lib/downloadHelper';
import { extractPageRange, splitPdf } from '@/lib/pdfOperations';

type SplitMode = 'extract' | 'split';

interface SplitPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SplitPdfModal({ isOpen, onClose }: SplitPdfModalProps) {
  const t = useTranslations('split');
  const { pdfFile, numPages, fileName } = usePdf();
  const [mode, setMode] = useState<SplitMode>('extract');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitPage, setSplitPage] = useState(1);
  const splitInputId = 'split-point-input';

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

  const handleExtractDownload = useCallback(async () => {
    if (!pdfFile || selectedPages.length === 0) {
      return;
    }

    const extractedPdf = await splitPdf(
      pdfFile,
      selectedPages.map((pageNumber) => pageNumber - 1)
    );
    downloadPdf(extractedPdf, `${exportBaseName}-extract.pdf`);
  }, [pdfFile, selectedPages, exportBaseName]);

  const handleDownloadPart1 = useCallback(async () => {
    if (!pdfFile || numPages < 2) {
      return;
    }

    const part1 = await extractPageRange(pdfFile, 0, splitPage - 1);
    downloadPdf(part1, `${exportBaseName}-part-1.pdf`);
  }, [pdfFile, numPages, splitPage, exportBaseName]);

  const handleDownloadPart2 = useCallback(async () => {
    if (!pdfFile || numPages < 2) {
      return;
    }

    const part2 = await extractPageRange(pdfFile, splitPage, numPages - 1);
    downloadPdf(part2, `${exportBaseName}-part-2.pdf`);
  }, [pdfFile, numPages, splitPage, exportBaseName]);

  if (!isOpen || !fileData) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-4xl mx-4 overflow-hidden rounded-xl border border-border-default bg-surface-800 shadow-xl">
        <div className="border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('title')}</h3>
        </div>

        <div className="flex gap-2 border-b border-border-subtle px-5 py-3">
          <Button
            type="button"
            size="sm"
            variant={mode === 'extract' ? 'primary' : 'ghost'}
            onClick={() => setMode('extract')}
          >
            {t('extractPages')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === 'split' ? 'primary' : 'ghost'}
            onClick={() => setMode('split')}
          >
            {t('splitAtPage')}
          </Button>
        </div>

        {mode === 'extract' ? (
          <div className="p-5">
            <p className="mb-3 text-xs text-text-secondary">{t('selectPages')}</p>
            <Document file={fileData} loading={null}>
              <div className="grid max-h-[420px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
                {pageNumbers.map((pageNumber) => {
                  const selected = selectedPages.includes(pageNumber);

                  return (
                    <label
                      key={pageNumber}
                      className={`cursor-pointer rounded border p-2 transition-colors ${
                        selected
                          ? 'border-accent-500 bg-accent-500/10'
                          : 'border-border-default bg-surface-700/60'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-text-secondary">{pageNumber}</span>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            setSelectedPages((prev) => {
                              if (prev.includes(pageNumber)) {
                                return prev.filter((value) => value !== pageNumber);
                              }

                              return [...prev, pageNumber].sort((a, b) => a - b);
                            });
                          }}
                        />
                      </div>
                      <Page
                        pageNumber={pageNumber}
                        width={130}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </label>
                  );
                })}
              </div>
            </Document>

            {selectedPages.length === 0 && (
              <p className="mt-3 text-xs text-warning">{t('noSelection')}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 p-5">
            <div>
              <label htmlFor={splitInputId} className="mb-2 block text-xs text-text-secondary">
                {t('splitPoint')}
              </label>
              <input
                id={splitInputId}
                type="number"
                min={1}
                max={Math.max(1, numPages - 1)}
                value={splitPage}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  const clamped = Math.max(1, Math.min(numPages - 1, value || 1));
                  setSplitPage(clamped);
                }}
                className="h-9 w-40 rounded border border-border-default bg-surface-700 px-3 text-sm text-text-primary outline-none focus:border-accent-500"
              />
            </div>
            <div className="rounded-lg border border-border-default bg-surface-700/55 p-3 text-xs text-text-secondary">
              {`1-${splitPage} | ${splitPage + 1}-${numPages}`}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>

          {mode === 'extract' ? (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleExtractDownload()}
              disabled={selectedPages.length === 0}
            >
              {t('download')}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleDownloadPart1()}
                disabled={numPages < 2}
              >
                {t('downloadPart1', { page: splitPage })}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void handleDownloadPart2()}
                disabled={numPages < 2}
              >
                {t('downloadPart2', { page: splitPage + 1, total: numPages })}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
