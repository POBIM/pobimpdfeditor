'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface ExportContextValue {
  isExportOpen: boolean;
  openExport: () => void;
  closeExport: () => void;
}

const ExportContext = createContext<ExportContextValue | null>(null);

export function ExportProvider({ children }: { children: ReactNode }) {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const openExport = useCallback(() => {
    setIsExportOpen(true);
  }, []);

  const closeExport = useCallback(() => {
    setIsExportOpen(false);
  }, []);

  const value = useMemo<ExportContextValue>(
    () => ({
      isExportOpen,
      openExport,
      closeExport,
    }),
    [isExportOpen, openExport, closeExport]
  );

  return <ExportContext.Provider value={value}>{children}</ExportContext.Provider>;
}

export function useExport(): ExportContextValue {
  const context = useContext(ExportContext);
  if (!context) {
    throw new Error('useExport must be used within an ExportProvider');
  }

  return context;
}
