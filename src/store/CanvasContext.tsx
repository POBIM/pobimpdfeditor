'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, FabricImage, type FabricObject } from 'fabric';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { usePdf } from '@/store/PdfContext';

interface CanvasRestoreRequest {
  pageNumber: number;
  serializedState: string;
  requestId: number;
}

interface SignatureRequest {
  isOpen: boolean;
  pageNumber: number | null;
  point: { x: number; y: number } | null;
}

interface CanvasContextValue {
  registerCanvas: (pageNumber: number, canvas: Canvas) => void;
  unregisterCanvas: (pageNumber: number) => void;
  getCanvas: (pageNumber: number) => Canvas | null;
  getAllCanvases: () => Map<number, Canvas>;
  activeCanvas: Canvas | null;
  activePageNumber: number | null;
  setActiveCanvas: (pageNumber: number | null) => void;
  selectedObject: FabricObject | null;
  selectedPageNumber: number | null;
  setSelectedObject: (pageNumber: number | null, object: FabricObject | null) => void;
  setPageSerializedState: (pageNumber: number, serializedState: string) => void;
  getPageSerializedState: (pageNumber: number) => string | null;
  initializePageHistory: (pageNumber: number, serializedState: string) => void;
  pushHistoryState: (pageNumber: number, serializedState: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  restoreRequest: CanvasRestoreRequest | null;
  setLastPointer: (pageNumber: number, point: { x: number; y: number }) => void;
  getLastPointer: (pageNumber: number) => { x: number; y: number } | null;
  signatureRequest: SignatureRequest;
  openSignaturePad: (pageNumber: number, point?: { x: number; y: number } | null) => void;
  closeSignaturePad: () => void;
  applySignatureToActiveCanvas: (dataUrl: string) => Promise<void>;
  remapCanvasPages: (newPageOrder: number[]) => void;
  removeCanvasPages: (removedPageNumbers: number[]) => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

const EMPTY_CANVAS_STATE = JSON.stringify({ version: '7.0.0', objects: [] });

export function CanvasProvider({ children }: { children: ReactNode }) {
  const { documentSession, numPages } = usePdf();
  const canvasesRef = useRef<Map<number, Canvas>>(new Map());
  const pageStateRef = useRef<Map<number, string>>(new Map());
  const pointerRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const requestIdRef = useRef(0);
  const {
    resetPage,
    clearAll,
    pushState,
    undo: undoPage,
    redo: redoPage,
    canUndo: canUndoPage,
    canRedo: canRedoPage,
  } = useUndoRedo();

  const [activePageNumber, setActivePageNumber] = useState<number | null>(null);
  const [selectedObject, setSelectedObjectState] = useState<FabricObject | null>(null);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const selectedPageNumberRef = useRef<number | null>(null);
  const [restoreRequest, setRestoreRequest] = useState<CanvasRestoreRequest | null>(null);
  const [signatureRequest, setSignatureRequest] = useState<SignatureRequest>({
    isOpen: false,
    pageNumber: null,
    point: null,
  });

  useEffect(() => {
    selectedPageNumberRef.current = selectedPageNumber;
  }, [selectedPageNumber]);

  useEffect(() => {
    void documentSession;

    canvasesRef.current.forEach((canvas) => {
      canvas.dispose();
    });

    canvasesRef.current.clear();
    pageStateRef.current.clear();
    pointerRef.current.clear();
    clearAll();
    setActivePageNumber(null);
    setSelectedObjectState(null);
    setSelectedPageNumber(null);
    setRestoreRequest(null);
    setSignatureRequest({ isOpen: false, pageNumber: null, point: null });
  }, [documentSession, clearAll]);

  const registerCanvas = useCallback((pageNumber: number, canvas: Canvas) => {
    canvasesRef.current.set(pageNumber, canvas);
  }, []);

  const unregisterCanvas = useCallback((pageNumber: number) => {
    canvasesRef.current.delete(pageNumber);

    setSelectedObjectState((prev) =>
      selectedPageNumberRef.current === pageNumber ? null : prev
    );
    setSelectedPageNumber((prev) => (prev === pageNumber ? null : prev));
    setActivePageNumber((prev) => (prev === pageNumber ? null : prev));
  }, []);

  const getCanvas = useCallback((pageNumber: number) => {
    return canvasesRef.current.get(pageNumber) ?? null;
  }, []);

  const getAllCanvases = useCallback(() => {
    return canvasesRef.current;
  }, []);

  const setActiveCanvas = useCallback((pageNumber: number | null) => {
    setActivePageNumber(pageNumber);
  }, []);

  const setSelectedObject = useCallback(
    (pageNumber: number | null, object: FabricObject | null) => {
      setSelectedObjectState(object);
      setSelectedPageNumber(pageNumber);
      if (pageNumber !== null) {
        setActivePageNumber(pageNumber);
      }
    },
    []
  );

  const setPageSerializedState = useCallback((pageNumber: number, serializedState: string) => {
    pageStateRef.current.set(pageNumber, serializedState);
  }, []);

  const getPageSerializedState = useCallback((pageNumber: number) => {
    return pageStateRef.current.get(pageNumber) ?? null;
  }, []);

  const initializePageHistory = useCallback((pageNumber: number, serializedState: string) => {
    pageStateRef.current.set(pageNumber, serializedState);
    resetPage(pageNumber, serializedState);
  }, [resetPage]);

  const pushHistoryState = useCallback((pageNumber: number, serializedState: string) => {
    pageStateRef.current.set(pageNumber, serializedState);
    pushState(pageNumber, serializedState);
  }, [pushState]);

  const issueRestoreRequest = useCallback((pageNumber: number, serializedState: string) => {
    requestIdRef.current += 1;
    pageStateRef.current.set(pageNumber, serializedState);
    setRestoreRequest({
      pageNumber,
      serializedState,
      requestId: requestIdRef.current,
    });
  }, []);

  const undo = useCallback(() => {
    if (activePageNumber === null) {
      return;
    }

    const serializedState = undoPage(activePageNumber);
    if (serializedState) {
      issueRestoreRequest(activePageNumber, serializedState);
    }
  }, [activePageNumber, undoPage, issueRestoreRequest]);

  const redo = useCallback(() => {
    if (activePageNumber === null) {
      return;
    }

    const serializedState = redoPage(activePageNumber);
    if (serializedState) {
      issueRestoreRequest(activePageNumber, serializedState);
    }
  }, [activePageNumber, redoPage, issueRestoreRequest]);

  const setLastPointer = useCallback((pageNumber: number, point: { x: number; y: number }) => {
    pointerRef.current.set(pageNumber, point);
  }, []);

  const getLastPointer = useCallback((pageNumber: number) => {
    return pointerRef.current.get(pageNumber) ?? null;
  }, []);

  const openSignaturePad = useCallback((pageNumber: number, point?: { x: number; y: number } | null) => {
    const resolvedPoint = point ?? pointerRef.current.get(pageNumber) ?? null;

    setSignatureRequest({
      isOpen: true,
      pageNumber,
      point: resolvedPoint,
    });
    setActivePageNumber(pageNumber);
  }, []);

  const closeSignaturePad = useCallback(() => {
    setSignatureRequest({ isOpen: false, pageNumber: null, point: null });
  }, []);

  const applySignatureToActiveCanvas = useCallback(
    async (dataUrl: string) => {
      const pageNumber = signatureRequest.pageNumber ?? activePageNumber;
      if (pageNumber === null) {
        closeSignaturePad();
        return;
      }

      const canvas = canvasesRef.current.get(pageNumber);
      if (!canvas) {
        closeSignaturePad();
        return;
      }

      const signatureImage = await FabricImage.fromURL(dataUrl);
      const targetPoint =
        signatureRequest.point ??
        pointerRef.current.get(pageNumber) ?? {
          x: canvas.getWidth() / 2,
          y: canvas.getHeight() / 2,
        };

      const maxWidth = canvas.getWidth() * 0.4;
      const maxHeight = canvas.getHeight() * 0.2;
      const imageWidth = signatureImage.width ?? maxWidth;
      const imageHeight = signatureImage.height ?? maxHeight;
      const ratio = Math.min(maxWidth / imageWidth, maxHeight / imageHeight, 1);

      signatureImage.set({
        left: targetPoint.x,
        top: targetPoint.y,
        originX: 'center',
        originY: 'center',
        scaleX: ratio,
        scaleY: ratio,
      });

      canvas.add(signatureImage);
      canvas.setActiveObject(signatureImage);
      canvas.requestRenderAll();
      setActivePageNumber(pageNumber);
      closeSignaturePad();
    },
    [signatureRequest.pageNumber, signatureRequest.point, activePageNumber, closeSignaturePad]
  );

  const rebuildHistoryFromPageStates = useCallback(() => {
    clearAll();
    pageStateRef.current.forEach((serializedState, pageNumber) => {
      resetPage(pageNumber, serializedState);
    });
  }, [clearAll, resetPage]);

  const remapCanvasPages = useCallback(
    (newPageOrder: number[]) => {
      const nextPageStates = new Map<number, string>();
      const nextPointers = new Map<number, { x: number; y: number }>();

      newPageOrder.forEach((oldPageNumber, index) => {
        const newPageNumber = index + 1;
        const serializedState = pageStateRef.current.get(oldPageNumber);
        if (serializedState) {
          nextPageStates.set(newPageNumber, serializedState);
        }

        const pointer = pointerRef.current.get(oldPageNumber);
        if (pointer) {
          nextPointers.set(newPageNumber, pointer);
        }
      });

      pageStateRef.current = nextPageStates;
      pointerRef.current = nextPointers;
      setSelectedObjectState(null);
      setSelectedPageNumber(null);
      setActivePageNumber((prev) => {
        if (prev === null) {
          return null;
        }

        const nextIndex = newPageOrder.indexOf(prev);
        return nextIndex >= 0 ? nextIndex + 1 : null;
      });
      rebuildHistoryFromPageStates();
    },
    [rebuildHistoryFromPageStates]
  );

  const removeCanvasPages = useCallback(
    (removedPageNumbers: number[]) => {
      if (removedPageNumbers.length === 0) {
        return;
      }

      const removedSet = new Set(removedPageNumbers);
      const nextPageOrder: number[] = [];

      for (let pageNumber = 1; pageNumber <= numPages; pageNumber += 1) {
        if (!removedSet.has(pageNumber)) {
          nextPageOrder.push(pageNumber);
        }
      }

      remapCanvasPages(nextPageOrder);
    },
    [numPages, remapCanvasPages]
  );

  const activeCanvas = activePageNumber ? (canvasesRef.current.get(activePageNumber) ?? null) : null;
  const canUndo = activePageNumber !== null ? canUndoPage(activePageNumber) : false;
  const canRedo = activePageNumber !== null ? canRedoPage(activePageNumber) : false;

  const value = useMemo<CanvasContextValue>(
    () => ({
      registerCanvas,
      unregisterCanvas,
      getCanvas,
      getAllCanvases,
      activeCanvas,
      activePageNumber,
      setActiveCanvas,
      selectedObject,
      selectedPageNumber,
      setSelectedObject,
      setPageSerializedState,
      getPageSerializedState,
      initializePageHistory,
      pushHistoryState,
      undo,
      redo,
      canUndo,
      canRedo,
      restoreRequest,
      setLastPointer,
      getLastPointer,
      signatureRequest,
      openSignaturePad,
      closeSignaturePad,
      applySignatureToActiveCanvas,
      remapCanvasPages,
      removeCanvasPages,
    }),
    [
      registerCanvas,
      unregisterCanvas,
      getCanvas,
      getAllCanvases,
      activeCanvas,
      activePageNumber,
      setActiveCanvas,
      selectedObject,
      selectedPageNumber,
      setSelectedObject,
      setPageSerializedState,
      getPageSerializedState,
      initializePageHistory,
      pushHistoryState,
      undo,
      redo,
      canUndo,
      canRedo,
      restoreRequest,
      setLastPointer,
      getLastPointer,
      signatureRequest,
      openSignaturePad,
      closeSignaturePad,
      applySignatureToActiveCanvas,
      remapCanvasPages,
      removeCanvasPages,
    ]
  );

  return <CanvasContext.Provider value={value}>{children}</CanvasContext.Provider>;
}

export function useCanvas(): CanvasContextValue {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }

  return context;
}

export function getEmptyCanvasState() {
  return EMPTY_CANVAS_STATE;
}
