'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useEditor } from '@/store/EditorContext';
import { usePdf } from '@/store/PdfContext';
import { useCanvas } from '@/store/CanvasContext';
import { useExport } from '@/store/ExportContext';
import ToolButton from '@/components/ui/ToolButton';
import type { EditorTool } from '@/types';

interface ToolDefinition {
  id: EditorTool;
  labelKey: string;
  icon: string;
}

const TOOLS: ToolDefinition[] = [
  { id: 'select', labelKey: 'select', icon: '⎍' },
  { id: 'text', labelKey: 'text', icon: 'T' },
  { id: 'draw', labelKey: 'draw', icon: '✎' },
  { id: 'highlight', labelKey: 'highlight', icon: '▬' },
  { id: 'measure', labelKey: 'measure', icon: '⟷' },
  { id: 'measureArea', labelKey: 'measureArea', icon: '▭' },
  { id: 'ocr', labelKey: 'ocr', icon: '◫' },
  { id: 'image', labelKey: 'image', icon: '▣' },
  { id: 'signature', labelKey: 'signature', icon: '✍' },
  { id: 'eraser', labelKey: 'eraser', icon: '◩' },
];

const normalizePromptPayPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  }

  if (digits.length === 11 && digits.startsWith('66')) {
    return `0${digits.slice(2)}`;
  }

  return '';
};

export default function Toolbar() {
  const t = useTranslations('toolbar');
  const tZoom = useTranslations('zoom');
  const tPages = useTranslations('pages');
  const tExport = useTranslations('export');
  const [isDonateOpen, setDonateOpen] = useState(false);
  const {
    editorMode,
    isFullscreen,
    activeTool,
    setEditorMode,
    setFullscreen,
    setActiveTool,
    setPropertiesPanelOpen,
  } = useEditor();
  const { undo, redo, canUndo, canRedo, setActiveCanvas } = useCanvas();
  const { openExport } = useExport();
  const { currentPage, numPages, setCurrentPage, zoom, zoomIn, zoomOut, pdfFile } =
    usePdf();

  const donationQrUrl = useMemo(() => {
    const phone = normalizePromptPayPhone(process.env.NEXT_PUBLIC_DONATE_PROMPTPAY_PHONE ?? '');

    if (!phone) {
      return null;
    }

    return `https://promptpay.io/${encodeURIComponent(phone)}.png`;
  }, []);

  const hasPdf = pdfFile !== null;

  const handleModeChange = (mode: 'view' | 'edit') => {
    setEditorMode(mode);
    if (mode === 'edit' && numPages > 0) {
      setPropertiesPanelOpen(true);
      setActiveCanvas(currentPage);
      return;
    }

    setPropertiesPanelOpen(false);
    setActiveCanvas(null);
  };

  const handleToolSelect = (tool: EditorTool) => {
    if (editorMode === 'view') {
      setEditorMode('edit');
    }

    setPropertiesPanelOpen(true);

    if (numPages > 0) {
      setActiveCanvas(currentPage);
    }

    setActiveTool(tool);
  };

  const goToPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, numPages));
    setCurrentPage(nextPage);

    if (editorMode === 'edit') {
      setActiveCanvas(nextPage);
    }
  };

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') {
      return;
    }

    const rootElement = document.documentElement;
    const canRequestFullscreen = typeof rootElement.requestFullscreen === 'function';
    const canExitFullscreen = typeof document.exitFullscreen === 'function';

    if (!canRequestFullscreen || !canExitFullscreen) {
      setFullscreen(!isFullscreen);
      return;
    }

    const run = async () => {
      try {
        if (!document.fullscreenElement) {
          await rootElement.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }

        setFullscreen(Boolean(document.fullscreenElement));
      } catch {
        setFullscreen(!isFullscreen);
      }
    };

    void run();
  };

  useEffect(() => {
    if (!isDonateOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDonateOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDonateOpen]);

  return (
    <>
      <div className="flex items-center h-11 px-2 bg-surface-700 border-b border-border-subtle shrink-0 z-20 gap-0.5 overflow-x-auto">
        {hasPdf && (
          <div className="flex items-center gap-0.5">
            <ToolButton
              active={editorMode === 'view'}
              label={t('viewMode')}
              onClick={() => handleModeChange('view')}
              className="w-auto px-2.5"
            >
              <span className="text-[11px] leading-none font-semibold select-none">{t('viewMode')}</span>
            </ToolButton>
            <ToolButton
              active={editorMode === 'edit'}
              label={t('editMode')}
              onClick={() => handleModeChange('edit')}
              className="w-auto px-2.5"
            >
              <span className="text-[11px] leading-none font-semibold select-none">{t('editMode')}</span>
            </ToolButton>
          </div>
        )}

        {hasPdf && <div className="w-px h-5 bg-border-default mx-2 shrink-0" />}

        <div className="flex items-center gap-0.5">
          {TOOLS.map((tool) => (
            <ToolButton
              key={tool.id}
              active={activeTool === tool.id}
              label={t(tool.labelKey)}
              onClick={() => handleToolSelect(tool.id)}
              disabled={!hasPdf || editorMode === 'view'}
            >
              <span className="text-base leading-none select-none">{tool.icon}</span>
            </ToolButton>
          ))}
        </div>

        <div className="w-px h-5 bg-border-default mx-2 shrink-0" />

        <div className="flex items-center gap-0.5">
          <ToolButton label={t('undo')} onClick={undo} disabled={!hasPdf || editorMode === 'view' || !canUndo}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
              <title>{t('undo')}</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6L3 10l4 4" />
            </svg>
          </ToolButton>
          <ToolButton label={t('redo')} onClick={redo} disabled={!hasPdf || editorMode === 'view' || !canRedo}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
              <title>{t('redo')}</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 6l4 4-4 4" />
            </svg>
          </ToolButton>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <ToolButton
            label={t('donate')}
            onClick={() => setDonateOpen(true)}
            className="w-auto gap-1.5 px-2.5"
          >
            <span className="text-sm leading-none select-none" aria-hidden="true">❤</span>
            <span className="text-[11px] leading-none font-semibold select-none">{t('donate')}</span>
          </ToolButton>

          {hasPdf && (
            <div className="flex items-center gap-2">
              <ToolButton label={tExport('download')} onClick={openExport}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                  <title>{tExport('download')}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                </svg>
              </ToolButton>

              <ToolButton
                label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                onClick={toggleFullscreen}
              >
                <span className="text-base leading-none select-none">
                  {isFullscreen ? '⤡' : '⤢'}
                </span>
              </ToolButton>

              <div className="flex items-center gap-1">
                <ToolButton label={tZoom('zoomOut')} onClick={zoomOut}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tZoom('zoomOut')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </ToolButton>
                <span className="text-xs text-text-secondary font-mono w-10 text-center tabular-nums select-none">
                  {zoom}%
                </span>
                <ToolButton label={tZoom('zoomIn')} onClick={zoomIn}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tZoom('zoomIn')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </ToolButton>
              </div>

              <div className="w-px h-5 bg-border-default mx-1 shrink-0" />

              <div className="flex items-center gap-1">
                <ToolButton
                  label={tPages('previous')}
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tPages('previous')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </ToolButton>
                <span className="text-xs text-text-secondary font-mono tabular-nums select-none whitespace-nowrap">
                  {currentPage} / {numPages}
                </span>
                <ToolButton
                  label={tPages('next')}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tPages('next')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </ToolButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {isDonateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label={t('closeDonate')}
            onClick={() => setDonateOpen(false)}
            className="absolute inset-0"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('donateTitle')}
            className="w-full max-w-sm overflow-hidden rounded-xl border border-border-default bg-surface-800 shadow-xl"
          >
            <div className="border-b border-border-subtle px-5 py-4">
              <h3 className="text-sm font-semibold text-text-primary">{t('donateTitle')}</h3>
              <p className="mt-1 text-xs text-text-secondary">{t('donateSubtitle')}</p>
            </div>

            <div className="space-y-4 p-5">
              {donationQrUrl ? (
                <div className="mx-auto h-56 w-56 rounded-lg border border-border-default bg-white p-2">
                  <div
                    role="img"
                    aria-label={t('donateQrAlt')}
                    className="h-full w-full rounded bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: `url("${donationQrUrl}")` }}
                  />
                </div>
              ) : (
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-700 px-4 text-center text-xs text-text-secondary">
                  {t('donateQrMissing')}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-border-subtle px-5 py-4">
              <button
                type="button"
                onClick={() => setDonateOpen(false)}
                className="h-8 rounded-md border border-border-default px-3 text-xs text-text-secondary transition-colors hover:bg-surface-600 hover:text-text-primary"
              >
                {t('closeDonate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
