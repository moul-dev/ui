# Specification Mining Report: Phase 1 & Phase 2 Foundation

## Observation

Authoritative specification documents examined:
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md` (lines 1–60)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md` (Req 1, 2, 3, 4, 6, 15, 16; lines 36–107, 128–145, 300–334)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/design.md` (Sections 1, 2, 3, 4, 5, 7, 10, 11; lines 9–392, 570–628, 897–985)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md` (Phase 1 & Phase 2; Tasks 1.1–1.4, 2.1–2.4; lines 9–51)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/package.json` (lines 1–108)
- `/Users/phearak/github/orgs/moul-dev/ui/docs/package.json` (lines 1–50)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/vite.config.ts` (lines 1–106)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/src/test-setup.ts` (lines 1–6)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/src/tokens/tokens.stylex.ts` (lines 1–183)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/src/styles/theme.css` (lines 1–20)
- `/Users/phearak/github/orgs/moul-dev/ui/ui/src/tokens/tokens.test.ts` (lines 1–183)

Key direct observations:
1. `ui/package.json` currently contains legacy React and StyleX dependencies (`@phosphor-icons/react`, `@stylexjs/stylex`, `input-otp`, `react-aria`, `react-aria-components`, `recharts`, `@testing-library/react`, `react`, `react-dom`), exposes subpaths (`./tokens`, `./tokens.stylex`, `./theme.css`, `./style`), and has peerDependencies on React and StyleX.
2. `docs/package.json` currently depends on Waku (`waku: 1.0.0-beta.3`), Fumadocs (`fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`), TanStack React packages (`@tanstack/react-*`), and React 19.
3. `ui/vite.config.ts` currently imports `@stylexjs/unplugin` and `@vitejs/plugin-react`, and builds for StyleX CSS extraction without any banned import validator.
4. `scripts/verify-no-react.ts` does not yet exist in `scripts/`.
5. `ui/custom-elements-manifest.config.mjs` does not yet exist.
6. `ui/src/utils/` directory does not yet exist.
7. `ui/src/styles/style.css` does not yet exist (`ui/src/styles/theme.css` exists with basic brand hooks).

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Dependency Guard | `scripts/verify-no-react.ts` CLI | Verifies zero disallowed React/StyleX/legacy dependencies in `ui/package.json` and `docs/package.json` | CLI target flag: `ui`, `docs`, or `all` via `bun ./scripts/verify-no-react.ts <target>` | Exit code `0` on clean manifests; log of offending packages and exit code `1` on violation | Exits `1` and prints offending packages grouped by manifest and dependency section (`dependencies`, `devDependencies`, `peerDependencies`) | `rdt/requirements.md` Req 1.1, 1.2, 1.7; `rdt/design.md` §2.1; `ORIGINAL_REQUEST.md` R1 |
| 2 | Package Manifest | `ui/package.json` Manifest & Exports Contract | Package configuration exposing strictly two entry points (`.` and `./style.css`) with Lit/D3/Motion deps | Package installation and resolution | Custom Element bundle at `.`, CSS tokens at `./style.css`, CEM at `customElements` field | Modules attempting to import `./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, or `./style` fail with `ERR_PACKAGE_PATH_NOT_EXPORTED` | `rdt/requirements.md` Req 1.1, 1.3, 1.4, 16.1–16.6; `rdt/design.md` §2.2 |
| 3 | Package Manifest | `docs/package.json` Manifest | Pure Astro + Starlight documentation manifest with zero React or Fumadocs | Package installation | Astro Starlight static docs app configuration | Build fails with code 1 if any React or Fumadocs package remains | `rdt/requirements.md` Req 1.2, 13.1, 13.11; `rdt/design.md` §2.3 |
| 4 | Build Pipeline | `banReactImportsPlugin` in `ui/vite.config.ts` | Rollup plugin during Vite build rejecting imports matching banned specifiers | Resolved module specifier string during bundling | Unchanged resolution for non-banned modules | Throws `Error` failing Vite build if module starts with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` | `rdt/requirements.md` Req 1.5; `rdt/design.md` §10.1; `ORIGINAL_REQUEST.md` R1 |
| 5 | Build Pipeline | Vite Library Build & Banner | Bundles Lit components into `dist/moul-ui.js` with `"use client";` banner and `dist/src/index.d.ts` | Source TypeScript files from `ui/src/index.ts` | `dist/moul-ui.js` (ESM) with `"use client";` as first line, types in `dist/src/index.d.ts` | Build fails if TypeScript compilation fails or disallowed imports are detected | `rdt/requirements.md` Req 15.12, 15.13; `rdt/design.md` §10.1 |
| 6 | Build Pipeline | CSS Token Emission | Emits native CSS design tokens from `ui/src/styles/style.css` to `dist/assets/style.css` | `ui/src/styles/style.css` source | `dist/assets/style.css` without downward transpilation | Fails if source stylesheet is missing or unreadable | `rdt/requirements.md` Req 3.12; `rdt/design.md` §10.1 |
| 7 | Analyzer | `custom-elements-manifest.config.mjs` | Configures CEM analyzer for schema v2 scanning Lit components | Source component files in `src/components/**/*.ts` (excluding tests & styles) | `dist/custom-elements.json` describing tags, attributes, properties, events, slots, CSS parts | Exits with non-zero status if analyzer encounters syntax or schema errors | `rdt/requirements.md` Req 2.7, 15.7; `rdt/design.md` §10.2 |
| 8 | Test Harness | `ElementInternals` Shim in `test-setup.ts` | Standards-compliant shim for `attachInternals()` in `happy-dom` | Custom element calling `this.attachInternals()` | `ElementInternals` object tracking `form`, `setFormValue()`, `setValidity()`, `reportValidity()`, `validity`, `validationMessage` | Throws if called multiple times on the same element; returns null / logs warning in unsupported runtime | `rdt/requirements.md` Req 5.7, 5.8, 5.9, 6.7; `rdt/design.md` §11.1 |
| 9 | Test Harness | Native `<dialog>` Disconnected Shim in `test-setup.ts` | Shim for `<dialog>` simulating native `showModal()`, `close()`, and disconnected `DOMException` | `dialog.showModal()`, `dialog.close(returnVal)` | Sets/removes `open` attribute, dispatches `close` event | When `!this.isConnected`, throws `DOMException('Failed to execute showModal on HTMLDialogElement: The element is not in a Document.', 'InvalidStateError')` | `rdt/requirements.md` Req 6.10; `rdt/design.md` §11.1; `ORIGINAL_REQUEST.md` R1 |
| 10 | Test Harness | Popover API Shim in `test-setup.ts` | Shim for Popover API on `HTMLElement.prototype` in `happy-dom` | `showPopover()`, `hidePopover()`, `togglePopover()` | Toggles `:popover-open` simulation and dispatches `beforetoggle`/`toggle` events | Throws `DOMException('InvalidStateError')` if element lacks `popover` attribute | `rdt/requirements.md` Req 6.1; `rdt/design.md` §11.1 |
| 11 | Test Harness | `ResizeObserver` Deterministic Mock Controller | Mock controller allowing programmatic triggering of resize callbacks at exact dimensions | `triggerResize(element, { width, height })` | Triggers registered observer callback with mock `ResizeObserverEntry[]` | None | `rdt/design.md` §11.1; `rdt/tasks.md` Task 1.4 |
| 12 | Design Tokens | CSS Design Token Layer (`ui/src/styles/style.css`) | `:root` custom properties using `light-dark()` and `oklch()`, brand hooks, semantic scales and aliases | `:root`, `[data-theme="light"]`, `[data-theme="dark"]`, `.dark` | Inheritable CSS custom properties across document and open Shadow DOMs | Fallbacks handled via standard CSS var defaults | `rdt/requirements.md` Req 3.1–3.11; `rdt/design.md` §4.1, §4.2 |
| 13 | Styles | Semantic Tones & Variants Matrix (`ui/src/styles/semantic-tones.ts`) | Generates styles for all 25 combinations of 5 Semantic Tones × 5 Visual Variants with blur progressive enhancement | 5 tones (`primary`, `accent`, `success`, `warning`, `error`) × 5 variants (`solid`, `flat`, `shadow`, `bordered`, `glass`) | `CSSResultGroup` containing tone custom properties and variant styling | Unrecognized values ignored/fallback via `normalizeTone` and `normalizeVariant` | `rdt/requirements.md` Req 4.1–4.8; `rdt/design.md` §5.1, §5.2 |
| 14 | Styles | Tone & Variant Normalizers | Pure helper functions safely normalizing tone and variant values to valid defaults | `normalizeTone(val, fallback = 'primary')`, `normalizeVariant(val, fallback = 'flat')` | Validated `SemanticTone` and `VisualVariant` | Unknown/invalid input safely returns fallback | `rdt/requirements.md` Req 4.8; `rdt/design.md` §5.1 |
| 15 | Styles | Shadow DOM Reset (`ui/src/styles/reset.styles.ts`) | Shared `CSSResultGroup` reset providing `box-sizing: border-box`, margin resets, `:focus-visible` ring | LitElement style definitions | Scoped CSS rules within Shadow Root | None | `rdt/requirements.md` Req 4.6; `rdt/design.md` §1.2 |
| 16 | Core Utility | Idempotent Element Definition (`define-element.ts`) | Safe `customElements.define` wrapper preventing duplicate registration crashes | `defineElement(tagName: string, ctor: CustomElementConstructor)` | Registers custom element in registry if absent | If tag name already registered, emits `console.warn` and returns without throwing | `rdt/requirements.md` Req 2.9, 16.5; `rdt/design.md` §3.1 |
| 17 | Core Utility | Dev-Mode Accessible Label Check (`warn-missing-label.ts`) | Warns developers when interactive elements lack accessible text in dev mode | `warnMissingLabel(host: HTMLElement, description: string, hasVisibleLabel = false)` | `console.warn` in dev environments (`NODE_ENV !== 'production'`) | Silent no-op in production (`NODE_ENV === 'production'`) | `rdt/requirements.md` Req 2.8, 8.3; `rdt/design.md` §3.3 |
| 18 | Core Utility | Safe Modal & Focus Trap (`focus-trap.ts`) | Safe modal open helper, focus trap loop, focus restoration, and popover/anchor fallback check | `safeShowModal(dialog, focusRoot)`, `trapFocus(container, event)`, `supportsNativePopoverAndAnchor()` | Returns `true`/`false`, traps `Tab`/`Shift+Tab`, restores focus on close | Catches disconnected `DOMException` from `showModal()`, emits `console.warn`, returns `false` | `rdt/requirements.md` Req 6.3, 6.4, 6.8, 6.9, 6.10; `rdt/design.md` §7.1, §7.2 |
| 19 | Core Utility | Motion Engine & Presets (`motion.ts`) | Vanilla DOM `motion` animation presets, FLIP active indicator, and reduced-motion guard | `subtleAnimate(target, keyframes, options)`, `animateActiveIndicator(indicator, prevRect, nextRect)` | `AnimationPlaybackControls` | Collapses duration to 0 / returns null when `prefersReducedMotion()` is active | `rdt/requirements.md` Req 5.4, 7.3; `rdt/design.md` §6.6 |
| 20 | Core Utility | Internal SVG Chrome Icons (`icons.ts`) | Zero-dependency Lit `svg` templates for internal UI affordances | Template invocations (`close`, `chevronDown`, `search`, `clear`, `alert*`, `spinnerRing`, `calendarNav*`) | `SVGTemplateResult` with `aria-hidden="true"` and `focusable="false"` | None | `rdt/requirements.md` Req 2.8; `rdt/design.md` §3.4; `ORIGINAL_REQUEST.md` R2 |
| 21 | Verification | Property-Based Test Suite (`Tokens.test.ts`) | `fast-check` property tests verifying token values, 25 tone/variant pairs, and utility resiliency | String inputs, random tone/variant generators, DOM elements | Test assertions via Vitest + `fast-check` | Fails test suite if any token, combination, or utility violates contracts | `rdt/requirements.md` Req 3, 4; `rdt/design.md` §11.2; `ORIGINAL_REQUEST.md` Criteria |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `scripts/verify-no-react.ts` | Manifest containing nested or prefix name e.g. `react-transition-group` or `@types/react` | Script detects regex `/^react-/` or exact banned names across `dependencies`, `devDependencies`, `peerDependencies`, prints violation, and exits with code `1`. |
| 2 | `scripts/verify-no-react.ts` | Target argument `all` vs `ui` vs `docs` | `ui` checks only `ui/package.json`; `docs` checks only `docs/package.json`; `all` checks both. If any package fails, process exits with code 1. |
| 3 | Package Exports Contract | Consumer code: `import { tokens } from '@moul-dev/ui/tokens'` or `import '@moul-dev/ui/react'` | Node.js/Bun/Vite module resolver throws `ERR_PACKAGE_PATH_NOT_EXPORTED` because only `.` and `./style.css` exist in `ui/package.json` `exports`. |
| 4 | `banReactImportsPlugin` | Internal source file containing `import { useState } from 'react'` or `import { motion } from 'motion/react'` | Vite build halts immediately during `resolveId` with an explicit Error identifying the banned specifier and importing file. |
| 5 | `defineElement` | Calling `defineElement('moul-button', MoulButton)` twice in the same runtime | First call registers with `customElements.define`. Second call finds `customElements.get('moul-button')`, emits `console.warn` with conflicting tag name, does not throw, and preserves first registration. |
| 6 | `warnMissingLabel` | `<moul-button is-icon>` with only whitespace in `aria-label="   "` | `getAttribute('aria-label')?.trim()` is empty; `warnMissingLabel` triggers `console.warn` identifying the tag and missing label description. |
| 7 | `warnMissingLabel` | `process.env.NODE_ENV === 'production'` | No check performed; returns immediately to avoid production console pollution and performance overhead. |
| 8 | `safeShowModal` | Dialog created via `document.createElement('dialog')` but not appended to DOM (`!dialog.isConnected`) | Native browser (and test shim) throws `DOMException` with `name === 'InvalidStateError'`. `safeShowModal` catches the exception, logs `console.warn`, avoids attempting to focus elements, and returns `false`. |
| 9 | `safeShowModal` | Dialog with no focusable child elements | `focusFirstElement` queries focusable selectors; finding none, safely falls back to focusing the dialog container (`focusRoot ?? dialog`) without throwing. |
| 10 | `supportsNativePopoverAndAnchor` | Runtime lacking CSS Anchor Positioning (e.g., Firefox without flags) | `CSS.supports('anchor-name', '--moul-anchor')` returns `false`; utility returns `false`, causing overlay components to emit a warning once and fall back to fixed positioning. |
| 11 | `normalizeTone` & `normalizeVariant` | Arbitrary string, number, `null`, or `undefined` (e.g. `normalizeTone("invalid-tone")`) | Property-based tests verify it returns fallback (`'primary'` for tone, `'flat'` for variant) without throwing. |
| 12 | `semanticToneStyles` (`variant="glass"`) | Browser lacking `backdrop-filter` or `-webkit-backdrop-filter` support | Applies base solid fallback styling (`background-color: var(--color-bg-glass); border: 1px solid var(--color-border-glass); color: var(--_tone-soft-fg)`) without blur. `@supports` rule is skipped. |
| 13 | `motion.ts` (`subtleAnimate`) | User has OS preference `prefers-reduced-motion: reduce` | `prefersReducedMotion()` evaluates to `true`; `subtleAnimate` overrides duration to `0`, ensuring animations complete instantaneously. |
| 14 | `motion.ts` (`animateActiveIndicator`) | Indicator elements without a previous bounding rect (`previousRect === null`) | Returns `null` immediately without scheduling an animation. |
| 15 | `style.css` Shadows | Consumers expecting legacy StyleX camelCase `--colorShadow` | Style tokens strictly declare `--color-shadow`; shadow rules `--shadow-sm`, `--shadow-md`, `--shadow-lg` reference `var(--color-shadow)`, adhering to standard kebab-case CSS tokens. |
| 16 | `FormInternalsController` in test harness | Component created in happy-dom test without enclosing `<form>` | When element has `name` attribute, controller's `internals.form === null` logs dev warning: `[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.` |

---

## Detailed Specifications & Technical Contracts

### 1. `scripts/verify-no-react.ts`

- **Execution**: `bun ./scripts/verify-no-react.ts [all|ui|docs]`
- **Exit Codes**:
  - `0`: No prohibited packages in inspected manifests.
  - `1`: One or more prohibited packages detected, or invalid CLI usage.
- **Inspected Fields**:
  - `dependencies`, `devDependencies`, `peerDependencies`
- **Exact Banned Package Lists**:
  - **`ui/package.json`**:
    - `react`
    - `react-dom`
    - `react-aria`
    - `react-aria-components`
    - `react-stately`
    - `@stylexjs/stylex`
    - `@stylexjs/unplugin`
    - `@vitejs/plugin-react`
    - `recharts`
    - `input-otp`
    - `waku`
    - `@lit/react`
    - `@phosphor-icons/react`
    - `@testing-library/react`
    - `@types/react`
    - `@types/react-dom`
    - Package names matching `/^react-/`
  - **`docs/package.json`**:
    - `react`
    - `react-dom`
    - `react-aria-components`
    - `waku`
    - `fumadocs-core`
    - `fumadocs-mdx`
    - `fumadocs-ui`
    - `react-server-dom-webpack`
    - `lucide-react`
    - `@tanstack/react-pacer`
    - `@tanstack/react-query`
    - `@tanstack/react-store`
    - `@tanstack/react-table`
    - `@tanstack/react-virtual`
    - `@types/react`
    - `@types/react-dom`
    - `@stylexjs/stylex`
    - `@astrojs/react`
    - Package names matching `/^react-/`

### 2. Package Manifests (`ui/package.json` & `docs/package.json`)

#### `ui/package.json`
- **Identity & Entry Points**:
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
    "sideEffects": ["./dist/moul-ui.js", "./dist/assets/style.css"],
    "files": ["dist", "README.md", "LICENSE"],
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
    }
  }
  ```
  *Banned Export Subpaths*: `./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style` MUST NOT exist.
- **Dependencies**:
  - `@lit-labs/virtualizer`: `^2.1.0`
  - `@lit/context`: `^1.1.3`
  - `d3-scale`: `^4.0.2`
  - `d3-shape`: `^3.2.0`
  - `lit`: `^3.2.1`
  - `motion`: `^13.4.1`
- **DevDependencies**:
  - `@biomejs/biome`: `^2.5.0`
  - `@custom-elements-manifest/analyzer`: `^0.10.4`
  - `@open-wc/testing-helpers`: `^2.2.0`
  - `@types/d3-scale`: `^4.0.8`
  - `@types/d3-shape`: `^3.1.6`
  - `@types/node`: `^24.12.3`
  - `fast-check`: `^3.23.2`
  - `glob`: `^11.0.0`
  - `happy-dom`: `^16.8.1`
  - `typescript`: `~6.0.2`
  - `vite`: `^8.0.12`
  - `vite-plugin-dts`: `^5.0.2`
  - `vitest`: `^2.1.8`
- **PeerDependencies**: None (entirely deleted).
- **Scripts**:
  - `dev`: `"vite"`
  - `build`: `"bun ../scripts/verify-no-react.ts ui && tsc -b && vite build && cem analyze --config custom-elements-manifest.config.mjs"`
  - `build:watch`: `"vite build --watch"`
  - `lint`: `"biome check"`
  - `format`: `"biome format --write"`
  - `gen:component`: `"bun ../scripts/gen-component.ts"`
  - `preview`: `"vite preview"`
  - `test`: `"vitest run"`

#### `docs/package.json`
- **Identity & Scripts**:
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

### 3. `ui/vite.config.ts`

- **Vitest configuration**:
  ```ts
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  }
  ```
- **Library Build (`build.lib`)**:
  - `entry: { 'moul-ui': resolve(__dirname, 'src/index.ts') }`
  - `formats: ['es']`
  - `target: 'esnext'`
- **Rollup Output Banner**:
  - `output: { banner: '"use client";' }`
- **Disallowed Import Gate (`banReactImportsPlugin`)**:
  - Custom Rollup plugin intercepting `resolveId(source, importer)`.
  - Prohibits any module specifier starting with:
    - `react`
    - `react-dom`
    - `react-aria`
    - `react-aria-components`
    - `@stylexjs/stylex`
    - `@lit/react`
    - `motion/react` (ensures only vanilla DOM `motion` exports are used)
  - If matched, throws an `Error` stopping the build.
- **CSS Token Emission**:
  - In `closeBundle` hook, copies `ui/src/styles/style.css` to `ui/dist/assets/style.css` ensuring raw `light-dark(oklch(...), oklch(...))` expressions are preserved intact.

### 4. `ui/custom-elements-manifest.config.mjs`

- **Analyzer Configuration**:
  ```js
  export default {
    globs: ['src/components/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
    outdir: 'dist',
    litelement: true,
  }
  ```
- **Execution Target**: Generates `dist/custom-elements.json` (schema v2) containing custom elements tag names, attributes, properties, events, slots, and CSS parts.

### 5. `ui/src/test-setup.ts`

- **ElementInternals Shim**:
  - Provides `HTMLElement.prototype.attachInternals()` returning:
    - `form`: getter returning `this.closest('form')`
    - `setFormValue(value)`
    - `setValidity(flags, message, anchor)` (truncating message to `<= 200` chars)
    - `reportValidity()` -> boolean
    - `validity`: `ValidityState` getters
    - `validationMessage`: string
- **Native `<dialog>` Shim**:
  - `HTMLDialogElement.prototype.showModal()`:
    - **Contract**: IF `!this.isConnected`, MUST throw `new DOMException('Failed to execute \'showModal\' on \'HTMLDialogElement\': The element is not in a Document.', 'InvalidStateError')`.
    - IF connected, sets `open = true` and `setAttribute('open', '')`.
  - `HTMLDialogElement.prototype.close(returnValue)`:
    - Clears `open = false`, `removeAttribute('open')`.
    - Dispatches `new Event('close')`.
- **Popover API Shim**:
  - `HTMLElement.prototype.showPopover()`, `hidePopover()`, `togglePopover(force)`:
    - Toggles simulated popover visibility attribute/state.
    - Dispatches `beforetoggle` and `toggle` events.
- **`ResizeObserver` Deterministic Controller**:
  - Programmatic mock to trigger resize callbacks at exact breakpoints:
    - `0–479px`: `'xs'`
    - `480–767px`: `'sm'`
    - `768–1023px`: `'md'`
    - `1024–1279px`: `'lg'`
    - `>=1280px`: `'xl'`

### 6. `ui/src/styles/semantic-tones.ts`

- **Definitions**:
  - `SEMANTIC_TONES = ['primary', 'accent', 'success', 'warning', 'error'] as const`
  - `VISUAL_VARIANTS = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const`
- **Functions**:
  - `normalizeTone(value: unknown, fallback: SemanticTone = 'primary'): SemanticTone`
  - `normalizeVariant(value: unknown, fallback: VisualVariant = 'flat'): VisualVariant`
- **Matrix Rules (`semanticToneStyles: CSSResultGroup`)**:
  - 5 Tone overrides defining `--_tone-solid-bg`, `--_tone-solid-fg`, `--_tone-soft-bg`, `--_tone-soft-fg`, `--_tone-border`.
  - 5 Variant treatments:
    - `solid`: solid background & contrast foreground.
    - `flat`: soft tinted background & tone foreground.
    - `bordered`: transparent background & border.
    - `shadow`: solid background with `box-shadow: var(--shadow-md)`.
    - `glass`:
      - Solid fallback: `background-color: var(--color-bg-glass); border: 1px solid var(--color-border-glass); color: var(--_tone-soft-fg);`
      - Progressive enhancement:
        ```css
        @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
          :host([variant="glass"]), [data-variant="glass"] {
            background-color: var(--color-bg-glass);
            border: 1px solid var(--color-border-glass);
            -webkit-backdrop-filter: blur(12px);
            backdrop-filter: blur(12px);
          }
        }
        ```

### 7. `ui/src/styles/reset.styles.ts`

- **Exports**: `resetStyles: CSSResultGroup` (or `CSSResult` from `lit`).
- **Scoped Shadow DOM Rules**:
  - `:host, :host *, *::before, *::after { box-sizing: border-box; }`
  - Default margin and padding resets.
  - `:focus-visible { outline: 2px solid var(--color-border-focus); outline-offset: 2px; }`
  - `font-family: inherit;`

### 8. Core Utilities in `ui/src/utils/`

1. **`define-element.ts`**:
   - `defineElement(tagName: string, ctor: CustomElementConstructor): void`
   - SSR guard: `if (typeof customElements === 'undefined') return;`
   - Checks `customElements.get(tagName)`.
   - If present, logs: `console.warn('[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.')` and returns without error.
   - If absent, invokes `customElements.define(tagName, ctor)`.
2. **`warn-missing-label.ts`**:
   - `warnMissingLabel(host: HTMLElement, description: string, hasVisibleLabel = false): void`
   - Returns early if `process.env.NODE_ENV === 'production'`.
   - Checks `aria-label` or `aria-labelledby`. If missing and `!hasVisibleLabel`:
     - `console.warn('[@moul-dev/ui] <${host.tagName.toLowerCase()}> is missing an accessible label (${description}). Provide an "aria-label" or "aria-labelledby" attribute.')`
3. **`focus-trap.ts`**:
   - `supportsNativePopoverAndAnchor(): boolean`: checks `'popover' in HTMLElement.prototype && typeof CSS !== 'undefined' && CSS.supports?.('anchor-name', '--moul-anchor')`.
   - `safeShowModal(dialog: HTMLDialogElement | null, focusRoot?: HTMLElement): boolean`:
     - Checks `if (!dialog) return false;`
     - Catches disconnected `DOMException` from `showModal()`, logs `console.warn`, returns `false`.
     - Calls `focusFirstElement(focusRoot ?? dialog)` within <100ms. Returns `true`.
   - `focusFirstElement(container: HTMLElement)`: focuses first matching focusable control.
   - `trapFocus(container: HTMLElement, event: KeyboardEvent)`: traps `Tab` and `Shift+Tab`.
   - Focus restoration: stores `document.activeElement` on open and restores on close.
4. **`motion.ts`**:
   - Presets:
     - `SPRING_SNAPPY`: `{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }`
     - `SPRING_GENTLE`: `{ type: 'spring', stiffness: 320, damping: 28, mass: 1 }`
     - `IOS_SHEET_CURVE`: `[0.32, 0.72, 0, 1] as const`
     - `CHART_EASE`: `[0.22, 1, 0.36, 1] as const`
   - `prefersReducedMotion(): boolean`: checks `window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false`.
   - `subtleAnimate(target, keyframes, options = SPRING_GENTLE)`: collapses duration to 0 if reduced motion preferred.
   - `animateActiveIndicator(indicator, previousRect, nextRect)`: FLIP delta spring transition between rects.
   - Re-exports `stagger` from `motion`.
5. **`icons.ts`**:
   - Zero-dependency Lit `svg` templates:
     - `close`, `chevronDown`, `search`, `clear`, `alertInfo`, `alertSuccess`, `alertWarning`, `alertError`, `spinnerRing`, `calendarNavPrev`, `calendarNavNext`.
     - Attributes: `aria-hidden="true"`, `focusable="false"`.

### 9. Verification Tests (`ui/src/tokens/Tokens.test.ts`)

- Test framework: `vitest` + `fast-check` (`fc`).
- **Suites**:
  1. `style.css` Token Layer:
     - `:root` `color-scheme: light dark` and selectors `[data-theme="light"]`, `[data-theme="dark"]`, `.dark`.
     - Brand customization hooks (`--brand-hue: 250`, etc.).
     - Color scales: Neutral (50–900), Primary (50–900), Error (300–700), Warning (300–700), Success (300–700) matching `tokens.stylex.ts` values.
     - Semantic aliases, 20 alert tokens, typography, spacing (1–8), radius, shadows (`--shadow-sm/md/lg` referencing `--color-shadow`), z-index, chart 1–8.
  2. `semantic-tones.ts`:
     - Fast-check across all 25 combinations (`SEMANTIC_TONES` × `VISUAL_VARIANTS`).
     - Fast-check `normalizeTone` & `normalizeVariant` fallback with arbitrary string inputs.
  3. Core Utilities:
     - `defineElement` idempotency (duplicate registration doesn't throw, calls console.warn).
     - `warnMissingLabel` dev check (warns on missing aria-label).
     - `safeShowModal` catches disconnected DOMException.
     - `motion.ts` respects reduced motion.

---

## Logic Chain

1. **Workspace Purge & Guarding**:
   - *Observation*: Monorepo currently has React and StyleX in both `ui/package.json` and `docs/package.json`.
   - *Reasoning*: To guarantee no regressions during the Lit/Astro rebuild, a two-tier guard is required: `scripts/verify-no-react.ts` inspects package manifests prior to build, and `banReactImportsPlugin` inspects import specifiers during Rollup bundling.
   - *Conclusion*: Implementing these two guards immediately seals the boundary against any React re-introduction.

2. **Package Exports Simplification**:
   - *Observation*: Legacy `ui/package.json` had 6 exports including `./react`, `./tokens`, `./tokens.stylex`.
   - *Reasoning*: Requirements 16.1–16.6 mandate strictly two entry points (`.` and `./style.css`) and explicitly require module-not-found errors on any legacy subpath.
   - *Conclusion*: `ui/package.json` must specify only `.` and `./style.css`, completely eliminating legacy subpaths.

3. **Standard Native Styling & Shadow DOM Isolation**:
   - *Observation*: Previously, StyleX injected styles and classes dynamically. In Web Components, styles are encapsulated in Shadow DOM.
   - *Reasoning*: CSS custom properties on `:root` penetrate Shadow DOM boundaries without JS overhead.
   - *Conclusion*: Porting `tokens.stylex.ts` directly into `ui/src/styles/style.css` using `:root` `color-scheme: light dark` and `light-dark(oklch(...))` provides zero-runtime theming, while `semanticToneStyles` and `resetStyles` give components consistent styling and box-sizing inside Shadow DOM.

4. **Testing in Headless DOM (`happy-dom`)**:
   - *Observation*: Modern browser APIs (`ElementInternals`, native `<dialog>.showModal()`, Popover API, CSS Anchor Positioning) are partially supported or absent in happy-dom.
   - *Reasoning*: Without shims in `ui/src/test-setup.ts`, Lit components utilizing these native browser APIs would crash or behave unstably during unit and property-based test execution.
   - *Conclusion*: Standards-compliant shims for `ElementInternals`, disconnected `<dialog>` `DOMException`, Popover API, and `ResizeObserver` are necessary prerequisites for running Vitest in `ui/`.

---

## Caveats

- **No Implementation in this Turn**: As a specification miner, no source code changes were made to existing packages or scripts.
- **Astro Starlight Documentation Rebuild**: Phase 1 and 2 focus on `docs/package.json` dependency cleanup and `scripts/verify-no-react.ts` validation. Full Starlight site content migration belongs to Phase 11.
- **Component Implementations**: The 54 public components and 5 reactive controllers are planned for Phases 3 through 9; their contracts are aligned with the foundational utilities surveyed here.

---

## Conclusion

The specifications for Phase 1 (Workspace Purge, Package Contracts & Test Harness) and Phase 2 (CSS Design Token Layer, Semantic Tones & Core Utilities) are fully mined and documented. All 9 requested focus areas, along with exact contracts, inputs, outputs, error behaviors, and edge cases, have been systematically recorded and are ready for implementation.

---

## Verification Method

To verify these specifications against the authoritative codebase and documentation:

1. **Inspect Documentation Sources**:
   ```bash
   grep -n "Requirement 1:" /Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md
   grep -n "Requirement 3:" /Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md
   grep -n "2.1 Disallowed Dependency Policy" /Users/phearak/github/orgs/moul-dev/ui/rdt/design.md
   grep -n "10.1 ui/vite.config.ts" /Users/phearak/github/orgs/moul-dev/ui/rdt/design.md
   ```
2. **Examine Existing Source Tokens**:
   ```bash
   cat /Users/phearak/github/orgs/moul-dev/ui/ui/src/tokens/tokens.stylex.ts
   ```
3. **Validate Task Alignments**:
   - Verify Tasks 1.1–1.4 in `rdt/tasks.md` map 1:1 to Phase 1 specifications.
   - Verify Tasks 2.1–2.4 in `rdt/tasks.md` map 1:1 to Phase 2 specifications.
