'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { FabricObject } from 'fabric';
import { useCanvas } from '@/store/CanvasContext';
import { useEditor } from '@/store/EditorContext';
import { usePdf } from '@/store/PdfContext';

function isTextObject(object: FabricObject) {
  return object.type === 'i-text' || object.type === 'text';
}

function isPathObject(object: FabricObject) {
  return object.type === 'path';
}

function isImageObject(object: FabricObject) {
  return object.type === 'image';
}

function getObjectProfile(object: FabricObject) {
  if (isTextObject(object)) {
    return 'text';
  }

  if (isPathObject(object)) {
    return 'draw';
  }

  if (isImageObject(object)) {
    return 'image';
  }

  return 'generic';
}

const objectIdentity = new WeakMap<FabricObject, number>();
let objectIdentityCounter = 0;

function getObjectIdentity(object: FabricObject) {
  const existing = objectIdentity.get(object);
  if (existing) {
    return existing;
  }

  objectIdentityCounter += 1;
  objectIdentity.set(object, objectIdentityCounter);
  return objectIdentityCounter;
}

function getElementDisplayName(object: FabricObject, index: number) {
  if (isTextObject(object)) {
    const value = String(object.get('text') ?? '').trim();
    if (value.length > 0) {
      return `${index + 1}. ${value.slice(0, 24)}`;
    }

    return `${index + 1}. Text`;
  }

  if (isImageObject(object)) {
    return `${index + 1}. Image`;
  }

  if (isPathObject(object)) {
    return `${index + 1}. Drawing`;
  }

  if (object.type === 'group') {
    return `${index + 1}. Group`;
  }

  return `${index + 1}. ${object.type ?? 'Object'}`;
}

export default function PropertiesPanel() {
  const t = useTranslations('properties');
  const { editorMode, propertiesPanelOpen, setPropertiesPanelOpen } = useEditor();
  const { currentPage } = usePdf();
  const {
    activePageNumber,
    selectedObject,
    selectedPageNumber,
    getCanvas,
    setSelectedObject,
    pushHistoryState,
  } = useCanvas();
  const [, setRenderRevision] = useState(0);
  const [objectsRevision, setObjectsRevision] = useState(0);

  const panelPageNumber = selectedPageNumber ?? activePageNumber ?? currentPage;

  const targetCanvas = useMemo(() => {
    if (panelPageNumber === null) {
      return null;
    }

    return getCanvas(panelPageNumber);
  }, [getCanvas, panelPageNumber]);

  useEffect(() => {
    if (editorMode === 'edit' && !propertiesPanelOpen) {
      setPropertiesPanelOpen(true);
    }
  }, [editorMode, propertiesPanelOpen, setPropertiesPanelOpen]);

  useEffect(() => {
    if (!targetCanvas) {
      return;
    }

    const bumpRevision = () => {
      setObjectsRevision((prev) => prev + 1);
    };

    targetCanvas.on('object:added', bumpRevision);
    targetCanvas.on('object:removed', bumpRevision);
    targetCanvas.on('object:modified', bumpRevision);
    targetCanvas.on('selection:created', bumpRevision);
    targetCanvas.on('selection:updated', bumpRevision);
    targetCanvas.on('selection:cleared', bumpRevision);

    return () => {
      targetCanvas.off('object:added', bumpRevision);
      targetCanvas.off('object:removed', bumpRevision);
      targetCanvas.off('object:modified', bumpRevision);
      targetCanvas.off('selection:created', bumpRevision);
      targetCanvas.off('selection:updated', bumpRevision);
      targetCanvas.off('selection:cleared', bumpRevision);
    };
  }, [targetCanvas]);

  void objectsRevision;
  const pageObjects = targetCanvas ? targetCanvas.getObjects() : ([] as FabricObject[]);

  const selectedProfile = useMemo(() => {
    if (!selectedObject) {
      return 'generic';
    }

    return getObjectProfile(selectedObject);
  }, [selectedObject]);

  const selectedObjectKey = useMemo(() => {
    if (!selectedObject) {
      return 'none';
    }

    const identity = getObjectIdentity(selectedObject);
    return `${panelPageNumber ?? 'none'}-${identity}`;
  }, [selectedObject, panelPageNumber]);

  const applyObjectUpdate = (properties: Record<string, string | number | boolean>) => {
    if (!selectedObject || !targetCanvas || panelPageNumber === null) {
      return;
    }

    selectedObject.set(properties);
    selectedObject.setCoords();
    targetCanvas.requestRenderAll();
    pushHistoryState(panelPageNumber, JSON.stringify(targetCanvas.toJSON()));
    setRenderRevision((prev) => prev + 1);
  };

  const selectElementFromList = (object: FabricObject) => {
    if (!targetCanvas || panelPageNumber === null) {
      return;
    }

    targetCanvas.setActiveObject(object);
    targetCanvas.requestRenderAll();
    setSelectedObject(panelPageNumber, object);
  };

  const deleteElementFromList = (object: FabricObject) => {
    if (!targetCanvas || panelPageNumber === null) {
      return;
    }

    targetCanvas.remove(object);
    targetCanvas.discardActiveObject();
    targetCanvas.requestRenderAll();
    setSelectedObject(null, null);
    pushHistoryState(panelPageNumber, JSON.stringify(targetCanvas.toJSON()));
    setRenderRevision((prev) => prev + 1);
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

          {panelPageNumber !== null && (
            <section className="p-3 border-b border-border-subtle">
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
                {t('elementsOnPage')} {panelPageNumber}
              </div>

              {pageObjects.length === 0 ? (
                <div className="mt-2 text-xs text-text-tertiary">{t('noElementsOnPage')}</div>
              ) : (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5 pr-1">
                  {pageObjects.map((object, index) => {
                    const objectId = getObjectIdentity(object);
                    const isActive = selectedObject === object;

                    return (
                      <div
                        key={`${panelPageNumber}-${objectId}`}
                        className={`flex items-center gap-1 rounded border px-1 py-1 ${
                          isActive
                            ? 'border-accent-500 bg-accent-500/10'
                            : 'border-border-subtle bg-surface-700/40'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectElementFromList(object)}
                          className="flex-1 text-left text-xs text-text-secondary hover:text-text-primary truncate px-1"
                        >
                          {getElementDisplayName(object, index)}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteElementFromList(object)}
                          className="h-6 w-6 shrink-0 rounded border border-border-default text-xs text-error hover:bg-surface-600"
                          aria-label={t('deleteElement')}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!selectedObject && (
            <div className="p-4 text-xs text-text-tertiary">{t('noSelection')}</div>
          )}

          {selectedObject && (
            <div key={selectedObjectKey} className="p-3 space-y-4">
              <div className="rounded border border-border-subtle bg-surface-700/50 px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
                  {t('propertyProfile')}
                </div>
                <div className="mt-1 text-xs text-text-primary">
                  {selectedProfile === 'text' && t('profileText')}
                  {selectedProfile === 'draw' && t('profileDraw')}
                  {selectedProfile === 'image' && t('profileImage')}
                  {selectedProfile === 'generic' && t('profileGeneric')}
                </div>
              </div>

              <section className="space-y-3">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary">{t('transformSection')}</div>

                <label className="block text-xs text-text-secondary">
                  {t('position')} X
                  <input
                    type="number"
                    defaultValue={Math.round(selectedObject.left ?? 0)}
                    onChange={(event) => applyObjectUpdate({ left: Number(event.target.value) })}
                    className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                  />
                </label>

                <label className="block text-xs text-text-secondary">
                  {t('position')} Y
                  <input
                    type="number"
                    defaultValue={Math.round(selectedObject.top ?? 0)}
                    onChange={(event) => applyObjectUpdate({ top: Number(event.target.value) })}
                    className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                  />
                </label>

                <label className="block text-xs text-text-secondary">
                  {t('size')} W
                  <input
                    type="number"
                    defaultValue={Math.round(selectedObject.getScaledWidth())}
                    onChange={(event) => {
                      const currentWidth = selectedObject.getScaledWidth() || 1;
                      applyObjectUpdate({
                        scaleX:
                          (Number(event.target.value) / currentWidth) * (selectedObject.scaleX ?? 1),
                      });
                    }}
                    className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                  />
                </label>

                <label className="block text-xs text-text-secondary">
                  {t('size')} H
                  <input
                    type="number"
                    defaultValue={Math.round(selectedObject.getScaledHeight())}
                    onChange={(event) => {
                      const currentHeight = selectedObject.getScaledHeight() || 1;
                      applyObjectUpdate({
                        scaleY:
                          (Number(event.target.value) / currentHeight) * (selectedObject.scaleY ?? 1),
                      });
                    }}
                    className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                  />
                </label>

                <label className="block text-xs text-text-secondary">
                  {t('rotation')}
                  <input
                    type="number"
                    defaultValue={Math.round(selectedObject.angle ?? 0)}
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
                    defaultValue={selectedObject.opacity ?? 1}
                    onChange={(event) => applyObjectUpdate({ opacity: Number(event.target.value) })}
                    className="mt-1 w-full"
                  />
                </label>
              </section>

              {isTextObject(selectedObject) && (
                <section className="space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary">{t('textSection')}</div>

                  <label className="block text-xs text-text-secondary">
                    {t('textContent')}
                    <textarea
                      defaultValue={String(selectedObject.get('text') ?? '')}
                      onChange={(event) => applyObjectUpdate({ text: event.target.value })}
                      className="mt-1 w-full min-h-20 px-2 py-1.5 rounded bg-surface-700 border border-border-default text-text-primary resize-y"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('fontSize')}
                    <input
                      type="number"
                      min={8}
                      defaultValue={Number(selectedObject.get('fontSize') ?? 16)}
                      onChange={(event) => applyObjectUpdate({ fontSize: Number(event.target.value) })}
                      className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('color')}
                    <input
                      type="color"
                      defaultValue={String(selectedObject.get('fill') ?? '#111111')}
                      onChange={(event) => applyObjectUpdate({ fill: event.target.value })}
                      className="mt-1 h-8 w-full rounded border border-border-default bg-transparent p-1"
                    />
                  </label>

                  <label className="block text-xs text-text-secondary">
                    {t('fontFamily')}
                    <input
                      type="text"
                      defaultValue={String(selectedObject.get('fontFamily') ?? 'sans-serif')}
                      onChange={(event) => applyObjectUpdate({ fontFamily: event.target.value })}
                      className="mt-1 w-full h-8 px-2 rounded bg-surface-700 border border-border-default text-text-primary"
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        applyObjectUpdate({
                          fontWeight:
                            selectedObject.get('fontWeight') === 'bold' ? 'normal' : 'bold',
                        })
                      }
                      className={`h-8 px-2 rounded border text-xs transition-colors ${
                        selectedObject.get('fontWeight') === 'bold'
                          ? 'border-accent-500 text-accent-400 bg-accent-500/10'
                          : 'border-border-default text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t('bold')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        applyObjectUpdate({
                          fontStyle:
                            selectedObject.get('fontStyle') === 'italic' ? 'normal' : 'italic',
                        })
                      }
                      className={`h-8 px-2 rounded border text-xs transition-colors ${
                        selectedObject.get('fontStyle') === 'italic'
                          ? 'border-accent-500 text-accent-400 bg-accent-500/10'
                          : 'border-border-default text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t('italic')}
                    </button>
                  </div>
                </section>
              )}

              {isPathObject(selectedObject) && (
                <section className="space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary">{t('drawSection')}</div>

                  <label className="block text-xs text-text-secondary">
                    {t('strokeColor')}
                    <input
                      type="color"
                      defaultValue={String(selectedObject.get('stroke') ?? '#111111')}
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
                      defaultValue={Number(selectedObject.get('strokeWidth') ?? 1)}
                      onChange={(event) => applyObjectUpdate({ strokeWidth: Number(event.target.value) })}
                      className="mt-1 w-full"
                    />
                  </label>
                </section>
              )}

              {isImageObject(selectedObject) && (
                <section className="space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary">{t('imageSection')}</div>

                  <label className="flex items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      defaultChecked={targetCanvas?.uniformScaling ?? true}
                      onChange={(event) => {
                        if (!targetCanvas) {
                          return;
                        }

                        targetCanvas.uniformScaling = event.target.checked;
                        targetCanvas.requestRenderAll();
                        if (selectedPageNumber !== null) {
                          pushHistoryState(selectedPageNumber, JSON.stringify(targetCanvas.toJSON()));
                        }
                      }}
                      className="h-4 w-4 rounded border-border-default"
                    />
                    <span>{t('aspectRatioLock')}</span>
                  </label>
                </section>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
