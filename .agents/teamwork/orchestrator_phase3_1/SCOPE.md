# Scope: Phase 3 — Five Reactive Controllers

## Architecture
Phase 3 establishes the foundation for cross-cutting reactive behavior across all 54 upcoming Lit web components in `@moul-dev/ui`.
Each controller implements the Lit 3 `ReactiveController` interface and attaches to a `ReactiveControllerHost` (typically a `LitElement` instance):
- `PressController`: Pointer/focus/keyboard state management, host `aria-pressed` synchronization, and optional tactile spring scaling via vanilla `motion`.
- `LayoutIndicatorController`: Container/host dimension observation via `ResizeObserver` mapping width to responsive breakpoints (`xs`, `sm`, `md`, `lg`, `xl`).
- `OverlayPresenceController`: Two-phase open/close lifecycle managing mount state and orchestrating top-layer entrance/exit animations with vanilla `motion` before closing native `<dialog>` or `[popover]`.
- `NumberSpringController`: Numerical value spring animation via `motion`, clamping to `[-999_999_999, 999_999_999]`, ticking on animation frames and snapping within 0.5.
- `FormInternalsController`: Standardized `ElementInternals` bridge for form-associated custom elements (`static formAssociated = true`), providing detached form warnings, synchronous form value updates, and character-truncated validity reporting (`<= 200` chars).
- `index.ts`: Public barrel export for all controllers and their TypeScript interfaces.
- `Controllers.test.ts`: Vitest + `happy-dom` unit and adversarial test suite covering all specifications, edge cases, and stress conditions.

## Feature Inventory
| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|--------|--------|
| 1 | PressController | `press.controller.ts`: pointer/focus tracking, `aria-pressed` sync, `is-disabled` guard, `prefersReducedMotion` check, optional tactile scale (`0.97`) and hover lift (`-2px`). | M3.1 | DONE | Tasks 3.1 & Req 5.1, 5.2 |
| 2 | LayoutIndicatorController | `layout-indicator.controller.ts`: ResizeObserver lifecycle, `xs|sm|md|lg|xl` breakpoints, optional dimension tracking (`width`, `height`), host requestUpdate. | M3.1 | DONE | Tasks 3.2 & Req 5.3 |
| 3 | OverlayPresenceController | `overlay-presence.controller.ts`: `isOpen` / `isMounted` states, 8 preset modes (`modal`, `popover`, `tooltip`, `drawer-*`, `toast`), entrance/exit motion, no clipping before dialog.close() / popover.hidePopover(). | M3.1 | DONE | Tasks 3.3 & Req 5.4, 5.5 |
| 4 | NumberSpringController | `number-spring.controller.ts`: Value clamping `[-999_999_999, 999_999_999]`, spring interpolation via `motion`, 0.5 settle threshold, disconnect cleanup. | M3.1 | DONE | Tasks 3.4 & Req 5.6 |
| 5 | FormInternalsController | `form-internals.controller.ts`: `ElementInternals` lifecycle, unsupported warning, detached `<form>` warning on named host, synchronous `setFormValue`, `setValidity` `<= 200` chars, `reportValidity`. | M3.1 | DONE | Tasks 3.5 & Req 5.7, 5.8, 5.9, 6.7, 9.12 |
| 6 | Public Exports & Types | `index.ts`: Barrel exports of all 5 controller classes and options/types. | M3.1 | DONE | Task 3.6 & Req 5.10 |
| 7 | Comprehensive & Adversarial Tests | `Controllers.test.ts`: Complete unit, boundary, lifecycle, and adversarial test coverage with Vitest + happy-dom. | M3.1 | DONE | Task 3.6 & Req 5.10 |

## Code Layout
- `ui/src/controllers/press.controller.ts` (Done)
- `ui/src/controllers/layout-indicator.controller.ts` (Done)
- `ui/src/controllers/overlay-presence.controller.ts` (Done)
- `ui/src/controllers/number-spring.controller.ts` (Done)
- `ui/src/controllers/form-internals.controller.ts` (Done)
- `ui/src/controllers/index.ts` (Done)
- `ui/src/controllers/Controllers.test.ts` (Done)
- `ui/src/controllers/press-layout-overlay-challenge.test.ts` (Done - Challenger suite)
- `ui/src/controllers/controllers-challenge.test.ts` (Done - Challenger suite)
