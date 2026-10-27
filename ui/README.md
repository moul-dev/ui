# @moul-dev/ui

> Accessible, themeable Web Components built on Lit 3 and native browser APIs.

[![npm version](https://img.shields.io/npm/v/@moul-dev/ui.svg)](https://www.npmjs.com/package/@moul-dev/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a library of 79 `<moul-*>` custom elements for teams that want one consistent UI baseline across every web stack. Register the elements once, then use the same markup in plain HTML, Astro, Vue, Svelte, Lit, server-rendered templates, or React 19.

---

## ✨ Features

- 🧩 **Standard custom elements**: Every component is a Lit 3 element with Shadow DOM. No framework runtime, wrappers, or adapters.
- 🧱 **Native browser primitives**: Modals, drawers, and the command palette use `<dialog>`. Popovers, tooltips, selects, and combo boxes open in the top layer through the Popover API, positioned with CSS Anchor Positioning where supported.
- 📝 **Real form controls**: Inputs are form-associated through `ElementInternals`, so they submit with a native `<form>` and `FormData` and report validity like built-in inputs.
- 🎨 **Runtime theming**: A CSS token layer (`light-dark()` + `oklch()`) themes light and dark mode from one set of declarations. Retune hue, chroma, font, radius, and density at runtime, and style internals through `::part()`.
- ♿ **Accessible by default**: Keyboard navigation, focus management, and ARIA semantics are built into each element.
- 📊 **Charts and dashboards**: Area, bar, line, doughnut, heatmap, and funnel charts, plus stat cards, top lists, and percentage indicators, drawn with `d3-scale` and `d3-shape`.
- 🧾 **Editor tooling**: Ships a Custom Elements Manifest (`dist/custom-elements.json`) and `HTMLElementTagNameMap` typings for tag, attribute, and event completion.

---

## 📦 Installation

```bash
bun add @moul-dev/ui
# or: npm install @moul-dev/ui / pnpm add @moul-dev/ui / yarn add @moul-dev/ui
```

---

## 🚀 Quick Start

Import the design tokens and register the elements once, in your client entry point:

```ts
import '@moul-dev/ui/style.css' // design tokens
import '@moul-dev/ui'           // registers every <moul-*> element
```

Then write the elements as HTML:

```html
<moul-alert tone="success" title="Deployed" description="Release 2026.10 is live."></moul-alert>

<moul-chart-container title="Active users" description="Last 6 months">
  <moul-line-chart x-key="month" height="260"></moul-line-chart>
</moul-chart-container>

<moul-button variant="primary" id="save">Save</moul-button>
```

Simple values are attributes (`is-disabled`, `x-key`, `variant`). Arrays, objects, and functions are JavaScript properties. Components report changes through standard DOM events, with payloads on `event.detail`:

```js
const chart = document.querySelector('moul-line-chart')
chart.data = [
  { month: 'Jan', users: 186 },
  { month: 'Feb', users: 305 },
  { month: 'Mar', users: 237 },
]
chart.series = [{ key: 'users', name: 'Users' }]

document.querySelector('#save').addEventListener('press', () => {
  // ...
})
```

### React 19

React 19 passes properties to custom elements and attaches listeners for `on<eventname>` props:

```tsx
import '@moul-dev/ui'
import '@moul-dev/ui/style.css'

export function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <moul-button variant="primary" onpress={onSave}>
      Save
    </moul-button>
  )
}
```

---

## 🎨 Theming

Override the brand hooks on `:root` or on any ancestor; every element below it follows:

```css
:root {
  --brand-hue: 160;
  --brand-chroma-multiplier: 1.1;
  --brand-font-family: 'Inter', sans-serif;
  --brand-font-scale: 1;
  --brand-radius-factor: 1.25;
  --brand-density-factor: 0.9;
}
```

Try values live in the Theme Studio on the [documentation site](https://moul.dev/ui).

---

## 🧭 Components

- **Actions & toggles**: button, button group, toggle button, toggle button group
- **Inputs & forms**: text field, number field, search field, text area, checkbox (+ group), radio group, switch, slider, select, combo box, date picker, calendar, input OTP, form
- **Overlays & navigation**: modal, alert dialog, drawer, popover, tooltip, command palette, tabs, breadcrumbs, pagination, link
- **Surfaces & feedback**: alert, card, badge, avatar (+ group), typography, kbd, separator, spinner, skeleton, progress bar, tag group, table, toast, empty state
- **Charts**: area, bar, line, doughnut, heatmap, funnel, stat, top list, percentage bar and circle, chart container and tooltip
- **Blocks**: logs viewer, sidebar

Every element, attribute, event, slot, and CSS part is documented at **[moul.dev/ui](https://moul.dev/ui)**.

---

## ↪️ Migrating from v2026.9.28 (React)

v2026.9.28 is the last React release. Pin it to stay on React (`@moul-dev/ui@2026.9.28`). To move to custom elements:

- Replace `import { Button } from '@moul-dev/ui'` with a single `import '@moul-dev/ui'` and write `<moul-button>`.
- Boolean props become attributes (`isDisabled` → `is-disabled`); handlers become DOM listeners (`onPress` → `press`).
- `@moul-dev/ui/tokens`, `@moul-dev/ui/tokens.stylex`, `@moul-dev/ui/theme.css`, and `@moul-dev/ui/style` are removed; import `@moul-dev/ui/style.css`.
- `ThemeProvider` is gone; theme with the CSS brand hooks above.
- `Autocomplete` is covered by `<moul-combobox>`. `ListBox` and `DateField` have no direct replacement yet.

The v2026.10.27 release notes in the [documentation site](https://moul.dev/ui) changelog walk through the full migration.

---

## 🛠️ Development

This package lives in the [moul-dev/ui](https://github.com/moul-dev/ui) monorepo; see its README for the sandbox, docs site, and workspace scripts.

---

## 📄 License

MIT © [Moul](https://moul.dev)
