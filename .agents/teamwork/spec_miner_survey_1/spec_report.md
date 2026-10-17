# Phase 9: Composite Block Components — Specification Mining Report

Authoritative References:
- `rdt/requirements.md` (Requirement 12: Composite Block Components)
- `rdt/design.md` (Section 6.6, 8.6: Motion & Composite Block Components)
- `rdt/tasks.md` (Phase 9: Tasks 9.1, 9.2, 9.3)
- `ORIGINAL_REQUEST.md` (Entry 2026-10-17T03:54:46Z)
- Codebase inspections: `ui/src/components/LogsViewer/`, `ui/src/components/Sidebar/`, `ui/src/utils/motion.ts`, `ui/src/components/CommandPalette/CommandPalette.ts`, `ui/src/components/Tabs/Tabs.ts`, `ui/src/components/Tooltip/Tooltip.ts`

---

## 1. Executive Summary

Phase 9 migrates two major composite block component families from legacy React/React Aria/StyleX into zero-React, standards-compliant Lit 3 Web Components:
1. **Logs Viewer & Pure Parser Utilities (`ui/src/components/LogsViewer/`)**:
   - `moul-logs-viewer` (`MoulLogsViewer`)
   - `moul-logs` (`MoulLogs`)
   - Pure parser utilities: `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, `SERVER_LOGS`
2. **10-Element Sidebar Compound Suite (`ui/src/components/Sidebar/`)**:
   - `moul-sidebar` (`MoulSidebar`)
   - `moul-sidebar-aside` (`MoulSidebarAside`)
   - `moul-sidebar-main` (`MoulSidebarMain`)
   - `moul-sidebar-header` (`MoulSidebarHeader`)
   - `moul-sidebar-brand` (`MoulSidebarBrand`)
   - `moul-sidebar-group` (`MoulSidebarGroup`)
   - `moul-sidebar-item` (`MoulSidebarItem`)
   - `moul-sidebar-divider` (`MoulSidebarDivider`)
   - `moul-sidebar-footer` (`MoulSidebarFooter`)
   - `moul-sidebar-user` (`MoulSidebarUser`)
   - Reactive state propagation via `@lit/context` (`sidebarContext`)
   - Height transition via pure CSS `grid-template-rows: 0fr` to `1fr` (no JS measurements)
   - Collapsed icon-only mode with automatic `<moul-tooltip>` label preview
   - Active item indicator gliding via `animateActiveIndicator` (`SPRING_SNAPPY`)
3. **Automated Verification Test Suite (`ui/src/components/Blocks.test.ts`)**:
   - Vitest test suite with Happy DOM covering all pure functions, element rendering, context propagation, keyboard navigation, events, and edge cases.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Pure Parser | `normalizeLogLevel` | Normalizes any raw log level string into standard `LogLevel` (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). | `levelStr?: string` | `LogLevel` ('info' default) | Strips non-alpha chars; unrecognized/empty string safely returns `'info'` | `parseLogs.ts:25`, `rdt/design.md §8.6` |
| 2 | Pure Parser | `parseAttributes` | Extracts structured key-value pairs (`key="val"`, `key='val'`, `key=val`) with type coercion (numbers, booleans, null). | `text: string` | `Record<string, string \| number \| boolean \| null>` | Ignores malformed pairs, unescapes quotes safely, non-numbers remain strings | `parseLogs.ts:34`, `rdt/design.md §8.6` |
| 3 | Pure Parser | `stripAttributes` | Strips key=value pairs from text to yield clean base log message. | `text: string` | `string` (trimmed clean text) | Safe on text without attributes (returns trimmed input) | `parseLogs.ts:73`, `rdt/design.md §8.6` |
| 4 | Pure Parser | `parseLogLine` | Parses a single log line supporting JSON objects, standard server.log format, and unstructured lines. | `rawLine: string, index = 0` | Structured `LogItem` | Empty string returns blank log item with default `'info'` level | `parseLogs.ts:81`, `rdt/design.md §8.6` |
| 5 | Pure Parser | `parseLogs` | Parses raw multiline text or array of strings/objects into a list of structured `LogItem[]`. | `string \| (LogItem \| string)[] \| undefined` | `LogItem[]` | Undefined/empty returns `[]`, ignores blank lines in strings | `parseLogs.ts:184`, `rdt/design.md §8.6` |
| 6 | Mock Data | `SERVER_LOG_RAW` | Benchmark 17-line server log text containing diverse log levels (INFO, DEBU, WARN, ERRO, FATA) and rich attributes. | None | `string` | Immutable constant | `exampleLogs.ts:4`, `rdt/design.md §8.6` |
| 7 | Mock Data | `SERVER_LOGS` | Pre-parsed benchmark array of 17 `LogItem` objects. | None | `LogItem[]` | Immutable array | `exampleLogs.ts:22`, `rdt/design.md §8.6` |
| 8 | Logs Component | `moul-logs-viewer` | Virtualized log viewer with search filtering, level radio pills, line wrapping, timestamps, and attribute expansion. | `logs: LogItem[]`, `filterLevel`, `searchQuery`, `showTimestamps`, `wrapLines` | Custom Element rendering table/list and toolbar | Empty matches render empty state message | `rdt/requirements.md §12.1`, `rdt/design.md §8.6` |
| 9 | Logs Component | Virtualized Rendering | Virtualizes large log lists using `@lit-labs/virtualizer` for smooth 60fps scrolling. | `LogItem[]` | Rendered virtual rows in viewport | In headless/zero-dimension tests, renders directly or gracefully handles DOM sizing | `rdt/requirements.md §12.1`, `CommandPalette.ts` |
| 10 | Logs Component | Filter Level Pill Motion | Glides active filter pill indicator when switching between `all`, `info`, `warn`, `error`, `debug`. | Click on filter pill | Animated indicator via `animateActiveIndicator` (`SPRING_SNAPPY`) | Collapses duration to 0 under `prefers-reduced-motion` | `rdt/design.md §8.6`, `motion.ts` |
| 11 | Logs Component | `moul-logs` | Companion custom element accepting raw string input, parsing via `parseLogs`, and passing to `moul-logs-viewer`. | `raw: string`, `filterLevel`, `searchQuery` | Custom Element wrapping `moul-logs-viewer` | Malformed/empty string safely yields empty viewer | `rdt/requirements.md §12.2`, `rdt/design.md §8.6` |
| 12 | Sidebar Compound | `sidebarContext` | `@lit/context` instance holding reactive layout, dense, collapsed, and selectedKey state. | `SidebarContextValue` | Context instance (`createContext(Symbol('moul-sidebar-context'))`) | Throws or warns if consumed outside provider without fallback | `rdt/requirements.md §12.6`, `rdt/design.md §8.6` |
| 13 | Sidebar Compound | `moul-sidebar` | Root sidebar container acting as `@lit/context` provider and dispatching selection events. | `layout`, `dense`, `collapsed`, `selectedKey` | Custom Element + `selectionchange` CustomEvent | Propagates updates down tree reactively | `rdt/requirements.md §12.4`, `rdt/design.md §8.6` |
| 14 | Sidebar Compound | `moul-sidebar-aside` | Semantic `<aside>` landmark housing header, groups, divider, and footer. | Slotted content, `aria-label` | Semantic landmark `<aside>` | Smooth width transition via `IOS_SHEET_CURVE` | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 15 | Sidebar Compound | `moul-sidebar-main` | Content area adjacent to aside; adapts to framed vs unframed layouts. | Slotted content | Semantic `<main>` or content area | Flush in sidebar-framed; bordered/padded in main-framed | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 16 | Sidebar Compound | `moul-sidebar-header` | Top container in aside with dense/collapsed height and padding adaptations. | Slotted logo/brand | `<header>` container | Centers content in collapsed mode | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 17 | Sidebar Compound | `moul-sidebar-brand` | Logo, title, subtitle presentation with collapse toggle button. | `title`, `subtitle`, `logo`, `href` | Slotted brand presentation | Fades out title/subtitle in collapsed mode, keeping logo centered | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 18 | Sidebar Compound | `moul-sidebar-group` | Section grouping with title, collapsible toggle, and chevron rotation. | `label` / `title`, `collapsible`, `collapsed` | Section container with toggle button | Keyboard accessible (Enter/Space) | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 19 | Sidebar Compound | Pure CSS Grid Collapse | Smooth group items height transition using `grid-template-rows: 0fr` to `1fr` with `overflow: clip`. | CSS property changes | Zero-JS CSS animated collapse | No JavaScript height measurements or layout thrashing | `rdt/requirements.md §12.7`, `rdt/design.md §8.6` |
| 20 | Sidebar Compound | `moul-sidebar-item` | Interactive navigation item with active indicator, link/button semantics, and badge. | `key`, `href`, `label`, `badge`, `isDisabled` | Interactive `<a>` or `<button>` | Disabled items prevent click/selection | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 21 | Sidebar Compound | Active Indicator Motion | Glides active selection indicator pill across items using FLIP deltas. | Selection changes | Indicator FLIP animation via `animateActiveIndicator` | Instant jump if `prefers-reduced-motion` | `rdt/design.md §8.6`, `motion.ts` |
| 22 | Sidebar Compound | Collapsed Tooltip Mode | Wraps button/link in `<moul-tooltip content=${label} placement="right">` when sidebar is collapsed. | Sidebar `collapsed: true` | Tooltip preview on hover/focus | Fallback tooltip text if label missing | `rdt/requirements.md §12.8`, `rdt/design.md §8.6` |
| 23 | Sidebar Compound | `moul-sidebar-divider` | Horizontal separator between groups or sections. | None | `<div role="separator" aria-orientation="horizontal">` | Adapts margins for dense and collapsed modes | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 24 | Sidebar Compound | `moul-sidebar-footer` | Sticky bottom container in aside. | Slotted user profile | `<footer>` container | Pinned to bottom via `margin-top: auto` | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 25 | Sidebar Compound | `moul-sidebar-user` | User avatar, name, and email profile widget. | `name`, `email`, `avatarSrc`, `status` | Profile layout with `<moul-avatar>` | Hides text in collapsed mode, showing only avatar | `rdt/requirements.md §12.5`, `rdt/design.md §8.6` |
| 26 | Registration | Idempotent Registration | All 12 elements registered via `defineElement` without throwing or duplicate warnings. | `tagName`, `constructor` | Custom element defined in registry | Safe if imported multiple times | `ui/src/utils/define-element.ts` |

---

## 3. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `normalizeLogLevel` | `undefined`, `null`, `""`, `"   "` | Returns default `'info'`. |
| 2 | `normalizeLogLevel` | Mixed case non-standard words e.g. `"WARNING"`, `"ERRO"`, `"fata"`, `"CRIT"`, `"panic"` | Correctly maps to standard `'warn'`, `'error'`, `'fatal'`. |
| 3 | `normalizeLogLevel` | Enclosed in brackets e.g. `"[WARN]"` | Strips non-alpha characters and returns `'warn'`. |
| 4 | `parseAttributes` | Values with spaces enclosed in quotes e.g. `err="dial tcp: host not found"` | Correctly preserves spaces inside quotes: `{ err: 'dial tcp: host not found' }`. |
| 5 | `parseAttributes` | Escaped quotes inside quoted strings e.g. `msg="hello \\"world\\""` | Unescapes escaped quotes: `{ msg: 'hello "world"' }`. |
| 6 | `parseAttributes` | Boolean literals `is_cached=true`, `debug=false` | Coerces to native booleans `true` and `false`. |
| 7 | `parseAttributes` | Numeric values `status=200`, `latency=14.85` | Coerces numeric strings to numbers `200` and `14.85` while preserving units like `"182.4µs"` as string. |
| 8 | `parseAttributes` | Empty attribute string `""` or string without attributes | Returns empty object `{}`. |
| 9 | `stripAttributes` | Text with multiple attributes at the end | Strips all `key=val` pairs and returns trimmed leading message text. |
| 10 | `stripAttributes` | Text with no attributes | Returns the original trimmed string unchanged. |
| 11 | `parseLogLine` | Empty line or whitespace-only line `""` / `"   "` | Returns `{ id: 'log-${index}', lineNumber: index + 1, message: '', raw: line, level: 'info' }`. |
| 12 | `parseLogLine` | JSON line with non-standard level field e.g. `{"severity": "warn", "msg": "Low disk space"}` | Extracts level `'warn'`, message `'Low disk space'`, remaining keys into `attributes`. |
| 13 | `parseLogLine` | JSON line without message field e.g. `{"count": 5}` | Converts entire object JSON to message or string representation. |
| 14 | `parseLogLine` | Malformed JSON starting with `{` but invalid syntax e.g. `{"broken json` | Gracefully catches JSON parse error and falls back to standard/unstructured parsing. |
| 15 | `parseLogLine` | Bracketed timestamp format `"[2026-08-19 11:16:49] [INFO] Server started"` | Correctly parses timestamp, level `'info'`, and message `'Server started'`. |
| 16 | `parseLogs` | Multiline string with mixed Windows `\r\n` and Unix `\n` line endings | Splits cleanly, filters out empty lines, and preserves accurate line numbers. |
| 17 | `parseLogs` | Array input with mixture of string items and partial `LogItem` objects | Normalizes objects (ensuring `id`, `lineNumber`, `level`) and parses string items. |
| 18 | `moul-logs-viewer` | Search query matching message text | Filters rows to only those containing search query (case-insensitive). |
| 19 | `moul-logs-viewer` | Search query matching attribute key or value e.g. `"alex@example.com"` | Matches and keeps the row visible. |
| 20 | `moul-logs-viewer` | Search query matching zero logs | Shows empty state "No logs match your filter criteria". |
| 21 | `moul-logs-viewer` | Level filter set to `'error'` | Includes both `'error'` and `'fatal'` logs (e.g. 4 events from `SERVER_LOGS`). |
| 22 | `moul-logs-viewer` | Toggling `showTimestamps` from true to false | Hides timestamp column/cells across all rendered rows. |
| 23 | `moul-logs-viewer` | Toggling `wrapLines` from false to true | Applies CSS white-space wrapping (`pre-wrap` or `normal`) to message cells. |
| 24 | `moul-logs` | Empty `raw` property but text inside slot `<moul-logs>raw log text</moul-logs>` | Reads slotted text, parses logs, and displays rows in inner viewer. |
| 25 | `moul-sidebar` | Setting `dense=true` on `moul-sidebar` | Subcomponents (`aside`, `header`, `group`, `item`, `divider`, `footer`, `user`) automatically receive `dense=true` via `@lit/context`. |
| 26 | `moul-sidebar` | Setting `collapsed=true` on `moul-sidebar` | Descendants reactively adopt collapsed styles; labels hide; tooltips activate on items. |
| 27 | `moul-sidebar` | Clicking an item when sidebar has `selectedKey` set | Item calls `selectItem(key)`, updates context, and fires `selectionchange` on `moul-sidebar`. |
| 28 | `moul-sidebar-group` | Clicking collapsible group header when `collapsible=true` | Toggles `collapsed` state; CSS grid transitions `grid-template-rows` between `1fr` and `0fr`. |
| 29 | `moul-sidebar-group` | Pressing Enter or Space on group header button | Toggles `collapsed` state without triggering unintended page scrolling. |
| 30 | `moul-sidebar-item` | Item has `is-disabled=true` | Pointer events suppressed, click does not update selection or fire events. |
| 31 | `moul-sidebar-item` | Item in collapsed sidebar mode | Renders `<moul-tooltip content=${label}>` trigger; hovering shows tooltip. |
| 32 | `moul-sidebar-item` | Item in expanded sidebar mode | Tooltip wrapper inactive or absent; label rendered beside icon. |
| 33 | `moul-sidebar-user` | Collapsed mode | Hides name and email, rendering only avatar centered in container. |
| 34 | `moul-sidebar-brand` | Collapsed mode | Hides brand title and subtitle, keeping logo centered. |
| 35 | Redundant imports | Importing `@moul-dev/ui` multiple times | Idempotent `defineElement` prevents duplicate custom element errors. |

---

## 4. Architectural & Component Contracts

### 4.1 Pure Log Parser Exports
Module: `ui/src/components/LogsViewer/parseLogs.ts` and `exampleLogs.ts`

```ts
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
export type LogFilterLevel = LogLevel | 'all'

export interface LogItem {
  id: string | number
  lineNumber?: number
  timestamp?: string
  level?: LogLevel | string
  message: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  raw?: string
}

export function normalizeLogLevel(levelStr?: string): LogLevel
export function parseAttributes(text: string): Record<string, string | number | boolean | null>
export function stripAttributes(text: string): string
export function parseLogLine(rawLine: string, index?: number): LogItem
export function parseLogs(input?: string | (LogItem | string)[]): LogItem[]
export const SERVER_LOG_RAW: string
export const SERVER_LOGS: LogItem[]
```

### 4.2 `moul-logs-viewer` Custom Element Contract
- **Element Tag:** `<moul-logs-viewer>`
- **Class:** `MoulLogsViewer extends LitElement`
- **Properties / Attributes:**
  - `logs: LogItem[] = []` (`attribute: false`)
  - `filterLevel: LogFilterLevel = 'all'` (`filter-level`, reflect: true)
  - `searchQuery: string = ''` (`search-query`, reflect: true)
  - `showTimestamps: boolean = true` (`show-timestamps`, type: Boolean, reflect: true)
  - `wrapLines: boolean = false` (`wrap-lines`, type: Boolean, reflect: true)
  - `showToolbar: boolean = true` (`show-toolbar`, type: Boolean, reflect: true)
  - `showLineNumbers: boolean = true` (`show-line-numbers`, type: Boolean, reflect: true)
  - `showLevels: boolean = true` (`show-levels`, type: Boolean, reflect: true)
  - `compact: boolean = false` (`compact`, type: Boolean, reflect: true)
  - `maxHeight?: string` (`max-height`, reflect: true)
  - `selectedId?: string | number` (`selected-id`, reflect: true)
- **CSS Shadow DOM Parts:**
  - `base`: container
  - `toolbar`: filter and search toolbar
  - `search`: search input wrapper
  - `filter-group`: level filter pill group
  - `filter-pill`: individual level radio pill
  - `filter-indicator`: animated active filter pill indicator
  - `table`: logs table / virtual list
  - `row`: log item row
  - `cell-line`: line number cell
  - `cell-time`: timestamp cell
  - `cell-level`: severity level badge
  - `cell-message`: log message cell
  - `chip`: attribute chip
  - `empty`: empty results view
- **Events:**
  - `filterchange`: `{ detail: { filterLevel: LogFilterLevel, searchQuery: string } }`
  - `logselect`: `{ detail: { log: LogItem } }`
  - `clear`: `{ detail: {} }`

### 4.3 `moul-logs` Companion Element Contract
- **Element Tag:** `<moul-logs>`
- **Class:** `MoulLogs extends LitElement`
- **Properties / Attributes:**
  - `raw: string = ''` (`raw`, reflect: true)
  - `filterLevel: LogFilterLevel = 'all'` (`filter-level`, reflect: true)
  - `searchQuery: string = ''` (`search-query`, reflect: true)
  - `showTimestamps: boolean = true` (`show-timestamps`, type: Boolean, reflect: true)
  - `wrapLines: boolean = false` (`wrap-lines`, type: Boolean, reflect: true)
- **Behavior:**
  - Automatically parses `this.raw` (or slotted text if `this.raw` is empty) via `parseLogs()`.
  - Forwards the parsed array to internal `<moul-logs-viewer>`.

---

### 4.4 Sidebar Context Architecture (`@lit/context`)
Module: `ui/src/components/Sidebar/context.ts`

```ts
import { createContext } from '@lit/context'

export interface SidebarContextValue {
  dense: boolean
  collapsed: boolean
  selectedKey: string
  layout: 'sidebar-framed' | 'main-framed'
  selectItem: (key: string) => void
}

export const sidebarContext = createContext<SidebarContextValue>(
  Symbol('moul-sidebar-context'),
)
```

- **Provider:** `MoulSidebar` provides `sidebarContext` to the DOM subtree.
- **Consumers:** All 9 companion elements subscribe via `ContextConsumer` / `@consume({ context: sidebarContext, subscribe: true })`.

---

### 4.5 10-Element Sidebar Compound Suite Contracts

#### 1. `moul-sidebar` (`MoulSidebar`)
- Tag: `moul-sidebar`
- Properties:
  - `layout: 'sidebar-framed' | 'main-framed' = 'sidebar-framed'` (`layout`, reflect: true)
  - `dense: boolean = false` (`dense`, type: Boolean, reflect: true)
  - `collapsed: boolean = false` (`collapsed`, type: Boolean, reflect: true)
  - `selectedKey: string = ''` (`selected-key`, reflect: true)
- Methods:
  - `selectItem(key: string): void`: updates `selectedKey` and emits `selectionchange`.
- Events:
  - `selectionchange`: `CustomEvent<{ selectedKey: string }>` (bubbles: true, composed: true).

#### 2. `moul-sidebar-aside` (`MoulSidebarAside`)
- Tag: `moul-sidebar-aside`
- Properties:
  - `ariaLabel: string = 'Main Navigation'` (`aria-label`)
  - Subscribes to `sidebarContext` (reflects `collapsed`, `dense` to host).
- Styles:
  - Semantic `<aside>` landmark.
  - Width transitions smoothly: `var(--sidebar-width, 260px)` (expanded) vs `var(--sidebar-collapsed-width, 72px)` (collapsed).
  - Uses `IOS_SHEET_CURVE` (`cubic-bezier(0.32, 0.72, 0, 1)`).

#### 3. `moul-sidebar-main` (`MoulSidebarMain`)
- Tag: `moul-sidebar-main`
- Properties: Subscribes to `sidebarContext`.
- Styles:
  - In `layout="main-framed"`: framed margins (`var(--spacing-3)`), rounded borders (`var(--radius-lg)`), background (`var(--color-bg-subtle)`), border (`1px solid var(--color-border)`).
  - In `layout="sidebar-framed"`: flush / unframed content.

#### 4. `moul-sidebar-header` (`MoulSidebarHeader`)
- Tag: `moul-sidebar-header`
- Properties: Subscribes to `sidebarContext`.
- Height: 64px (dense: 48px).
- In collapsed mode: center aligned with compact padding.

#### 5. `moul-sidebar-brand` (`MoulSidebarBrand`)
- Tag: `moul-sidebar-brand`
- Properties:
  - `title: string = ''` (`title`)
  - `subtitle: string = ''` (`subtitle`)
  - `logo: string = ''` (`logo`)
  - `href: string = ''` (`href`)
- Slotted elements:
  - Slot `logo`: custom icon/logo element.
  - Default slot: brand title and subtitle fallback.
- In collapsed mode: title and subtitle are hidden; logo remains visible and centered.

#### 6. `moul-sidebar-group` (`MoulSidebarGroup`)
- Tag: `moul-sidebar-group`
- Properties:
  - `label: string = ''` (`label` / `title`)
  - `collapsible: boolean = false` (`collapsible`, type: Boolean, reflect: true)
  - `collapsed: boolean = false` (`collapsed`, type: Boolean, reflect: true)
- **Pure CSS Grid Collapse Specification (Requirement 12.7)**:
  - Slotted items wrapped in `.group-items`:
    ```css
    .group-items {
      display: grid;
      transition: grid-template-rows 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
    }
    :host([collapsed]) .group-items,
    .group-items.collapsed {
      grid-template-rows: 0fr;
      opacity: 0;
      pointer-events: none;
    }
    :host(:not([collapsed])) .group-items,
    .group-items.expanded {
      grid-template-rows: 1fr;
      opacity: 1;
    }
    .group-items-inner {
      min-height: 0;
      overflow: clip;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1);
    }
    ```
  - Zero JavaScript height measurements (`getBoundingClientRect().height` is forbidden for collapse).
- Header & Chevron:
  - Header button toggles `collapsed` on click and Enter/Space.
  - Chevron icon rotates (`collapsed ? -90 : 0` or `0 : 90`) via `subtleAnimate` / CSS.

#### 7. `moul-sidebar-item` (`MoulSidebarItem`)
- Tag: `moul-sidebar-item`
- Properties:
  - `key: string = ''` (`key` / `id`)
  - `href: string = ''` (`href`)
  - `label: string = ''` (`label`)
  - `badge: string = ''` (`badge`)
  - `isDisabled: boolean = false` (`is-disabled`, type: Boolean, reflect: true)
  - `isSelected: boolean = false` (`is-selected`, type: Boolean, reflect: true)
- Computed Active State:
  - `isSelected = Boolean(this.key && this.sidebarContext?.selectedKey === this.key)`
  - Active ARIA: `aria-current="page"` when `href` is present, or `aria-selected="true"`.
- Events:
  - Click/Press invokes `this.sidebarContext?.selectItem(this.key)`.
- **Active Indicator Animation**:
  - Glides active indicator pill between items using `animateActiveIndicator(indicator, prevRect, nextRect)` with `SPRING_SNAPPY`.
- **Collapsed Tooltip Mode (Requirement 12.8)**:
  - When `sidebarContext.collapsed === true`:
    - Button/link is wrapped inside `<moul-tooltip content=${this.label} placement="right">`.
    - Text label is hidden; only icon is shown.
    - Hovering or focusing displays label tooltip to user.

#### 8. `moul-sidebar-divider` (`MoulSidebarDivider`)
- Tag: `moul-sidebar-divider`
- Attributes: `role="separator"`, `aria-orientation="horizontal"`.
- Responsive padding/margins in dense and collapsed modes.

#### 9. `moul-sidebar-footer` (`MoulSidebarFooter`)
- Tag: `moul-sidebar-footer`
- Height: 64px (dense: 48px), `margin-top: auto` (sticky bottom).
- Centers items in collapsed mode.

#### 10. `moul-sidebar-user` (`MoulSidebarUser`)
- Tag: `moul-sidebar-user`
- Properties:
  - `name: string = ''` (`name`)
  - `email: string = ''` (`email` / `description`)
  - `avatarSrc: string = ''` (`avatar-src`)
  - `status?: string` (`status`)
- Shadow DOM:
  - Renders `<moul-avatar src=${this.avatarSrc} name=${this.name}>`.
  - In expanded mode: renders name and email.
  - In collapsed mode: hides name and email, rendering only avatar centered.

---

## 5. Verification Test Suite Matrix (`ui/src/components/Blocks.test.ts`)

| Test Suite / Category | Test Case ID | Description | Assertion Check |
|-----------------------|--------------|-------------|-----------------|
| **Pure Log Parsers** | `LOG-PARSE-01` | `normalizeLogLevel` handles all standard and non-standard levels | Maps INFO, DEBU, WARN, WARNING, ERRO, ERROR, FATA, FATAL, TRACE, and unknown |
| | `LOG-PARSE-02` | `parseAttributes` extracts quoted, single-quoted, and unquoted values | Coerces booleans, numbers, null, and leaves strings |
| | `LOG-PARSE-03` | `stripAttributes` cleans message text | Strips `key=val` pairs and returns trimmed message |
| | `LOG-PARSE-04` | `parseLogLine` parses JSON formatted log lines | Extracts level, timestamp, message, and attributes |
| | `LOG-PARSE-05` | `parseLogLine` parses standard server.log format | Extracts bracketed/unbracketed timestamp, level, message |
| | `LOG-PARSE-06` | `parseLogs` processes raw multiline string | Returns correct count of `LogItem[]` with line numbers |
| | `LOG-PARSE-07` | `SERVER_LOG_RAW` and `SERVER_LOGS` integration | Matches expected 17 log events and attributes |
| **`moul-logs-viewer` & `moul-logs`** | `LOG-VIEW-01` | Renders log list with line numbers, levels, timestamps | DOM contains table rows for each log item |
| | `LOG-VIEW-02` | Search filtering | Typing query filters rows to matching messages/attributes |
| | `LOG-VIEW-03` | Level filter pills | Clicking 'error' filters to error and fatal rows |
| | `LOG-VIEW-04` | Timestamp toggle | Toggling `show-timestamps` hides/shows timestamp column |
| | `LOG-VIEW-05` | Empty state | Query with no matches displays empty state message |
| | `LOG-VIEW-06` | Companion `moul-logs` renders from raw string | `<moul-logs raw="...">` parses and renders inner viewer |
| **Sidebar Context Propagation** | `SIDEBAR-CTX-01` | `dense` prop propagates to all child elements | Setting `dense=true` on `moul-sidebar` reflects on aside, header, group, items |
| | `SIDEBAR-CTX-02` | `collapsed` prop propagates to all child elements | Setting `collapsed=true` reflects on aside, brand, group, items, user |
| | `SIDEBAR-CTX-03` | `selectedKey` prop propagates to items | Item with matching key receives `isSelected=true` |
| | `SIDEBAR-CTX-04` | `layout` prop propagates and updates styling | Switching `sidebar-framed` vs `main-framed` updates classes |
| **Sidebar Group Collapse** | `SIDEBAR-GRP-01` | Pure CSS Grid collapse structure | Slotted items wrapped in `.group-items` with `grid-template-rows: 0fr/1fr` |
| | `SIDEBAR-GRP-02` | Toggle group collapse via click | Clicking group header toggles `collapsed` attribute and chevron |
| | `SIDEBAR-GRP-03` | Toggle group collapse via keyboard | Pressing Enter or Space on group header toggles collapse |
| **Sidebar Item & Selection** | `SIDEBAR-ITEM-01` | Item click dispatches `selectionchange` event | Dispatches event on `moul-sidebar` with `{ detail: { selectedKey } }` |
| | `SIDEBAR-ITEM-02` | Active item ARIA attributes | Selected item with href gets `aria-current="page"` |
| | `SIDEBAR-ITEM-03` | Disabled item behavior | Item with `is-disabled` cannot be selected or clicked |
| | `SIDEBAR-ITEM-04` | Collapsed mode tooltip wrapping | When sidebar is collapsed, item renders `<moul-tooltip>` |
| **Sidebar Brand & User** | `SIDEBAR-BRAND-01` | Brand hides title/subtitle when collapsed | Brand logo remains visible, text is hidden |
| | `SIDEBAR-USER-01` | User hides name/email when collapsed | Avatar remains visible, user details hidden |
| **Registration & Hygiene** | `BLOCKS-REG-01` | Idempotent custom element registration | All 12 elements defined via `defineElement` without errors |
| | `BLOCKS-REACT-01` | Zero React / StyleX imports | Passes `verify-no-react.ts` |
