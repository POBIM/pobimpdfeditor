'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { useCanvas } from '@/store/CanvasContext';
import { usePdf } from '@/store/PdfContext';
import { useForm } from '@/store/FormContext';
import { useExport } from '@/store/ExportContext';
import { exportPdf, type ExportProgressState } from '@/lib/exportPdf';
import { downloadPdf } from '@/lib/downloadHelper';

type ExportStatus = 'idle' | 'exporting' | 'done' | 'error';

export default function ExportModal() {
  const tExport = useTranslations('export');
  const { isExportOpen, closeExport } = useExport();
  const { pdfFile, fileName, numPages, pageRotations } = usePdf();
  const { getAllCanvases } = useCanvas();
  const { getAllFormData } = useForm();

  const [status, setStatus] = useState<ExportStatus>('idle');
  const [flattenForms, setFlattenForms] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [quality, setQuality] = useState<'standard' | 'high'>('high');
  const [progress, setProgress] = useState<ExportProgressState>({
    step: 'preparing',
    totalPages: 0,
    percentage: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const statusLabel = useMemo(() => {
    if (status === 'done') {
      return tExport('complete');
    }

    if (status === 'error') {
      return tExport('exporting');
    }

    switch (progress.step) {
      case 'preparing':
        return tExport('preparing');
      case 'processingPage':
        return tExport('processingPage', {
          current: progress.currentPage ?? 1,
          total: progress.totalPages || numPages,
        });
      case 'embedding':
        return tExport('embedding');
      case 'finalizing':
        return tExport('finalizing');
      case 'complete':
        return tExport('complete');
      default:
        return tExport('exporting');
    }
  }, [status, progress.step, progress.currentPage, progress.totalPages, tExport, numPages]);

  const handleRunExport = useCallback(async () => {
    if (!pdfFile) {
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    setStatus('exporting');
    setProgress({
      step: 'preparing',
      totalPages: numPages,
      percentage: 1,
    });

    try {
      const bytes = await exportPdf({
        currentPdfBytes: pdfFile,
        canvases: new Map(getAllCanvases()),
        pageRotations,
        formData: getAllFormData(),
        includeAnnotations,
        flattenForms,
        quality,
        signal: abortController.signal,
        onProgress: setProgress,
      });

      const downloadName = fileName ?? 'document.pdf';
      downloadPdf(bytes, downloadName);
      setStatus('done');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setStatus('idle');
        return;
      }

      setStatus('error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [
    pdfFile,
    numPages,
    getAllCanvases,
    pageRotations,
    getAllFormData,
    includeAnnotations,
    flattenForms,
    quality,
    fileName,
  ]);

  useEffect(() => {
    if (isExportOpen && status === 'idle' && pdfFile) {
      void handleRunExport();
    }
  }, [isExportOpen, status, pdfFile, handleRunExport]);

  useEffect(() => {
    if (!isExportOpen) {
      abortControllerRef.current?.abort();
      setStatus('idle');
      setProgress({
        step: 'preparing',
        totalPages: 0,
        percentage: 0,
      });
    }
  }, [isExportOpen]);

  if (!isExportOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 overflow-hidden rounded-xl border border-border-default bg-surface-800 shadow-xl">
        <div className="border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">{tExport('title')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{statusLabel}</p>
        </div>

        <div className="space-y-4 p-5">
          <div className="h-2 overflow-hidden rounded-full bg-surface-600">
            <div
              className="h-full rounded-full bg-accent-500 transition-all duration-300"
              style={{ width: `${Math.max(2, progress.percentage)}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-text-tertiary tabular-nums">
            {Math.round(progress.percentage)}%
          </div>

          <div className="grid gap-2 rounded-lg border border-border-subtle bg-surface-700/60 p-3">
            <label className="flex items-center justify-between gap-3 text-xs text-text-secondary">
              <span>{tExport('includeAnnotations')}</span>
              <input
                type="checkbox"
                checked={includeAnnotations}
                disabled={status === 'exporting'}
                onChange={(event) => setIncludeAnnotations(event.target.checked)}
                className="h-4 w-4 accent-accent-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-xs text-text-secondary">
              <div>
                <div>{tExport('flattenForms')}</div>
                <div className="text-[11px] text-text-tertiary">{tExport('flattenFormsDesc')}</div>
              </div>
              <input
                type="checkbox"
                checked={flattenForms}
                disabled={status === 'exporting'}
                onChange={(event) => setFlattenForms(event.target.checked)}
                className="h-4 w-4 accent-accent-500"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-xs text-text-secondary">
              <span>{tExport('quality')}</span>
              <select
                value={quality}
                disabled={status === 'exporting'}
                onChange={(event) => setQuality(event.target.value as 'standard' | 'high')}
                className="h-8 rounded border border-border-default bg-surface-700 px-2 text-xs text-text-primary outline-none focus:border-accent-500"
              >
                <option value="standard">{tExport('qualityStandard')}</option>
                <option value="high">{tExport('qualityHigh')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4">
          {status === 'exporting' ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => abortControllerRef.current?.abort()}
            >
              {tExport('cancel')}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={closeExport}>
              {tExport('cancel')}
            </Button>
          )}

          {status === 'done' ? (
            <Button type="button" variant="primary" size="sm" onClick={() => void handleRunExport()}>
              {tExport('downloadAgain')}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => void handleRunExport()}
              disabled={!pdfFile || status === 'exporting'}
            >
              {tExport('download')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
