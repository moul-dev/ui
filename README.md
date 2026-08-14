# Moul UI

> A modern, accessible React design system and documentation portal.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a multi-project monorepo containing:
- **`@moul-dev/ui`** (`ui/`): Accessible, zero-runtime React component library built on React Aria and StyleX.
- **Documentation Website** (`docs/`): Documentation website built with Fumadocs on the Waku React Server Components (RSC) framework.

---

## 📁 Monorepo Structure

```
.
├── package.json         # Workspace root package.json configuration
├── bun.lock             # Bun workspace lockfile
├── LICENSE              # MIT License
├── AGENTS.md            # Monorepo architecture & agent guidelines
├── ui/                  # Component library package (@moul-dev/ui)
│   ├── package.json     # Library exports & npm publishing configs
│   ├── vite.config.ts   # Vite library build & StyleX configs
│   └── src/             # Component source code, tokens, & property tests
└── docs/                # Documentation site (Fumadocs + Waku)
    ├── package.json     # App dependencies & scripts
    ├── content/docs/    # MDX documentation content
    └── src/             # Waku RSC application code
```

---

## 🚀 Quick Start

Ensure you have [Bun](https://bun.sh) installed.

```bash
# Install dependencies across all workspaces
bun install

# Run both the UI library build watcher and Docs dev server simultaneously
bun run dev

# Or run individual projects:
bun run dev:ui       # UI Sandbox dev server
bun run dev:docs     # Documentation dev server
```

---

## 🛠️ Workspace Scripts

| Command | Description |
| :--- | :--- |
| `bun run build` | Builds both the UI library and the Docs website |
| `bun run build:ui` | Compiles `@moul-dev/ui` with Vite, generating ESM, types (`.d.ts`), and StyleX CSS |
| `bun run build:docs` | Compiles the Docs website into static SSG / server bundles |
| `bun run test` | Executes the Vitest test suite for `@moul-dev/ui` |
| `bun run types:check` | Runs TypeScript type checking across both `ui` and `docs` |
| `bun run lint` | Runs Biome code analysis across the repository |
| `bun run format` | Applies Biome formatting across the repository |

---

## 📦 Publishing `@moul-dev/ui`

To build and publish the UI package to the npm registry:

```bash
# Build the library bundle
bun run build:ui

# Dry-run pack verification
bun --cwd ui pm pack --dry-run

# Publish to npm (scoped public package)
bun --cwd ui npm publish --access public
```

---

## 📄 License

MIT © [Moul](https://moul.dev)
