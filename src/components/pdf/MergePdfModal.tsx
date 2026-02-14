'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PDFDocument } from 'pdf-lib';
import Button from '@/components/ui/Button';
import { usePdf } from '@/store/PdfContext';
import { mergePdfs } from '@/lib/pdfOperations';

interface MergeFileItem {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  pageCount: number;
}

interface MergePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MergePdfModal({ isOpen, onClose }: MergePdfModalProps) {
  const t = useTranslations('merge');
  const { pdfFile, updatePdfFile } = usePdf();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return items.reduce((sum, item) => sum + item.pageCount, 0);
  }, [items]);

  const handleAddFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const newItems: MergeFileItem[] = [];
    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        continue;
      }

      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      newItems.push({
        id: `${file.name}-${crypto.randomUUID()}`,
        name: file.name,
        bytes,
        pageCount: pdf.getPageCount(),
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  }, []);

  const handleMerge = useCallback(async () => {
    if (!pdfFile || items.length === 0) {
      return;
    }

    setIsMerging(true);
    try {
      const merged = await mergePdfs([pdfFile, ...items.map((item) => item.bytes)]);
      updatePdfFile(merged);
      setItems([]);
      onClose();
    } finally {
      setIsMerging(false);
    }
  }, [pdfFile, items, updatePdfFile, onClose]);

  const handleDrop = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) {
        return;
      }

      setItems((prev) => {
        const next = [...prev];
        const from = next.findIndex((item) => item.id === draggedId);
        const to = next.findIndex((item) => item.id === targetId);
        if (from < 0 || to < 0) {
          return prev;
        }

        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        return next;
      });
    },
    [draggedId]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 overflow-hidden rounded-xl border border-border-default bg-surface-800 shadow-xl">
        <div className="border-b border-border-subtle px-5 py-4">
          <h3 className="text-sm font-semibold text-text-primary">{t('title')}</h3>
          <p className="mt-1 text-xs text-text-secondary">{t('description')}</p>
        </div>

        <div className="space-y-3 p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(event) => void handleAddFiles(event.target.files)}
          />

          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            className="w-full"
          >
            {t('addFiles')}
          </Button>

          <div className="rounded-lg border border-border-subtle bg-surface-700/55 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-text-secondary">{t('fileCount', { count: items.length })}</span>
              <span className="text-xs text-text-tertiary">{t('totalPages', { count: totalPages })}</span>
            </div>
            <div className="mb-2 rounded border border-border-default/70 bg-surface-800/75 px-3 py-2 text-xs text-text-secondary">
              {t('currentDocument')}
            </div>
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  draggable
                  onDragStart={() => setDraggedId(item.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(item.id)}
                  onDragEnd={() => setDraggedId(null)}
                  className={`flex items-center justify-between rounded border px-3 py-2 text-xs transition-colors
                    ${draggedId === item.id ? 'border-accent-500 bg-accent-500/10' : 'border-border-default bg-surface-800/75'}`}
                >
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="font-mono text-text-tertiary">{item.pageCount}</span>
                </button>
              ))}
            </div>
            {items.length > 1 && (
              <p className="mt-2 text-[11px] text-text-tertiary">{t('dragToReorder')}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border-subtle px-5 py-4">
          {isMerging && <span className="text-xs text-accent-400">{t('merging')}</span>}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isMerging}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => void handleMerge()}
            disabled={isMerging || !pdfFile || items.length === 0}
          >
            {t('merge')}
          </Button>
        </div>
      </div>
    </div>
  );
}
