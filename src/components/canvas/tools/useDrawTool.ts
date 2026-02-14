'use client';

import { useEffect } from 'react';
import { PencilBrush, type Canvas } from 'fabric';
import type { DrawToolConfig } from '@/types';

export function useDrawTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: DrawToolConfig
) {
  useEffect(() => {
    if (!canvas) {
      return;
    }

    if (!isActive) {
      canvas.isDrawingMode = false;
      return;
    }

    const brush = new PencilBrush(canvas);
    brush.width = config.brushSize;
    brush.color = config.color;

    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.skipTargetFind = true;
  }, [canvas, isActive, config.brushSize, config.color]);
}
