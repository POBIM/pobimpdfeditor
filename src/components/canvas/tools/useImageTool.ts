'use client';

import { useEffect } from 'react';
import { FabricImage, type Canvas, type TPointerEventInfo } from 'fabric';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/jpg,image/svg+xml';

async function addImageToCanvas(
  canvas: Canvas,
  point: { x: number; y: number },
  file: File
) {
  const imageUrl = URL.createObjectURL(file);

  try {
    const image = await FabricImage.fromURL(imageUrl);
    const maxWidth = canvas.getWidth() * 0.8;
    const maxHeight = canvas.getHeight() * 0.8;
    const imageWidth = image.width ?? maxWidth;
    const imageHeight = image.height ?? maxHeight;
    const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);

    image.set({
      left: point.x,
      top: point.y,
      originX: 'center',
      originY: 'center',
      scaleX: ratio,
      scaleY: ratio,
    });

    canvas.add(image);
    canvas.setActiveObject(image);
    canvas.requestRenderAll();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function useImageTool(canvas: Canvas | null, isActive: boolean) {
  useEffect(() => {
    if (!canvas || !isActive) {
      return;
    }

    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.skipTargetFind = true;
    canvas.defaultCursor = 'copy';

    const handleMouseDown = (event: TPointerEventInfo) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = ACCEPTED_TYPES;

      fileInput.onchange = async () => {
        const selectedFile = fileInput.files?.[0];
        if (!selectedFile) {
          return;
        }

        await addImageToCanvas(canvas, event.scenePoint, selectedFile);
      };

      fileInput.click();
    };

    canvas.on('mouse:down', handleMouseDown);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.defaultCursor = 'default';
    };
  }, [canvas, isActive]);
}
