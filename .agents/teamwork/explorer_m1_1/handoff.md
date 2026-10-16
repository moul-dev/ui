# Handoff Report: Milestone 1 - Disallowed Dependency Guard & Package Manifests

## 1. Observation

Direct examination of workspace manifests and scripts revealed the following:

1. **Non-existence of `scripts/verify-no-react.ts`:**
   - Directory listing of `/Users/phearak/github/orgs/moul-dev/ui/scripts`:
     ```text
     bump-version.ts (13549 bytes)
     dev.ts (3333 bytes)
     gen-component.ts (13283 bytes)
     setup-hooks.ts (1557 bytes)
     sync-llms.ts (6455 bytes)
     ```
     `scripts/verify-no-react.ts` is currently absent from `scripts/`.

2. **Current `ui/package.json` contains prohibited dependencies and legacy exports:**
   - Lines 37–62: Legacy `exports` exposing `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`, and pointing `./style.css` to `./dist/assets/stylex.css`.
   - Lines 73–77: `peerDependencies` containing `"@stylexjs/stylex"`, `"react"`, `"react-dom"`.
   - Lines 78–86: `dependencies` containing `"@phosphor-icons/react"`, `"@stylexjs/stylex"`, `"input-otp"`, `"react-aria"`, `"react-aria-components"`, `"recharts"`.
   - Lines 87–106: `devDependencies` containing `"@stylexjs/unplugin"`, `"@testing-library/react"`, `"@types/react"`, `"@types/react-dom"`, `"@vitejs/plugin-react"`, `"react"`, `"react-dom"`.
   - Missing required dependencies: `lit`, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`.
   - Missing required devDependencies: `@custom-elements-manifest/analyzer`, `@open-wc/testing-helpers`, `happy-dom`, `@types/d3-scale`, `@types/d3-shape`.
   - Missing metadata: `"customElements": "./dist/custom-elements.json"` and `"sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"]`.

3. **Current `docs/package.json` contains legacy Waku/Fumadocs/React dependencies:**
   - Lines 7–15: Scripts referencing `waku dev`, `waku build`, `fumadocs-mdx`.
   - Lines 16–37: `dependencies` containing `fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`, `lucide-react`, `react`, `react-aria-components`, `react-dom`, `react-server-dom-webpack`, `waku`, `@tanstack/react-*`.
   - Lines 38–49: `devDependencies` containing `@types/react`, `@types/react-dom`.
   - Missing required Astro Starlight stack: `astro`, `@astrojs/starlight`, `@phosphor-icons/web`, `sharp`.

4. **Project Requirements and Contracts:**
   - `rdt/requirements.md` (Req 1, Req 16) and `rdt/design.md` (Section 2, Section 10) mandate:
     - `scripts/verify-no-react.ts`: CLI guard inspecting `dependencies`, `devDependencies`, `peerDependencies` across `ui/package.json` and `docs/package.json`. Supports CLI targets `all` (default), `ui`, `docs`. Exits with code 1 and prints offending packages grouped by package.json and dependency block if any banned package is found. Exits with code 0 if all clean.
     - `ui/package.json`: Strict export contract (`.` and `./style.css` only; all other subpaths deleted). Zero React/StyleX/Recharts dependencies. Declaration of Lit 3, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, `motion`, CEM analyzer, open-wc, happy-dom, fast-check.
     - `docs/package.json`: Pure Astro Starlight manifest with `@moul-dev/ui: "workspace:*"`.

---

## 2. Logic Chain

1. **Guard Script Design (`scripts/verify-no-react.ts`):**
   - *Based on Observation 1 and 4:* The guard must prevent any regression or accidental re-introduction of React or legacy styling dependencies in either package.
   - *Pattern Matching:* A package is banned if:
     a) It matches `/^react(-.*)?$/` (e.g., `react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `react-server-dom-webpack`).
     b) It matches `/^@types\/react(-.*)?$/`.
     c) It matches `/^@stylexjs\//`.
     d) It matches `/^fumadocs-/`.
     e) It matches `/^@tanstack\/react-/`.
     f) It matches `/(-|\/)react$/` (e.g., `@lit/react`, `@phosphor-icons/react`, `@testing-library/react`, `@vitejs/plugin-react`, `@astrojs/react`, `lucide-react`).
     g) It is in the set of explicit banned packages: `waku`, `recharts`, `input-otp`.
   - *CLI Target Dispatch:*
     - `all` (default when no argument provided or `process.argv[2] === 'all'`): checks both `ui/package.json` and `docs/package.json`.
     - `ui`: checks `ui/package.json` only.
     - `docs`: checks `docs/package.json` only.
     - Invalid targets: print error and exit with code 1.
   - *Error Reporting:* Offending dependencies must be grouped by package manifest path (`ui/package.json` vs `docs/package.json`) and block (`dependencies`, `devDependencies`, `peerDependencies`), with package name and version clearly printed. Exit code `1` on any violation; exit code `0` on clean.
   - *Path Independence:* The script must compute `rootDir = resolve(import.meta.dir, '..')` so it executes identically from monorepo root, `ui/`, or `docs/`.

2. **`ui/package.json` Manifest Update:**
   - *Based on Observation 2 and 4:*
     - Strip all React/StyleX/Recharts packages from `dependencies`, `devDependencies`, and purge `peerDependencies` entirely.
     - Set `dependencies`: `lit` (^3.2.1), `@lit/context` (^1.1.3), `@lit-labs/virtualizer` (^2.1.0), `d3-scale` (^4.0.2), `d3-shape` (^3.2.0), `motion` (^13.4.1).
     - Set `devDependencies`: `@biomejs/biome` (^2.5.0), `@custom-elements-manifest/analyzer` (^0.10.4), `@open-wc/testing-helpers` (^2.2.0), `@types/d3-scale` (^4.0.8), `@types/d3-shape` (^3.1.6), `@types/node` (^24.12.3), `fast-check` (^3.23.2), `glob` (^11.0.0), `happy-dom` (^16.8.1), `typescript` (~6.0.2), `vite` (^8.0.12), `vite-plugin-dts` (^5.0.2), `vitest` (^2.1.8).
     - Exports: Strictly expose `.` and `./style.css`. Delete `./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`.
     - Add `"customElements": "./dist/custom-elements.json"` and `"sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"]`.
     - Update scripts to integrate `bun ../scripts/verify-no-react.ts ui` at the start of `build`.

3. **`docs/package.json` Manifest Update:**
   - *Based on Observation 3 and 4:*
     - Strip all Waku, Fumadocs, and React dependencies.
     - Set `dependencies`: `@astrojs/starlight` (^0.32.0), `@moul-dev/ui` (workspace:*), `@phosphor-icons/web` (^2.1.1), `astro` (^5.5.0), `sharp` (^0.33.5).
     - Set `devDependencies`: `@biomejs/biome` (^2.5.0), `@types/node` (^25.9.3), `typescript` (^6.0.3).
     - Set `scripts`: `dev: astro dev`, `build: bun ../scripts/verify-no-react.ts docs && astro build`, `preview: astro preview`, `types:check: astro check && tsc --noEmit`, `lint: biome check`, `format: biome format --write`.

4. **Integration & Lockfile Synchronization:**
   - Once manifests are updated, the worker must run `bun install` so that Bun updates `bun.lock`, downloads newly declared packages (Lit, CEM, happy-dom, Astro, etc.), and removes legacy React packages from `node_modules`.

---

## 3. Caveats

1. **Source Code Files in `ui/src`:**
   - Updating `ui/package.json` changes the package manifest contract, but source files under `ui/src/` currently still contain legacy React/StyleX components. `scripts/verify-no-react.ts` inspects package manifests (`package.json`), NOT source code imports. Source code import guarding is handled in later tasks via Vite's `banReactImportsPlugin` and during component migration to Lit.
2. **Execution Context:**
   - `scripts/verify-no-react.ts` must use `resolve(import.meta.dir, '..')` rather than `process.cwd()` to locate the workspace root, ensuring it functions when called from `ui/` (`bun ../scripts/verify-no-react.ts ui`) or root (`bun ./scripts/verify-no-react.ts all`).
3. **Execution Permissions:**
   - `scripts/verify-no-react.ts` must include the shebang `#!/usr/bin/env bun` and be made executable (`chmod +x scripts/verify-no-react.ts`).
4. **Lockfile & Network:**
   - When running `bun install` after editing `package.json`, network access to the npm registry is required. If in sandbox mode, `BypassSandbox: true` should be specified if the command requires external network or binary execution.

---

## 4. Conclusion & Concrete Code Plan for Worker

The worker agent should execute the following 4 steps in order:

### Step 1: Create `scripts/verify-no-react.ts`

Write `/Users/phearak/github/orgs/moul-dev/ui/scripts/verify-no-react.ts`:

```typescript
#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
}

type Target = 'all' | 'ui' | 'docs'
type DepBlock = 'dependencies' | 'devDependencies' | 'peerDependencies'

const DEP_BLOCKS: DepBlock[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
]

// Explicit banned package set
const BANNED_EXACT = new Set([
  'react',
  'react-dom',
  'react-aria',
  'react-aria-components',
  'react-stately',
  'react-server-dom-webpack',
  'recharts',
  'input-otp',
  'waku',
  'lucide-react',
  '@lit/react',
  '@phosphor-icons/react',
  '@testing-library/react',
  '@vitejs/plugin-react',
  '@astrojs/react',
])

// Pattern matchers for banned packages
const BANNED_PATTERNS: RegExp[] = [
  /^react(-.*)?$/,
  /^@types\/react(-.*)?$/,
  /^@stylexjs\//,
  /^fumadocs-/,
  /^@tanstack\/react-/,
  /(-|\/)react$/,
]

function isBannedPackage(name: string): boolean {
  if (BANNED_EXACT.has(name)) {
    return true
  }
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(name)) {
      return true
    }
  }
  return false
}

interface Violation {
  file: string
  block: DepBlock
  pkg: string
  version: string
}

function checkManifest(filePath: string, relativePath: string): Violation[] {
  if (!existsSync(filePath)) {
    console.error(
      `${colors.red}Error: Manifest file not found: ${filePath}${colors.reset}`,
    )
    process.exit(1)
  }

  let pkgJson: Record<string, any>
  try {
    pkgJson = JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(
      `${colors.red}Error parsing JSON in ${filePath}:${colors.reset}`,
      err,
    )
    process.exit(1)
  }

  const violations: Violation[] = []

  for (const block of DEP_BLOCKS) {
    const deps = pkgJson[block]
    if (deps && typeof deps === 'object') {
      for (const [depName, depVersion] of Object.entries(deps)) {
        if (isBannedPackage(depName)) {
          violations.push({
            file: relativePath,
            block,
            pkg: depName,
            version: String(depVersion),
          })
        }
      }
    }
  }

  return violations
}

function main() {
  const rootDir = resolve(import.meta.dir, '..')
  const rawTarget = process.argv[2] || 'all'
  const target = rawTarget.toLowerCase() as Target

  if (target !== 'all' && target !== 'ui' && target !== 'docs') {
    console.error(
      `${colors.red}Invalid target '${rawTarget}'. Supported targets: all, ui, docs.${colors.reset}`,
    )
    console.error('Usage: bun ./scripts/verify-no-react.ts [all|ui|docs]')
    process.exit(1)
  }

  const targetsToCheck: Array<{ absPath: string; relPath: string }> = []
  if (target === 'all' || target === 'ui') {
    targetsToCheck.push({
      absPath: join(rootDir, 'ui', 'package.json'),
      relPath: 'ui/package.json',
    })
  }
  if (target === 'all' || target === 'docs') {
    targetsToCheck.push({
      absPath: join(rootDir, 'docs', 'package.json'),
      relPath: 'docs/package.json',
    })
  }

  const allViolations: Violation[] = []
  for (const t of targetsToCheck) {
    allViolations.push(...checkManifest(t.absPath, t.relPath))
  }

  if (allViolations.length > 0) {
    console.error(
      `\n${colors.red}${colors.bright}❌ Disallowed packages detected!${colors.reset}`,
    )
    console.error(
      `${colors.red}Found ${allViolations.length} prohibited package(s) matching banned criteria (React, StyleX, Recharts, Fumadocs, etc.):${colors.reset}\n`,
    )

    const grouped = new Map<
      string,
      Map<DepBlock, Array<{ pkg: string; version: string }>>
    >()
    for (const v of allViolations) {
      if (!grouped.has(v.file)) {
        grouped.set(v.file, new Map())
      }
      const fileMap = grouped.get(v.file)!
      if (!fileMap.has(v.block)) {
        fileMap.set(v.block, [])
      }
      fileMap.get(v.block)!.push({ pkg: v.pkg, version: v.version })
    }

    for (const [file, blockMap] of grouped.entries()) {
      console.error(`${colors.bright}${colors.yellow}${file}:${colors.reset}`)
      for (const [block, items] of blockMap.entries()) {
        console.error(`  ${colors.cyan}[${block}]${colors.reset}`)
        for (const item of items) {
          console.error(
            `    ${colors.red}- ${item.pkg}${colors.reset} (${colors.dim}${item.version}${colors.reset})`,
          )
        }
      }
      console.error('')
    }

    console.error(
      `${colors.yellow}Please remove all React, StyleX, and legacy dependencies before proceeding.${colors.reset}\n`,
    )
    process.exit(1)
  }

  console.log(
    `${colors.green}✓ [verify-no-react] Target '${target}': Zero disallowed React/legacy packages found across inspected manifests.${colors.reset}`,
  )
  process.exit(0)
}

main()
```

Set executable permissions:
```bash
chmod +x scripts/verify-no-react.ts
```

---

### Step 2: Update `ui/package.json`

Overwrite `/Users/phearak/github/orgs/moul-dev/ui/ui/package.json`:

```json
{
  "name": "@moul-dev/ui",
  "version": "2026.10.16",
  "description": "Accessible, standards-first Web Components library built with Lit, Shadow DOM, and native CSS tokens",
  "license": "MIT",
  "type": "module",
  "main": "./dist/moul-ui.js",
  "module": "./dist/moul-ui.js",
  "types": "./dist/src/index.d.ts",
  "customElements": "./dist/custom-elements.json",
  "sideEffects": [
    "./dist/moul-ui.js",
    "./dist/assets/style.css"
  ],
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/moul-dev/ui.git",
    "directory": "ui"
  },
  "homepage": "https://moul.dev/ui",
  "bugs": {
    "url": "https://github.com/moul-dev/ui/issues"
  },
  "keywords": [
    "lit",
    "web-components",
    "custom-elements",
    "shadow-dom",
    "components",
    "accessible",
    "design-system",
    "ui"
  ],
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "import": "./dist/moul-ui.js",
      "default": "./dist/moul-ui.js"
    },
    "./style.css": {
      "style": "./dist/assets/style.css",
      "default": "./dist/assets/style.css"
    }
  },
  "scripts": {
    "dev": "vite",
    "build": "bun ../scripts/verify-no-react.ts ui && tsc -b && vite build && cem analyze --config custom-elements-manifest.config.mjs",
    "build:watch": "vite build --watch",
    "lint": "biome check",
    "format": "biome format --write",
    "gen:component": "bun ../scripts/gen-component.ts",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "@lit-labs/virtualizer": "^2.1.0",
    "@lit/context": "^1.1.3",
    "d3-scale": "^4.0.2",
    "d3-shape": "^3.2.0",
    "lit": "^3.2.1",
    "motion": "^13.4.1"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.0",
    "@custom-elements-manifest/analyzer": "^0.10.4",
    "@open-wc/testing-helpers": "^2.2.0",
    "@types/d3-scale": "^4.0.8",
    "@types/d3-shape": "^3.1.6",
    "@types/node": "^24.12.3",
    "fast-check": "^3.23.2",
    "glob": "^11.0.0",
    "happy-dom": "^16.8.1",
    "typescript": "~6.0.2",
    "vite": "^8.0.12",
    "vite-plugin-dts": "^5.0.2",
    "vitest": "^2.1.8"
  }
}
```

---

### Step 3: Update `docs/package.json`

Overwrite `/Users/phearak/github/orgs/moul-dev/ui/docs/package.json`:

```json
{
  "name": "docs",
  "private": true,
  "version": "2026.10.16",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "bun ../scripts/verify-no-react.ts docs && astro build",
    "preview": "astro preview",
    "types:check": "astro check && tsc --noEmit",
    "lint": "biome check",
    "format": "biome format --write"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.32.0",
    "@moul-dev/ui": "workspace:*",
    "@phosphor-icons/web": "^2.1.1",
    "astro": "^5.5.0",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.5.0",
    "@types/node": "^25.9.3",
    "typescript": "^6.0.3"
  }
}
```

---

### Step 4: Install Dependencies & Verify

Run the dependency sync and guard verification:

```bash
# 1. Verify guard exits 0 on all updated manifests
bun ./scripts/verify-no-react.ts all
bun ./scripts/verify-no-react.ts ui
bun ./scripts/verify-no-react.ts docs

# 2. Sync dependencies in bun workspace
bun install

# 3. Verify Biome formatting/linting passes
bun run lint
```

---

## 5. Verification Method

To independently verify the implementation:

1. **Negative Guard Test (Verification that guard actually detects violations):**
   - Can be verified before applying manifest edits or by temporarily injecting a banned dependency:
     ```bash
     # When run against manifests containing react/stylex/fumadocs:
     bun ./scripts/verify-no-react.ts all
     # Expected: exit code 1, prints offending packages grouped by file and block.
     ```
2. **Positive Guard Test (Verification that clean manifests pass):**
   ```bash
   bun ./scripts/verify-no-react.ts all
   # Expected: exit code 0, prints "✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found..."
   bun ./scripts/verify-no-react.ts ui
   # Expected: exit code 0
   bun ./scripts/verify-no-react.ts docs
   # Expected: exit code 0
   ```
3. **CLI Argument Validation Test:**
   ```bash
   bun ./scripts/verify-no-react.ts invalid-target
   # Expected: exit code 1, prints "Invalid target 'invalid-target'. Supported targets: all, ui, docs."
   ```
4. **Manifest Structure Inspection:**
   - In `ui/package.json`:
     - Confirm `"peerDependencies"` is absent.
     - Confirm `"exports"` has exactly `.` and `./style.css`.
     - Confirm `"customElements": "./dist/custom-elements.json"` and `"sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"]` exist.
   - In `docs/package.json`:
     - Confirm no React or Fumadocs packages remain.
5. **Lint Check:**
   ```bash
   bun run lint
   # Expected: exit code 0.
   ```
6. **Invalidation Conditions:**
   - Any exit code `!= 0` from `bun ./scripts/verify-no-react.ts all`.
   - Retention of any prohibited package in `ui/package.json` or `docs/package.json`.
   - Incomplete export keys in `ui/package.json` (e.g. keeping `./react` or `./tokens`).
