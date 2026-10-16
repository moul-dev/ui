# Phase 3 Reactive Controllers Architecture & Investigation Report

## 1. Observation

### 1.1 Existing Codebase Infrastructure & Core Utilities

Direct observations from inspecting `ui/src/utils/`:

1. **`ui/src/utils/motion.ts`** (Lines 1–80):
   - Exports:
     - `SPRING_SNAPPY: AnimationOptions` (`type: 'spring', stiffness: 500, damping: 35, mass: 0.8`)
     - `SPRING_GENTLE: AnimationOptions` (`type: 'spring', stiffness: 320, damping: 28, mass: 1`)
     - `IOS_SHEET_CURVE = [0.32, 0.72, 0, 1] as const`
     - `CHART_EASE = [0.22, 1, 0.36, 1] as const`
     - `prefersReducedMotion(): boolean` (checks `window.matchMedia('(prefers-reduced-motion: reduce)').matches`)
     - `subtleAnimate(target, keyframes, options = SPRING_GENTLE): AnimationPlaybackControls` (collapses duration to 0 if `prefersReducedMotion()` is true)
     - `animateActiveIndicator(indicator, previousRect, nextRect): AnimationPlaybackControls | null` (FLIP delta indicator animation)
     - `stagger` re-exported from `motion`
   - Vanilla `motion` usage:
     - Imports from `motion`: `animate`, `type AnimationOptions`, `type AnimationPlaybackControls`, `type DOMKeyframesDefinition`, `stagger`.
     - Zero React dependencies or `motion/react` imports. Verified clean.
     - `animate(from, to, options)` supports pure numeric value interpolation using `{ type: 'spring', stiffness, damping, mass, onUpdate: (v) => ... }` and returns `AnimationPlaybackControls` with `.stop()` and promise-like `.then()`.

2. **`ui/src/utils/focus-trap.ts`** (Lines 1–148):
   - Exports:
     - `safeShowModal(dialog: HTMLDialogElement | null, focusRoot?: HTMLElement): boolean`:
       - Catches `DOMException` when `dialog` is disconnected, emits `console.warn` without throwing, does NOT focus children.
       - If modal succeeds, focuses first focusable element inside `focusRoot` or `dialog`.
     - `supportsNativePopoverAndAnchor(): boolean`:
       - Checks `'popover' in HTMLElement.prototype` and `CSS.supports('anchor-name', '--moul-anchor')`.
     - `focusFirstElement(root: HTMLElement): HTMLElement | null`
     - `trapFocus(container: HTMLElement, event: KeyboardEvent): void`
     - `restoreFocus(previousActiveElement: HTMLElement | null): void`

3. **`ui/src/styles/`**:
   - `reset.styles.ts`: Shared Lit CSS reset `resetStyles: CSSResultGroup` with `:focus-visible` ring.
   - `semantic-tones.ts`: `semanticToneStyles`, `normalizeTone`, `normalizeVariant`.
   - `style.css`: Token layer with light-dark / oklch, shadows referencing `--color-shadow`.

### 1.2 Package Setup, Lit 3 & TypeScript Build Configuration

1. **`ui/package.json`**:
   - Lit version: `"lit": "^3.2.1"`
   - Motion version: `"motion": "^13.4.1"`
   - Virtualizer: `"@lit-labs/virtualizer": "^2.1.0"`
   - Context: `"@lit/context": "^1.1.3"`
   - Dev dependencies: `vitest: "^2.1.8"`, `happy-dom: "^16.8.1"`, `fast-check: "^3.23.2"`, `@custom-elements-manifest/analyzer: "^0.10.4"`.
   - Banned packages: Zero matches for `react`, `react-dom`, `react-aria`, etc. Verified with `bun ./scripts/verify-no-react.ts all`.

2. **`ui/tsconfig.app.json`**:
   - Compiler flags:
     - `"target": "es2023"`
     - `"moduleResolution": "bundler"`
     - `"verbatimModuleSyntax": true`: **CRITICAL REQUIREMENT** — All type imports MUST use explicit `import type { ... }` or `import { type ... }`. Importing types as values will break compilation.
     - `"erasableSyntaxOnly": true`
     - `"noUnusedLocals": true`
     - `"noUnusedParameters": true`
   - Verified compilation: `node ui/node_modules/.bin/tsc -b ui/tsconfig.app.json` succeeds with exit code 0.

3. **`ui/src/test-setup.ts`**:
   - Provides fully compliant happy-dom shims for:
     - `ElementInternals` (`MockElementInternalsImpl`: tracks form, formValue, validity flags, validationMessage truncated to <= 200 chars).
     - `HTMLDialogElement` (`showModal` throws `DOMException` if disconnected per Requirement 6.10, `close` dispatches `close` event).
     - `Popover API` (`showPopover`, `hidePopover`, `togglePopover`, `beforetoggle`, `toggle` events, `:popover-open` selector matching).
     - `MockResizeObserver` with deterministic `triggerResize(element, { width, height })` helper.
   - Test execution verification:
     - `node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts`: 35/35 passed (100%).
     - `node ui/node_modules/.bin/vitest run --root ui src/utils/utils-challenge.test.ts`: 36/36 passed (100%).
     - `node_modules/.bin/biome check ui/src/utils`: 0 errors.

---

## 2. Logic Chain

From the verified requirements (`rdt/requirements.md` Req 5, Req 6, Req 9.12) and technical specifications (`rdt/design.md` Section 6), each of the five reactive controllers fulfills specific architectural invariants:

### 2.1 Architecture of `PressController` (`press.controller.ts`)

#### 1. Responsibilities & Invariants:
- Tracks pointer down, up, cancel, enter, leave, keyboard (Enter, Space), and focus visibility.
- Updates boolean state: `isPressed`, `isHovered`, `isFocusVisible`.
- Synchronizes `aria-pressed` on the host element if and only if:
  - `host.getAttribute('type') === 'button'`, OR
  - `host.getAttribute('type') === 'checkbox'`, OR
  - `host.hasAttribute('aria-pressed')` was present on initial connection.
  - If none of these conditions are met, `aria-pressed` must NOT be touched or modified.
- Respects disabled host state:
  - Checked via `this.isDisabled()`: host has `disabled`, `is-disabled`, `(host as any).disabled === true`, `(host as any).isDisabled === true`, or optional `options.disabled?.()`.
  - When disabled, all press and hover interactions are suppressed, and any active press is immediately cancelled.
- Tactile Motion:
  - When `scaleOnPress` is set (default `0.97` if `true`, or custom number): scales target element on press down via `animate(el, { scale }, SPRING_SNAPPY)` and returns to `scale: 1` on release.
  - When `hoverLift` is set (default `-2` if `true`, or custom number): translates target element vertically via `animate(el, { y }, SPRING_GENTLE)` on hover and returns to `y: 0` on leave.
  - If `prefersReducedMotion()` is true: skips transform animations completely to protect vestibular comfort.
- Cleanup:
  - In `hostDisconnected()`, removes all 9 DOM listeners and stops any running `AnimationPlaybackControls`.

#### 2. Concrete Implementation Architecture:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import {
  SPRING_GENTLE,
  SPRING_SNAPPY,
  prefersReducedMotion,
} from '../utils/motion'

export interface PressControllerOptions {
  /**
   * Scale factor on press. If true, defaults to 0.97. If number, uses that scale.
   * If false or undefined, press scaling is disabled.
   */
  scaleOnPress?: boolean | number

  /**
   * Hover lift in pixels (negative y). If true, defaults to -2. If number, uses that value.
   * If false or undefined, hover lift is disabled.
   */
  hoverLift?: boolean | number

  /**
   * Target element to animate. Defaults to host element.
   */
  target?: () => HTMLElement | null

  /**
   * Custom disabled predicate. If omitted, checks host `disabled` / `is-disabled` attributes/properties.
   */
  disabled?: () => boolean
}

export class PressController implements ReactiveController {
  public isPressed: boolean = false
  public isHovered: boolean = false
  public isFocusVisible: boolean = false

  private host: ReactiveControllerHost & HTMLElement
  private options: PressControllerOptions
  private shouldSyncAriaPressed: boolean = false
  private activePressAnimation: AnimationPlaybackControls | null = null
  private activeHoverAnimation: AnimationPlaybackControls | null = null

  // Pre-bound event listener references for clean removal
  private readonly handlePointerDown = (e: PointerEvent): void => {
    if (this.isDisabled() || e.button !== 0) return
    this.isPressed = true
    this.syncAriaPressed()
    this.animatePress(true)
    this.host.requestUpdate()
  }

  private readonly handlePointerUp = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.syncAriaPressed()
    this.animatePress(false)
    this.host.requestUpdate()
  }

  private readonly handlePointerCancel = (): void => {
    if (!this.isPressed) return
    this.isPressed = false
    this.syncAriaPressed()
    this.animatePress(false)
    this.host.requestUpdate()
  }

  private readonly handlePointerEnter = (): void => {
    if (this.isDisabled()) return
    this.isHovered = true
    this.animateHover(true)
    this.host.requestUpdate()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovered = false
    if (this.isPressed) {
      this.isPressed = false
      this.syncAriaPressed()
      this.animatePress(false)
    }
    this.animateHover(false)
    this.host.requestUpdate()
  }

  private readonly handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDisabled()) return
    if (e.key === ' ' || e.key === 'Enter') {
      if (!this.isPressed) {
        this.isPressed = true
        this.isFocusVisible = true
        this.syncAriaPressed()
        this.animatePress(true)
        this.host.requestUpdate()
      }
    }
  }

  private readonly handleKeyUp = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      if (this.isPressed) {
        this.isPressed = false
        this.syncAriaPressed()
        this.animatePress(false)
        this.host.requestUpdate()
      }
    }
  }

  private readonly handleFocusIn = (): void => {
    if (this.isDisabled()) return
    try {
      this.isFocusVisible = this.host.matches(':focus-visible')
    } catch {
      this.isFocusVisible = true
    }
    this.host.requestUpdate()
  }

  private readonly handleFocusOut = (): void => {
    this.isFocusVisible = false
    if (this.isPressed) {
      this.isPressed = false
      this.syncAriaPressed()
      this.animatePress(false)
    }
    this.host.requestUpdate()
  }

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: PressControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    const type = this.host.getAttribute('type')
    const hasAriaPressed = this.host.hasAttribute('aria-pressed')
    this.shouldSyncAriaPressed =
      type === 'button' || type === 'checkbox' || hasAriaPressed

    if (this.shouldSyncAriaPressed) {
      this.host.setAttribute('aria-pressed', String(this.isPressed))
    }

    const h = this.host
    h.addEventListener('pointerdown', this.handlePointerDown)
    h.addEventListener('pointerup', this.handlePointerUp)
    h.addEventListener('pointercancel', this.handlePointerCancel)
    h.addEventListener('pointerenter', this.handlePointerEnter)
    h.addEventListener('pointerleave', this.handlePointerLeave)
    h.addEventListener('keydown', this.handleKeyDown)
    h.addEventListener('keyup', this.handleKeyUp)
    h.addEventListener('focusin', this.handleFocusIn)
    h.addEventListener('focusout', this.handleFocusOut)
  }

  public hostDisconnected(): void {
    const h = this.host
    h.removeEventListener('pointerdown', this.handlePointerDown)
    h.removeEventListener('pointerup', this.handlePointerUp)
    h.removeEventListener('pointercancel', this.handlePointerCancel)
    h.removeEventListener('pointerenter', this.handlePointerEnter)
    h.removeEventListener('pointerleave', this.handlePointerLeave)
    h.removeEventListener('keydown', this.handleKeyDown)
    h.removeEventListener('keyup', this.handleKeyUp)
    h.removeEventListener('focusin', this.handleFocusIn)
    h.removeEventListener('focusout', this.handleFocusOut)

    this.activePressAnimation?.stop()
    this.activePressAnimation = null
    this.activeHoverAnimation?.stop()
    this.activeHoverAnimation = null

    this.isPressed = false
    this.isHovered = false
    this.isFocusVisible = false
  }

  public isDisabled(): boolean {
    if (this.options.disabled && this.options.disabled()) return true
    const h = this.host
    return (
      h.hasAttribute('disabled') ||
      h.hasAttribute('is-disabled') ||
      Boolean((h as unknown as { disabled?: boolean }).disabled) ||
      Boolean((h as unknown as { isDisabled?: boolean }).isDisabled)
    )
  }

  private syncAriaPressed(): void {
    if (this.shouldSyncAriaPressed) {
      this.host.setAttribute('aria-pressed', String(this.isPressed))
    }
  }

  private getAnimationTarget(): HTMLElement | null {
    return this.options.target ? this.options.target() ?? this.host : this.host
  }

  private animatePress(pressed: boolean): void {
    if (!this.options.scaleOnPress || prefersReducedMotion()) return
    const target = this.getAnimationTarget()
    if (!target) return

    this.activePressAnimation?.stop()
    const targetScale = pressed
      ? typeof this.options.scaleOnPress === 'number'
        ? this.options.scaleOnPress
        : 0.97
      : 1

    this.activePressAnimation = animate(
      target,
      { scale: targetScale },
      SPRING_SNAPPY,
    )
  }

  private animateHover(hovered: boolean): void {
    if (!this.options.hoverLift || prefersReducedMotion()) return
    const target = this.getAnimationTarget()
    if (!target) return

    this.activeHoverAnimation?.stop()
    const targetY = hovered
      ? typeof this.options.hoverLift === 'number'
        ? this.options.hoverLift
        : -2
      : 0

    this.activeHoverAnimation = animate(target, { y: targetY }, SPRING_GENTLE)
  }
}
```

---

### 2.2 Architecture of `LayoutIndicatorController` (`layout-indicator.controller.ts`)

#### 1. Responsibilities & Invariants:
- Observes host element dimensions via `ResizeObserver`.
- Computes responsive breakpoints (Requirement 5.3):
  - `0 <= width <= 479` -> `'xs'`
  - `480 <= width <= 767` -> `'sm'`
  - `768 <= width <= 1023` -> `'md'`
  - `1024 <= width <= 1279` -> `'lg'`
  - `width >= 1280` -> `'xl'`
- Calls `host.requestUpdate()` on breakpoint changes.
- If `observeDimensions: true` is configured (required for `ChartContainer` dynamic SVG viewport resizing), also triggers `requestUpdate()` on any width or height change.
- Disconnects observer on `hostDisconnected()`.

#### 2. Concrete Implementation Architecture:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface LayoutIndicatorControllerOptions {
  /**
   * If true, calls host.requestUpdate() on every dimension change (width or height),
   * not only when breakpoint changes. Default false.
   */
  observeDimensions?: boolean

  /**
   * Initial breakpoint before first measurement. Defaults to 'md'.
   */
  initialBreakpoint?: Breakpoint
}

export function computeBreakpoint(width: number): Breakpoint {
  if (width < 480) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  return 'xl'
}

export class LayoutIndicatorController implements ReactiveController {
  public breakpoint: Breakpoint = 'md'
  public width: number = 0
  public height: number = 0

  private host: ReactiveControllerHost & HTMLElement
  private options: LayoutIndicatorControllerOptions
  private observer: ResizeObserver | null = null

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: LayoutIndicatorControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.breakpoint = options.initialBreakpoint ?? 'md'
    this.host.addController(this)
  }

  public hostConnected(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) return
        let w = 0
        let h = 0
        if (entry.contentRect) {
          w = entry.contentRect.width
          h = entry.contentRect.height
        } else if (entry.borderBoxSize?.[0]) {
          w = entry.borderBoxSize[0].inlineSize
          h = entry.borderBoxSize[0].blockSize
        }
        this.updateDimensions(w, h)
      })
      this.observer.observe(this.host)
    }

    // Measure immediate geometry if available
    const rect = this.host.getBoundingClientRect?.()
    if (rect && (rect.width > 0 || rect.height > 0)) {
      this.updateDimensions(rect.width, rect.height)
    }
  }

  public hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
  }

  private updateDimensions(w: number, h: number): void {
    const nextBp = computeBreakpoint(w)
    const bpChanged = nextBp !== this.breakpoint
    const dimChanged = w !== this.width || h !== this.height

    this.width = w
    this.height = h
    this.breakpoint = nextBp

    if (bpChanged || (this.options.observeDimensions && dimChanged)) {
      this.host.requestUpdate()
    }
  }
}
```

---

### 2.3 Architecture of `OverlayPresenceController` (`overlay-presence.controller.ts`)

#### 1. Responsibilities & Invariants:
- Coordinates two-phase open and mount states: `isOpen` (default `false`) and `isMounted` (default `false`).
- Supports 8 overlay presets: `'modal' | 'popover' | 'tooltip' | 'drawer-left' | 'drawer-right' | 'drawer-top' | 'drawer-bottom' | 'toast'`.
- Open Transition:
  - Sets `isOpen = true`, `isMounted = true`.
  - Promotes native `<dialog>` via `safeShowModal` or `[popover]` via `showPopover()`.
  - Runs preset-specific entrance animation via `animate()`.
- Close Transition:
  - Sets `isOpen = false`.
  - Awaits exit animation completion via `motion` controls.
  - **Crucial Invariant**: Calls `dialog.close()` or `popover.hidePopover()` and sets `isMounted = false` **only after** the exit animation promise completes, preventing premature top-layer clipping.
  - **Race Condition Prevention**: Employs an incrementing transition ID (`currentTransitionId`). If the overlay is re-opened while an exit animation is still running, the completion handler detects the stale ID and skips closing/unmounting.
- Reduced Motion:
  - If `prefersReducedMotion()` is true, animations collapse to duration `0` (instant transition).

#### 2. Concrete Implementation Architecture:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import {
  type AnimationOptions,
  type AnimationPlaybackControls,
  type DOMKeyframesDefinition,
  animate,
} from 'motion'
import { safeShowModal } from '../utils/focus-trap'
import {
  IOS_SHEET_CURVE,
  SPRING_GENTLE,
  SPRING_SNAPPY,
  prefersReducedMotion,
} from '../utils/motion'

export type OverlayPreset =
  | 'modal'
  | 'popover'
  | 'tooltip'
  | 'drawer-left'
  | 'drawer-right'
  | 'drawer-top'
  | 'drawer-bottom'
  | 'toast'

export interface OverlayPresenceControllerOptions {
  preset?: OverlayPreset
  target?: () => HTMLElement | null
  dialog?: () => HTMLDialogElement | null
  popover?: () => HTMLElement | null
  onOpenChange?: (open: boolean) => void
}

export class OverlayPresenceController implements ReactiveController {
  public isOpen: boolean = false
  public isMounted: boolean = false

  private host: ReactiveControllerHost & HTMLElement
  private options: OverlayPresenceControllerOptions
  private activeAnimation: AnimationPlaybackControls | null = null
  private currentTransitionId: number = 0

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: OverlayPresenceControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    // Initialized idle
  }

  public hostDisconnected(): void {
    this.activeAnimation?.stop()
    this.activeAnimation = null
    this.currentTransitionId++
  }

  public async setOpen(
    nextOpen: boolean,
    targetElement?: Element | null,
  ): Promise<void> {
    if (nextOpen === this.isOpen && this.isMounted === nextOpen) return

    const transitionId = ++this.currentTransitionId
    const preset = this.options.preset ?? 'modal'

    if (nextOpen) {
      this.isOpen = true
      this.isMounted = true
      this.activeAnimation?.stop()
      this.activeAnimation = null

      this.host.requestUpdate()
      this.options.onOpenChange?.(true)

      // Allow Lit template to render DOM if unmounted
      if ((this.host as unknown as { updateComplete?: Promise<boolean> }).updateComplete) {
        await (this.host as unknown as { updateComplete: Promise<boolean> }).updateComplete
      }

      // Promote to top layer
      this.promoteTopLayer()

      const target =
        targetElement ?? this.options.target?.() ?? this.host

      if (target) {
        const keyframes = this.getEnterKeyframes(preset)
        const opts = prefersReducedMotion()
          ? { duration: 0 }
          : this.getEnterOptions(preset)

        this.activeAnimation = animate(target, keyframes, opts)
        await this.activeAnimation
      }
    } else {
      this.isOpen = false
      this.host.requestUpdate()
      this.options.onOpenChange?.(false)

      this.activeAnimation?.stop()
      this.activeAnimation = null

      const target =
        targetElement ?? this.options.target?.() ?? this.host

      if (target) {
        const keyframes = this.getExitKeyframes(preset)
        const opts = prefersReducedMotion()
          ? { duration: 0 }
          : this.getExitOptions(preset)

        this.activeAnimation = animate(target, keyframes, opts)
        await this.activeAnimation
      }

      // Guard against race conditions: if re-opened while exit animation played, bail out
      if (this.currentTransitionId !== transitionId || this.isOpen) {
        return
      }

      // Top layer cleanup AFTER animation completes
      this.demoteTopLayer()

      this.isMounted = false
      this.host.requestUpdate()
    }
  }

  public async toggle(force?: boolean): Promise<void> {
    const next = typeof force === 'boolean' ? force : !this.isOpen
    await this.setOpen(next)
  }

  private promoteTopLayer(): void {
    const dialog =
      this.options.dialog?.() ??
      (this.host.shadowRoot?.querySelector('dialog') as HTMLDialogElement | null) ??
      (this.host.querySelector('dialog') as HTMLDialogElement | null)

    if (dialog && !dialog.open) {
      safeShowModal(dialog)
    }

    const popover =
      this.options.popover?.() ??
      (this.host.shadowRoot?.querySelector('[popover]') as HTMLElement | null) ??
      (this.host.querySelector('[popover]') as HTMLElement | null)

    if (popover && typeof popover.showPopover === 'function' && !popover.matches(':popover-open')) {
      try {
        popover.showPopover()
      } catch {
        // Safe fallback in non-popover environments
      }
    }
  }

  private demoteTopLayer(): void {
    const dialog =
      this.options.dialog?.() ??
      (this.host.shadowRoot?.querySelector('dialog') as HTMLDialogElement | null) ??
      (this.host.querySelector('dialog') as HTMLDialogElement | null)

    if (dialog && dialog.open) {
      try {
        dialog.close()
      } catch {
        // Safe fallback
      }
    }

    const popover =
      this.options.popover?.() ??
      (this.host.shadowRoot?.querySelector('[popover]') as HTMLElement | null) ??
      (this.host.querySelector('[popover]') as HTMLElement | null)

    if (popover && typeof popover.hidePopover === 'function' && popover.matches(':popover-open')) {
      try {
        popover.hidePopover()
      } catch {
        // Safe fallback
      }
    }
  }

  private getEnterKeyframes(preset: OverlayPreset): DOMKeyframesDefinition {
    switch (preset) {
      case 'modal':
        return { opacity: [0, 1], scale: [0.95, 1], y: [8, 0] }
      case 'popover':
        return { opacity: [0, 1], scale: [0.96, 1], y: [-4, 0] }
      case 'tooltip':
        return { opacity: [0, 1], scale: [0.96, 1], y: [-2, 0] }
      case 'drawer-left':
        return { x: ['-100%', '0%'] }
      case 'drawer-right':
        return { x: ['100%', '0%'] }
      case 'drawer-top':
        return { y: ['-100%', '0%'] }
      case 'drawer-bottom':
        return { y: ['100%', '0%'] }
      case 'toast':
        return { opacity: [0, 1], y: [14, 0], scale: [0.95, 1] }
    }
  }

  private getEnterOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
      case 'toast':
        return SPRING_GENTLE
      case 'popover':
      case 'tooltip':
        return SPRING_SNAPPY
      case 'drawer-left':
      case 'drawer-right':
      case 'drawer-top':
      case 'drawer-bottom':
        return { duration: 0.28, ease: IOS_SHEET_CURVE }
    }
  }

  private getExitKeyframes(preset: OverlayPreset): DOMKeyframesDefinition {
    switch (preset) {
      case 'modal':
        return { opacity: [1, 0], scale: [1, 0.95], y: [0, 8] }
      case 'popover':
      case 'tooltip':
        return { opacity: [1, 0], scale: [1, 0.96] }
      case 'drawer-left':
        return { x: ['0%', '-100%'] }
      case 'drawer-right':
        return { x: ['0%', '100%'] }
      case 'drawer-top':
        return { y: ['0%', '-100%'] }
      case 'drawer-bottom':
        return { y: ['0%', '100%'] }
      case 'toast':
        return { opacity: [1, 0], y: [0, 14], scale: [1, 0.95] }
    }
  }

  private getExitOptions(preset: OverlayPreset): AnimationOptions {
    switch (preset) {
      case 'modal':
        return { duration: 0.15 }
      case 'popover':
        return { duration: 0.12 }
      case 'tooltip':
        return { duration: 0.1 }
      case 'drawer-left':
      case 'drawer-right':
      case 'drawer-top':
      case 'drawer-bottom':
        return { duration: 0.22, ease: IOS_SHEET_CURVE }
      case 'toast':
        return { duration: 0.18 }
    }
  }
}
```

---

### 2.4 Architecture of `NumberSpringController` (`number-spring.controller.ts`)

#### 1. Responsibilities & Invariants:
- Accepts numeric target clamped to `[-999_999_999, 999_999_999]` (Requirement 5.6).
- Animates `displayValue` toward `targetValue` using `motion`'s spring engine.
- Ticks on each animation frame and requests a host update.
- When `Math.abs(displayValue - targetValue) <= 0.5`, snaps `displayValue` to `targetValue` and stops playback.
- If `prefersReducedMotion()` is true, immediately snaps to `targetValue` without running the spring loop.
- Cancels active animation loop on `hostDisconnected()` or when a new target arrives to prevent leaks and conflicting ticks.

#### 2. Concrete Implementation Architecture:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { prefersReducedMotion } from '../utils/motion'

export const MIN_NUMBER_VALUE = -999_999_999
export const MAX_NUMBER_VALUE = 999_999_999

export function clampValue(val: number): number {
  if (!Number.isFinite(val)) return 0
  if (val < MIN_NUMBER_VALUE) return MIN_NUMBER_VALUE
  if (val > MAX_NUMBER_VALUE) return MAX_NUMBER_VALUE
  return val
}

export interface NumberSpringControllerOptions {
  initialValue?: number
  stiffness?: number // default: 260
  damping?: number // default: 28
  mass?: number // default: 1
  threshold?: number // default: 0.5
  onUpdate?: (value: number) => void
}

export class NumberSpringController implements ReactiveController {
  public targetValue: number = 0
  public displayValue: number = 0

  private host: ReactiveControllerHost & HTMLElement
  private options: NumberSpringControllerOptions
  private controls: AnimationPlaybackControls | null = null

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: NumberSpringControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.targetValue = clampValue(options.initialValue ?? 0)
    this.displayValue = this.targetValue
    this.host.addController(this)
  }

  public hostConnected(): void {
    // Idle on connect
  }

  public hostDisconnected(): void {
    this.controls?.stop()
    this.controls = null
  }

  public setTarget(newTarget: number): void {
    const clamped = clampValue(newTarget)
    if (clamped === this.targetValue && this.displayValue === this.targetValue) {
      return
    }

    this.targetValue = clamped

    if (prefersReducedMotion()) {
      this.controls?.stop()
      this.controls = null
      this.displayValue = clamped
      this.host.requestUpdate()
      this.options.onUpdate?.(this.displayValue)
      return
    }

    this.controls?.stop()
    this.controls = null

    const threshold = this.options.threshold ?? 0.5
    if (Math.abs(this.displayValue - clamped) <= threshold) {
      this.displayValue = clamped
      this.host.requestUpdate()
      this.options.onUpdate?.(this.displayValue)
      return
    }

    this.controls = animate(this.displayValue, clamped, {
      type: 'spring',
      stiffness: this.options.stiffness ?? 260,
      damping: this.options.damping ?? 28,
      mass: this.options.mass ?? 1,
      onUpdate: (latest: number) => {
        if (Math.abs(latest - this.targetValue) <= threshold) {
          this.displayValue = this.targetValue
          this.controls?.stop()
          this.controls = null
        } else {
          this.displayValue = latest
        }
        this.host.requestUpdate()
        this.options.onUpdate?.(this.displayValue)
      },
    })
  }

  public reset(value: number): void {
    this.controls?.stop()
    this.controls = null
    this.targetValue = clampValue(value)
    this.displayValue = this.targetValue
    this.host.requestUpdate()
  }
}
```

---

### 2.5 Architecture of `FormInternalsController` (`form-internals.controller.ts`)

#### 1. Responsibilities & Invariants:
- Attaches `ElementInternals` to the host element on `hostConnected()` (Requirement 5.7).
- If `this.host.attachInternals` is unsupported, emits `console.warn('[@moul-dev/ui] ElementInternals is not supported in this environment.')`, sets `this.internals = null`, and continues without throwing (Requirement 5.9).
- If the host element has a `name` attribute and is connected outside a `<form>` (`this.internals.form === null`), emits `console.warn('[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.')` (Requirement 9.12).
- When value changes, synchronously calls `internals.setFormValue()` before browser repaint (Requirement 6.7).
- When validity is set, truncates validation message to `<= 200` characters (`message?.slice(0, 200)`), calls `setValidity()`, and invokes `reportValidity()` (Requirement 5.8).
- Note: Web Components standard prohibits calling `attachInternals()` more than once on an element. Therefore, `this.internals` is cached in a private field and preserved across disconnect/reconnect cycles.

#### 2. Concrete Implementation Architecture:

```ts
import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface FormInternalsControllerOptions {
  /**
   * If true, warns when disconnected from form even if element has no `name` attribute.
   */
  requireFormConnection?: boolean
  onReset?: () => void
  onDisabledChange?: (disabled: boolean) => void
  onStateRestore?: (state: unknown, mode: 'restore' | 'autocomplete') => void
}

export class FormInternalsController implements ReactiveController {
  public internals: ElementInternals | null = null

  private host: ReactiveControllerHost & HTMLElement
  private options: FormInternalsControllerOptions
  private isAttached: boolean = false

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: FormInternalsControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    if (typeof this.host.attachInternals !== 'function') {
      console.warn(
        '[@moul-dev/ui] ElementInternals is not supported in this environment.',
      )
      this.internals = null
      return
    }

    if (!this.internals && !this.isAttached) {
      try {
        this.internals = this.host.attachInternals()
        this.isAttached = true
      } catch (err) {
        console.warn('[@moul-dev/ui] Failed to attach ElementInternals:', err)
        this.internals = null
        return
      }
    }

    // Detached form warning (Requirement 9.12)
    const hasName = this.host.hasAttribute('name')
    const requireConnection = this.options.requireFormConnection || hasName
    if (requireConnection && this.internals) {
      const isConnectedToForm = Boolean(this.internals.form)
      if (!isConnectedToForm) {
        console.warn(
          `[@moul-dev/ui] Form-associated element <${this.host.tagName.toLowerCase()}> is not connected to a <form>.`,
        )
      }
    }
  }

  public hostDisconnected(): void {
    // ElementInternals remains attached to the DOM node; no teardown required
  }

  public setValue(
    value: string | File | FormData | null,
    state?: unknown,
  ): void {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(value, state as unknown as undefined)
    }
  }

  public setValidity(
    flags?: Partial<ValidityStateFlags>,
    message?: string,
    anchor?: HTMLElement,
  ): void {
    if (this.internals && typeof this.internals.setValidity === 'function') {
      const truncatedMessage =
        typeof message === 'string' ? message.slice(0, 200) : ''
      this.internals.setValidity(flags, truncatedMessage, anchor)
      this.internals.reportValidity?.()
    }
  }

  public checkValidity(): boolean {
    return this.internals?.checkValidity?.() ?? true
  }

  public reportValidity(): boolean {
    return this.internals?.reportValidity?.() ?? true
  }

  public get form(): HTMLFormElement | null {
    return this.internals?.form ?? null
  }

  public get validity(): ValidityState | null {
    return this.internals?.validity ?? null
  }

  public get validationMessage(): string {
    return this.internals?.validationMessage ?? ''
  }

  public get willValidate(): boolean {
    return this.internals?.willValidate ?? false
  }

  public get labels(): NodeList | null {
    return this.internals?.labels ?? null
  }
}
```

---

### 2.6 Architecture of Barrel Export (`ui/src/controllers/index.ts`)

```ts
/**
 * @moul-dev/ui - Reusable Lit Reactive Controllers
 *
 * Implements cross-cutting reactive behaviors for Web Components:
 * - PressController: Pointer/keyboard press, hover, focus-visible, and tactile spring motion
 * - LayoutIndicatorController: ResizeObserver responsive breakpoints and dimension tracking
 * - OverlayPresenceController: Two-phase mount/unmount and top-layer exit animation orchestration
 * - NumberSpringController: Physics spring numeric ticker with clamping and settling threshold
 * - FormInternalsController: ElementInternals form association, validation, and detached form warnings
 */

export {
  PressController,
  type PressControllerOptions,
} from './press.controller'

export {
  LayoutIndicatorController,
  type LayoutIndicatorControllerOptions,
  type Breakpoint,
  computeBreakpoint,
} from './layout-indicator.controller'

export {
  OverlayPresenceController,
  type OverlayPresenceControllerOptions,
  type OverlayPreset,
} from './overlay-presence.controller'

export {
  NumberSpringController,
  type NumberSpringControllerOptions,
  MIN_NUMBER_VALUE,
  MAX_NUMBER_VALUE,
  clampValue,
} from './number-spring.controller'

export {
  FormInternalsController,
  type FormInternalsControllerOptions,
} from './form-internals.controller'
```

---

### 2.7 Comprehensive Test Suite Architecture (`ui/src/controllers/Controllers.test.ts`)

The test suite must cover 100% of the specifications with adversarial boundary stress tests:
1. **`PressController`**:
   - Initial states: `isPressed: false`, `isHovered: false`, `isFocusVisible: false`.
   - Event updates: Pointerdown -> `isPressed: true`; pointerup -> `isPressed: false`; pointerleave cancels press; pointerenter -> `isHovered: true`.
   - Keyboard: Keydown Space/Enter -> `isPressed: true`, `isFocusVisible: true`; keyup -> `isPressed: false`.
   - Host `aria-pressed`:
     - Synchronized when `type="button"`, `type="checkbox"`, or initial `aria-pressed`.
     - Untouched on hosts without these semantics.
   - Disabled guard:
     - When host has `is-disabled`, `disabled`, or `disabled: true`, press, hover, and motion are suppressed.
   - Reduced motion:
     - When reduced motion is active, does NOT start tactile scale animations.
   - Disconnect:
     - Cleans up all listeners and stops motion controls.
2. **`LayoutIndicatorController`**:
   - Breakpoint mapping verification:
     - `xs` (0..479), `sm` (480..767), `md` (768..1023), `lg` (1024..1279), `xl` (>=1280).
   - Property-based testing with `fast-check` across random positive integers.
   - Update frequency:
     - Requests update only on breakpoint changes by default.
     - Requests update on all dimension changes when `observeDimensions: true`.
   - Disconnect:
     - Calls `observer.disconnect()`.
3. **`OverlayPresenceController`**:
   - Initial: `isOpen: false`, `isMounted: false`.
   - `setOpen(true)`:
     - Mounts (`isMounted = true`), triggers entrance motion, opens `<dialog>`/`[popover]`.
   - `setOpen(false)`:
     - Plays exit motion, awaits completion, closes `<dialog>`/`[popover]`, unmounts (`isMounted = false`).
   - Rapid toggle:
     - `setOpen(true)` -> immediate `setOpen(false)` -> immediate `setOpen(true)` leaves overlay mounted and open without orphaned top-layer state.
   - Reduced motion:
     - Collapses entrance/exit duration to 0.
4. **`NumberSpringController`**:
   - Clamping:
     - `fast-check` property test: all values outside `[-999_999_999, 999_999_999]` clamped accurately. Non-finite values safely clamped to 0.
   - Animation & Snapping:
     - Animates display value toward target; snaps when within `0.5` delta.
   - Reduced motion:
     - Snaps immediately without animation.
   - Disconnect:
     - Cancels active animation playback controls.
5. **`FormInternalsController`**:
   - `attachInternals`:
     - Calls `host.attachInternals()` on `hostConnected()`.
     - Preserves instance across reconnects.
   - Graceful degradation:
     - When `attachInternals` is absent on host, warns with `[@moul-dev/ui] ElementInternals is not supported in this environment.`, sets `internals = null`, does NOT throw.
   - Detached form warning:
     - When host has `name="test"` and is connected outside `<form>`, emits `console.warn` containing `is not connected to a <form>`.
     - When host is inside `<form>`, does NOT warn.
     - When host has no `name` attribute, does NOT warn.
   - `setValue`:
     - Synchronously calls `internals.setFormValue()`.
   - `setValidity`:
     - Truncates message to `<= 200` characters, calls `internals.setValidity()` and `reportValidity()`.

---

## 3. Caveats

1. **`verbatimModuleSyntax` Compliance**:
   Because `ui/tsconfig.app.json` has `verbatimModuleSyntax: true`, any type imports (e.g., `import type { ReactiveController } from 'lit'`) must use `type` modifier. Omitting `type` will cause TypeScript compilation failures during build.
2. **`attachInternals()` Single-Invocation Constraint**:
   According to the WHATWG HTML standard, calling `attachInternals()` more than once on the same element instance throws a `NotSupportedError` `DOMException`. The controller must store the resulting `ElementInternals` instance in a private field and reuse it if the element is disconnected and reconnected.
3. **Happy-DOM `matchMedia` & `requestAnimationFrame`**:
   When testing spring animations in Vitest + happy-dom, `motion` uses `requestAnimationFrame` and microtasks. Tests verifying animation settling should use `await vi.advanceTimersByTimeAsync()` or `await new Promise((r) => setTimeout(r, ...))` to allow `motion` frames to advance cleanly.
4. **Zero-React Dependency Constraint**:
   No code in controllers or tests may import from `react`, `react-dom`, `@stylexjs/stylex`, or `motion/react`. Only pure vanilla `motion` and `lit` are permitted.

---

## 4. Conclusion

The existing `@moul-dev/ui` infrastructure is fully equipped to implement Phase 3:
1. `ui/src/utils/motion.ts` already provides `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, and `prefersReducedMotion()`.
2. `ui/src/utils/focus-trap.ts` already provides `safeShowModal` and `supportsNativePopoverAndAnchor()`.
3. `ui/src/test-setup.ts` already configures `happy-dom` with complete shims for `ElementInternals`, `<dialog>`, `Popover API`, and `MockResizeObserver`.
4. All 5 controllers have concrete, production-ready, type-safe architectures designed above adhering strictly to Requirements 5.1–5.10, 6.7, and 9.12.
5. The implementer can immediately construct `press.controller.ts`, `layout-indicator.controller.ts`, `overlay-presence.controller.ts`, `number-spring.controller.ts`, `form-internals.controller.ts`, `index.ts`, and `Controllers.test.ts` without encountering architectural blockers.

---

## 5. Verification Method

To verify the Phase 3 implementation once completed by the implementer agent:

1. **Verify No React Imports / Dependencies**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected result: Exits with code 0.*

2. **TypeScript Type-Check**:
   ```bash
   node ui/node_modules/.bin/tsc -b ui/tsconfig.app.json
   ```
   *Expected result: Clean exit with code 0 and zero type errors.*

3. **Controller Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts
   ```
   *Expected result: 100% pass across all unit, boundary, and property-based tests.*

4. **Regression Test Suite**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   *Expected result: 71/71 tests pass without regression.*

5. **Biome Lint Check**:
   ```bash
   node_modules/.bin/biome check ui/src/controllers
   ```
   *Expected result: 0 errors.*
