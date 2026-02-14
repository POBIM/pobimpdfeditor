'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Button from '@/components/ui/Button';
import { useCanvas } from '@/store/CanvasContext';

export default function SignaturePad() {
  const t = useTranslations('signature');
  const { signatureRequest, closeSignaturePad, applySignatureToActiveCanvas } = useCanvas();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (!signatureRequest.isOpen || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#111111';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, [signatureRequest.isOpen]);

  if (!signatureRequest.isOpen) {
    return null;
  }

  const getPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * event.currentTarget.width;
    const y = ((event.clientY - rect.top) / rect.height) * event.currentTarget.height;
    return { x, y };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    const { x, y } = getPosition(event);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }

    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    const { x, y } = getPosition(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleApply = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const dataUrl = canvas.toDataURL('image/png');
    await applySignatureToActiveCanvas(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 rounded-xl border border-border-default bg-surface-800 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-text-primary">{t('title')}</h3>
          <p className="text-xs text-text-secondary mt-1">{t('instruction')}</p>
        </div>

        <div className="p-5">
          <canvas
            ref={canvasRef}
            width={900}
            height={320}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="w-full h-64 rounded-md border border-border-default bg-white touch-none"
          />
        </div>

        <div className="px-5 py-4 border-t border-border-subtle flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={handleClear}>{t('clear')}</Button>
          <Button size="sm" variant="secondary" onClick={closeSignaturePad}>{t('cancel')}</Button>
          <Button size="sm" variant="primary" onClick={() => void handleApply()}>{t('apply')}</Button>
        </div>
      </div>
    </div>
  );
}
