'use client';

import { useEffect } from 'react';
import { Group, IText, Line, type Canvas, type TPointerEventInfo } from 'fabric';
import type { MeasureToolConfig } from '@/types';

const MIN_DISTANCE_PIXELS = 6;

function formatMeasureLabel(
  pixelDistance: number,
  pixelsPerUnit: number,
  unitLabel: string
) {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) {
    return `${pixelDistance.toFixed(1)} px`;
  }

  const distance = pixelDistance / pixelsPerUnit;
  return `${distance.toFixed(2)} ${unitLabel}`;
}

function drawPreview(
  canvas: Canvas,
  start: { x: number; y: number },
  end: { x: number; y: number },
  color: string,
  lineWidth: number,
  pixelsPerUnit: number,
  unitLabel: string
) {
  const context = canvas.contextTop;
  if (!context) {
    return;
  }

  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  const pixelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const label = formatMeasureLabel(
    pixelDistance,
    pixelsPerUnit,
    unitLabel
  );
  const middleX = (start.x + end.x) / 2;
  const middleY = (start.y + end.y) / 2;

  canvas.clearContext(context);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = color;
  context.lineWidth = lineWidth;
  context.setLineDash([7, 4]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  context.setLineDash([]);
  context.font = '12px sans-serif';
  context.fillText(label, middleX + 8, middleY - 6);
  context.restore();
}

function clearPreview(canvas: Canvas) {
  if (!canvas.contextTop) {
    return;
  }

  canvas.clearContext(canvas.contextTop);
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

function isShiftPressed(event: TPointerEventInfo) {
  const nativeEvent = event.e as MouseEvent | PointerEvent | KeyboardEvent | undefined;
  return Boolean(nativeEvent?.shiftKey);
}

function getConstrainedPoint(
  start: { x: number; y: number },
  target: { x: number; y: number },
  constrained: boolean
) {
  if (!constrained) {
    return target;
  }

  const deltaX = target.x - start.x;
  const deltaY = target.y - start.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance <= 0) {
    return target;
  }

  const step = Math.PI / 4;
  const angle = Math.atan2(deltaY, deltaX);
  const snappedAngle = Math.round(angle / step) * step;

  return {
    x: start.x + Math.cos(snappedAngle) * distance,
    y: start.y + Math.sin(snappedAngle) * distance,
  };
}

export function useMeasureTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: MeasureToolConfig,
  currentScale: number,
  onCalibrated: (pixelsPerUnit: number, calibrationScale: number) => void
) {
  const {
    color,
    lineWidth,
    unitLabel,
    pixelsPerUnit,
    calibrationScale,
    isCalibrated,
  } = config;

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

    const createMeasurement = (
      fromPoint: { x: number; y: number },
      toPoint: { x: number; y: number }
    ) => {
      const deltaX = toPoint.x - fromPoint.x;
      const deltaY = toPoint.y - fromPoint.y;
      const pixelDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (pixelDistance < MIN_DISTANCE_PIXELS) {
        return false;
      }

      let effectivePixelsPerUnit = getEffectivePixelsPerUnit(
        pixelsPerUnit,
        calibrationScale,
        currentScale
      );

      if (!isCalibrated) {
        const input = window.prompt(
          `Calibration: real distance of this line (${unitLabel})`,
          '10'
        );

        if (!input) {
          return false;
        }

        const actualDistance = Number(input.trim().replace(',', '.'));
        if (!Number.isFinite(actualDistance) || actualDistance <= 0) {
          return false;
        }

        effectivePixelsPerUnit = pixelDistance / actualDistance;
        onCalibrated(effectivePixelsPerUnit, currentScale);
      }

      const middleX = (fromPoint.x + toPoint.x) / 2;
      const middleY = (fromPoint.y + toPoint.y) / 2;
      const baseDx = toPoint.x - fromPoint.x;
      const baseDy = toPoint.y - fromPoint.y;

      const line = new Line(
        [fromPoint.x, fromPoint.y, toPoint.x, toPoint.y],
        {
          stroke: color,
          strokeWidth: lineWidth,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );

      const label = new IText(
        formatMeasureLabel(pixelDistance, effectivePixelsPerUnit, unitLabel),
        {
          left: middleX + 8,
          top: middleY - 8,
          fontSize: 14,
          fill: color,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );

      const measurement = new Group([line, label], {
        objectCaching: false,
        selectable: true,
        evented: true,
        lockSkewingX: true,
        lockSkewingY: true,
        lockRotation: true,
      });

      (
        measurement as Group & {
          data?: { measurementType: 'distance'; baseDx: number; baseDy: number };
        }
      ).data = {
        measurementType: 'distance',
        baseDx,
        baseDy,
      };

      canvas.add(measurement);
      canvas.setActiveObject(measurement);
      canvas.requestRenderAll();
      return true;
    };

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (event.target) {
        return;
      }

      const clickedPoint = { x: event.scenePoint.x, y: event.scenePoint.y };

      if (!startPoint) {
        startPoint = clickedPoint;
        currentPoint = clickedPoint;
        drawPreview(
          canvas,
          startPoint,
          currentPoint,
          color,
          lineWidth,
          getEffectivePixelsPerUnit(pixelsPerUnit, calibrationScale, currentScale),
          unitLabel
        );
        return;
      }

      clearPreview(canvas);

      const constrainedPoint = getConstrainedPoint(
        startPoint,
        clickedPoint,
        isShiftPressed(event)
      );

      const created = createMeasurement(startPoint, constrainedPoint);
      if (created) {
        startPoint = null;
        currentPoint = null;
        return;
      }

      startPoint = clickedPoint;
      currentPoint = clickedPoint;
      drawPreview(
        canvas,
        startPoint,
        currentPoint,
        color,
        lineWidth,
        getEffectivePixelsPerUnit(pixelsPerUnit, calibrationScale, currentScale),
        unitLabel
      );
    };

    const handleMouseMove = (event: TPointerEventInfo) => {
      if (!startPoint) {
        return;
      }

      currentPoint = getConstrainedPoint(
        startPoint,
        { x: event.scenePoint.x, y: event.scenePoint.y },
        isShiftPressed(event)
      );
      drawPreview(
        canvas,
        startPoint,
        currentPoint,
        color,
        lineWidth,
        getEffectivePixelsPerUnit(pixelsPerUnit, calibrationScale, currentScale),
        unitLabel
      );
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);

    return () => {
      clearPreview(canvas);
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.defaultCursor = 'default';
      canvas.selection = true;
      canvas.skipTargetFind = false;
    };
  }, [
    canvas,
    isActive,
    color,
    lineWidth,
    unitLabel,
    pixelsPerUnit,
    calibrationScale,
    isCalibrated,
    currentScale,
    onCalibrated,
  ]);
}
