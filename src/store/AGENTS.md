# STORE DOMAIN

## OVERVIEW
State is split by concern into six context providers: `Theme`, `Pdf`, `Editor`, `Canvas`, `Form`, and `Export`.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| File/session/zoom state | `src/store/PdfContext.tsx` | `documentSession` and `pdfRevision` drive resets/remounts |
| Canvas registry + undo/redo | `src/store/CanvasContext.tsx` | Per-page `Map<number, Canvas>` and restore requests |
| Tool/mode/panel state | `src/store/EditorContext.tsx` | `activeTool`, `editorMode`, and tool config defaults |
| Form field persistence | `src/store/FormContext.tsx` | Per-page `Map<string, value>` snapshots |
| Export modal visibility | `src/store/ExportContext.tsx` | Lightweight UI state only |
| Theme persistence | `src/store/ThemeContext.tsx` | `localStorage` + `data-theme` synchronization |

## CONVENTIONS
- Treat store writes as immutable; clone maps and array buffers before storing.
- Keep page identifiers one-based in context APIs.
- When pages reorder/delete, remap dependent maps (`canvas`, `rotation`, `form`, pointer state) in the same flow.
- Keep provider guards (`throw new Error(...)`) intact for all `use*` hooks.
- `CanvasContext` owns selection pointer and signature placement state; do not duplicate this in components.

## ANTI-PATTERNS
- Updating `pageRotations` or canvas page maps without corresponding remap helpers.
- Mutating `pdfFile` buffers in place instead of using copied `ArrayBuffer` instances.
- Calling `undo`/`redo` without active page context.
- Storing Fabric objects directly in unrelated contexts.

## NOTES
- `documentSession` resets cross-cutting store state when a new file is loaded.
- `pdfRevision` is the remount trigger used by viewer-level `Document` components.
- `CanvasContext` depends on `PdfContext` page/session signals; keep this dependency explicit.
