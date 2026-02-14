export type Locale = 'th' | 'en';

export type EditorTool =
  | 'select'
  | 'text'
  | 'draw'
  | 'highlight'
  | 'image'
  | 'signature'
  | 'eraser';

export type EditorMode = 'view' | 'edit';

export type ZoomLevel = number;

export const ZOOM_PRESETS = [50, 75, 100, 125, 150, 200] as const;
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 400;
export const ZOOM_STEP = 25;

export interface PdfState {
  pdfFile: ArrayBuffer | null;
  fileName: string | null;
  numPages: number;
  currentPage: number;
  zoom: ZoomLevel;
  pageRotations: Map<number, number>;
  documentSession: number;
  pdfRevision: number;
}

export interface EditorState {
  editorMode: EditorMode;
  activeTool: EditorTool;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  toolConfig: ToolConfigState;
}

export interface TextToolConfig {
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface DrawToolConfig {
  color: string;
  brushSize: number;
}

export interface HighlightToolConfig {
  color: string;
  brushSize: number;
  opacity: number;
}

export interface ToolConfigState {
  text: TextToolConfig;
  draw: DrawToolConfig;
  highlight: HighlightToolConfig;
}
