# Project: @moul-dev/ui Monorepo Foundation Rebuild (Phases 1 & 2)

## Architecture
Transition from legacy React / React Aria / StyleX / Recharts monorepo to Lit 3 Web Components foundation:
- Pure HTML Custom Elements with open Shadow DOM
- CSS Design Token Layer (`light-dark()` + `oklch()`) at `:root`
- 25-combination Semantic Tone & Variant system (`ui/src/styles/semantic-tones.ts`)
- Shared Shadow DOM Reset (`ui/src/styles/reset.styles.ts`)
- Core Web Component utilities (`ui/src/utils/`): `define-element.ts`, `warn-missing-label.ts`, `focus-trap.ts`, `motion.ts`, `icons.ts`
- Disallowed dependency guard (`scripts/verify-no-react.ts`) and Vite Rollup import ban plugin (`banReactImportsPlugin`)
- Vitest + `happy-dom` test harness with shims for `ElementInternals`, native `<dialog>` (disconnected DOMException), Popover API, and deterministic `ResizeObserver`
- Fast-check property-based verification test suite (`ui/src/tokens/Tokens.test.ts`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Disallowed Dependency Guard Script | `scripts/verify-no-react.ts` inspects `dependencies`, `devDependencies`, `peerDependencies` of `ui/package.json` and `docs/package.json`. Exits with code 1 on prohibited package, 0 on clean. Supports `all`, `ui`, `docs` CLI arguments. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 2 | Clean `ui/package.json` Manifest & Exports Contract | Remove all React, React Aria, StyleX, Recharts, input-otp, peerDependencies. Add Lit 3, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, `motion`, CEM analyzer, happy-dom, fast-check. Strictly export `.` and `./style.css` only; completely remove `./react`, `./tokens`, `./tokens.stylex`, `./theme.css`, `./style`. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 3 | Clean `docs/package.json` Manifest | Remove all React, Waku, Fumadocs, and TanStack React packages. Specify Astro, Starlight, `@moul-dev/ui` (`workspace:*`), and `@phosphor-icons/web`. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 4 | Vite Library Build & Rollup Guard Plugin | `ui/vite.config.ts` builds library mode with `"use client";` banner, copies `ui/src/styles/style.css` to `dist/assets/style.css`, and includes `banReactImportsPlugin` rejecting any import of `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, `motion/react`. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 5 | CEM Analyzer Config | `ui/custom-elements-manifest.config.mjs` configured for schema v2 outputting to `dist/custom-elements.json`. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 6 | Vitest + happy-dom Test Setup & Shims | `ui/src/test-setup.ts` configures `happy-dom` with shims for `ElementInternals` (tracking form, value, validity, 200-char truncated message), native `<dialog>` (`showModal` throwing DOMException 'InvalidStateError' when disconnected, `close`), Popover API, and deterministic `ResizeObserver`. | M1 | Survey (explorer 1 & spec miner) [DONE] |
| 7 | CSS Design Token Layer | `ui/src/styles/style.css` defines `:root` `color-scheme: light dark`, `[data-theme="light"]`, `[data-theme="dark"]`, `.dark`, brand customization hooks (`--brand-hue: 250`, `--brand-chroma-multiplier: 1`, etc.), 5 scales (Neutral, Primary, Error, Warning, Success) using `light-dark(oklch(...))`, semantic aliases, 20 alert tokens, typography, spacing, radius, shadows (referencing `var(--color-shadow)`), z-index, and chart colors 1-8. | M2 | Survey (explorer 2 & spec miner) [DONE] |
| 8 | Semantic Tones & Visual Variants Matrix | `ui/src/styles/semantic-tones.ts` implements all 25 combinations of 5 Semantic Tones (`primary`, `accent`, `success`, `warning`, `error`) × 5 Visual Variants (`solid`, `flat`, `shadow`, `bordered`, `glass` with `@supports` backdrop-filter blur progressive enhancement and solid fallback). Also exports `normalizeTone` and `normalizeVariant`. | M2 | Survey (spec miner & design doc) [DONE] |
| 9 | Shadow DOM Reset | `ui/src/styles/reset.styles.ts` exports a shared Lit `CSSResultGroup` reset for Shadow DOM (`box-sizing: border-box`, `:focus-visible` styling, font inheritance). | M2 | Survey (spec miner & design doc) [DONE] |
| 10 | Idempotent Element Registration | `ui/src/utils/define-element.ts` exports `defineElement(tagName, ctor)` that checks `customElements.get(tagName)` and emits `console.warn` without throwing or overriding. | M2 | Survey (spec miner & design doc) [DONE] |
| 11 | Accessible Label Dev Warning | `ui/src/utils/warn-missing-label.ts` exports dev-only `warnMissingLabel(host, description, hasVisibleLabel)` logging `console.warn` when accessible text is absent. | M2 | Survey (spec miner & design doc) [DONE] |
| 12 | Safe Modal & Focus Trap | `ui/src/utils/focus-trap.ts` exports `safeShowModal` (catching disconnected DOMException with warning), focus trap, focus restoration, and `supportsNativePopoverAndAnchor`. | M2 | Survey (spec miner & design doc) [DONE] |
| 13 | Vanilla Motion Engine & Presets | `ui/src/utils/motion.ts` exports `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `prefersReducedMotion`, `subtleAnimate`, `animateActiveIndicator`, and `stagger` using vanilla `motion`. | M2 | Survey (spec miner & design doc) [DONE] |
| 14 | Zero-Dependency SVG Chrome Icons | `ui/src/utils/icons.ts` exports zero-dependency Lit internal SVG templates (`close`, `chevronDown`, `search`, `clear`, `alertInfo`, `alertSuccess`, `alertWarning`, `alertError`, `spinnerRing`, `calendarNavPrev`, `calendarNavNext`). | M2 | Survey (spec miner & design doc) [DONE] |
| 15 | Token, Tone & Utility Verification Suite | `ui/src/tokens/Tokens.test.ts` writes fast-check property tests and unit tests verifying all `:root` CSS tokens in `style.css`, all 25 tone × variant combinations, input normalization fallback, and error resilience of utilities. | M2 | Survey (spec miner & design doc) [DONE] |
| 16 | Full E2E & Gate Verification | Verification of full build, `bun ./scripts/verify-no-react.ts all`, `bun test`, and `bun run lint`. | M3 | Survey (orchestrator plan) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Phase 1: Workspace Purge, Package Contracts & Test Harness | Features 1–6 (verify-no-react.ts, ui/package.json, docs/package.json, ui/vite.config.ts, custom-elements-manifest.config.mjs, ui/src/test-setup.ts) | none | DONE |
| M2 | Phase 2: CSS Design Tokens, Semantic Tones & Core Utilities | Features 7–15 (style.css, semantic-tones.ts, reset.styles.ts, utils: define-element, warn-missing-label, focus-trap, motion, icons, Tokens.test.ts) | M1 | DONE |
| M3 | Phase 3: Final Verification & Audit Gate | Feature 16 (Full build, fast-check test pass, verify-no-react guard 0 exit, Biome lint, forensic audit) | M1, M2 | IN_PROGRESS |

## Interface Contracts
(same contracts as established)

## Code Layout
- `scripts/verify-no-react.ts` (Done)
- `ui/package.json` (Done)
- `docs/package.json` (Done)
- `ui/vite.config.ts` (Done)
- `ui/custom-elements-manifest.config.mjs` (Done)
- `ui/src/test-setup.ts` (Done)
- `ui/src/styles/style.css` (M2)
- `ui/src/styles/semantic-tones.ts` (M2)
- `ui/src/styles/reset.styles.ts` (M2)
- `ui/src/utils/define-element.ts` (M2)
- `ui/src/utils/warn-missing-label.ts` (M2)
- `ui/src/utils/focus-trap.ts` (M2)
- `ui/src/utils/motion.ts` (M2)
- `ui/src/utils/icons.ts` (M2)
- `ui/src/tokens/Tokens.test.ts` (M2)
