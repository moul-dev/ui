# Moul UI Workspace

A multi-project monorepo workspace managed with **Bun**, featuring:
- **`@moul-dev/web-component`**: Standards-first Web Components library (`<moul-*>` custom elements) built with Lit 3, Shadow DOM, and a native CSS token layer.
- **`docs`**: Documentation site built with Astro Starlight (English at the root, Khmer under `/km/`).

## Monorepo Layout

```
.
├── package.json         # Workspace root scripts
├── bun.lock             # Bun workspace lockfile
├── biome.json           # Lint & format rules (ui/ and docs/)
├── AGENTS.md            # This file
├── rdt/                 # Requirements, design, and task list for the Lit rebuild
├── scripts/             # dev, gen:component, sync:llms, size, bump, verify-no-react, setup-hooks
├── ui/                  # Component library package
│   ├── package.json     # Library exports (`.`, `./effects` and `./style.css`)
│   ├── vite.config.ts   # Vite library + CDN builds per entry, Vitest (happy-dom)
│   ├── minify-css-templates.ts # Build-time minifier for Lit `css` templates
│   ├── size-budget.json # Byte budget per published bundle (`bun run size`)
│   ├── custom-elements-manifest.config.mjs
│   ├── index.html       # Kitchen-sink sandbox (`bun run dev:ui`)
│   └── src/
│       ├── index.ts     # Main entry point
│       ├── effects.ts   # Second entry point: motion controllers and effect elements
│       ├── element-checklist.test.ts # The five things every element ships with
│       ├── styles/      # style.css token layer, reset, semantic tones
│       ├── controllers/ # Press, LayoutIndicator, OverlayPresence, NumberSpring, FormInternals;
│       │                # Pointer, Scroll, InView, Drag, TextSplit, CanvasLoop (effects entry)
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
- **Check Bundle Sizes** against `ui/size-budget.json` (also the last step of `build:ui`); `--write` records new budgets when growth is intended:
  ```bash
  bun run size
  bun run size --write
  ```
- **Run Lint / Format (Biome)**:
  ```bash
  bun run lint
  bun run format
  ```
- **Build UI Library** (verify-no-react → `tsc -b` → `vite build` per entry, npm and CDN → `cem analyze` → size check):
  ```bash
  bun run build:ui
  ```
- **Build Docs Website**:
  ```bash
  bun run build:docs
  ```
- **Bump SemVer Version** (`MAJOR.MINOR.PATCH[-prerelease]`, the scheme the Moul engine tags as `vMAJOR.MINOR.PATCH`): `major` for breaking changes, `minor` for new compatible API, `patch` for compatible fixes. A prerelease graduates to the version it leads up to (`1.0.0-alpha.3` + `major` = `1.0.0`). `prerelease` advances the channel counter (`1.0.0-alpha.1` → `1.0.0-alpha.2`), and `--preid=<alpha|beta|rc>` opens or switches a channel (`minor --preid=beta` → `1.1.0-beta.1`). `--changelog` scaffolds `changelog/<version-with-dashes>.mdx`:
  ```bash
  bun run bump patch
  bun run bump prerelease
  bun run bump minor --preid=beta
  ```

## Tech Stack & Configurations

### 1. UI Library (`ui/`)
- **Lit 3 Custom Elements**: Every component is a `LitElement` subclass registered with an idempotent `defineElement('moul-*', Class)` and an open Shadow Root.
- **CSS Token Layer**: `ui/src/styles/style.css` defines `:root` custom properties (OKLCH + `light-dark()`), emitted to `dist/assets/style.css` and exported as `@moul-dev/web-component/style.css`. Brand hooks: `--brand-hue`, `--brand-chroma-multiplier`, `--brand-font-family`, `--brand-font-scale`, `--brand-radius-factor`, `--brand-density-factor`.
- **Native Platform APIs**: `ElementInternals` for form association, `<dialog>` for modals, the Popover API + CSS anchor positioning for overlays.
- **Vite Library Mode**: Emits `dist/moul-ui.js` (prefixed with a `"use client";` banner for RSC frameworks) and `dist/src/index.d.ts`. Every runtime `dependency` stays a bare import so consumers load one copy of Lit; the build fails if anything from `node_modules` is inlined. A second pass (`vite build --mode cdn`) emits the self-contained, minified `dist/cdn/moul-ui.js` for `<script type="module">` use from a CDN. Every build pass minifies Lit `css` templates (`ui/minify-css-templates.ts`): comments are stripped and whitespace collapsed, so write style comments freely; they stay in the source and never ship. Vitest and the dev server see the styles as written.
- **Effects Entry Point**: `@moul-dev/web-component/effects` (`src/effects.ts`) holds the motion controllers (pointer, scroll, in-view, drag, text splitting, canvas loop) and, from Phase 5 of `moul-ui-build-plan.md`, the effect elements. It is built in its own passes (`--mode effects`, `--mode cdn-effects`) so the main bundle stays byte-for-byte what it is without it; `ui/size-budget.json` holds every bundle to a byte budget, and `bun run size --write` raises one on purpose. Never export effects code from `src/index.ts`.
- **Custom Elements Manifest**: `cem analyze` writes `dist/custom-elements.json`, the source of truth for `sync:llms`.
- **No React**: `scripts/verify-no-react.ts` fails the build if React, React Aria, StyleX, or `@lit/react` appear in `ui/` or `docs/` manifests.

### 2. Documentation Website (`docs/`)
- **Astro Starlight**: Static output, bilingual i18n (`defaultLocale: 'root'` for English at the root, `km` under `/km/`).
- **Previews**: `ComponentPreview.astro` renders native `<moul-*>` tags directly in MDX and loads `@moul-dev/web-component` client-side. `data-props='{…}'` assigns JSON as element properties. `astro.config.mjs` aliases `@moul-dev/web-component` and `@moul-dev/web-component/style.css` to `ui/src`, so previews track the library source.
- **Styling**: `docs/src/styles/global.css` imports `@moul-dev/web-component/style.css`, maps Starlight colors onto the tokens, and sets Khmer content (`:lang(km)`) in `Noto Sans Khmer`.
- **Pages**: Add component slugs to `docs/src/categories.ts`. Every English page needs a Khmer page at the same path under `km/`; component pages keep the English body with a translated `title` and `description`. New changelog entries go in the `Changelog` sidebar group in `astro.config.mjs` and in both `changelog/index.mdx` files.

## Element Checklist

Every new element ships with five things, and `ui/src/element-checklist.test.ts` fails until it does:

1. **A description in the Custom Elements Manifest**: a summary paragraph in the class JSDoc, because agents pick components from that text.
2. **Keyboard and screen reader behaviour**: a `Keyboard and screen readers:` paragraph in the JSDoc, and tests that exercise it.
3. **A reduced-motion path**: a `Reduced motion:` paragraph in the JSDoc, and a `prefers-reduced-motion` branch in the code whenever the element animates.
4. **Light and dark themes**: colours from tokens only, never literals outside `var()` fallbacks, masks and shadows.
5. **A demo page and a test**: an English docs page that renders the element, its Khmer twin, and a test that names the tag.

`bun run gen:component <Name>` (with `--effect` for the effects entry) scaffolds all five with `TODO` markers and `it.todo` tests where only the author can fill in the behaviour. The 79 elements that predate the checklist are listed in the test as exempt from the documentation checks until their JSDoc is written; the list only shrinks.

## AI Coding Agent Guidelines for `@moul-dev/web-component`

<!-- sync:llms:start -->
<!-- Generated by `bun run sync:llms --write`. Edit scripts/sync-llms.ts instead. -->

When generating or editing code that uses `@moul-dev/web-component`:

- **Imports**: `import '@moul-dev/web-component'` once registers every `<moul-*>` element. Import design tokens with `import '@moul-dev/web-component/style.css'`. Motion controllers and effect elements live in a second entry, `import '@moul-dev/web-component/effects'`; an app that never imports it ships none of that code. There is no `@moul-dev/web-component/react`, `@moul-dev/web-component/tokens`, or `@moul-dev/web-component/tokens.stylex` entry point.
- **Markup, not JSX components**: Write native custom element tags (`<moul-button>`), never PascalCase components (`<Button>`). They work in plain HTML, Astro, Lit, Vue, Svelte, and React 19.
- **Attributes are kebab-case**: Boolean state uses presence attributes such as `is-disabled`, `is-open`, `is-checked`, `is-required`. The matching JS property is camelCase (`el.isDisabled = true`).
- **Rich data is set as properties**: Arrays, objects, and functions (`data`, `series`, `columns`, `items`, `logs`, `valueFormatter`) are assigned in JavaScript, not serialized into attributes.
- **Events are DOM events**: Listen with `addEventListener` (`press`, `change`, `input`, `openchange`, `selectionchange`, `pagechange`, `dismiss`). Payloads live on `event.detail`. There is no `onPress` prop.
- **Overlays**: Toggle `is-open` (or `el.isOpen`) on `<moul-modal>`, `<moul-drawer>`, `<moul-alert-dialog>`, `<moul-popover>`, `<moul-tooltip>`, `<moul-hover-card>`, `<moul-command-palette>`, `<moul-notification-bell>`, `<moul-expandable-card>`, `<moul-focus-mode>`, and react to `openchange` (`detail.isOpen`). Start a `<moul-tour>` with `start()`; its `openchange` also carries `detail.isComplete`.
- **Forms**: Inputs are form-associated via `ElementInternals`; give each a `name` and it submits with a native `<form>` / `FormData`. Enter in `<moul-text-field>`, `<moul-number-field>`, or `<moul-search-field>` submits its `<form>` or `<moul-form>` like a native input, so do not add your own Enter handler.
- **Semantic tones & variants**: `tone` is one of `primary | accent | success | warning | error`; surface `variant` is one of `solid | flat | shadow | bordered | glass`. Omit `variant` for a neutral surface: an unset `variant` on `<moul-card>`, `<moul-alert>`, `<moul-toast>`, or `<moul-stat>` renders the plain `--color-surface` look, while `variant="flat"` tints it in the tone. `<moul-button>` has its own `variant` set (`primary | secondary | tertiary | outline | ghost | danger | danger-soft`).
- **Accessibility**: Icon-only buttons (`is-icon`) and dot badges (`is-dot`) must have an `aria-label`.
- **Theming**: Override `--brand-hue`, `--brand-chroma-multiplier`, `--brand-font-family`, `--brand-font-scale`, `--brand-radius-factor`, and `--brand-density-factor` on `:root` (or any ancestor). Style internals through `::part(...)`.

**Element index** (full API in `docs/public/llms-full.txt`):

- **Charts & Data Visualization**: `<moul-area-chart>`, `<moul-bar-chart>`, `<moul-line-chart>`, `<moul-doughnut-chart>`, `<moul-heatmap-chart>`, `<moul-funnel-chart>`, `<moul-top-list>`, `<moul-stat>`, `<moul-percentage-bar>`, `<moul-percentage-circle>`, `<moul-chart-container>`, `<moul-chart-tooltip>`
- **Actions & Toggles**: `<moul-button>`, `<moul-button-group>`, `<moul-slide-to-confirm>`, `<moul-split-button>`, `<moul-theme-toggle>`, `<moul-toggle-button>`, `<moul-toggle-button-group>`
- **Inputs & Forms**: `<moul-text-field>`, `<moul-number-field>`, `<moul-search-field>`, `<moul-text-area>`, `<moul-checkbox>`, `<moul-checkbox-group>`, `<moul-radio-group>`, `<moul-radio>`, `<moul-switch>`, `<moul-slider>`, `<moul-select>`, `<moul-select-item>`, `<moul-combobox>`, `<moul-combobox-item>`, `<moul-date-picker>`, `<moul-file-upload>`, `<moul-calendar>`, `<moul-input-otp>`, `<moul-form>`
- **Overlays & Navigation**: `<moul-modal>`, `<moul-alert-dialog>`, `<moul-drawer>`, `<moul-dropdown-menu>`, `<moul-menu-item>`, `<moul-menu-group>`, `<moul-menu-separator>`, `<moul-stepper>`, `<moul-step>`, `<moul-tree>`, `<moul-tree-item>`, `<moul-popover>`, `<moul-tooltip>`, `<moul-hover-card>`, `<moul-notification-bell>`, `<moul-tour>`, `<moul-tour-step>`, `<moul-focus-mode>`, `<moul-command-palette>`, `<moul-tabs>`, `<moul-tab>`, `<moul-tab-panel>`, `<moul-breadcrumbs>`, `<moul-breadcrumb-item>`, `<moul-pagination>`, `<moul-link>`
- **Surfaces & Feedback**: `<moul-accordion>`, `<moul-accordion-item>`, `<moul-alert>`, `<moul-animated-list>`, `<moul-card>`, `<moul-card-header>`, `<moul-card-body>`, `<moul-card-footer>`, `<moul-badge>`, `<moul-number-ticker>`, `<moul-avatar>`, `<moul-avatar-group>`, `<moul-typography>`, `<moul-kbd>`, `<moul-separator>`, `<moul-icon-morph>`, `<moul-spinner>`, `<moul-step-loader>`, `<moul-skeleton>`, `<moul-progress-bar>`, `<moul-result-card>`, `<moul-tag-group>`, `<moul-tag>`, `<moul-table>`, `<moul-selection-toolbar>`, `<moul-toast>`, `<moul-toast-region>`, `<moul-empty-state>`, `<moul-expandable-card>`, `<moul-pull-to-refresh>`, `<moul-confetti>`
- **Data & Developer**: `<moul-activity-feed>`, `<moul-code-block>`, `<moul-code-comparison>`, `<moul-file-tree>`, `<moul-history-ledger>`, `<moul-relationship-graph>`, `<moul-terminal>`, `<moul-terminal-line>`, `<moul-timeline>`, `<moul-timeline-item>`
- **AI Kit**: `<moul-agent-activity>`, `<moul-chat>`, `<moul-prompt-input>`, `<moul-streaming-response>`, `<moul-thinking-indicator>`
- **Landing Kit**: `<moul-reveal>`, `<moul-text-entrance>`, `<moul-typewriter>`, `<moul-word-rotate>`, `<moul-scramble>`, `<moul-gradient-text>`, `<moul-highlight>`, `<moul-marquee>`, `<moul-bento-grid>`, `<moul-bento-card>`, `<moul-browser-frame>`, `<moul-phone-frame>`, `<moul-scroll-progress>`
- **Backgrounds & Light**: `<moul-pattern>`, `<moul-perspective-grid>`, `<moul-ripple>`, `<moul-aurora>`, `<moul-noise>`, `<moul-light-rays>`, `<moul-spotlight>`, `<moul-border-beam>`, `<moul-shine-border>`, `<moul-beams>`, `<moul-backlight>`, `<moul-focus-group>`, `<moul-edge-blur>`, `<moul-orbit>`
- **Navigation & Media**: `<moul-navbar>`, `<moul-banner>`, `<moul-navigation-menu>`, `<moul-navigation-menu-item>`, `<moul-navigation-menu-link>`, `<moul-dock>`, `<moul-dock-item>`, `<moul-dock-separator>`, `<moul-progress-nav>`, `<moul-carousel>`, `<moul-image-slider>`, `<moul-compare>`, `<moul-video-dialog>`, `<moul-world-map>`
- **Pointer & Scroll**: `<moul-tilt>`, `<moul-magnetic>`, `<moul-glow-border>`, `<moul-hover-highlight>`, `<moul-direction-hover>`, `<moul-lens>`, `<moul-cursor>`, `<moul-mask-reveal>`, `<moul-pointer-parallax>`, `<moul-connector-beam>`, `<moul-scroll-text>`, `<moul-sticky-stack>`, `<moul-scroll-parallax>`, `<moul-sticky-scroll>`, `<moul-sticky-scroll-item>`, `<moul-tracing-beam>`, `<moul-scroll-frame>`, `<moul-page-transition>`
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

