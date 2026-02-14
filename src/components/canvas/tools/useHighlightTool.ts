'use client';

import { useEffect } from 'react';
import { Color, PencilBrush, type Canvas } from 'fabric';
import type { HighlightToolConfig } from '@/types';

function getHighlightColor(color: string, opacity: number) {
  const parsedColor = new Color(color);
  parsedColor.setAlpha(opacity);
  return parsedColor.toRgba();
}

export function useHighlightTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: HighlightToolConfig
) {
  useEffect(() => {
    if (!canvas) {
      return;
    }

    if (!isActive) {
      if (!canvas.isDrawingMode) {
        return;
      }

      canvas.isDrawingMode = false;
      return;
    }

    const brush = new PencilBrush(canvas);
    brush.width = config.brushSize;
    brush.color = getHighlightColor(config.color, config.opacity);

    canvas.freeDrawingBrush = brush;
    canvas.isDrawingMode = true;
    canvas.selection = false;
    canvas.skipTargetFind = true;
  }, [canvas, isActive, config.brushSize, config.color, config.opacity]);
}
