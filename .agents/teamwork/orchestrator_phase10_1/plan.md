# Execution Plan — Phase 10

## Overview
Phase 10 of @moul-dev/ui Web Components rebuild:
1. Survey Phase (Complete)
2. Milestone 1: Public Entry Point (`ui/src/index.ts`) & Tag Map Augmentation
3. Milestone 2: Legacy React Purge & Lit Sandbox Kitchen Sink Rebuild
4. Milestone 3: CEM Schema v2 Plugin, Foundation Contract Tests, and Full Build & Test Verification

## Milestone 1: Public Entry Point (`ui/src/index.ts`)
- **Objectives**:
  - Fix missing type imports for Category 1 Chart classes in `ui/src/index.ts` so `HTMLElementTagNameMap` compiles.
  - Export all 54 component classes and companion elements (77 custom elements).
  - Export all 5 reactive controllers (`PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`).
  - Export `toastQueue`, `generatePagination`, and all pure log parser utilities.
  - Export chart types and helpers (`ChartSeries`, `DoughnutDataItem`, `PointHoverDetail`, `CHART_COLORS`, `getChartColor`, `ViewportResizeDetail`, etc.).
  - Remove legacy React exports (`Autocomplete`, `Description`, `Label`) and phantom types.
  - Augment `HTMLElementTagNameMap` with all 77 tags.
- **Workflow**: Worker -> Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate Check.

## Milestone 2: Legacy React Purge & Lit Sandbox Rebuild
- **Objectives**:
  - Delete 8 scheduled legacy files: `App.tsx`, `main.tsx`, `ThemeProvider.tsx`, `tokens.stylex.ts`, `ThemeProvider.test.tsx`, `utils.test.tsx`, `Autocomplete.test.tsx`, `ListBox.test.tsx`.
  - Delete remaining legacy React files: `sandbox/` directory, `mergeProps.ts`, `warnMissingLabel.ts`, and legacy directories `Autocomplete/`, `ListBox/`, `DateField/`, `Description/`, `ErrorMessage/`, `FieldError/`, `Label/`.
  - Rebuild `ui/index.html` to link `style.css` and load `sandbox.ts`.
  - Author `ui/src/sandbox.ts` in pure Lit/HTML showcasing all 6 component categories.
- **Workflow**: Worker -> Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate Check.

## Milestone 3: CEM Schema v2 Plugin, Foundation Contract Tests & Verification
- **Objectives**:
  - Update `ui/custom-elements-manifest.config.mjs` with AST plugin to resolve `defineElement` and emit `tagName` for all 77 custom elements in `dist/custom-elements.json`.
  - Author `ui/src/components/Foundation.test.ts` testing export completeness, registration idempotency, and zero React imports.
  - Run full verification: `bun run build:ui` (exit code 0), `bun run test` (0 failed suites), `bun run lint` (0 errors).
- **Workflow**: Worker -> Reviewers (2) + Challengers (2) + Forensic Auditor (1) -> Gate Check.

## Final Milestone Completion
- Verify full monorepo health, write handoff, notify Sentinel.
