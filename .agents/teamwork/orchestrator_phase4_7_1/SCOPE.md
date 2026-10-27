# Scope: Phase 4 through Phase 7 Component Library Implementation

## Architecture
Transition 45 core component classes from legacy React/StyleX/React Aria to pure Lit 3 Web Components with open Shadow DOM, native CSS design tokens, `semanticToneStyles` (25 tone × variant combinations), and reusable reactive controllers (`PressController`, `LayoutIndicatorController`, `OverlayPresenceController`, `NumberSpringController`, `FormInternalsController`).

### Key Principles
1. **Standards-First HTML Elements**: Native `<button>`, `<dialog>`, `<hr>`, `<nav>`, `<kbd>`, `<search>`, `<form>`, `<input>`, `<textarea>`, `<select>`, `<progress>`, Popover API, CSS Anchor Positioning with fallbacks.
2. **Accessible Interaction**: WAI-ARIA roles, attributes, states, roving `tabindex`, keyboard traversal, `<100ms` initial focus and focus traps for modal overlays, and dev-time `warnMissingLabel`.
3. **Smooth Fluid Motion**: Vanilla `motion` presets (`SPRING_SNAPPY`, `SPRING_GENTLE`, `IOS_SHEET_CURVE`), `animateActiveIndicator` for roving indicators, and respect for `prefersReducedMotion`.
4. **Form Association**: `static formAssociated = true` with `FormInternalsController` for all input/form controls, synchronous `setFormValue` before repaint, and character-truncated validity reporting.
5. **Zero React**: Zero imports or dependencies matching `/^react/`, `@stylexjs/stylex`, or `@lit/react`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `moul-button` | Button element with 7 variants, 3 sizes, `is-pending` (with spinner & `aria-busy`), `is-icon` with `warnMissingLabel`, tactile press feedback | M4 | Task 4.1 & Req 8.1–8.3 |
| 2 | `moul-button-group` | Button group applying orientation and spacing to slotted buttons | M4 | Task 4.2 & Req 8.4 |
| 3 | `moul-toggle-button` | Toggle button updating `aria-pressed` via `is-selected` and tactile press scale | M4 | Task 4.3 & Req 8.5 |
| 4 | `moul-toggle-button-group` | Toggle button group managing `selected-key`, roving `tabindex`, selection change events, and `animateActiveIndicator` active pill | M4 | Task 4.4 & Req 8.6, 8.7 |
| 5 | `Actions.test.ts` | Vitest + happy-dom test suite covering all Action and Toggle components | M4 | Task 4.5 |
| 6 | `moul-typography`, `moul-kbd`, `moul-separator`, `moul-spinner`, `moul-skeleton` | Core typography, keyboard shortcuts, horizontal/vertical separator, SVG spinner, and pulsing/waving skeletons | M5 | Task 5.1 & Req 11.7, 11.9–11.11, 11.16 |
| 7 | `moul-badge`, `moul-card`, `moul-empty-state` | 25-combination tone/variant badge, card with header/body/footer slots, and staggered entrance empty state | M5 | Task 5.2 & Req 11.4–11.6 |
| 8 | `moul-alert`, `moul-progress-bar` | Dismissible alert with fade/collapse motion, and accessible progress bar with `subtleAnimate` spring fill | M5 | Task 5.3 & Req 11.1, 11.8 |
| 9 | `moul-avatar`, `moul-avatar-group` | Avatar with initials fallback and load crossfade, and avatar group with negative overlap and overflow counter | M5 | Task 5.4 & Req 11.2, 11.3 |
| 10 | `moul-tag`, `moul-tag-group` | Tags with selection, tactile press, removal motion, and tag group container | M5 | Task 5.5 & Req 11.14 |
| 11 | `moul-table` | Data table with column slots, sorting with rotating icon, selection, and loading state rendering skeleton rows | M5 | Task 5.6 & Req 11.12, 11.13 |
| 12 | `moul-toast` + `toastQueue` | Top-layer toasts using `popover="manual"`, `OverlayPresenceController`, and singleton `toastQueue` | M5 | Task 5.7 & Req 11.15 |
| 13 | `Surfaces.test.ts` | Vitest + happy-dom test suite covering all Surface & Feedback components | M5 | Task 5.8 |
| 14 | `moul-link`, `moul-breadcrumbs` (+ `moul-breadcrumb-item`) | External link with diagonal nudge icon, and breadcrumb navigation list | M6 | Task 6.1 & Req 10.9–10.11 |
| 15 | `moul-pagination` | Pagination controls, `generatePagination` helper, page navigation events | M6 | Task 6.2 & Req 10.12 |
| 16 | `moul-tabs`, `moul-tab`, `moul-tab-panel` | Tabs container with roving focus, `animateActiveIndicator` sliding indicator, and panel crossfade | M6 | Task 6.3 & Req 10.13, 10.14 |
| 17 | `moul-popover`, `moul-tooltip` | Popover API + CSS Anchor Positioning with fallback and `OverlayPresenceController` | M6 | Task 6.4 & Req 6.1, 6.8, 6.9, 10.6, 10.7 |
| 18 | `moul-modal`, `moul-alert-dialog` | Modal dialogs using native `<dialog>`, `safeShowModal()`, `<100ms` focus trap, `Escape` closing, focus restoration | M6 | Task 6.5 & Req 6.2–6.4, 6.10, 10.1–10.4 |
| 19 | `moul-drawer` | Edge-positioned dialog drawer with `IOS_SHEET_CURVE` slide and drag-to-dismiss | M6 | Task 6.6 & Req 6.5, 10.5 |
| 20 | `moul-command-palette` | Command palette dialog with search field and virtualized results list | M6 | Task 6.7 & Req 10.8 |
| 21 | `Overlays.test.ts` & `Navigation.test.ts` | Comprehensive test suites for Overlay and Navigation components | M6 | Task 6.8 |
| 22 | `moul-form` | Shadow DOM form wrapper validating slotted controls and re-dispatching submit/reset | M7 | Task 7.1 & Req 9.11 |
| 23 | `moul-text-field`, `moul-number-field`, `moul-search-field`, `moul-text-area` | Form-associated text/number/search/textarea controls with error reveals and validation | M7 | Task 7.2 & Req 6.6, 6.7, 9.1, 9.2 |
| 24 | `moul-checkbox`, `moul-checkbox-group`, `moul-radio-group` (+ `moul-radio`), `moul-switch` | Checkbox with SVG path animation, radio group with inner dot pop, and spring switch | M7 | Task 7.3 & Req 9.3, 9.4, 9.7 |
| 25 | `moul-slider`, `moul-input-otp` | Range slider with spring thumb and OTP input with digit pulses and invalid shake | M7 | Task 7.4 & Req 9.6, 9.8 |
| 26 | `moul-select` (+ `moul-select-item`), `moul-combobox` (+ `moul-combobox-item`) | Dropdown select and combobox using Popover API, keyboard navigation, chevron rotation | M7 | Task 7.5 & Req 6.1, 6.6, 9.5 |
| 27 | `moul-calendar`, `moul-date-picker` | Intl-formatted calendar grid with month navigation motion, and date picker dropdown | M7 | Task 7.6 & Req 9.9, 9.10 |
| 28 | `Forms.test.ts` | Comprehensive test suite for Input and Form components | M7 | Task 7.7 |
| 29 | Public Exports & Tag Registration | Export all 45 component classes, companion elements, types from `ui/src/index.ts`, register in `HTMLElementTagNameMap` | M8 | Requirements 2.1, 2.6, 16.4 |
| 30 | Monorepo Validation & Final Audit Gate | `verify-no-react.ts all`, typechecks, lint, full Vitest test pass, update `rdt/tasks.md`, forensic audit | M8 | Requirements 1.5, 16.5 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M4 | Phase 4: Actions & Toggle Components | Features 1–5 | Phase 1–3 foundation | DONE (Gate: PASS, 68 tests passed) |
| M5 | Phase 5: Surface & Feedback Components | Features 6–13 | M4 (Button, Spinner) | DONE (Gate: PASS, 97 tests passed) |
| M6 | Phase 6: Overlay & Navigation Components | Features 14–21 | M4, M5 | DONE (Gate: PASS, 114 tests passed) |
| M7 | Phase 7: Input & Form Components | Features 22–28 | M4, M5, M6 (Popover) | DONE (Gate: PASS, 153 tests passed) |
| M8 | Integration, Barrel Exports & Final Gate | Features 29–30 | M4, M5, M6, M7 | DONE (Gate: PASS, 451 tests passed) |

## Interface Contracts
- All custom elements registered via `defineElement('moul-*', Class)`
- All elements use Open Shadow DOM (`shadowRoot`)
- All elements import styles from `resetStyles`, `semanticToneStyles` (where applicable), and their own scoped `.styles.ts`
- CSS Custom Property theming via `:root` tokens from `style.css`
- Interactive elements compose `PressController`
- Overlay elements compose `OverlayPresenceController`
- Form elements declare `static formAssociated = true` and compose `FormInternalsController`
- Responsive elements compose `LayoutIndicatorController`
- Numeric spring elements compose `NumberSpringController`
