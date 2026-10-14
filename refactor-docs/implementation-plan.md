# @moul-dev/ui — Full Implementation Plan
## React + StyleX → Lit + Bootstrap 6 · Shadow DOM

---

## Decisions

| Decision | Choice |
|---|---|
| Shadow DOM | Yes — all components use shadow DOM |
| Bootstrap CSS | Adopted into shadow roots via `adoptedStyleSheets` |
| Bootstrap JS | Not used — all behavior owned by Lit |
| Date components | `bootstrap.Datepicker` (wraps `vanilla-calendar-pro`) initialized in Lit lifecycle |
| Charts | Out of scope |
| Compound API | Named slots for layout sub-parts; separate `<moul-*>` elements for behavioral sub-parts |
| Imports | Per-component tree-shakeable entries **and** barrel `@moul-dev/ui` |
| Docs | Waku + Fumadocs + Tailwind deleted; rebuilt as Astro + Starlight using `@moul-dev/ui` web components directly |
| Bootstrap version | `6.0.0-alpha.1` pinned exactly — no semver range |

---

## Part 1 — UI Library (`ui/`)

### 1.1 Package Exports Strategy

Two usage modes from the same build output:

```ts
// Mode A — tree-shakeable, per-component
import '@moul-dev/ui/button'                    // registers <moul-button>
import { MoulButton } from '@moul-dev/ui/button' // typed class

// Mode B — barrel, registers everything
import '@moul-dev/ui'
```

The barrel `dist/index.js` is only re-exports of per-component modules. Rollup deduplicates — no code runs twice. The browser's custom element registry is idempotent — `customElements.define` guards against double-registration.

#### `ui/package.json` exports map

```jsonc
{
  "name": "@moul-dev/ui",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types":  "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./button":          { "types": "./dist/components/Button/index.d.ts",          "import": "./dist/components/Button/index.js" },
    "./alert":           { "types": "./dist/components/Alert/index.d.ts",           "import": "./dist/components/Alert/index.js" },
    "./badge":           { "types": "./dist/components/Badge/index.d.ts",           "import": "./dist/components/Badge/index.js" },
    "./avatar":          { "types": "./dist/components/Avatar/index.d.ts",          "import": "./dist/components/Avatar/index.js" },
    "./breadcrumbs":     { "types": "./dist/components/Breadcrumbs/index.d.ts",     "import": "./dist/components/Breadcrumbs/index.js" },
    "./card":            { "types": "./dist/components/Card/index.d.ts",            "import": "./dist/components/Card/index.js" },
    "./modal":           { "types": "./dist/components/Modal/index.d.ts",           "import": "./dist/components/Modal/index.js" },
    "./drawer":          { "types": "./dist/components/Drawer/index.d.ts",          "import": "./dist/components/Drawer/index.js" },
    "./alert-dialog":    { "types": "./dist/components/AlertDialog/index.d.ts",     "import": "./dist/components/AlertDialog/index.js" },
    "./popover":         { "types": "./dist/components/Popover/index.d.ts",         "import": "./dist/components/Popover/index.js" },
    "./tooltip":         { "types": "./dist/components/Tooltip/index.d.ts",         "import": "./dist/components/Tooltip/index.js" },
    "./toast":           { "types": "./dist/components/Toast/index.d.ts",           "import": "./dist/components/Toast/index.js" },
    "./text-field":      { "types": "./dist/components/TextField/index.d.ts",       "import": "./dist/components/TextField/index.js" },
    "./text-area":       { "types": "./dist/components/TextArea/index.d.ts",        "import": "./dist/components/TextArea/index.js" },
    "./number-field":    { "types": "./dist/components/NumberField/index.d.ts",     "import": "./dist/components/NumberField/index.js" },
    "./search-field":    { "types": "./dist/components/SearchField/index.d.ts",     "import": "./dist/components/SearchField/index.js" },
    "./checkbox":        { "types": "./dist/components/Checkbox/index.d.ts",        "import": "./dist/components/Checkbox/index.js" },
    "./checkbox-group":  { "types": "./dist/components/CheckboxGroup/index.d.ts",   "import": "./dist/components/CheckboxGroup/index.js" },
    "./radio-group":     { "types": "./dist/components/RadioGroup/index.d.ts",      "import": "./dist/components/RadioGroup/index.js" },
    "./switch":          { "types": "./dist/components/Switch/index.d.ts",          "import": "./dist/components/Switch/index.js" },
    "./slider":          { "types": "./dist/components/Slider/index.d.ts",          "import": "./dist/components/Slider/index.js" },
    "./toggle-button":   { "types": "./dist/components/ToggleButton/index.d.ts",    "import": "./dist/components/ToggleButton/index.js" },
    "./select":          { "types": "./dist/components/Select/index.d.ts",          "import": "./dist/components/Select/index.js" },
    "./combobox":        { "types": "./dist/components/ComboBox/index.d.ts",        "import": "./dist/components/ComboBox/index.js" },
    "./autocomplete":    { "types": "./dist/components/Autocomplete/index.d.ts",    "import": "./dist/components/Autocomplete/index.js" },
    "./listbox":         { "types": "./dist/components/ListBox/index.d.ts",         "import": "./dist/components/ListBox/index.js" },
    "./tag-group":       { "types": "./dist/components/TagGroup/index.d.ts",        "import": "./dist/components/TagGroup/index.js" },
    "./tabs":            { "types": "./dist/components/Tabs/index.d.ts",            "import": "./dist/components/Tabs/index.js" },
    "./pagination":      { "types": "./dist/components/Pagination/index.d.ts",      "import": "./dist/components/Pagination/index.js" },
    "./sidebar":         { "types": "./dist/components/Sidebar/index.d.ts",         "import": "./dist/components/Sidebar/index.js" },
    "./form":            { "types": "./dist/components/Form/index.d.ts",            "import": "./dist/components/Form/index.js" },
    "./input-otp":       { "types": "./dist/components/InputOTP/index.d.ts",        "import": "./dist/components/InputOTP/index.js" },
    "./date-picker":     { "types": "./dist/components/DatePicker/index.d.ts",      "import": "./dist/components/DatePicker/index.js" },
    "./calendar":        { "types": "./dist/components/Calendar/index.d.ts",        "import": "./dist/components/Calendar/index.js" },
    "./command-palette": { "types": "./dist/components/CommandPalette/index.d.ts",  "import": "./dist/components/CommandPalette/index.js" },
    "./progress-bar":    { "types": "./dist/components/ProgressBar/index.d.ts",     "import": "./dist/components/ProgressBar/index.js" },
    "./skeleton":        { "types": "./dist/components/Skeleton/index.d.ts",        "import": "./dist/components/Skeleton/index.js" },
    "./spinner":         { "types": "./dist/components/Spinner/index.d.ts",         "import": "./dist/components/Spinner/index.js" },
    "./separator":       { "types": "./dist/components/Separator/index.d.ts",       "import": "./dist/components/Separator/index.js" },
    "./kbd":             { "types": "./dist/components/Kbd/index.d.ts",             "import": "./dist/components/Kbd/index.js" },
    "./empty-state":     { "types": "./dist/components/EmptyState/index.d.ts",      "import": "./dist/components/EmptyState/index.js" },
    "./stat":            { "types": "./dist/components/Stat/index.d.ts",            "import": "./dist/components/Stat/index.js" },
    "./top-list":        { "types": "./dist/components/TopList/index.d.ts",         "import": "./dist/components/TopList/index.js" },
    "./logs-viewer":     { "types": "./dist/components/LogsViewer/index.d.ts",      "import": "./dist/components/LogsViewer/index.js" },
    "./typography":      { "types": "./dist/components/Typography/index.d.ts",      "import": "./dist/components/Typography/index.js" },
    "./button-group":    { "types": "./dist/components/ButtonGroup/index.d.ts",     "import": "./dist/components/ButtonGroup/index.js" },
    "./percentage":      { "types": "./dist/components/Percentage/index.d.ts",      "import": "./dist/components/Percentage/index.js" },
    "./link":            { "types": "./dist/components/Link/index.d.ts",            "import": "./dist/components/Link/index.js" },
    "./tokens.css":      { "style": "./dist/assets/tokens.css", "default": "./dist/assets/tokens.css" },
    "./style.css":       { "style": "./dist/assets/tokens.css", "default": "./dist/assets/tokens.css" }
  }
}
```

### 1.2 Source Directory Layout

```
ui/src/
├── index.ts                            # barrel — re-exports all components
├── shared/
│   ├── base.ts                         # MoulBase extends LitElement, adopts bootstrapSheet
│   ├── bootstrap.styles.ts             # bootstrapSheet CSSStyleSheet singleton
│   └── tokens.css                      # brand CSS custom properties (replaces tokens.stylex.ts)
├── controllers/
│   ├── focus-trap.controller.ts
│   ├── floating-ui.controller.ts
│   ├── hover.controller.ts
│   ├── roving-tabindex.controller.ts
│   ├── live-region.controller.ts
│   ├── scroll-lock.controller.ts
│   └── keyboard-list.controller.ts
└── components/
    ├── Button/
    │   ├── Button.ts                   # @customElement('moul-button') LitElement class
    │   ├── Button.styles.ts            # css`` scoped stylesheet
    │   └── index.ts                    # named export + side-effect registration
    └── ...                             # same layout for every component
```

#### `src/index.ts` (barrel)

```ts
// Re-exports all components. Importing this file registers every <moul-*> element.
// Rollup deduplicates — each module is only evaluated once at runtime.
export * from './components/Button/index.js'
export * from './components/Alert/index.js'
export * from './components/Badge/index.js'
// ... all components
```

#### Per-component `src/components/Button/index.ts`

```ts
// The @customElement decorator in Button.ts calls customElements.define() on import.
// Export the class for consumers who need the typed reference.
export { MoulButton } from './Button.js'
```

### 1.3 Build Configuration

#### `vite.config.ts` (after migration)

```ts
import { glob } from 'glob'
import { resolve } from 'node:path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    dts({ tsconfigPath: './tsconfig.app.json' }),
  ],
  assetsInclude: ['**/*.css'],
  build: {
    target: 'esnext',
    lib: {
      entry: {
        // Barrel
        'index': resolve(__dirname, 'src/index.ts'),
        // Per-component entries auto-discovered
        ...Object.fromEntries(
          glob.sync('src/components/*/index.ts').map((file) => [
            file.replace('src/', '').replace('.ts', ''),
            resolve(__dirname, file),
          ])
        ),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'lit',
        'lit/decorators.js',
        'lit/directives/class-map.js',
        'lit/directives/style-map.js',
        '@floating-ui/dom',
      ],
      output: {
        // Shared internal chunks (controllers, base) go to shared/
        chunkFileNames: 'shared/[name]-[hash].js',
        // No 'use client' banner — this is not a React library
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

**Key changes from current config:**
- Multi-entry object replaces single `moul-ui` entry
- `external`: `lit` + `@floating-ui/dom`; Bootstrap JS is bundled per-component
- Removes `@vitejs/plugin-react`, `@stylexjs/unplugin`, `preserveTokensStylexPlugin`
- No `'use client'` banner

#### `tsconfig.app.json` changes

```jsonc
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false,   // required for Lit decorators
    "experimentalDecorators": false,    // TC39 standard decorators (TS 6.x default)
    "moduleResolution": "bundler",
    "strict": true
  }
}
```

### 1.4 Shared Foundation

#### `src/shared/bootstrap.styles.ts`

```ts
// Vite inlines Bootstrap CSS as a string at build time via ?inline.
// The CSSStyleSheet is created once and shared via module cache.
import bootstrapRaw from 'bootstrap/dist/css/bootstrap.min.css?inline'

export const bootstrapSheet = new CSSStyleSheet()
bootstrapSheet.replaceSync(bootstrapRaw)
```

#### `src/shared/base.ts`

```ts
import { LitElement, type CSSResultOrNative } from 'lit'
import { bootstrapSheet } from './bootstrap.styles.js'

// Every moul component extends MoulBase.
// Subclasses append a scoped sheet:
//   static styles = [...MoulBase.styles, css`...`]
export abstract class MoulBase extends LitElement {
  static styles: CSSResultOrNative[] = [bootstrapSheet]
}
```

Bootstrap 6 defines all tokens (`--bs-primary`, `--bs-border-radius`, etc.) on `:root`. CSS custom properties cascade through shadow boundaries by spec — no extra setup needed. Dark mode works via `data-bs-theme` on any ancestor.

#### `src/shared/tokens.css`

Brand-level customization properties — replaces `tokens.stylex.ts`. Consumers apply these to `:root` or any ancestor to theme the library:

```css
:root {
  --moul-brand-hue: 250;
  --moul-brand-chroma-multiplier: 1;
  --moul-brand-radius-factor: 1;
  --moul-brand-density-factor: 1;
  --moul-brand-font-scale: 1;
}
```

These feed into Bootstrap 6's `oklch()` color system and `--bs-border-radius` scale via component-level CSS.

### 1.5 Shared Lit Controllers

Built in Phase 1 before any complex component. Each is a `ReactiveController` class usable across components.

| Controller | Responsibility | Used by |
|---|---|---|
| `FocusTrapController` | Trap Tab/Shift-Tab inside host; restore focus on deactivate | Modal, Drawer, AlertDialog, CommandPalette |
| `ScrollLockController` | Set `overflow:hidden` on `<body>` while active | Modal, Drawer |
| `FloatingUIController` | Wrap `@floating-ui/dom` `computePosition` + `autoUpdate` | Popover, Tooltip, ComboBox, Select, Autocomplete |
| `HoverController` | Unified `mouseenter`/`mouseleave` + `focusin`/`focusout` | Tooltip |
| `RovingTabindexController` | Manage `tabindex` across a set of child elements | RadioGroup, Tabs, ListBox |
| `KeyboardListController` | Arrow up/down/home/end navigation for any list | ListBox, Select, ComboBox, CommandPalette |
| `LiveRegionController` | Manage `role=status` live region announcements | Toast, FieldError |

### 1.6 Slot-Based Compound Component API

Layout sub-parts → named slots on the parent.
Behavioral sub-parts → separate registered `<moul-*>` elements.

```html
<!-- Modal with named slots -->
<moul-modal is-open size="md">
  <span slot="header">Confirm</span>
  <p slot="body">Are you sure?</p>
  <span slot="footer">
    <moul-button variant="ghost">Cancel</moul-button>
    <moul-button variant="primary">Confirm</moul-button>
  </span>
</moul-modal>

<!-- ComboBox with child elements -->
<moul-combobox placeholder="Search...">
  <moul-combobox-item value="one">One</moul-combobox-item>
  <moul-combobox-item value="two">Two</moul-combobox-item>
</moul-combobox>

<!-- Tabs with child elements -->
<moul-tabs selected-key="overview">
  <moul-tab key="overview">Overview</moul-tab>
  <moul-tab key="settings">Settings</moul-tab>
  <moul-tab-panel key="overview">Overview content</moul-tab-panel>
  <moul-tab-panel key="settings">Settings content</moul-tab-panel>
</moul-tabs>
```

| Compound family | Parent | Named slots | Child elements |
|---|---|---|---|
| Modal | `<moul-modal>` | `header`, `body`, `footer` | — |
| Drawer | `<moul-drawer>` | `header`, `body`, `footer`, `handle` | — |
| AlertDialog | `<moul-alert-dialog>` | `header`, `body`, `footer` | — |
| Card | `<moul-card>` | `header`, `body`, `footer` | — |
| EmptyState | `<moul-empty-state>` | `icon`, `title`, `description`, `actions` | — |
| Popover | `<moul-popover>` | `trigger`, `content` | — |
| Tabs | `<moul-tabs>` | — | `<moul-tab>`, `<moul-tab-panel>` |
| ComboBox | `<moul-combobox>` | `empty-state` | `<moul-combobox-item>`, `<moul-combobox-section>` |
| Select | `<moul-select>` | — | `<moul-select-item>`, `<moul-select-section>` |
| ListBox | `<moul-listbox>` | `empty-state` | `<moul-listbox-item>`, `<moul-listbox-section>` |
| Autocomplete | `<moul-autocomplete>` | `empty-state` | `<moul-autocomplete-item>`, `<moul-autocomplete-section>` |
| Sidebar | `<moul-sidebar>` | `brand`, `header`, `footer` | `<moul-sidebar-item>`, `<moul-sidebar-group>`, `<moul-sidebar-divider>` |
| RadioGroup | `<moul-radio-group>` | — | `<moul-radio>` |
| CheckboxGroup | `<moul-checkbox-group>` | — | `<moul-checkbox>` |
| TagGroup | `<moul-tag-group>` | — | `<moul-tag>` |
| Slider | `<moul-slider>` | — | `<moul-slider-thumb>` (dual-thumb only) |
| ToggleButtonGroup | `<moul-toggle-button-group>` | — | `<moul-toggle-button>` |
| ButtonGroup | `<moul-button-group>` | — | `<moul-button>` |
| InputOTP | `<moul-input-otp>` | — | `<moul-input-otp-slot>`, `<moul-input-otp-separator>` |
| Breadcrumbs | `<moul-breadcrumbs>` | — | `<moul-breadcrumb-item>` |
| CommandPalette | `<moul-command-palette>` | `input`, `footer` | `<moul-command-palette-section>`, `<moul-command-palette-item>` |

### 1.7 Date Components: Bootstrap Datepicker in Shadow DOM

Bootstrap 6 officially documents shadow DOM initialization. The pattern: initialize via JS in `connectedCallback` (not `data-bs-toggle` — delegated events don't cross shadow boundaries). Bootstrap CSS is already adopted via `MoulBase` — no extra setup.

```ts
connectedCallback() {
  super.connectedCallback()
  this.updateComplete.then(() => {
    const input = this.shadowRoot!.querySelector<HTMLInputElement>('#picker')!
    this._picker = new bootstrap.Datepicker(input, {
      selectionMode: this.range ? 'multiple-ranged' : 'single',
      locale: this.locale,
      firstWeekday: this.firstWeekday,
      selectedDates: this.value ? [this.value] : [],
      inline: this.inline,
      vcpOptions: this.vcpOptions, // full vanilla-calendar-pro passthrough
    })
    input.addEventListener('change.bs.datepicker', (e: any) => {
      this.dispatchEvent(new CustomEvent('moul-change', {
        detail: { dates: e.dates },
        bubbles: true,
        composed: true,
      }))
    })
  })
}
disconnectedCallback() {
  super.disconnectedCallback()
  this._picker?.dispose()
}
```

| Element | Key props | Bootstrap option |
|---|---|---|
| `<moul-date-picker>` | `value`, `min`, `max`, `locale`, `firstWeekday`, `placeholder`, `is-disabled`, `vcp-options` | `selectionMode: 'single'` |
| `<moul-date-range-picker>` | `start-value`, `end-value`, `min`, `max`, `display-months-count` | `selectionMode: 'multiple-ranged'` |
| `<moul-calendar>` | `value`, `min`, `max`, `selection-mode`, `display-months-count`, `vcp-options` | `inline: true` |
| `<moul-range-calendar>` | `start-value`, `end-value`, `min`, `max`, `display-months-count` | `inline: true`, `selectionMode: 'multiple-ranged'` |

### 1.8 Dependency Delta

#### Remove from `ui/package.json`

| Type | Packages |
|---|---|
| `dependencies` | `react-aria-components`, `react-aria`, `@stylexjs/stylex`, `input-otp`, `motion`, `recharts`, `@phosphor-icons/react` |
| `devDependencies` | `@vitejs/plugin-react`, `@stylexjs/unplugin`, `@types/react`, `@types/react-dom` |
| `peerDependencies` | `react`, `react-dom`, `@stylexjs/stylex` |

#### Add to `ui/package.json`

```jsonc
{
  "dependencies": {
    "lit": "^3.x",
    "bootstrap": "6.0.0-alpha.1",
    "@floating-ui/dom": "^1.x"
  }
}
```

Note on icons: `@phosphor-icons/react` is removed. Components use Bootstrap Icons SVG inline (`<svg><use href="#icon-name"/></svg>`) — no icon library dependency.

---

## Part 2 — Documentation Site (`docs/`)

### 2.1 Decision: Delete and Rebuild

The existing `docs/` is a Waku (RSC) + Fumadocs + Tailwind + React stack. It depends on `react`, `react-aria-components`, `fumadocs-ui`, `waku`, and Tailwind. Since `@moul-dev/ui` is now a native web component library, the docs can consume it directly as HTML custom elements — no React, no wrappers needed.

**New stack:** Astro + Starlight

Reasons:
- Astro is framework-agnostic — it renders MDX to static HTML and supports custom elements in markup directly
- Starlight is Astro's official docs theme — sidebar, search, navigation, versioning, i18n, dark mode out of the box
- `<moul-button>`, `<moul-modal>`, etc. used in MDX files as plain HTML — no wrapper layer, no `@lit/react`, no `createComponent`
- Astro's client directives (`client:load`) handle any component interactivity needed in demos
- Significantly smaller dependency footprint than Waku + Fumadocs + Tailwind

### 2.2 New `docs/` Directory Layout

```
docs/
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   ├── AGENTS.md
│   ├── llms.txt
│   └── llms-full.txt
└── src/
    ├── content/
    │   ├── config.ts                   # Astro content collections config
    │   └── docs/                       # MDX source files (migrated from docs/content/docs/)
    │       ├── components/
    │       │   ├── button.mdx
    │       │   ├── modal.mdx
    │       │   └── ...
    │       ├── blocks/
    │       └── getting-started.mdx
    ├── changelog/                      # MDX changelog entries (migrated from docs/content/changelog/)
    │   ├── v2026-08-15.mdx
    │   └── ...
    ├── components/                     # Astro/custom components for the docs site itself
    │   ├── ComponentPreview.astro      # Live component preview wrapper
    │   ├── PropsTable.astro            # Props reference table
    │   ├── CodeBlock.astro             # Syntax-highlighted code block
    │   ├── ThemeSelector.astro         # Brand hue/radius/density picker
    │   └── DemoScript.astro            # Inlines a <script> to register moul components for demos
    └── styles/
        ├── globals.css                 # @import '@moul-dev/ui/tokens.css'; base site styles
        └── docs.css                    # Starlight overrides
```

### 2.3 `docs/package.json`

```jsonc
{
  "name": "docs",
  "private": true,
  "type": "module",
  "scripts": {
    "dev":   "astro dev",
    "build": "astro build",
    "start": "astro preview",
    "lint":  "biome check",
    "format": "biome format --write"
  },
  "dependencies": {
    "@moul-dev/ui": "workspace:*",
    "astro": "^5.x",
    "@astrojs/starlight": "^0.x"
  },
  "devDependencies": {
    "typescript": "^6.x",
    "@biomejs/biome": "^2.x",
    "@types/node": "^25.x"
  }
}
```

No React. No Tailwind. No Fumadocs. No Waku.

### 2.4 `astro.config.mjs`

```js
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Moul UI',
      logo: { src: './public/favicon.svg' },
      customCss: [
        './src/styles/globals.css',
        './src/styles/docs.css',
      ],
      sidebar: [
        { label: 'Getting Started', items: [
          { label: 'Introduction', slug: 'getting-started' },
          { label: 'Installation', slug: 'installation' },
          { label: 'Theming', slug: 'theming' },
        ]},
        { label: 'Components', autogenerate: { directory: 'components' } },
        { label: 'Blocks', autogenerate: { directory: 'blocks' } },
      ],
      social: { github: 'https://github.com/moul-dev/ui' },
    }),
  ],
})
```

### 2.5 Using `@moul-dev/ui` in MDX

Custom elements work directly in Astro MDX files — no wrapper, no JSX:

```mdx
---
title: Button
---

import ComponentPreview from '../../components/ComponentPreview.astro'

## Button

<ComponentPreview>
  <moul-button variant="primary">Click me</moul-button>
  <moul-button variant="secondary">Secondary</moul-button>
  <moul-button variant="ghost" is-pending>Loading</moul-button>
</ComponentPreview>

## With Icon

<ComponentPreview>
  <moul-button variant="outline" is-icon aria-label="Settings">
    <svg slot="icon-start"><use href="#gear"/></svg>
  </moul-button>
</ComponentPreview>
```

### 2.6 Component Registration in Docs

Components need to be registered before the browser parses the MDX-rendered HTML. Two patterns:

**Option A — Global barrel (simpler, larger bundle):**

```astro
<!-- src/components/DemoScript.astro -->
<script>
  import '@moul-dev/ui'  // registers all <moul-*> elements
</script>
```

Included in `ComponentPreview.astro` or the global layout.

**Option B — Per-page imports (tree-shakeable):**

```astro
---
// In the MDX frontmatter or Astro page
const components = ['button', 'modal']
---
<script>
  import '@moul-dev/ui/button'
  import '@moul-dev/ui/modal'
</script>
```

The plan defaults to Option A for the docs site — bundle size is not a concern for a documentation site, and it avoids per-page import management.

### 2.7 `ComponentPreview.astro`

The docs site's primary interactive wrapper — replaces the React `ComponentPreview` and `ComponentPlayground` from the old site:

```astro
---
// Renders a live preview area + source code tab
interface Props {
  title?: string
}
const { title } = Astro.props
---

<div class="component-preview">
  <div class="preview-area">
    <slot />
  </div>
</div>

<script>
  import '@moul-dev/ui'
</script>

<style>
  .component-preview {
    border: 1px solid var(--sl-color-gray-5);
    border-radius: 0.5rem;
    padding: 2rem;
    margin: 1.5rem 0;
  }
</style>
```

### 2.8 Theming in Docs

The existing theme selector (hue / radius / density / font scale) is preserved. It becomes a lightweight Astro component that writes CSS custom properties to `:root`:

```astro
<!-- src/components/ThemeSelector.astro -->
<div class="theme-selector">
  <!-- color swatches, radius buttons, density buttons -->
</div>

<script>
  // Reads/writes --moul-brand-hue, --moul-brand-radius-factor, etc. on :root
  // Persists to localStorage
  // Same logic as the existing _root.tsx inline script
</script>
```

Bootstrap 6 dark mode works via `data-bs-theme="dark"` on `<html>` — Starlight's dark mode toggle sets this attribute.

### 2.9 Content Migration

MDX content in `docs/content/` is framework-agnostic — the text, headings, and code blocks migrate unchanged. What changes:

| Old (Waku/Fumadocs) | New (Astro/Starlight) |
|---|---|
| `<ComponentPreview>` JSX component | `<ComponentPreview>` Astro component |
| `<Button variant="primary">` React component from `@moul-dev/ui` | `<moul-button variant="primary">` custom element |
| `<Modal>` compound React component | `<moul-modal>` with named slots |
| `<Tabs>`, `<Tab>` from fumadocs-ui | Starlight's built-in `<Tabs>` or `<moul-tabs>` |
| `<TypeTable>` from fumadocs-ui | `<PropsTable>` Astro component |
| `<Steps>`, `<Step>` from fumadocs-ui | Starlight's built-in steps |
| Demo components (`AlertDemo`, `ModalDemo`, etc.) | Inline MDX using custom elements directly |
| i18n via Waku `[lang]` route | Starlight's built-in i18n |

Changelog MDX files in `docs/content/changelog/` migrate as-is to `docs/src/changelog/`.

---

## Part 3 — Implementation Phases

### Phase 1 — Foundation
**Scope:** Tooling setup, shared base, all controllers, proof-of-concept `<moul-button>`.

#### 1A — UI Tooling
- Remove `@vitejs/plugin-react`, `@stylexjs/unplugin`, `preserveTokensStylexPlugin` from `ui/`
- Update `vite.config.ts` to multi-entry build (barrel + per-component glob)
- Update `tsconfig.app.json`: `useDefineForClassFields: false`, `target: ES2022`
- Update `biome.json`: remove React domain, keep all a11y rules active
- Update `ui/package.json`: add `lit`, `bootstrap@6.0.0-alpha.1`, `@floating-ui/dom`; remove all React + StyleX deps; update exports map; update `keywords` + `description`

#### 1B — Shared foundation
- `src/shared/bootstrap.styles.ts` — `bootstrapSheet` singleton
- `src/shared/base.ts` — `MoulBase` class
- `src/shared/tokens.css` — brand CSS custom properties

#### 1C — All 7 controllers
- `FocusTrapController`
- `ScrollLockController`
- `FloatingUIController`
- `HoverController`
- `RovingTabindexController`
- `KeyboardListController`
- `LiveRegionController`

#### 1D — Proof-of-concept: `<moul-button>`
- Props: `variant`, `size`, `is-pending`, `is-disabled`, `is-icon`
- Slots: default, `icon-start`, `icon-end`
- Bootstrap: `.btn .btn-{variant}`, `.btn-{size}`
- ARIA: `aria-disabled`, `aria-busy`, `aria-label` (is-icon)
- Events: `moul-press` (composed, bubbles)
- Keyboard: Enter + Space fire `moul-press`
- Validation: keyboard navigation, VoiceOver role + state

**Exit criteria:** `bun run build:ui` produces `dist/index.js` + `dist/components/Button/index.js`. Both import modes (`@moul-dev/ui` and `@moul-dev/ui/button`) register the element. `<moul-button>` passes keyboard + screen reader check.

---

### Phase 2 — Display & Layout (~18 components)
**Scope:** All stateless/display components. No controllers needed.

For each: `LitElement` class → Bootstrap classes in `render()` → scoped `css\`\`` styles → `index.ts` → entry in barrel.

| Component | Bootstrap classes | Slots |
|---|---|---|
| `<moul-alert>` | `.alert .alert-{variant}` | default, `icon`, `actions` |
| `<moul-badge>` | `.badge .text-bg-{variant}` | default |
| `<moul-avatar>` + `<moul-avatar-group>` | Utilities | default (image or initials) |
| `<moul-breadcrumbs>` + `<moul-breadcrumb-item>` | `.breadcrumb .breadcrumb-item` | default |
| `<moul-card>` | `.card` | `header`, `body`, `footer` |
| `<moul-empty-state>` | Grid + utilities | `icon`, `title`, `description`, `actions` |
| `<moul-kbd>` | Custom | default |
| `<moul-separator>` | `<hr>` | — |
| `<moul-skeleton>` | `.placeholder .placeholder-glow` | — |
| `<moul-spinner>` | `.spinner-border` / `.spinner-grow` | — |
| `<moul-progress-bar>` | `.progress .progress-bar` | — |
| `<moul-percentage-bar>` | `.progress` custom fill | — |
| `<moul-percentage-circle>` | SVG + CSS var | — |
| `<moul-typography>` + sub-variants | `.h1–.h6`, `.lead` | default |
| `<moul-stat>` | Utilities | `label`, `value`, `trend` |
| `<moul-top-list>` | `.list-group` | default |
| `<moul-logs-viewer>` | Custom CSS | default |
| `<moul-link>` | `.link-{variant}` | default |

**Exit criteria:** All components render in sandbox with correct Bootstrap theming. `data-bs-theme="dark"` on ancestor inverts colors correctly.

---

### Phase 3 — Form Primitives & Basic Inputs
**Scope:** Form infrastructure and all simple inputs.

#### 3A — Form primitives
- `<moul-label>` — `.form-label`, `for` passthrough
- `<moul-description>` — `.form-text`
- `<moul-field-error>` — `.invalid-feedback`, `role=alert`, `LiveRegionController`
- `<moul-form>` — `.needs-validation`, constraint validation API integration

#### 3B — Inputs
- `<moul-text-field>` — `.form-control`, controlled value, valid/invalid CSS states
- `<moul-text-area>` — `.form-control`, `rows`, auto-resize option
- `<moul-search-field>` — `.form-control` + clear button, `role=searchbox`
- `<moul-checkbox>` — `.form-check-input`, `indeterminate`, `aria-checked`
- `<moul-checkbox-group>` — `role=group`
- `<moul-radio-group>` + `<moul-radio>` — `RovingTabindexController`, `role=radiogroup/radio`
- `<moul-switch>` — `.form-check .form-switch`, `role=switch`, `aria-checked`
- `<moul-toggle-button>` + `<moul-toggle-button-group>` — toggle state, exclusive mode
- `<moul-button-group>` — layout + optional selection
- `<moul-slider>` — `.form-range`, dual-thumb via two overlapping `<input type=range>`; `role=slider`
- `<moul-number-field>` — `.form-control` + increment/decrement; spinbutton ARIA; held-key repeat

**Exit criteria:** All inputs keyboard-navigable. Constraint validation messages surface via `<moul-field-error>`. VoiceOver announces group labels and checked states.

---

### Phase 4 — Overlays
**Scope:** All overlay components. FocusTrap, FloatingUI, ScrollLock, LiveRegion controllers exercised at full depth.

- `<moul-modal>` — `.modal .modal-dialog .modal-content`; `FocusTrapController` + `ScrollLockController`; `is-open`, `size`, `is-dismissable`; Escape closes; slots: `header`, `body`, `footer`
- `<moul-alert-dialog>` — same as modal + `role=alertdialog`; backdrop click never dismisses
- `<moul-drawer>` — `.offcanvas .offcanvas-{placement}`; `FocusTrapController` + `ScrollLockController`; `placement` (left/right/top/bottom); swipe-to-close via pointer events on `slot="handle"`; open/close via Web Animations API
- `<moul-popover>` + `slot="trigger"` / `slot="content"` — `FloatingUIController`; `role=dialog`; fires `moul-open`/`moul-close`
- `<moul-tooltip>` + `slot="trigger"` — `FloatingUIController` + `HoverController`; `role=tooltip`; 300 ms open delay
- `<moul-toast>` + `<moul-toast-container>` — `role=status`; `LiveRegionController`; queue as `@state()` array on container singleton; auto-dismiss timer; fires `moul-dismiss`

**Exit criteria:** Modal/Drawer trap focus on open, restore on close. Escape closes all overlays. VoiceOver announces Toast live region. Floating UI positions correctly on viewport scroll.

---

### Phase 5 — Selection & Navigation
**Scope:** Collection components requiring keyboard navigation patterns.

- `<moul-listbox>` + `<moul-listbox-item>` + `<moul-listbox-section>` — `KeyboardListController`; `role=listbox/option`; single + multi-select; `aria-activedescendant`
- `<moul-select>` + `<moul-select-item>` + `<moul-select-section>` — trigger button + `FloatingUIController` + listbox; `role=combobox` on trigger
- `<moul-combobox>` + `<moul-combobox-item>` + `<moul-combobox-section>` — controlled input + `FloatingUIController` + live filtering; `aria-autocomplete=list`; `aria-activedescendant`
- `<moul-autocomplete>` + items — async mode: fires `moul-filter` event, consumer updates slotted items; loading state; `slot="empty-state"`
- `<moul-tag-group>` + `<moul-tag>` — selection; removeable with `aria-label="Remove {label}"` button
- `<moul-tabs>` + `<moul-tab>` + `<moul-tab-panel>` — `RovingTabindexController`; `role=tablist/tab/tabpanel`; `selected-key` prop
- `<moul-pagination>` — `selected-key`; first/prev/next/last; ellipsis; page size selector; fires `moul-change`
- `<moul-sidebar>` + sub-elements — collapse state; mobile overlay using `<moul-drawer>` internally; scroll tracking via `IntersectionObserver`
- `<moul-input-otp>` + `<moul-input-otp-slot>` + `<moul-input-otp-separator>` — custom Lit (replaces `input-otp` React lib); auto-advance on input; backspace; paste splits across slots

**Exit criteria:** `aria-activedescendant` updates correctly on ComboBox/Select keyboard nav. VoiceOver announces selection changes. Tabs keyboard pattern matches WAI-ARIA APG spec.

---

### Phase 6 — Date Components
**Scope:** All four date components using `bootstrap.Datepicker` in shadow roots.

- `<moul-date-picker>` — single date selection
- `<moul-date-range-picker>` — range selection; `display-months-count="2"` default
- `<moul-calendar>` — inline calendar; single/multiple/range modes
- `<moul-range-calendar>` — inline range calendar

All follow the initialization pattern in section 1.7. `vcp-options` attribute exposes the full `vanilla-calendar-pro` option passthrough.

**Exit criteria:** All four components open/close; keyboard-navigable inside shadow root; `moul-change` fires with correct date payload; `data-bs-theme="dark"` toggles the picker theme.

---

### Phase 7 — CommandPalette
**Scope:** Port the existing custom keyboard state machine to Lit. This component is already React Aria-independent — it is the most portable component in the codebase.

- `<moul-command-palette>` — global keyboard shortcut in `connectedCallback`; `@state() _activeId`; `@state() _query`; item discovery via slot + `MutationObserver`; `FocusTrapController`
- `<moul-command-palette-section>` + `<moul-command-palette-item>` — item provides `value`, `keywords` attributes; fires `moul-action` on activation

**Exit criteria:** Global shortcut opens palette; typing filters items; arrow keys navigate; Enter triggers `moul-action`; Escape closes; VoiceOver announces active item.

---

### Phase 8 — Docs Site Rebuild
**Scope:** Delete `docs/` entirely, scaffold new Astro + Starlight site, migrate content.

#### 8A — Scaffold
- Delete all files under `docs/`
- `bun create astro docs/ -- --template starlight`
- Configure `astro.config.mjs` (sidebar, theme, custom CSS)
- Add `@moul-dev/ui: workspace:*` dependency
- Add `ComponentPreview.astro`, `PropsTable.astro`, `CodeBlock.astro`, `ThemeSelector.astro`
- Set up `src/styles/globals.css`: `@import '@moul-dev/ui/tokens.css'`
- Port theme init script from `_root.tsx` inline `<script>` to Astro layout head

#### 8B — Content migration
- Move all MDX from `docs/content/docs/` → `docs/src/content/docs/`
- Move all MDX from `docs/content/changelog/` → `docs/src/changelog/`
- Replace all React JSX component usage in MDX:
  - `<Button variant="primary">` → `<moul-button variant="primary">`
  - `<Modal isOpen>...</Modal>` → `<moul-modal is-open>...</moul-modal>` with named slots
  - `<ComponentPreview>` JSX → `<ComponentPreview>` Astro component
  - `<TypeTable>` → `<PropsTable>` Astro component
  - `<Tabs>`, `<Tab>` fumadocs → Starlight built-in
  - Demo components (`ModalDemo`, `AlertDemo`, etc.) → inline custom element markup
- Update `docs/public/AGENTS.md`, `llms.txt`, `llms-full.txt` to reflect new stack

#### 8C — Root workspace scripts
- Update root `package.json` scripts: `dev:docs`, `build:docs` → `astro dev`, `astro build`

**Exit criteria:** `bun run dev:docs` serves the docs site. All component pages render with live previews. Dark mode toggle works. No React, Tailwind, Fumadocs, or Waku imports anywhere in `docs/`.

---

### Phase 9 — Cleanup & Release

- Remove all remaining React Aria, StyleX, motion, recharts from `ui/package.json`
- Delete all `*.styles.ts` (StyleX) source files
- Delete `ui/src/tokens/tokens.stylex.ts`
- Delete `ThemeProvider` React component
- Update `biome.json`: remove React linter domain
- Run `bun run sync:llms` — regenerate LLM context files
- `bun run bump` — CalVer version bump
- Write changelog entry in `docs/src/changelog/`
- Update `README.md`

---

## Part 4 — Risk Register

| Risk | Severity | Mitigation |
|---|---|---|
| Bootstrap 6 alpha API changes before beta | Medium | Pin `6.0.0-alpha.1` exactly; review Bootstrap changelog before changing the pin |
| `bootstrap.Datepicker` shadow DOM support regresses in an alpha update | Medium | Officially documented — treat regression as a blocking Bootstrap bug; hold pin until fixed |
| `FocusTrapController` fails in nested overlay scenarios | Medium | Unit-test in isolation in Phase 1C; cover Drawer-inside-Sidebar and ComboBox-inside-Modal in Phase 4 |
| ComboBox/Select `aria-activedescendant` incorrect | High | Validate against WAI-ARIA APG combobox spec at Phase 5 exit; test with VoiceOver + NVDA |
| Bootstrap CSS `:root` tokens don't cascade into shadow roots | Low | CSS custom properties cascade through shadow boundaries by spec; verify in Phase 1D PoC |
| Astro + Starlight MDX component API changes | Low | Pin Astro + Starlight versions; only upgrade intentionally |
| Custom element name collision with third-party `moul-*` elements | Low | `moul-` prefix is project-specific; document naming convention in `AGENTS.md` |
| `vcpOptions` passthrough exposes VCP extensions Bootstrap doesn't load | Low | Bootstrap 6 docs note: only the `months` extension is loaded; document which VCP options are safe to use |
