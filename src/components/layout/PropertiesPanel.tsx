'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { FabricObject } from 'fabric';
import { useCanvas } from '@/store/CanvasContext';
import { useEditor } from '@/store/EditorContext';

function isTextObject(object: FabricObject) {
  return object.type === 'i-text' || object.type === 'text';
}

function isPathObject(object: FabricObject) {
  return object.type === 'path';
}

function isImageObject(object: FabricObject) {
  return object.type === 'image';
}

export default function PropertiesPanel() {
  const t = useTranslations('properties');
  const { propertiesPanelOpen, setPropertiesPanelOpen } = useEditor();
  const { selectedObject, selectedPageNumber, getCanvas } = useCanvas();

  const targetCanvas = useMemo(() => {
    if (selectedPageNumber === null) {
      return null;
    }

    return getCanvas(selectedPageNumber);
  }, [getCanvas, selectedPageNumber]);

  const applyObjectUpdate = (properties: Record<string, string | number | boolean>) => {
    if (!selectedObject) {
      return;
    }

    selectedObject.set(properties);
    selectedObject.setCoords();
    targetCanvas?.requestRenderAll();
  };

  const panelWidthClass = propertiesPanelOpen ? 'w-72' : 'w-0';

  return (
    <aside
      className={`relative shrink-0 bg-surface-800 border-l border-border-subtle overflow-hidden transition-all duration-300 ${panelWidthClass}`}
    >
      <button
        type="button"
        onClick={() => setPropertiesPanelOpen(!propertiesPanelOpen)}
        className="absolute left-0 top-3 -translate-x-full h-8 w-6 rounded-l-md border border-r-0 border-border-subtle bg-surface-700 text-text-tertiary hover:text-text-primary"
        aria-label={t('title')}
      >
        ◧
      </button>

      {propertiesPanelOpen && (
        <div className="h-full overflow-y-auto">
          <div className="h-9 px-3 border-b border-border-subtle flex items-center">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              {t('title')}
            </span>
          </div>

          {!selectedObject && (
            <div className="p-4 text-xs text-text-tertiary">{t('noSelection')}</div>
          )}

          {selectedObject && (
            <div className="p-3 space-y-3">
              <label className="block text-xs text-text-secondary">
                {t('position')} X
                <input
                  type="number"
                  value={Math.round(selectedObject.left ?? 0)}
                  onChange={(event) => applyObjectUpdate({ left: Number(event.target.value) })}
                  className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                />
              </label>

              <label className="block text-xs text-text-secondary">
                {t('position')} Y
                <input
                  type="number"
                  value={Math.round(selectedObject.top ?? 0)}
                  onChange={(event) => applyObjectUpdate({ top: Number(event.target.value) })}
                  className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                />
              </label>

              <label className="block text-xs text-text-secondary">
                {t('size')} W
                <input
                  type="number"
                  value={Math.round(selectedObject.getScaledWidth())}
                  onChange={(event) => {
                    const currentWidth = selectedObject.getScaledWidth() || 1;
                    applyObjectUpdate({ scaleX: Number(event.target.value) / currentWidth * (selectedObject.scaleX ?? 1) });
                  }}
                  className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                />
              </label>

              <label className="block text-xs text-text-secondary">
                {t('size')} H
                <input
                  type="number"
                  value={Math.round(selectedObject.getScaledHeight())}
                  onChange={(event) => {
                    const currentHeight = selectedObject.getScaledHeight() || 1;
                    applyObjectUpdate({ scaleY: Number(event.target.value) / currentHeight * (selectedObject.scaleY ?? 1) });
                  }}
                  className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                />
              </label>

              <label className="block text-xs text-text-secondary">
                {t('rotation')}
                <input
                  type="number"
                  value={Math.round(selectedObject.angle ?? 0)}
                  onChange={(event) => applyObjectUpdate({ angle: Number(event.target.value) })}
                  className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                />
              </label>

              <label className="block text-xs text-text-secondary">
                {t('opacity')}
                <input
                  type="range"
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={selectedObject.opacity ?? 1}
                  onChange={(event) => applyObjectUpdate({ opacity: Number(event.target.value) })}
                  className="mt-1 w-full"
                />
              </label>

              {isTextObject(selectedObject) && (
                <>
                  <label className="block text-xs text-text-secondary">
                    {t('fontSize')}
                    <input
                      type="number"
                      min={8}
                      value={Number(selectedObject.get('fontSize') ?? 16)}
                      onChange={(event) => applyObjectUpdate({ fontSize: Number(event.target.value) })}
                      className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('color')}
                    <input
                      type="color"
                      value={String(selectedObject.get('fill') ?? '#111111')}
                      onChange={(event) => applyObjectUpdate({ fill: event.target.value })}
                      className="mt-1 h-8 w-full rounded border border-border-default bg-transparent p-1"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('fontFamily')}
                    <input
                      type="text"
                      value={String(selectedObject.get('fontFamily') ?? 'sans-serif')}
                      onChange={(event) => applyObjectUpdate({ fontFamily: event.target.value })}
                      className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyObjectUpdate({ fontWeight: selectedObject.get('fontWeight') === 'bold' ? 'normal' : 'bold' })}
                      className="h-8 px-2 rounded border border-border-default text-xs text-text-secondary hover:text-text-primary"
                    >
                      {t('bold')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyObjectUpdate({ fontStyle: selectedObject.get('fontStyle') === 'italic' ? 'normal' : 'italic' })}
                      className="h-8 px-2 rounded border border-border-default text-xs text-text-secondary hover:text-text-primary"
                    >
                      {t('italic')}
                    </button>
                  </div>
                </>
              )}

              {isPathObject(selectedObject) && (
                <>
                  <label className="block text-xs text-text-secondary">
                    {t('strokeColor')}
                    <input
                      type="color"
                      value={String(selectedObject.get('stroke') ?? '#111111')}
                      onChange={(event) => applyObjectUpdate({ stroke: event.target.value })}
                      className="mt-1 h-8 w-full rounded border border-border-default bg-transparent p-1"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('strokeWidth')}
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={Number(selectedObject.get('strokeWidth') ?? 1)}
                      onChange={(event) => applyObjectUpdate({ strokeWidth: Number(event.target.value) })}
                      className="mt-1 w-full"
                    />
                  </label>
                </>
              )}

              {isImageObject(selectedObject) && (
                <label className="flex items-center gap-2 text-xs text-text-secondary">
                  <input
                    type="checkbox"
                    checked={targetCanvas?.uniformScaling ?? true}
                    onChange={(event) => {
                      if (!targetCanvas) {
                        return;
                      }

                      targetCanvas.uniformScaling = event.target.checked;
                      targetCanvas.requestRenderAll();
                    }}
                    className="h-4 w-4 rounded border-border-default"
                  />
                  <span>{t('aspectRatioLock')}</span>
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
