'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import MergePdfModal from '@/components/pdf/MergePdfModal';
import { usePdf } from '@/store/PdfContext';

const SplitPdfModal = dynamic(() => import('@/components/pdf/SplitPdfModal'), {
  ssr: false,
});
import { useExport } from '@/store/ExportContext';

export default function Header() {
  const tApp = useTranslations('app');
  const tFile = useTranslations('file');
  const tExport = useTranslations('export');
  const { pdfFile, fileName, setPdfFile, clearPdf } = usePdf();
  const { openExport } = useExport();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const openInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener('mousedown', handleOutsideClick);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const handleOpenFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      return;
    }

    const bytes = await file.arrayBuffer();
    setPdfFile(bytes, file.name);
    setMenuOpen(false);
    event.target.value = '';
  }, [setPdfFile]);

  return (
    <>
      <header className="flex items-center h-12 px-4 bg-surface-800 border-b border-border-subtle shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-accent-500 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              aria-hidden="true"
              role="img"
            >
              <title>{tApp('title')}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h1 className="text-sm font-semibold text-text-primary tracking-tight whitespace-nowrap">
              {tApp('title')}
            </h1>
          </div>

          {fileName && (
            <>
              <span className="text-text-tertiary select-none">/</span>
              <span className="text-xs text-text-secondary truncate max-w-[200px]">{fileName}</span>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openExport}
            disabled={!pdfFile}
            className="flex items-center gap-1.5 h-7 px-2.5 rounded bg-accent-500/15 text-xs font-medium text-accent-400 hover:bg-accent-500/25 transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
              <title>{tExport('download')}</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
            </svg>
            <span>{tExport('download')}</span>
          </button>

          <div className="relative" ref={menuRef}>
            <input
              ref={openInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(event) => void handleOpenFile(event)}
            />
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-colors duration-150 cursor-pointer"
            >
              <span>{tFile('menu')}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
                role="img"
              >
                <title>{tFile('menu')}</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 overflow-hidden rounded-lg border border-border-default bg-surface-700 shadow-xl shadow-black/30 z-50">
                <button
                  type="button"
                  onClick={() => openInputRef.current?.click()}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary"
                >
                  {tFile('open')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMergeOpen(true);
                    setMenuOpen(false);
                  }}
                  disabled={!pdfFile}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                  {tFile('merge')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitOpen(true);
                    setMenuOpen(false);
                  }}
                  disabled={!pdfFile}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                  {tFile('split')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openExport();
                    setMenuOpen(false);
                  }}
                  disabled={!pdfFile}
                  className="w-full px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-600 hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
                >
                  {tFile('download')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPdf();
                    setMenuOpen(false);
                  }}
                  disabled={!pdfFile}
                  className="w-full px-3 py-2 text-left text-xs text-error hover:bg-surface-600 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {tFile('close')}
                </button>
              </div>
            )}
          </div>

          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <MergePdfModal isOpen={mergeOpen} onClose={() => setMergeOpen(false)} />
      <SplitPdfModal isOpen={splitOpen} onClose={() => setSplitOpen(false)} />
    </>
  );
}
