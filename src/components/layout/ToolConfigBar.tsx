'use client';

import { useTranslations } from 'next-intl';
import { useEditor } from '@/store/EditorContext';
import { usePdf } from '@/store/PdfContext';

export default function ToolConfigBar() {
  const t = useTranslations('toolConfig');
  const { editorMode, activeTool, toolConfig, setToolConfig } = useEditor();
  const { zoom } = usePdf();
  const currentScale = zoom / 100;

  if (
    editorMode === 'view' ||
    activeTool === 'select' ||
    activeTool === 'image' ||
    activeTool === 'signature' ||
    activeTool === 'eraser'
  ) {
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

      {activeTool === 'measure' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-52">
            <span>{t('lineWidth')}</span>
            <input
              type="range"
              min={1}
              max={8}
              value={toolConfig.measure.lineWidth}
              onChange={(event) => setToolConfig('measure', { lineWidth: Number(event.target.value) })}
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-6">{toolConfig.measure.lineWidth}</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.measure.color}
              onChange={(event) => setToolConfig('measure', { color: event.target.value })}
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-52">
            <span>{t('pixelsPerUnit')}</span>
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={toolConfig.measure.pixelsPerUnit}
              onChange={(event) =>
                setToolConfig('measure', {
                  pixelsPerUnit: Math.max(0.01, Number(event.target.value) || 0.01),
                  calibrationScale: currentScale,
                  isCalibrated: true,
                })
              }
              className="h-7 w-24 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('unitLabel')}</span>
            <input
              type="text"
              maxLength={8}
              value={toolConfig.measure.unitLabel}
              onChange={(event) =>
                setToolConfig('measure', {
                  unitLabel: event.target.value.trim() || 'cm',
                })
              }
              className="h-7 w-16 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setToolConfig('measure', {
                isCalibrated: false,
              })
            }
            className="h-7 px-2.5 rounded border border-border-default text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {t('recalibrate')}
          </button>
        </>
      )}

      {activeTool === 'ocr' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('ocrLanguage')}</span>
            <select
              value={toolConfig.ocr.language}
              onChange={(event) =>
                setToolConfig('ocr', {
                  language: event.target.value as 'eng' | 'tha' | 'tha+eng',
                })
              }
              className="h-7 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            >
              <option value="eng">{t('ocrLanguageEng')}</option>
              <option value="tha">{t('ocrLanguageTha')}</option>
              <option value="tha+eng">{t('ocrLanguageThaEng')}</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-56">
            <span>{t('minSelectionSize')}</span>
            <input
              type="range"
              min={12}
              max={120}
              step={2}
              value={toolConfig.ocr.minSelectionSize}
              onChange={(event) =>
                setToolConfig('ocr', {
                  minSelectionSize: Number(event.target.value),
                })
              }
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-10">{toolConfig.ocr.minSelectionSize}</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('outputFontSize')}</span>
            <select
              value={toolConfig.ocr.outputFontSize}
              onChange={(event) =>
                setToolConfig('ocr', { outputFontSize: Number(event.target.value) })
              }
              className="h-7 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            >
              {[12, 14, 16, 18, 20, 24, 28].map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.ocr.outputColor}
              onChange={(event) =>
                setToolConfig('ocr', { outputColor: event.target.value })
              }
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>
        </>
      )}

      {activeTool === 'measureArea' && (
        <>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('areaMode')}</span>
            <select
              value={toolConfig.measureArea.mode}
              onChange={(event) =>
                setToolConfig('measureArea', {
                  mode: event.target.value as 'rectangle' | 'polygon',
                })
              }
              className="h-7 px-2 rounded bg-surface-600 border border-border-default text-text-primary text-xs"
            >
              <option value="rectangle">{t('areaModeRectangle')}</option>
              <option value="polygon">{t('areaModePolygon')}</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-52">
            <span>{t('lineWidth')}</span>
            <input
              type="range"
              min={1}
              max={8}
              value={toolConfig.measureArea.lineWidth}
              onChange={(event) =>
                setToolConfig('measureArea', {
                  lineWidth: Number(event.target.value),
                })
              }
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-6">
              {toolConfig.measureArea.lineWidth}
            </span>
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{t('color')}</span>
            <input
              type="color"
              value={toolConfig.measureArea.color}
              onChange={(event) =>
                setToolConfig('measureArea', {
                  color: event.target.value,
                })
              }
              className="h-7 w-9 rounded border border-border-default bg-transparent p-1"
            />
          </label>

          <label className="flex items-center gap-2 text-xs text-text-secondary min-w-52">
            <span>{t('fillOpacity')}</span>
            <input
              type="range"
              min={0.05}
              max={0.6}
              step={0.05}
              value={toolConfig.measureArea.fillOpacity}
              onChange={(event) =>
                setToolConfig('measureArea', {
                  fillOpacity: Number(event.target.value),
                })
              }
              className="flex-1"
            />
            <span className="font-mono text-[11px] text-text-primary w-10">
              {Math.round(toolConfig.measureArea.fillOpacity * 100)}%
            </span>
          </label>
        </>
      )}
    </div>
  );
}
