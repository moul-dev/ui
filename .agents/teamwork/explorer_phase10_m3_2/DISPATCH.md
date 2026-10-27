# Dispatch — Explorer M3.2

## Mission
Design and draft the contract verification test suite in `ui/src/components/Foundation.test.ts` for Milestone 3.

## Working Directory
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2

## Authoritative Requirements & Inputs
Read:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase10_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_survey_3/handoff.md

## Scope & Tasks
1. Design `ui/src/components/Foundation.test.ts` to test:
   - Export contracts: all 54 component classes, companion elements (77 custom elements), 5 reactive controllers, `toastQueue`, `generatePagination`, and 7 log parsers/constants are exported from `ui/src/index.ts`.
   - Zero React imports: no banned packages (`react`, `react-dom`, `@stylexjs/*`, etc.) are imported.
   - Idempotent `customElements.define` registrations: calling `defineElement(tag, ctor)` emits `console.warn` without throwing; `customElements.get(tag)` returns the valid constructor.
   - Tag Map Parity: verify all 77 `moul-*` tags match their class types.
2. Provide complete, verified source code in `handoff.md`.

## 2026-10-17T13:49:19Z
You are explorer_phase10_m3_2, a teamwork_preview_explorer.
Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2.
Your caller/parent orchestrator is dae9e90c-c048-4fc8-8e06-169a5a42bbad.

Read your dispatch instructions at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_phase10_m3_2/DISPATCH.md
and authoritative requirements at /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md (Phase 10: 2026-10-17T12:40:55Z).

Your task:
1. Design and draft the contract verification test suite ui/src/components/Foundation.test.ts:
   - Verify export contracts: all 54 component classes, companion elements (77 custom elements), 5 reactive controllers, toastQueue, generatePagination, and 7 log parsers/constants from ui/src/index.ts.
   - Verify zero React imports.
   - Verify idempotent customElements.define registrations: defineElement warnings, customElements.get(tag).
   - Verify HTMLElementTagNameMap typing.
2. Provide complete, verified source code in handoff.md and message the orchestrator.
