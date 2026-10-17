# Dispatch: challenger_m7_1

## 2026-10-16T14:32:00Z
**Mission**: Adversarial stress testing of Text & Form Controls (TextField, NumberField, SearchField, TextArea, Slider, InputOTP, Form).
**Scope**:
- Review Worker Handoff at `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m7_1/handoff.md`.
- Target: Author an empirical adversarial stress test suite in `ui/src/components/forms-challenge.test.ts`.
- Stress test focus:
  1. `moul-form`: Slotted control registration, nested forms, rapid submit/reset cycles, form reset restoring initial values, FormData collection from all formAssociated controls.
  2. `moul-text-field`, `moul-search-field`, `moul-text-area`: Rapid character typing (1000+ chars), pattern validation fuzzing, minLength/maxLength constraints, clear button clicks in SearchField.
  3. `moul-number-field`: Step snapping with arrow keys, min/max boundary clamps, invalid text input handling, decimal precision.
  4. `moul-slider`: Arrow key stepping (ArrowLeft, ArrowRight, Home, End), drag/slide value clamping, min/max limits.
  5. `moul-input-otp`: Paste storm with full length, partial length, alphanumeric filtering, backspace navigation across inputs, invalid shake animation class trigger.
- Execute your test suite:
  - `node ui/node_modules/.bin/vitest run --root ui src/components/forms-challenge.test.ts`
- Deliverable: Write complete handoff report to `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m7_1/handoff.md` with an explicit verdict: `APPROVE` or `REQUEST_CHANGES`. Notify parent via `send_message`.
