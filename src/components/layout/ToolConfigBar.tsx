'use client';

import { useTranslations } from 'next-intl';
import { useEditor } from '@/store/EditorContext';

export default function ToolConfigBar() {
  const t = useTranslations('toolConfig');
  const { activeTool, toolConfig, setToolConfig } = useEditor();

  if (activeTool === 'select' || activeTool === 'image' || activeTool === 'signature' || activeTool === 'eraser') {
    return null;
  }

  return (
    <div className="h-10 px-3 bg-surface-700 border-b border-border-subtle flex items-center gap-4 shrink-0 overflow-x-auto">
      {activeTool === 'text' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('fontSize')}</span>
            <select
              value={toolConfig.text.fontSize}
              onChange={(event) => setToolConfig('text', { fontSize: Number(event.target.value) })}
              className="h-7 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            >
              {[12, 14, 16, 18, 24, 32, 48].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.text.color}
              onChange={(event) => setToolConfig('text', { color: event.target.value })}
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>

          <button
            type="button"
            onClick={() => setToolConfig('text', { bold: !toolConfig.text.bold })}
            className={`h-7 px-2.5 rounded border text-xs transition-colors ${
              toolConfig.text.bold
                ? 'border-accent-500 text-accent-400 bg-accent-500/10'
                : 'border-border-default text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('bold')}
          </button>

          <button
            type="button"
            onClick={() => setToolConfig('text', { italic: !toolConfig.text.italic })}
            className={`h-7 px-2.5 rounded border text-xs transition-colors ${
              toolConfig.text.italic
                ? 'border-accent-500 text-accent-400 bg-accent-500/10'
                : 'border-border-default text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('italic')}
          </button>
        </>
      )}

      {activeTool === 'draw' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-56">
            <span>{t('brushSize')}</span>
            <input
              type="range"
              min={1}
              max={20}
              value={toolConfig.draw.brushSize}
              onChange={(event) => setToolConfig('draw', { brushSize: Number(event.target.value) })}
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-6">{toolConfig.draw.brushSize}</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.draw.color}
              onChange={(event) => setToolConfig('draw', { color: event.target.value })}
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>
        </>
      )}

      {activeTool === 'highlight' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-56">
            <span>{t('brushSize')}</span>
            <input
              type="range"
              min={8}
              max={40}
              value={toolConfig.highlight.brushSize}
              onChange={(event) => setToolConfig('highlight', { brushSize: Number(event.target.value) })}
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-6">{toolConfig.highlight.brushSize}</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.highlight.color}
              onChange={(event) => setToolConfig('highlight', { color: event.target.value })}
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-44">
            <span>{t('opacity')}</span>
            <input
              type="range"
              min={0.1}
              max={0.8}
              step={0.05}
              value={toolConfig.highlight.opacity}
              onChange={(event) => setToolConfig('highlight', { opacity: Number(event.target.value) })}
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-10">{Math.round(toolConfig.highlight.opacity * 100)}%</span>
          </label>
        </>
      )}
    </div>
  );
}
