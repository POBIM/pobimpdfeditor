'use client';

import { useTranslations } from 'next-intl';
import { useEditor } from '@/store/EditorContext';
import { usePdf } from '@/store/PdfContext';
import dynamic from 'next/dynamic';

const PdfThumbnails = dynamic(
  () => import('@/components/pdf/PdfThumbnails'),
  { ssr: false }
);

export default function Sidebar() {
  const t = useTranslations('sidebar');
  const tPages = useTranslations('pages');
  const { sidebarOpen, toggleSidebar } = useEditor();
  const { numPages, pdfFile } = usePdf();

  return (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-0 top-[calc(theme(spacing.12)+theme(spacing.11))] z-30
          flex items-center justify-center w-6 h-8 
          bg-surface-700 hover:bg-surface-600 text-text-tertiary hover:text-text-secondary
          border-r border-t border-b border-border-subtle rounded-r-md
          transition-colors duration-150 cursor-pointer"
        aria-label={sidebarOpen ? t('collapse') : t('expand')}
        style={{ left: sidebarOpen ? '220px' : '0px', transition: 'left 300ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        <svg
          className={`w-3 h-3 transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
          role="img"
        >
          <title>{sidebarOpen ? t('collapse') : t('expand')}</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <aside
        className="shrink-0 bg-surface-800 border-r border-border-subtle flex flex-col z-20 overflow-hidden"
        style={{
          width: sidebarOpen ? '220px' : '0px',
          transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="flex items-center justify-between h-9 px-3 border-b border-border-subtle shrink-0">
          <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {t('pages')}
          </span>
          {numPages > 0 && (
            <span className="text-[10px] text-text-tertiary font-mono tabular-nums">
              {tPages('pageCount', { count: numPages })}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2">
          {pdfFile ? (
            <PdfThumbnails />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-xs text-text-tertiary">{tPages('thumbnails')}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
