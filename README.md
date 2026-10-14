# Moul UI

> Accessible, native Web Component library built with Lit and Bootstrap 6 in Shadow DOM.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a multi-project monorepo containing:
- **`@moul-dev/ui`** (`ui/`): Accessible, zero-runtime Web Component library built on **Lit** and **Bootstrap 6 (`6.0.0-alpha.1`)** inside Shadow DOM.
- **Documentation Website** (`docs/`): Fast, searchable documentation portal built with **Astro** and **Starlight**.

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
│   ├── vite.config.ts   # Multi-entry Vite build with ES2022 decorator transpilation
│   └── src/             # Component source code, reactive controllers, & base classes
└── docs/                # Documentation site (Astro + Starlight)
    ├── package.json     # App dependencies & scripts
    ├── astro.config.mjs # Starlight & Astro configuration
    ├── src/
    │   ├── content/docs/# MDX documentation content
    │   └── components/  # Docs Astro components
    └── public/          # Static assets & LLM references
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
bun run dev:docs     # Astro Docs dev server
```

---

## 🛠️ Workspace Scripts

| Command | Description |
| :--- | :--- |
| `bun run build` | Builds both the UI library and the Docs website |
| `bun run build:ui` | Compiles `@moul-dev/ui` with Vite, generating ESM and types (`.d.ts`) |
| `bun run build:docs` | Compiles the Docs website with Astro and Pagefind search index |
| `bun run lint` | Runs Biome code analysis across the repository |
| `bun run format` | Applies Biome formatting across the repository |
| `bun run sync:llms` | Validates and syncs LLM context specifications |
| `bun run bump` | CalVer version bump |

---

## 📦 Using `@moul-dev/ui`

Install the package:

```bash
bun add @moul-dev/ui
# or
npm install @moul-dev/ui
```

Import and use anywhere (vanilla HTML, React, Vue, Svelte, Astro, Angular):

```html
<script type="module">
  import '@moul-dev/ui';
</script>

<moul-button variant="primary">Click Me</moul-button>
<moul-alert variant="success" title="Success">Operation completed!</moul-alert>
```

---

## 📄 License

MIT © [Moul](https://moul.dev)
