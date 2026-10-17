# Dispatch: Spec Miner for Phases 4–7 Component Library

## Mission
Investigate and document the exact specifications for all 45 Lit Web Components across Phases 4, 5, 6, and 7 of the `@moul-dev/ui` rebuild.

## Authoritative Reference Documents
- `rdt/design.md` (Sections 3, 5, 6, 7, 8.2, 8.3, 8.4, 8.5)
- `rdt/requirements.md` (Requirements 1, 2, 4, 5, 6, 8, 9, 10, 11)
- `rdt/tasks.md` (Phases 4 through 7)
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`

## Required Output
Write a comprehensive, structured `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md` enumerating for each of the 4 categories (Actions, Surfaces & Feedback, Overlays & Navigation, Inputs & Forms):
1. Exact component class name and custom element tag name (`moul-*`).
2. Reactive properties and reflected HTML attributes (type, default value, attribute name).
3. Slots (default and named slots).
4. Custom events dispatched (event name, detail payload interface).
5. Accessibility contracts: WAI-ARIA roles, attributes, states, keyboard interactions, focus management, `warnMissingLabel` triggers.
6. Motion presets and transitions (`motion.dev` / vanilla `motion`, spring curves, entrance/exit sequences).
7. Specific edge cases, form association rules, popover/dialog behavior, and fallback mechanisms.

## 2026-10-16T08:53:56Z
You are spec_miner_p4_7_1. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1.
MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/DISPATCH.md before starting work.
Also study rdt/design.md (Sections 3, 5, 6, 7, 8.2, 8.3, 8.4, 8.5) and rdt/requirements.md (Requirements 1, 2, 4, 5, 6, 8, 9, 10, 11).
Your task is to thoroughly mine and document the exact specifications for all 45 Lit Web Components across Phases 4, 5, 6, and 7 of the @moul-dev/ui rebuild.
Write your complete, structured analysis report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md following the Handoff Protocol (Observation, Logic Chain, Caveats, Conclusion, Verification Method).
When done, send a message to your parent orchestrator with a brief summary and path to your handoff report.
