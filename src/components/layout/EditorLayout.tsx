'use client';

import { useCallback, useEffect, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import Header from './Header';
import Toolbar from './Toolbar';
import ToolConfigBar from './ToolConfigBar';
import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import SignaturePad from '@/components/canvas/SignaturePad';
import ExportModal from '@/components/pdf/ExportModal';
import { useEditor } from '@/store/EditorContext';

interface EditorLayoutProps {
  children: ReactNode;
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  const tToolbar = useTranslations('toolbar');
  const { isFullscreen, setFullscreen } = useEditor();

  const handleExitFullscreen = useCallback(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const run = async () => {
      if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        try {
          await document.exitFullscreen();
          return;
        } catch {}
      }

      setFullscreen(false);
    };

    void run();
  }, [setFullscreen]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    handleFullscreenChange();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [setFullscreen]);

  useEffect(() => {
    if (!isFullscreen || typeof document === 'undefined') {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleExitFullscreen();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isFullscreen, handleExitFullscreen]);

  return (
    <div data-editor-shell className="flex flex-col h-screen w-screen overflow-hidden">
      {!isFullscreen && <Header />}
      {!isFullscreen && <Toolbar />}
      {!isFullscreen && <ToolConfigBar />}
      <div data-editor-content className="flex flex-1 min-h-0">
        {!isFullscreen && <Sidebar />}
        <main data-print-main className="flex-1 min-w-0 bg-canvas-bg relative overflow-auto">
          {children}

          {isFullscreen && (
            <button
              type="button"
              onClick={handleExitFullscreen}
              className="fixed right-4 top-4 z-50 h-9 px-3 rounded-md border border-border-default bg-surface-800/90 text-xs text-text-primary hover:bg-surface-700"
            >
              {tToolbar('exitFullscreen')}
            </button>
          )}
        </main>
        {!isFullscreen && <PropertiesPanel />}
      </div>
      <SignaturePad />
      <ExportModal />
    </div>
  );
}
