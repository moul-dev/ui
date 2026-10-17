# Phase 9 LogsViewer Survey & Implementation Strategy

## 1. Executive Summary

This report delivers a comprehensive technical investigation of the **LogsViewer** component family within `@moul-dev/ui` in preparation for Phase 9 of the Lit Web Components rebuild.

The existing implementation in `ui/src/components/LogsViewer/` is heavily coupled to legacy React 19, React Aria Components, StyleX, Phosphor Icons React, and React Testing Library. However, the core log parsing utilities (`parseLogs.ts`) and mock data (`exampleLogs.ts`) are completely pure TypeScript and can be preserved with zero changes.

Phase 9 will replace the legacy React components with two modern, accessible Lit custom elements:
1. `<moul-logs-viewer>` (`MoulLogsViewer`): Virtualized log stream viewer with search filtering, log level classification, timestamp toggling, line wrapping, active level indicator FLIP animation, and an interactive attribute inspector drawer.
2. `<moul-logs>` (`MoulLogs`): Declarative companion element accepting raw log strings (or slotted text), parsing them into structured `LogItem[]` objects, and forwarding them directly to `<moul-logs-viewer>`.

All 7 pure parsing functions and constants will remain exported from the public API entrypoint (`@moul-dev/ui`), fully maintaining backward compatibility.

---

## 2. Inventory of Existing Files in `ui/src/components/LogsViewer/`

| File | Lines | Current Tech | Dependencies / Imports | Status & Action |
|---|---|---|---|---|
| `Logs.tsx` | 1,415 | React + StyleX + JSX | `@phosphor-icons/react`, `@stylexjs/stylex`, `react`, `react-aria-components`, `../Badge`, `../Button`, `../ButtonGroup`, `../Card`, `../Drawer`, `../SearchField`, `../ToggleButton`, `../ToggleButtonGroup` | **Legacy React**: Replace with Lit custom elements `LogsViewer.ts` and `Logs.ts`. |
| `Logs.styles.ts` | 498 | StyleX | `@stylexjs/stylex`, `../../tokens/tokens.stylex` | **Legacy StyleX**: Replace with `LogsViewer.styles.ts` using Lit `css` tagged template and native CSS custom properties. |
| `Logs.types.ts` | 218 | Mixed TypeScript / React | `@stylexjs/stylex`, `react`, `react-aria-components` | **Refactor**: Remove all React/StyleX imports; retain pure types (`LogItem`, `LogLevel`, `LogFilterLevel`) and define Lit element interfaces. |
| `parseLogs.ts` | 210 | Pure TypeScript | `./Logs.types` | **Pure**: Zero DOM or React dependencies. Fully preserved. |
| `exampleLogs.ts` | 23 | Pure TypeScript | `./Logs.types`, `./parseLogs` | **Pure**: Zero DOM or React dependencies. Fully preserved (`SERVER_LOG_RAW`, `SERVER_LOGS`). |
| `Logs.test.tsx` | 464 | React Testing Library | `@testing-library/react`, `react`, `vitest` | **Legacy Test**: Port and expand into `ui/src/components/Blocks.test.ts` (Phase 9 test suite). |
| `index.ts` | 28 | Barrel Export | `./Logs`, `./Logs.types`, `./exampleLogs`, `./parseLogs` | **Refactor**: Export `MoulLogsViewer`, `LogsViewer`, `MoulLogs`, `Logs`, pure parsers, sample data, and types. |

---

## 3. Disallowed Dependencies & Build Guard Compliance

### 3.1 Prohibited Legacy Dependencies in Existing Code
The following prohibited modules exist in `Logs.tsx`, `Logs.styles.ts`, `Logs.types.ts`, and `Logs.test.tsx`:
1. `react` (`useMemo`, `useState`, `useEffect`, `useCallback`, `useRef`, `forwardRef`, `Fragment`, `createRef`)
2. `react-aria-components` (`Table`, `TableHeader`, `Column`, `TableBody`, `Row`, `Cell`, `Key`)
3. `@stylexjs/stylex` (`stylex.create`, `stylex.props`, `StyleXStyles`)
4. `@phosphor-icons/react` (`Check`, `Copy`, `Export`, `Pause`, `Play`, `Trash`)
5. `@testing-library/react` (`render`, `screen`, `fireEvent`)

### 3.2 Enforcement Mechanisms
- **Rollup Build Guard (`ui/vite.config.ts`)**: `banReactImportsPlugin` actively scans import identifiers and throws a hard build error if any import begins with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
- **Pre-Build Verification (`scripts/verify-no-react.ts`)**: Runs on `bun run build:ui` and checks `package.json` manifests for banned packages.
- **Result**: The replacement files must contain **zero imports** of any banned package. Internal icons must use zero-dependency Lit SVG templates or icons from `ui/src/utils/icons.ts`.

---

## 4. Pure Log Parser Utilities & Mock Data

### 4.1 Pure Parsing Functions (`ui/src/components/LogsViewer/parseLogs.ts`)
The parsing implementation in `parseLogs.ts` is robust, pure TypeScript, and completely isolated from any UI library:
1. `normalizeLogLevel(levelStr?: string): LogLevel`:
   - Normalizes level strings (`'INFO'`, `'DEBU'`, `'WARNING'`, `'ERRO'`, `'FATA'`, `'TRACE'`, etc.) into standard lowercase `LogLevel` (`'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'`). Defaults to `'info'`.
2. `parseAttributes(text: string): Record<string, string | number | boolean | null>`:
   - Uses regex `/([a-zA-Z0-9_.-]+)=(?:"((?:\\"|[^"])*)"|'((?:\\'|[^'])*)'|([^\s]+))/g` to extract structured key-value attributes.
   - Automatically casts boolean strings (`'true'` -> `true`, `'false'` -> `false`), `'null'` -> `null`, and numeric values (`status=200` -> `200`).
3. `stripAttributes(text: string): string`:
   - Removes trailing key=value pairs from a log line to isolate the human-readable core message.
4. `parseLogLine(rawLine: string, index = 0): LogItem`:
   - Stage 1: Inspects for JSON logs (`{ ... }`), parses JSON, extracts timestamp, level, and stores remainder in `attributes`.
   - Stage 2: Inspects for standard server format (`timestamp level message key=value`).
   - Stage 3: Unstructured fallback line parser.
5. `parseLogs(input?: string | (LogItem | string)[]): LogItem[]`:
   - Accepts either a multiline raw text string (e.g. from a log file) or an array of mixed string/LogItem objects and returns structured `LogItem[]`.

### 4.2 Sample Dataset (`ui/src/components/LogsViewer/exampleLogs.ts`)
- `SERVER_LOG_RAW`: 17 lines of realistic server log entries (HTTP requests, database locks, webhooks, litestream replication, fatal bind errors).
- `SERVER_LOGS: LogItem[] = parseLogs(SERVER_LOG_RAW)`.
- Fully exportable from root index.

---

## 5. Virtualization Analysis & `@lit-labs/virtualizer`

### 5.1 Package Manifest Presence
In `ui/package.json`:
```json
"dependencies": {
  "@lit-labs/virtualizer": "^2.1.0",
  "@lit/context": "^1.1.3",
  "d3-scale": "^4.0.2",
  "d3-shape": "^3.2.0",
  "lit": "^3.2.1",
  "motion": "^13.4.1"
}
```
`@lit-labs/virtualizer` is already installed and verified in `bun.lock` (resolved to `2.1.1`).

### 5.2 Usage Patterns in Lit
`@lit-labs/virtualizer` offers two integration patterns:
1. **The `virtualize` directive** (`import { virtualize } from '@lit-labs/virtualizer/virtualize.js'`):
   ```ts
   html`
     <div class="scroll-container">
       ${virtualize({
         items: this.filteredLogs,
         renderItem: (item: LogItem, index: number) => this.renderRow(item, index),
       })}
     </div>
   `
   ```
2. **The `<lit-virtualizer>` custom element** (`import '@lit-labs/virtualizer'`):
   ```ts
   html`
     <lit-virtualizer
       .items=${this.filteredLogs}
       .renderItem=${(item: LogItem, index: number) => this.renderRow(item, index)}
     ></lit-virtualizer>
   `
   ```

### 5.3 Existing Codebase Precedent
The directive pattern is already used successfully in `ui/src/components/CommandPalette/CommandPalette.ts`:
```ts
import { virtualize } from '@lit-labs/virtualizer/virtualize.js'
...
${
  this.virtualized && filtered.length > 50
    ? virtualize({
        items: filtered,
        renderItem: (item, idx) => this.renderItem(item, idx),
      })
    : filtered.map((item, idx) => this.renderItem(item, idx))
}
```

### 5.4 Virtualization in Headless Vitest / Happy DOM
In headless test environments (such as Happy DOM), element layout dimensions (`clientHeight`, `offsetHeight`, `scrollHeight`) evaluate to `0` unless manually shimmed or triggered via `__triggerResize`.
If `@lit-labs/virtualizer` encounters a container with `0` height, it might not render item nodes in the initial tick.
**Recommended Implementation Strategy for `MoulLogsViewer`**:
- Expose a `virtualized: boolean` property (defaulting to `true` or adaptive based on item count, e.g. `items.length > 50`).
- When `this.virtualized && items.length > 50` and DOM measurements are present, use `virtualize({ items, renderItem })`.
- Otherwise (or when tested in environments where `clientHeight === 0`), fall back to `.map(...)` rendering.
- This guarantees both production scalability for 10,000+ log lines and 100% deterministic assertion passing in Vitest / Happy DOM!

---

## 6. Design Tokens, Reset Styles, Semantic Tones & Motion

### 6.1 Native CSS Design Tokens (`ui/src/styles/style.css`)
`LogsViewer.styles.ts` will reference native tokens directly without StyleX:
- **Surface & Backgrounds**:
  - `var(--color-bg)`: Main log container and inspector cards.
  - `var(--color-bg-subtle)`: Header toolbar, table header, sticky bar.
  - `var(--color-bg-elevated)`: Floating inspector / popovers.
- **Borders & Dividers**:
  - `var(--color-border)`: Main outer container border.
  - `var(--color-border-subtle)`: Table row dividers, attribute chip borders.
  - `var(--color-border-focus)`: Accessible `:focus-visible` rings.
- **Typography & Colors**:
  - `var(--color-fg)`: Primary log message text.
  - `var(--color-fg-subtle)`: Timestamps, line numbers, attribute keys.
  - `var(--font-family-base)`: Base UI elements.
  - Monospace font stack: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` for log lines, code blocks, and timestamps.
- **Log Severity Indicators**:
  - `error` / `fatal`: `var(--color-alert-bg-error)`, `var(--color-alert-border-error)`, `var(--color-error-500)`, `var(--color-error-600)`.
  - `warn`: `var(--color-alert-bg-warning)`, `var(--color-alert-border-warning)`, `var(--color-warning-500)`.
  - `info`: `var(--color-primary-100)`, `var(--color-primary-600)`.
  - `debug` / `trace`: `var(--color-neutral-100)`, `var(--color-neutral-700)`.
- **Spacing & Radii**:
  - `var(--spacing-1)` through `var(--spacing-6)`
  - `var(--radius-sm)` (attribute chips), `var(--radius-md)` (container, toolbar buttons)
  - `var(--shadow-sm)`

### 6.2 Shared Reset Styles (`ui/src/styles/reset.styles.ts`)
- Imported as `static override styles = [resetStyles, logsViewerStyles]`.
- Provides `box-sizing: border-box`, standard margin/padding zeroing, and `:focus-visible` outlines.

### 6.3 Semantic Tones Mapping (`ui/src/styles/semantic-tones.ts`)
For log level badges:
- `info` -> tone `primary`, variant `flat`
- `warn` -> tone `warning`, variant `flat`
- `error` / `fatal` -> tone `error`, variant `flat`
- `debug` / `trace` -> tone `primary`, variant `bordered` (or neutral flat)

### 6.4 Motion Presets (`ui/src/utils/motion.ts`)
Requirements specify two distinct motion behaviors:
1. **Level Filter Indicator Gliding**:
   - `animateActiveIndicator(indicator, prevRect, nextRect)` using `SPRING_SNAPPY` (`stiffness: 500, damping: 35, mass: 0.8`).
   - Glides behind active filter level button (`ALL`, `INFO`, `WARN`, `ERROR`, `DEBUG`).
2. **Attribute Drawer Transition**:
   - `subtleAnimate(drawer, { opacity: [0, 1], y: [-4, 0] }, SPRING_GENTLE)`.
   - `SPRING_GENTLE` (`stiffness: 320, damping: 28, mass: 1`).
   - Row fade-in: `subtleAnimate(row, { opacity: [0, 1] }, SPRING_SNAPPY)`.

---

## 7. Architecture & API Specifications for Lit Components

### 7.1 `MoulLogsViewer` (`moul-logs-viewer`)
- **Tag name**: `moul-logs-viewer`
- **Class name**: `MoulLogsViewer` extends `LitElement`
- **Declared Properties**:
  - `logs`: `LogItem[] = []` (converter: array or parsed string)
  - `filterLevel`: `LogFilterLevel = 'all'` (attribute `filter-level`)
  - `searchQuery`: `string = ''` (attribute `search-query`)
  - `showTimestamps`: `boolean = true` (attribute `show-timestamps`, reflect)
  - `showLineNumbers`: `boolean = true` (attribute `show-line-numbers`, reflect)
  - `wrapLines`: `boolean = false` (attribute `wrap-lines`, reflect)
  - `virtualized`: `boolean = true` (attribute `virtualized`)
  - `selectedId`: `string | number | null = null` (internal state)
  - `isInspectorOpen`: `boolean = false` (attribute `is-inspector-open`, reflect)
- **Computed / Filtered Data**:
  - Filters `this.logs` by `filterLevel` (`log.level === filterLevel` unless `'all'`).
  - Filters by `searchQuery` (matches `message`, `timestamp`, `level`, or attribute keys/values).
- **Template Structure**:
  - `part="container"`: Root wrapper.
  - `part="toolbar"`: Top control bar:
    - Search field with clear trigger.
    - Level filter button group (`ALL`, `INFO`, `WARN`, `ERROR`, `DEBUG`) with gliding `active-indicator`.
    - Event count summary (`filtered.length / logs.length events`).
    - Timestamp toggle button (`T`).
    - Line wrap toggle button (`W`).
    - Download / Copy actions.
  - `part="scroll-container"`: Scrollable log row viewport:
    - Uses `virtualize(...)` when item count is large.
    - Renders log rows with:
      - Line number cell (`part="cell-linenumber"`).
      - Timestamp cell (`part="cell-timestamp"`).
      - Level badge cell (`part="cell-level"`).
      - Message cell (`part="cell-message"`) with highlighted matching query terms (`<mark class="highlight">`).
      - Structured attribute chips (`part="attribute-chip"`).
  - `part="inspector"`: Attribute drawer / panel:
    - Displays full selected log item metadata, attributes table, and raw JSON/log string code block.
- **Custom Events**:
  - `filterlevelchange`: `detail: { filterLevel: LogFilterLevel }`
  - `searchchange`: `detail: { searchQuery: string }`
  - `rowclick`: `detail: { log: LogItem }`
  - `clear`: `detail: {}`

### 7.2 `MoulLogs` (`moul-logs`)
- **Tag name**: `moul-logs`
- **Class name**: `MoulLogs` extends `LitElement`
- **Declared Properties**:
  - `raw`: `string = ''` (attribute `raw`)
  - `filterLevel`: `LogFilterLevel = 'all'` (attribute `filter-level`)
  - `searchQuery`: `string = ''` (attribute `search-query`)
  - `showTimestamps`: `boolean = true` (attribute `show-timestamps`)
  - `wrapLines`: `boolean = false` (attribute `wrap-lines`)
- **Behavior**:
  - Automatically parses `this.raw` (or light DOM `this.textContent` / `<slot>` content) using `parseLogs()`.
  - Forwards the resulting `LogItem[]` array and all configuration properties to an internal `<moul-logs-viewer>`.
  - Re-parses when `raw` attribute updates or slot content changes.

---

## 8. Public Entry Point & Export Contracts

### 8.1 Component Directory Exports (`ui/src/components/LogsViewer/index.ts`)
```ts
export { MoulLogsViewer, MoulLogsViewer as LogsViewer } from './LogsViewer'
export { MoulLogs, MoulLogs as Logs } from './Logs'
export type {
  LogFilterLevel,
  LogItem,
  LogLevel,
  LogsViewerProps,
} from './LogsViewer.types'
export {
  normalizeLogLevel,
  parseAttributes,
  parseLogLine,
  parseLogs,
  stripAttributes,
} from './parseLogs'
export { SERVER_LOG_RAW, SERVER_LOGS } from './exampleLogs'
```

### 8.2 Root Public Entry Point (`ui/src/index.ts`)
Export all elements and pure utilities:
- `MoulLogsViewer`, `LogsViewer`
- `MoulLogs`, `Logs`
- `LogFilterLevel`, `LogItem`, `LogLevel`
- `normalizeLogLevel`, `parseAttributes`, `parseLogLine`, `parseLogs`, `stripAttributes`
- `SERVER_LOG_RAW`, `SERVER_LOGS`

### 8.3 Global Tag Registration
```ts
declare global {
  interface HTMLElementTagNameMap {
    'moul-logs-viewer': MoulLogsViewer
    'moul-logs': MoulLogs
  }
}
```

---

## 9. Comprehensive Verification Plan (`ui/src/components/Blocks.test.ts`)

Author a comprehensive test suite in `ui/src/components/Blocks.test.ts` using Vitest + Happy DOM covering:

1. **Pure Log Parser Tests**:
   - `normalizeLogLevel`: all uppercase/lowercase variants, abbreviations (`DEBU`, `ERRO`, `WARN`, `FATA`), undefined fallback.
   - `parseAttributes`: double quotes, single quotes, unquoted values, boolean casting, numbers, nulls.
   - `stripAttributes`: removes key=value pairs, preserves base message.
   - `parseLogLine`: standard timestamped server logs, JSON logs, fallback lines.
   - `parseLogs`: raw text multiline parsing, array of strings, array of objects.
   - `SERVER_LOG_RAW` & `SERVER_LOGS`: verification of the 17-item fixture.
2. **`moul-logs-viewer` Component Tests**:
   - Mounting and DOM rendering with log data.
   - Level filter button click filtering (e.g. clicking `WARN` hides info logs).
   - Search field filtering (querying text reduces visible row count).
   - Timestamp column toggle (`show-timestamps="false"` removes timestamp cells).
   - Line wrapping toggle (`wrap-lines="true"` toggles CSS wrap class).
   - Row selection & attribute drawer opening.
   - Custom event emissions (`filterlevelchange`, `searchchange`, `rowclick`).
3. **`moul-logs` Component Tests**:
   - Accepts `raw` attribute and renders parsed logs inside `<moul-logs-viewer>`.
   - Property propagation (`filter-level`, `search-query`).
4. **Idempotent Registration Tests**:
   - Calling `defineElement('moul-logs-viewer', MoulLogsViewer)` multiple times emits a console warning without throwing.
