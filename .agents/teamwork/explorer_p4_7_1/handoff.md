# Architecture & Foundation Implementation Blueprint: Phases 4 through 7 (45 Components)

## 1. Observation

Direct investigation of the `@moul-dev/ui` codebase foundations revealed the following architectural assets, contracts, and interfaces:

### 1.1 Styles Foundation (`ui/src/styles/`)
- **`reset.styles.ts`** (`ui/src/styles/reset.styles.ts:9–81`):
  - Exports `resetStyles: CSSResultGroup` providing `*, *::before, *::after { box-sizing: border-box; }`.
  - Configures `:host` default font inheritance (`var(--font-family-base, inherit)`), size (`var(--font-size-md, 1rem)`), line height (`var(--line-height-md, 1.5rem)`), and color (`var(--color-fg, inherit)`).
  - Handles `:host([hidden]), [hidden] { display: none !important; }`.
  - Resets headings (`h1`–`h6`), paragraphs (`p`), lists (`ul`, `ol`), figures, blockquotes, definition lists.
  - Resets form controls: `button`, `input`, `optgroup`, `select`, `textarea` with `font-family: inherit; font-size: 100%; margin: 0;`.
  - Enforces accessible `:focus-visible` indicator ring: `outline: 2px solid var(--color-border-focus); outline-offset: 2px;` and removes `:focus:not(:focus-visible)` outlines.
- **`semantic-tones.ts`** (`ui/src/styles/semantic-tones.ts:8–169`):
  - Exports `SEMANTIC_TONES = ['primary', 'accent', 'success', 'warning', 'error'] as const` and `type SemanticTone`.
  - Exports `VISUAL_VARIANTS = ['solid', 'flat', 'shadow', 'bordered', 'glass'] as const` and `type VisualVariant`.
  - Exports normalizers: `normalizeTone(value, fallback = 'primary')` and `normalizeVariant(value, fallback = 'flat')`.
  - Exports `semanticToneStyles: CSSResultGroup` generating all 25 combinations of 5 tones × 5 variants:
    - Tone variables defined on `:host([tone="..."])` / `[data-tone="..."]`: `--_tone-solid-bg`, `--_tone-solid-fg`, `--_tone-soft-bg`, `--_tone-soft-fg`, `--_tone-border`.
    - Variant rules on `:host([variant="..."])` / `[data-variant="..."]`: `solid`, `flat`, `shadow` (with `var(--shadow-md)`), `bordered`, and `glass` (with solid `--color-bg-glass` base fallback and `@supports (backdrop-filter: blur(12px))` progressive enhancement).
- **`style.css`** (`ui/src/styles/style.css:1–340`):
  - Declares `:root { color-scheme: light dark; }`, `[data-theme="light"] { color-scheme: light; }`, `[data-theme="dark"], .dark { color-scheme: dark; }`.
  - Emits brand customization hooks: `--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, `--brand-radius-factor: 1`.
  - Scales: Neutral 50–900 (10 steps), Primary 50–900 (10 steps), Error 300–700 (5 steps), Warning 300–700 (5 steps), Success 300–700 (5 steps) using `light-dark(oklch(...), oklch(...))`.
  - Semantic surface/text aliases (13 tokens), 20 alert/status variants, 21 typography tokens (`xs`–`4xl`), 8 spacing steps (`--spacing-1`–`--spacing-8`), 5 border radius steps (`--radius-none`–`--radius-full`), 3 shadow steps (`--shadow-sm/md/lg`), 5 z-index steps (`--z-base`–`--z-toast`), 8 chart colors (`--color-chart-1`–`--color-chart-8`).

### 1.2 Utilities Foundation (`ui/src/utils/`)
- **`define-element.ts`** (`ui/src/utils/define-element.ts:8–23`):
  - Exports `defineElement(tagName: string, ctor: CustomElementConstructor): void`.
  - Checks `customElements.get(tagName)`. If registered, outputs `console.warn` (`[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.`) and safely returns without throwing.
- **`warn-missing-label.ts`** (`ui/src/utils/warn-missing-label.ts:8–30`):
  - Exports `warnMissingLabel(host: HTMLElement, description: string, hasVisibleLabel = false): void`.
  - Dev-only check (no-op when `process.env.NODE_ENV === 'production'`). Warns if interactive controls lack `aria-label`, `aria-labelledby`, and visible label text.
- **`focus-trap.ts`** (`ui/src/utils/focus-trap.ts:12–147`):
  - Exports `FOCUSABLE_ELEMENTS_SELECTOR`, `getFocusableElements(container)`.
  - Exports `supportsNativePopoverAndAnchor(): boolean` detecting Popover API and `CSS.supports('anchor-name', '--moul-anchor')`.
  - Exports `focusFirstElement(root: HTMLElement): HTMLElement | null` focusing within <100ms.
  - Exports `trapFocus(container: HTMLElement, event: KeyboardEvent): void` looping Tab / Shift+Tab.
  - Exports `safeShowModal(dialog: HTMLDialogElement | null, focusRoot?: HTMLElement): boolean` catching disconnected `DOMException` with `console.warn`.
  - Exports `restoreFocus(previousActiveElement: HTMLElement | null): void`.
- **`motion.ts`** (`ui/src/utils/motion.ts:1–80`):
  - Vanilla `motion` integration: imports `animate`, `stagger` from `'motion'`.
  - Exports presets: `SPRING_SNAPPY` (`stiffness: 500, damping: 35, mass: 0.8`), `SPRING_GENTLE` (`stiffness: 320, damping: 28, mass: 1`), `IOS_SHEET_CURVE` (`[0.32, 0.72, 0, 1]`), `CHART_EASE` (`[0.22, 1, 0.36, 1]`).
  - Exports `prefersReducedMotion(): boolean`, `subtleAnimate(target, keyframes, options)` (collapses duration to 0 on reduced motion), `animateActiveIndicator(indicator, previousRect, nextRect)`.
- **`icons.ts`** (`ui/src/utils/icons.ts:1–193`):
  - Zero-dependency Lit SVG templates with `aria-hidden="true"` and `focusable="false"`:
  - `close()`, `chevronDown()`, `search()`, `clear()`, `alertInfo()`, `alertSuccess()`, `alertWarning()`, `alertError()`, `spinnerRing()`, `calendarNavPrev()`, `calendarNavNext()`.

### 1.3 Reactive Controllers Foundation (`ui/src/controllers/`)
- **`PressController`** (`press.controller.ts:34–248`):
  - Manages `isPressed`, `isHovered`, `isFocusVisible`.
  - Supports `scaleOnPress` (default `0.97` with `SPRING_SNAPPY`), `hoverLift` (default `-2` with `SPRING_GENTLE`), `target: () => HTMLElement | null`, and custom `disabled: () => boolean`.
  - Automatically synchronizes host `aria-pressed` when `type="button"`, `type="checkbox"`, or initial `aria-pressed` attribute is present.
  - Automatically suppresses events and animations when disabled.
- **`LayoutIndicatorController`** (`layout-indicator.controller.ts:26–88`):
  - Observes host element via `ResizeObserver`.
  - Maps width to `breakpoint`: `'xs'` (<480px), `'sm'` (480–767px), `'md'` (768–1023px), `'lg'` (1024–1279px), `'xl'` (>=1280px).
  - Triggers `host.requestUpdate()` on breakpoint change, and on dimension changes if `observeDimensions: true`.
- **`OverlayPresenceController`** (`overlay-presence.controller.ts:34–328`):
  - Manages two-phase lifecycle: `isOpen` and `isMounted`.
  - Presets: `'modal'`, `'popover'`, `'tooltip'`, `'drawer-left'`, `'drawer-right'`, `'drawer-top'`, `'drawer-bottom'`, `'toast'`.
  - Promotes native `<dialog>` (via `safeShowModal()`) or `[popover]` (via `showPopover()`) before running entrance animations.
  - Awaits exit animations before demoting top-layer (`dialog.close()` / `popover.hidePopover()`) and setting `isMounted = false`, eliminating exit animation clipping.
  - Handles rapid toggling race conditions with monotonically incrementing `currentTransitionId`.
- **`NumberSpringController`** (`number-spring.controller.ts:24–111`):
  - Clamps numeric targets to `[-999_999_999, 999_999_999]`.
  - Animates `displayValue` toward `targetValue` with physics springs, snapping when within `threshold` (`0.5`).
  - Cleans up active animation controls on disconnect.
- **`FormInternalsController`** (`form-internals.controller.ts:13–117`):
  - Requires `static formAssociated = true` on host element.
  - Attaches `ElementInternals` on `hostConnected()`; logs `console.warn` without throwing if unsupported.
  - Detached `<form>` warning: warns if an element with a `name` attribute is not connected to a `<form>`.
  - `setValue()` synchronously updates `internals.setFormValue()` before repaint.
  - `setValidity()` clamps message to `<= 200` characters, updates validity flags, and calls `internals.reportValidity()`.
  - Exposes `form`, `validity`, `validationMessage`, `willValidate`, `labels`, `checkValidity()`, `reportValidity()`.

### 1.4 Monorepo Package & Build Constraints
- `scripts/verify-no-react.ts`: Checks `dependencies`, `devDependencies`, `peerDependencies` across manifests, banning `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/*`, `@lit/react`, `waku`, `recharts`, `input-otp`, etc.
- `ui/vite.config.ts`: Enforces `banReactImportsPlugin` rejecting any import matching `/^react/`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
- `ui/package.json`: Exposes only `.` (`dist/moul-ui.js` / `dist/src/index.d.ts`) and `./style.css` (`dist/assets/style.css`).

---

## 2. Logic Chain

From the observations, the architecture for assembling all 45 components across Phases 4 through 7 proceeds through five interrelated structural layers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Lit Custom Element Class Hierarchy                    │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Definition Layer     : defineElement('moul-*', Ctor) + TagMap       │
│ 2. Styling Layer        : [resetStyles, semanticToneStyles, css`...`]  │
│ 3. Controller Layer     : Reactive Controllers composition             │
│ 4. Shadow DOM Layer     : Open Shadow DOM + part="" + Semantic Slots   │
│ 5. Accessibility Layer  : ARIA roles, states, roving tabindex, labels  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Controller Composition Matrix for All 45 Components

Based on component categories and behavioral specifications, controllers must be mapped to components according to their interaction profiles:

| Phase | Component Tag | Reactive Controllers Composed | Integration Mechanics & Lifecycle Rationale |
| :--- | :--- | :--- | :--- |
| **Phase 4** | `moul-button` | `PressController` | Configured with `{ scaleOnPress: 0.97, disabled: () => this.isDisabled \|\| this.isPending }`. Handles pointer/keyboard tactile feedback, hover states, and focus visibility. |
| Phase 4 | `moul-button-group` | None (Layout host) | Structural flex layout container; manages gap and border-radius collapse on child `moul-button`s via CSS slot selectors. |
| Phase 4 | `moul-toggle-button` | `PressController` | Configured with `{ scaleOnPress: 0.97, disabled: () => this.isDisabled }`. Manages `aria-pressed` synchronization and tactile press scale. |
| Phase 4 | `moul-toggle-button-group` | Custom indicator coordinator | Manages roving `tabindex` across child buttons; calls `animateActiveIndicator()` on child focus/selection change. |
| **Phase 5** | `moul-typography` | None (Surface host) | Dynamic semantic tag rendering (`h1`–`h6`, `p`, `span`, `code`). |
| Phase 5 | `moul-kbd` | None (Surface host) | Semantic `<kbd>` wrapper. |
| Phase 5 | `moul-separator` | None (Surface host) | `<hr role="separator">` with horizontal/vertical orientation. |
| Phase 5 | `moul-spinner` | None (SVG host) | Continuous CSS animation with `spinnerRing()` SVG and `prefers-reduced-motion` slowdown. |
| Phase 5 | `moul-skeleton` | None (Surface host) | Shimmer/pulse keyframes for content placeholders. |
| Phase 5 | `moul-badge` | Motion entrance on connect | Scale-in entrance animation via `subtleAnimate` (`SPRING_SNAPPY`); consumes `semanticToneStyles`. |
| Phase 5 | `moul-card` | `PressController` | When `isInteractive` is true: `{ scaleOnPress: 0.985, hoverLift: -2, disabled: () => !this.isInteractive }`. |
| Phase 5 | `moul-empty-state` | Stagger entrance coordinator | Staggered entrance of slotted items via `subtleAnimate(items, { y: [8, 0], opacity: [0, 1] }, { delay: stagger(0.05) })`. |
| Phase 5 | `moul-alert` | Animated dismiss coordinator | Plays entrance slide/fade; on dismiss click, awaits exit collapse before dispatching `dismiss`. |
| Phase 5 | `moul-progress-bar` | `NumberSpringController` | Smoothly interpolates `displayValue` (clamped 0–100) and animates fill bar width. Synchronizes host `aria-valuenow`. |
| Phase 5 | `moul-avatar` | None (Image/Initials host) | Crossfades image on load; computes up to 2 uppercase initials on error or empty `src`. |
| Phase 5 | `moul-avatar-group` | Custom overflow coordinator | Inspects slotted avatars, enforces `max`, injects `+N` overflow counter, and provides hover fan-out lift. |
| Phase 5 | `moul-tag` | `PressController` | `{ scaleOnPress: 0.96, disabled: () => this.isDisabled }`. Coordinates removal animation (`scale: [1, 0.85], opacity: [1, 0]`) before firing `remove`. |
| Phase 5 | `moul-tag-group` | None (Collection host) | Manages `selectedKeys` and routes `remove` events from child tags. |
| Phase 5 | `moul-table` | `LayoutIndicatorController` | Observes host width to trigger responsive column stacking / scrolling on `'xs'` and `'sm'`. Renders skeleton rows when `isLoading = true`. |
| Phase 5 | `moul-toast` | `OverlayPresenceController` | Preset `'toast'` (`{ opacity: [0, 1], y: [14, 0], scale: [0.95, 1] }`). Promoted via `popover="manual"`. |
| Phase 5 | `moul-toast-region` | Singleton manager (`toastQueue`) | Top-layer container hosting active `moul-toast` elements. |
| **Phase 6** | `moul-link` | `PressController` | `{ disabled: () => this.isDisabled }`. Diagonal nudge (`x: 2, y: -2`) on external link icon hover. |
| Phase 6 | `moul-breadcrumbs` | None (Navigation host) | Renders `<nav aria-label="Breadcrumb"><ol><slot></slot></ol></nav>`. |
| Phase 6 | `moul-breadcrumb-item` | None (Navigation item) | Renders `<li>` with separator and `aria-current="page"` when current. |
| Phase 6 | `moul-pagination` | `PressController` | Tactile scale on page buttons (`scaleOnPress: 0.95`); active page indicator glide. |
| Phase 6 | `moul-tabs` | Custom indicator coordinator | Manages tablist role, arrow roving tabindex, active panel visibility, and calls `animateActiveIndicator()` for underline/pill. |
| Phase 6 | `moul-tab` | `PressController` | Tactile feedback on tab trigger button; synchronizes `aria-selected`. |
| Phase 6 | `moul-tab-panel` | None (Panel host) | Crossfades content when active (`opacity: [0, 1], y: [4, 0]`). |
| Phase 6 | `moul-popover` | `OverlayPresenceController` | Preset `'popover'`. Interacts with Popover API (`popover="auto"`) and CSS Anchor Positioning. |
| Phase 6 | `moul-tooltip` | `OverlayPresenceController` | Preset `'tooltip'`. Native Popover API (`popover="manual"`) with 300ms hover/focus timer. |
| Phase 6 | `moul-modal` | `OverlayPresenceController` | Preset `'modal'`. Native `<dialog>`, `safeShowModal()`, `<100ms` focus trap, focus restoration, `Escape` key close. |
| Phase 6 | `moul-alert-dialog` | `OverlayPresenceController` | Preset `'modal'`. Native `<dialog role="alertdialog">`, initial focus on cancel action. |
| Phase 6 | `moul-drawer` | `OverlayPresenceController` | Preset `'drawer-' + placement` (`IOS_SHEET_CURVE`, 280ms enter / 220ms exit). Native `<dialog>` docked to viewport edge. |
| Phase 6 | `moul-command-palette` | `OverlayPresenceController` | Preset `'modal'`. Native `<dialog>` containing `moul-search-field` and virtualized list via `@lit-labs/virtualizer`. |
| **Phase 7** | `moul-form` | Slotted controls coordinator | Validates all slotted form-associated controls, intercepts submit, and re-dispatches `submit` and `reset`. |
| Phase 7 | `moul-text-field` | `FormInternalsController` | `static formAssociated = true`. Value sync before repaint, required validation (`valueMissing`), error reveal. |
| Phase 7 | `moul-number-field` | `FormInternalsController` + `PressController` | `FormInternalsController` for form value; `PressController` (`scale: 0.94`) on stepper increment/decrement buttons. |
| Phase 7 | `moul-search-field` | `FormInternalsController` + `PressController` | `FormInternalsController` for form value; `PressController` on clear button; spring clear button pop-in. |
| Phase 7 | `moul-text-area` | `FormInternalsController` | `static formAssociated = true`. Value sync, auto-resize via `field-sizing: content`. |
| Phase 7 | `moul-checkbox` | `FormInternalsController` | Synchronizes `is-checked`, sets form value (`value` or `"on"`), draws checkmark SVG path on check. |
| Phase 7 | `moul-checkbox-group` | `FormInternalsController` | Aggregates values of checked children into FormData or array; validates group `isRequired`. |
| Phase 7 | `moul-radio-group` | `FormInternalsController` | Manages selection among slotted `moul-radio`s, roving tabindex, and form value submission. |
| Phase 7 | `moul-radio` | None (Radio item) | Renders custom radio circle; inner dot spring pop (`scale: [0, 1]`, `SPRING_SNAPPY`). |
| Phase 7 | `moul-switch` | `FormInternalsController` | Synchronizes `isChecked`, animates thumb translation (`x`, `SPRING_SNAPPY`) and tactile stretch (`scaleX: 1.08`). |
| Phase 7 | `moul-slider` | `FormInternalsController` + `NumberSpringController` | Custom range track, thumb spring scale (`1.15`), and optional `NumberSpringController` for smooth output ticker. |
| Phase 7 | `moul-input-otp` | `FormInternalsController` | Manages N digit slots (default 6), digit pulse, invalid shake animation, fires `complete`. |
| Phase 7 | `moul-select` | `FormInternalsController` + `OverlayPresenceController` | `FormInternalsController` submits `selectedKey`; `OverlayPresenceController` (`preset: 'popover'`) animates dropdown popover. |
| Phase 7 | `moul-select-item` | None (Item item) | Renders selectable list item with checkmark icon when selected. |
| Phase 7 | `moul-combobox` | `FormInternalsController` + `OverlayPresenceController` | `FormInternalsController` submits value; `OverlayPresenceController` animates dropdown with live query filtering. |
| Phase 7 | `moul-combobox-item` | None (Item item) | List item supporting highlighted text matches. |
| Phase 7 | `moul-calendar` | `FormInternalsController` | `Intl.DateTimeFormat(locale)` calendar grid with month navigation slide/crossfade. |
| Phase 7 | `moul-date-picker` | `FormInternalsController` + `OverlayPresenceController` | Text field trigger opening Popover with embedded `moul-calendar`; formats date via `Intl.DateTimeFormat`. |

### 2.2 Styling Assembly Pattern (The 3-Layer Lit Style Recipe)

Every component must adopt a consistent, modular styles declaration combining the foundational reset, optional tone matrix, and component-scoped CSS:

```ts
import { LitElement, html, css } from 'lit'
import { property } from 'lit/decorators.js'
import { resetStyles } from '../../styles/reset.styles'
import {
  semanticToneStyles,
  normalizeTone,
  normalizeVariant,
  type SemanticTone,
  type VisualVariant,
} from '../../styles/semantic-tones'

export class MoulComponent extends LitElement {
  static override styles = [
    resetStyles,
    semanticToneStyles, // Included on all 8 tone-aware component families
    css`
      :host {
        display: inline-flex;
        position: relative;
        /* Consumes CSS custom properties inherited from style.css */
        border-radius: var(--radius-md);
        font-family: var(--font-family-base, inherit);
      }

      /* Component-specific sub-part styling using ::part() hooks */
      [part="base"] {
        display: flex;
        align-items: center;
        gap: var(--spacing-2);
      }

      /* Renders with fallback when invalid tone/variant is supplied */
      :host([is-disabled]),
      [data-disabled="true"] {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
      }
    `,
  ]

  @property({ type: String, reflect: true })
  tone: SemanticTone = 'primary'

  @property({ type: String, reflect: true })
  variant: VisualVariant = 'flat'

  // Normalization hook ensuring resilience against invalid strings
  protected override render() {
    const validTone = normalizeTone(this.tone, 'primary')
    const validVariant = normalizeVariant(this.variant, 'flat')

    return html`
      <div
        part="base"
        data-tone="${validTone}"
        data-variant="${validVariant}"
      >
        <slot></slot>
      </div>
    `
  }
}
```

#### The 25 Tone × Variant Combinations
The 8 component families that support the full 25 combinations (`moul-badge`, `moul-card`, `moul-alert`, `moul-progress-bar`, `moul-tag`, `moul-toast`, `moul-alert-dialog`, `moul-stat`) automatically inherit all 25 variants because `semanticToneStyles` applies tone variables on `:host([tone="..."])` / `[data-tone="..."]` and variant rules on `:host([variant="..."])` / `[data-variant="..."]`.
- `variant="glass"` guarantees:
  1. Base solid fallback: `background-color: var(--color-bg-glass); border: 1px solid var(--color-border-glass); color: var(--_tone-soft-fg);`
  2. Progressive enhancement: `@supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))` applying blur and semi-transparency.

### 2.3 DOM Structure, Shadow Parts, and Slot Conventions

All components must strictly adhere to the open Shadow DOM layout contract:
1. **Host Element (`:host`)**:
   - Manages top-level layout (`display: inline-flex`, `display: block`, or `display: inline-block`).
   - Reflects boolean states (`[is-disabled]`, `[is-pending]`, `[is-open]`, `[is-selected]`).
2. **Inner Wrapper (`part="base"`)**:
   - The primary visual container that receives borders, backgrounds, and `data-tone`/`data-variant` attributes.
3. **Internal Part Names (`::part(...)`)**:
   - Standardized part naming across library:
     - `part="base"`: Outer structural wrapper.
     - `part="input"`: Native `<input>`, `<textarea>`, or `<select>` element.
     - `part="button"`: Interactive button element.
     - `part="label"`: Label container or slot.
     - `part="description"`: Helper text container.
     - `part="error"`: Validation message container.
     - `part="prefix"` / `part="suffix"`: Icon/affordance containers.
     - `part="dialog"`: Native `<dialog>` element.
     - `part="popover"`: Popover container.
     - `part="header"` / `part="body"` / `part="footer"`: Compound section containers.
4. **Slot Fallback Content Pattern**:
   - Slot content takes precedence over string properties, while string properties populate slot fallback:
     ```html
     <label part="label">
       <slot name="label">${this.label}</slot>
     </label>
     ```
   - For avatars:
     ```html
     <slot name="fallback">
       <span part="initials">${this.computedInitials}</span>
     </slot>
     ```

### 2.4 Idempotent Custom Element Registration Standard

To prevent registration collisions across multiple bundles, dev servers, or dynamic imports:
```ts
// Component file: ui/src/components/<Name>/<Name>.ts
import { LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'

export class MoulButton extends LitElement {
  // ...
}

// 1. Idempotent registration with warning
defineElement('moul-button', MoulButton)

// 2. TypeScript global tag map augmentation
declare global {
  interface HTMLElementTagNameMap {
    'moul-button': MoulButton
  }
}
```

### 2.5 Zero-React Compliance Architecture

To guarantee total independence from React:
1. **Zero React Imports**: Neither the component library nor its tests may import from `react`, `react-dom`, `react-aria`, `react-aria-components`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
2. **Native Event Dispatching**: Dispatches standard `CustomEvent` instances:
   ```ts
   this.dispatchEvent(
     new CustomEvent('selectionchange', {
       detail: { selectedKey: this.selectedKey },
       bubbles: true,
       composed: true, // Crosses Shadow DOM boundary
     }),
   )
   ```
3. **Native Form Association**: Employs `ElementInternals` (`static formAssociated = true`) instead of React Aria form hooks.
4. **Native Dialog & Popover**: Uses native `<dialog>` and Popover API (`[popover]`) with Anchor Positioning instead of React Portals or Floating UI React adapters.

---

## 3. Caveats

1. **Happy-DOM Shims Requirement**:
   In test environments (Vitest + happy-dom), browser APIs such as native `<dialog>` (`showModal`, `close`), Popover API (`showPopover`, `hidePopover`), and `ElementInternals` (`setFormValue`, `setValidity`) rely on the shims defined in `ui/src/test-setup.ts`. Components must not bypass or break compatibility with these standard DOM shims.
2. **CSS Anchor Positioning Browser Support**:
   While Chrome 125+ supports CSS Anchor Positioning natively, older runtimes and Firefox fallback to fixed/absolute JavaScript coordinate positioning or centered dialog positioning. The `supportsNativePopoverAndAnchor()` helper must gate advanced anchor positioning styling.
3. **Form Association in Custom Elements**:
   Custom elements inside a `<form>` require `static formAssociated = true` before `this.attachInternals()` can be called. Omission of this static flag causes an unrecoverable `NotSupportedError` in browser engines.
4. **Existing React Files in `ui/src/components/`**:
   The current working tree contains legacy React components in subdirectories of `ui/src/components/`. During implementation, these will be replaced with clean Lit custom elements, or new Lit files authored without importing any legacy React modules.

---

## 4. Conclusion

1. **Foundation Completeness**: The foundational layers (`ui/src/styles/`, `ui/src/utils/`, and `ui/src/controllers/`) are 100% complete, fully tested, and ready for immediate consumption across all 45 components in Phases 4 through 7.
2. **Controller Allocation**:
   - `PressController` powers 10 interactive components (`moul-button`, `moul-toggle-button`, `moul-card`, `moul-tag`, `moul-link`, `moul-tab`, `moul-number-field` steppers, `moul-search-field` clear button, `moul-pagination`).
   - `OverlayPresenceController` powers 10 top-layer overlay/dropdown components (`moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-popover`, `moul-tooltip`, `moul-command-palette`, `moul-toast`, `moul-select`, `moul-combobox`, `moul-date-picker`).
   - `FormInternalsController` powers all 15 form-associated components in Phase 7 (`moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area`, `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group`, `moul-switch`, `moul-slider`, `moul-input-otp`, `moul-select`, `moul-combobox`, `moul-calendar`, `moul-date-picker`, `moul-form`).
   - `NumberSpringController` powers numeric tickers in `moul-progress-bar`, `moul-slider`, and `moul-stat`.
   - `LayoutIndicatorController` provides responsive breakpoint adaptation for `moul-table` and `moul-chart-container`.
3. **Styling & Tokens**: All components inherit `:root` CSS custom properties from `style.css` across Shadow DOM boundaries, with the 8 surface/feedback families adopting `semanticToneStyles` for complete 25-combination matrix support and glass fallback resilience.
4. **Registration & Public API**: Every component registers idempotently via `defineElement`, extends `HTMLElementTagNameMap`, and exports its class and interfaces from `ui/src/index.ts`.

---

## 5. Verification Method

To independently verify the architecture and compliance:

### 5.1 Verification Commands
1. **Zero-React Manifest Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome:* Exits with code 0 confirming no banned React/StyleX/legacy packages exist.
2. **Controller & Token Test Suites**:
   ```bash
   bun --cwd ui test
   ```
   *Expected outcome:* Vitest executes with happy-dom and passes 100% of tests in `ui/src/tokens/Tokens.test.ts` and `ui/src/controllers/Controllers.test.ts`.
3. **Biome Lint & Format Check**:
   ```bash
   bun run lint
   ```
   *Expected outcome:* 0 errors across controllers, styles, and utilities.
4. **Vite Library Build & Import Guard**:
   ```bash
   bun run build:ui
   ```
   *Expected outcome:* `banReactImportsPlugin` validates all source imports, `tsc -b` compiles TypeScript definitions, and Rollup emits `dist/moul-ui.js` with `"use client";` banner.

### 5.2 Invalidation Conditions
- Any component importing from `react`, `react-dom`, `react-aria`, `@stylexjs/stylex`, `@lit/react`, or `motion/react`.
- Any component directly calling `customElements.define()` instead of `defineElement()`.
- Any form-associated element omitting `static formAssociated = true` or `FormInternalsController`.
- Any overlay element unmounting prematurely before `OverlayPresenceController` exit animation completes.
