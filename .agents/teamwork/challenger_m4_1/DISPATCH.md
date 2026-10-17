# Dispatch: Challenger 1 for Milestone 4 (Actions & Toggles)

## Mission
Author an empirical adversarial stress test suite verifying `moul-button` and `moul-button-group` under extreme conditions, edge cases, and stress workloads.

## Authoritative References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Worker Handoff: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m4_1/handoff.md`

## Challenge Focus
1. `moul-button`:
   - Burst interaction: 50 rapid synthetic clicks during `is-pending = true` to confirm 0 `press` events fire.
   - Dynamic toggling of `is-disabled` and `is-pending` during active pointer events.
   - Form submission stress: Button `type="submit"` and `type="reset"` inside deeply nested `<form>` elements, detached `<form>`, and dynamically attached forms.
   - Dev warning verification: Mock `console.warn` to assert `warnMissingLabel` triggers exactly once when `is-icon` lacks accessible label, and does NOT trigger when `aria-label` or `aria-labelledby` is provided.
2. `moul-button-group`:
   - Dynamic modification of children (adding/removing buttons dynamically via DOM manipulation).
   - Dynamic switching of `orientation` and `spacing`.
   - Disabled propagation when group is disabled.

## Output
Author challenge tests in `ui/src/components/button-challenge.test.ts`. Execute via Vitest. Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m4_1/handoff.md` with explicit verdict: `APPROVE` or `REQUEST_CHANGES`.

## 2026-10-16T09:25:49Z
You are challenger_m4_1. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m4_1.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m4_1/DISPATCH.md before starting work.
Also review the Worker Handoff at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m4_1/handoff.md.

Author an empirical adversarial stress test suite in ui/src/components/button-challenge.test.ts verifying moul-button and moul-button-group under extreme workloads, rapid click bursts in pending state, dynamic disabled toggling, nested form submissions, and label warning validation.
Run your challenge test suite via Vitest.
Write your challenge report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m4_1/handoff.md with an explicit verdict (APPROVE or REQUEST_CHANGES).
Notify the parent orchestrator via send_message when done.
