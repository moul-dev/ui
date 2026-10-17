# Scope: Phase 10 — Public API Entry Point, Sandbox Kitchen Sink, Legacy Purge & Build Verification

## Architecture
- **Single Public Entry Point (`ui/src/index.ts`)**: Pure TypeScript entry point exporting all 54 component families (77 unique Lit custom elements), 5 reactive controllers, `toastQueue`, `generatePagination`, and pure log parsing utilities. Augments `HTMLElementTagNameMap` with all 77 `moul-*` tags. Zero React or StyleX imports.
- **Pure Web Components Sandbox (`ui/index.html` & `ui/src/sandbox.ts`)**: Interactive kitchen-sink playground built purely with Lit and native HTML. Uses `<moul-sidebar>` layout and showcases all 6 component categories (Actions, Surfaces, Overlays, Forms, Charts, Blocks) with interactive state and light/dark theme toggling.
- **Legacy Purge**: Complete deletion of obsolete React components, StyleX tokens, test files, and utilities.
- **Build & Analyzer Pipeline**: Vite library build with `"use client";` banner, CSS token bundle `dist/assets/style.css`, TypeScript declaration bundle `dist/src/index.d.ts`, and Custom Elements Manifest `dist/custom-elements.json` with AST plugin mapping `defineElement` to valid tag names for all custom elements.
- **Contract Verification (`ui/src/components/Foundation.test.ts`)**: Vitest test suite testing export contracts, registration idempotency, and absence of React dependencies.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Single Public Entrypoint Exports | Export 54 component classes, companion elements, types, controllers, utils | M1 | ORIGINAL_REQUEST R1 |
| 2 | Tag Map Augmentation | Augment `HTMLElementTagNameMap` with all 77 custom element tags | M1 | ORIGINAL_REQUEST R1 |
| 3 | Clean Lingering Exports | Remove legacy React exports (Autocomplete, Label, Description) & phantom types | M1 | ORIGINAL_REQUEST R1 |
| 4 | Legacy React Files Purge | Delete App.tsx, main.tsx, ThemeProvider.tsx, tokens.stylex.ts, legacy test files & remnants | M2 | ORIGINAL_REQUEST R2 |
| 5 | Sandbox HTML & Dev Entry | Rebuild `ui/index.html` to link style.css and load sandbox.ts | M2 | ORIGINAL_REQUEST R2 |
| 6 | Interactive Lit Kitchen Sink | Rebuild `ui/src/sandbox.ts` showcasing all 6 component categories | M2 | ORIGINAL_REQUEST R2 |
| 7 | CEM Manifest AST Plugin | Configure `ui/custom-elements-manifest.config.mjs` plugin for `defineElement` | M3 | ORIGINAL_REQUEST R3 |
| 8 | Foundation Contract Tests | Implement `ui/src/components/Foundation.test.ts` for export & registration contracts | M3 | ORIGINAL_REQUEST R3 |
| 9 | Build & Test Pipeline Verification | Verify `bun run build:ui`, `bun run test` (100% pass), and `bun run lint` (0 errors) | M3 | ORIGINAL_REQUEST R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Public Entry Point & Tag Augmentation | Update `ui/src/index.ts` to export all classes, controllers, utils, types, and augment `HTMLElementTagNameMap` | None | DONE |
| 2 | M2: Legacy React Purge & Sandbox Rebuild | Purge all legacy React files/tests/remnants; rebuild `ui/index.html` and `ui/src/sandbox.ts` | M1 | DONE |
| 3 | M3: CEM Plugin, Contract Tests & Build Verification | Configure CEM AST plugin in `custom-elements-manifest.config.mjs`, create `Foundation.test.ts`, run full build & test verification | M2 | DONE |

## Interface Contracts
### `ui/src/index.ts` ↔ Consumers & Docs
- Exports all 77 custom element classes with `Moul` prefix (e.g., `MoulButton`, `MoulModal`, `MoulLineChart`, `MoulSidebar`).
- Exports 5 reactive controllers: `PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`.
- Exports singleton `toastQueue` and helper `generatePagination`.
- Exports log utilities: `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, `SERVER_LOGS`.
- Global interface `HTMLElementTagNameMap` augmented with all 77 tags mapped to their exact LitElement classes.

### `ui/src/sandbox.ts` ↔ Vite Dev Server (`bun run dev:ui`)
- Mounts custom element `<moul-sandbox>` into `ui/index.html`.
- Loads `ui/src/styles/style.css` for design tokens.
- Zero React or JSX dependencies.

### `ui/custom-elements-manifest.config.mjs` ↔ CEM Analyzer
- Intercepts `defineElement(tagName, className)` AST calls to populate `tagName` and `custom-element-definition` exports in `dist/custom-elements.json`.

## Code Layout
- `ui/src/index.ts` — Main library entry point
- `ui/src/sandbox.ts` — Vanilla HTML / Lit sandbox application
- `ui/index.html` — Sandbox HTML host page
- `ui/custom-elements-manifest.config.mjs` — CEM analyzer configuration with AST plugin
- `ui/src/components/Foundation.test.ts` — Contract and idempotency test suite
