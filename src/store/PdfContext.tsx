'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type PdfState,
  type ZoomLevel,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
} from '@/types';

interface PdfContextValue extends PdfState {
  setPdfFile: (file: ArrayBuffer, name: string) => void;
  updatePdfFile: (file: ArrayBuffer) => void;
  clearPdf: () => void;
  setNumPages: (num: number) => void;
  setCurrentPage: (page: number) => void;
  setZoom: (zoom: ZoomLevel) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  rotatePageBy: (pageNumber: number, degrees: number) => void;
  setPageRotation: (pageNumber: number, degrees: number) => void;
  clearPageRotation: (pageNumber: number) => void;
  remapPageRotations: (newPageOrder: number[]) => void;
  removePageRotations: (removedPageNumbers: number[]) => void;
}

const PdfContext = createContext<PdfContextValue | null>(null);

export function PdfProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PdfState>({
    pdfFile: null,
    fileName: null,
    numPages: 0,
    currentPage: 1,
    zoom: 100,
    pageRotations: new Map<number, number>(),
    documentSession: 0,
    pdfRevision: 0,
  });

  const setPdfFile = useCallback((file: ArrayBuffer, name: string) => {
    const safeCopy = file.slice(0);
    setState((prev) => ({
      ...prev,
      pdfFile: safeCopy,
      fileName: name,
      numPages: 0,
      currentPage: 1,
      pageRotations: new Map<number, number>(),
      documentSession: prev.documentSession + 1,
      pdfRevision: prev.pdfRevision + 1,
    }));
  }, []);

  const updatePdfFile = useCallback((file: ArrayBuffer) => {
    const safeCopy = file.slice(0);
    setState((prev) => ({
      ...prev,
      pdfFile: safeCopy,
      numPages: 0,
      currentPage: 1,
      pdfRevision: prev.pdfRevision + 1,
    }));
  }, []);

  const clearPdf = useCallback(() => {
    setState({
      pdfFile: null,
      fileName: null,
      numPages: 0,
      currentPage: 1,
      zoom: 100,
      pageRotations: new Map<number, number>(),
      documentSession: 0,
      pdfRevision: 0,
    });
  }, []);

  const setNumPages = useCallback((num: number) => {
    setState((prev) => ({ ...prev, numPages: num }));
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.numPages)),
    }));
  }, []);

  const setZoom = useCallback((zoom: ZoomLevel) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)),
    }));
  }, []);

  const zoomIn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      zoom: Math.min(MAX_ZOOM, prev.zoom + ZOOM_STEP),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, prev.zoom - ZOOM_STEP),
    }));
  }, []);

  const setPageRotation = useCallback((pageNumber: number, degrees: number) => {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    setState((prev) => {
      const nextRotations = new Map(prev.pageRotations);
      if (normalizedDegrees === 0) {
        nextRotations.delete(pageNumber);
      } else {
        nextRotations.set(pageNumber, normalizedDegrees);
      }

      return {
        ...prev,
        pageRotations: nextRotations,
      };
    });
  }, []);

  const rotatePageBy = useCallback((pageNumber: number, degrees: number) => {
    setState((prev) => {
      const current = prev.pageRotations.get(pageNumber) ?? 0;
      const next = ((current + degrees) % 360 + 360) % 360;
      const nextRotations = new Map(prev.pageRotations);

      if (next === 0) {
        nextRotations.delete(pageNumber);
      } else {
        nextRotations.set(pageNumber, next);
      }

      return {
        ...prev,
        pageRotations: nextRotations,
      };
    });
  }, []);

  const clearPageRotation = useCallback((pageNumber: number) => {
    setState((prev) => {
      if (!prev.pageRotations.has(pageNumber)) {
        return prev;
      }

      const nextRotations = new Map(prev.pageRotations);
      nextRotations.delete(pageNumber);

      return {
        ...prev,
        pageRotations: nextRotations,
      };
    });
  }, []);

  const remapPageRotations = useCallback((newPageOrder: number[]) => {
    setState((prev) => {
      const nextRotations = new Map<number, number>();

      newPageOrder.forEach((oldPageNumber, index) => {
        const rotation = prev.pageRotations.get(oldPageNumber);
        if (rotation !== undefined) {
          nextRotations.set(index + 1, rotation);
        }
      });

      return {
        ...prev,
        pageRotations: nextRotations,
      };
    });
  }, []);

  const removePageRotations = useCallback((removedPageNumbers: number[]) => {
    setState((prev) => {
      if (removedPageNumbers.length === 0) {
        return prev;
      }

      const removedSet = new Set(removedPageNumbers);
      const nextRotations = new Map<number, number>();
      let nextPageNumber = 1;

      for (let pageNumber = 1; pageNumber <= prev.numPages; pageNumber += 1) {
        if (removedSet.has(pageNumber)) {
          continue;
        }

        const rotation = prev.pageRotations.get(pageNumber);
        if (rotation !== undefined) {
          nextRotations.set(nextPageNumber, rotation);
        }
        nextPageNumber += 1;
      }

      return {
        ...prev,
        pageRotations: nextRotations,
      };
    });
  }, []);

  const value = useMemo<PdfContextValue>(
    () => ({
      ...state,
      setPdfFile,
      updatePdfFile,
      clearPdf,
      setNumPages,
      setCurrentPage,
      setZoom,
      zoomIn,
      zoomOut,
      rotatePageBy,
      setPageRotation,
      clearPageRotation,
      remapPageRotations,
      removePageRotations,
    }),
    [
      state,
      setPdfFile,
      updatePdfFile,
      clearPdf,
      setNumPages,
      setCurrentPage,
      setZoom,
      zoomIn,
      zoomOut,
      rotatePageBy,
      setPageRotation,
      clearPageRotation,
      remapPageRotations,
      removePageRotations,
    ]
  );

  return <PdfContext.Provider value={value}>{children}</PdfContext.Provider>;
}

export function usePdf(): PdfContextValue {
  const context = useContext(PdfContext);
  if (!context) {
    throw new Error('usePdf must be used within a PdfProvider');
  }
  return context;
}
