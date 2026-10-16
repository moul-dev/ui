# Specification Mining Report: Phase 3 (Five Lit Reactive Controllers)

## Observation

Authoritative specification sources were examined across the repository:
1. `rdt/requirements.md`:
   - Line 109–125: Requirement 5 (Acceptance criteria 5.1 through 5.10).
   - Line 128–144: Requirement 6 (Acceptance criteria 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10).
   - Line 156: Requirement 7.4 (LayoutIndicatorController in ChartContainer).
   - Line 186–187, 197–198: Requirement 9.1, 9.2, 9.12 (FormInternalsController usage and detached `<form>` warning).
2. `rdt/design.md`:
   - Line 394–472: Section 6 "Reactive Controllers Specification" (6.1 `PressController`, 6.2 `LayoutIndicatorController`, 6.3 `OverlayPresenceController`, 6.4 `NumberSpringController`, 6.5 `FormInternalsController`).
   - Line 473–555: Section 6.6 "motion.dev Subtle Animation Architecture" (`SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `prefersReducedMotion`, `subtleAnimate`, `animateActiveIndicator`, `stagger`).
   - Line 557–567: "Summary of Subtle motion.dev Animations Across Component Categories".
   - Line 570–600: Section 7 "Native Browser API Integration & Fallbacks" (`supportsNativePopoverAndAnchor`, `safeShowModal`, `restoreFocus`, `trapFocus`).
   - Line 960–985: Section 11.1 & 11.2 "Test Environment (`happy-dom`) & Verification Matrix" (`Controllers.test.ts`).
3. `rdt/tasks.md`:
   - Line 54–73: Phase 3 Tasks 3.1 through 3.6.
4. `.agents/teamwork/ORIGINAL_REQUEST.md`:
   - Line 62–133: Phase 3 user request, requirements, and acceptance criteria.
5. `.agents/teamwork/orchestrator_phase3_1/SCOPE.md`:
   - Line 1–33: Phase 3 architecture, feature inventory, and file layout.
6. Existing Codebase:
   - `ui/src/utils/motion.ts`: exports `SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `CHART_EASE`, `prefersReducedMotion()`, `subtleAnimate()`.
   - `ui/src/utils/focus-trap.ts`: exports `safeShowModal()`, `trapFocus()`, `restoreFocus()`, `supportsNativePopoverAndAnchor()`.
   - `ui/src/test-setup.ts`: contains happy-dom shims for `ElementInternals` (including single-attachment guard throwing `DOMException('NotSupportedError')`), native `<dialog>` (disconnected `showModal` throwing `DOMException('InvalidStateError')`, `close`), Popover API (`showPopover`, `hidePopover`, `togglePopover`, `:popover-open`), and `MockResizeObserver` with `__triggerResize`.
   - Vitest test suite `node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts` passes 71 tests in 705ms.
   - Guard script `bun ./scripts/verify-no-react.ts all` exits with 0.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | PressController | Initial State Properties | Exposes `isPressed`, `isHovered`, and `isFocusVisible` initialized to `false`. | Host element & optional `PressControllerOptions` in constructor. | Reactive boolean getters/fields on controller instance. | N/A (valid booleans initialized upon instantiation). | `rdt/requirements.md` Req 5.1; `rdt/design.md` §6.1 |
| 2 | PressController | Configuration Options Interface | `PressControllerOptions` interface supporting `scaleOnPress` (boolean or number, default 0.97), `hoverLift` (boolean or number, default -2), and `target` (optional element resolver function `() => HTMLElement \| null`). | `options?: PressControllerOptions` | Configures controller animation parameters and animation target. | Unrecognized options fallback to defaults; target returning null safely skips animations. | `rdt/design.md` §6.1 |
| 3 | PressController | Host Lifecycle Management | Automatically registers controller via `host.addController(this)`. In `hostConnected()`, attaches event listeners; in `hostDisconnected()`, cleanly removes all listeners and stops active animations. | Host connect / disconnect lifecycle events. | Clean listener lifecycle without memory leaks. | Re-connecting re-attaches listeners cleanly. | `rdt/design.md` §6.1; Lit `ReactiveController` spec |
| 4 | PressController | Conditional `aria-pressed` Synchronization | Synchronizes host `aria-pressed` attribute to `"true"` or `"false"` ONLY WHEN host has `type="button"`, `type="checkbox"`, or initial `aria-pressed` attribute present on first connection. | Host attributes checked on `hostConnected()`. | Host `aria-pressed` attribute dynamically updated matching `isPressed`. | If host lacks button/checkbox semantics or pre-existing `aria-pressed`, attribute is never added or modified. | `rdt/requirements.md` Req 5.2; `rdt/design.md` §6.1 |
| 5 | PressController | Pointer Press & Release Tracking | Listens for `pointerdown`, `pointerup`, and `pointercancel` on host. Updates `isPressed = true` on primary button down, and `isPressed = false` on up/cancel, calling `host.requestUpdate()`. | `PointerEvent` (`pointerdown`, `pointerup`, `pointercancel`). | `isPressed: boolean`, host `requestUpdate()`, optional `aria-pressed` sync. | Non-primary pointer buttons (`e.button !== 0`) do not trigger press. | `rdt/requirements.md` Req 5.1; `rdt/design.md` §6.1 |
| 6 | PressController | Pointer Hover Tracking | Listens for `pointerenter` and `pointerleave` on host. Sets `isHovered = true` on enter, and `false` on leave, calling `host.requestUpdate()`. | `PointerEvent` (`pointerenter`, `pointerleave`). | `isHovered: boolean`, host `requestUpdate()`. | Hover is ignored if host is disabled. | `rdt/requirements.md` Req 5.1; `rdt/design.md` §6.1 |
| 7 | PressController | Keyboard Press Tracking | Listens for `keydown` and `keyup` on host for Space (`' '`) and Enter (`'Enter'`). Sets `isPressed = true` on non-repeated keydown, and `false` on keyup. | `KeyboardEvent` (`keydown`, `keyup`). | `isPressed: boolean`, host `requestUpdate()`. | Repeated keydown (`e.repeat === true`) is ignored; non-activation keys ignored. | `rdt/design.md` §6.1 |
| 8 | PressController | Focus Visibility Tracking | Listens for `focusin` and `focusout`. Sets `isFocusVisible = true` on keyboard-initiated focus or `:focus-visible`, and `false` on `focusout`. | `FocusEvent` (`focusin`, `focusout`). | `isFocusVisible: boolean`, host `requestUpdate()`. | Mouse/pointer click focus does not flag `isFocusVisible` if browser supports `:focus-visible`. | `rdt/requirements.md` Req 5.1; `rdt/design.md` §6.1 |
| 9 | PressController | Disabled State Guard | Suppresses all press, hover, and focus visible state activations when host has `is-disabled` attribute, `disabled` attribute, or `disabled`/`isDisabled` property. | Host attributes and properties. | All state transitions suppressed; in-flight pressed/hovered states reset. | Disabling element while pressed immediately releases press state and resets scale. | `rdt/design.md` §6.1; `ORIGINAL_REQUEST.md` line 97 |
| 10 | PressController | Tactile Press Scaling Motion | When `scaleOnPress` is enabled, triggers `animate(target, { scale: 0.97 }, SPRING_SNAPPY)` on press start, and springs back to `scale: 1` on press release/cancel. | Press start and end events. | Vanilla `motion` animation controls animating target transform scale. | If `target` resolver returns null, animation is skipped without error. | `rdt/design.md` §6.1, §6.6 |
| 11 | PressController | Hover Elevation Lift Motion | When `hoverLift` is enabled, triggers `animate(target, { y: -2 }, SPRING_GENTLE)` on hover enter, and springs back to `y: 0` on hover leave. | Hover enter and leave events. | Vanilla `motion` animation controls animating target vertical translation. | If reduced motion is requested, lift animation is bypassed. | `rdt/design.md` §6.1, §6.6 |
| 12 | PressController | Reduced Motion Compliance | Checks `prefersReducedMotion()`. When reduced motion is active, suppresses tactile press scaling and hover lift animations. | OS/browser media query `(prefers-reduced-motion: reduce)`. | Animation duration collapsed to 0 or animations bypassed. | No layout disruption; accessibility preferences strictly respected. | `rdt/design.md` §6.1, §6.6; `ORIGINAL_REQUEST.md` line 98 |
| 13 | LayoutIndicatorController | Initial State & Options | Exposes `breakpoint: 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` initialized to `'md'`, `width: number = 0`, and `height: number = 0`. Accepts `LayoutIndicatorOptions` (`observeDimensions?: boolean`). | Host element & optional `LayoutIndicatorOptions`. | Controller state properties. | Valid initial state guarantees no undefined property errors before first resize callback. | `rdt/requirements.md` Req 5.3; `rdt/design.md` §6.2 |
| 14 | LayoutIndicatorController | Responsive Breakpoint Classification | Categorizes observed host width into exact responsive buckets: `0–479px` -> `'xs'`, `480–767px` -> `'sm'`, `768–1023px` -> `'md'`, `1024–1279px` -> `'lg'`, `>= 1280px` -> `'xl'`. | `width: number` from ResizeObserver. | `breakpoint: Breakpoint`. | Negative widths map to `'xs'`; non-integer widths evaluated continuously against threshold boundaries. | `rdt/requirements.md` Req 5.3; `rdt/design.md` §6.2 |
| 15 | LayoutIndicatorController | ResizeObserver Lifecycle | Creates `ResizeObserver` observing host in `hostConnected()`. Calls `disconnect()` and nulls observer in `hostDisconnected()`. | Host connect / disconnect. | Active DOM observation during attachment; zero observer leaks when detached. | Gracefully handles environments without `ResizeObserver` (does not throw). | `rdt/requirements.md` Req 5.3; `rdt/design.md` §6.2 |
| 16 | LayoutIndicatorController | Resize Entry Parsing Resilience | Parses width and height with fallback chain: `entry.contentRect` -> `entry.borderBoxSize[0]` (`inlineSize`, `blockSize`) -> `host.getBoundingClientRect()`. | `ResizeObserverEntry`. | Extracted `width` and `height`. | Undefined or missing sub-properties fall back safely to 0 or client rect. | `rdt/design.md` §6.2; `ui/src/test-setup.ts` line 575 |
| 17 | LayoutIndicatorController | Dimension & Breakpoint Host Update Triggering | Calls `host.requestUpdate()` whenever `breakpoint` changes. If `observeDimensions: true` is passed, ALSO calls `host.requestUpdate()` on any `width` or `height` change (supporting `ChartContainer`). | Resize observer ticks. | Host re-render trigger. | When `observeDimensions` is false (default), dimension updates within the same breakpoint bucket do NOT trigger redundant host renders. | `rdt/design.md` §6.2; `rdt/requirements.md` Req 7.4 |
| 18 | OverlayPresenceController | State & Presets Configuration | Exposes `isOpen: boolean = false` and `isMounted: boolean = false`. Accepts `OverlayPresenceOptions` supporting 8 preset modes: `'modal'`, `'popover'`, `'tooltip'`, `'drawer-left'`, `'drawer-right'`, `'drawer-top'`, `'drawer-bottom'`, `'toast'`. | Host element & `OverlayPresenceOptions`. | Initialized state booleans and active preset configuration. | Defaults mode to `'modal'` if omitted. | `rdt/requirements.md` Req 5.4; `rdt/design.md` §6.3 |
| 19 | OverlayPresenceController | Asynchronous `setOpen` Method | Exposes `setOpen(nextOpen: boolean, targetElement?: Element \| null): Promise<void>`. Manages two-phase mount/open and open/unmount transitions. | `nextOpen: boolean`, optional target DOM node. | Returns `Promise<void>` resolving once entrance or exit transition settles. | Redundant calls with identical state return immediately. | `rdt/design.md` §6.3 |
| 20 | OverlayPresenceController | Entrance Transition & Top-Layer Promotion | On `setOpen(true)`: sets `isMounted = true`, calls `host.requestUpdate()`, awaits host render, promotes native `<dialog>` (`showModal()`) or `[popover]` (`showPopover()`) to top-layer BEFORE animating, then runs preset enter animation. | `setOpen(true)`. | Top-layer promotion, DOM mounting, visual entrance animation. | If dialog is disconnected, catches DOMException via `safeShowModal` with console.warn. | `rdt/design.md` §6.3; `rdt/requirements.md` Req 6.3, 6.10 |
| 21 | OverlayPresenceController | Exit Transition & Top-Layer Cleanup | On `setOpen(false)`: sets `isOpen = false`, calls `host.requestUpdate()`, executes preset exit animation, awaits animation completion, and ONLY THEN calls `dialog.close()` or `popover.hidePopover()` and sets `isMounted = false`. | `setOpen(false)`. | Visual exit animation, top-layer demotion, DOM unmounting. | Prevents premature removal clipping top-layer elements during exit motion. | `rdt/design.md` §6.3; `ORIGINAL_REQUEST.md` line 110 |
| 22 | OverlayPresenceController | Preset Motion Animation Matrix | Implements distinct keyframe and spring/curve configurations: modal (opacity/scale/y with `SPRING_GENTLE`), popover/tooltip (opacity/scale/micro-slide with `SPRING_SNAPPY`), drawers (axis slides with `IOS_SHEET_CURVE`), toast (slide/scale/opacity with `SPRING_GENTLE`). | Preset mode identifier. | Targeted CSS transform and opacity keyframes executed via `animate()`. | Non-standard preset falls back to modal animation. | `rdt/design.md` §6.3, §6.6 |
| 23 | OverlayPresenceController | Concurrency & Race Condition Guard | Tracks transition sequence IDs (`_transitionId++`). If `setOpen(true)` is invoked while exit animation is running, cancels exit animation immediately, halts unmounting/closing, and starts enter animation. | Rapid consecutive calls to `setOpen`. | Clean visual state without flickering, ghost unmounts, or broken top-layer state. | Stale exit callbacks check token and abort unmounting. | `rdt/design.md` §6.3; `ORIGINAL_REQUEST.md` line 111 |
| 24 | OverlayPresenceController | Reduced Motion Override | Bypasses motion delays or sets animation duration to 0 when `prefersReducedMotion()` is true, opening and closing overlays instantly while preserving correct mounting order. | Reduced motion preference. | Instantaneous open/close state transitions. | Top-layer promotion and closing still execute in correct logical sequence. | `rdt/design.md` §6.6 |
| 25 | NumberSpringController | Numeric Value Clamping | Enforces strict clamping range `[-999_999_999, 999_999_999]`. Values below `-999_999_999` clamp to `-999_999_999`; values above `999_999_999` clamp to `999_999_999`. | `value: number` in constructor or `setTarget()`. | Clamped numeric values stored in `targetValue` and `displayValue`. | `NaN` or non-finite inputs fall back safely to 0 (clamped). | `rdt/requirements.md` Req 5.6; `rdt/design.md` §6.4 |
| 26 | NumberSpringController | State Properties & Options | Exposes `targetValue: number` and `displayValue: number`. Accepts options: `stiffness: number = 260`, `damping: number = 28`, `threshold: number = 0.5`. | Host, initial value, `NumberSpringOptions`. | State properties reflecting current interpolated and target values. | Invalid options fall back to spec defaults (stiffness 260, damping 28, threshold 0.5). | `rdt/requirements.md` Req 5.6; `rdt/design.md` §6.4 |
| 27 | NumberSpringController | Spring Animation Engine Loop | `setTarget(value)` animates `displayValue` toward clamped target using `motion`'s spring engine (`animate(from, to, { type: 'spring', stiffness, damping, onUpdate })`). Calls `host.requestUpdate()` on every tick. | New target value via `setTarget()`. | Frame-by-frame updates of `displayValue` and host renders. | Superseded targets immediately cancel previous in-flight spring animation controls. | `rdt/requirements.md` Req 5.6; `rdt/design.md` §6.4 |
| 28 | NumberSpringController | Convergence & Snapping Threshold | When `Math.abs(displayValue - targetValue) <= 0.5`, halts spring loop and snaps `displayValue` exactly to `targetValue`, requesting final host update. | Per-frame spring output value. | Animation halt, snapped final `displayValue`. | Eliminates infinite micro-oscillation or fractional pixel jitter. | `rdt/requirements.md` Req 5.6; `rdt/design.md` §6.4 |
| 29 | NumberSpringController | Disconnect Cleanup | Implements `hostDisconnected()`: stops any active animation playback controls and sets reference to null. | Host disconnection lifecycle. | Animation halt, memory cleanup. | Prevents animation loops running on detached elements. | `rdt/design.md` §6.4; `ORIGINAL_REQUEST.md` line 117 |
| 30 | NumberSpringController | Reduced Motion Immediate Settle | When `prefersReducedMotion()` is true, immediately sets `displayValue = targetValue` and calls `host.requestUpdate()` without entering animation loop. | OS reduced motion setting. | Instant numeric update. | No visual animation delays for users requesting reduced motion. | `rdt/design.md` §6.6 |
| 31 | FormInternalsController | Host Static Requirement | Requires host custom element class to declare `static formAssociated = true` for participation in form submission and validation. | Host element class constructor. | Enables browser form-association pipeline. | Without static flag, browser `attachInternals()` throws or ignores form association. | `rdt/requirements.md` Req 5.7; `rdt/design.md` §6.5 |
| 32 | FormInternalsController | Environment Feature Detection & Warning | In `hostConnected()`, tests `typeof host.attachInternals === 'function'`. If absent, emits `console.warn('[@moul-dev/ui] ElementInternals is not supported in this environment.')`, sets `internals = null`, and continues without throwing. | Host element connection. | `internals: ElementInternals \| null`. | Operates safely in legacy/unsupported environments without crash. | `rdt/requirements.md` Req 5.9; `rdt/design.md` §6.5 |
| 33 | FormInternalsController | Idempotent Attachment Protection | Attaches internals once via `this.internals ??= this.host.attachInternals()`. Prevents duplicate calls that trigger native browser `DOMException('NotSupportedError')`. | Host connect events (including reconnects). | Single stable `ElementInternals` instance. | Reconnecting host to DOM does not attempt second `attachInternals()`. | W3C DOM spec; `ui/src/test-setup.ts` line 203 |
| 34 | FormInternalsController | Detached Form Connection Warning | Emits `console.warn('[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.')` when host has a `name` attribute (or `requireFormConnection: true`) and `internals.form === null`. | Host `name` attribute, `requireFormConnection` option, `internals.form`. | Dev-mode warning diagnostic in console. | Does not warn if element is connected inside a `<form>` or has no `name` attribute unless explicitly configured. | `rdt/requirements.md` Req 9.12; `rdt/design.md` §6.5 |
| 35 | FormInternalsController | Synchronous Form Value Updates | `setValue(value: string \| File \| FormData \| null)` synchronously invokes `internals.setFormValue(value)` before the next browser repaint. | Form value types. | Native form submission payload updated. | Safe no-op if `internals === null`. | `rdt/requirements.md` Req 5.8, Req 6.7; `rdt/design.md` §6.5 |
| 36 | FormInternalsController | Validation Message Truncation & Reporting | `setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement)` clamps validation message to at most 200 characters (`message?.slice(0, 200)`), calls `internals.setValidity()`, and invokes `internals.reportValidity()`. | Validity flags, error message string, optional anchor element. | Form validity state, validation message, browser popup. | Messages exceeding 200 chars are truncated without throwing; no-op if `internals === null`. | `rdt/requirements.md` Req 5.8; `rdt/design.md` §6.5 |
| 37 | FormInternalsController | Standard Form Internals Proxies | Exposes getter helpers: `form`, `validity`, `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`. | Standard ElementInternals queries. | Mirrors native form properties and methods. | Safe defaults returned if `internals === null` (`form: null`, `valid: true`). | `rdt/design.md` §6.5; `ui/src/test-setup.ts` lines 47–62 |
| 38 | Public Controller Barrel | Public Module Exports | `ui/src/controllers/index.ts` exports all five controller classes, options interfaces, and associated union types. | Public module import. | Complete public TypeScript API for library components and consumers. | Clean compilation with zero disallowed React dependencies. | `rdt/requirements.md` Req 5.10; `rdt/tasks.md` Task 3.6 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `PressController` | `pointerdown` on disabled host (`hasAttribute('disabled')` or `hasAttribute('is-disabled')`) | Press event is ignored: `isPressed` remains `false`, no scale animation is triggered, and `aria-pressed` is not updated. |
| 2 | `PressController` | Secondary or tertiary mouse click (`event.button !== 0`, e.g. right-click or middle-click) | Event is ignored: `isPressed` remains `false`. Only primary button (`button === 0`) activates press. |
| 3 | `PressController` | Host element dynamically disabled while `isPressed === true` | On attribute change or next interaction, press state is immediately reset to `false`, visual scale is restored to `1`, and `aria-pressed` reverts to `"false"`. |
| 4 | `PressController` | Host without `type="button"`, `type="checkbox"`, or initial `aria-pressed` (e.g. `<div>` or `<moul-card>`) | Controller does NOT touch or create the `aria-pressed` attribute during press or release. |
| 5 | `PressController` | Host with initial `aria-pressed="false"` or `type="button"` | Controller activates `_shouldSyncAriaPressed`, synchronizes attribute to `"true"` on press and `"false"` on release. |
| 6 | `PressController` | `pointercancel` fired mid-press (e.g. touch gesture interrupted by scroll or OS gesture) | `isPressed` resets to `false`, scale restores to `1`, `aria-pressed` sets to `"false"`, and `host.requestUpdate()` is called. |
| 7 | `PressController` | Keyboard `Space` or `Enter` `keydown` with `event.repeat === true` | Repeat events are ignored, preventing repeated scale animations and duplicate host update requests. |
| 8 | `PressController` | `pointerleave` fired while pointer is pressed | Hover state resets (`isHovered = false`), hover lift is reverted (`y: 0`), while pointer capture / press state is maintained until `pointerup` or cancelled. |
| 9 | `PressController` | `options.target` resolver function returns `null` | Controller updates state and triggers `host.requestUpdate()` normally, skipping DOM animation calls without throwing null dereference errors. |
| 10 | `PressController` | `prefers-reduced-motion: reduce` active during press or hover | State transitions (`isPressed`, `isHovered`) update normally and host re-renders, but physical spring scale and hover lift animations are bypassed. |
| 11 | `LayoutIndicatorController` | Host width exactly at boundary `479px` vs `480px` | `479px` classifies strictly as `'xs'`; `480px` classifies strictly as `'sm'`. |
| 12 | `LayoutIndicatorController` | Host width exactly at boundary `767px` vs `768px` | `767px` classifies strictly as `'sm'`; `768px` classifies strictly as `'md'`. |
| 13 | `LayoutIndicatorController` | Host width exactly at boundary `1023px` vs `1024px` | `1023px` classifies strictly as `'md'`; `1024px` classifies strictly as `'lg'`. |
| 14 | `LayoutIndicatorController` | Host width exactly at boundary `1279px` vs `1280px` | `1279px` classifies strictly as `'lg'`; `1280px` classifies strictly as `'xl'`. |
| 15 | `LayoutIndicatorController` | Negative host width (e.g. `-20px` due to unmeasured or detached styles) | Mapped safely to `'xs'` without throwing or yielding `undefined`. |
| 16 | `LayoutIndicatorController` | Host resized from `800px` to `850px` when `observeDimensions: false` | Both widths fall under `'md'`; breakpoint does not change, so `host.requestUpdate()` is NOT called (avoids redundant re-renders). |
| 17 | `LayoutIndicatorController` | Host resized from `800px` to `850px` when `observeDimensions: true` | Dimension change is detected; `width` updates and `host.requestUpdate()` IS called (satisfying `ChartContainer` viewport redraw). |
| 18 | `LayoutIndicatorController` | Host disconnected and reconnected to DOM | On disconnect, `ResizeObserver` is disconnected; on reconnect, a new observer is established and initial dimensions are re-evaluated. |
| 19 | `OverlayPresenceController` | Calling `setOpen(false)` on an overlay that is already closed (`isOpen === false`, `isMounted === false`) | Early return `Promise.resolve()`; no exit animation or unnecessary updates triggered. |
| 20 | `OverlayPresenceController` | Rapid toggle: `setOpen(false)` called, followed immediately by `setOpen(true)` before exit finishes | In-flight exit animation is cancelled via `controls.stop()`, transaction token invalidates unmount step, dialog is NOT closed, and enter animation starts smoothly. |
| 21 | `OverlayPresenceController` | Host `<dialog>` is disconnected when `setOpen(true)` is called | `safeShowModal` catches the resulting `DOMException('InvalidStateError')`, logs `console.warn`, does not attempt focus, and prevents test suite crash. |
| 22 | `OverlayPresenceController` | Exit transition completes on native `<dialog>` | Exit animation runs while `<dialog>` is open; only when animation completes is `dialog.close()` called and `isMounted = false`, eliminating top-layer clipping. |
| 23 | `OverlayPresenceController` | Unknown preset mode string passed in options | Falls back to default `'modal'` spring animation without runtime exception. |
| 24 | `NumberSpringController` | Target value exceeding upper limit (e.g. `1_500_000_000`) | Value is clamped to `999_999_999`; `targetValue` and animation settle at `999_999_999`. |
| 25 | `NumberSpringController` | Target value below lower limit (e.g. `-2_000_000_000`) | Value is clamped to `-999_999_999`; `targetValue` and animation settle at `-999_999_999`. |
| 26 | `NumberSpringController` | Target value passed as `NaN` or non-numeric | Falls back safely to clamped `0` without creating `NaN` animation states. |
| 27 | `NumberSpringController` | Target delta within snapping threshold (`Math.abs(displayValue - target) <= 0.5`) | Bypasses animation loop entirely; immediately snaps `displayValue = targetValue` and requests single host update. |
| 28 | `NumberSpringController` | Host disconnected while spring animation is ticking | `hostDisconnected()` calls `controls.stop()`, halting frame callbacks and preventing memory leaks on unmounted components. |
| 29 | `FormInternalsController` | Browser environment lacks `attachInternals` support (`typeof host.attachInternals !== 'function'`) | Logs `[@moul-dev/ui] ElementInternals is not supported in this environment.`, sets `internals = null`, does NOT throw; element continues as non-form element. |
| 30 | `FormInternalsController` | Host reconnected to DOM after detachment | Controller reuses existing `internals` instance via `this.internals ??= ...`, avoiding second `attachInternals()` call which throws `DOMException('NotSupportedError')`. |
| 31 | `FormInternalsController` | Form-associated element with `name="username"` rendered outside `<form>` | Emits `[@moul-dev/ui] Form-associated element <moul-text-field> is not connected to a <form>.` console warning on connection. |
| 32 | `FormInternalsController` | Form-associated element with `name="username"` rendered inside `<form>` | No warning emitted; `internals.form` correctly references the parent `<form>`. |
| 33 | `FormInternalsController` | `setValidity` called with error message longer than 200 characters (e.g. 250 chars) | Message is truncated to exactly the first 200 characters (`message.slice(0, 200)`) before being passed to `internals.setValidity()`. |
| 34 | `FormInternalsController` | `setValue` called with `null`, empty string, `File`, or `FormData` | Correctly passes argument synchronously to `internals.setFormValue()`. |
| 35 | `FormInternalsController` | `setValue` or `setValidity` called when `internals === null` | Safe no-op; methods return void without throwing null dereference errors. |

---

## Logic Chain

1. **Reactive Controller Architectural Contract:**
   - In Lit 3, `ReactiveController` hooks into the host's lifecycle through `addController(this)`, `hostConnected()`, and `hostDisconnected()`.
   - Each controller must accept `ReactiveControllerHost & HTMLElement` (or `LitElement`) and immediately call `this.host.addController(this)`.
   - State updates that affect rendering must invoke `this.host.requestUpdate()`.
   - Disconnection must clean up event listeners, observers, and animation frame loops to maintain strict zero-leak ergonomics across single-page applications.

2. **PressController Logic & Motion Decoupling:**
   - Requirement 5.1 and 5.2 specify pointer and focus tracking, plus `aria-pressed` synchronization.
   - Requirement 5.2 states: `aria-pressed` synchronization ONLY applies when `type="button"`, `type="checkbox"`, or `hasAttribute('aria-pressed')` on first connection. Elements without button/checkbox semantics must never have `aria-pressed` injected.
   - Disabled states (`is-disabled` / `disabled`) must guard all interaction. When disabled, pressing or hovering must not trigger state changes or animations. If disabled while active, state and animations must reset.
   - Tactile motion (`scale: 0.97` with `SPRING_SNAPPY` and hover lift `y: -2` with `SPRING_GENTLE`) uses vanilla `motion` (`animate`). If `prefersReducedMotion()` is active, animation durations are 0 or skipped.

3. **LayoutIndicatorController Logic & Breakpoints:**
   - Requirement 5.3 strictly partitions responsive breakpoints into 5 ranges:
     - `0 <= width <= 479` -> `'xs'`
     - `480 <= width <= 767` -> `'sm'`
     - `768 <= width <= 1023` -> `'md'`
     - `1024 <= width <= 1279` -> `'lg'`
     - `width >= 1280` -> `'xl'`
   - By default, host re-renders (`requestUpdate()`) should only occur when the computed `breakpoint` changes, preventing expensive churn during small window resizes.
   - However, when `observeDimensions: true` is passed (specifically required for SVG charts in `ChartContainer` per Req 7.4), any dimension change (`width !== prevWidth || height !== prevHeight`) must trigger `host.requestUpdate()`.
   - `ResizeObserver` must be cleaned up in `hostDisconnected()`.

4. **OverlayPresenceController Logic & Top-Layer Coordination:**
   - Requirement 5.4, 5.5, and 6.2–6.5 dictate the overlay open/close lifecycle for native `<dialog>` and `[popover]`.
   - The primary pitfall in Web Component overlay implementations is premature unmounting or premature top-layer demotion: if `dialog.close()` or `popover.hidePopover()` or template unmounting occurs before the exit animation finishes, the overlay vanishes abruptly without animating.
   - Therefore, `OverlayPresenceController` manages a two-phase lifecycle:
     - On Open: `isMounted = true` -> render -> promote to top-layer (`dialog.showModal()` / `showPopover()`) -> execute enter animation.
     - On Close: `isOpen = false` -> execute exit animation -> await animation completion -> demote from top-layer (`dialog.close()` / `popover.hidePopover()`) -> `isMounted = false`.
   - To handle rapid toggling (e.g. user rapidly opens and closes a modal), a transition transaction ID ensures stale exit callbacks do not close or unmount an overlay that was re-opened.

5. **NumberSpringController Logic & Convergence:**
   - Requirement 5.6 mandates clamping target values to `[-999_999_999, 999_999_999]` and animating `displayValue` via `motion`'s spring engine (stiffness 260, damping 28).
   - Because physics springs theoretically oscillate infinitely with diminishing amplitudes, a snapping threshold (`Math.abs(displayValue - targetValue) <= 0.5`) is required to halt the animation loop and snap to the exact target.
   - On `hostDisconnected()`, any active playback controls must be stopped.

6. **FormInternalsController Logic & Form Participation:**
   - Requirements 5.7, 5.8, 5.9, 6.7, and 9.12 define `ElementInternals` integration.
   - The host class definition must specify `static formAssociated = true`.
   - In environments where `attachInternals` is unsupported (e.g. older browsers or partial test environments), it must emit a warning and set `internals = null` without throwing.
   - In standard browser engines, calling `attachInternals()` more than once on the same element instance throws a native `NotSupportedError`. Thus, `this.internals ??= this.host.attachInternals()` must be used to guarantee single attachment across DOM reconnections.
   - Detached form warning: per Requirement 9.12, if a form-associated element has a `name` attribute or `requireFormConnection: true` and is connected outside a `<form>`, `console.warn` must alert the developer.
   - `setValue()` must synchronously invoke `internals.setFormValue()` before repaint.
   - `setValidity()` must truncate error messages to `<= 200` characters before calling `internals.setValidity()` and `internals.reportValidity()`.

---

## Caveats

1. **Vanilla `motion` DOM vs React Motion:**
   The library strictly bans `motion/react` and `framer-motion` React bindings. All animations must use `motion`'s DOM entrypoint (`import { animate, spring } from 'motion'`).
2. **Happy-DOM Animation Timers in Tests:**
   In `happy-dom`, requestAnimationFrame and Web Animations API rely on simulated timers or resolved microtasks. In tests, asserting mid-flight spring states requires advancing timers (`vi.advanceTimersByTime`) or awaiting settled animations.
3. **No Code Implementation:**
   Per instructions, this report is strictly read-only specification discovery and does not write implementation code.

---

## Conclusion

The technical specifications for Phase 3 (Five Lit Reactive Controllers) are fully mapped, consistent across requirements, design documentation, and test harness shims, and ready for immediate implementation:
- `PressController`: Pointer/keyboard/focus state, `aria-pressed` conditional sync, disabled guards, tactile press and hover lift animations respecting reduced motion.
- `LayoutIndicatorController`: Exact 5-tier responsive breakpoints (`xs`, `sm`, `md`, `lg`, `xl`), dimension observation mode, `ResizeObserver` lifecycle.
- `OverlayPresenceController`: 8 animation preset modes, top-layer timing orchestration (enter after promotion, exit before demotion/unmount), rapid-toggle race protection.
- `NumberSpringController`: Extreme clamping `[-999_999_999, 999_999_999]`, spring physics (stiffness 260, damping 28), 0.5 snapping threshold, disconnect cleanup.
- `FormInternalsController`: `static formAssociated = true`, single `attachInternals()` guard, detached `<form>` warning, synchronous `setFormValue()`, `<= 200` character validity truncation.
- `index.ts`: Barrel export of all 5 controllers and associated interfaces.

---

## Verification Method

1. **Dependency Guard Verification:**
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   Validates zero prohibited React/legacy dependencies exist.

2. **Existing Test Suite Baseline:**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
   ```
   Must pass 100% (71 tests).

3. **Controller Test Suite Execution (Upon Implementation):**
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/controllers/Controllers.test.ts
   ```
   Must pass all unit, edge case, and `fast-check` property tests.

4. **Linter & Typecheck:**
   ```bash
   bun run lint
   ```
