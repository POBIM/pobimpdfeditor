# LIB DOMAIN

## OVERVIEW
Pure PDF operations and export pipeline. No React hooks, no UI concerns.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Page delete/reorder/split/merge | `pdfOperations.ts` | Uses zero-based indices |
| Export with annotations | `exportPdf.ts` | Embeds Fabric overlays onto PDF pages |
| Form field flattening | `exportPdf.ts:applyFormFieldValue()` | Handles text, checkbox, radio |
| Async PDF processing | `pdfWorker.ts` | Web worker for heavy ops |
| File download trigger | `downloadHelper.ts` | Blob + anchor pattern |

## EXPORTS
```
pdfOperations.ts
  - deletePages(bytes, pageIndices): Promise<Uint8Array>
  - reorderPages(bytes, newOrder): Promise<Uint8Array>
  - rotatePage(bytes, pageIndex, degrees): Promise<Uint8Array>
  - splitPdf(bytes, indices): Promise<{ bytes, pageCount }>
  - extractPageRange(bytes, lower, upper): Promise<Uint8Array>
  - mergePdfs(pdfBytesArray): Promise<Uint8Array>

exportPdf.ts
  - exportPdf(params: ExportParams): Promise<Uint8Array>
  - ExportProgressState (interface)
  - ExportProgressStep (enum: preparing, rotating, rendering, embedding, saving)

downloadHelper.ts
  - downloadFile(blob, filename): void
```

## CONVENTIONS
- All functions are `async` and return `Uint8Array` for PDF bytes
- Page indices are zero-based at this layer (convert from one-based at call sites)
- Always copy input `ArrayBuffer` before mutation: `new Uint8Array(bytes).slice()`
- Export progress uses callback pattern: `onProgress(state: ExportProgressState)`

## ANTI-PATTERNS
- Importing React hooks in lib files
- Mutating input byte arrays in place
- Using one-based page numbers without conversion
