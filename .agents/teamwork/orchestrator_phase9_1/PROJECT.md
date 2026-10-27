# Project: Phase 9 Lit Web Components Migration (Composite Block Components)

## Architecture
- Category 6: Composite Block Components for `@moul-dev/ui`.
- Module boundaries:
  1. `ui/src/components/LogsViewer/`: Pure log parser utilities and Lit custom elements `moul-logs-viewer` and `moul-logs`.
  2. `ui/src/components/Sidebar/`: 10-element compound Sidebar suite (`moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user`) using `@lit/context` and pure CSS grid collapse.
  3. `ui/src/components/Blocks.test.ts`: Unified Vitest test suite for composite block components.
  4. Monorepo exports & verification: `ui/src/index.ts`, `scripts/verify-no-react.ts`, `rdt/tasks.md`.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Pure Parser Utilities | `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, `SERVER_LOGS` exported from `ui/src/components/LogsViewer/` | M1 | Req 12.3, Task 9.1 | DONE |
| 2 | `moul-logs-viewer` | Lit custom element with virtualization (@lit-labs/virtualizer), search, log level filtering (`all`, `info`, `warn`, `error`, `debug`), timestamp toggling, line wrapping, animated indicator pills | M1 | Req 12.1, Task 9.1 | DONE |
| 3 | `moul-logs` | Companion Lit custom element parsing raw log string input and rendering inside `moul-logs-viewer` | M1 | Req 12.2, Task 9.1 | DONE |
| 4 | Legacy Purge (Logs) | Remove React/StyleX code (`Logs.tsx`, `Logs.styles.ts`, `Logs.test.tsx`), refactor `Logs.types.ts` | M1 | Req 1, Task 9.1 | DONE |
| 5 | Compound Sidebar Elements (10) | `moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user` | M2 | Req 12.5, Task 9.2 | DONE |
| 6 | `@lit/context` Propagation | Context distribution (`SidebarContextValue`: `dense`, `collapsed`, `selectedKey`, `layout`) from `moul-sidebar` down to all descendants | M2 | Req 12.6, Task 9.2 | DONE |
| 7 | Pure CSS Grid Collapse | `moul-sidebar-group` collapsible height transition using `grid-template-rows: 0fr` to `1fr` with inner `overflow: clip` (zero JS measurements) | M2 | Req 12.7, Task 9.2 | DONE |
| 8 | Collapsed Tooltip Display | In collapsed icon-only mode, `moul-sidebar-item` wraps trigger in `<moul-tooltip content=${label} placement="right">` | M2 | Req 12.8, Task 9.2 | DONE |
| 9 | Active Indicator & Events | Active selection indicator pill animated with `animateActiveIndicator` (`SPRING_SNAPPY`), dispatches `selectionchange` `{ detail: { selectedKey } }` | M2 | Req 12.4, Task 9.2 | DONE |
| 10 | Legacy Purge (Sidebar) | Remove React/StyleX code (`Sidebar.tsx`, `Sidebar.styles.ts`, `Sidebar.test.tsx`), author Lit styles | M2 | Req 1, Task 9.2 | DONE |
| 11 | Composite Blocks Test Suite | `ui/src/components/Blocks.test.ts` covering parsers, viewer, sidebar context, grid collapse, tooltips, selection (41/41 passing) | M3 | Req 12, Task 9.3 | DONE |
| 12 | Zero-React & Barrel Verification | `scripts/verify-no-react.ts all` passes (0 violations), exports in `ui/src/index.ts`, marked Phase 9 in `rdt/tasks.md` | M3 | Req 1, Task 9.3 | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Logs Viewer & Pure Parsers | `ui/src/components/LogsViewer/` Lit implementation, pure parsers, types, styles, purge legacy React files | Survey complete | DONE |
| 2 | M2: Compound Sidebar Suite | `ui/src/components/Sidebar/` 10-element Lit compound suite with `@lit/context`, CSS grid collapse, tooltips, active indicator, purge legacy React files | M1 complete | DONE |
| 3 | M3: Blocks Test Suite & Integration | `ui/src/components/Blocks.test.ts`, `ui/src/index.ts` exports, `scripts/verify-no-react.ts`, `rdt/tasks.md` | M1, M2 | DONE |

## Code Layout
- `ui/src/components/LogsViewer/`:
  - `parseLogs.ts` (pure log parser utilities)
  - `exampleLogs.ts` (sample data constants)
  - `Logs.types.ts` (pure TypeScript interfaces)
  - `LogsViewer.styles.ts` (Lit styles using design tokens)
  - `LogsViewer.ts` (`moul-logs-viewer` Lit custom element)
  - `Logs.ts` (`moul-logs` Lit custom element)
  - `LogsViewer.test.ts` (unit tests)
  - `index.ts` (barrel export)
- `ui/src/components/Sidebar/`:
  - `Sidebar.types.ts` (`SidebarContextValue`, props, types)
  - `Sidebar.context.ts` (`sidebarContext` via `createContext`)
  - `Sidebar.styles.ts` (Lit styles for all 10 compound elements)
  - `Sidebar.ts` (`moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user`)
  - `Sidebar.test.ts` (unit tests)
  - `index.ts` (barrel export)
- `ui/src/components/Blocks.test.ts` (Comprehensive Vitest test suite - 41 tests)
- `ui/src/index.ts` (Main package barrel export)
