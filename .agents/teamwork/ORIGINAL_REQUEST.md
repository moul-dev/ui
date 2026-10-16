# Original User Request

## 2026-10-16T03:06:48Z

Rebuild the `@moul-dev/ui` monorepo foundation by completing Phase 1 (workspace purge, zero-React package manifests & build guard, Vite library config, CEM analyzer config, and happy-dom test harness) and Phase 2 (CSS token layer with light-dark/oklch, 25-combination semantic tone & variant matrix, shadow DOM reset, core utilities, and test suites) as specified in `rdt/requirements.md`, `rdt/design.md`, and `rdt/tasks.md`.

Working directory: /Users/phearak/github/orgs/moul-dev/ui
Integrity mode: development

References:
- Requirements: `rdt/requirements.md` (Req 1, 2, 3, 4, 6, 15, 16)
- Technical Specification: `rdt/design.md` (Sections 1, 2, 3, 4, 5, 7, 10, 11)
- Task Breakdown: `rdt/tasks.md` (Phase 1: Tasks 1.1–1.4, Phase 2: Tasks 2.1–2.4)

## Requirements

### R1. Phase 1: Workspace Purge, Package Contracts & Test Harness
Purge all React, React Aria, StyleX, Recharts, Waku, Fumadocs, and legacy dependencies from `ui/package.json` and `docs/package.json`. Introduce a strict CLI disallowed-dependency guard script (`scripts/verify-no-react.ts`) and Vite Rollup plugin (`banReactImportsPlugin`) that fail the build if any prohibited dependency or import is present. Configure `ui/package.json` to expose strictly `.` and `./style.css` (removing `./react`, `./tokens`, and `./tokens.stylex`), add Lit 3, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, and `motion` dependencies, configure `custom-elements-manifest.config.mjs` (schema v2), and establish a Vitest + `happy-dom` test harness with shims for `ElementInternals`, native `<dialog>` (including disconnected DOMException behavior), Popover API, and deterministic `ResizeObserver`.

### R2. Phase 2: CSS Design Token Layer, Semantic Tones & Core Utilities
Author the native CSS design token layer (`ui/src/styles/style.css`) using `:root` `color-scheme: light dark` and `light-dark(oklch(...), oklch(...))` color scales (Neutral, Primary, Error, Warning, Success) ported accurately from `ui/src/tokens/tokens.stylex.ts`, alongside brand customization hooks, semantic aliases, typography, spacing, radius, z-index, chart tokens, and shadows referencing `var(--color-shadow)`. Implement `semanticToneStyles` (`ui/src/styles/semantic-tones.ts`) generating all 25 combinations of 5 Semantic Tones (`primary`, `accent`, `success`, `warning`, `error`) × 5 Visual Variants (`solid`, `flat`, `shadow`, `bordered`, `glass` with `@supports` backdrop-filter blur progressive enhancement and non-blur fallback) plus `normalizeTone` and `normalizeVariant`. Create a shared Shadow DOM reset (`ui/src/styles/reset.styles.ts`) and core utilities (`ui/src/utils/`): `define-element.ts` (idempotent registration with warning), `warn-missing-label.ts` (dev-only accessibility warning), `focus-trap.ts` (`safeShowModal`, focus trap, focus restoration, popover/anchor fallback helper), `motion.ts` (vanilla `motion` presets `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `subtleAnimate`, `animateActiveIndicator`, `prefersReducedMotion`), and zero-dependency Lit internal SVG chrome icons (`ui/src/utils/icons.ts`). Write property-based tests using `fast-check` in `ui/src/tokens/Tokens.test.ts` verifying all tokens, combinations, and utilities.

## Acceptance Criteria

### Package Contracts & Dependency Guard
- [ ] `scripts/verify-no-react.ts` inspects `dependencies`, `devDependencies`, and `peerDependencies` of `ui/package.json` and `docs/package.json`, exiting with code 1 and listing offending packages if any banned package is found.
- [ ] Running `bun ./scripts/verify-no-react.ts all` exits with code 0 on the updated manifests.
- [ ] `ui/package.json` contains no packages matching `react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `@stylexjs/*`, `@vitejs/plugin-react`, `recharts`, `input-otp`, `waku`, `@lit/react`, or `/^react-/`.
- [ ] `ui/package.json` includes `lit`, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, and `motion` in `dependencies`, and `@custom-elements-manifest/analyzer`, `@open-wc/testing-helpers`, `happy-dom`, `fast-check`, `@types/d3-scale`, `@types/d3-shape` in `devDependencies`.
- [ ] `ui/package.json` `exports` only exposes `.` (`types: ./dist/src/index.d.ts`, `import: ./dist/moul-ui.js`, `default: ./dist/moul-ui.js`) and `./style.css` (`style: ./dist/assets/style.css`, `default: ./dist/assets/style.css`), with `./react`, `./tokens`, and `./tokens.stylex` completely removed.
- [ ] `docs/package.json` contains no React or Fumadocs packages and specifies `astro`, `@astrojs/starlight`, `@moul-dev/ui` (`workspace:*`), and `@phosphor-icons/web`.

### Build Pipeline & Test Harness
- [ ] `ui/vite.config.ts` builds in library mode with `"use client";` banner in Rollup output, copies `ui/src/styles/style.css` to `dist/assets/style.css`, and includes `banReactImportsPlugin` that rejects any import starting with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
- [ ] `ui/custom-elements-manifest.config.mjs` is configured for CEM schema v2 outputting to `dist/custom-elements.json`.
- [ ] `ui/src/test-setup.ts` configures `happy-dom` with shims for `ElementInternals` (tracking form, value, validity), native `<dialog>` (`showModal` throwing `DOMException` when disconnected, `close`), Popover API (`showPopover`, `hidePopover`, `togglePopover`), and `ResizeObserver`.

### CSS Design Tokens & Semantic Tones
- [ ] `ui/src/styles/style.css` defines `:root` `color-scheme: light dark` and selectors `[data-theme="light"]`, `[data-theme="dark"]`, `.dark`.
- [ ] Brand hooks `--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, `--brand-radius-factor: 1` are defined with their default values.
- [ ] Neutral (50–900), Primary (50–900), Error (300–700), Warning (300–700), and Success (300–700) scales are defined using `light-dark(oklch(...), oklch(...))` preserving the exact oklch lightness/chroma/hue values from `ui/src/tokens/tokens.stylex.ts`.
- [ ] Semantic aliases (`--color-bg`, `--color-bg-subtle`, `--color-bg-elevated`, `--color-fg`, `--color-fg-subtle`, `--color-fg-on-primary`, `--color-border`, `--color-border-subtle`, `--color-border-focus`, `--color-bg-glass`, `--color-border-glass`, `--color-shadow`, `--color-overlay`), 20 alert status tokens, typography tokens (`xs`–`4xl`), spacing tokens (`--spacing-1`–`--spacing-8`), radius tokens (`--radius-none`–`--radius-full`), shadows (`--shadow-sm/md/lg` referencing `var(--color-shadow)`), z-index tokens (`--z-base`–`--z-toast`), and chart tokens (`--color-chart-1`–`--color-chart-8`) are defined.
- [ ] `ui/src/styles/semantic-tones.ts` implements `semanticToneStyles` covering all 25 combinations of 5 tones (`primary`, `accent`, `success`, `warning`, `error`) × 5 variants (`solid`, `flat`, `shadow`, `bordered`, `glass`).
- [ ] `variant="glass"` provides `@supports (backdrop-filter: blur(12px))` progressive enhancement and a solid `--color-bg-glass` fallback when unsupported.
- [ ] `normalizeTone` and `normalizeVariant` fall back to defaults when given unrecognized values.
- [ ] `ui/src/styles/reset.styles.ts` exports a shared Lit `CSSResultGroup` reset for Shadow DOM.

### Core Utilities
- [ ] `ui/src/utils/define-element.ts` exports idempotent `defineElement(tagName, ctor)` that checks `customElements.get(tagName)` and emits `console.warn` without throwing or overriding.
- [ ] `ui/src/utils/warn-missing-label.ts` exports dev-only `warnMissingLabel(host, description, hasVisibleLabel)` that warns if `aria-label` and `aria-labelledby` are absent.
- [ ] `ui/src/utils/focus-trap.ts` exports `safeShowModal` (catching disconnected `DOMException` with `console.warn`), `<100ms` initial focus, focus trap loop, focus restoration, and `supportsNativePopoverAndAnchor`.
- [ ] `ui/src/utils/motion.ts` exports `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `prefersReducedMotion`, `subtleAnimate`, `animateActiveIndicator`, and `stagger` using vanilla `motion`.
- [ ] `ui/src/utils/icons.ts` exports zero-dependency Lit internal SVG templates (`close`, `chevronDown`, `search`, `clear`, `alertInfo`, `alertSuccess`, `alertWarning`, `alertError`, `spinnerRing`, `calendarNavPrev`, `calendarNavNext`).

### Objective Verification
- [ ] `bun run --cwd ui test` (or `bun test`) runs Vitest with `happy-dom` and passes all tests in `ui/src/tokens/Tokens.test.ts`.
- [ ] Fast-check property tests in `ui/src/tokens/Tokens.test.ts` verify all 25 tone × variant combinations and resilience to invalid string inputs.
- [ ] `bun ./scripts/verify-no-react.ts all` passes with exit code 0.
- [ ] `bun run lint` passes without errors.
