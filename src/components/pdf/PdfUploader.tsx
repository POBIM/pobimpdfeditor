'use client';

import { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePdf } from '@/store/PdfContext';

export default function PdfUploader() {
  const t = useTranslations('upload');
  const { setPdfFile } = usePdf();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== 'application/pdf') {
        setError(t('invalidFile'));
        return;
      }
      setError(null);
      const buffer = await file.arrayBuffer();
      setPdfFile(buffer, file.name);
    },
    [setPdfFile, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

   return (
    <div className="flex items-center justify-center h-full p-8">
      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex flex-col items-center justify-center gap-6 w-full max-w-md aspect-[4/3]
          rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
          ${
            isDragging
              ? 'border-accent-500 bg-accent-500/5 scale-[1.02]'
              : 'border-surface-300/50 hover:border-surface-200/60 bg-surface-800/40 hover:bg-surface-800/60'
          }
          ${isDragging ? 'animate-[drop-pulse_1.5s_ease-in-out_infinite]' : ''}
        `}
        style={{ animationDuration: isDragging ? '1.5s' : '0s' }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="hidden"
          aria-label={t('browse')}
        />

        <div className={`transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <svg
            className="w-16 h-16 text-surface-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={0.8}
            aria-hidden="true"
            role="img"
          >
            <title>{t('title')}</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-2 px-4 text-center">
          <h3 className="text-lg font-semibold text-text-primary">
            {isDragging ? t('dropHere') : t('title')}
          </h3>
          <p className="text-sm text-text-tertiary leading-relaxed">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
              <title>{t('browse')}</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {t('browse')}
          </span>
          <span className="text-[11px] text-text-tertiary">{t('acceptedFormats')}</span>
        </div>

        {error && (
          <div className="absolute bottom-4 left-4 right-4 text-center text-xs text-error bg-error/10 rounded-lg py-2 px-3">
            {error}
          </div>
        )}
      </label>
    </div>
  );
}
