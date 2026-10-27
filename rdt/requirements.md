# Requirements Document

## Introduction

`@moul-dev/ui` is currently a React component library (v2026.9.28) built on React Aria Components, StyleX, and Recharts. This feature replaces the entire implementation with Lit Web Components: native Custom Elements with Shadow DOM, CSS custom properties (`light-dark()` + `oklch()`), native browser APIs (Popover API, `<dialog>`, CSS Anchor Positioning, ElementInternals), and d3-scale/d3-shape for charts. Concurrently, the documentation site (`docs/`) is rebuilt from Waku + Fumadocs to Astro Starlight. The library's public API surface is exposed exclusively as HTML custom elements. React is removed from both `ui/` and `docs/` — no React wrappers are shipped.

The rebuild covers 54 public components across six categories, 5 reactive controllers, a CSS design-token layer, an Astro Starlight docs site, and all monorepo developer tooling scripts.

## Glossary

- **Library**: The `@moul-dev/ui` npm package living in `ui/`.
- **Docs_Site**: The documentation website living in `docs/`, rebuilt with Astro Starlight.
- **LitElement**: A base class from `lit` for authoring native Web Components with reactive properties and Shadow DOM.
- **Custom_Element**: A browser-native HTML element registered via `customElements.define()`.
- **Shadow_DOM**: An encapsulated DOM subtree attached to a Custom_Element that scopes styles and markup.
- **CSS_Token_Layer**: The `style.css` file exported from `@moul-dev/ui/style.css`, containing `:root` CSS custom properties using `light-dark()` and `oklch()`.
- **CEM**: Custom Elements Manifest — a `custom-elements.json` file produced by `@custom-elements-manifest/analyzer` that describes the element API (schema v2).
- **Reactive_Controller**: A Lit Reactive Controller class that manages a cross-cutting concern (press, layout, overlay, spring animation, form internals) and is composed into LitElements.
- **PressController**: A Reactive_Controller providing accessible press/hover/focus event state.
- **LayoutIndicatorController**: A Reactive_Controller using ResizeObserver to expose responsive breakpoint state within a component.
- **OverlayPresenceController**: A Reactive_Controller managing open/close state and entrance/exit animations for overlay elements.
- **NumberSpringController**: A Reactive_Controller using `motion`'s spring engine to animate numeric values reactively.
- **FormInternalsController**: A Reactive_Controller using ElementInternals to attach form-associated behavior to Custom_Elements.
- **Semantic_Tone**: One of five color intents — `primary`, `accent`, `success`, `warning`, `error`.
- **Visual_Variant**: One of five visual styles — `solid`, `flat`, `shadow`, `bordered`, `glass`.
- **Monorepo_Root**: The workspace root at `/` containing both `ui/` and `docs/` packages, managed with Bun workspaces.
- **Vite_Build**: The `ui/` library build using Vite in library mode, producing `dist/moul-ui.js`, `dist/assets/style.css`, and `dist/src/index.d.ts`.
- **CalVer**: Calendar versioning scheme `YYYY.M.D` used for package version bumping.
- **Biome**: The formatter and linter used across the monorepo.
- **LLM_Index**: The machine-readable context files (`llms.txt`, `llms-full.txt`, `AGENTS.md`) served at the docs root.

---

## Requirements

### Requirement 1: Remove React and StyleX from the Entire Monorepo

**User Story:** As a monorepo maintainer, I want to remove React and all React-ecosystem dependencies from both `ui/` and `docs/`, so that the entire project has zero React dependencies and the library is a pure Web Components implementation.

#### Acceptance Criteria

1. THE `ui/package.json` SHALL NOT list `react`, `react-dom`, `react-aria`, `react-aria-components`, `react-stately`, `@stylexjs/stylex`, `@stylexjs/unplugin`, `@vitejs/plugin-react`, `recharts`, `input-otp`, `waku`, `@lit/react`, or any package whose name begins with `react-` as dependencies, devDependencies, or peerDependencies.
2. THE `docs/package.json` SHALL NOT list `react`, `react-dom`, `react-aria-components`, `waku`, `fumadocs-core`, `fumadocs-mdx`, `fumadocs-ui`, `react-server-dom-webpack`, `lucide-react`, `@tanstack/react-pacer`, `@tanstack/react-query`, `@tanstack/react-store`, `@tanstack/react-table`, `@tanstack/react-virtual`, `@types/react`, `@types/react-dom`, `@stylexjs/stylex`, or any package whose name begins with `react-` as dependencies or devDependencies.
3. THE Library (`ui/`) SHALL list `lit` and `@lit/context` as entries under the `dependencies` field in `ui/package.json`.
4. THE Library (`ui/`) SHALL list `@lit-labs/virtualizer`, `@custom-elements-manifest/analyzer`, `d3-scale`, and `d3-shape` as entries under the `dependencies` or `devDependencies` field in `ui/package.json`.
5. THE Vite_Build SHALL complete without resolving any import whose specifier begins with `react`, `react-dom`, `react-aria-components`, `react-aria`, `@stylexjs/stylex`, or `@lit/react`.
6. WHEN a consumer installs `@moul-dev/ui` with no version of `react` present in their dependency tree, THE Library SHALL register all exported Custom_Elements via `customElements.define` and expose their APIs without throwing a runtime error.
7. IF `ui/package.json` or `docs/package.json` retains any of the removed package names after the migration, THEN THE build process for that package SHALL exit with a non-zero status code and emit an error message listing which disallowed dependency is present.

---

### Requirement 2: Lit Custom Element Architecture

**User Story:** As a component author, I want every UI component implemented as a LitElement with Shadow DOM, so that styles are encapsulated and components work in any HTML context.

#### Acceptance Criteria

1. THE Library SHALL implement each of the 54 public components as a LitElement registered as a Custom_Element with a `moul-` prefix, where the suffix contains only lowercase alphanumeric characters and hyphens (e.g., `moul-button`, `moul-card`, `moul-table`).
2. THE Library SHALL expose component APIs via reflected HTML attributes and LitElement reactive properties, where every public property has an explicit TypeScript type and a defined default value, with attribute reflection limited to string, number, and boolean value types.
3. WHEN a LitElement property changes, THE Library SHALL update only the affected Shadow_DOM subtree, leaving sibling and ancestor elements untouched.
4. THE Library SHALL attach Shadow DOM with `mode: 'open'` to all LitElements, such that internal styles do not leak to the outer document and external styles do not leak into the Shadow_DOM.
5. IF a component requires slot-based composition, THEN THE Library SHALL use named `<slot>` elements within Shadow_DOM, where each slot `name` attribute is unique within that component, and provide an unnamed default slot when unstructured content is accepted.
6. THE Library SHALL export each Custom_Element's class and TypeScript types from `ui/src/index.ts` as the single public entry point, without requiring consumers to import from internal file paths.
7. THE Library SHALL produce a `custom-elements.json` CEM (schema v2) file at the root of the build output during the Vite_Build, generated by `@custom-elements-manifest/analyzer`, containing tag names, properties, attributes, events, slots, and CSS parts for all 54 components.
8. WHEN a component is used without a required accessible label (e.g., an icon-only button without `aria-label`), THE Library SHALL emit a `console.warn` message containing the missing label description and the component's tag name, in environments where `NODE_ENV !== 'production'`.
9. WHEN `customElements.define()` is called for a tag name already present in the browser's Custom Elements registry, THE Library SHALL NOT silently override the existing registration, and SHALL emit a `console.warn` message containing the conflicting tag name.

---

### Requirement 3: CSS Design Token Layer

**User Story:** As a design engineer, I want a `style.css` file containing all design tokens as `:root` CSS custom properties using `light-dark()` and `oklch()`, so that theming works natively without a JavaScript runtime.

#### Acceptance Criteria

1. THE CSS_Token_Layer SHALL define all color tokens using `light-dark(oklch(...), oklch(...))` values at `:root`.
2. THE CSS_Token_Layer SHALL expose brand customization hooks with the following defaults: `--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, and `--brand-radius-factor: 1`.
3. THE CSS_Token_Layer SHALL define the full neutral scale (50–900), primary scale (50–900), error scale (300–700), warning scale (300–700), and success scale (300–700) as CSS custom properties, preserving the oklch lightness/chroma/hue values from the existing `tokens.stylex.ts` source file.
4. THE CSS_Token_Layer SHALL define semantic aliases: `--color-bg`, `--color-bg-subtle`, `--color-bg-elevated`, `--color-fg`, `--color-fg-subtle`, `--color-fg-on-primary`, `--color-border`, `--color-border-subtle`, `--color-border-focus`, `--color-bg-glass`, `--color-border-glass`, `--color-shadow`, and `--color-overlay`.
5. THE CSS_Token_Layer SHALL define typography tokens: font-size scale with steps `xs`, `sm`, `md`, `lg`, `xl`, `xxl`, `3xl`, and `4xl`; line-height scale with the same eight steps; font-weight values named `normal` (400), `medium` (500), `semibold` (600), and `bold` (700); and `--font-family-base`.
6. THE CSS_Token_Layer SHALL define spacing tokens `--spacing-1` through `--spacing-8` at 4 px base increments, each multiplied by `--brand-density-factor`.
7. THE CSS_Token_Layer SHALL define border-radius tokens `--radius-none`, `--radius-sm`, `--radius-md`, `--radius-lg`, and `--radius-full`, each scaled by `--brand-radius-factor`.
8. THE CSS_Token_Layer SHALL define shadow tokens `--shadow-sm`, `--shadow-md`, and `--shadow-lg`, each referencing `--color-shadow` (not the StyleX camelCase `--colorShadow` name).
9. THE CSS_Token_Layer SHALL define z-index tokens: `--z-base`, `--z-dropdown: 1000`, `--z-modal: 1300`, `--z-tooltip: 1500`, and `--z-toast: 1700`.
10. THE CSS_Token_Layer SHALL define 8 chart color tokens `--color-chart-1` through `--color-chart-8` using `light-dark()` oklch values.
11. THE CSS_Token_Layer SHALL define alert/status color tokens for the `info`, `accent`, `success`, `warning`, and `error` variants: `--color-alert-bg-{variant}`, `--color-alert-border-{variant}`, `--color-alert-hover-{variant}`, and `--color-alert-active-{variant}`, preserving oklch values from the existing `tokens.stylex.ts` source.
12. THE Vite_Build SHALL emit the token stylesheet as `dist/assets/style.css`, and the `./style.css` package export SHALL resolve to this file.
13. WHEN a consumer imports `@moul-dev/ui/style.css`, THE CSS_Token_Layer SHALL apply all `:root` tokens to the document without any JavaScript execution.

---

### Requirement 4: Semantic Tone and Visual Variant System

**User Story:** As a component consumer, I want to combine a semantic tone with a visual variant on any surface component, so that I can express intent (error, success, warning) with different visual treatments (solid, glass, bordered) using a consistent API.

#### Acceptance Criteria

1. THE Library SHALL implement a `semanticToneStyles` utility that generates style rules for all 25 combinations of 5 Semantic_Tones x 5 Visual_Variants, where Semantic_Tones are `primary`, `accent`, `success`, `warning`, and `error`, and Visual_Variants are `solid`, `flat`, `shadow`, `bordered`, and `glass`.
2. WHEN a component renders with a `tone` property value of `primary`, `accent`, `success`, `warning`, or `error`, THE Library SHALL apply the corresponding tone-specific CSS custom property overrides defined in `semanticToneStyles`.
3. WHEN a component renders with a `variant` property value of `solid`, `flat`, `shadow`, `bordered`, or `glass`, THE Library SHALL apply the corresponding variant-specific CSS rules defined in `semanticToneStyles`.
4. WHEN `variant="glass"` is applied, THE Library SHALL render a backdrop-filter blur effect using the `--color-bg-glass` and `--color-border-glass` design tokens, with no fallback to a non-blur background when the browser supports `backdrop-filter`.
5. IF the browser does not support `backdrop-filter`, THEN THE Library SHALL render the `glass` variant using `--color-bg-glass` as a solid background color with no blur effect applied.
6. WHEN `variant="shadow"` is applied, THE Library SHALL render an elevated box-shadow using the `--shadow-md` design token with no additional inline shadow overrides applied by the consumer.
7. THE `semanticToneStyles` utility SHALL be importable as an internal module from any component file within `ui/src/` without requiring installation of additional packages.
8. IF a component is rendered with a `tone` or `variant` value not in the defined sets, THEN THE Library SHALL ignore the unrecognized value and render the component using its default tone and variant styles.

---

### Requirement 5: Five Reactive Controllers

**User Story:** As a component author, I want five reusable Reactive Controllers that encapsulate cross-cutting concerns, so that I compose behavior into LitElements without duplicating logic.

#### Acceptance Criteria

1. THE PressController SHALL expose `isPressed`, `isHovered`, and `isFocusVisible` boolean state properties, each initialized to `false`, updated in response to `pointerdown`, `pointerup`, `pointerenter`, `pointerleave`, `focusin`, and `focusout` events on the host element, and shall request a host update after each state change.
2. WHEN the host element has a `type` attribute of `"button"` or `"checkbox"`, or has an `aria-pressed` attribute already present on first controller connection, THE PressController SHALL synchronize `aria-pressed` on the host element to `"true"` when `isPressed` is `true` and `"false"` when `isPressed` is `false`.
3. THE LayoutIndicatorController SHALL observe the host element's dimensions via ResizeObserver and expose a `breakpoint` property that is set to `"xs"` when width is 0-479 px, `"sm"` when 480-767 px, `"md"` when 768-1023 px, `"lg"` when 1024-1279 px, and `"xl"` when 1280 px or greater, and shall request a host update on each breakpoint change.
4. THE OverlayPresenceController SHALL manage an `isOpen` boolean property defaulting to `false`; WHEN `isOpen` changes to `true` SHALL trigger an enter animation via `motion`; WHEN `isOpen` changes to `false` SHALL trigger an exit animation via `motion`.
5. THE OverlayPresenceController SHALL request a host update on each `isOpen` state change so the LitElement template reflects the current open or closed state.
6. THE NumberSpringController SHALL accept a target numeric value in the range -999999999 to 999999999, and SHALL animate `displayValue` toward the target using `motion`'s spring engine, updating `displayValue` on each animation frame and requesting a host update until the animation settles within 0.5 of the target value.
7. THE FormInternalsController SHALL attach `ElementInternals` to the host element on controller `hostConnected`, enabling the host to participate as a form-associated custom element, and the host element's class definition SHALL declare `static formAssociated = true`.
8. WHEN the host's current value or validation constraints change, THE FormInternalsController SHALL call `internals.setFormValue()` with the new value, `internals.setValidity()` with the updated validity flags and a validation message no longer than 200 characters, and `internals.reportValidity()` to surface the validity state to the form.
9. IF `attachInternals` is not available on the host element at `hostConnected`, THEN THE FormInternalsController SHALL emit a `console.warn` message indicating ElementInternals is unsupported, set `internals` to `null`, and continue without throwing, leaving the host functional as a non-form-associated element.
10. THE Library SHALL export all five controller classes — `PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, and `FormInternalsController` — from `ui/src/controllers/index.ts`.

---

### Requirement 6: Native Browser API Integration

**User Story:** As a library maintainer, I want to use native browser APIs (Popover API, dialog, CSS Anchor Positioning, ElementInternals) instead of JavaScript polyfills and portals, so that the library has fewer runtime dependencies and integrates with browser-native accessibility.

#### Acceptance Criteria

1. THE Library SHALL implement overlay positioning for Popover, Tooltip, Select dropdown, and ComboBox dropdown using the native Popover API and CSS Anchor Positioning instead of `@floating-ui`.
2. THE Library SHALL implement Modal and AlertDialog using a native `<dialog>` element with `showModal()` and `close()` methods.
3. WHEN a dialog-based component's `is-open` attribute changes to true, THE Library SHALL call `dialog.showModal()` and focus the first focusable element within the dialog within 100 ms of the call.
4. WHEN a dialog-based component closes, THE Library SHALL call `dialog.close()` and return focus to the element that triggered the open action.
5. THE Library SHALL implement Drawer using a native `<dialog>` element positioned with CSS, supporting `placement` values of `left`, `right`, `top`, and `bottom`.
6. THE Library SHALL implement form-associated components (TextField, NumberField, SearchField, TextArea, Checkbox, RadioGroup, Select, Switch, Slider, DatePicker, InputOTP) using ElementInternals via the FormInternalsController.
7. WHEN a form-associated Custom_Element's value changes, THE FormInternalsController SHALL call `internals.setFormValue()` with the new value before the next browser repaint.
8. WHEN a Popover-based overlay opens via keyboard interaction, THE Library SHALL move focus into the overlay and trap it there until the overlay closes.
9. IF the native Popover API or CSS Anchor Positioning is not supported by the host browser, THEN THE Library SHALL emit a `console.warn` message and render the overlay using a fallback fixed-position strategy without throwing.
10. IF `dialog.showModal()` is called on a `<dialog>` element that is not connected to the document, THEN THE Library SHALL catch the resulting DOMException, emit a `console.warn` message, and not attempt to focus any element.

---

### Requirement 7: Chart Rebuild with d3-scale, d3-shape, and motion

**User Story:** As a data visualization consumer, I want charts (LineChart, AreaChart, BarChart, DoughnutChart, TopList, Stat, Percentage) rebuilt without Recharts, so that the library removes the React dependency from chart rendering and gains motion-driven animations.

#### Acceptance Criteria

1. THE Library SHALL implement LineChart, AreaChart, BarChart, DoughnutChart, TopList, Stat, and PercentageBar as LitElements that render SVG using `d3-scale` for axis scaling and `d3-shape` for path generation.
2. THE Library SHALL implement PercentageCircle as a LitElement that renders an SVG arc using `d3-shape`.
3. WHEN a chart component's data property is updated, THE Library SHALL animate the SVG path transition using the `motion` library with a duration between 200 ms and 500 ms.
4. THE Library SHALL implement ChartContainer as a LitElement that provides a responsive SVG viewport, re-rendering the chart SVG whenever the LayoutIndicatorController reports a dimension change.
5. IF a chart component's data property is `null`, `undefined`, or an array with length zero, THEN THE Library SHALL render the empty state slot within the ChartContainer in place of the SVG.
6. THE Library SHALL use `--color-chart-1` through `--color-chart-8` CSS custom properties from the CSS_Token_Layer for chart series colors.
7. WHEN the pointer enters a chart data point's hit area, THE Library SHALL open the ChartTooltip LitElement via the Popover API, displaying the data point's label and value.
8. WHEN the pointer leaves a chart data point's hit area, THE Library SHALL close the ChartTooltip via the Popover API.

---

### Requirement 8: Actions and Toggle Components (4 Components)

**User Story:** As a UI consumer, I want Button, ButtonGroup, ToggleButton, and ToggleButtonGroup implemented as Web Components, so that interactive controls work accessibly in any HTML page.

#### Acceptance Criteria

1. THE Library SHALL implement `moul-button` as a LitElement that accepts `variant` (primary, secondary, tertiary, outline, ghost, danger, danger-soft), `size` (sm, md, lg), `is-icon` boolean, `is-disabled` boolean, and `is-pending` boolean attributes.
2. WHEN `is-pending` is true, `moul-button` SHALL render a spinner and set `aria-busy="true"`.
3. WHEN `is-icon` is true and no `aria-label` attribute is provided, `moul-button` SHALL emit a `console.warn` message containing the component tag name, in environments where `NODE_ENV !== 'production'`.
4. THE Library SHALL implement `moul-button-group` as a LitElement that renders a slot and applies group orientation (horizontal or vertical) and spacing to slotted `moul-button` elements.
5. THE Library SHALL implement `moul-toggle-button` as a LitElement with `is-selected` boolean attribute that sets `aria-pressed` on the underlying button element.
6. THE Library SHALL implement `moul-toggle-button-group` as a LitElement that manages `selected-key` attribute and dispatches a `selectionchange` event when a child `moul-toggle-button` is pressed.
7. WHEN `moul-toggle-button-group` receives keyboard arrow keys, THE Library SHALL move focus between child toggle buttons following the WAI-ARIA roving tabindex pattern.

---

### Requirement 9: Input and Form Components (15 Components)

**User Story:** As a form author, I want all input components (Checkbox, CheckboxGroup, ComboBox, DatePicker, Calendar, Form, InputOTP, NumberField, RadioGroup, SearchField, Select, Slider, Switch, TextArea, TextField) rebuilt as form-associated Web Components, so that they participate natively in HTML forms.

#### Acceptance Criteria

1. THE Library SHALL implement `moul-text-field`, `moul-number-field`, `moul-search-field`, and `moul-text-area` as form-associated LitElements using FormInternalsController, accepting `name`, `value`, `placeholder`, `is-disabled`, `is-required`, `is-readonly`, `label`, and `description` attributes.
2. WHEN `is-required` is true and the field value is empty on form submission, THE FormInternalsController SHALL call `internals.setValidity({ valueMissing: true }, ...)` to block submission with a native browser validation message.
3. THE Library SHALL implement `moul-checkbox` and `moul-checkbox-group` as form-associated LitElements with `name`, `value`, `is-checked`, `is-indeterminate`, `is-disabled`, and `is-required` attributes.
4. THE Library SHALL implement `moul-radio-group` as a LitElement containing slotted `moul-radio` elements, managing selection state and dispatching a `change` event with the selected value.
5. THE Library SHALL implement `moul-select` and `moul-combobox` as LitElements using the Popover API for the dropdown, with `selected-key`, `placeholder`, `is-disabled`, `is-required`, and `label` attributes.
6. THE Library SHALL implement `moul-slider` as a form-associated LitElement with `min`, `max`, `step`, `value`, `is-disabled`, and `label` attributes, rendering a native range track with a custom thumb via Shadow DOM.
7. THE Library SHALL implement `moul-switch` as a form-associated LitElement with `is-checked`, `name`, `value`, `is-disabled`, and `label` attributes.
8. THE Library SHALL implement `moul-input-otp` as a LitElement that renders N individual input slots (default 6), accepting only digits by default, and dispatches a `complete` event when all slots are filled.
9. THE Library SHALL implement `moul-date-picker` and `moul-calendar` as LitElements using the JavaScript `Intl.DateTimeFormat` API for locale-aware date display.
10. WHEN a locale attribute is set on `moul-date-picker` or `moul-calendar`, THE Library SHALL format dates using the specified `Intl.DateTimeFormat` locale.
11. THE Library SHALL implement `moul-form` as a LitElement that renders a `<form>` element in Shadow DOM and re-dispatches native `submit` and `reset` events.
12. IF a form-associated LitElement is placed outside a `<form>` element, THEN THE FormInternalsController SHALL emit a `console.warn` message indicating the element is not form-connected.

---

### Requirement 10: Overlay and Navigation Components (10 Components)

**User Story:** As a UI consumer, I want overlay and navigation components (AlertDialog, CommandPalette, Drawer, Modal, Popover, Tooltip, Breadcrumbs, Link, Pagination, Tabs) rebuilt as Web Components, so that navigation and dialog patterns work accessibly without React.

#### Acceptance Criteria

1. THE Library SHALL implement `moul-modal` as a LitElement that renders a native `<dialog>` element, with `is-open` and `size` (sm, md, lg, fullscreen) attributes.
2. WHEN `is-open` changes to true on `moul-modal`, THE Library SHALL call `dialog.showModal()` and trap keyboard focus within the dialog using a focus trap loop.
3. WHEN the Escape key is pressed while `moul-modal` is open, THE Library SHALL close the dialog and dispatch an `openchange` event with `detail.isOpen = false`.
4. THE Library SHALL implement `moul-alert-dialog` as a LitElement wrapping `<dialog>` with named slots for header, body, and footer, and `role="alertdialog"` on the inner dialog.
5. THE Library SHALL implement `moul-drawer` as a LitElement using a native `<dialog>` with `placement` attribute (left, right, top, bottom) and CSS-driven entrance animation via `motion`.
6. THE Library SHALL implement `moul-popover` as a LitElement using the native Popover API, with `trigger`, `placement`, and `offset` attributes.
7. THE Library SHALL implement `moul-tooltip` as a LitElement using the native Popover API with `placement` attribute, appearing on pointer enter and focus of the trigger element after a 300 ms delay.
8. THE Library SHALL implement `moul-command-palette` as a LitElement with a `moul-search-field` inside a `<dialog>`, rendering filtered items in a scrollable list via `@lit-labs/virtualizer`.
9. THE Library SHALL implement `moul-breadcrumbs` as a LitElement rendering a `<nav aria-label="Breadcrumb">` with slotted `moul-breadcrumb-item` children.
10. THE Library SHALL implement `moul-link` as a LitElement rendering an `<a>` element with `href`, `target`, `rel`, and `is-external` attributes.
11. WHEN `is-external` is true on `moul-link`, THE Library SHALL add `rel="noopener noreferrer"` and render an external link icon.
12. THE Library SHALL implement `moul-pagination` as a LitElement with `total-pages`, `current-page`, `page-size`, and `shape` (square, rounded, pill) attributes, dispatching a `pagechange` event with `detail.page` when a page is selected.
13. THE Library SHALL implement `moul-tabs` as a LitElement with `selected-key` attribute, managing `moul-tab` and `moul-tab-panel` slotted children, and dispatching a `selectionchange` event on tab change.
14. WHEN `moul-tabs` receives keyboard arrow keys, THE Library SHALL move focus between tab elements following the WAI-ARIA tabs keyboard interaction pattern.

---

### Requirement 11: Surface and Feedback Components (16 Components)

**User Story:** As a UI consumer, I want surface and feedback components (Alert, Avatar, Badge, Card, EmptyState, Kbd, ProgressBar, Separator, Skeleton, Spinner, Table, TagGroup, Toast, Typography) rebuilt as Web Components, so that all informational and structural UI elements work without React.

#### Acceptance Criteria

1. THE Library SHALL implement `moul-alert` as a LitElement with `tone` (Semantic_Tone), `variant` (Visual_Variant), `is-dismissible` boolean, and a `dismiss` event dispatched when the close action is triggered.
2. THE Library SHALL implement `moul-avatar` and `moul-avatar-group` as LitElements, with `src`, `name`, `size` (xs, sm, md, lg, xl), `shape` (circle, square), and `status` (online, offline, away, busy) attributes.
3. WHEN `src` fails to load on `moul-avatar`, THE Library SHALL render the initials derived from the `name` attribute as a fallback.
4. THE Library SHALL implement `moul-badge` as a LitElement with `tone`, `variant`, and `size` attributes.
5. THE Library SHALL implement `moul-card` as a LitElement with named slots `header`, `body`, and `footer`, and `variant` attribute.
6. THE Library SHALL implement `moul-empty-state` as a LitElement with named slots for icon, title, description, and actions, and `size` (sm, md, lg) and `align` (start, center) attributes.
7. THE Library SHALL implement `moul-kbd` as a LitElement rendering keyboard shortcut notation in a `<kbd>` element.
8. THE Library SHALL implement `moul-progress-bar` as a LitElement with `value` (0-100), `tone`, `variant`, `size`, and `shape` attributes, and setting `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on the host.
9. THE Library SHALL implement `moul-separator` as a LitElement rendering an `<hr>` with `orientation` (horizontal, vertical) attribute.
10. THE Library SHALL implement `moul-skeleton` as a LitElement with `shape` (line, circle, rect) and `variant` (pulse, wave) attributes for loading placeholder display.
11. THE Library SHALL implement `moul-spinner` as a LitElement with `size` (sm, md, lg) attribute rendering an SVG spinner with a CSS animation.
12. THE Library SHALL implement `moul-table` as a LitElement supporting `data` (JSON array property), named column slot configuration, `is-sortable`, `is-selectable`, and `is-loading` attributes.
13. WHEN `is-loading` is true on `moul-table`, THE Library SHALL render `moul-skeleton` rows in place of data rows.
14. THE Library SHALL implement `moul-tag-group` and `moul-tag` as LitElements with `selected-keys`, `is-removable`, and a `remove` event dispatched when a tag's remove action is triggered.
15. THE Library SHALL implement `moul-toast` and a global `toastQueue` export, with `tone`, `variant`, and `duration` attributes.
16. THE Library SHALL implement `moul-typography` as a LitElement with a `variant` attribute covering heading levels h1-h6, body, caption, code, and mono styles.

---

### Requirement 12: Composite Block Components (2 Components)

**User Story:** As a UI consumer, I want the Logs viewer and Sidebar rebuilt as Web Components, so that complex composite UI patterns work without React.

#### Acceptance Criteria

1. THE Library SHALL implement `moul-logs-viewer` as a LitElement with `logs` property (array of LogItem objects), using `@lit-labs/virtualizer` for virtualized rendering of large log lists.
2. THE Library SHALL implement `moul-logs` as a LitElement companion that accepts a raw log string, parses it via an internal parser, and passes the result to `moul-logs-viewer`.
3. THE Library SHALL preserve the existing log parsing logic (line-level parsing, attribute chip extraction, log level normalization) as pure functions importable from `@moul-dev/ui`.
4. THE Library SHALL implement `moul-sidebar` as a LitElement with `layout` (sidebar-framed, main-framed), `dense` boolean, `selected-key`, and a `selectionchange` event.
5. THE Library SHALL implement the full Sidebar compound structure: `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user`.
6. WHEN `dense` is true on `moul-sidebar`, THE Library SHALL propagate `dense` to all child sidebar compound elements via `@lit/context` rather than requiring each child to be explicitly configured.
7. WHEN a `moul-sidebar-group` is collapsed, THE Library SHALL transition the group's content height using CSS `grid-template-rows: 0fr` to `1fr` without JavaScript height calculations.
8. WHEN `moul-sidebar` is collapsed to icon-only mode, THE Library SHALL wrap each `moul-sidebar-item` in a Tooltip trigger so pointer users see label previews on hover.

---

### Requirement 13: Docs Site Rebuild with Astro Starlight

**User Story:** As a documentation reader, I want the docs site rebuilt with Astro Starlight, so that documentation loads fast, builds statically, and integrates component previews using native Web Components.

#### Acceptance Criteria

1. THE Docs_Site SHALL be built with Astro and `@astrojs/starlight`, replacing the current Waku + Fumadocs setup in `docs/`.
2. THE Docs_Site SHALL preserve the existing documentation content structure: English content serves at root paths `/docs/components/...`, `/docs/blocks/...`, and `/changelog/...` with no locale prefix; Khmer content serves at `/km/docs/components/...`, `/km/docs/blocks/...`, and `/km/changelog/...`.
3. THE Docs_Site SHALL preserve bilingual support for English (en) and Khmer (km) by configuring Astro Starlight's built-in i18n locale routing with `hideLocale: 'root'` for English.
4. THE Docs_Site SHALL provide a `<ComponentPreview>` Astro component that renders Web Component previews by importing `@moul-dev/ui/style.css` and using custom element tags (e.g., `<moul-button>`) directly in MDX, without any React integration or client-side framework adapter.
5. THE Docs_Site SHALL include a `/theme` page with a live CSS variable inspector where controls update `--brand-hue`, `--brand-chroma-multiplier`, `--brand-radius-factor`, and `--brand-density-factor` values in real time, causing a visible re-render of any component preview on the same page.
6. THE Docs_Site SHALL serve LLM_Index files `public/AGENTS.md`, `public/llms.txt`, and `public/llms-full.txt` at their respective root URL paths.
7. THE Docs_Site SHALL include a Starlight navigation group titled "Changelog" containing an index page listing all dated entries, with each entry linking to its corresponding MDX page under `/changelog/...`.
8. THE Docs_Site SHALL import `@moul-dev/ui/style.css` in the global stylesheet so CSS_Token_Layer custom properties are available to component previews.
9. WHEN the Astro build completes, THE Docs_Site SHALL produce a fully static HTML output where navigating between documentation pages does not require client-side routing.
10. THE Docs_Site SHALL apply the Kantumruy Pro font family as the first `font-family` value for all text elements rendered inside Khmer-locale content, loaded via the global stylesheet.
11. THE Docs_Site SHALL NOT depend on `@astrojs/react`, `react`, `react-dom`, or any React-ecosystem package in `docs/package.json`.

---

### Requirement 14: LLM Context Files and sync:llms Script

**User Story:** As an AI coding agent, I want the `sync:llms` script to validate and emit accurate LLM context files containing HTML custom element usage examples, so that agents have up-to-date guidance for every component.

#### Acceptance Criteria

1. THE `sync:llms` script SHALL read the CEM `custom-elements.json` and cross-reference it against `llms.txt` and `llms-full.txt` to verify all exported Custom_Elements are documented.
2. WHEN a Custom_Element is present in the CEM but absent from `llms.txt`, THE `sync:llms` script SHALL exit with a non-zero status code and print a list of undocumented elements.
3. THE `llms.txt` file SHALL include an HTML usage snippet (e.g., `<moul-button variant="primary">Click</moul-button>`) for each component.
4. THE `llms-full.txt` file SHALL include full component API documentation (all attributes, properties, events, and slots) derived from the CEM for every component.
5. THE `AGENTS.md` file SHALL document the updated import patterns: HTML custom elements from `@moul-dev/ui` and CSS tokens from `@moul-dev/ui/style.css`.

---

### Requirement 15: Monorepo Scripts and Tooling

**User Story:** As a monorepo maintainer, I want all existing developer scripts preserved and updated for the new stack, so that day-to-day development workflows remain consistent.

#### Acceptance Criteria

1. THE Monorepo_Root SHALL provide a `bun dev` script that concurrently runs the Vite sandbox (`bun run dev:ui`) and the Astro docs dev server (`bun run dev:docs`).
2. THE Monorepo_Root SHALL provide a `bun run dev:ui` script that starts the Vite development server for the `ui/` sandbox app.
3. THE Monorepo_Root SHALL provide a `bun run dev:docs` script that starts the Astro development server for the `docs/` site.
4. THE Monorepo_Root SHALL provide a `bun run gen:component <ComponentName>` script that scaffolds a new Lit component directory containing: a LitElement class file named `<ComponentName>.ts`, a styles file named `<ComponentName>.styles.ts`, a test file named `<ComponentName>.test.ts`, and an MDX documentation stub named `<ComponentName>.mdx`.
5. THE Monorepo_Root SHALL provide a `bun run sync:llms` script that runs the LLM context validation as described in Requirement 14.
6. THE Monorepo_Root SHALL provide `bun run lint` and `bun run format` scripts using Biome for linting and formatting across both `ui/` and `docs/`.
7. WHEN `bun run build:ui` is invoked, THE Monorepo_Root SHALL run the Vite library build and CEM generation sequentially, where CEM generation starts only after the Vite build exits with code 0.
8. IF any step in the `bun run build:ui` sequence exits with a non-zero code, THEN THE Monorepo_Root SHALL halt the remaining steps and exit with a non-zero code, emitting an error message indicating which step failed.
9. THE Monorepo_Root SHALL provide a `bun run build:docs` script that runs the Astro static build.
10. WHEN `bun run bump` is invoked, THE Monorepo_Root SHALL read the current version from `ui/package.json`, derive the next version using the `YYYY.M.D` CalVer format based on the current UTC date, and write the updated version back to `ui/package.json`.
11. IF the current UTC date matches the version already recorded in `ui/package.json` when `bun run bump` is invoked, THEN THE Monorepo_Root SHALL append a numeric patch suffix in the format `YYYY.M.D.N` where `N` starts at 1 and increments by 1 for each subsequent bump on the same date.
12. THE Vite_Build SHALL operate in library mode producing `dist/moul-ui.js` as the main bundle and `dist/src/index.d.ts` as the TypeScript declarations.
13. THE Library SHALL include the `"use client";` directive as the first line of `dist/moul-ui.js` via a Rollup banner to prevent RSC import conflicts.

---

### Requirement 16: Package Exports Contract

**User Story:** As a library consumer, I want the `@moul-dev/ui` package exports to expose exactly two stable entry points, so that I can confidently import only what I need without pulling in React.

#### Acceptance Criteria

1. THE Library SHALL export the Custom_Element bundle from the `.` entry point (`@moul-dev/ui`), providing `dist/moul-ui.js` as the module and `dist/src/index.d.ts` as the types.
2. THE Library SHALL export the CSS_Token_Layer from the `./style.css` entry point (`@moul-dev/ui/style.css`), resolving to `dist/assets/style.css`.
3. THE Library SHALL NOT expose a `./react` entry point in `ui/package.json`.
4. WHEN a consumer imports from `@moul-dev/ui`, every exported Custom_Element's tag name SHALL be resolvable in the browser's Custom Elements registry before any consumer code executes.
5. WHEN a consumer imports from `@moul-dev/ui` twice in the same application (e.g., via two separate bundles), every Custom_Element tag name registered by the first import SHALL remain unchanged in the Custom Elements registry after the second import (verifiable via `customElements.get()` before and after).
6. IF a consumer attempts to import from `@moul-dev/ui/react`, `@moul-dev/ui/tokens`, or `@moul-dev/ui/tokens.stylex`, THEN the module resolver SHALL resolve with a module-not-found error, as these export entries are removed.
