'use client';

import dynamic from 'next/dynamic';
import EditorLayout from '@/components/layout/EditorLayout';
import PdfUploader from '@/components/pdf/PdfUploader';
import { usePdf } from '@/store/PdfContext';

const PdfViewer = dynamic(() => import('@/components/pdf/PdfViewer'), {
  ssr: false,
});

export default function EditorPage() {
  const { pdfFile } = usePdf();

  return (
    <EditorLayout>
      {pdfFile ? <PdfViewer /> : <PdfUploader />}
    </EditorLayout>
  );
}
