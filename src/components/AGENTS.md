# COMPONENTS DOMAIN

## OVERVIEW
UI is organized by domain: layout shell, PDF workflows, canvas editing, and shared primitives.

## STRUCTURE
```text
src/components/
|- layout/      # Header, toolbar, sidebar, properties, shell
|- pdf/         # Viewer, uploader, thumbnails, split/merge/export modals
|- canvas/      # Fabric canvas host and signature modal
\- ui/          # Reusable controls (Button, ToolButton, switchers)
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Overall shell layout | `src/components/layout/EditorLayout.tsx` | Composes header/toolbar/sidebar/properties |
| Tool selection and editor mode transitions | `src/components/layout/Toolbar.tsx` | Connects `useEditor`, `usePdf`, `useCanvas` |
| PDF page rendering | `src/components/pdf/PdfViewer.tsx` | `react-pdf` + overlays |
| Page operations UX | `src/components/pdf/PdfThumbnails.tsx` | delete/reorder/rotate/extract actions |
| Fabric event bridge | `src/components/canvas/FabricCanvas.tsx` | Registers canvas + activates tool hooks |
| Shared button behavior | `src/components/ui/Button.tsx` | Variant and size contract |

## CONVENTIONS
- Interactive modules are client components (`'use client'`).
- Domain components read/write state through context hooks only.
- Keep modals colocated with owning domain (`pdf/` for PDF workflows, `canvas/` for signature flow).
- Keep presentational primitives in `ui/`; business logic stays in domain components.

## ANTI-PATTERNS
- Duplicating context mutation logic in multiple domain components.
- Importing deep tool internals from outside `canvas/` domain.
- Mixing PDF operation utilities directly into layout primitives.
