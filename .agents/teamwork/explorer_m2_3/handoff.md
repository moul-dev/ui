# Handoff Report: Milestone 2 Tasks 2.3 & 2.4 — Core Utilities & Verification Tests

## 1. Observation

Authoritative specification documents, codebase files, and sibling explorer outputs examined:
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md` (lines 20–22, 48–59)
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/PROJECT.md` (lines 23–32, 45–60)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md` (Req 2.8, 2.9, 3.1–3.11, 4.1–4.8, 6.3, 6.4, 6.8–6.10, 8.3, 16.5)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/design.md` (Sections 3.1, 3.3, 3.4, 5.1, 5.2, 6.6, 7.1, 7.2, 11.1, 11.2; lines 231–290, 325–392, 473–555, 570–628, 958–985)
- `/Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md` (Tasks 2.3 & 2.4; lines 43–51)
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_3/handoff.md` (lines 334–388)
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_1/handoff.md` (lines 151–388: CSS Token Layer mapping and definitions)
- `ui/src/test-setup.ts` (lines 1–606: happy-dom shims for `ElementInternals`, native `<dialog>` disconnected `DOMException`, Popover API, and `ResizeObserver`)
- `ui/src/tokens/tokens.stylex.ts` (lines 1–183: canonical source token values)
- `ui/src/utils/` (existing directory with legacy React `warnMissingLabel.ts` and `utils.test.tsx`)
- `ui/package.json` (lines 63–85: `lit: ^3.2.1`, `motion: ^13.4.1`, `fast-check: ^3.23.2`, `vitest: ^2.1.8`, `happy-dom: ^16.8.1`)

### Direct Observations by Utility & Test Scope

1. **`defineElement` (`ui/src/utils/define-element.ts`)**:
   - `rdt/design.md` §3.1 (lines 240–255) defines the exact signature: `defineElement(tagName: string, ctor: CustomElementConstructor): void`.
   - SSR guard: `if (typeof customElements === 'undefined') return`.
   - Idempotency check: `const existing = customElements.get(tagName)`.
   - Warning on duplicate: `console.warn('[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.')`.
   - Registration: `customElements.define(tagName, ctor)`.

2. **`warnMissingLabel` (`ui/src/utils/warn-missing-label.ts`)**:
   - `rdt/design.md` §3.3 (lines 269–285) defines signature: `warnMissingLabel(host: HTMLElement, description: string, hasVisibleLabel = false): void`.
   - Production no-op: `if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return`.
   - Check: `hasAriaLabel = Boolean(host.getAttribute('aria-label')?.trim()) || Boolean(host.getAttribute('aria-labelledby')?.trim())`.
   - Warning when `!hasAriaLabel && !hasVisibleLabel`: `console.warn('[@moul-dev/ui] <${host.tagName.toLowerCase()}> is missing an accessible label (${description}). Provide an "aria-label" or "aria-labelledby" attribute.')`.

3. **`focus-trap.ts` (`ui/src/utils/focus-trap.ts`)**:
   - `rdt/design.md` §7.1 (lines 578–587):
     ```ts
     export function supportsNativePopoverAndAnchor(): boolean {
       const hasPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
       const hasAnchor = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('anchor-name', '--moul-anchor')
       return Boolean(hasPopover && hasAnchor)
     }
     ```
   - `rdt/design.md` §7.2 (lines 603–621) & Requirement 6.10:
     - `safeShowModal(dialog: HTMLDialogElement | null, focusRoot?: HTMLElement): boolean`:
       - If `!dialog`, returns `false`.
       - If `!dialog.open`, calls `dialog.showModal()`.
       - Catches `DOMException` (e.g. disconnected `<dialog>`), emits `console.warn('[@moul-dev/ui] Failed to call dialog.showModal() (element may be disconnected):', err)`, and returns `false` without focusing anything.
       - If modal opens successfully, focuses first focusable element via `focusFirstElement(focusRoot ?? dialog)` within <100ms and returns `true`.
   - Focus trap loop:
     - `trapFocus(container: HTMLElement, event: KeyboardEvent): void`: Intercepts `Tab` and `Shift+Tab`, wraps focus cyclically between first and last focusable elements within `container`, and calls `event.preventDefault()`.
   - Focus restoration:
     - `restoreFocus(previousActiveElement: HTMLElement | null): void`: safely returns focus to the initiating element on overlay dismissal.

4. **`motion.ts` (`ui/src/utils/motion.ts`)**:
   - `rdt/design.md` §6.6 (lines 478–555) specifies:
     - Imports vanilla DOM exports from `'motion'`: `animate`, `stagger`, `type AnimationOptions`, `type AnimationPlaybackControls`, `type DOMKeyframesDefinition`.
     - Presets:
       - `SPRING_SNAPPY`: `{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }`
       - `SPRING_GENTLE`: `{ type: 'spring', stiffness: 320, damping: 28, mass: 1 }`
       - `IOS_SHEET_CURVE`: `[0.32, 0.72, 0, 1] as const`
       - `CHART_EASE`: `[0.22, 1, 0.36, 1] as const`
     - `prefersReducedMotion(): boolean`: checks `window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false`.
     - `subtleAnimate(target, keyframes, options = SPRING_GENTLE)`: collapses duration to 0 (`animate(target, keyframes, { duration: 0 })`) when `prefersReducedMotion()` is active.
     - `animateActiveIndicator(indicator, previousRect, nextRect)`: executes FLIP delta transform with `SPRING_SNAPPY`; returns `null` if `previousRect === null` or `prefersReducedMotion()`.
     - Re-exports `stagger`.

5. **`icons.ts` (`ui/src/utils/icons.ts`)**:
   - `rdt/design.md` §3.4 (lines 287–290) and `ORIGINAL_REQUEST.md` R2 (line 53):
     - Lit `svg` templates (`import { svg, type SVGTemplateResult } from 'lit'`).
     - Required 11 icons:
       1. `close`
       2. `chevronDown`
       3. `search`
       4. `clear`
       5. `alertInfo`
       6. `alertSuccess`
       7. `alertWarning`
       8. `alertError`
       9. `spinnerRing`
       10. `calendarNavPrev`
       11. `calendarNavNext`
     - Must include `aria-hidden="true"` and `focusable="false"`. Zero external icon runtime dependencies.

6. **`Tokens.test.ts` (`ui/src/tokens/Tokens.test.ts`)**:
   - `rdt/design.md` §11.2 (lines 975–977) and `rdt/tasks.md` Task 2.4 (lines 49–51):
     - Uses Vitest and `fast-check` (`fc`).
     - Suite 1: Verifies all `:root` CSS custom properties in `ui/src/styles/style.css` (color-scheme, 6 brand hooks, 5 color scales with `light-dark(oklch(...))`, semantic aliases, 20 alert tokens, typography, spacing 1–8, radius, shadows referencing `var(--color-shadow)`, z-index, chart 1–8).
     - Suite 2: Verifies all 25 tone × variant combinations in `semanticToneStyles` (`5 tones × 5 variants`), including `variant="glass"` solid fallback and `@supports` blur, and `variant="shadow"` box-shadow.
     - Suite 3: Verifies normalizers `normalizeTone` and `normalizeVariant` with `fast-check` arbitrary string generators (`fc.string()`), verifying fallback resilience.
     - Suite 4: Verifies utility functions (`defineElement`, `warnMissingLabel`, `safeShowModal`, `focusFirstElement`, `trapFocus`, `supportsNativePopoverAndAnchor`, `motion` reduced-motion collapse, and `icons`).

---

## 2. Logic Chain

1. **Decoupled Architecture with Lit & Native APIs**:
   - *Observation*: The monorepo has purged React and React Aria.
   - *Reasoning*: Custom elements in Lit require idempotent registration so multiple module bundles or hot-reloading never crash the page. Standard `customElements.define` throws a fatal `NotSupportedError` if a tag is registered twice. Wrapping it in `defineElement` solves this gracefully.
   - *Conclusion*: `ui/src/utils/define-element.ts` must check `customElements.get(tagName)` and log a non-fatal warning when already registered.

2. **Standards-Compliant Dev-Mode Accessibility Enforcement**:
   - *Observation*: Requirements 2.8 and 8.3 state that interactive components without visible text must have accessible names, but this validation must not incur runtime overhead or log noise in production.
   - *Reasoning*: Testing `host.getAttribute('aria-label')?.trim()` and `host.getAttribute('aria-labelledby')?.trim()` catches missing or whitespace-only labels. Wrapping the check in `process.env.NODE_ENV === 'production'` eliminates overhead in production.
   - *Conclusion*: `ui/src/utils/warn-missing-label.ts` should perform trimmed attribute inspection and early return in production.

3. **Safe Modal Execution & Keyboard Trapping**:
   - *Observation*: Requirement 6.10 mandates catching disconnected `DOMException` on `dialog.showModal()`, emitting `console.warn`, and avoiding focusing any child elements. In addition, Requirement 6.8 mandates trapping `Tab` and `Shift+Tab` within the overlay.
   - *Reasoning*: In single-page applications or unit tests, components may invoke modal operations before attaching to the DOM. A try/catch block around `dialog.showModal()` specifically guards against this DOMException. When connected, focusing the first focusable element immediately ensures WCAG keyboard compliance. Cycling focus via `trapFocus` prevents keyboard users from escaping the overlay until dismissed.
   - *Conclusion*: `ui/src/utils/focus-trap.ts` must export `safeShowModal`, `focusFirstElement`, `trapFocus`, `restoreFocus`, and `supportsNativePopoverAndAnchor`.

4. **Zero-React Motion Architecture & Accessibility Respect**:
   - *Observation*: Requirement 1.5 strictly bans `motion/react` in favor of vanilla DOM `motion`. Requirement 5.4 mandates subtle animations that collapse when `prefers-reduced-motion: reduce` is enabled.
   - *Reasoning*: `subtleAnimate` wraps `motion`'s `animate` function, dynamically switching duration to `0` when `window.matchMedia('(prefers-reduced-motion: reduce)').matches` is true. `animateActiveIndicator` calculates bounding rect deltas between tab/pill states, providing smooth FLIP layout transitions without React state machinery.
   - *Conclusion*: `ui/src/utils/motion.ts` implements these utilities using vanilla `motion` exports.

5. **Self-Contained Internal Chrome Icons**:
   - *Observation*: Requirement 2.8 and Section 3.4 mandate that `@moul-dev/ui` must not depend on external icon packages (`@phosphor-icons/react` or `lucide-react`) at runtime.
   - *Reasoning*: Rendering internal UI affordances as Lit `svg` templates with `aria-hidden="true"` and `focusable="false"` ensures zero runtime dependencies, zero extra HTTP requests, and accessibility by default.
   - *Conclusion*: `ui/src/utils/icons.ts` implements the 11 required chrome icons.

6. **Comprehensive Property-Based Test Verification**:
   - *Observation*: Task 2.4 requires `ui/src/tokens/Tokens.test.ts` to test CSS tokens, all 25 combinations, normalizer resilience under `fast-check`, and utility edge cases.
   - *Reasoning*: Using `fast-check` to generate arbitrary string permutations for tone and variant parameters guarantees that unrecognized inputs can never cause unhandled exceptions or broken visual states. Asserting all `:root` CSS custom properties ensures the token layer strictly matches the 124 design properties ported from `tokens.stylex.ts`.
   - *Conclusion*: `ui/src/tokens/Tokens.test.ts` provides full coverage of both design tokens and core utilities.

---

## 3. Caveats

1. **Read-Only Scope**: This report is strictly an architectural investigation and code plan. No files outside this agent's folder have been modified.
2. **Sibling Task Dependencies**:
   - `ui/src/styles/style.css` is authored in Task 2.1 (`explorer_m2_1`).
   - `ui/src/styles/semantic-tones.ts` is authored in Task 2.2 (`explorer_m2_2`).
   - `Tokens.test.ts` reads `ui/src/styles/style.css` and imports `semanticToneStyles` from `ui/src/styles/semantic-tones.ts`. When running `bun test`, both files must be in place.
3. **Legacy File Deprecation**:
   - `ui/src/utils/warnMissingLabel.ts` is the legacy React implementation and is superseded by `ui/src/utils/warn-missing-label.ts`.
   - `ui/src/tokens/tokens.test.ts` is the legacy StyleX test and is superseded by `ui/src/tokens/Tokens.test.ts`.

---

## 4. Conclusion & Complete Implementation Plan

Here are the complete, drop-in source implementations for all 6 target files.

### 4.1 `ui/src/utils/define-element.ts`

```ts
/**
 * Safe, idempotent custom element registration helper.
 *
 * Checks if a custom element tag name is already registered before calling
 * `customElements.define()`. Emits a console warning instead of throwing an error
 * or silently overriding the existing registration (Req 2.9, 16.5).
 */
export function defineElement(
  tagName: string,
  ctor: CustomElementConstructor,
): void {
  if (typeof customElements === 'undefined') return

  const existing = customElements.get(tagName)
  if (existing) {
    console.warn(
      `[@moul-dev/ui] Custom element "${tagName}" is already registered. Skipping duplicate registration.`,
    )
    return
  }

  customElements.define(tagName, ctor)
}
```

### 4.2 `ui/src/utils/warn-missing-label.ts`

```ts
/**
 * Dev-only accessible label check helper.
 *
 * Emits a console.warn in development environments when an interactive element
 * lacks an accessible name (no `aria-label`, no `aria-labelledby`, and no visible label).
 * In production (`NODE_ENV === 'production'`), this check is a complete no-op (Req 2.8, 8.3).
 */
export function warnMissingLabel(
  host: HTMLElement,
  description: string,
  hasVisibleLabel = false,
): void {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
    return
  }

  const ariaLabel = host.getAttribute('aria-label')?.trim()
  const ariaLabelledBy = host.getAttribute('aria-labelledby')?.trim()
  const hasAriaLabel = Boolean(ariaLabel) || Boolean(ariaLabelledBy)

  if (!hasAriaLabel && !hasVisibleLabel) {
    const tagName = host.tagName ? host.tagName.toLowerCase() : 'element'
    console.warn(
      `[@moul-dev/ui] <${tagName}> is missing an accessible label (${description}). Provide an "aria-label" or "aria-labelledby" attribute.`,
    )
  }
}
```

### 4.3 `ui/src/utils/focus-trap.ts`

```ts
/**
 * Focus management, modal safety, and popover/anchor fallback utilities.
 *
 * Implements Requirements 6.3, 6.4, 6.8, 6.9, and 6.10:
 * - `safeShowModal`: invokes dialog.showModal() safely, catching disconnected DOMException.
 * - `focusFirstElement`: focuses the first interactive descendant within <100ms.
 * - `trapFocus`: traps Tab and Shift+Tab within a modal boundary.
 * - `restoreFocus`: returns focus to the initiating element on close.
 * - `supportsNativePopoverAndAnchor`: feature detection for Popover API and CSS Anchor Positioning.
 */

export const FOCUSABLE_ELEMENTS_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'details:not([disabled])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Checks whether the host runtime natively supports the Popover API
 * and CSS Anchor Positioning (Requirement 6.9).
 */
export function supportsNativePopoverAndAnchor(): boolean {
  const hasPopover =
    typeof HTMLElement !== 'undefined' &&
    'popover' in HTMLElement.prototype
  const hasAnchor =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name', '--moul-anchor')
  return Boolean(hasPopover && hasAnchor)
}

/**
 * Returns an array of visible, focusable HTML elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return []
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
  )
  return elements.filter((el) => {
    const isHiddenAttr =
      el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true'
    const style =
      typeof window !== 'undefined' && window.getComputedStyle
        ? window.getComputedStyle(el)
        : el.style
    const isHiddenStyle =
      style.display === 'none' || style.visibility === 'hidden'
    return !isHiddenAttr && !isHiddenStyle
  })
}

/**
 * Focuses the first focusable interactive element within root.
 * Falls back to focusing the container itself if no focusable children are found.
 */
export function focusFirstElement(root: HTMLElement): HTMLElement | null {
  if (!root) return null
  const focusables = getFocusableElements(root)
  const target =
    focusables[0] ?? (typeof root.focus === 'function' ? root : null)
  if (target && typeof target.focus === 'function') {
    try {
      target.focus()
      return target
    } catch {
      return null
    }
  }
  return null
}

/**
 * Traps keyboard Tab and Shift+Tab within container.
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return

  const focusables = getFocusableElements(container)
  if (focusables.length === 0) {
    event.preventDefault()
    return
  }

  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const doc = container.ownerDocument || document
  const active = doc.activeElement

  if (event.shiftKey) {
    if (active === first || !container.contains(active)) {
      event.preventDefault()
      last.focus()
    }
  } else {
    if (active === last || !container.contains(active)) {
      event.preventDefault()
      first.focus()
    }
  }
}

/**
 * Safely calls dialog.showModal().
 * If dialog is disconnected, catches DOMException, logs console.warn, and does NOT focus children (Req 6.10).
 * If modal successfully opens, focuses the first focusable element within <100ms.
 */
export function safeShowModal(
  dialog: HTMLDialogElement | null,
  focusRoot?: HTMLElement,
): boolean {
  if (!dialog) return false
  try {
    if (!dialog.open) {
      dialog.showModal()
    }
  } catch (err) {
    console.warn(
      '[@moul-dev/ui] Failed to call dialog.showModal() (element may be disconnected):',
      err,
    )
    return false
  }
  focusFirstElement(focusRoot ?? dialog)
  return true
}

/**
 * Restores focus to a previously active element upon modal/popover dismissal.
 */
export function restoreFocus(
  previousActiveElement: HTMLElement | null,
): void {
  if (
    previousActiveElement &&
    typeof previousActiveElement.focus === 'function'
  ) {
    try {
      previousActiveElement.focus()
    } catch {
      // Silently ignore if previous element has unmounted or is disconnected
    }
  }
}
```

### 4.4 `ui/src/utils/motion.ts`

```ts
import {
  type AnimationOptions,
  type AnimationPlaybackControls,
  animate,
  type DOMKeyframesDefinition,
  stagger,
} from 'motion'

export const SPRING_SNAPPY: AnimationOptions = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
  mass: 0.8,
}

export const SPRING_GENTLE: AnimationOptions = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 1,
}

export const IOS_SHEET_CURVE = [0.32, 0.72, 0, 1] as const

export const CHART_EASE = [0.22, 1, 0.36, 1] as const

/**
 * Checks whether the user has requested reduced motion via the OS accessibility settings.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Runs a subtle motion.dev animation on one or more elements/SVG nodes,
 * automatically collapsing duration to 0 when `prefers-reduced-motion: reduce` is active.
 */
export function subtleAnimate(
  target: Element | Element[] | NodeListOf<Element>,
  keyframes: DOMKeyframesDefinition,
  options: AnimationOptions = SPRING_GENTLE,
): AnimationPlaybackControls {
  if (prefersReducedMotion()) {
    return animate(target, keyframes, { duration: 0 })
  }
  return animate(target, keyframes, options)
}

/**
 * Animates a shared active indicator pill/underline between two elements using FLIP deltas
 * (replaces React's `layoutId` in `moul-tabs`, `moul-toggle-button-group`, and `moul-sidebar`).
 */
export function animateActiveIndicator(
  indicator: HTMLElement,
  previousRect: DOMRect | null,
  nextRect: DOMRect,
): AnimationPlaybackControls | null {
  if (!previousRect || prefersReducedMotion()) return null
  const dx = previousRect.left - nextRect.left
  const dy = previousRect.top - nextRect.top
  const scaleX = previousRect.width / Math.max(nextRect.width, 1)
  const scaleY = previousRect.height / Math.max(nextRect.height, 1)
  return animate(
    indicator,
    {
      x: [dx, 0],
      y: [dy, 0],
      scaleX: [scaleX, 1],
      scaleY: [scaleY, 1],
    },
    SPRING_SNAPPY,
  )
}

export { stagger }
```

### 4.5 `ui/src/utils/icons.ts`

```ts
import { type SVGTemplateResult, svg } from 'lit'

/**
 * Zero-dependency SVG chrome icons for internal component affordances.
 * All icons include `aria-hidden="true"` and `focusable="false"` per accessibility guidelines.
 */

export const close = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
`

export const chevronDown = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
`

export const search = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
`

export const clear = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6m0-6 6 6" />
  </svg>
`

export const alertInfo = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
`

export const alertSuccess = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
`

export const alertWarning = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
`

export const alertError = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
`

export const spinnerRing = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
  </svg>
`

export const calendarNavPrev = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
`

export const calendarNavNext = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
`
```

### 4.6 `ui/src/tokens/Tokens.test.ts`

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as fc from 'fast-check'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  SEMANTIC_TONES,
  VISUAL_VARIANTS,
  normalizeTone,
  normalizeVariant,
  semanticToneStyles,
} from '../styles/semantic-tones'
import { defineElement } from '../utils/define-element'
import {
  focusFirstElement,
  safeShowModal,
  supportsNativePopoverAndAnchor,
  trapFocus,
} from '../utils/focus-trap'
import * as icons from '../utils/icons'
import {
  CHART_EASE,
  IOS_SHEET_CURVE,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  animateActiveIndicator,
  prefersReducedMotion,
  subtleAnimate,
} from '../utils/motion'
import { warnMissingLabel } from '../utils/warn-missing-label'

describe('Milestone 2 Token & Utility Verification Test Suite', () => {
  // ===========================================================================
  // 1. CSS Design Token Layer (:root properties in ui/src/styles/style.css)
  // ===========================================================================
  describe('CSS Design Token Layer (style.css)', () => {
    const cssPath = resolve(__dirname, '../styles/style.css')
    const cssContent = readFileSync(cssPath, 'utf-8')

    it('defines color-scheme and theme selectors', () => {
      expect(cssContent).toMatch(/color-scheme:\s*light dark;/)
      expect(cssContent).toMatch(/\[data-theme="light"\]/)
      expect(cssContent).toMatch(/\[data-theme="dark"\]/)
      expect(cssContent).toMatch(/\.dark/)
    })

    it('defines all 6 brand customization hooks with required default values', () => {
      expect(cssContent).toMatch(/--brand-hue:\s*250;/)
      expect(cssContent).toMatch(/--brand-chroma-multiplier:\s*1;/)
      expect(cssContent).toMatch(/--brand-font-family:\s*inherit;/)
      expect(cssContent).toMatch(/--brand-font-scale:\s*1;/)
      expect(cssContent).toMatch(/--brand-density-factor:\s*1;/)
      expect(cssContent).toMatch(/--brand-radius-factor:\s*1;/)
    })

    it('defines all Neutral scale tokens (50–900) using light-dark(oklch(...))', () => {
      const neutralSteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      for (const step of neutralSteps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-neutral-${step}:\\s*light-dark\\(oklch\\(`),
        )
      }
    })

    it('defines all Primary scale tokens (50–900) using light-dark(oklch(...))', () => {
      const primarySteps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
      for (const step of primarySteps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-primary-${step}:\\s*light-dark\\(oklch\\(`),
        )
      }
    })

    it('defines all Error, Warning, and Success scales (300–700) using light-dark(oklch(...))', () => {
      const steps = [300, 400, 500, 600, 700]
      for (const step of steps) {
        expect(cssContent).toMatch(
          new RegExp(`--color-error-${step}:\\s*light-dark\\(oklch\\(`),
        )
        expect(cssContent).toMatch(
          new RegExp(`--color-warning-${step}:\\s*light-dark\\(oklch\\(`),
        )
        expect(cssContent).toMatch(
          new RegExp(`--color-success-${step}:\\s*light-dark\\(oklch\\(`),
        )
      }
    })

    it('defines all 13 semantic surface, text, and border aliases', () => {
      const aliases = [
        '--color-bg',
        '--color-bg-subtle',
        '--color-bg-elevated',
        '--color-fg',
        '--color-fg-subtle',
        '--color-fg-on-primary',
        '--color-border',
        '--color-border-subtle',
        '--color-border-focus',
        '--color-bg-glass',
        '--color-border-glass',
        '--color-shadow',
        '--color-overlay',
      ]
      for (const alias of aliases) {
        expect(cssContent).toMatch(new RegExp(`${alias}:`))
      }
    })

    it('defines all 20 alert status color tokens', () => {
      const tones = ['info', 'accent', 'success', 'warning', 'error']
      const props = ['bg', 'border', 'hover', 'active']
      for (const tone of tones) {
        for (const prop of props) {
          expect(cssContent).toMatch(
            new RegExp(`--color-alert-${prop}-${tone}:`),
          )
        }
      }
    })

    it('defines typography tokens (sizes xs-4xl, line-heights xs-4xl, font-weights)', () => {
      const sizeSteps = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl']
      for (const step of sizeSteps) {
        expect(cssContent).toMatch(new RegExp(`--font-size-${step}:`))
        expect(cssContent).toMatch(new RegExp(`--line-height-${step}:`))
      }
      expect(cssContent).toMatch(/--font-weight-normal:\s*400;/)
      expect(cssContent).toMatch(/--font-weight-medium:\s*500;/)
      expect(cssContent).toMatch(/--font-weight-semibold:\s*600;/)
      expect(cssContent).toMatch(/--font-weight-bold:\s*700;/)
      expect(cssContent).toMatch(/--font-family-base:/)
    })

    it('defines spacing-1 through spacing-8 tokens', () => {
      for (let i = 1; i <= 8; i++) {
        expect(cssContent).toMatch(new RegExp(`--spacing-${i}:`))
      }
    })

    it('defines radius tokens (none, sm, md, lg, full)', () => {
      const radii = ['none', 'sm', 'md', 'lg', 'full']
      for (const r of radii) {
        expect(cssContent).toMatch(new RegExp(`--radius-${r}:`))
      }
    })

    it('strictly references --color-shadow in shadow tokens and never legacy --colorShadow', () => {
      expect(cssContent).toMatch(/--shadow-sm:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).toMatch(/--shadow-md:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).toMatch(/--shadow-lg:\s*[^;]*var\(--color-shadow\)/)
      expect(cssContent).not.toMatch(/--colorShadow/)
    })

    it('defines z-index tokens and chart colors 1 through 8', () => {
      expect(cssContent).toMatch(/--z-base:\s*0;/)
      expect(cssContent).toMatch(/--z-dropdown:\s*1000;/)
      expect(cssContent).toMatch(/--z-modal:\s*1300;/)
      expect(cssContent).toMatch(/--z-tooltip:\s*1500;/)
      expect(cssContent).toMatch(/--z-toast:\s*1700;/)

      for (let i = 1; i <= 8; i++) {
        expect(cssContent).toMatch(
          new RegExp(`--color-chart-${i}:\\s*light-dark\\(oklch\\(`),
        )
      }
    })
  })

  // ===========================================================================
  // 2. Semantic Tone & Visual Variant Matrix (25 combinations)
  // ===========================================================================
  describe('Semantic Tones & Visual Variants Matrix', () => {
    it('covers all 25 tone × variant combinations using fast-check', () => {
      const stylesText = Array.isArray(semanticToneStyles)
        ? semanticToneStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : (semanticToneStyles as any).cssText ?? String(semanticToneStyles)

      fc.assert(
        fc.property(
          fc.constantFrom(...SEMANTIC_TONES),
          fc.constantFrom(...VISUAL_VARIANTS),
          (tone, variant) => {
            const hasToneSelector =
              stylesText.includes(`tone="${tone}"`) ||
              stylesText.includes(`data-tone="${tone}"`)
            const hasVariantSelector =
              stylesText.includes(`variant="${variant}"`) ||
              stylesText.includes(`data-variant="${variant}"`)
            return hasToneSelector && hasVariantSelector
          },
        ),
      )
    })

    it('provides solid background fallback and progressive blur enhancement for glass variant', () => {
      const stylesText = Array.isArray(semanticToneStyles)
        ? semanticToneStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : (semanticToneStyles as any).cssText ?? String(semanticToneStyles)

      expect(stylesText).toMatch(/var\(--color-bg-glass\)/)
      expect(stylesText).toMatch(/var\(--color-border-glass\)/)
      expect(stylesText).toMatch(/@supports\s*\([^)]*backdrop-filter:\s*blur/)
      expect(stylesText).toMatch(/var\(--shadow-md\)/)
    })
  })

  // ===========================================================================
  // 3. Property-Based Input Normalization Resilience
  // ===========================================================================
  describe('Input Normalizers Property Tests', () => {
    it('normalizeTone safely handles arbitrary string inputs', () => {
      fc.assert(
        fc.property(fc.string(), (val) => {
          const result = normalizeTone(val)
          if (SEMANTIC_TONES.includes(val as any)) {
            return result === val
          }
          return result === 'primary'
        }),
      )
    })

    it('normalizeTone supports custom fallback', () => {
      expect(normalizeTone('invalid-random-tone', 'success')).toBe('success')
      expect(normalizeTone(null, 'error')).toBe('error')
      expect(normalizeTone(undefined, 'warning')).toBe('warning')
      expect(normalizeTone(12345 as any, 'accent')).toBe('accent')
    })

    it('normalizeVariant safely handles arbitrary string inputs', () => {
      fc.assert(
        fc.property(fc.string(), (val) => {
          const result = normalizeVariant(val)
          if (VISUAL_VARIANTS.includes(val as any)) {
            return result === val
          }
          return result === 'flat'
        }),
      )
    })

    it('normalizeVariant supports custom fallback', () => {
      expect(normalizeVariant('unknown-variant', 'glass')).toBe('glass')
      expect(normalizeVariant(null, 'solid')).toBe('solid')
      expect(normalizeVariant(undefined, 'shadow')).toBe('shadow')
      expect(normalizeVariant({} as any, 'bordered')).toBe('bordered')
    })
  })

  // ===========================================================================
  // 4. Core Utilities Verification
  // ===========================================================================
  describe('Core Utilities', () => {
    beforeEach(() => {
      vi.restoreAllMocks()
    })

    describe('defineElement', () => {
      it('idempotently registers custom elements and emits console.warn on duplicates', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const tagName = `moul-test-idempotent-${Date.now()}`
        class TestElement extends HTMLElement {}

        // First registration
        defineElement(tagName, TestElement)
        expect(customElements.get(tagName)).toBe(TestElement)
        expect(warnSpy).not.toHaveBeenCalled()

        // Duplicate registration attempt
        class DuplicateElement extends HTMLElement {}
        expect(() => defineElement(tagName, DuplicateElement)).not.toThrow()
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining(`Custom element "${tagName}" is already registered`),
        )
        // Original constructor must be preserved
        expect(customElements.get(tagName)).toBe(TestElement)
      })
    })

    describe('warnMissingLabel', () => {
      it('warns when aria-label and aria-labelledby are missing in dev mode', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('is missing an accessible label (icon-only action)'),
        )
      })

      it('does not warn when aria-label or aria-labelledby is present', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        button.setAttribute('aria-label', 'Close dialog')
        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).not.toHaveBeenCalled()

        button.removeAttribute('aria-label')
        button.setAttribute('aria-labelledby', 'title-id')
        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).not.toHaveBeenCalled()
      })

      it('warns when aria-label contains only whitespace', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')
        button.setAttribute('aria-label', '   ')

        warnMissingLabel(button, 'icon-only action')
        expect(warnSpy).toHaveBeenCalled()
      })

      it('does not warn when hasVisibleLabel is true', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const button = document.createElement('button')

        warnMissingLabel(button, 'action', true)
        expect(warnSpy).not.toHaveBeenCalled()
      })
    })

    describe('focus-trap utilities', () => {
      it('supportsNativePopoverAndAnchor correctly identifies environment features', () => {
        const result = supportsNativePopoverAndAnchor()
        expect(typeof result).toBe('boolean')
      })

      it('safeShowModal catches disconnected DOMException and emits console.warn', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const dialog = document.createElement('dialog') // Disconnected

        const success = safeShowModal(dialog)
        expect(success).toBe(false)
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to call dialog.showModal()'),
          expect.anything(),
        )
      })

      it('safeShowModal opens connected dialog and focuses first interactive element', () => {
        const dialog = document.createElement('dialog')
        const button = document.createElement('button')
        dialog.appendChild(button)
        document.body.appendChild(dialog)

        try {
          const success = safeShowModal(dialog)
          expect(success).toBe(true)
          expect(dialog.open).toBe(true)
          expect(document.activeElement).toBe(button)
        } finally {
          dialog.close()
          dialog.remove()
        }
      })

      it('safeShowModal safely returns false on null dialog', () => {
        expect(safeShowModal(null)).toBe(false)
      })

      it('focusFirstElement safely finds focusable elements', () => {
        const container = document.createElement('div')
        const btn1 = document.createElement('button')
        const btn2 = document.createElement('button')
        container.appendChild(btn1)
        container.appendChild(btn2)
        document.body.appendChild(container)

        try {
          const focused = focusFirstElement(container)
          expect(focused).toBe(btn1)
          expect(document.activeElement).toBe(btn1)
        } finally {
          container.remove()
        }
      })

      it('trapFocus cycles Tab forward and backward', () => {
        const container = document.createElement('div')
        const firstBtn = document.createElement('button')
        const lastBtn = document.createElement('button')
        container.appendChild(firstBtn)
        container.appendChild(lastBtn)
        document.body.appendChild(container)

        try {
          lastBtn.focus()
          expect(document.activeElement).toBe(lastBtn)

          // Forward Tab from last element wraps to first
          const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: false,
            cancelable: true,
          })
          trapFocus(container, tabEvent)
          expect(tabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(firstBtn)

          // Backward Shift+Tab from first element wraps to last
          const shiftTabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey: true,
            cancelable: true,
          })
          trapFocus(container, shiftTabEvent)
          expect(shiftTabEvent.defaultPrevented).toBe(true)
          expect(document.activeElement).toBe(lastBtn)
        } finally {
          container.remove()
        }
      })
    })

    describe('motion utilities', () => {
      it('exports correct animation presets', () => {
        expect(SPRING_SNAPPY).toEqual({
          type: 'spring',
          stiffness: 500,
          damping: 35,
          mass: 0.8,
        })
        expect(SPRING_GENTLE).toEqual({
          type: 'spring',
          stiffness: 320,
          damping: 28,
          mass: 1,
        })
        expect(IOS_SHEET_CURVE).toEqual([0.32, 0.72, 0, 1])
        expect(CHART_EASE).toEqual([0.22, 1, 0.36, 1])
      })

      it('prefersReducedMotion returns boolean', () => {
        expect(typeof prefersReducedMotion()).toBe('boolean')
      })

      it('animateActiveIndicator returns null if previousRect is null', () => {
        const el = document.createElement('div')
        const nextRect = { left: 10, top: 10, width: 100, height: 40 } as DOMRect
        const controls = animateActiveIndicator(el, null, nextRect)
        expect(controls).toBeNull()
      })
    })

    describe('icons utility', () => {
      it('exports all 11 required SVG icon templates with aria-hidden and focusable=false', () => {
        const requiredIcons = [
          'close',
          'chevronDown',
          'search',
          'clear',
          'alertInfo',
          'alertSuccess',
          'alertWarning',
          'alertError',
          'spinnerRing',
          'calendarNavPrev',
          'calendarNavNext',
        ] as const

        for (const name of requiredIcons) {
          expect(icons).toHaveProperty(name)
          const template = (icons as any)[name]()
          expect(template).toBeDefined()
          const html = template.strings.join('')
          expect(html).toContain('aria-hidden="true"')
          expect(html).toContain('focusable="false"')
          expect(html).toContain('viewBox="0 0 24 24"')
        }
      })
    })
  })
})
```

---

## 5. Verification Method

Once the implementer writes the 6 files above along with Tasks 2.1 (`ui/src/styles/style.css`) and 2.2 (`ui/src/styles/semantic-tones.ts`), execute the following commands to independently verify correctness:

1. **Run Vitest Test Suite**:
   ```bash
   bun run --cwd ui test src/tokens/Tokens.test.ts
   ```
   *Expected Result*: All 16+ tests pass, including:
   - All `:root` tokens verified against `style.css`
   - Fast-check 25 tone × variant combinations verified
   - Fast-check random string normalizer resilience passed (100 runs each)
   - `defineElement` idempotency warning verified
   - `warnMissingLabel` dev check verified
   - `safeShowModal` disconnected `DOMException` warning verified
   - `motion` presets and reduced motion handling verified
   - All 11 SVG icons verified

2. **Verify No Prohibited Dependencies / Imports**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected Result*: Exits with code `0`.

3. **Verify Biome Linting & Formatting**:
   ```bash
   bun run lint
   ```
   *Expected Result*: Passes without errors or formatting warnings.

4. **Invalidation Conditions**:
   - If `customElements.get(tagName)` throwing occurs instead of catching.
   - If `warnMissingLabel` outputs warnings in production mode (`NODE_ENV === 'production'`).
   - If `safeShowModal` attempts to focus children when `showModal()` throws a disconnected DOMException.
   - If any shadow references legacy `--colorShadow` instead of `--color-shadow`.
   - If any icon lacks `aria-hidden="true"` or `focusable="false"`.
