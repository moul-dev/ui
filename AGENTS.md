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
