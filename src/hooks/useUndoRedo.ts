'use client';

import { useCallback, useMemo, useState } from 'react';

const MAX_HISTORY = 50;

interface PageHistory {
  undoStack: string[];
  redoStack: string[];
}

type HistoryMap = Record<number, PageHistory>;

function getInitialHistoryState(state: string): PageHistory {
  return {
    undoStack: [state],
    redoStack: [],
  };
}

export function useUndoRedo() {
  const [histories, setHistories] = useState<HistoryMap>({});

  const resetPage = useCallback((pageNumber: number, initialState: string) => {
    setHistories((prev) => ({
      ...prev,
      [pageNumber]: getInitialHistoryState(initialState),
    }));
  }, []);

  const clearAll = useCallback(() => {
    setHistories({});
  }, []);

  const pushState = useCallback((pageNumber: number, state: string) => {
    setHistories((prev) => {
      const pageHistory = prev[pageNumber] ?? getInitialHistoryState(state);
      const currentState = pageHistory.undoStack[pageHistory.undoStack.length - 1];

      if (currentState === state) {
        return prev;
      }

      const undoStack = [...pageHistory.undoStack, state].slice(-MAX_HISTORY);

      return {
        ...prev,
        [pageNumber]: {
          undoStack,
          redoStack: [],
        },
      };
    });
  }, []);

  const undo = useCallback((pageNumber: number): string | null => {
    let restoredState: string | null = null;

    setHistories((prev) => {
      const pageHistory = prev[pageNumber];
      if (!pageHistory || pageHistory.undoStack.length <= 1) {
        return prev;
      }

      const undoStack = [...pageHistory.undoStack];
      const currentState = undoStack.pop();
      const previousState = undoStack[undoStack.length - 1] ?? null;

      if (!currentState || !previousState) {
        return prev;
      }

      restoredState = previousState;

      return {
        ...prev,
        [pageNumber]: {
          undoStack,
          redoStack: [currentState, ...pageHistory.redoStack].slice(0, MAX_HISTORY),
        },
      };
    });

    return restoredState;
  }, []);

  const redo = useCallback((pageNumber: number): string | null => {
    let restoredState: string | null = null;

    setHistories((prev) => {
      const pageHistory = prev[pageNumber];
      if (!pageHistory || pageHistory.redoStack.length === 0) {
        return prev;
      }

      const [nextState, ...redoStack] = pageHistory.redoStack;
      restoredState = nextState;

      return {
        ...prev,
        [pageNumber]: {
          undoStack: [...pageHistory.undoStack, nextState].slice(-MAX_HISTORY),
          redoStack,
        },
      };
    });

    return restoredState;
  }, []);

  const canUndo = useCallback(
    (pageNumber: number) => {
      const pageHistory = histories[pageNumber];
      return Boolean(pageHistory && pageHistory.undoStack.length > 1);
    },
    [histories]
  );

  const canRedo = useCallback(
    (pageNumber: number) => {
      const pageHistory = histories[pageNumber];
      return Boolean(pageHistory && pageHistory.redoStack.length > 0);
    },
    [histories]
  );

  return useMemo(
    () => ({
      resetPage,
      clearAll,
      pushState,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [resetPage, clearAll, pushState, undo, redo, canUndo, canRedo]
  );
}
