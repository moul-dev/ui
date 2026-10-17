# Dispatch: Worker for Milestone 4 (Actions & Toggle Components)

## Mission
Implement Phase 4 of the `@moul-dev/ui` Lit Web Components rebuild:
1. `moul-button` (`MoulButton` in `ui/src/components/Button/`)
2. `moul-button-group` (`MoulButtonGroup` in `ui/src/components/ButtonGroup/`)
3. `moul-toggle-button` (`MoulToggleButton` in `ui/src/components/ToggleButton/`)
4. `moul-toggle-button-group` (`MoulToggleButtonGroup` in `ui/src/components/ToggleButtonGroup/`)
5. Supporting `moul-spinner` (`MoulSpinner` in `ui/src/components/Spinner/`) for `is-pending` inline spinner
6. Comprehensive test suite in `ui/src/components/Actions.test.ts`
7. Mark Tasks 4.1–4.5 in `rdt/tasks.md` as `[x]` upon passing all tests.

## Mandatory Reading & References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Spec Miner Report: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md`
- Architecture Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_1/handoff.md`
- Test Framework Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2/handoff.md`

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Technical Specifications
### 1. `MoulButton` (`moul-button`)
- Variants: `'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger' | 'danger-soft'` (default `'primary'`, reflected attribute `variant`).
- Sizes: `'sm' | 'md' | 'lg'` (default `'md'`, reflected attribute `size`).
- Types: `'button' | 'submit' | 'reset'` (default `'button'`, reflected attribute `type`).
- Attributes: `is-icon` (`boolean`), `is-disabled` (`boolean`), `is-pending` (`boolean`).
- Slots: default (label/content), `prefix`, `suffix`.
- Events: `press` (`CustomEvent<{ originalEvent?: Event }>`).
- Motion: `PressController` with `scaleOnPress: 0.97` (`SPRING_SNAPPY`), hover lift, and pending spinner transition.
- Dev-only warning: `warnMissingLabel(this, 'icon-only button')` when `is-icon` is true without `aria-label` or `aria-labelledby`.
- Pending state: `aria-busy="true"` on host and inner button, renders inline spinner, inhibits `press` event.
- Form integration: If `type="submit"` and inside a `<form>`, dispatches requestSubmit / submits form.

### 2. `MoulButtonGroup` (`moul-button-group`)
- Attributes: `orientation` (`'horizontal' | 'vertical'`, default `'horizontal'`), `spacing` (`'none' | 'sm' | 'md'`, default `'sm'`), `is-disabled` (`boolean`).
- Slot: default (slotted `moul-button`s).
- Accessibility: `role="group"`, `aria-orientation`.
- Radius collapse: When `spacing="none"`, collapse adjacent child borders/radius.

### 3. `MoulToggleButton` (`moul-toggle-button`)
- Attributes: `value` (string), `is-selected` (boolean, sets `aria-pressed="true"`/`"false"`), `size` (`'sm' | 'md' | 'lg'`), `is-disabled` (boolean).
- Slot: default.
- Events: `change` (`detail: { isSelected: boolean, value: string }`), `press` (`detail: { isSelected: boolean }`).
- Motion: Tactile press scale via `PressController`.

### 4. `MoulToggleButtonGroup` (`moul-toggle-button-group`)
- Attributes: `selected-key` (string), `orientation` (`'horizontal' | 'vertical'`), `is-disabled` (boolean).
- WAI-ARIA roving `tabindex` across children (`ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`/`Home`/`End`).
- Motion: Sliding active indicator pill using `animateActiveIndicator` (`SPRING_SNAPPY`).
- Events: `selectionchange` (`detail: { selectedKey: string }`).

### 5. `Actions.test.ts`
- Write comprehensive Vitest + happy-dom tests covering all 4 components, properties, attributes, events, keyboard interactions, roving tabindex, `warnMissingLabel`, disabled state, and pending state.
- Run tests with: `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts`.
- Ensure all existing tests continue to pass (`Controllers.test.ts`, `Tokens.test.ts`, etc.).
- Ensure `verify-no-react.ts all` exits with 0.
- Ensure Biome linter/formatter passes (`bun run lint`).

## Output
Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m4_1/handoff.md` detailing observation, implemented files, test commands and outcomes, caveats, and conclusions.
