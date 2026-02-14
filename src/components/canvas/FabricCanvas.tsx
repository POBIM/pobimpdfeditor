'use client';

import { useEffect, useRef } from 'react';
import { Canvas, type TPointerEventInfo } from 'fabric';
import { useEditor } from '@/store/EditorContext';
import { getEmptyCanvasState, useCanvas } from '@/store/CanvasContext';
import { useSelectTool } from '@/components/canvas/tools/useSelectTool';
import { useTextTool } from '@/components/canvas/tools/useTextTool';
import { useDrawTool } from '@/components/canvas/tools/useDrawTool';
import { useHighlightTool } from '@/components/canvas/tools/useHighlightTool';
import { useImageTool } from '@/components/canvas/tools/useImageTool';
import { useEraserTool } from '@/components/canvas/tools/useEraserTool';

interface FabricCanvasProps {
  pageNumber: number;
  width: number;
  height: number;
  scale: number;
  isEditable: boolean;
}

function scaleCanvasObjects(canvas: Canvas, oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) {
  if (oldWidth <= 0 || oldHeight <= 0 || newWidth <= 0 || newHeight <= 0) {
    return;
  }

  const ratioX = newWidth / oldWidth;
  const ratioY = newHeight / oldHeight;

  canvas.getObjects().forEach((object) => {
    object.set({
      left: (object.left ?? 0) * ratioX,
      top: (object.top ?? 0) * ratioY,
      scaleX: (object.scaleX ?? 1) * ratioX,
      scaleY: (object.scaleY ?? 1) * ratioY,
    });
    object.setCoords();
  });
}

function serializeCanvas(canvas: Canvas) {
  return JSON.stringify(canvas.toJSON());
}

export default function FabricCanvas({
  pageNumber,
  width,
  height,
  scale,
  isEditable,
}: FabricCanvasProps) {
  const { activeTool, toolConfig, setPropertiesPanelOpen } = useEditor();
  const {
    registerCanvas,
    unregisterCanvas,
    getCanvas,
    setActiveCanvas,
    setSelectedObject,
    pushHistoryState,
    initializePageHistory,
    getPageSerializedState,
    restoreRequest,
    setLastPointer,
    openSignaturePad,
  } = useCanvas();
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const isRestoringRef = useRef(false);
  const previousSizeRef = useRef<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!canvasElementRef.current) {
      return;
    }

    let cancelled = false;

    const canvas = new Canvas(canvasElementRef.current, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: undefined,
    });

    fabricRef.current = canvas;
    previousSizeRef.current = { width: canvas.getWidth(), height: canvas.getHeight() };
    registerCanvas(pageNumber, canvas);
    const initialState = getPageSerializedState(pageNumber) ?? getEmptyCanvasState();
    initializePageHistory(pageNumber, initialState);

    const handlePointerDown = (event: TPointerEventInfo) => {
      setActiveCanvas(pageNumber);
      setLastPointer(pageNumber, { x: event.scenePoint.x, y: event.scenePoint.y });
    };

    const handleSelectionCreated = () => {
      const selected = canvas.getActiveObject();
      setSelectedObject(pageNumber, selected ?? null);
      setPropertiesPanelOpen(Boolean(selected));
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null, null);
      setPropertiesPanelOpen(false);
    };

    const syncState = () => {
      if (isRestoringRef.current) {
        return;
      }

      pushHistoryState(pageNumber, serializeCanvas(canvas));
    };

    canvas.on('mouse:down', handlePointerDown);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:added', syncState);
    canvas.on('object:modified', syncState);
    canvas.on('object:removed', syncState);

    if (initialState !== getEmptyCanvasState()) {
      const restoreInitialState = async () => {
        isRestoringRef.current = true;

        try {
          await canvas.loadFromJSON(initialState);

          if (cancelled || fabricRef.current !== canvas) {
            return;
          }

          canvas.requestRenderAll();
        } catch (error) {
          if (!cancelled && fabricRef.current === canvas) {
            console.error('Failed to restore initial canvas state:', error);
          }
        } finally {
          isRestoringRef.current = false;
        }
      };

      void restoreInitialState();
    }

    return () => {
      cancelled = true;
      canvas.off('mouse:down', handlePointerDown);
      canvas.off('selection:created', handleSelectionCreated);
      canvas.off('selection:updated', handleSelectionCreated);
      canvas.off('selection:cleared', handleSelectionCleared);
      canvas.off('object:added', syncState);
      canvas.off('object:modified', syncState);
      canvas.off('object:removed', syncState);
      isRestoringRef.current = false;
      setSelectedObject(null, null);
      unregisterCanvas(pageNumber);
      canvas.dispose();
      fabricRef.current = null;
      previousSizeRef.current = null;
    };
  }, [
    pageNumber,
    registerCanvas,
    unregisterCanvas,
    setActiveCanvas,
    setSelectedObject,
    setPropertiesPanelOpen,
    setLastPointer,
    pushHistoryState,
    initializePageHistory,
    getPageSerializedState,
  ]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || width <= 0 || height <= 0) {
      return;
    }

    void scale;

    const previousSize = previousSizeRef.current;

    if (previousSize && (previousSize.width !== width || previousSize.height !== height)) {
      scaleCanvasObjects(canvas, previousSize.width, previousSize.height, width, height);
      canvas.setDimensions({ width, height });
      canvas.requestRenderAll();
      previousSizeRef.current = { width, height };
      pushHistoryState(pageNumber, serializeCanvas(canvas));
      return;
    }

    canvas.setDimensions({ width, height });
    canvas.requestRenderAll();
    previousSizeRef.current = { width, height };
  }, [pageNumber, width, height, scale, pushHistoryState]);

  useEffect(() => {
    const canvas = fabricRef.current;

    if (!canvas || !restoreRequest || restoreRequest.pageNumber !== pageNumber) {
      return;
    }

    let cancelled = false;

    const restoreState = async () => {
      isRestoringRef.current = true;

      try {
        await canvas.loadFromJSON(restoreRequest.serializedState);

        if (cancelled || fabricRef.current !== canvas) {
          return;
        }

        canvas.discardActiveObject();
        canvas.requestRenderAll();
        setSelectedObject(null, null);
      } catch (error) {
        if (!cancelled && fabricRef.current === canvas) {
          console.error('Failed to restore canvas history state:', error);
        }
      } finally {
        isRestoringRef.current = false;
      }
    };

    void restoreState();

    return () => {
      cancelled = true;
      isRestoringRef.current = false;
    };
  }, [restoreRequest, pageNumber, setSelectedObject]);

  useEffect(() => {
    const canvas = getCanvas(pageNumber);
    if (!canvas || !isEditable || activeTool !== 'signature') {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.defaultCursor = 'crosshair';

    const handleSignaturePlacement = (event: TPointerEventInfo) => {
      openSignaturePad(pageNumber, { x: event.scenePoint.x, y: event.scenePoint.y });
    };

    canvas.on('mouse:down', handleSignaturePlacement);

    return () => {
      canvas.off('mouse:down', handleSignaturePlacement);
      canvas.defaultCursor = 'default';
    };
  }, [pageNumber, isEditable, activeTool, getCanvas, openSignaturePad]);

  useSelectTool(fabricRef.current, isEditable && activeTool === 'select');
  useTextTool(fabricRef.current, isEditable && activeTool === 'text', toolConfig.text);
  useDrawTool(fabricRef.current, isEditable && activeTool === 'draw', toolConfig.draw);
  useHighlightTool(
    fabricRef.current,
    isEditable && activeTool === 'highlight',
    toolConfig.highlight
  );
  useImageTool(fabricRef.current, isEditable && activeTool === 'image');
  useEraserTool(fabricRef.current, isEditable && activeTool === 'eraser');

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) {
      return;
    }

    const pointerEvents =
      !isEditable ? 'none' : 'auto';

    canvas.lowerCanvasEl.style.pointerEvents = pointerEvents;
    canvas.upperCanvasEl.style.pointerEvents = pointerEvents;
  }, [isEditable]);

  return (
    <canvas
      ref={canvasElementRef}
      width={Math.max(1, Math.round(width))}
      height={Math.max(1, Math.round(height))}
      className="h-full w-full"
    />
  );
}
