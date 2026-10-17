# Dispatch: Worker for Milestone 5 (Surface & Feedback Components)

## Mission
Implement Phase 5 of the `@moul-dev/ui` Lit Web Components rebuild:
1. `moul-typography` (`ui/src/components/Typography/`)
2. `moul-kbd` (`ui/src/components/Kbd/`)
3. `moul-separator` (`ui/src/components/Separator/`)
4. `moul-spinner` (`ui/src/components/Spinner/`) — verify/enhance existing M4 implementation
5. `moul-skeleton` (`ui/src/components/Skeleton/`)
6. `moul-badge` (`ui/src/components/Badge/`)
7. `moul-card` (`ui/src/components/Card/`)
8. `moul-empty-state` (`ui/src/components/EmptyState/`)
9. `moul-alert` (`ui/src/components/Alert/`)
10. `moul-progress-bar` (`ui/src/components/ProgressBar/`)
11. `moul-avatar` & `moul-avatar-group` (`ui/src/components/Avatar/`)
12. `moul-tag` & `moul-tag-group` (`ui/src/components/TagGroup/`)
13. `moul-table` (`ui/src/components/Table/`)
14. `moul-toast` & singleton `toastQueue` (`ui/src/components/Toast/`)
15. Comprehensive test suite in `ui/src/components/Surfaces.test.ts`
16. Update public barrel exports in `ui/src/index.ts`
17. Mark Tasks 5.1 through 5.8 in `rdt/tasks.md` as `[x]` upon passing all tests.

## Mandatory Reading & References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Spec Miner Report: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md` (Lines 132–420 for Category 5 specs)
- Architecture Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_1/handoff.md`
- Test Framework Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2/handoff.md`

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Technical Specifications & Key Invariants
1. Pure Lit 3 Custom Elements:
   - Extend `LitElement`, register idempotently via `defineElement('moul-*', ...)`.
   - Declare properties using `static override properties = { ... }` with defaults in constructor to prevent field shadowing.
   - Augment `HTMLElementTagNameMap` in each component file.
2. 3-Layer Styling:
   - Combine `resetStyles`, `semanticToneStyles` (for elements supporting tone and variant: Card, Badge, Alert, Tag, Toast, ProgressBar), and component-specific `css`.
   - Preserve 25 tone × variant combinations with `@supports (backdrop-filter: blur(12px))` and non-blur fallback.
3. Specific Component Logic:
   - `moul-avatar`: Compute up to 2 initials fallback when `src` is empty or on `error` event; `moul-avatar-group` manages negative margin overlap and `+N` badge.
   - `moul-table`: When `isLoading` is true, render `moul-skeleton` rows instead of data rows. Handle sort rotation and row selection.
   - `moul-toast` + `toastQueue`: Top-layer promotion with `popover="manual"` and `OverlayPresenceController` with `'toast'` preset.
   - `moul-progress-bar`: Clamp value to 0–100, set `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`.
   - `moul-empty-state`: Staggered entrance animation for slotted children.
   - `moul-alert`: Dismiss animation before emitting `dismiss`.
4. Legacy Purge:
   - Remove legacy React `.tsx` files in the touched component directories.
5. Verification Commands:
   - Test suite: `node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts`
   - Regression tests: `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts`
   - Zero-React guard: `bun ./scripts/verify-no-react.ts all`
   - Lint/Format: `node_modules/.bin/biome check`

## Output
Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/handoff.md` detailing observation, implemented files, test commands and outcomes, caveats, and conclusions.


## 2026-10-16T09:39:01Z
You are worker_m5_1. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/DISPATCH.md before starting work.
Also study:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md (Lines 132–420 for Category 5 specs)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_1/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2/handoff.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task is to implement Milestone 5 (Phase 5: Surface & Feedback Components — 16 components):
1. Typography (MoulTypography in ui/src/components/Typography/)
2. Kbd (MoulKbd in ui/src/components/Kbd/)
3. Separator (MoulSeparator in ui/src/components/Separator/)
4. Spinner (MoulSpinner in ui/src/components/Spinner/)
5. Skeleton (MoulSkeleton in ui/src/components/Skeleton/)
6. Badge (MoulBadge in ui/src/components/Badge/)
7. Card (MoulCard in ui/src/components/Card/)
8. EmptyState (MoulEmptyState in ui/src/components/EmptyState/)
9. Alert (MoulAlert in ui/src/components/Alert/)
10. ProgressBar (MoulProgressBar in ui/src/components/ProgressBar/)
11. Avatar & AvatarGroup (MoulAvatar, MoulAvatarGroup in ui/src/components/Avatar/)
12. Tag & TagGroup (MoulTag, MoulTagGroup in ui/src/components/TagGroup/)
13. Table (MoulTable in ui/src/components/Table/)
14. Toast & toastQueue (MoulToast, toastQueue in ui/src/components/Toast/)
15. Author comprehensive test suite in ui/src/components/Surfaces.test.ts
16. Update barrel exports in ui/src/index.ts
17. Mark Tasks 5.1 through 5.8 in rdt/tasks.md as [x].
18. Run test suite: node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts and regression suites.
19. Run bun ./scripts/verify-no-react.ts all and bun run lint.

Write your complete handoff report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/handoff.md following the Handoff Protocol.
When done, notify the parent orchestrator via send_message.
