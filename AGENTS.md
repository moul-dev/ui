# Moul UI Workspace

A multi-project monorepo workspace managed with **Bun**, featuring:
- **`@moul-dev/ui`**: Standards-first Web Components library (`<moul-*>` custom elements) built with Lit 3, Shadow DOM, and a native CSS token layer.
- **`docs`**: Documentation site built with Astro Starlight (English at the root, Khmer under `/km/`).

## Monorepo Layout

```
.
├── package.json         # Workspace root scripts
├── bun.lock             # Bun workspace lockfile
├── biome.json           # Lint & format rules (ui/ and docs/)
├── AGENTS.md            # This file
├── rdt/                 # Requirements, design, and task list for the Lit rebuild
├── scripts/             # dev, gen:component, sync:llms, bump, verify-no-react, setup-hooks
├── ui/                  # Component library package
│   ├── package.json     # Library exports (`.` and `./style.css`)
│   ├── vite.config.ts   # Vite library build + Vitest (happy-dom)
│   ├── custom-elements-manifest.config.mjs
│   ├── index.html       # Kitchen-sink sandbox (`bun run dev:ui`)
│   └── src/
│       ├── index.ts     # Single public entry point
│       ├── styles/      # style.css token layer, reset, semantic tones
│       ├── controllers/ # Press, LayoutIndicator, OverlayPresence, NumberSpring, FormInternals
│       ├── utils/       # defineElement, motion, focus trap, icons
│       ├── sandbox.ts   # Sandbox sections (component order mirrored by the docs sidebar)
│       └── components/  # <ComponentName>/<ComponentName>.ts, .styles.ts, index.ts
└── docs/                # Astro Starlight site
    ├── astro.config.mjs # Locales, sidebar (incl. changelog list), source aliases
    ├── public/          # AGENTS.md, llms.txt, llms-full.txt (generated)
    └── src/
        ├── categories.ts # Component sidebar groups
        ├── components/  # ComponentPreview, ThemeInspector, Hero, Features, demos/
        ├── pages/       # theme.astro (/theme Theme Studio)
        └── content/docs/ # English (root) & Khmer (km/) MDX
```

## Available Scripts

Run these commands from the root directory:

- **Run Dev Servers (sandbox + docs, concurrently)**:
  ```bash
  bun dev
  ```
- **Run UI Sandbox Dev Server (Vite)**:
  ```bash
  bun run dev:ui
  ```
- **Run Docs Dev Server (Astro)**:
  ```bash
  bun run dev:docs
  ```
- **Scaffold New Lit Component** (class, styles, test, index, docs MDX stub):
  ```bash
  bun run gen:component <ComponentName>
  ```
- **Validate LLM Context Files** (fails if any custom element is undocumented):
  ```bash
  bun run sync:llms
  ```
- **Regenerate LLM Context Files** from `ui/dist/custom-elements.json`:
  ```bash
  bun run sync:llms --write
  ```
- **Run Tests (Vitest)**:
  ```bash
  bun run test
  ```
- **Run Lint / Format (Biome)**:
  ```bash
  bun run lint
  bun run format
  ```
- **Build UI Library** (verify-no-react → `tsc -b` → `vite build` → `cem analyze`):
  ```bash
  bun run build:ui
  ```
- **Build Docs Website**:
  ```bash
  bun run build:docs
  ```
- **Bump UTC CalVer Version** (`YYYY.M.D`, then `YYYY.M.D.N` for same-day bumps):
  ```bash
  bun run bump
  ```

## Tech Stack & Configurations

### 1. UI Library (`ui/`)
- **Lit 3 Custom Elements**: Every component is a `LitElement` subclass registered with an idempotent `defineElement('moul-*', Class)` and an open Shadow Root.
- **CSS Token Layer**: `ui/src/styles/style.css` defines `:root` custom properties (OKLCH + `light-dark()`), emitted to `dist/assets/style.css` and exported as `@moul-dev/ui/style.css`. Brand hooks: `--brand-hue`, `--brand-chroma-multiplier`, `--brand-font-family`, `--brand-font-scale`, `--brand-radius-factor`, `--brand-density-factor`.
- **Native Platform APIs**: `ElementInternals` for form association, `<dialog>` for modals, the Popover API + CSS anchor positioning for overlays.
- **Vite Library Mode**: Emits `dist/moul-ui.js` (prefixed with a `"use client";` banner for RSC frameworks) and `dist/src/index.d.ts`.
- **Custom Elements Manifest**: `cem analyze` writes `dist/custom-elements.json`, the source of truth for `sync:llms`.
- **No React**: `scripts/verify-no-react.ts` fails the build if React, React Aria, StyleX, or `@lit/react` appear in `ui/` or `docs/` manifests.

### 2. Documentation Website (`docs/`)
- **Astro Starlight**: Static output, bilingual i18n (`defaultLocale: 'root'` for English at the root, `km` under `/km/`).
- **Previews**: `ComponentPreview.astro` renders native `<moul-*>` tags directly in MDX and loads `@moul-dev/ui` client-side. `data-props='{…}'` assigns JSON as element properties. `astro.config.mjs` aliases `@moul-dev/ui` and `@moul-dev/ui/style.css` to `ui/src`, so previews track the library source.
- **Styling**: `docs/src/styles/global.css` imports `@moul-dev/ui/style.css`, maps Starlight colors onto the tokens, and sets Khmer content (`:lang(km)`) in `Noto Sans Khmer`.
- **Pages**: Add component slugs to `docs/src/categories.ts`. Every English page needs a Khmer page at the same path under `km/`; component pages keep the English body with a translated `title` and `description`. New changelog entries go in the `Changelog` sidebar group in `astro.config.mjs` and in both `changelog/index.mdx` files.

## AI Coding Agent Guidelines for `@moul-dev/ui`

<!-- sync:llms:start -->
<!-- Generated by `bun run sync:llms --write`. Edit scripts/sync-llms.ts instead. -->

When generating or editing code that uses `@moul-dev/ui`:

- **Imports**: `import '@moul-dev/ui'` once registers every `<moul-*>` element. Import design tokens with `import '@moul-dev/ui/style.css'`. There is no `@moul-dev/ui/react`, `@moul-dev/ui/tokens`, or `@moul-dev/ui/tokens.stylex` entry point.
- **Markup, not JSX components**: Write native custom element tags (`<moul-button>`), never PascalCase components (`<Button>`). They work in plain HTML, Astro, Lit, Vue, Svelte, and React 19.
- **Attributes are kebab-case**: Boolean state uses presence attributes such as `is-disabled`, `is-open`, `is-checked`, `is-required`. The matching JS property is camelCase (`el.isDisabled = true`).
- **Rich data is set as properties**: Arrays, objects, and functions (`data`, `series`, `columns`, `items`, `logs`, `valueFormatter`) are assigned in JavaScript, not serialized into attributes.
- **Events are DOM events**: Listen with `addEventListener` (`press`, `change`, `input`, `openchange`, `selectionchange`, `pagechange`, `dismiss`). Payloads live on `event.detail`. There is no `onPress` prop.
- **Overlays**: Toggle `is-open` (or `el.isOpen`) on `<moul-modal>`, `<moul-drawer>`, `<moul-alert-dialog>`, `<moul-popover>`, `<moul-tooltip>`, `<moul-command-palette>`, and react to `openchange` (`detail.isOpen`).
- **Forms**: Inputs are form-associated via `ElementInternals`; give each a `name` and it submits with a native `<form>` / `FormData`.
- **Semantic tones & variants**: `tone` is one of `primary | accent | success | warning | error`; surface `variant` is one of `solid | flat | shadow | bordered | glass`. `<moul-button>` has its own `variant` set (`primary | secondary | tertiary | outline | ghost | danger | danger-soft`).
- **Accessibility**: Icon-only buttons (`is-icon`) and dot badges (`is-dot`) must have an `aria-label`.
- **Theming**: Override `--brand-hue`, `--brand-chroma-multiplier`, `--brand-font-family`, `--brand-font-scale`, `--brand-radius-factor`, and `--brand-density-factor` on `:root` (or any ancestor). Style internals through `::part(...)`.

**Element index** (full API in `docs/public/llms-full.txt`):

- **Charts & Data Visualization**: `<moul-area-chart>`, `<moul-bar-chart>`, `<moul-line-chart>`, `<moul-doughnut-chart>`, `<moul-heatmap-chart>`, `<moul-funnel-chart>`, `<moul-top-list>`, `<moul-stat>`, `<moul-percentage-bar>`, `<moul-percentage-circle>`, `<moul-chart-container>`, `<moul-chart-tooltip>`
- **Actions & Toggles**: `<moul-button>`, `<moul-button-group>`, `<moul-toggle-button>`, `<moul-toggle-button-group>`
- **Inputs & Forms**: `<moul-text-field>`, `<moul-number-field>`, `<moul-search-field>`, `<moul-text-area>`, `<moul-checkbox>`, `<moul-checkbox-group>`, `<moul-radio-group>`, `<moul-radio>`, `<moul-switch>`, `<moul-slider>`, `<moul-select>`, `<moul-select-item>`, `<moul-combobox>`, `<moul-combobox-item>`, `<moul-date-picker>`, `<moul-calendar>`, `<moul-input-otp>`, `<moul-form>`
- **Overlays & Navigation**: `<moul-modal>`, `<moul-alert-dialog>`, `<moul-drawer>`, `<moul-popover>`, `<moul-tooltip>`, `<moul-command-palette>`, `<moul-tabs>`, `<moul-tab>`, `<moul-tab-panel>`, `<moul-breadcrumbs>`, `<moul-breadcrumb-item>`, `<moul-pagination>`, `<moul-link>`
- **Surfaces & Feedback**: `<moul-alert>`, `<moul-card>`, `<moul-card-header>`, `<moul-card-body>`, `<moul-card-footer>`, `<moul-badge>`, `<moul-avatar>`, `<moul-avatar-group>`, `<moul-typography>`, `<moul-kbd>`, `<moul-separator>`, `<moul-spinner>`, `<moul-skeleton>`, `<moul-progress-bar>`, `<moul-tag-group>`, `<moul-tag>`, `<moul-table>`, `<moul-toast>`, `<moul-toast-region>`, `<moul-empty-state>`
- **Composite Blocks**: `<moul-logs-viewer>`, `<moul-logs>`, `<moul-sidebar>`, `<moul-sidebar-aside>`, `<moul-sidebar-header>`, `<moul-sidebar-brand>`, `<moul-sidebar-group>`, `<moul-sidebar-item>`, `<moul-sidebar-divider>`, `<moul-sidebar-footer>`, `<moul-sidebar-user>`, `<moul-sidebar-main>`
<!-- sync:llms:end -->

### Machine-Readable Context Files
- **Public Agent Rules & Recipes**: `docs/public/AGENTS.md` (served at `/AGENTS.md`)
- **LLM Index Specification**: `docs/public/llms.txt` (served at `/llms.txt`)
- **Full LLM Single-File Reference**: `docs/public/llms-full.txt` (served at `/llms-full.txt`)
- **Docs Guide**: `docs/src/content/docs/docs/llms.mdx` (served at `/docs/llms`)

All three files in `docs/public/` and the generated block above are produced by `bun run sync:llms --write`. Edit `scripts/sync-llms.ts` or `scripts/llms-catalog.ts`, never the outputs.

## Changelog Writing Guidelines

When writing or updating changelog entries in `docs/src/content/docs/changelog/`:

1. **Role & Voice:** Write as a highly experienced software engineer, open-source maintainer, and tech craftsman. Quiet authority, humble peer, direct and plainspoken. Use an honest, reflective "I" (Phearak S. Tha), never corporate "we".
2. **Banned Language:** Never use marketing buzzwords ("game-changing", "revolutionary", "seamless", "next-generation", "thrilled to announce", "lightning-fast"). Use precise, empirical context.
3. **Sentence Variance & Formatting:** Alternate dense technical explanations with short, punchy statements. Use clean, functional headers without emoji noise. Keep paragraphs short (2–4 sentences max). Use contextual footnotes (`[^1]`) sparingly for historical/technical asides.
4. **4-Step Execution Flow:**
   1. State current state or core problem in the first two sentences.
   2. Build underlying mental model and background context first.
   3. Walk through mechanisms, philosophy, or solutions step-by-step with clean code examples.
   4. Conclude with a focus on human care, craftsmanship, or the long-term sustainable vision.

