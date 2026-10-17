# Dispatch: Worker for Milestone 6 (Overlay & Navigation Components)

## Mission
Implement Phase 6 of the `@moul-dev/ui` Lit Web Components rebuild:
1. `moul-link` (`ui/src/components/Link/`)
2. `moul-breadcrumbs` & `moul-breadcrumb-item` (`ui/src/components/Breadcrumbs/`)
3. `moul-pagination` & `generatePagination` helper (`ui/src/components/Pagination/`)
4. `moul-tabs`, `moul-tab`, `moul-tab-panel` (`ui/src/components/Tabs/`)
5. `moul-popover` (`ui/src/components/Popover/`)
6. `moul-tooltip` (`ui/src/components/Tooltip/`)
7. `moul-modal` (`ui/src/components/Modal/`)
8. `moul-alert-dialog` (`ui/src/components/AlertDialog/`)
9. `moul-drawer` (`ui/src/components/Drawer/`)
10. `moul-command-palette` (`ui/src/components/CommandPalette/`)
11. Author comprehensive test suites:
    - `ui/src/components/Overlays.test.ts` (Modal, AlertDialog, Drawer, Popover, Tooltip, CommandPalette)
    - `ui/src/components/Navigation.test.ts` (Link, Breadcrumbs, Pagination, Tabs)
12. Update public barrel exports in `ui/src/index.ts`.
13. Mark Tasks 6.1 through 6.8 in `rdt/tasks.md` as `[x]` upon passing all tests.

## Mandatory Reading & References
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`
- `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- Spec Miner Report: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md` (Lines 420–700 for Category 4 Overlays & Navigation specs)
- Architecture Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_1/handoff.md`
- Test Framework Blueprint: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2/handoff.md`

## Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Technical Specifications & Architecture Details
1. Pure Lit 3 Custom Elements:
   - Extend `LitElement`, register idempotently via `defineElement('moul-*', ...)`.
   - Declare properties using `static override properties = { ... }` with defaults in constructor to prevent field shadowing.
   - Augment `HTMLElementTagNameMap` in each component file.
2. Dialog & Focus Management:
   - `moul-modal`, `moul-alert-dialog`, `moul-drawer`, and `moul-command-palette` wrap native `<dialog>`.
   - Use `safeShowModal()` from `ui/src/utils/focus-trap.ts` to catch disconnected DOMExceptions safely without throwing.
   - Implement focus trap, <100ms initial focus, `Escape` key dismiss, and focus restoration to trigger element on close.
   - Integrate `OverlayPresenceController` for presets: `'modal'`, `'tooltip'`, `'popover'`, `'drawer-left'|'drawer-right'|'drawer-top'|'drawer-bottom'`.
3. Popover & Anchor Positioning:
   - `moul-popover` and `moul-tooltip` use native Popover API (`popover="auto"` or `popover="manual"`) with CSS anchor positioning and fixed positioning fallback.
   - `moul-tooltip` respects 300ms hover/focus delay (Requirement 10.7).
4. Navigation Elements:
   - `moul-link`: External arrow SVG icon with hover diagonal nudge (`x: 2, y: -2`), `rel="noopener noreferrer"` when `is-external` is true.
   - `moul-breadcrumbs`: `<nav aria-label="Breadcrumb">` with `<ol>` and slotted `moul-breadcrumb-item` elements with `is-current` setting `aria-current="page"`.
   - `moul-pagination`: `total-pages`, `current-page`, `page-size`, `pagechange` event (`detail: { page }`), and pure `generatePagination` helper.
   - `moul-tabs`: WAI-ARIA tabs pattern, arrow key roving focus (`ArrowLeft`/`Right`/`Up`/`Down`, `Home`, `End`), active tab indicator animation via `animateActiveIndicator` (`SPRING_SNAPPY`), panel crossfade.
5. Legacy Purge:
   - Remove legacy React `.tsx` files in the 10 touched component directories.
6. Verification Commands:
   - Test suites: `node ui/node_modules/.bin/vitest run --root ui src/components/Overlays.test.ts src/components/Navigation.test.ts`
   - Regression tests: `node ui/node_modules/.bin/vitest run --root ui src/components/Actions.test.ts src/components/Surfaces.test.ts`
   - Zero-React guard: `bun ./scripts/verify-no-react.ts all`
   - Biome check: `node_modules/.bin/biome check`

## Output
Write `handoff.md` in `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m6_1/handoff.md` detailing observation, implemented files, test commands and outcomes, caveats, and conclusions.


## 2026-10-16T13:05:47Z
Sender: 8ce10391-b075-41f8-9af9-fa6eb0c45e28
Content:
You are worker_m6_1. Your working directory is /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m6_1.

MANDATORY: You MUST read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md and /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m6_1/DISPATCH.md before starting work.
Also study:
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_p4_7_1/handoff.md (Lines 420–700 for Category 4 Overlays & Navigation specs)
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_1/handoff.md
- /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_p4_7_2/handoff.md

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task is to implement Milestone 6 (Phase 6: Overlay & Navigation Components — 10 components):
1. Link (MoulLink in ui/src/components/Link/)
2. Breadcrumbs & BreadcrumbItem (MoulBreadcrumbs, MoulBreadcrumbItem in ui/src/components/Breadcrumbs/)
3. Pagination & generatePagination (MoulPagination in ui/src/components/Pagination/)
4. Tabs, Tab, TabPanel (MoulTabs, MoulTab, MoulTabPanel in ui/src/components/Tabs/)
5. Popover (MoulPopover in ui/src/components/Popover/)
6. Tooltip (MoulTooltip in ui/src/components/Tooltip/)
7. Modal (MoulModal in ui/src/components/Modal/)
8. AlertDialog (MoulAlertDialog in ui/src/components/AlertDialog/)
9. Drawer (MoulDrawer in ui/src/components/Drawer/)
10. CommandPalette (MoulCommandPalette in ui/src/components/CommandPalette/)
11. Comprehensive test suites: ui/src/components/Overlays.test.ts and ui/src/components/Navigation.test.ts
12. Update public barrel exports in ui/src/index.ts
13. Mark Tasks 6.1 through 6.8 in rdt/tasks.md as [x]
14. Run test suites: node ui/node_modules/.bin/vitest run --root ui src/components/Overlays.test.ts src/components/Navigation.test.ts and regression tests
15. Run bun ./scripts/verify-no-react.ts all and bun run lint

Write your complete handoff report to /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/worker_m6_1/handoff.md following the Handoff Protocol.
When done, notify the parent orchestrator via send_message.
