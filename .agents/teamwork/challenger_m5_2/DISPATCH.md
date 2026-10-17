# Dispatch: Challenger 2 for Milestone 5 (Surfaces & Feedback)

## Mission
Author an empirical adversarial stress test suite in `ui/src/components/table-toast-challenge.test.ts` verifying `moul-table` and `moul-toast` / `toastQueue` under extreme workloads, large datasets, and rapid asynchronous lifecycles.

## Authoritative References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Worker Handoff: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/handoff.md`

## Challenge Focus
1. `moul-table`:
   - 100+ rows dataset rendering and sorting performance.
   - Dynamic sorting toggling (`asc` -> `desc` -> `none`) across multiple columns.
   - Selection state integrity under continuous dynamic filtering / dataset replacement.
   - Rapid toggling between `is-loading="true"` and `is-loading="false"`.
2. `moul-toast` & `toastQueue`:
   - Rapid addition of 50 toasts via `toastQueue.add()`.
   - Rapid dismissal via `toastQueue.close()` and `toastQueue.clear()`.
   - Top-layer manual popover lifecycle timing and cleanup without DOM leaks.
   - Timers test with `vi.useFakeTimers()` advancing by duration.

## Output
Author challenge tests in `ui/src/components/table-toast-challenge.test.ts`. Execute via Vitest. Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_2/handoff.md` with explicit verdict: `APPROVE` or `REQUEST_CHANGES`.


## 2026-10-16T10:09:29Z
You are challenger_m5_2. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_2.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_2/DISPATCH.md before starting work.
Also review the Worker Handoff at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m5_1/handoff.md.

Author an empirical adversarial stress test suite in ui/src/components/table-toast-challenge.test.ts verifying moul-table and moul-toast / toastQueue under extreme workloads (100+ rows table sorting/selection, rapid toastQueue addition/dismissal, top-layer manual popover lifecycle timing).
Run your challenge test suite via Vitest.
Write your challenge report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_2/handoff.md with an explicit verdict (APPROVE or REQUEST_CHANGES).
Notify the parent orchestrator via send_message when done.
