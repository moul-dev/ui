# Execution Plan: Phase 9 Lit Web Components Rebuild

## Strategy
1. **Milestone 1 (M1): Logs Viewer and Pure Parser Exports**
   - Pure parser utilities: `parseLogs.ts` and `exampleLogs.ts` preserved and verified.
   - Refactor `Logs.types.ts` into pure Lit/TS types without React/StyleX.
   - Author `LogsViewer.styles.ts` with CSS tokens and Shadow DOM reset.
   - Implement `moul-logs-viewer` with virtualization fallback pattern, search, filtering, and timestamp toggling.
   - Implement `moul-logs` companion element.
   - Remove legacy React files: `Logs.tsx`, `Logs.styles.ts`, `Logs.test.tsx`.
   - Update `LogsViewer/index.ts`.
   - Gate verification: Worker -> 2 Reviewers -> 2 Challengers -> Forensic Auditor.

2. **Milestone 2 (M2): 10-Element Compound Sidebar Element Suite**
   - Define `Sidebar.types.ts` and `sidebarContext` in `Sidebar.context.ts`.
   - Author `Sidebar.styles.ts` with CSS tokens and pure CSS grid `0fr` to `1fr` transition.
   - Implement all 10 compound Lit elements in `Sidebar.ts`:
     - `moul-sidebar`: Root element with `ContextProvider`, tracking active item rect.
     - `moul-sidebar-aside`: Collapsible aside container.
     - `moul-sidebar-main`: Content container.
     - `moul-sidebar-header`: Header wrapper.
     - `moul-sidebar-brand`: Logo/title block.
     - `moul-sidebar-group`: Collapsible group with pure CSS grid height collapse and chevron rotation.
     - `moul-sidebar-item`: Item with `animateActiveIndicator` FLIP glide, selection event, and `<moul-tooltip>` wrapping when collapsed.
     - `moul-sidebar-divider`: Visual separator.
     - `moul-sidebar-footer`: Bottom section.
     - `moul-sidebar-user`: User profile card.
   - Remove legacy React files: `Sidebar.tsx`, `Sidebar.styles.ts`.
   - Update `Sidebar/index.ts`.
   - Gate verification: Worker -> 2 Reviewers -> 2 Challengers -> Forensic Auditor.

3. **Milestone 3 (M3): Comprehensive Blocks Test Suite & Integration**
   - Author `ui/src/components/Blocks.test.ts` covering all parser utilities, `moul-logs-viewer`, `moul-logs`, all 10 sidebar elements, `@lit/context` propagation, CSS grid collapse, tooltip display, and selection events.
   - Update `ui/src/index.ts` to export all Phase 9 components, utilities, and types.
   - Run `bun ./scripts/verify-no-react.ts all`.
   - Run `bun --cwd ui test src/components/Blocks.test.ts`.
   - Verify zero regressions on existing tests (`Tokens.test.ts`, `Controllers.test.ts`, `Actions.test.ts`, `Surfaces.test.ts`, `Overlays.test.ts`, `Navigation.test.ts`, `Forms.test.ts`).
   - Update `rdt/tasks.md` to mark Phase 9 tasks [x].
   - Final audit and handoff to Sentinel.
