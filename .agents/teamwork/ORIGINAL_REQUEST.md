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


## 2026-10-16T08:00:27Z

Implement Phase 3 of the `@moul-dev/ui` Lit Web Components rebuild: build and export all five reusable Reactive Controllers (`PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`) and their comprehensive test suites as specified in `rdt/requirements.md`, `rdt/design.md`, and `rdt/tasks.md`.

Working directory: /Users/phearak/github/orgs/moul-dev/ui
Integrity mode: development

References:
- Requirements: `rdt/requirements.md` (Requirement 5: Five Reactive Controllers, Requirement 6: Native Browser API Integration)
- Technical Specification: `rdt/design.md` (Section 6: Reactive Controllers Specification)
- Tasks Breakdown: `rdt/tasks.md` (Phase 3: Tasks 3.1–3.6)

## Requirements

### R1. Implement Five Reusable Lit Reactive Controllers
Author five standalone Lit `ReactiveController` classes in `ui/src/controllers/`:
1. `PressController` (`press.controller.ts`): Tracks `isPressed`, `isHovered`, and `isFocusVisible` across pointer and keyboard events; synchronizes `aria-pressed` on the host element when `type="button"`, `type="checkbox"`, or initial `aria-pressed` attribute is present; provides optional tactile press scaling (`scale: 0.97`) and hover elevation lift via vanilla `motion` respecting `prefers-reduced-motion` and host disabled state; triggers `host.requestUpdate()` on state changes.
2. `LayoutIndicatorController` (`layout-indicator.controller.ts`): Observes host dimensions via `ResizeObserver`; maps width to breakpoints (`xs`: `0–479px`, `sm`: `480–767px`, `md`: `768–1023px`, `lg`: `1024–1279px`, `xl`: `>=1280px`); triggers `host.requestUpdate()` on breakpoint or dimension changes; disconnects observer on `hostDisconnected`.
3. `OverlayPresenceController` (`overlay-presence.controller.ts`): Manages `isOpen` (default `false`) and `isMounted` boolean states across overlay presets (`modal`, `popover`, `tooltip`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`, `toast`); triggers preset-specific enter animations via vanilla `motion`; manages clean exit animations before unmounting or closing the native `<dialog>` / `[popover]` without clipping top-layer elements.
4. `NumberSpringController` (`number-spring.controller.ts`): Accepts target numeric values clamped to `[-999_999_999, 999_999_999]`; animates `displayValue` toward the target using `motion`'s spring engine; requests host updates on each frame until values settle within `0.5` of target and then snaps to target; cleans up active animations on disconnect.
5. `FormInternalsController` (`form-internals.controller.ts`): Attaches `ElementInternals` on `hostConnected` for custom elements with `static formAssociated = true`; emits a warning without throwing if `attachInternals` is unsupported; emits a warning when a form-associated element with a `name` is connected outside a `<form>`; synchronously invokes `internals.setFormValue()` before browser repaint; clamps `setValidity` messages to `<= 200` characters and calls `reportValidity()`.

### R2. Barrel Exports & Public API Contract
Export all five controllers and their associated options/state TypeScript interfaces from `ui/src/controllers/index.ts` so they can be consumed cleanly across upcoming component phases.

### R3. Comprehensive Verification & Adversarial Test Suite
Author a complete test suite in `ui/src/controllers/Controllers.test.ts` (using Vitest + `happy-dom`) verifying all controller behaviors, boundary values, event handlers, animation lifecycle, and error handling edge cases.

## Acceptance Criteria

### PressController
- [ ] Exposes `isPressed`, `isHovered`, and `isFocusVisible` booleans initialized to `false`.
- [ ] Updates state and calls `host.requestUpdate()` on pointerdown, pointerup, pointercancel, pointerenter, pointerleave, focusin, and focusout.
- [ ] Sets host `aria-pressed` to `"true"` or `"false"` when host has `type="button"`, `type="checkbox"`, or initial `aria-pressed`.
- [ ] Does not modify `aria-pressed` on hosts without button/checkbox semantics or pre-existing `aria-pressed`.
- [ ] Suppresses press/hover state and animations when host has `is-disabled` or `disabled` attribute/property.
- [ ] Respects `prefersReducedMotion()` when executing tactile press scaling or hover lift.

### LayoutIndicatorController
- [ ] Maps observed width to correct breakpoints: `xs` (0–479), `sm` (480–767), `md` (768–1023), `lg` (1024–1279), and `xl` (>=1280).
- [ ] Calls `host.requestUpdate()` whenever the computed breakpoint changes.
- [ ] Tracks `width` and `height` dimensions and updates host when dimension observation is enabled.
- [ ] Cleans up `ResizeObserver` on `hostDisconnected`.

### OverlayPresenceController
- [ ] Exposes `isOpen` defaulting to `false` and `isMounted` defaulting to `false`.
- [ ] When `setOpen(true)` is called: sets `isMounted = true`, requests host update, and executes preset-specific enter motion animation.
- [ ] Supports presets: `modal`, `popover`, `tooltip`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`, and `toast`.
- [ ] When `setOpen(false)` is called: requests host update, awaits exit animation completion, then closes dialog/popover and sets `isMounted = false`.
- [ ] Prevents rapid toggle race conditions where exit animations conflict with re-opening.

### NumberSpringController
- [ ] Clamps input values outside `[-999_999_999, 999_999_999]` to the boundary limits.
- [ ] Animate `displayValue` toward `targetValue` on each frame, requesting host update per step.
- [ ] Snaps `displayValue` to `targetValue` and halts animation once within `0.5` delta.
- [ ] Cancels active animation loop on `hostDisconnected` to prevent leaks.

### FormInternalsController
- [ ] Calls `host.attachInternals()` on `hostConnected` when available.
- [ ] Emits `console.warn` without throwing when `attachInternals` is unsupported, setting `internals = null`.
- [ ] Emits `console.warn` when host element has `name` attribute and is not connected inside a `<form>`.
- [ ] `setValue` calls `internals.setFormValue` synchronously before next repaint.
- [ ] `setValidity` truncates message to `<= 200` characters and calls `reportValidity()`.

### Exports & Code Quality
- [ ] `ui/src/controllers/index.ts` exports `PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`, and their types.
- [ ] Zero banned React dependencies or imports (`node -e "require('child_process').execSync('bun ./scripts/verify-no-react.ts all', {stdio: 'inherit'})"` passes).
- [ ] `node ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts` passes 100%.
- [ ] `node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts` and `src/utils/utils-challenge.test.ts` continue to pass without regression.
- [ ] `node_modules/.bin/biome check ui/src/controllers` passes with 0 errors.
- [ ] `rdt/tasks.md` Phase 3 items (3.1 through 3.6) are marked `[x]` upon successful completion.


## 2026-10-16T08:49:14Z

Implement Phase 4 through Phase 7 of the `@moul-dev/ui` Lit Web Components rebuild, delivering 45 accessible, standards-first custom elements across Actions, Surfaces & Feedback, Overlays & Navigation, and Inputs & Forms with comprehensive tests and zero React dependencies.

Working directory: `/Users/phearak/github/orgs/moul-dev/ui`
Integrity mode: development

## Reference Documentation
- Tasks: `rdt/tasks.md` (Phases 4 through 7)
- Requirements: `rdt/requirements.md` (Requirements 1, 2, 4, 5, 6, 8, 9, 10, 11)
- Technical Specification: `rdt/design.md` (Sections 3, 5, 6, 7, 8.2, 8.3, 8.4, 8.5)

## Requirements

### R1. Actions & Toggle Components (Phase 4 — 4 Components)
Implement `moul-button`, `moul-button-group`, `moul-toggle-button`, and `moul-toggle-button-group` in `ui/src/components/` using Lit 3, `PressController`, and `animateActiveIndicator` for roving focus and active indicator motion. Adhere strictly to Requirement 8 and write comprehensive tests in `ui/src/components/Actions.test.ts`.

### R2. Surface & Feedback Components (Phase 5 — 16 Components)
Implement all 16 surface and feedback elements (`moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, `moul-skeleton`, `moul-badge`, `moul-card`, `moul-empty-state`, `moul-alert`, `moul-progress-bar`, `moul-avatar`, `moul-avatar-group`, `moul-tag`, `moul-tag-group`, `moul-table`, `moul-toast` + singleton `toastQueue`). Apply `semanticToneStyles` across 25 tone × variant combinations, motion entrance/exit transitions, and verify in `ui/src/components/Surfaces.test.ts`.

### R3. Overlay & Navigation Components (Phase 6 — 10 Components)
Implement overlay and navigation elements (`moul-link`, `moul-breadcrumbs` + `moul-breadcrumb-item`, `moul-pagination`, `moul-tabs` + `moul-tab` + `moul-tab-panel`, `moul-popover`, `moul-tooltip`, `moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-command-palette`). Use native `<dialog>` (`safeShowModal`, focus trapping, escape dismissal), Popover API + CSS Anchor Positioning with fallbacks, and verify in `ui/src/components/Overlays.test.ts` and `ui/src/components/Navigation.test.ts`.

### R4. Input & Form Components (Phase 7 — 15 Components)
Implement form-associated controls (`moul-form`, `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area`, `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group` + `moul-radio`, `moul-switch`, `moul-slider`, `moul-input-otp`, `moul-select` + `moul-select-item`, `moul-combobox` + `moul-combobox-item`, `moul-calendar`, `moul-date-picker`). Attach `FormInternalsController`, support form validation, Popover date/dropdown pickers, and verify in `ui/src/components/Forms.test.ts`.

### R5. Architecture, Accessibility & Zero-React Constraints
All components must:
- Be registered via `defineElement` with `moul-` prefix and idempotent registration safeguards.
- Use open Shadow DOM with CSS custom property theming via `style.css` and `semanticToneStyles`.
- Trigger `warnMissingLabel` in development mode for unlabeled interactive or icon-only controls.
- Maintain zero imports or dependencies on `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, or `@lit/react`.
- Export all component classes and TypeScript interfaces from `ui/src/index.ts`.

## Verification Resources
- Test harness with ElementInternals, Dialog, and Popover shims: `ui/src/test-setup.ts`
- CSS Design Tokens: `ui/src/styles/style.css`
- Semantic tones matrix: `ui/src/styles/semantic-tones.ts`
- Reactive controllers: `ui/src/controllers/index.ts`
- Test commands: `bun --cwd ui test` / `vitest run`

## Acceptance Criteria

### Actions & Toggle Components (Phase 4)
- [ ] `moul-button` supports variants, sizes, `is-pending` (with spinner & `aria-busy`), `is-icon` with `warnMissingLabel`, and tactile press feedback.
- [ ] `moul-button-group` applies orientation and spacing to slotted buttons.
- [ ] `moul-toggle-button` updates `aria-pressed` via `is-selected`.
- [ ] `moul-toggle-button-group` manages roving `tabindex` on arrow keys and dispatches `selectionchange`.
- [ ] `ui/src/components/Actions.test.ts` passes with full coverage of actions behavior.

### Surface & Feedback Components (Phase 5)
- [ ] All 16 surface & feedback components render with open Shadow DOM, semantic slots, and tokens.
- [ ] `moul-card`, `moul-badge`, `moul-alert` support all 25 tone × variant combinations with glass backdrop-filter fallback.
- [ ] `moul-avatar` displays initials fallback on image load error; `moul-avatar-group` handles overflow badges.
- [ ] `moul-table` renders skeleton placeholders when `is-loading` is true and handles sorting/selection.
- [ ] `toastQueue` singleton correctly dispatches and dismisses top-layer toasts.
- [ ] `ui/src/components/Surfaces.test.ts` passes.

### Overlay & Navigation Components (Phase 6)
- [ ] `moul-modal` and `moul-alert-dialog` manage `<dialog>` with `<100ms` focus trap, `Escape` key close, and focus restoration.
- [ ] Calling `safeShowModal()` on a disconnected dialog catches the DOMException without unhandled errors.
- [ ] `moul-popover` and `moul-tooltip` operate via Popover API with anchor positioning and fixed fallback.
- [ ] `moul-tabs` manages tab roving focus, keyboard navigation, and panel visibility.
- [ ] `moul-pagination` calculates pages and emits `pagechange` with `detail.page`.
- [ ] `ui/src/components/Overlays.test.ts` and `ui/src/components/Navigation.test.ts` pass.

### Input & Form Components (Phase 7)
- [ ] All form controls declare `static formAssociated = true` and attach `FormInternalsController`.
- [ ] Value changes synchronously call `setFormValue()` before repaint.
- [ ] Empty required inputs fail validation with `valueMissing` and show validation messages.
- [ ] `moul-select` and `moul-combobox` provide accessible dropdown listbox interaction with keyboard traversal.
- [ ] `moul-input-otp` manages digit slots and fires `complete` when all slots are filled.
- [ ] `moul-calendar` and `moul-date-picker` format dates via `Intl.DateTimeFormat(locale)`.
- [ ] `moul-form` validates slotted controls and re-dispatches `submit` and `reset`.
- [ ] `ui/src/components/Forms.test.ts` passes.

### Monorepo & Zero-React Verification
- [ ] No component imports any module matching `/^react/`, `@stylexjs/stylex`, or `@lit/react`.
- [ ] All 45 component classes are exported from `ui/src/index.ts` and registered in `HTMLElementTagNameMap`.


## 2026-10-16T13:00:43Z

The quota limit has reset and the server has restarted. Please resume where you left off on Milestone 5 remediation and continue through Milestone 6 (Overlays & Navigation), Milestone 7 (Inputs & Forms), and Milestone 8 (Integration & Audit).
