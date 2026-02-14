'use client';

import { useEffect, useMemo, useState } from 'react';
import { pdfjs } from 'react-pdf';
import '@/lib/pdfWorker';
import { useTranslations } from 'next-intl';
import { useForm } from '@/store/FormContext';

type PDFDocumentProxy = Awaited<ReturnType<typeof pdfjs.getDocument>['promise']>;
type PDFPageProxy = Awaited<ReturnType<PDFDocumentProxy['getPage']>>;

type FormAnnotation = {
  id?: string;
  subtype?: string;
  fieldName?: string;
  fieldType?: string;
  fieldValue?: string;
  rect?: number[];
  checkBox?: boolean;
  radioButton?: boolean;
  pushButton?: boolean;
  combo?: boolean;
  multiSelect?: boolean;
  required?: boolean;
  readOnly?: boolean;
  options?: Array<{ displayValue?: string; exportValue?: string } | string>;
  buttonValue?: string;
};

interface PositionedField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button';
  left: number;
  top: number;
  width: number;
  height: number;
  options: Array<{ label: string; value: string }>;
  required: boolean;
  readOnly: boolean;
  defaultValue: string;
  radioValue: string;
}

interface FormLayerProps {
  pdfFile: ArrayBuffer;
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  rotation: number;
}

function inferFieldType(annotation: FormAnnotation): PositionedField['type'] {
  if (annotation.checkBox) {
    return 'checkbox';
  }

  if (annotation.radioButton) {
    return 'radio';
  }

  if (annotation.combo || annotation.fieldType === 'Ch') {
    return 'dropdown';
  }

  if (annotation.pushButton) {
    return 'button';
  }

  return 'text';
}

function normalizeOptions(annotation: FormAnnotation): Array<{ label: string; value: string }> {
  if (!annotation.options || annotation.options.length === 0) {
    return [];
  }

  return annotation.options.map((option, index) => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }

    const fallback = `option-${index + 1}`;
    const value = option.exportValue ?? option.displayValue ?? fallback;
    return {
      label: option.displayValue ?? value,
      value,
    };
  });
}

function mapAnnotationToField(
  annotation: FormAnnotation,
  pageNumber: number,
  viewportWidth: number,
  viewportHeight: number,
  pageWidth: number,
  pageHeight: number
): PositionedField | null {
  if (!annotation.rect || annotation.rect.length < 4) {
    return null;
  }

  const [x1, y1, x2, y2] = annotation.rect;
  const width = Math.max(0, x2 - x1);
  const height = Math.max(0, y2 - y1);
  if (width === 0 || height === 0) {
    return null;
  }

  const ratioX = pageWidth / viewportWidth;
  const ratioY = pageHeight / viewportHeight;
  const fieldName = annotation.fieldName?.trim() || `page-${pageNumber}-field-${annotation.id ?? crypto.randomUUID()}`;
  const fieldId = `${fieldName}-${annotation.id ?? crypto.randomUUID()}`;

  return {
    id: fieldId,
    name: fieldName,
    type: inferFieldType(annotation),
    left: x1 * ratioX,
    top: (viewportHeight - y2) * ratioY,
    width: width * ratioX,
    height: height * ratioY,
    options: normalizeOptions(annotation),
    required: Boolean(annotation.required),
    readOnly: Boolean(annotation.readOnly),
    defaultValue: annotation.fieldValue ?? '',
    radioValue: annotation.buttonValue ?? annotation.fieldValue ?? annotation.id ?? 'On',
  };
}

async function loadPageFields(
  pdfFile: ArrayBuffer,
  pageNumber: number,
  pageWidth: number,
  pageHeight: number,
  rotation: number
): Promise<PositionedField[]> {
  let documentProxy: PDFDocumentProxy | null = null;

  try {
    documentProxy = await pdfjs.getDocument({ data: new Uint8Array(pdfFile.slice(0)) }).promise;
    const page: PDFPageProxy = await documentProxy.getPage(pageNumber);
    const annotations = (await page.getAnnotations()) as FormAnnotation[];
    const viewport = page.getViewport({ scale: 1, rotation });

    return annotations
      .filter((annotation) => annotation.subtype === 'Widget')
      .map((annotation) =>
        mapAnnotationToField(
          annotation,
          pageNumber,
          viewport.width,
          viewport.height,
          pageWidth,
          pageHeight
        )
      )
      .filter((field): field is PositionedField => field !== null);
  } finally {
    if (documentProxy) {
      await documentProxy.destroy();
    }
  }
}

export default function FormLayer({
  pdfFile,
  pageNumber,
  pageWidth,
  pageHeight,
  rotation,
}: FormLayerProps) {
  const tForm = useTranslations('form');
  const { getFieldValue, setFieldValue } = useForm();
  const [fields, setFields] = useState<PositionedField[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const loaded = await loadPageFields(pdfFile, pageNumber, pageWidth, pageHeight, rotation);
      if (!cancelled) {
        setFields(loaded);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [pdfFile, pageNumber, pageWidth, pageHeight, rotation]);

  const hasFields = useMemo(() => fields.length > 0, [fields.length]);

  if (!hasFields) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-[5] pointer-events-none">
      {fields.map((field) => {
        const savedValue = getFieldValue(pageNumber, field.name);
        const value = savedValue ?? field.defaultValue;
        const tooltip = `${field.name} · ${field.required ? tForm('required') : tForm('optional')}`;

        const commonProps = {
          title: tooltip,
          disabled: field.readOnly,
          className:
            'pointer-events-auto w-full h-full rounded border border-sky-300/70 bg-sky-100/30 px-1.5 text-[11px] text-text-inverse outline-none focus:border-sky-500 focus:bg-sky-100/55 transition-colors',
        };

        return (
          <div
            key={field.id}
            style={{
              position: 'absolute',
              left: `${field.left}px`,
              top: `${field.top}px`,
              width: `${field.width}px`,
              height: `${field.height}px`,
            }}
          >
            {field.type === 'text' && (
              <input
                {...commonProps}
                type="text"
                aria-label={`${tForm('textField')} ${field.name}`}
                placeholder={field.name || tForm('fillableField')}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => setFieldValue(pageNumber, field.name, event.target.value)}
              />
            )}

            {field.type === 'checkbox' && (
              <label className="pointer-events-auto flex h-full w-full items-center justify-center rounded border border-sky-300/70 bg-sky-100/30">
                <input
                  type="checkbox"
                  aria-label={`${tForm('checkbox')} ${field.name}`}
                  title={tooltip}
                  disabled={field.readOnly}
                  checked={Boolean(value)}
                  onChange={(event) => setFieldValue(pageNumber, field.name, event.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-sky-600"
                />
              </label>
            )}

            {field.type === 'radio' && (
              <label className="pointer-events-auto flex h-full w-full items-center justify-center rounded border border-sky-300/70 bg-sky-100/30">
                <input
                  type="radio"
                  name={field.name}
                  aria-label={`${tForm('radio')} ${field.name}`}
                  title={tooltip}
                  disabled={field.readOnly}
                  value={field.radioValue}
                  checked={typeof value === 'string' && value === field.radioValue}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setFieldValue(pageNumber, field.name, field.radioValue);
                    }
                  }}
                  className="h-3.5 w-3.5 cursor-pointer accent-sky-600"
                />
              </label>
            )}

            {field.type === 'dropdown' && (
              <select
                {...commonProps}
                aria-label={`${tForm('dropdown')} ${field.name}`}
                value={typeof value === 'string' ? value : ''}
                onChange={(event) => setFieldValue(pageNumber, field.name, event.target.value)}
              >
                <option value="">{field.name || tForm('fillableField')}</option>
                {field.options.map((option) => (
                  <option key={`${field.id}-${option.value}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'button' && (
              <button
                type="button"
                className="pointer-events-auto h-full w-full rounded border border-sky-300/70 bg-sky-100/40 px-2 text-[11px] font-medium text-sky-900"
                title={tooltip}
                disabled={field.readOnly}
              >
                {field.name || tForm('fillableField')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
