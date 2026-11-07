# Moul UI

> Accessible, themeable Web Components built on Lit 3 and native browser APIs, with a bilingual documentation site.

[![npm version](https://img.shields.io/npm/v/@moul-dev/web-component.svg)](https://www.npmjs.com/package/@moul-dev/web-component)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a Bun monorepo containing:
- **`@moul-dev/web-component`** (`ui/`): 79 `<moul-*>` custom elements built with Lit 3, Shadow DOM, and a runtime CSS token layer (`light-dark()` + `oklch()`). No React, no build-time styling.
- **Documentation site** (`docs/`): Astro Starlight, in English (root) and Khmer (`/km/`), with live previews rendered from the library source.

---

## 📁 Monorepo Structure

```
.
├── package.json         # Workspace scripts
├── bun.lock             # Bun workspace lockfile
├── biome.json           # Lint & format rules
├── AGENTS.md            # Architecture & coding-agent guidelines
├── rdt/                 # Requirements, design, and task list for the Lit rebuild
├── scripts/             # dev, gen:component, sync:llms, bump, verify-no-react, setup-hooks
├── ui/                  # @moul-dev/web-component
│   ├── package.json     # Exports `.` and `./style.css`
│   ├── vite.config.ts   # Vite library build + Vitest (happy-dom)
│   ├── index.html       # Kitchen-sink sandbox
│   └── src/
│       ├── index.ts     # Single public entry point
│       ├── components/  # One folder per element: <Name>.ts, <Name>.styles.ts, index.ts
│       ├── controllers/ # Lit reactive controllers
│       ├── styles/      # style.css token layer, reset, semantic tones
│       └── utils/       # defineElement, focus trap, motion, icons
└── docs/                # Astro Starlight site
    ├── astro.config.mjs # Locales, sidebar, source aliases
    ├── public/          # llms.txt, llms-full.txt, AGENTS.md (generated)
    └── src/
        ├── categories.ts        # Component sidebar groups (mirrors the sandbox)
        ├── components/          # ComponentPreview, ThemeInspector, demos
        ├── pages/theme.astro    # /theme (Theme Studio)
        └── content/docs/        # English MDX at the root, Khmer under km/
```

---

## 🚀 Quick Start

Requires [Bun](https://bun.sh).

```bash
# Install dependencies across all workspaces
bun install

# Run the component sandbox and the docs site together
bun run dev

# Or run one at a time
bun run dev:ui     # Vite sandbox (ui/index.html)
bun run dev:docs   # Astro dev server
```

---

## 🛠️ Workspace Scripts

| Command | Description |
| :--- | :--- |
| `bun run dev` | Runs the sandbox and docs dev servers with combined, color-coded logs |
| `bun run build` | Builds the library, then the docs site |
| `bun run build:ui` | Checks for React dependencies, type-checks, builds `ui/dist` with Vite, and writes `dist/custom-elements.json` |
| `bun run build:docs` | Checks for React dependencies and builds the static docs site into `docs/dist` |
| `bun run test` | Runs the Vitest suite for `@moul-dev/web-component` |
| `bun run types:check` | Type-checks `ui` (`tsc -b`) and `docs` (`astro check`) |
| `bun run gen:component <Name>` | Scaffolds a component: class, styles, test, index, and docs page |
| `bun run sync:llms` | Verifies every custom element is documented in the LLM context files |
| `bun run sync:llms --write` | Regenerates `llms.txt`, `llms-full.txt`, and both `AGENTS.md` files from the manifest |
| `bun run bump <major\|minor\|patch\|prerelease>` | Bumps the SemVer version in every `package.json`, `ui/src/index.ts` and `bun.lock`; `--preid=<alpha\|beta\|rc>` opens or switches a prerelease channel, `--changelog` scaffolds a changelog entry |
| `bun run lint` | Runs Biome checks |
| `bun run format` | Applies Biome formatting |

`sync:llms` reads `ui/dist/custom-elements.json`, so run `bun run build:ui` first.

---

## 📦 Publishing `@moul-dev/web-component`

```bash
# Build the library bundle and manifest
bun run build:ui

# Inspect what will be published
cd ui && bun pm pack --dry-run

# Publish to npm (scoped public package)
bun publish
```

Versions follow [SemVer](https://semver.org). Until `1.0.0`, releases are prereleases (`1.0.0-alpha.1`, `1.0.0-alpha.2`, …): `bun run bump prerelease` advances the counter, and `bun run bump major` releases `1.0.0`. Run `bun run bump --help` for every release type.

---

## 📄 License

MIT © [Moul](https://moul.dev)
