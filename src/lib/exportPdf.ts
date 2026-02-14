import {
  PDFDocument,
  PDFCheckBox,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  degrees,
} from 'pdf-lib';
import type { Canvas } from 'fabric';
import type { FormFieldValue } from '@/store/FormContext';

export type ExportProgressStep =
  | 'preparing'
  | 'processingPage'
  | 'embedding'
  | 'finalizing'
  | 'complete';

export interface ExportProgressState {
  step: ExportProgressStep;
  currentPage?: number;
  totalPages: number;
  percentage: number;
}

export interface ExportParams {
  currentPdfBytes: ArrayBuffer;
  canvases: Map<number, Canvas>;
  pageRotations: Map<number, number>;
  formData: Map<number, Map<string, FormFieldValue>>;
  includeAnnotations: boolean;
  flattenForms: boolean;
  quality: 'standard' | 'high';
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgressState) => void;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

function normalizeRotation(degreesValue: number) {
  return ((degreesValue % 360) + 360) % 360;
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Export canceled', 'AbortError');
  }
}

function emitProgress(
  onProgress: ExportParams['onProgress'],
  progress: ExportProgressState
) {
  onProgress?.(progress);
}

function applyFormFieldValue(
  form: ReturnType<PDFDocument['getForm']>,
  fieldName: string,
  value: FormFieldValue
) {
  let field: PDFField;
  try {
    field = form.getField(fieldName);
  } catch {
    return;
  }

  if (field instanceof PDFTextField) {
    field.setText(typeof value === 'string' ? value : value ? 'true' : 'false');
    return;
  }

  if (field instanceof PDFCheckBox) {
    if (Boolean(value)) {
      field.check();
    } else {
      field.uncheck();
    }
    return;
  }

  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    field.select(typeof value === 'string' ? value : value ? 'true' : 'false');
    return;
  }

  if (field instanceof PDFRadioGroup) {
    const radioValue = typeof value === 'string' ? value : value ? 'On' : 'Off';
    field.select(radioValue);
  }
}

function getCanvasHasRenderableContent(canvas: Canvas) {
  return canvas.getObjects().length > 0;
}

export async function exportPdf(params: ExportParams): Promise<ArrayBuffer> {
  const {
    currentPdfBytes,
    canvases,
    pageRotations,
    formData,
    includeAnnotations,
    flattenForms,
    quality,
    signal,
    onProgress,
  } = params;

  assertNotAborted(signal);
  emitProgress(onProgress, {
    step: 'preparing',
    totalPages: 0,
    percentage: 5,
  });

  const pdfDoc = await PDFDocument.load(currentPdfBytes);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const qualityMultiplier = quality === 'high' ? 2 : 1;

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    assertNotAborted(signal);

    const pageNumber = pageIndex + 1;
    const page = pages[pageIndex];
    const pageRotation = normalizeRotation(pageRotations.get(pageNumber) ?? 0);

    emitProgress(onProgress, {
      step: 'processingPage',
      currentPage: pageNumber,
      totalPages,
      percentage: Math.round(5 + ((pageIndex + 1) / totalPages) * 65),
    });

    if (pageRotation !== 0) {
      page.setRotation(degrees(pageRotation));
    }

    if (includeAnnotations) {
      const canvas = canvases.get(pageNumber);
      if (canvas && getCanvasHasRenderableContent(canvas)) {
        emitProgress(onProgress, {
          step: 'embedding',
          currentPage: pageNumber,
          totalPages,
          percentage: Math.round(10 + ((pageIndex + 1) / totalPages) * 70),
        });

        const canvasDataUrl = canvas.toDataURL({
          format: 'png',
          multiplier: qualityMultiplier,
        });

        const pngImage = await pdfDoc.embedPng(canvasDataUrl);
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: page.getWidth(),
          height: page.getHeight(),
        });
      }
    }
  }

  assertNotAborted(signal);
  emitProgress(onProgress, {
    step: 'finalizing',
    totalPages,
    percentage: 85,
  });

  const form = pdfDoc.getForm();
  formData.forEach((pageFieldValues) => {
    pageFieldValues.forEach((value, fieldName) => {
      applyFormFieldValue(form, fieldName, value);
    });
  });

  if (flattenForms) {
    form.flatten();
  }

  assertNotAborted(signal);
  const savedBytes = await pdfDoc.save();

  emitProgress(onProgress, {
    step: 'complete',
    totalPages,
    percentage: 100,
  });

  return toArrayBuffer(savedBytes);
}
