'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Canvas, Group, IText, type TPointerEventInfo } from 'fabric';
import { useEditor } from '@/store/EditorContext';
import { getEmptyCanvasState, useCanvas } from '@/store/CanvasContext';
import { useSelectTool } from '@/components/canvas/tools/useSelectTool';
import { useTextTool } from '@/components/canvas/tools/useTextTool';
import { useDrawTool } from '@/components/canvas/tools/useDrawTool';
import { useHighlightTool } from '@/components/canvas/tools/useHighlightTool';
import { useMeasureTool } from '@/components/canvas/tools/useMeasureTool';
import { useMeasureAreaTool } from '@/components/canvas/tools/useMeasureAreaTool';
import { useOcrTool } from '@/components/canvas/tools/useOcrTool';
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

function getEffectivePixelsPerUnit(
  pixelsPerUnit: number,
  calibrationScale: number,
  currentScale: number
) {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) {
    return pixelsPerUnit;
  }

  if (!Number.isFinite(calibrationScale) || calibrationScale <= 0) {
    return pixelsPerUnit;
  }

  return pixelsPerUnit * (currentScale / calibrationScale);
}

function formatDistanceLabel(pixelDistance: number, pixelsPerUnit: number, unitLabel: string) {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) {
    return `${pixelDistance.toFixed(1)} px`;
  }

  return `${(pixelDistance / pixelsPerUnit).toFixed(2)} ${unitLabel}`;
}

function formatAreaLabel(areaPixels: number, pixelsPerUnit: number, unitLabel: string) {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) {
    return `${areaPixels.toFixed(1)} px²`;
  }

  const area = areaPixels / (pixelsPerUnit * pixelsPerUnit);
  return `${area.toFixed(2)} ${unitLabel}²`;
}

export default function FabricCanvas({
  pageNumber,
  width,
  height,
  scale,
  isEditable,
}: FabricCanvasProps) {
  const { activeTool, toolConfig, setToolConfig, setPropertiesPanelOpen } = useEditor();
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
  const measureConfigRef = useRef({
    pixelsPerUnit: toolConfig.measure.pixelsPerUnit,
    calibrationScale: toolConfig.measure.calibrationScale,
    unitLabel: toolConfig.measure.unitLabel,
  });
  const scaleRef = useRef(scale);

  useEffect(() => {
    measureConfigRef.current = {
      pixelsPerUnit: toolConfig.measure.pixelsPerUnit,
      calibrationScale: toolConfig.measure.calibrationScale,
      unitLabel: toolConfig.measure.unitLabel,
    };
  }, [
    toolConfig.measure.pixelsPerUnit,
    toolConfig.measure.calibrationScale,
    toolConfig.measure.unitLabel,
  ]);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

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
      if (isEditable) {
        setPropertiesPanelOpen(true);
      }
    };

    const handleSelectionCleared = () => {
      setSelectedObject(null, null);
      if (isEditable) {
        setPropertiesPanelOpen(true);
      }
    };

    const syncState = () => {
      if (isRestoringRef.current) {
        return;
      }

      pushHistoryState(pageNumber, serializeCanvas(canvas));
    };

    const updateMeasurementLabel = (target: unknown) => {
      if (!(target instanceof Group)) {
        return;
      }

      const data = (
        target as Group & {
          data?: {
            measurementType?: 'distance' | 'area-rectangle' | 'area-polygon';
            baseDx?: number;
            baseDy?: number;
            baseAreaPixels?: number;
          };
        }
      ).data;

      if (!data?.measurementType) {
        return;
      }

      const objects = target.getObjects();
      const label = objects.find((object) => object instanceof IText) as IText | undefined;
      if (!label) {
        return;
      }

      const effectivePixelsPerUnit = getEffectivePixelsPerUnit(
        measureConfigRef.current.pixelsPerUnit,
        measureConfigRef.current.calibrationScale,
        scaleRef.current
      );

      if (data.measurementType === 'distance') {
        const baseDx = Number(data.baseDx ?? 0);
        const baseDy = Number(data.baseDy ?? 0);
        const scaleX = Math.abs(target.scaleX ?? 1);
        const scaleY = Math.abs(target.scaleY ?? 1);
        const pixelDistance = Math.sqrt(
          baseDx * baseDx * scaleX * scaleX +
          baseDy * baseDy * scaleY * scaleY
        );

        label.set(
          'text',
          formatDistanceLabel(
            pixelDistance,
            effectivePixelsPerUnit,
            measureConfigRef.current.unitLabel
          )
        );
      }

      if (
        data.measurementType === 'area-rectangle' ||
        data.measurementType === 'area-polygon'
      ) {
        const baseAreaPixels = Number(data.baseAreaPixels ?? 0);
        const scaleX = Math.abs(target.scaleX ?? 1);
        const scaleY = Math.abs(target.scaleY ?? 1);
        const areaPixels = baseAreaPixels * scaleX * scaleY;

        label.set(
          'text',
          formatAreaLabel(
            areaPixels,
            effectivePixelsPerUnit,
            measureConfigRef.current.unitLabel
          )
        );
      }
    };

    const handleObjectAdded = () => {
      syncState();
    };

    const handleObjectModified = (event: { target?: unknown }) => {
      updateMeasurementLabel(event.target);
      syncState();
    };

    const handleObjectScaling = (event: { target?: unknown }) => {
      updateMeasurementLabel(event.target);
      canvas.requestRenderAll();
    };

    const handleObjectRemoved = () => {
      syncState();
    };

    canvas.on('mouse:down', handlePointerDown);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionCreated);
    canvas.on('selection:cleared', handleSelectionCleared);
    canvas.on('object:added', handleObjectAdded);
    canvas.on('object:modified', handleObjectModified);
    canvas.on('object:scaling', handleObjectScaling);
    canvas.on('object:removed', handleObjectRemoved);

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
      canvas.off('object:added', handleObjectAdded);
      canvas.off('object:modified', handleObjectModified);
      canvas.off('object:scaling', handleObjectScaling);
      canvas.off('object:removed', handleObjectRemoved);
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
    isEditable,
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

  const handleMeasureCalibrated = useCallback(
    (nextPixelsPerUnit: number, nextCalibrationScale: number) => {
      setToolConfig('measure', {
        pixelsPerUnit: nextPixelsPerUnit,
        calibrationScale: nextCalibrationScale,
        isCalibrated: true,
      });
    },
    [setToolConfig]
  );

  useSelectTool(fabricRef.current, isEditable && activeTool === 'select');
  useTextTool(fabricRef.current, isEditable && activeTool === 'text', toolConfig.text);
  useDrawTool(fabricRef.current, isEditable && activeTool === 'draw', toolConfig.draw);
  useHighlightTool(
    fabricRef.current,
    isEditable && activeTool === 'highlight',
    toolConfig.highlight
  );
  useMeasureTool(
    fabricRef.current,
    isEditable && activeTool === 'measure',
    toolConfig.measure,
    scale,
    handleMeasureCalibrated
  );
  useMeasureAreaTool(
    fabricRef.current,
    isEditable && activeTool === 'measureArea',
    toolConfig.measureArea,
    toolConfig.measure,
    scale
  );
  useOcrTool(fabricRef.current, isEditable && activeTool === 'ocr', toolConfig.ocr);
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
