# Dispatch: challenger_m7_2

## 2026-10-16T14:32:00Z
**Mission**: Adversarial stress testing of Selection & Picker Controls (Checkbox/Group, RadioGroup, Switch, Select, ComboBox, Calendar, DatePicker).
**Scope**:
- Review Worker Handoff at `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m7_1/handoff.md`.
- Target: Author an empirical adversarial stress test suite in `ui/src/components/pickers-challenge.test.ts`.
- Stress test focus:
  1. `moul-checkbox` & `moul-checkbox-group`: 50 rapid toggle clicks, aggregate array value emission without duplicate child event leaking, indeterminate state transitions.
  2. `moul-radio-group`: Arrow key roving navigation (ArrowDown, ArrowUp), circular wrapping, disabled radio skipping.
  3. `moul-switch`: Tactile toggles, disabled state suppression.
  4. `moul-select` & `moul-combobox`: 50 items dropdown open/close storm, keyboard selection (ArrowDown, Enter, Escape), search query filtering in ComboBox, custom value commit.
  5. `moul-calendar` & `moul-date-picker`: Month navigation buttons (previous/next), decade jumps, minDate/maxDate boundary clamps, date selection event dispatches.
- Execute your test suite:
  - `node ui/node_modules/.bin/vitest run --root ui src/components/pickers-challenge.test.ts`
- Deliverable: Write complete handoff report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m7_2/handoff.md` with an explicit verdict: `APPROVE` or `REQUEST_CHANGES`. Notify parent via `send_message`.
