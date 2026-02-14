'use client';

import { useEffect } from 'react';
import { IText, type Canvas, type TPointerEventInfo } from 'fabric';
import type { OcrToolConfig } from '@/types';

type OcrLanguage = OcrToolConfig['language'];

interface TesseractWorkerLike {
  recognize: (
    image: HTMLCanvasElement
  ) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
}

let workerPromise: Promise<TesseractWorkerLike> | null = null;
let workerLanguage: OcrLanguage | null = null;

async function getOcrWorker(language: OcrLanguage): Promise<TesseractWorkerLike> {
  const { createWorker } = await import('tesseract.js');

  if (!workerPromise || workerLanguage !== language) {
    const previousWorkerPromise = workerPromise;

    workerPromise = (async () => {
      if (previousWorkerPromise) {
        try {
          const previousWorker = await previousWorkerPromise;
          await previousWorker.terminate();
        } catch {}
      }

      const worker = await createWorker(language);
      workerLanguage = language;
      return worker as unknown as TesseractWorkerLike;
    })();
  }

  return workerPromise;
}

function getSelectionRect(
  start: { x: number; y: number },
  end: { x: number; y: number }
) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { left, top, width, height };
}

function getPdfCanvasElement(canvas: Canvas): HTMLCanvasElement | null {
  const pageRoot = canvas.upperCanvasEl.closest('[data-page]');
  if (!pageRoot) {
    return null;
  }

  return pageRoot.querySelector<HTMLCanvasElement>('.react-pdf__Page__canvas');
}

function extractRegionCanvas(
  sourceCanvas: HTMLCanvasElement,
  rect: { left: number; top: number; width: number; height: number }
) {
  const sourceBounds = sourceCanvas.getBoundingClientRect();
  if (sourceBounds.width <= 0 || sourceBounds.height <= 0) {
    return null;
  }

  const scaleX = sourceCanvas.width / sourceBounds.width;
  const scaleY = sourceCanvas.height / sourceBounds.height;

  const sourceX = Math.max(0, Math.floor(rect.left * scaleX));
  const sourceY = Math.max(0, Math.floor(rect.top * scaleY));
  const sourceWidth = Math.max(
    1,
    Math.min(sourceCanvas.width - sourceX, Math.ceil(rect.width * scaleX))
  );
  const sourceHeight = Math.max(
    1,
    Math.min(sourceCanvas.height - sourceY, Math.ceil(rect.height * scaleY))
  );

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    return null;
  }

  const regionCanvas = document.createElement('canvas');
  regionCanvas.width = sourceWidth;
  regionCanvas.height = sourceHeight;

  const context = regionCanvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(
    sourceCanvas,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );

  return regionCanvas;
}

function drawSelectionPreview(
  canvas: Canvas,
  rect: { left: number; top: number; width: number; height: number },
  color: string
) {
  const context = canvas.contextTop;
  if (!context) {
    return;
  }

  canvas.clearContext(context);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = `${color}22`;
  context.lineWidth = 1.5;
  context.setLineDash([6, 4]);
  context.strokeRect(rect.left, rect.top, rect.width, rect.height);
  context.fillRect(rect.left, rect.top, rect.width, rect.height);
  context.restore();
}

function clearSelectionPreview(canvas: Canvas) {
  if (!canvas.contextTop) {
    return;
  }

  canvas.clearContext(canvas.contextTop);
}

export function useOcrTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: OcrToolConfig
) {
  const { language, outputFontSize, outputColor, minSelectionSize } = config;

  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.defaultCursor = 'crosshair';

    let startPoint: { x: number; y: number } | null = null;
    let currentPoint: { x: number; y: number } | null = null;
    let isSelecting = false;
    let isProcessing = false;
    let disposed = false;

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (event.target || isProcessing) {
        return;
      }

      startPoint = { x: event.scenePoint.x, y: event.scenePoint.y };
      currentPoint = startPoint;
      isSelecting = true;
      drawSelectionPreview(
        canvas,
        getSelectionRect(startPoint, currentPoint),
        outputColor
      );
    };

    const handleMouseMove = (event: TPointerEventInfo) => {
      if (!isSelecting || !startPoint) {
        return;
      }

      currentPoint = { x: event.scenePoint.x, y: event.scenePoint.y };
      drawSelectionPreview(
        canvas,
        getSelectionRect(startPoint, currentPoint),
        outputColor
      );
    };

    const handleMouseUp = async () => {
      if (!isSelecting || !startPoint || !currentPoint || isProcessing) {
        return;
      }

      isSelecting = false;
      clearSelectionPreview(canvas);

      const selectedRect = getSelectionRect(startPoint, currentPoint);
      startPoint = null;
      currentPoint = null;

      if (
        selectedRect.width < minSelectionSize ||
        selectedRect.height < minSelectionSize
      ) {
        return;
      }

      const sourceCanvas = getPdfCanvasElement(canvas);
      if (!sourceCanvas) {
        return;
      }

      const regionCanvas = extractRegionCanvas(sourceCanvas, selectedRect);
      if (!regionCanvas) {
        return;
      }

      isProcessing = true;
      canvas.defaultCursor = 'progress';

      try {
        const worker = await getOcrWorker(language);
        const { data } = await worker.recognize(regionCanvas);

        if (disposed) {
          return;
        }

        const recognizedText = data.text.trim();
        if (!recognizedText) {
          return;
        }

        const textObject = new IText(recognizedText, {
          left: selectedRect.left,
          top: selectedRect.top,
          width: selectedRect.width,
          fontSize: outputFontSize,
          fill: outputColor,
        });

        canvas.add(textObject);
        canvas.setActiveObject(textObject);
        textObject.enterEditing();
        canvas.requestRenderAll();
      } catch (error) {
        console.error('OCR processing failed:', error);
      } finally {
        isProcessing = false;
        if (!disposed) {
          canvas.defaultCursor = 'crosshair';
        }
      }
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      disposed = true;
      clearSelectionPreview(canvas);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
      canvas.defaultCursor = 'default';
      canvas.selection = true;
      canvas.skipTargetFind = false;
    };
  }, [
    canvas,
    isActive,
    language,
    outputFontSize,
    outputColor,
    minSelectionSize,
  ]);
}
