'use client';

import { useEffect } from 'react';
import type { Canvas } from 'fabric';

export function useSelectTool(canvas: Canvas | null, isActive: boolean) {
  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = true;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = 'default';
    canvas.hoverCursor = 'move';
    canvas.requestRenderAll();

    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) {
        return;
      }

      activeObjects.forEach((object) => {
        canvas.remove(object);
      });
      canvas.discardActiveObject();
      canvas.requestRenderAll();
    };

    window.addEventListener('keydown', handleDelete);

    return () => {
      window.removeEventListener('keydown', handleDelete);
    };
  }, [canvas, isActive]);
}
