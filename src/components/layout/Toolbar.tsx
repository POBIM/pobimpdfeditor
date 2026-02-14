'use client';

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

export default function Toolbar() {
  const t = useTranslations('toolbar');
  const tZoom = useTranslations('zoom');
  const tPages = useTranslations('pages');
  const tExport = useTranslations('export');
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

  return (
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
  );
}
