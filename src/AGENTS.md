# SOURCE KNOWLEDGE

## OVERVIEW
`src/` contains all runtime code: route entry, UI domains, context state, PDF ops, i18n config, and shared types.

## STRUCTURE
```text
src/
|- app/[locale]/      # App Router entry for localized routes
|- components/        # UI domains: layout, pdf, canvas, ui
|- store/             # Context providers + state transitions
|- lib/               # Pure helpers for PDF and export workflows
|- i18n/              # Locale routing/request/navigation helpers
|- messages/          # Translation JSON bundles
|- hooks/             # Shared hooks (history engine)
\- types/             # Global type contracts/constants
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| App bootstrap/provider order | `src/app/[locale]/layout.tsx` | Server layout + provider tree |
| Main page switch logic | `src/app/[locale]/page.tsx` | Uploader vs viewer gate |
| State shape/contracts | `src/types/index.ts` | Tool, editor, and pdf state types |
| Cross-domain context usage | `src/store/` | `usePdf` has highest fan-in |
| PDF algorithm logic | `src/lib/` | No React hooks inside this layer |
| Locale fallback behavior | `src/i18n/request.ts` | Default locale fallback to `th` |

## CONVENTIONS
- Prefer domain-local imports first, then shared `@/types`/`@/lib`.
- Keep `lib/` React-free; UI concerns stay in `components/` or `store/`.
- Keep one-based page numbers in UI/context, convert to zero-based only at PDF operation boundaries.
- Keep `messages/en.json` and `messages/th.json` key sets aligned.

## ANTI-PATTERNS
- Putting PDF mutation logic in components when `src/lib/pdfOperations.ts` already owns it.
- Bypassing context APIs to mutate shared state directly.
- Adding new route pages outside `app/[locale]` without locale routing consideration.
- Moving tool config types out of `src/types/index.ts` and duplicating shape definitions.
