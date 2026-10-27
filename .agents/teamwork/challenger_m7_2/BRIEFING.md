# BRIEFING — 2026-10-16T14:35:00Z

## Mission
Adversarial stress testing of Selection & Picker Controls (Checkbox/Group, RadioGroup, Switch, Select, ComboBox, Calendar, DatePicker) under extreme workloads.

## 🔒 My Identity
- Archetype: challenger
- Roles: critic, specialist
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m7_2
- Original parent: 8ce10391-b075-41f8-9af9-fa6eb0c45e28
- Milestone: milestone_7
- Instance: 2 of 2

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code.
- Must verify everything empirically by writing and running vitest tests.
- Deliver challenge suite in ui/src/components/pickers-challenge.test.ts.
- Deliver handoff report with explicit verdict (APPROVE or REQUEST_CHANGES).
- Target components: Checkbox, CheckboxGroup, RadioGroup, Switch, Select, ComboBox, Calendar, DatePicker.

## Current Parent
- Conversation ID: 8ce10391-b075-41f8-9af9-fa6eb0c45e28
- Updated: 2026-10-16T14:35:00Z

## Review Scope
- **Files to review**:
  - `ui/src/components/Checkbox/`
  - `ui/src/components/CheckboxGroup/`
  - `ui/src/components/RadioGroup/`
  - `ui/src/components/Switch/`
  - `ui/src/components/Select/`
  - `ui/src/components/ComboBox/`
  - `ui/src/components/Calendar/`
  - `ui/src/components/DatePicker/`
  - `ui/src/components/Forms.test.ts`
- **Interface contracts**: `.agents/teamwork/PROJECT.md`, `ORIGINAL_REQUEST.md`, `rdt/tasks.md`
- **Review criteria**: Behavioral correctness under stress, rapid selection flips, roving focus, arrow navigation, popover dropdown storms, boundary clamps, event emission safety, form association.

## Attack Surface
- **Hypotheses tested**:
  - Checkbox & CheckboxGroup: Rapid parity under 50 toggles, aggregate value emission, child event deduplication, disabled propagation, indeterminate state transitions.
  - RadioGroup & Radio: 50-click mutual exclusion, arrow key roving navigation, circular wrapping, disabled radio skipping.
  - Switch: 100-click rapid toggling, keyboard toggle (Enter/Space), disabled suppression, FormInternals integration.
  - Select & ComboBox: 50-item dropdown burst (open/close storm), keyboard navigation, circular wrapping, filtering, custom value commit, active element key event propagation.
  - Calendar & DatePicker: Month navigation bursts (24 forward, 36 backward, 120 decade jump), boundary clamps (minDate/maxDate), keyboard traversal, locale formatting, popover selection flow.
- **Vulnerabilities found**:
  1. `MoulCheckboxGroup` wipes out declarative child `<moul-checkbox is-disabled>` state on initial `willUpdate` cycle (`CHAL-CKG-05`).
  2. `MoulRadioGroup` wipes out declarative child `<moul-radio is-disabled>` state on initial `willUpdate` cycle, breaking roving focus skipping of disabled radios (`CHAL-RAD-03`).
  3. `MoulComboBox` drops all sequential keyboard navigation events (ArrowDown, ArrowUp, Enter, Escape) once focus is transferred to an option, because `@keydown` is attached exclusively to the `<input>` element (`CHAL-CMB-05`).
- **Untested angles**: Virtualized collection rendering for 10,000+ items (out of scope for Phase 7).

## Key Decisions Made
- Authored 35 empirical adversarial stress tests in `ui/src/components/pickers-challenge.test.ts`.
- Verified 32 tests passing, 3 tests failing with deterministic empirical reproduction.
- Issued verdict `REQUEST_CHANGES`.

## Artifact Index
- `ui/src/components/pickers-challenge.test.ts` — Empirical stress test suite (35 tests).
- `.agents/teamwork/challenger_m7_2/handoff.md` — Final challenge report and verdict.
- `.agents/teamwork/challenger_m7_2/progress.md` — Liveness and progress tracking.
