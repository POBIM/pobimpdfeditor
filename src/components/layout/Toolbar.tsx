'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
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
  icon: ReactNode;
}

const IC = "w-[var(--tool-btn-icon)] h-[var(--tool-btn-icon)]";

const TOOLS: ToolDefinition[] = [
  {
    id: 'select',
    labelKey: 'select',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 3l.587 14.21 3.87-4.584 5.293 8.374 2.5-1.582-5.293-8.374 5.543-1.625z" />
      </svg>
    ),
  },
  {
    id: 'text',
    labelKey: 'text',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 7V4h14v3M12 4v16M8.5 20h7" />
      </svg>
    ),
  },
  {
    id: 'draw',
    labelKey: 'draw',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L7.5 19.152l-4 1 1-4 13.362-13.665z" />
      </svg>
    ),
  },
  {
    id: 'highlight',
    labelKey: 'highlight',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.66 3.34l2.83 2.83-8.49 8.49-4.24 1.41 1.41-4.24 8.49-8.49z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14" strokeWidth={3} opacity={0.5} />
      </svg>
    ),
  },
  {
    id: 'measure',
    labelKey: 'measure',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M6 9l-3 3 3 3M18 9l3 3-3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10v4M12 8v8M15 10v4" />
      </svg>
    ),
  },
  {
    id: 'measureArea',
    labelKey: 'measureArea',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="1" strokeDasharray="4 2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h2M4 14h2M10 4v2M14 4v2M18 10h2M18 14h2M10 18v2M14 18v2" />
      </svg>
    ),
  },
  {
    id: 'ocr',
    labelKey: 'ocr',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8V5a2 2 0 012-2h3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M21 16v3a2 2 0 01-2 2h-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 9h10M7 12h10M7 15h6" />
      </svg>
    ),
  },
  {
    id: 'image',
    labelKey: 'image',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
      </svg>
    ),
  },
  {
    id: 'signature',
    labelKey: 'signature',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 3.5l3 3L9 18l-4.5 1.5L6 15 17.5 3.5z" />
        <path strokeLinecap="round" d="M3 21c2.5-1 5-2.5 7-2s3 2 5.5 1.5S19 19 21 18.5" />
      </svg>
    ),
  },
  {
    id: 'eraser',
    labelKey: 'eraser',
    icon: (
      <svg className={IC} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.37 5.63a3 3 0 010 4.24L11.5 16.74 7.26 12.5l6.87-6.87a3 3 0 014.24 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.5 16.74L8.83 19.41a2 2 0 01-1.42.59H4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20h11" />
      </svg>
    ),
  },
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
      <div className="flex items-center h-[var(--spacing-toolbar)] px-2 bg-surface-700 border-b border-border-subtle shrink-0 z-20 gap-0.5 overflow-x-auto">
        {hasPdf && (
          <div className="flex items-center gap-0.5">
            <ToolButton
              active={editorMode === 'view'}
              label={t('viewMode')}
              onClick={() => handleModeChange('view')}
              className="w-auto px-2.5"
            >
              <span className="text-[length:var(--tool-mode-size)] leading-none font-semibold select-none">{t('viewMode')}</span>
            </ToolButton>
            <ToolButton
              active={editorMode === 'edit'}
              label={t('editMode')}
              onClick={() => handleModeChange('edit')}
              className="w-auto px-2.5"
            >
              <span className="text-[length:var(--tool-mode-size)] leading-none font-semibold select-none">{t('editMode')}</span>
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
              {tool.icon}
            </ToolButton>
          ))}
        </div>

        <div className="w-px h-5 bg-border-default mx-2 shrink-0" />

        <div className="flex items-center gap-0.5">
          <ToolButton label={t('undo')} onClick={undo} disabled={!hasPdf || editorMode === 'view' || !canUndo}>
            <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
              <title>{t('undo')}</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 6L3 10l4 4" />
            </svg>
          </ToolButton>
          <ToolButton label={t('redo')} onClick={redo} disabled={!hasPdf || editorMode === 'view' || !canRedo}>
            <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
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
            <span className="text-[length:var(--tool-icon-size)] leading-none select-none" aria-hidden="true">❤</span>
            <span className="text-[length:var(--tool-mode-size)] leading-none font-semibold select-none">{t('donate')}</span>
          </ToolButton>

          {hasPdf && (
            <div className="flex items-center gap-2">
              <ToolButton label={tExport('download')} onClick={openExport}>
                <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                  <title>{tExport('download')}</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" />
                </svg>
              </ToolButton>

              <ToolButton
                label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
                onClick={toggleFullscreen}
              >
                <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  {isFullscreen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4l5 0 0 5M20 4l-5 0 0 5M4 20l5 0 0-5M20 20l-5 0 0-5" />
                  )}
                </svg>
              </ToolButton>

              <div className="flex items-center gap-1">
                <ToolButton label={tZoom('zoomOut')} onClick={zoomOut}>
                  <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tZoom('zoomOut')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </ToolButton>
                <span className="text-[length:var(--tool-value-size)] text-text-secondary font-mono w-10 text-center tabular-nums select-none">
                  {zoom}%
                </span>
                <ToolButton label={tZoom('zoomIn')} onClick={zoomIn}>
                  <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
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
                  <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
                    <title>{tPages('previous')}</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </ToolButton>
                <span className="text-[length:var(--tool-value-size)] text-text-secondary font-mono tabular-nums select-none whitespace-nowrap">
                  {currentPage} / {numPages}
                </span>
                <ToolButton
                  label={tPages('next')}
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= numPages}
                >
                  <svg className="w-[var(--tool-icon-size)] h-[var(--tool-icon-size)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
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
              <h3 className="text-[length:var(--tool-label-size)] font-semibold text-text-primary">{t('donateTitle')}</h3>
              <p className="mt-1 text-[length:var(--tool-value-size)] text-text-secondary">{t('donateSubtitle')}</p>
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
                <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-lg border border-dashed border-border-default bg-surface-700 px-4 text-center text-[length:var(--tool-value-size)] text-text-secondary">
                  {t('donateQrMissing')}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end border-t border-border-subtle px-5 py-4">
              <button
                type="button"
                onClick={() => setDonateOpen(false)}
                className="h-[var(--tool-control-h)] rounded-[var(--tool-control-radius)] border border-border-default px-3 text-[length:var(--tool-value-size)] text-text-secondary transition-colors hover:bg-surface-600 hover:text-text-primary"
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
