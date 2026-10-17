# Dispatch: Worker for Milestone 5 Iteration 2 (Surfaces Remediation)

## Mission
Remediate the empirical findings identified by `challenger_m5_1` and `reviewer_m5_1` in Milestone 5:
1. `ui/src/components/Avatar/Avatar.ts`:
   - Fix `getInitials`: When `name` is empty or whitespace-only (`name.trim().length === 0`), return `''` safely so it falls back to the SVG avatar fallback without throwing `TypeError`.
   - Fix image error recovery on `src` change: When `src` changes in `updated(changedProperties)` (or `willUpdate`), reset `hasImageError = false` so the new image has a chance to load.
2. `ui/src/components/Avatar/AvatarGroup.ts`:
   - Fix `size` cascading: Ensure `moul-avatar-group[size="..."]` correctly cascades its size to slotted `moul-avatar` elements.
3. `ui/src/components/Badge/Badge.ts`:
   - Implement `isDot: boolean = false` (`is-dot`) property and style to support dot badge presentation.
4. Run all tests to confirm 100% pass:
   - `node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts src/components/surfaces-challenge.test.ts src/components/table-toast-challenge.test.ts src/components/Actions.test.ts`
   - `bun ./scripts/verify-no-react.ts all`
   - `node_modules/.bin/biome check`

## Authoritative References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Challenger 5-1 Report: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_1/handoff.md`

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Output
Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_2/handoff.md` detailing changes and test execution results.


## 2026-10-16T10:20:08Z
[Message] timestamp=2026-10-16T10:20:08Z sender=8ce10391-b075-41f8-9af9-fa6eb0c45e28 priority=MESSAGE_PRIORITY_HIGH content=You are worker_m5_2. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_2.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_2/DISPATCH.md before starting work.
Also study:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_1/handoff.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task is to remediate the findings in Milestone 5:
1. ui/src/components/Avatar/Avatar.ts:
   - Handle empty and whitespace-only name strings in getInitials without throwing TypeError.
   - Reset hasImageError when src property changes in updated(changedProperties) so image retries on new src.
2. ui/src/components/Avatar/AvatarGroup.ts:
   - Fix size cascading from MoulAvatarGroup to slotted MoulAvatar instances.
3. ui/src/components/Badge/Badge.ts:
   - Support isDot: boolean = false (is-dot) and style for compact dot badge.
4. Run tests:
   - node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts src/components/surfaces-challenge.test.ts src/components/table-toast-challenge.test.ts src/components/Actions.test.ts
   - bun ./scripts/verify-no-react.ts all
   - node_modules/.bin/biome check ui/src/components/Avatar ui/src/components/Badge ui/src/components/Surfaces.test.ts

Write your handoff report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_2/handoff.md following the Handoff Protocol.
When done, notify the parent orchestrator via send_message.


## 2026-10-16T13:02:38Z
[Message] timestamp=2026-10-16T13:02:38Z sender=8ce10391-b075-41f8-9af9-fa6eb0c45e28 priority=MESSAGE_PRIORITY_HIGH content=**Context**: Server restarted after quota reset.
**Content**: Your progress.md indicated that remediation code, tests (97/97 passed), verify-no-react, and biome checks were completed before the pause. Please write your handoff.md in /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_2/handoff.md and report back with your completion message.
**Action**: Write handoff.md and report back.
