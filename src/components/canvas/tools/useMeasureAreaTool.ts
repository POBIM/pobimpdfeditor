'use client';

import { useEffect } from 'react';
import {
  Color,
  Group,
  IText,
  Path,
  Rect,
  type Canvas,
  type TPointerEventInfo,
} from 'fabric';
import type { AreaMeasureToolConfig, MeasureToolConfig } from '@/types';

const MIN_SIDE_PIXELS = 6;
const MIN_POLYGON_AREA_PIXELS = 24;
const CLOSE_THRESHOLD_PIXELS = 10;

type Point = { x: number; y: number };

function toFillColor(color: string, opacity: number) {
  const parsed = new Color(color);
  parsed.setAlpha(opacity);
  return parsed.toRgba();
}

function getSelectionBox(start: Point, end: Point) {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return { left, top, width, height };
}

function computePolygonArea(points: Point[]) {
  if (points.length < 3) {
    return 0;
  }

  let twiceArea = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    twiceArea += current.x * next.y - next.x * current.y;
  }

  return Math.abs(twiceArea) / 2;
}

function computePolygonCentroid(points: Point[]) {
  if (points.length < 3) {
    const fallback = points[0] ?? { x: 0, y: 0 };
    return { x: fallback.x, y: fallback.y };
  }

  let cx = 0;
  let cy = 0;
  let factor = 0;

  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const cross = current.x * next.y - next.x * current.y;
    factor += cross;
    cx += (current.x + next.x) * cross;
    cy += (current.y + next.y) * cross;
  }

  if (Math.abs(factor) < 1e-6) {
    const avgX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const avgY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    return { x: avgX, y: avgY };
  }

  return {
    x: cx / (3 * factor),
    y: cy / (3 * factor),
  };
}

function formatAreaLabel(
  areaPixels: number,
  pixelsPerUnit: number,
  unitLabel: string
) {
  if (!Number.isFinite(pixelsPerUnit) || pixelsPerUnit <= 0) {
    return `${areaPixels.toFixed(1)} px²`;
  }

  const area = areaPixels / (pixelsPerUnit * pixelsPerUnit);
  return `${area.toFixed(2)} ${unitLabel}²`;
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

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function polygonPath(points: Point[]) {
  const segments = points.map((point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command} ${point.x} ${point.y}`;
  });

  return `${segments.join(' ')} Z`;
}

function clearPreview(canvas: Canvas) {
  if (!canvas.contextTop) {
    return;
  }

  canvas.clearContext(canvas.contextTop);
}

function drawRectanglePreview(
  canvas: Canvas,
  start: Point,
  end: Point,
  color: string,
  lineWidth: number,
  fillOpacity: number,
  pixelsPerUnit: number,
  unitLabel: string
) {
  const context = canvas.contextTop;
  if (!context) {
    return;
  }

  const box = getSelectionBox(start, end);

  clearPreview(canvas);
  context.save();
  context.strokeStyle = color;
  context.fillStyle = toFillColor(color, fillOpacity);
  context.lineWidth = lineWidth;
  context.setLineDash([7, 4]);
  context.strokeRect(box.left, box.top, box.width, box.height);
  context.fillRect(box.left, box.top, box.width, box.height);
  context.setLineDash([]);
  context.fillStyle = color;
  context.font = '12px sans-serif';
  context.fillText(
    formatAreaLabel(box.width * box.height, pixelsPerUnit, unitLabel),
    box.left + 8,
    Math.max(14, box.top - 6)
  );
  context.restore();
}

function drawPolygonPreview(
  canvas: Canvas,
  points: Point[],
  hoverPoint: Point | null,
  color: string,
  lineWidth: number,
  fillOpacity: number,
  pixelsPerUnit: number,
  unitLabel: string
) {
  const context = canvas.contextTop;
  if (!context) {
    return;
  }

  clearPreview(canvas);
  if (points.length === 0) {
    return;
  }

  const previewPoints = hoverPoint ? [...points, hoverPoint] : [...points];

  context.save();
  context.strokeStyle = color;
  context.fillStyle = toFillColor(color, fillOpacity);
  context.lineWidth = lineWidth;
  context.setLineDash([7, 4]);

  context.beginPath();
  context.moveTo(previewPoints[0].x, previewPoints[0].y);
  for (let i = 1; i < previewPoints.length; i += 1) {
    context.lineTo(previewPoints[i].x, previewPoints[i].y);
  }

  if (previewPoints.length >= 3) {
    context.closePath();
    context.fill();
  }

  context.stroke();
  context.setLineDash([]);

  if (previewPoints.length >= 3) {
    const areaPixels = computePolygonArea(previewPoints);
    const centroid = computePolygonCentroid(previewPoints);
    context.fillStyle = color;
    context.font = '12px sans-serif';
    context.fillText(
      formatAreaLabel(areaPixels, pixelsPerUnit, unitLabel),
      centroid.x + 8,
      centroid.y - 8
    );
  }

  context.restore();
}

function createMeasurementGroup(
  canvas: Canvas,
  elements: Array<Rect | Path | IText>,
  measurementType: 'area-rectangle' | 'area-polygon',
  baseAreaPixels: number,
  placement?: {
    left: number;
    top: number;
    originX: 'left';
    originY: 'top';
  }
) {
  const group = new Group(elements, {
    objectCaching: false,
    selectable: true,
    evented: true,
    lockSkewingX: true,
    lockSkewingY: true,
    lockRotation: true,
    ...placement,
  });

  (
    group as Group & {
      data?: {
        measurementType: 'area-rectangle' | 'area-polygon';
        baseAreaPixels: number;
      };
    }
  ).data = {
    measurementType,
    baseAreaPixels,
  };

  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
}

export function useMeasureAreaTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: AreaMeasureToolConfig,
  measureConfig: MeasureToolConfig,
  currentScale: number
) {
  const { color, lineWidth, fillOpacity, mode } = config;
  const { pixelsPerUnit, calibrationScale, unitLabel } = measureConfig;

  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.defaultCursor = 'crosshair';

    let rectangleStart: Point | null = null;
    let rectangleCurrent: Point | null = null;
    let polygonPoints: Point[] = [];
    let polygonHover: Point | null = null;
    const effectivePixelsPerUnit = getEffectivePixelsPerUnit(
      pixelsPerUnit,
      calibrationScale,
      currentScale
    );

    const createRectangleMeasurement = (fromPoint: Point, toPoint: Point) => {
      const box = getSelectionBox(fromPoint, toPoint);
      if (box.width < MIN_SIDE_PIXELS || box.height < MIN_SIDE_PIXELS) {
        return false;
      }

      const areaPixels = box.width * box.height;
      const areaRect = new Rect({
        left: 0,
        top: 0,
        width: box.width,
        height: box.height,
        stroke: color,
        strokeWidth: lineWidth,
        fill: toFillColor(color, fillOpacity),
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const label = new IText(
        formatAreaLabel(areaPixels, effectivePixelsPerUnit, unitLabel),
        {
          left: 8,
          top: Math.max(8, box.top - 18) - box.top,
          fontSize: 14,
          fill: color,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );

      createMeasurementGroup(
        canvas,
        [areaRect, label],
        'area-rectangle',
        areaPixels,
        {
          left: box.left,
          top: box.top,
          originX: 'left',
          originY: 'top',
        }
      );
      return true;
    };

    const createPolygonMeasurement = (points: Point[]) => {
      const areaPixels = computePolygonArea(points);
      if (areaPixels < MIN_POLYGON_AREA_PIXELS) {
        return false;
      }

      const path = new Path(polygonPath(points), {
        stroke: color,
        strokeWidth: lineWidth,
        fill: toFillColor(color, fillOpacity),
        selectable: false,
        evented: false,
        objectCaching: false,
      });

      const centroid = computePolygonCentroid(points);
      const label = new IText(
        formatAreaLabel(areaPixels, effectivePixelsPerUnit, unitLabel),
        {
          left: centroid.x + 8,
          top: centroid.y - 8,
          fontSize: 14,
          fill: color,
          selectable: false,
          evented: false,
          objectCaching: false,
        }
      );

      createMeasurementGroup(canvas, [path, label], 'area-polygon', areaPixels);
      return true;
    };

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (event.target) {
        return;
      }

      const point = { x: event.scenePoint.x, y: event.scenePoint.y };

      if (mode === 'polygon') {
        if (polygonPoints.length === 0) {
          polygonPoints = [point];
          polygonHover = point;
          drawPolygonPreview(
            canvas,
            polygonPoints,
            polygonHover,
            color,
            lineWidth,
            fillOpacity,
            effectivePixelsPerUnit,
            unitLabel
          );
          return;
        }

        const firstPoint = polygonPoints[0];
        if (
          polygonPoints.length >= 3 &&
          distance(point, firstPoint) <= CLOSE_THRESHOLD_PIXELS
        ) {
          clearPreview(canvas);
          const created = createPolygonMeasurement(polygonPoints);
          if (created) {
            polygonPoints = [];
            polygonHover = null;
            return;
          }
        }

        polygonPoints = [...polygonPoints, point];
        polygonHover = point;
        drawPolygonPreview(
          canvas,
          polygonPoints,
          polygonHover,
          color,
          lineWidth,
          fillOpacity,
          effectivePixelsPerUnit,
          unitLabel
        );
        return;
      }

      if (!rectangleStart) {
        rectangleStart = point;
        rectangleCurrent = point;
        drawRectanglePreview(
          canvas,
          rectangleStart,
          rectangleCurrent,
          color,
          lineWidth,
          fillOpacity,
          effectivePixelsPerUnit,
          unitLabel
        );
        return;
      }

      clearPreview(canvas);

      const created = createRectangleMeasurement(rectangleStart, point);
      if (created) {
        rectangleStart = null;
        rectangleCurrent = null;
        return;
      }

      rectangleStart = point;
      rectangleCurrent = point;
      drawRectanglePreview(
        canvas,
        rectangleStart,
        rectangleCurrent,
        color,
        lineWidth,
        fillOpacity,
        effectivePixelsPerUnit,
        unitLabel
      );
    };

    const handleMouseMove = (event: TPointerEventInfo) => {
      const point = { x: event.scenePoint.x, y: event.scenePoint.y };

      if (mode === 'polygon') {
        if (polygonPoints.length === 0) {
          return;
        }

        polygonHover = point;
        drawPolygonPreview(
          canvas,
          polygonPoints,
          polygonHover,
          color,
          lineWidth,
          fillOpacity,
          effectivePixelsPerUnit,
          unitLabel
        );
        return;
      }

      if (!rectangleStart) {
        return;
      }

      rectangleCurrent = point;
      drawRectanglePreview(
        canvas,
        rectangleStart,
        rectangleCurrent,
        color,
        lineWidth,
        fillOpacity,
        effectivePixelsPerUnit,
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
    fillOpacity,
    mode,
    pixelsPerUnit,
    calibrationScale,
    unitLabel,
    currentScale,
  ]);
}
