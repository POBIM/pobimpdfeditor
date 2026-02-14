'use client';

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import type { EditorState, EditorTool, ToolConfigState } from '@/types';

interface EditorContextValue extends EditorState {
  setActiveTool: (tool: EditorTool) => void;
  setToolConfig: (tool: keyof ToolConfigState, config: Partial<ToolConfigState[keyof ToolConfigState]>) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
}

const DEFAULT_TOOL_CONFIG: ToolConfigState = {
  text: {
    fontSize: 16,
    color: '#111111',
    bold: false,
    italic: false,
  },
  draw: {
    color: '#111111',
    brushSize: 2,
  },
  highlight: {
    color: '#FFEB3B',
    brushSize: 20,
    opacity: 0.4,
  },
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EditorState>({
    activeTool: 'select',
    sidebarOpen: true,
    propertiesPanelOpen: false,
    toolConfig: DEFAULT_TOOL_CONFIG,
  });

  const setActiveTool = useCallback((tool: EditorTool) => {
    setState((prev) => ({ ...prev, activeTool: tool }));
  }, []);

  const setToolConfig = useCallback(
    (tool: keyof ToolConfigState, config: Partial<ToolConfigState[keyof ToolConfigState]>) => {
      setState((prev) => ({
        ...prev,
        toolConfig: {
          ...prev.toolConfig,
          [tool]: {
            ...prev.toolConfig[tool],
            ...config,
          },
        },
      }));
    },
    []
  );

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }));
  }, []);

  const setSidebarOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, sidebarOpen: open }));
  }, []);

  const togglePropertiesPanel = useCallback(() => {
    setState((prev) => ({
      ...prev,
      propertiesPanelOpen: !prev.propertiesPanelOpen,
    }));
  }, []);

  const setPropertiesPanelOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, propertiesPanelOpen: open }));
  }, []);

  const value = useMemo<EditorContextValue>(
    () => ({
        ...state,
        setActiveTool,
        setToolConfig,
        toggleSidebar,
        setSidebarOpen,
        togglePropertiesPanel,
        setPropertiesPanelOpen,
      }),
    [state, setActiveTool, setToolConfig, toggleSidebar, setSidebarOpen, togglePropertiesPanel, setPropertiesPanelOpen]
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor(): EditorContextValue {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
