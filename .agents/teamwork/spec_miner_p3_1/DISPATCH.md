## 2026-10-16T08:04:06Z

You are a Spec Miner agent (teamwork_preview_spec_miner).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p3_1
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md first before starting work.

Also read:
- /Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md (Requirement 5: Five Reactive Controllers, Requirement 6: Native Browser API Integration, Requirement 9.12)
- /Users/phearak/github/orgs/moul-dev/ui/rdt/design.md (Section 6: Reactive Controllers Specification, Section 9)
- /Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md (Phase 3: Tasks 3.1–3.6)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase3_1/SCOPE.md

Objective:
Mine and document the exhaustive technical specification for Phase 3 (Five Lit Reactive Controllers):
1. `PressController` (`ui/src/controllers/press.controller.ts`):
   - State properties (`isPressed`, `isHovered`, `isFocusVisible`), initial values.
   - Options interface (`scaleOnPress`, `hoverLift`, `target`).
   - Event listeners attached to host in `hostConnected()` and cleaned up in `hostDisconnected()`.
   - Host `aria-pressed` synchronization conditions (`type="button"`, `type="checkbox"`, or initial `hasAttribute('aria-pressed')`).
   - Motion integration (`scale: 0.97` with `SPRING_SNAPPY`, hover lift `y: -2`), `prefersReducedMotion()`, `is-disabled` / `disabled` attribute & property guards.
2. `LayoutIndicatorController` (`ui/src/controllers/layout-indicator.controller.ts`):
   - State properties (`breakpoint`, `width`, `height`), initial values.
   - Options interface (`observeDimensions`).
   - Breakpoint exact ranges: `xs` (0–479), `sm` (480–767), `md` (768–1023), `lg` (1024–1279), `xl` (>=1280).
   - ResizeObserver lifecycle (`hostConnected`, `hostDisconnected`, contentRect/borderBoxSize parsing, host `requestUpdate`).
3. `OverlayPresenceController` (`ui/src/controllers/overlay-presence.controller.ts`):
   - State properties (`isOpen`, `isMounted`), initial values.
   - Preset modes (`modal`, `popover`, `tooltip`, `drawer-left`, `drawer-right`, `drawer-top`, `drawer-bottom`, `toast`).
   - Methods: `setOpen(nextOpen: boolean, targetElement?: Element | null): Promise<void>`.
   - Enter and exit animations per preset mode using vanilla `motion` (`SPRING_GENTLE`, `SPRING_SNAPPY`, `IOS_SHEET_CURVE`, durations).
   - Dialog and popover top-layer timing: top-layer promotion before enter animation; exit animation completion BEFORE `dialog.close()` or `popover.hidePopover()` or unmounting.
   - Concurrency / race condition protection (rapid toggling).
4. `NumberSpringController` (`ui/src/controllers/number-spring.controller.ts`):
   - State properties (`targetValue`, `displayValue`), initial values.
   - Clamping range: `[-999_999_999, 999_999_999]`.
   - Methods: `setTarget(value: number)`.
   - Spring configuration (`type: 'spring'`, stiffness 260, damping 28), animation frame update loop, snapping threshold `<= 0.5`.
   - Host requestUpdate on each tick and cleanup on `hostDisconnected`.
5. `FormInternalsController` (`ui/src/controllers/form-internals.controller.ts`):
   - State property (`internals: ElementInternals | null`).
   - Host static requirement (`static formAssociated = true`).
   - Options interface (`requireFormConnection`).
   - Feature detection for `this.host.attachInternals`. Console warning on unsupported environments setting `internals = null` without throwing.
   - Detached form warning (`[@moul-dev/ui] Form-associated element <...> is not connected to a <form>.`) if host has `name` or `requireFormConnection: true` and `internals.form === null`.
   - `setValue(value: string | File | FormData | null)`: synchronous call to `internals.setFormValue(value)`.
   - `setValidity(flags: ValidityStateFlags, message?: string, anchor?: HTMLElement)`: message truncation to `<= 200` chars (`message?.slice(0, 200)`), calls `internals.setValidity(flags, truncatedMessage, anchor)` and `internals.reportValidity()`.
6. Public API barrel exports in `ui/src/controllers/index.ts`.

Scope boundaries:
Do NOT write or modify implementation code. You are read-only.
Write your full findings to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p3_1/handoff.md`.
When finished, send a message to orchestrator conversation ID: eeaa25a1-acbd-4ee2-ba8e-88706ecbc8d5.
