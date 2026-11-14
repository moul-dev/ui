# @moul-dev/web-component

> Accessible, themeable Web Components built on Lit 3 and native browser APIs.

[![npm version](https://img.shields.io/npm/v/@moul-dev/web-component.svg)](https://www.npmjs.com/package/@moul-dev/web-component)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a library of `<moul-*>` custom elements for teams that want one consistent UI baseline across every web stack. Register the elements once, then use the same markup in plain HTML, Astro, Vue, Svelte, Lit, server-rendered templates, or React 19.

---

## ✨ Features

- 🧩 **Standard custom elements**: Every component is a Lit 3 element with Shadow DOM. No framework runtime, wrappers, or adapters.
- 🧱 **Native browser primitives**: Modals, drawers, and the command palette use `<dialog>`. Popovers, tooltips, selects, and combo boxes open in the top layer through the Popover API, positioned with CSS Anchor Positioning where supported.
- 📝 **Real form controls**: Inputs are form-associated through `ElementInternals`, so they submit with a native `<form>` and `FormData` and report validity like built-in inputs.
- 🎨 **Runtime theming**: A CSS token layer (`light-dark()` + `oklch()`) themes light and dark mode from one set of declarations. Retune hue, chroma, font, radius, and density at runtime, and style internals through `::part()`.
- ♿ **Accessible by default**: Keyboard navigation, focus management, and ARIA semantics are built into each element.
- 📊 **Charts and dashboards**: Area, bar, line, doughnut, heatmap, and funnel charts, plus stat cards, top lists, and percentage indicators, drawn with `d3-scale` and `d3-shape`.
- 🪶 **Three imports, by weight**: app elements, motion effects, and canvas or WebGL pieces are separate entry points. An app that never imports the effects ships none of them, and each canvas element downloads only when its tag first appears.
- 🧾 **Editor tooling**: Ships a Custom Elements Manifest (`dist/custom-elements.json`) and `HTMLElementTagNameMap` typings for tag, attribute, and event completion.

---

## 📦 Installation

```bash
bun add @moul-dev/web-component
# or: npm install @moul-dev/web-component / pnpm add @moul-dev/web-component / yarn add @moul-dev/web-component
```

---

## 🚀 Quick Start

Import the design tokens and register the elements once, in your client entry point:

```ts
import '@moul-dev/web-component/style.css' // design tokens
import '@moul-dev/web-component'           // registers every <moul-*> element
```

Then write the elements as HTML:

```html
<moul-alert tone="success" title="Deployed" description="Release 2026.10 is live."></moul-alert>

<moul-chart-container title="Active users" description="Last 6 months">
  <moul-line-chart x-key="month" height="260"></moul-line-chart>
</moul-chart-container>

<moul-button variant="primary" id="save">Save</moul-button>
```

Text effects, backgrounds, site navigation, and pointer and scroll motion live in a second entry, and canvas and WebGL pieces in a third. Import them only where you use them:

```ts
import '@moul-dev/web-component/effects' // <moul-reveal>, <moul-aurora>, <moul-navbar>, <moul-tilt>, …
import '@moul-dev/web-component/canvas'  // registers nothing up front; loads <moul-globe>, <moul-particles>, … on first sight
```

The canvas loader watches the page. Inside a shadow root, call `watchCanvasElements(shadowRoot)`, or import one element straight away with `import '@moul-dev/web-component/canvas/globe'`.

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
import '@moul-dev/web-component'
import '@moul-dev/web-component/style.css'

export function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <moul-button variant="primary" onpress={onSave}>
      Save
    </moul-button>
  )
}
```

### Before the elements register

Until its definition loads, a `<moul-*>` tag is an unknown element, so its slotted text shows unstyled for a moment. To hide elements until they register, add this to your own stylesheet:

```css
:not(:defined) {
  visibility: hidden;
}
```

The rule matches every custom element that is not defined yet, Moul's or not. Only use it when the page imports every entry whose tags it contains: an element from an entry you never import stays hidden.

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

<!-- sync:llms:readme:start -->
<!-- Generated by `bun run sync:llms --write` from the Custom Elements Manifest. Edit scripts/sync-llms.ts instead. -->

196 elements, split across three imports so an app ships only what it imports:

| Import | Registers |
| --- | --- |
| `@moul-dev/web-component` | 121 app elements: forms, overlays, feedback, data, charts, the AI kit and blocks |
| `@moul-dev/web-component/effects` | 60 motion and landing-page elements: text effects, backgrounds and light, site navigation and media, pointer and scroll effects |
| `@moul-dev/web-component/canvas` | 15 canvas and WebGL elements, each downloaded the first time its tag appears |

- **Charts & Data Visualization**: area chart, bar chart, line chart, doughnut chart, heatmap chart, funnel chart, top list, stat, percentage, chart container, chart tooltip
- **Actions & Toggles**: button, button group, slide to confirm, split button, theme toggle, toggle button, toggle button group
- **Inputs & Forms**: text field, number field, search field, text area, checkbox, checkbox group, radio group, switch, slider, select, combo box, date picker, file upload, calendar, input OTP, form
- **Overlays & Navigation**: modal, alert dialog, drawer, dropdown menu, stepper, tree, popover, tooltip, hover card, notification bell, tour, focus mode, command palette, tabs, breadcrumbs, pagination, link
- **Surfaces & Feedback**: accordion, alert, animated list, card, badge, number ticker, avatar, typography, kbd, separator, icon morph, spinner, step loader, skeleton, progress bar, result card, tag group, table, selection toolbar, toast, empty state, expandable card, pull to refresh, confetti (`/effects`)
- **Data & Developer**: activity feed, code block, code comparison, file tree, history ledger, relationship graph, terminal, timeline
- **AI Kit**: agent activity, chat, prompt input, streaming response, thinking indicator
- **Landing Kit** (`/effects`): reveal, text entrance, typewriter, word rotate, scramble, gradient text, highlight, marquee, bento grid, browser frame, phone frame, scroll progress
- **Backgrounds & Light** (`/effects`): pattern, perspective grid, ripple, aurora, noise, light rays, spotlight, border beam, shine border, beams, backlight, focus group, edge blur, orbit
- **Navigation & Media** (`/effects`): navbar, banner, navigation menu, dock, progress nav, carousel, image slider, compare, video dialog, world map
- **Pointer & Scroll** (`/effects`): tilt, magnetic, glow border, hover highlight, direction hover, lens, cursor, mask reveal, pointer parallax, connector beam, scroll text, sticky stack, scroll parallax, sticky scroll, tracing beam, scroll frame, page transition
- **Canvas & WebGL** (`/canvas`): particles, starfield, warp, glyph rain, flow field, shader field, interactive grid, press particles, cursor trail, dissolve, image loader, image effect, zoom grid, icon cloud, globe
- **Composite Blocks**: logs viewer, sidebar
<!-- sync:llms:readme:end -->

Every element, attribute, event, slot, and CSS part is documented at **[moul.dev/ui](https://moul.dev/ui)**.

---

## ↪️ Migrating from v2026.9.28 (React)

v2026.9.28 is the last React release, published as `@moul-dev/ui`. Pin it to stay on React (`@moul-dev/ui@2026.9.28`). To move to custom elements:

- Swap the package: `bun remove @moul-dev/ui && bun add @moul-dev/web-component`.
- Replace `import { Button } from '@moul-dev/ui'` with a single `import '@moul-dev/web-component'` and write `<moul-button>`.
- Boolean props become attributes (`isDisabled` → `is-disabled`); handlers become DOM listeners (`onPress` → `press`).
- `@moul-dev/ui/tokens`, `@moul-dev/ui/tokens.stylex`, `@moul-dev/ui/theme.css`, and `@moul-dev/ui/style` are removed; import `@moul-dev/web-component/style.css`.
- `ThemeProvider` is gone; theme with the CSS brand hooks above.
- `Autocomplete` is covered by `<moul-combobox>`. `ListBox` and `DateField` have no direct replacement yet.

The v2026.10.27 release notes in the [documentation site](https://moul.dev/ui) changelog walk through the full migration.

---

## 🛠️ Development

This package lives in the [moul-dev/ui](https://github.com/moul-dev/ui) monorepo; see its README for the sandbox, docs site, and workspace scripts.

---

## 📄 License

MIT © [Moul](https://moul.dev)
