# Dispatch — Challenger M2.1

## Mission
Adversarially challenge and stress-test the pure Lit sandbox (`ui/src/sandbox.ts`) and dev server integration.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_phase10_m2_1

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_phase10_m2_1/handoff.md

## Scope & Tasks
1. Execute an adversarial test of `ui/src/sandbox.ts`:
   - Verify `<moul-sandbox>` instantiates in DOM without error.
   - Test category tab switching (`all`, `actions`, `surfaces`, `overlays`, `forms`, `charts`, `blocks`).
   - Test theme toggle switching (`light` / `dark` and `.dark` class).
   - Test interactive triggers inside sandbox (e.g. `toastQueue.add`, modal open).
2. Verify Vite dev server transforms `ui/index.html` and `ui/src/sandbox.ts` cleanly.
3. Write your verdict (`APPROVE` or `FAIL`) in `handoff.md`.

## 2026-10-17T13:41:27Z
You are challenger_phase10_m2_1, a teamwork_preview_challenger.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_phase10_m2_1.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_phase10_m2_1/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

Adversarially challenge and stress-test the pure Lit sandbox (ui/src/sandbox.ts) and dev server integration.
Provide your verdict (APPROVE or FAIL) in handoff.md and send a message.

