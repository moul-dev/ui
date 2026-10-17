# Implementation Plan & Task List: `@moul-dev/ui` Lit Web Components & Astro Starlight Rebuild

**References:**
- Requirements: [requirements.md](./requirements.md)
- Technical Specification: [design.md](./design.md)

---

## Phase 1: Workspace Purge, Package Contracts & Test Harness
_Covers: Requirement 1, Requirement 2, Requirement 15, Requirement 16_

- [x] **1.1 Create disallowed dependency guard (`scripts/verify-no-react.ts`)**
  - Inspect `dependencies`, `devDependencies`, and `peerDependencies` in `ui/package.json` and `docs/package.json`.
  - Exit with non-zero status code and list offending package names if any banned React, React Aria, StyleX, Recharts, Waku, Fumadocs, or `lucide-react` dependency is present (_Req 1.1, 1.2, 1.7_).
- [x] **1.2 Update `ui/package.json` and `docs/package.json` manifests**
  - Remove all React, StyleX, Recharts, `input-otp`, Waku, Fumadocs, and `@tanstack/react-*` packages (_Req 1.1, 1.2, 13.11_).
  - Add `lit`, `@lit/context`, `@lit-labs/virtualizer`, `d3-scale`, `d3-shape`, `motion` to `ui/package.json` `dependencies` and `@custom-elements-manifest/analyzer`, `@open-wc/testing-helpers`, `happy-dom`, `@types/d3-scale`, `@types/d3-shape` to `devDependencies` (_Req 1.3, 1.4_).
  - Configure `ui/package.json` `exports` to expose strictly `.` (`./dist/moul-ui.js` + `./dist/src/index.d.ts`) and `./style.css` (`./dist/assets/style.css`), removing `./react`, `./tokens`, and `./tokens.stylex` (_Req 16.1–16.3, 16.6_).
  - Configure `docs/package.json` with `astro`, `@astrojs/starlight`, `@moul-dev/ui` (`workspace:*`), and `@phosphor-icons/web` (_Req 13.1, 13.11_).
- [x] **1.3 Reconfigure `ui/vite.config.ts` and `ui/custom-elements-manifest.config.mjs`**
  - Configure Vite library mode outputting `dist/moul-ui.js` with `"use client";` Rollup banner and `dist/src/index.d.ts` via `vite-plugin-dts` (_Req 15.12, 15.13_).
  - Add `banReactImportsPlugin()` to fail builds if any specifier starts with `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react` (_Req 1.5_).
  - Add build step copying `ui/src/styles/style.css` to `ui/dist/assets/style.css` (_Req 3.12_).
  - Add `ui/custom-elements-manifest.config.mjs` to emit `ui/dist/custom-elements.json` (schema v2) after `vite build` (_Req 2.7, 15.7, 15.8_).
- [x] **1.4 Configure Vitest + `happy-dom` test harness (`ui/src/test-setup.ts`)**
  - Set Vitest environment to `happy-dom`.
  - Implement shims for `ElementInternals` (`attachInternals`), `<dialog>.showModal()` / `close()` (including disconnected `DOMException` behavior), Popover API (`showPopover`, `hidePopover`, `togglePopover`), and deterministic `ResizeObserver` triggers.

---

## Phase 2: CSS Design Token Layer, Semantic Tones & Core Utilities
_Covers: Requirement 2, Requirement 3, Requirement 4, Requirement 6_

- [x] **2.1 Author CSS Design Token Layer (`ui/src/styles/style.css`)**
  - Define `:root` `color-scheme: light dark` and `[data-theme="light"]` / `[data-theme="dark"]` / `.dark` selectors.
  - Define brand customization hooks (`--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, `--brand-radius-factor: 1`) (_Req 3.2_).
  - Port Neutral (`50–900`), Primary (`50–900`), Error (`300–700`), Warning (`300–700`), and Success (`300–700`) scales using `light-dark(oklch(...), oklch(...))` (_Req 3.1, 3.3_).
  - Port semantic surface/text/border/glass/overlay aliases, 20 alert status tokens, typography scale (`xs`–`4xl`), spacing (`--spacing-1`–`--spacing-8`), radius tokens, shadows (`--shadow-sm/md/lg` referencing `var(--color-shadow)`), z-index tokens, and `--color-chart-1`–`--color-chart-8` (_Req 3.4–3.11_).
- [x] **2.2 Implement `semanticToneStyles` (`ui/src/styles/semantic-tones.ts`) & Shadow DOM Reset (`ui/src/styles/reset.styles.ts`)**
  - Implement all 25 combinations of `SemanticTone` (`primary`, `accent`, `success`, `warning`, `error`) × `VisualVariant` (`solid`, `flat`, `shadow`, `bordered`, `glass`) (_Req 4.1–4.3, 4.7_).
  - Implement `@supports (backdrop-filter: blur(12px))` progressive enhancement and non-blur `--color-bg-glass` fallback for `variant="glass"`, plus `--shadow-md` for `variant="shadow"` (_Req 4.4–4.6_).
  - Implement `normalizeTone()` and `normalizeVariant()` to fall back to component defaults on unrecognized values (_Req 4.8_).
- [x] **2.3 Implement Core Web Component & `motion.dev` Utilities (`ui/src/utils/`)**
  - `define-element.ts`: Idempotent `defineElement(tagName, ctor)` that checks `customElements.get(tagName)` and logs `console.warn` instead of overriding (_Req 2.9, 16.5_).
  - `warn-missing-label.ts`: Dev-only `warnMissingLabel(host, description)` logging `console.warn` with tag name when `aria-label` / `aria-labelledby` is missing (_Req 2.8, 8.3_).
  - `focus-trap.ts`: `safeShowModal()` (catching disconnected `DOMException` with `console.warn`), `<100ms` initial focus, keyboard `Tab` focus loop, focus restoration on close, and `supportsNativePopoverAndAnchor()` fallback helper (_Req 6.3, 6.4, 6.8–6.10_).
  - `motion.ts`: Export `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `prefersReducedMotion()`, `subtleAnimate()`, and FLIP `animateActiveIndicator()` using vanilla `motion` (`animate`, `spring`, `stagger`).
  - `icons.ts`: Zero-dependency Lit `svg` templates for internal component chrome.
- [x] **2.4 Write Token, Tone & Utility Verification Tests (`ui/src/tokens/Tokens.test.ts`)**
  - Verify all `:root` CSS custom properties in `style.css` and run `fast-check` property tests across all 25 tone × variant pairs and arbitrary invalid inputs.

---

## Phase 3: Five Reactive Controllers
_Covers: Requirement 5, Requirement 6_

- [x] **3.1 Implement `PressController` (`ui/src/controllers/press.controller.ts`)**
  - Track `isPressed`, `isHovered`, `isFocusVisible` across pointer and focus events and call `host.requestUpdate()` (_Req 5.1_).
  - Synchronize `aria-pressed` on the host when `type="button"`, `type="checkbox"`, or initial `aria-pressed` is present (_Req 5.2_).
  - Integrate optional `motion.dev` tactile press scaling (`scale: 0.97` with `SPRING_SNAPPY`) and hover elevation lift (`y: -2`).
- [x] **3.2 Implement `LayoutIndicatorController` (`ui/src/controllers/layout-indicator.controller.ts`)**
  - Observe host dimensions via `ResizeObserver`, compute `breakpoint` (`xs`: `0–479`, `sm`: `480–767`, `md`: `768–1023`, `lg`: `1024–1279`, `xl`: `>=1280`), and call `host.requestUpdate()` on change (_Req 5.3_).
- [x] **3.3 Implement `OverlayPresenceController` (`ui/src/controllers/overlay-presence.controller.ts`)**
  - Manage `isOpen` (default `false`) and `isMounted`, trigger preset-specific enter/exit animations via `motion`, and request host updates before closing `<dialog>` / `[popover]` (_Req 5.4, 5.5_).
- [x] **3.4 Implement `NumberSpringController` (`ui/src/controllers/number-spring.controller.ts`)**
  - Clamp target values to `[-999_999_999, 999_999_999]` and animate `displayValue` via `motion`'s spring engine on each frame until settling within `0.5` of target (_Req 5.6_).
- [x] **3.5 Implement `FormInternalsController` (`ui/src/controllers/form-internals.controller.ts`)**
  - Attach `ElementInternals` on `hostConnected()` (or warn and set `internals = null` when unsupported) (_Req 5.7, 5.9_).
  - Synchronously call `setFormValue()` before repaint, `setValidity()` with message truncated to `<= 200` chars, and `reportValidity()` (_Req 5.8, 6.7_).
  - Emit `console.warn` when a form-associated element with `name` (or explicit form requirement) is connected outside a `<form>` (_Req 9.12_).
- [x] **3.6 Export Controllers (`ui/src/controllers/index.ts`) & Write Controller Tests (`ui/src/controllers/Controllers.test.ts`)**
  - Export all 5 controllers from `ui/src/controllers/index.ts` (_Req 5.10_) and verify behavior with unit and `fast-check` property tests.

---

## Phase 4: Category 2 — Actions & Toggle Components (4 Components)
_Covers: Requirement 8_

- [x] **4.1 Implement `moul-button` (`ui/src/components/Button/`)**
  - Support `variant` (`primary | secondary | tertiary | outline | ghost | danger | danger-soft`), `size` (`sm | md | lg`), `is-icon`, `is-disabled`, and `is-pending` (`aria-busy="true"` + inline spinner) (_Req 8.1, 8.2_).
  - Call `warnMissingLabel` when `is-icon` is true without `aria-label` (_Req 8.3_).
  - Apply `PressController` with `scaleOnPress: 0.97` (`SPRING_SNAPPY`) and pending spinner pop-in animation.
- [x] **4.2 Implement `moul-button-group` (`ui/src/components/ButtonGroup/`)**
  - Render default slot and apply `orientation` (`horizontal | vertical`) and `spacing` to slotted `moul-button` elements (_Req 8.4_).
- [x] **4.3 Implement `moul-toggle-button` (`ui/src/components/ToggleButton/`)**
  - Support `is-selected` boolean attribute setting `aria-pressed` on the button and tactile press animation (_Req 8.5_).
- [x] **4.4 Implement `moul-toggle-button-group` (`ui/src/components/ToggleButtonGroup/`)**
  - Manage `selected-key`, dispatch `selectionchange` on child toggle press, implement WAI-ARIA roving `tabindex` on arrow keys, and animate the active selection pill with `animateActiveIndicator` (_Req 8.6, 8.7_).
- [x] **4.5 Write Action & Toggle Component Tests (`ui/src/components/Actions.test.ts`)**

---

## Phase 5: Category 5 — Surface & Feedback Components (16 Components)
_Covers: Requirement 11_

- [x] **5.1 Implement `moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, and `moul-skeleton`**
  - `moul-typography`: `variant` (`h1`–`h6`, `body`, `caption`, `code`, `mono`) (_Req 11.16_).
  - `moul-kbd`: `<kbd>` shortcut display (_Req 11.7_).
  - `moul-separator`: `<hr>` with `orientation` (`horizontal | vertical`) (_Req 11.9_).
  - `moul-spinner`: SVG spinner with `size` (`sm | md | lg`) and CSS animation (_Req 11.11_).
  - `moul-skeleton`: `shape` (`line | circle | rect`) and `variant` (`pulse | wave`) (_Req 11.10_).
- [x] **5.2 Implement `moul-badge`, `moul-card`, and `moul-empty-state`**
  - `moul-badge`: `tone`, `variant`, `size`, and mount scale-in (_Req 11.4_).
  - `moul-card`: `header`, `body`, and `footer` slots, `variant`, `tone`, and interactive hover lift / press scale (_Req 11.5_).
  - `moul-empty-state`: `icon`, `title`, `description`, `actions` slots, `size`, `align`, and `stagger(0.05)` entrance animation (_Req 11.6_).
- [x] **5.3 Implement `moul-alert` and `moul-progress-bar`**
  - `moul-alert`: `tone`, `variant`, `is-dismissible`, entrance fade, and collapse exit animation before dispatching `dismiss` (_Req 11.1_).
  - `moul-progress-bar`: `value` (`0–100`), `tone`, `variant`, `size`, `shape`, host `aria-valuenow/min/max`, and `motion` spring fill animation (_Req 11.8_).
- [x] **5.4 Implement `moul-avatar` and `moul-avatar-group`**
  - `moul-avatar`: `src`, `name` (initials fallback when `src` fails or is empty), `size` (`xs`–`xl`), `shape` (`circle | square`), `status` (`online | offline | away | busy`), and image load crossfade (_Req 11.2, 11.3_).
  - `moul-avatar-group`: Overlapping slotted avatars with `max` overflow counter and hover lift (_Req 11.2_).
- [x] **5.5 Implement `moul-tag` and `moul-tag-group`**
  - Support `selected-keys`, `is-removable`, tactile press, and `motion` scale-out before dispatching `remove` (_Req 11.14_).
- [x] **5.6 Implement `moul-table`**
  - Support `data` array/JSON property, named `columns` slot configuration, `is-sortable` (with rotating sort icon), `is-selectable`, and `is-loading` (rendering `moul-skeleton` rows in place of data rows) (_Req 11.12, 11.13_).
- [x] **5.7 Implement `moul-toast` and global `toastQueue`**
  - Support `tone`, `variant`, `duration`, `popover="manual"` top-layer promotion, `OverlayPresenceController` spring slide-in/out, and `toastQueue` singleton (_Req 11.15_).
- [x] **5.8 Write Surface & Feedback Component Tests (`ui/src/components/Surfaces.test.ts`)**

---

## Phase 6: Category 4 — Overlay & Navigation Components (10 Components)
_Covers: Requirement 6, Requirement 10_

- [x] **6.1 Implement `moul-link` and `moul-breadcrumbs` (+ `moul-breadcrumb-item`)**
  - `moul-link`: `href`, `target`, `rel`, `is-external` (adding `rel="noopener noreferrer"` + external link icon with hover diagonal nudge) (_Req 10.10, 10.11_).
  - `moul-breadcrumbs` & `moul-breadcrumb-item`: `<nav aria-label="Breadcrumb">` with slotted items (_Req 10.9_).
- [x] **6.2 Implement `moul-pagination`**
  - Support `total-pages`, `current-page`, `page-size`, `shape` (`square | rounded | pill`), `pagechange` event (`detail.page`), and `generatePagination()` helper (_Req 10.12_).
- [x] **6.3 Implement `moul-tabs`, `moul-tab`, and `moul-tab-panel`**
  - Manage `selected-key`, slotted tabs/panels, `selectionchange` event, WAI-ARIA arrow key roving focus, `animateActiveIndicator` sliding tab indicator, and panel crossfade (_Req 10.13, 10.14_).
- [x] **6.4 Implement `moul-popover` and `moul-tooltip`**
  - `moul-popover`: Native Popover API + CSS Anchor Positioning (`trigger`, `placement`, `offset`), keyboard focus trap, fixed fallback, and `OverlayPresenceController` micro-slide (_Req 6.1, 6.8, 6.9, 10.6_).
  - `moul-tooltip`: Native Popover API + CSS Anchor Positioning with `placement` and `300ms` pointerenter/focus delay (_Req 6.1, 10.7_).
- [x] **6.5 Implement `moul-modal` and `moul-alert-dialog`**
  - `moul-modal`: Native `<dialog>` with `is-open`, `size` (`sm | md | lg | fullscreen`), `safeShowModal()`, `<100ms` focus trap, `Escape` closing + `openchange` (`detail.isOpen = false`), focus restoration, and spring entrance/exit (_Req 6.2–6.4, 6.10, 10.1–10.3_).
  - `moul-alert-dialog`: Native `<dialog role="alertdialog">` with `header`, `body`, `footer` named slots (_Req 6.2, 10.4_).
- [x] **6.6 Implement `moul-drawer`**
  - Native `<dialog>` with `placement` (`left | right | top | bottom`), `IOS_SHEET_CURVE` `motion` entrance/exit animation, and bottom-sheet drag-to-dismiss (_Req 6.5, 10.5_).
- [x] **6.7 Implement `moul-command-palette`**
  - Native `<dialog>` containing `moul-search-field` and virtualized results list via `@lit-labs/virtualizer` (_Req 10.8_).
- [x] **6.8 Write Overlay & Navigation Component Tests (`ui/src/components/Overlays.test.ts` & `Navigation.test.ts`)**

---

## Phase 7: Category 3 — Input & Form Components (15 Components)
_Covers: Requirement 6, Requirement 9_

- [x] **7.1 Implement `moul-form`**
  - Render `<form>` in Shadow DOM, validate associated controls, and re-dispatch `submit` and `reset` events (_Req 9.11_).
- [x] **7.2 Implement `moul-text-field`, `moul-number-field`, `moul-search-field`, and `moul-text-area`**
  - Attach `FormInternalsController`, support `name`, `value`, `placeholder`, `is-disabled`, `is-required`, `is-readonly`, `label`, `description`, validate `valueMissing` on required empty submission, and animate error reveals / search clear button (_Req 6.6, 6.7, 9.1, 9.2_).
- [x] **7.3 Implement `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group` (+ `moul-radio`), and `moul-switch`**
  - `moul-checkbox` & `moul-checkbox-group`: `name`, `value`, `is-checked`, `is-indeterminate`, `is-disabled`, `is-required`, and checkmark SVG path draw animation (_Req 9.3_).
  - `moul-radio-group` & `moul-radio`: Slotted radios, selection management, `change` event, and inner dot spring pop (_Req 9.4_).
  - `moul-switch`: `is-checked`, `name`, `value`, `is-disabled`, `label`, and spring thumb translation + press stretch (_Req 9.7_).
- [x] **7.4 Implement `moul-slider` and `moul-input-otp`**
  - `moul-slider`: `min`, `max`, `step`, `value`, `is-disabled`, `label`, Shadow DOM range track + spring-scaled custom thumb (_Req 9.6_).
  - `moul-input-otp`: `length` (default `6`) digit input slots, `complete` event when all slots filled, slot entry pulse, and invalid shake animation (_Req 9.8_).
- [x] **7.5 Implement `moul-select` (+ `moul-select-item`) and `moul-combobox` (+ `moul-combobox-item`)**
  - Popover API + CSS Anchor Positioning dropdowns, `selected-key`, `placeholder`, `is-disabled`, `is-required`, `label`, keyboard navigation, and `OverlayPresenceController` spring motion + chevron rotation (_Req 6.1, 6.6, 9.5_).
- [x] **7.6 Implement `moul-calendar` and `moul-date-picker`**
  - Locale-aware date formatting via `Intl.DateTimeFormat(this.locale)`, Popover dropdown calendar for `moul-date-picker`, and month navigation slide/crossfade (_Req 9.9, 9.10_).
- [x] **7.7 Write Input & Form Component Tests (`ui/src/components/Forms.test.ts`)**

---

## Phase 8: Category 1 — Charts & Data Visualization (7 Components + 2 Companions)
_Covers: Requirement 7_

- [x] **8.1 Implement `moul-chart-container` and `moul-chart-tooltip`**
  - `moul-chart-container`: Responsive SVG viewport re-rendering on `LayoutIndicatorController` resize and rendering `<slot name="empty">` when data is empty (_Req 7.4, 7.5_).
  - `moul-chart-tooltip`: Popover API tooltip opening on data point `pointerenter` and closing on `pointerleave` with spring coordinate tracking (_Req 7.7, 7.8_).
- [x] **8.2 Implement `moul-line-chart` and `moul-area-chart`**
  - Render SVG paths using `d3-scale` and `d3-shape` (`line`, `area`), `--color-chart-1`–`--color-chart-8`, and `350ms` `motion` path transitions (_Req 7.1, 7.3, 7.6_).
- [x] **8.3 Implement `moul-bar-chart` and `moul-doughnut-chart`**
  - Render SVG bars and arcs using `d3-scale` and `d3-shape` (`pie`, `arc`) with `350ms` staggered `motion` transitions (_Req 7.1, 7.3, 7.6_).
- [x] **8.4 Implement `moul-top-list`, `moul-stat`, `moul-percentage-bar`, and `moul-percentage-circle`**
  - `moul-top-list`: Scaled horizontal bars with staggered `motion` fill (_Req 7.1, 7.3_).
  - `moul-stat`: Spring-animated metric card using `NumberSpringController` (_Req 7.1_).
  - `moul-percentage-bar` & `moul-percentage-circle`: SVG bar and `d3-shape` arc with `motion` spring transitions (_Req 7.1, 7.2, 7.3_).
- [x] **8.5 Write Chart Component Tests (`ui/src/components/Charts.test.ts`)**

---

## Phase 9: Category 6 — Composite Block Components (2 Component Families)
_Covers: Requirement 12_

- [x] **9.1 Implement `moul-logs-viewer`, `moul-logs`, and Pure Log Parser Functions (`ui/src/components/LogsViewer/`)**
  - Preserve and export `parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, and `SERVER_LOGS` (_Req 12.3_).
  - Implement `moul-logs-viewer` using `@lit-labs/virtualizer` for `logs: LogItem[]` and `animateActiveIndicator` for level filter pills (_Req 12.1_).
  - Implement `moul-logs` parsing raw log strings and forwarding to `moul-logs-viewer` (_Req 12.2_).
- [x] **9.2 Implement `moul-sidebar` Compound Suite (10 Elements, `ui/src/components/Sidebar/`)**
  - Implement `moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, and `moul-sidebar-user` (_Req 12.4, 12.5_).
  - Propagate `dense`, `collapsed`, `selectedKey`, and `layout` via `@lit/context` (_Req 12.6_).
  - Transition collapsed `moul-sidebar-group` height via CSS `grid-template-rows: 0fr` to `1fr` + chevron rotation via `motion` (_Req 12.7_).
  - Wrap `moul-sidebar-item` in `moul-tooltip` when collapsed to icon-only mode and animate active item pill via `animateActiveIndicator` (_Req 12.8_).
- [x] **9.3 Write Composite Block Tests (`ui/src/components/Blocks.test.ts`)**

---

## Phase 10: Public Entry Point, Sandbox App & Library Build Verification
_Covers: Requirement 2, Requirement 15, Requirement 16_

- [x] **10.1 Wire `ui/src/index.ts` Single Public Entry Point**
  - Export all 54 component classes, companion elements, TypeScript types, 5 reactive controllers, `toastQueue`, `generatePagination`, and log parser functions, plus `HTMLElementTagNameMap` augmentation (_Req 2.1, 2.6, 16.4_).
- [x] **10.2 Rebuild `ui/` Sandbox App in Vanilla HTML / Lit (`ui/index.html` & `ui/src/sandbox.ts`)**
  - Remove `ui/src/App.tsx`, `ui/src/main.tsx`, `ui/src/theme/ThemeProvider.tsx`, and `ui/src/tokens/tokens.stylex.ts`.
  - Create interactive Web Components kitchen-sink sandbox for `bun run dev:ui`.
- [x] **10.3 Run `bun run build:ui` and Write Export/Registration Contract Tests (`ui/src/components/Foundation.test.ts`)**
  - Verify `dist/moul-ui.js` starts with `"use client";`, `dist/assets/style.css` and `dist/src/index.d.ts` exist, `dist/custom-elements.json` contains all 54 components, and duplicate imports preserve existing custom element registrations.

---

## Phase 11: Astro Starlight Documentation Site Rebuild (`docs/`)
_Covers: Requirement 13_

- [x] **11.1 Initialize Astro Starlight Configuration (`docs/astro.config.mjs` & `docs/src/content.config.ts`)**
  - Remove Waku (`waku.config.ts`, `source.config.ts`, `docs/src/pages/` React routes, `docs/src/components/mdx.tsx`).
  - Configure Starlight with bilingual i18n (`root` for English `en` with `hideLocale: 'root'`, `km` for Khmer) preserving `/docs/components/...`, `/docs/blocks/...`, `/changelog/...` and `/km/...` equivalents (_Req 13.1–13.3_).
  - Configure Starlight "Changelog" navigation group and `/changelog` index page (_Req 13.7_).
- [x] **11.2 Author Global Stylesheet (`docs/src/styles/global.css`)**
  - Import `@moul-dev/ui/style.css` and configure `Kantumruy Pro` as the primary `font-family` for `:lang(km)` content (_Req 13.8, 13.10_).
- [x] **11.3 Implement `<ComponentPreview.astro>` and `/theme` Live Token Inspector (`docs/src/pages/theme.astro`)**
  - Build `ComponentPreview.astro` rendering native `<moul-*>` custom elements with client-side `<script>import '@moul-dev/ui'</script>` (_Req 13.4_).
  - Build `/theme` page with real-time sliders for `--brand-hue`, `--brand-chroma-multiplier`, `--brand-radius-factor`, and `--brand-density-factor` updating live `<moul-*>` component previews on the page (_Req 13.5_).
- [x] **11.4 Migrate English & Khmer MDX Documentation Content (`docs/src/content/docs/`)**
  - Update component, block, and changelog MDX files to use `<ComponentPreview>` and native `<moul-*>` HTML custom elements instead of React JSX components (_Req 13.2, 13.4, 13.9_).

---

## Phase 12: Monorepo Tooling Scripts, LLM Context Sync & Final QA
_Covers: Requirement 14, Requirement 15_

- [ ] **12.1 Update Monorepo Developer Scripts (`scripts/`)**
  - `scripts/gen-component.ts`: Scaffold `<ComponentName>.ts`, `<ComponentName>.styles.ts`, `<ComponentName>.test.ts`, and `<ComponentName>.mdx` (_Req 15.4_).
  - `scripts/bump-version.ts`: Compute UTC CalVer `YYYY.M.D` and increment `YYYY.M.D.N` patch suffix when bumping on the same UTC date (_Req 15.10, 15.11_).
  - `scripts/dev.ts`: Run `bun run dev:ui` and `bun run dev:docs` concurrently (_Req 15.1–15.3_).
- [ ] **12.2 Update `scripts/sync-llms.ts` and Regenerate LLM Context Files**
  - Parse `ui/dist/custom-elements.json` and cross-reference/generate `docs/public/llms.txt` (with `<moul-*>` HTML snippets), `docs/public/llms-full.txt` (full CEM attributes, properties, events, slots), `docs/public/AGENTS.md`, and root `AGENTS.md` (_Req 13.6, 14.1–14.5, 15.5_).
- [ ] **12.3 Full End-to-End Verification**
  - Run `bun run build:ui`, `bun run sync:llms`, `bun run test`, `bun run build:docs`, and `bun run lint` to confirm zero errors across the monorepo (_Req 15.6–15.9_).
