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
  FormInternalsController,
  type FormInternalsControllerOptions,
} from './form-internals.controller'

export {
  type Breakpoint,
  computeBreakpoint,
  LayoutIndicatorController,
  type LayoutIndicatorControllerOptions,
} from './layout-indicator.controller'
export {
  clampValue,
  MAX_NUMBER_VALUE,
  MIN_NUMBER_VALUE,
  NumberSpringController,
  type NumberSpringControllerOptions,
} from './number-spring.controller'
export {
  OverlayPresenceController,
  type OverlayPresenceControllerOptions,
  type OverlayPreset,
} from './overlay-presence.controller'
export {
  PressController,
  type PressControllerOptions,
} from './press.controller'
