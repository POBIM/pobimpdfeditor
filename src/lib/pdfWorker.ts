import { pdfjs } from 'react-pdf';

if (typeof window !== 'undefined') {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  pdfjs.GlobalWorkerOptions.workerSrc = `${basePath}/pdf.worker.min.mjs`;
}
