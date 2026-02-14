'use client';

import { useEffect } from 'react';
import type { Canvas, TPointerEventInfo } from 'fabric';

export function useEraserTool(canvas: Canvas | null, isActive: boolean) {
  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = 'not-allowed';
    canvas.hoverCursor = 'not-allowed';

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (!event.target) {
        return;
      }

      canvas.remove(event.target);
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    };
  }, [canvas, isActive]);
}
