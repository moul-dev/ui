# Moul UI Workspace

A multi-project monorepo workspace managed with **Bun**, featuring:
- **`@moul-dev/ui`**: React component library/sandbox built with Vite, TypeScript, React Aria, and StyleX.
- **`docs`**: Documentation site built with Fumadocs on the Waku framework.

## Monorepo Layout

```
.
├── package.json         # Workspace root package.json config
├── bun.lock             # Bun workspace lockfile
├── AGENTS.md            # This file
├── ui/                  # Component library package
│   ├── package.json     # Library exports & configs
│   ├── vite.config.ts   # Vite library build & StyleX configs
│   └── src/             # Component source code
│       ├── components/  # React Aria + StyleX components
│       └── App.tsx      # Sandbox sandbox app
└── docs/                # Fumadocs website package
    ├── package.json     # App configs & dependencies
    ├── content/docs/    # MDX documentation source files
    └── src/             # Waku application code
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
- **React Aria Components**: Headless components used for accessible structure and behavior.
- **StyleX**: Compile-time CSS-in-JS utility. The compiler extracts styles to `ui/dist/assets/stylex.css` at build time.
- **Vite & TS**: Compiles in library mode, generating `ui/dist/moul-ui.js` and `ui/dist/src/index.d.ts`.
- **RSC Support**: Includes the `"use client";` banner in the Rollup output options to prevent import conflicts in Server Component frameworks.

### 2. Documentation Website (`docs/`)
- **Waku**: React Server Components (RSC) framework.
- **Fumadocs**: Custom MDX compilation engine and layouts for rich developer docs.
- **Styling**: Loads Tailwind CSS along with Fumadocs styling, and imports the compiled UI library CSS with `@import '@moul-dev/ui/style.css'` in `docs/src/styles/globals.css`.
- **Global Components**: The UI `Button` is imported from the `@moul-dev/ui` workspace package and registered inside `docs/src/components/mdx.tsx` to be used directly in `.mdx` files as `<Button>`.

## AI Coding Agent Guidelines for `@moul-dev/ui`

When generating or editing React code using `@moul-dev/ui` components:

1. **Imports**: Always import from `@moul-dev/ui` (e.g. `import { Button, TextField, Modal, Card, AreaChart, Pagination, ProgressBar, EmptyState } from '@moul-dev/ui'`).
2. **Event Handlers**: Use React Aria's `onPress` instead of `onClick` on `<Button>`, `<Link>`, and interactive triggers.
3. **Selection & Collections**: Use `selectedKey` / `defaultSelectedKey` or `selectedKeys` and `onSelectionChange` for collection components (`Select`, `ComboBox`, `Tabs`, `Table`, `TagGroup`, `Sidebar`, `Pagination`).
4. **Dialogs & Overlays**: Use `isOpen` and `onOpenChange` on `<ModalOverlay>` / `<Popover>` / `<AlertDialog>`.
5. **Accessibility**: Always provide an `aria-label` when rendering icon-only buttons.
6. **Compound Structure**: Follow compound component patterns (e.g., `<Modal><ModalOverlay><ModalDialog><ModalHeader>...`).

### Machine-Readable Context Files
- **Public Agent Rules & Recipes**: `docs/public/AGENTS.md` (served at `/AGENTS.md`)
- **LLM Index Specification**: `docs/public/llms.txt` (served at `/llms.txt`)
- **Full LLM Single-File Reference**: `docs/public/llms-full.txt` (served at `/llms-full.txt`)
- **Docs Guide**: `docs/content/docs/llms.mdx` (served at `/docs/llms`)

## Changelog Writing Guidelines

When writing or updating changelog entries in `docs/content/changelog/`:

1. **Role & Voice:** Write as a highly experienced software engineer, open-source maintainer, and tech craftsman. Quiet authority, humble peer, direct and plainspoken. Use an honest, reflective "I" (Phearak S. Tha), never corporate "we".
2. **Banned Language:** Never use marketing buzzwords ("game-changing", "revolutionary", "seamless", "next-generation", "thrilled to announce", "lightning-fast"). Use precise, empirical context.
3. **Sentence Variance & Formatting:** Alternate dense technical explanations with short, punchy statements. Use clean, functional headers without emoji noise. Keep paragraphs short (2–4 sentences max). Use contextual footnotes (`[^1]`) sparingly for historical/technical asides.
4. **4-Step Execution Flow:**
   1. State current state or core problem in the first two sentences.
   2. Build underlying mental model and background context first.
   3. Walk through mechanisms, philosophy, or solutions step-by-step with clean code examples.
   4. Conclude with a focus on human care, craftsmanship, or the long-term sustainable vision.

