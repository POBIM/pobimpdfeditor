'use client';

import { useTranslations } from 'next-intl';
import { usePdf } from '@/store/PdfContext';
import ToolButton from '@/components/ui/ToolButton';
import { ZOOM_PRESETS } from '@/types';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function ZoomControls() {
  const t = useTranslations('zoom');
  const { zoom, setZoom, zoomIn, zoomOut } = usePdf();
  const [showPresets, setShowPresets] = useState(false);
  const presetsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (presetsRef.current && !presetsRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePresetSelect = useCallback(
    (preset: number) => {
      setZoom(preset);
      setShowPresets(false);
    },
    [setZoom]
  );

  return (
    <div className="flex items-center gap-1">
      <ToolButton label={t('zoomOut')} onClick={zoomOut}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
          <title>{t('zoomOut')}</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
        </svg>
      </ToolButton>

      <div ref={presetsRef} className="relative">
        <button
          type="button"
          onClick={() => setShowPresets(!showPresets)}
          className="flex items-center justify-center h-7 px-2 rounded text-xs font-mono
            text-text-secondary hover:text-text-primary hover:bg-surface-600
            transition-colors duration-150 tabular-nums min-w-[52px] cursor-pointer"
        >
          {zoom}%
        </button>

        {showPresets && (
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-28 py-1 rounded-lg
            bg-surface-700 border border-border-default shadow-xl shadow-black/30 z-50">
            {ZOOM_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer
                  ${
                    zoom === preset
                      ? 'text-accent-400 bg-accent-500/10'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-600'
                  }`}
              >
                <span>{preset}%</span>
                {zoom === preset && (
                  <span className="text-accent-400">&#10003;</span>
                )}
              </button>
            ))}
            <div className="border-t border-border-subtle my-1" />
            <button
              type="button"
              onClick={() => handlePresetSelect(100)}
              className="flex items-center w-full px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-colors cursor-pointer"
            >
              {t('fitWidth')}
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect(75)}
              className="flex items-center w-full px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-600 transition-colors cursor-pointer"
            >
              {t('fitPage')}
            </button>
          </div>
        )}
      </div>

      <ToolButton label={t('zoomIn')} onClick={zoomIn}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true" role="img">
          <title>{t('zoomIn')}</title>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
        </svg>
      </ToolButton>
    </div>
  );
}
