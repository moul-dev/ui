# Empirical Challenge Report: `moul-logs-viewer` & `moul-logs` DOM Rendering & Reactive Behaviors

**Verdict**: `REQUEST_CHANGES`

---

## 1. Observation

### Observation 1: Boolean Attribute Binding Bug in `MoulLogs` (`ui/src/components/LogsViewer/Logs.ts:106-112`)
In `MoulLogs.render()`:
```ts
100:   override render(): TemplateResult {
101:     return html`
102:       <slot @slotchange=${this.handleSlotChange}></slot>
103:       <moul-logs-viewer
104:         .logs=${this.parsedLogs}
105:         .filterLevel=${this.filterLevel}
106:         .searchQuery=${this.searchQuery}
107:         ?show-timestamps=${this.showTimestamps}
108:         ?show-line-numbers=${this.showLineNumbers}
109:         ?show-levels=${this.showLevels}
110:         ?show-toolbar=${this.showToolbar}
111:         ?wrap-lines=${this.wrapLines}
112:         ?compact=${this.compact}
113:         ?virtualized=${this.virtualized}
114:         max-height=${this.maxHeight}
115:       ></moul-logs-viewer>
116:     `
117:   }
```
In `MoulLogsViewer` (`ui/src/components/LogsViewer/LogsViewer.ts:185-197`):
```ts
185:   constructor() {
186:     super()
187:     this.logs = []
188:     this.filterLevel = 'all'
189:     this.searchQuery = ''
190:     this.showTimestamps = true
191:     this.showLineNumbers = true
192:     this.showLevels = true
193:     this.showToolbar = true
194:     this.wrapLines = false
195:     this.compact = false
196:     this.virtualized = true
197:     this.maxHeight = '600px'
```
When `<moul-logs>` is mounted with `.showTimestamps=${false}`:
```ts
const el = await mount<MoulLogs>(
  html`<moul-logs .raw=${SERVER_LOG_RAW} .showTimestamps=${false}></moul-logs>`
)
const innerViewer = el.shadowRoot?.querySelector<MoulLogsViewer>('moul-logs-viewer')
```
Running assertion:
```
AssertionError: expected true to be false // innerViewer.showTimestamps was true!
expect(innerViewer?.shadowRoot?.querySelectorAll('.cell-time').length).toBe(17) // 17 timestamps still rendered!
```
The exact same behavior occurs for `showLineNumbers`, `showLevels`, `showToolbar`, and `virtualized` when set to `false` on `<moul-logs>`.

### Observation 2: Unhandled Prototype Key Crash in DOM Rendering (`parseLogs.ts:28` & `LogsViewer.ts:444`)
In `ui/src/components/LogsViewer/parseLogs.ts:25-29`:
```ts
25: export function normalizeLogLevel(levelStr?: string): LogLevel {
26:   if (!levelStr) return 'info'
27:   const cleaned = levelStr.toLowerCase().replace(/[^a-z]/g, '')
28:   return LEVEL_MAP[cleaned] || 'info'
29: }
```
When input JSON log contains `{"level": "constructor", "msg": "test"}`:
`LEVEL_MAP['constructor']` returns `Object.prototype.constructor` (`[Function: Object]`).
In `ui/src/components/LogsViewer/LogsViewer.ts:444`:
```ts
444:     const level = (item.level || 'info').toLowerCase() as LogLevel
```
When rendering this log item, `item.level` is the function `[Function: Object]`.
Calling `toLowerCase()` throws verbatim:
```
TypeError: (item.level || "info").toLowerCase is not a function
```
This unhandled exception breaks the render lifecycle of `MoulLogsViewer` and halts DOM updates.

### Observation 3: Robust Behaviors Verified in Empirical Stress Suite
In our 22-test suite `ui/src/components/LogsViewer/logs-dom-challenge.test.ts`:
- **Filter Changes**: Setting `filterLevel = 'error'` cleanly filters and displays only `error` and `fatal` logs (4 out of 17 in fixture). Setting `filterLevel = 'warn'` displays strictly `warn` logs (3 out of 17). Setting `filterLevel = 'debug'` displays both `debug` and `trace`. Reactivity verified via direct property, HTML attribute (`filter-level`), and button clicks (`.filter-pill[data-level="..."]`), properly emitting `filterlevelchange` and `filterchange` events.
- **Search Queries with Regex Metacharacters**: Inputting queries containing `.*`, `[`, `]`, `(`, `)`, `+`, `?`, `\`, `{`, `}`, `|`, `^`, `$`, `\d+`, `[[[`, and unclosed parenthesis/brackets does NOT crash or throw `SyntaxError`. Matches in messages and timestamps are safely escaped and wrapped in `<mark class="highlight">`.
- **Timestamp Toggle**: Direct toggle on `<moul-logs-viewer>` via `.showTimestamps` property or toolbar `T` button cleanly toggles the existence of `.cell-time` elements and updates button `aria-pressed`.
- **Line Wrapping Toggle**: Direct toggle via `.wrapLines` property or toolbar `W` button cleanly alternates classes `.no-wrap` and `.wrap-lines` on `.scroll-container` and updates button `aria-pressed`.
- **Raw Log Parsing & Reactivity**: `<moul-logs>` dynamically parses raw text when `.raw` property is modified, updates `.logs` on the child `<moul-logs-viewer>`, and forwards `.filterLevel` and `.searchQuery`. Slotted text and text content fallback parsing also function.

---

## 2. Logic Chain

1. **Root cause of Observation 1**:
   - In HTML and Lit, boolean attribute binding `?attr=${expression}` sets the attribute when truthy and removes (or omits) the attribute when falsy.
   - For custom elements, if an element's constructor initializes a property to `true` (e.g. `this.showTimestamps = true`), omitting the HTML attribute at creation time leaves the property at its constructor default of `true`.
   - `Logs.ts` lines 106-112 uses boolean attribute syntax `?show-timestamps=${this.showTimestamps}`, `?show-line-numbers=...`, `?show-levels=...`, `?show-toolbar=...`, and `?virtualized=...`.
   - When a consumer sets `<moul-logs .showTimestamps=${false}>` or `<moul-logs ?show-timestamps=${false}>`, `this.showTimestamps` is `false`. Lit omits the attribute `show-timestamps` from `<moul-logs-viewer>`.
   - `<moul-logs-viewer>` initializes with `showTimestamps = true`. Since no attribute was ever present, it never triggers a change to `false`.
   - Therefore, `<moul-logs>` completely fails to propagate `false` for any boolean property that defaults to `true`.
   - The fix requires using Lit property bindings `.showTimestamps=${this.showTimestamps}`, `.showLineNumbers=${this.showLineNumbers}`, `.showLevels=${this.showLevels}`, `.showToolbar=${this.showToolbar}`, and `.virtualized=${this.virtualized}` in `Logs.ts`.

2. **Root cause of Observation 2**:
   - `LEVEL_MAP` in `parseLogs.ts` is declared as an object literal inheriting from `Object.prototype`.
   - Looking up keys like `'constructor'`, `'toString'`, `'valueOf'` retrieves prototype methods rather than undefined.
   - When parsed into a `LogItem`, `item.level` is assigned a function instead of a `LogLevel` string.
   - `LogsViewer.ts:444` executes `(item.level || 'info').toLowerCase()`. Since functions do not have `.toLowerCase()`, a runtime `TypeError` is thrown during rendering.
   - The fix requires either `Object.create(null)` for `LEVEL_MAP` or `Object.prototype.hasOwnProperty.call(LEVEL_MAP, cleaned) ? LEVEL_MAP[cleaned] : 'info'`.

---

## 3. Caveats

- Virtual scrolling (`@lit-labs/virtualizer`) was tested in a Node/happy-dom environment. Because happy-dom does not perform browser-level layout rendering (container `clientHeight` is 0), `MoulLogsViewer`'s defensive guard `hasContainerDimensions()` appropriately fell back to `.map()` rendering as designed. Full virtualization layout with actual scroll events should be checked in browser end-to-end tests if available.
- Only non-destructive empirical tests were executed; no production source files in `ui/src/` were modified by this reviewer.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

While `MoulLogsViewer` demonstrates excellent resilience against regex search queries, level filtering thresholds, and visual toggles when used directly, two significant bugs must be resolved before Milestone 1 can be approved:
1. **`MoulLogs.ts`**: Replace boolean attribute bindings (`?attr=...`) with property bindings (`.attr=...`) for `showTimestamps`, `showLineNumbers`, `showLevels`, `showToolbar`, and `virtualized` so that `false` values propagate correctly to the inner viewer.
2. **`parseLogs.ts`**: Protect `normalizeLogLevel` against prototype key lookups to prevent `TypeError: toLowerCase is not a function` during DOM rendering when handling arbitrary JSON logs.

---

## 5. Verification Method

To independently reproduce and verify all findings:
```bash
# Run the newly authored empirical challenge test suite
node ui/node_modules/.bin/vitest run --root ui src/components/LogsViewer/logs-dom-challenge.test.ts

# Run the complete LogsViewer test suite (including parser challenge)
node ui/node_modules/.bin/vitest run --root ui src/components/LogsViewer/
```

Files to inspect:
- Test suite documenting all observations and bugs: `ui/src/components/LogsViewer/logs-dom-challenge.test.ts`
- Boolean forwarding bug location: `ui/src/components/LogsViewer/Logs.ts:106-112`
- Prototype pollution bug location: `ui/src/components/LogsViewer/parseLogs.ts:28` and `ui/src/components/LogsViewer/LogsViewer.ts:444`
