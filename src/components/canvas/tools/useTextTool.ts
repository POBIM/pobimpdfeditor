'use client';

import { useEffect } from 'react';
import { IText, type Canvas, type TPointerEventInfo } from 'fabric';
import type { TextToolConfig } from '@/types';

export function useTextTool(
  canvas: Canvas | null,
  isActive: boolean,
  config: TextToolConfig
) {
  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = false;
    canvas.defaultCursor = 'text';

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (event.target) {
        return;
      }

      const textObject = new IText('Text', {
        left: event.scenePoint.x,
        top: event.scenePoint.y,
        fontSize: config.fontSize,
        fill: config.color,
        fontWeight: config.bold ? 'bold' : 'normal',
        fontStyle: config.italic ? 'italic' : 'normal',
      });

      canvas.add(textObject);
      canvas.setActiveObject(textObject);
      textObject.enterEditing();
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.defaultCursor = 'default';
      canvas.selection = true;
    };
  }, [canvas, isActive, config.fontSize, config.color, config.bold, config.italic]);
}
