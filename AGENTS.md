# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-14T22:36:18+07:00
**Commit:** cdcf352
**Branch:** main

## OVERVIEW
Browser-first PDF editor built on Next.js 16 + React 19. Core stack is `react-pdf` (render), Fabric.js (annotation layer), `pdf-lib` (document operations), and `next-intl` (Thai/English routing).

## STRUCTURE
```text
./
|- src/
|  |- app/[locale]/        # Route entry + provider composition
|  |- components/
|  |  |- layout/           # Shell, toolbar, sidebar, properties
|  |  |- pdf/              # Viewer, thumbnails, split/merge/export modals
|  |  |- canvas/           # Fabric canvas orchestration + signature
|  |  \- ui/               # Small reusable controls
|  |- store/               # Context state domains (pdf/editor/canvas/form/export/theme)
|  |- lib/                 # PDF operations, export pipeline, worker setup
|  |- i18n/                # Locale routing + request config
|  |- messages/            # en/th translation bundles
|  \- types/              # Shared type contracts
|- public/                 # Static assets, copied pdf worker
|- next.config.ts          # next-intl plugin + canvas alias workaround
\- copy-pdf-worker.mjs     # Postinstall worker copy
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Route/bootstrap issues | `src/app/[locale]/layout.tsx` | Provider order + locale wiring |
| File open/clear/zoom/page rotation | `src/store/PdfContext.tsx` | Highest fan-in state module |
| Canvas lifecycle, undo/redo restore | `src/store/CanvasContext.tsx` | Per-page canvas map + serialized states |
| Tool behavior (draw/ocr/measure/etc.) | `src/components/canvas/tools/` | Tool hooks own cursor + event handling |
| Page rendering + overlay stacking | `src/components/pdf/PdfViewer.tsx` | `react-pdf` layer + Fabric overlay |
| Export output correctness | `src/lib/exportPdf.ts` | Annotation embedding + form flattening |
| Page delete/reorder/split/merge | `src/lib/pdfOperations.ts` | Uses zero-based page indices |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `LocaleLayout` | function | `src/app/[locale]/layout.tsx` | app entry | Server layout + provider composition |
| `EditorPage` | function | `src/app/[locale]/page.tsx` | app entry | Chooses uploader vs viewer |
| `PdfProvider` | function | `src/store/PdfContext.tsx` | 16+ | Document/session/zoom/rotation state |
| `CanvasProvider` | function | `src/store/CanvasContext.tsx` | 8+ | Canvas registry + history + signature flow |
| `EditorProvider` | function | `src/store/EditorContext.tsx` | 9+ | Active tool + panel + mode state |
| `FabricCanvas` | function | `src/components/canvas/FabricCanvas.tsx` | 1 mount point | Fabric event bridge + tool orchestration |
| `exportPdf` | function | `src/lib/exportPdf.ts` | 1 | Final document generation pipeline |
| `useUndoRedo` | function | `src/hooks/useUndoRedo.ts` | 1 | Page-scoped history engine |

## CONVENTIONS
- Use `@/*` imports rooted at `src` (`tsconfig.json` paths).
- TypeScript runs in strict mode; avoid implicit widening and nullable assumptions.
- Locale routing is mandatory under `app/[locale]`; default locale is Thai.
- Fabric's `canvas` module is aliased/stubbed in both Turbopack and webpack.
- PDF worker file is expected at `public/pdf.worker.min.mjs` via postinstall script.
- Context composition order in layout is intentional: Theme -> Pdf -> Editor -> Canvas -> Form -> Export.

## ANTI-PATTERNS (THIS PROJECT)
- Calling `usePdf`, `useCanvas`, `useEditor`, `useForm`, `useTheme`, or `useExport` outside their providers.
- Writing non-PDF uploads into document state (`PdfUploader` blocks this).
- Mutating stored `ArrayBuffer` references directly; always copy (`slice(0)`) on store writes.
- Forgetting page-map remaps after reorder/delete (`remapCanvasPages`, `remapPageRotations`, `removePageRotations`).
- Leaving Fabric/DOM listeners attached after tool or component cleanup.

## UNIQUE STYLES
- Theme system is token-driven via `data-theme` (`base`, `light`, `dark`) with one global stylesheet.
- Canvas tools are implemented as composable hooks, activated by `activeTool` gates.
- Per-page editor state uses `Map<number, ...>` heavily (canvas, pointer, rotations, form values).
- PDF pages are rendered with delayed size measurement, then overlays mount only when size is known.

## COMMANDS
```bash
npm install        # includes postinstall worker copy
npm run dev
npm run build
npm start
npm run lint
```

## NOTES
- No test runner or CI workflow is currently configured in-repo.
- Root `README.md` is generic scaffold text; rely on source modules for behavior truth.
- `empty-module.ts` exists only to satisfy server/bundler canvas resolution.
