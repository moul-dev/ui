# Dispatch: Milestone 8 (Integration, Barrel Exports, Full Test Suite Pass & Final Gate)

## Worker Identity
- Role: Integration & Final Verification Worker (`worker_m8_1`)
- Working Directory: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m8_1`

## Mandatory Files to Read
1. `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
2. `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/DISPATCH.md`
3. `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
4. `/Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md`

## Mandatory Integrity Warning
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks

### 1. Public Entry Point Verification (`ui/src/index.ts`)
- Review `ui/src/index.ts`. Ensure all 45 component classes across Phases 4–7 are exported with clean TypeScript types and companions:
  - Phase 4: `MoulButton`, `MoulButtonGroup`, `MoulToggleButton`, `MoulToggleButtonGroup`
  - Phase 5: `MoulTypography`, `MoulKbd`, `MoulSeparator`, `MoulSpinner`, `MoulSkeleton`, `MoulBadge`, `MoulCard`, `MoulEmptyState`, `MoulAlert`, `MoulProgressBar`, `MoulAvatar`, `MoulAvatarGroup`, `MoulTag`, `MoulTagGroup`, `MoulTable`, `MoulToast`, `toastQueue`
  - Phase 6: `MoulLink`, `MoulBreadcrumbs`, `MoulBreadcrumbItem`, `MoulPagination`, `generatePagination`, `MoulTabs`, `MoulTab`, `MoulTabPanel`, `MoulPopover`, `MoulTooltip`, `MoulModal`, `MoulAlertDialog`, `MoulDrawer`, `MoulCommandPalette`
  - Phase 7: `MoulForm`, `MoulTextField`, `MoulNumberField`, `MoulSearchField`, `MoulTextArea`, `MoulCheckbox`, `MoulCheckboxGroup`, `MoulRadioGroup`, `MoulRadio`, `MoulSwitch`, `MoulSlider`, `MoulInputOTP`, `MoulSelect`, `MoulSelectItem`, `MoulComboBox`, `MoulComboBoxItem`, `MoulCalendar`, `MoulDatePicker`
  - Global `HTMLElementTagNameMap` interface declaration for all custom elements:
    `moul-button`, `moul-button-group`, `moul-toggle-button`, `moul-toggle-button-group`,
    `moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, `moul-skeleton`, `moul-badge`, `moul-card`, `moul-empty-state`, `moul-alert`, `moul-progress-bar`, `moul-avatar`, `moul-avatar-group`, `moul-tag`, `moul-tag-group`, `moul-table`, `moul-toast`,
    `moul-link`, `moul-breadcrumbs`, `moul-breadcrumb-item`, `moul-pagination`, `moul-tabs`, `moul-tab`, `moul-tab-panel`, `moul-popover`, `moul-tooltip`, `moul-modal`, `moul-alert-dialog`, `moul-drawer`, `moul-command-palette`,
    `moul-form`, `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area`, `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group`, `moul-radio`, `moul-switch`, `moul-slider`, `moul-input-otp`, `moul-select`, `moul-select-item`, `moul-combobox`, `moul-combobox-item`, `moul-calendar`, `moul-date-picker`.

### 2. Legacy File Cleanup & Verification
- Check `ui/src/components` for any residual React `.tsx` files in the 45 components implemented in Phases 4–7. If any obsolete React files remain in these folders (e.g. `FormInput.test.tsx` or legacy React component files), remove them or ensure they don't break Vitest.
- Note: Phase 8 (Charts) and Phase 9 (LogsViewer/Sidebar) are scheduled for later phases; do not touch files outside Phase 4–7 scope unless necessary for clean compilation.

### 3. Verification & Checks
- Run all component tests:
  `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Forms.test.ts src/components/surfaces-challenge.test.ts src/components/table-toast-challenge.test.ts src/components/navigation-challenge.test.ts src/components/overlays-challenge.test.ts src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts`
- Run Zero-React check:
  `bun ./scripts/verify-no-react.ts all`
- Run Biome check:
  `node ./node_modules/.bin/biome check ui/src/components`
- Update `rdt/tasks.md` to ensure Tasks 4.1–4.5, 5.1–5.8, 6.1–6.8, and 7.1–7.7 are all checked `[x]`.


## 2026-10-16T15:05:17Z
You are worker_m8_1. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m8_1.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m8_1/DISPATCH.md before starting work.
Also study:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md
- /Users/phearak/github/orgs/moul-dev/ui/rdt/tasks.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task is Milestone 8: Integration, Barrel Exports, Full Test Suite Pass & Final Gate:
1. Public Entry Point Verification (ui/src/index.ts):
   - Check ui/src/index.ts to ensure all 45 component classes across Phase 4 through Phase 7 (and companion elements + types + controllers) are properly exported.
   - Ensure HTMLElementTagNameMap is augmented with all custom element tag names.
2. Clean up any residual or obsolete React files/tests from Phase 4–7 components if any exist that could trip Vitest or the zero-React guard.
3. Update rdt/tasks.md so all tasks in Phase 4 (4.1–4.5), Phase 5 (5.1–5.8), Phase 6 (6.1–6.8), and Phase 7 (7.1–7.7) are accurately checked [x].
4. Run full verification:
   - node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Forms.test.ts src/components/surfaces-challenge.test.ts src/components/table-toast-challenge.test.ts src/components/navigation-challenge.test.ts src/components/overlays-challenge.test.ts src/components/forms-challenge.test.ts src/components/pickers-challenge.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts
   - bun ./scripts/verify-no-react.ts all
   - node ./node_modules/.bin/biome check ui/src/components
5. Write your complete handoff report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m8_1/handoff.md following the Handoff Protocol.
When done, notify the parent orchestrator via send_message.

