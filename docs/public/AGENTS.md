# Moul UI Workspace

A multi-project monorepo workspace managed with **Bun**, featuring:
- **`@moul-dev/ui`**: Native Web Component library built with **Lit** and **Bootstrap 6 (`6.0.0-alpha.1`)** inside Shadow DOM.
- **`docs`**: Documentation site built with **Astro** and **Starlight**.

## Monorepo Layout

```
.
├── package.json         # Workspace root package.json config
├── bun.lock             # Bun workspace lockfile
├── AGENTS.md            # This file
├── ui/                  # Web component library package
│   ├── package.json     # Library exports & configs
│   ├── vite.config.ts   # Vite library multi-entry build
│   └── src/             # Component source code (Lit + Shadow DOM)
│       ├── shared/      # MoulBase, bootstrapSheet, tokens.css
│       ├── controllers/ # Reactive controllers (focus trap, floating UI, etc.)
│       ├── components/  # Web component implementations
│       └── index.ts     # Global barrel export
└── docs/                # Astro + Starlight documentation site
    ├── package.json     # App configs & dependencies
    ├── astro.config.mjs # Astro + Starlight configuration
    ├── src/
    │   ├── content/docs/# MDX documentation source files
    │   ├── components/  # Docs site Astro components
    │   └── styles/      # Site globals and Starlight overrides
    └── public/          # Static assets & LLM references
```

## Available Scripts

Run these commands from the root directory:

- **Run Dev Server (Both Projects)**:
  ```bash
  bun dev
  ```
- **Run UI Sandbox Dev Server**:
  ```bash
  bun run dev:ui
  ```
- **Run Docs Dev Server**:
  ```bash
  bun run dev:docs
  ```
- **Scaffold New Component**:
  ```bash
  bun run gen:component <ComponentName>
  ```
- **Sync & Validate LLM Context**:
  ```bash
  bun run sync:llms
  ```
- **Run Lint / Format (Biome)**:
  ```bash
  bun run lint
  bun run format
  ```
- **Build UI Library**:
  ```bash
  bun run build:ui
  ```
- **Build Docs Website**:
  ```bash
  bun run build:docs
  ```
- **Bump CalVer Version**:
  ```bash
  bun run bump
  ```

## Tech Stack & Configurations

### 1. UI Library (`ui/`)
- **Lit (`lit`)**: Lightweight standard custom element framework with reactive properties and templating.
- **Bootstrap 6 Shadow DOM (`bootstrap@6.0.0-alpha.1`)**: Adopted inside shadow roots via `bootstrapSheet` (`CSSStyleSheet`). Components use standard Bootstrap utility and component classes with full style isolation.
- **Controllers**: Reactive controllers for headless interactions (`FocusTrapController`, `FloatingUIController`, `RovingTabindexController`, `ScrollLockController`, `LiveRegionController`, `HoverController`, `KeyboardListController`).
- **Vite & TS**: Multi-entry build producing `dist/index.js` (barrel registering all elements) and per-component entries (e.g. `dist/components/Button/index.js`), with custom decorator transpile step targeting standard ES2022.

### 2. Documentation Website (`docs/`)
- **Astro 5 & Starlight**: High-performance static site generator with official docs theme.
- **Zero-Wrapper Consumption**: Consumes `@moul-dev/ui` native web components directly in MDX without React wrappers.
- **Styling**: Loads `@moul-dev/ui/tokens.css` with Bootstrap theme variables and Starlight custom styling.

## AI Coding Agent Guidelines for `@moul-dev/ui`

When generating or editing HTML/JS/TS code using `@moul-dev/ui` components:

1. **Imports**: Import the barrel (`import '@moul-dev/ui'`) to register all custom elements, or import individual component modules (e.g., `import '@moul-dev/ui/button'`).
2. **Custom Element Tags**: Use `<moul-*>` custom element tags (e.g., `<moul-button variant="primary">Click</moul-button>`, `<moul-text-field label="Email"></moul-text-field>`, `<moul-modal is-open>`).
3. **Events**: Listen to standard dispatched events prefixed with `moul-` (e.g., `moul-press`, `moul-change`, `moul-open`, `moul-close`, `moul-dismiss`).
4. **Properties & Attributes**: Boolean attributes use kebab-case (e.g. `is-open`, `is-pending`, `is-disabled`, `is-invalid`).
5. **Theming & Dark Mode**: Bootstrap 6 dark mode works via `data-bs-theme="dark"` on `<html>` or any ancestor container. CSS custom properties cascade naturally across Shadow DOM boundaries.
6. **Slots**: Use named slots where provided (e.g., `slot="header"`, `slot="body"`, `slot="footer"` for `<moul-modal>` and `<moul-card>`; `slot="icon-start"`, `slot="icon-end"` for `<moul-button>`).

### Machine-Readable Context Files
- **Public Agent Rules & Recipes**: `docs/public/AGENTS.md` (served at `/AGENTS.md`)
- **LLM Index Specification**: `docs/public/llms.txt` (served at `/llms.txt`)
- **Full LLM Single-File Reference**: `docs/public/llms-full.txt` (served at `/llms-full.txt`)
- **Docs Guide**: `docs/src/content/docs/llms.mdx` (served at `/llms`)

## Changelog Writing Guidelines

When writing or updating changelog entries in `docs/src/changelog/`:

1. **Role & Voice:** Write as a highly experienced software engineer, open-source maintainer, and tech craftsman. Quiet authority, humble peer, direct and plainspoken. Use an honest, reflective "I" (Phearak S. Tha), never corporate "we".
2. **Banned Language:** Never use marketing buzzwords ("game-changing", "revolutionary", "seamless", "next-generation", "thrilled to announce", "lightning-fast"). Use precise, empirical context.
3. **Sentence Variance & Formatting:** Alternate dense technical explanations with short, punchy statements. Use clean, functional headers without emoji noise. Keep paragraphs short (2–4 sentences max). Use contextual footnotes (`[^1]`) sparingly for historical/technical asides.
4. **4-Step Execution Flow:**
   1. State current state or core problem in the first two sentences.
   2. Build underlying mental model and background context first.
   3. Walk through mechanisms, philosophy, or solutions step-by-step with clean code examples.
   4. Conclude with a focus on human care, craftsmanship, or the long-term sustainable vision.
