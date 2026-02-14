import { PDFDocument, degrees } from 'pdf-lib';

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

function uniqueSorted(indices: number[]) {
  return Array.from(new Set(indices)).sort((a, b) => a - b);
}

function isValidPageIndex(pageIndex: number, pageCount: number) {
  return Number.isInteger(pageIndex) && pageIndex >= 0 && pageIndex < pageCount;
}

export async function deletePages(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  const indices = uniqueSorted(pageIndices).filter((index) =>
    isValidPageIndex(index, pageCount)
  );

  if (indices.length === 0 || indices.length >= pageCount) {
    return pdfBytes.slice(0);
  }

  pdfDoc.removePage(indices[indices.length - 1]);
  for (let i = indices.length - 2; i >= 0; i -= 1) {
    pdfDoc.removePage(indices[i]);
  }

  const bytes = await pdfDoc.save();
  return toArrayBuffer(bytes);
}

export async function reorderPages(
  pdfBytes: ArrayBuffer,
  newOrder: number[]
): Promise<ArrayBuffer> {
  const sourceDoc = await PDFDocument.load(pdfBytes);
  const sourceCount = sourceDoc.getPageCount();

  if (newOrder.length !== sourceCount) {
    return pdfBytes.slice(0);
  }

  const normalizedOrder = uniqueSorted(newOrder);
  const isValidOrder =
    normalizedOrder.length === sourceCount &&
    normalizedOrder.every((value, index) => value === index);

  if (!isValidOrder) {
    return pdfBytes.slice(0);
  }

  const targetDoc = await PDFDocument.create();
  const copiedPages = await targetDoc.copyPages(sourceDoc, newOrder);

  copiedPages.forEach((page) => {
    targetDoc.addPage(page);
  });

  const bytes = await targetDoc.save();
  return toArrayBuffer(bytes);
}

export async function rotatePage(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  rotationDegrees: number
): Promise<ArrayBuffer> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();

  if (!isValidPageIndex(pageIndex, pageCount)) {
    return pdfBytes.slice(0);
  }

  const normalizedDegrees = ((rotationDegrees % 360) + 360) % 360;
  const page = pdfDoc.getPage(pageIndex);
  page.setRotation(degrees(normalizedDegrees));

  const bytes = await pdfDoc.save();
  return toArrayBuffer(bytes);
}

export async function mergePdfs(pdfBytesArray: ArrayBuffer[]): Promise<ArrayBuffer> {
  if (pdfBytesArray.length === 0) {
    return new ArrayBuffer(0);
  }

  const merged = await PDFDocument.create();

  for (const pdfBytes of pdfBytesArray) {
    const source = await PDFDocument.load(pdfBytes);
    const pageIndices = source.getPageIndices();
    const copiedPages = await merged.copyPages(source, pageIndices);

    copiedPages.forEach((page) => {
      merged.addPage(page);
    });
  }

  const bytes = await merged.save();
  return toArrayBuffer(bytes);
}

export async function splitPdf(
  pdfBytes: ArrayBuffer,
  pageIndices: number[]
): Promise<ArrayBuffer> {
  const sourceDoc = await PDFDocument.load(pdfBytes);
  const pageCount = sourceDoc.getPageCount();
  const indices = uniqueSorted(pageIndices).filter((index) =>
    isValidPageIndex(index, pageCount)
  );

  const splitDoc = await PDFDocument.create();

  if (indices.length === 0) {
    const bytes = await splitDoc.save();
    return toArrayBuffer(bytes);
  }

  const copiedPages = await splitDoc.copyPages(sourceDoc, indices);
  copiedPages.forEach((page) => {
    splitDoc.addPage(page);
  });

  const bytes = await splitDoc.save();
  return toArrayBuffer(bytes);
}

export async function extractPageRange(
  pdfBytes: ArrayBuffer,
  startPage: number,
  endPage: number
): Promise<ArrayBuffer> {
  const lower = Math.min(startPage, endPage);
  const upper = Math.max(startPage, endPage);
  const indices: number[] = [];

  for (let pageIndex = lower; pageIndex <= upper; pageIndex += 1) {
    indices.push(pageIndex);
  }

  return splitPdf(pdfBytes, indices);
}
