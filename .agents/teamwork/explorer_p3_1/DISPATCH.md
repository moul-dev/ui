## 2026-10-16T08:04:06Z
You are an Explorer agent (teamwork_preview_explorer).
Your working directory is: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p3_1
You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md first before starting work.

Also read:
- /Users/phearak/github/orgs/moul-dev/ui/rdt/requirements.md (Requirement 5, Requirement 6)
- /Users/phearak/github/orgs/moul-dev/ui/rdt/design.md (Section 6: Reactive Controllers Specification)
- /Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md (Phase 3: Tasks 3.1–3.6)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase3_1/SCOPE.md

Objective:
Investigate existing codebase infrastructure and propose concrete implementation architectures for all 5 controllers:
1. Examine existing utilities in `ui/src/utils/`:
   - `ui/src/utils/motion.ts`: What motion exports are available? (`SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`, `prefersReducedMotion()`, `subtleAnimate()`, etc.). How can `animate` from `motion` be utilized cleanly?
   - `ui/src/utils/focus-trap.ts`: What helpers exist (`safeShowModal`, `supportsNativePopoverAndAnchor`)?
   - `ui/src/styles/`: Any relevant style or token helpers.
2. Examine `ui/package.json` and Lit 3 setup:
   - What imports from `lit` should be used? (`ReactiveController`, `ReactiveControllerHost`, `LitElement`).
   - Confirm TypeScript configuration and build compatibility.
3. For each of the 5 controllers:
   - Provide concrete TypeScript signatures, constructor parameters, lifecycle methods (`hostConnected`, `hostDisconnected`, `hostUpdate`), event listener bindings and unbindings.
   - Detail how DOM events are bound (with bound handler references to enable clean `removeEventListener` in `hostDisconnected`).
   - Detail how `prefersReducedMotion` and disabled host states are handled.
   - Detail how `OverlayPresenceController` manages animation promises, top-layer transitions, and cleanup.
   - Detail how `NumberSpringController` manages frame cancellation (`cancelAnimationFrame` or `motion` controls stop) on disconnect or new target.
   - Detail how `FormInternalsController` handles types and graceful degradation.
4. Detail the barrel export structure in `ui/src/controllers/index.ts`.

Scope boundaries:
Do NOT write or modify implementation code. You are read-only.
Write your full findings to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p3_1/handoff.md`.
When finished, send a message to orchestrator conversation ID: eeaa25a1-acbd-4ee2-ba8e-88706ecbc8d5.
