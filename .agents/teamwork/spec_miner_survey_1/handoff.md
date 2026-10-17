# Handoff Report: Phase 9 Specification Mining

Agent: `spec_miner_survey_1`
Date: 2026-10-17T04:04:00Z
Target File: `.agents/teamwork/spec_miner_survey_1/handoff.md`

---

## 1. Observation

1. **Authoritative Specification Directives**:
   - `rdt/requirements.md:249-264` (Requirement 12: Composite Block Components):
     - `12.1`: `moul-logs-viewer` as LitElement with `logs: LogItem[]`, using `@lit-labs/virtualizer` for virtualized rendering.
     - `12.2`: `moul-logs` companion accepting raw log string and forwarding to `moul-logs-viewer`.
     - `12.3`: Preserves existing log parsing logic as pure functions importable from `@moul-dev/ui` (`parseLogs`, `parseLogLine`, `parseAttributes`, `stripAttributes`, `normalizeLogLevel`, `SERVER_LOG_RAW`, `SERVER_LOGS`).
     - `12.4`: `moul-sidebar` as LitElement with `layout` (`sidebar-framed`, `main-framed`), `dense` boolean, `selected-key`, and `selectionchange` event.
     - `12.5`: 10-element Sidebar compound suite: `moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user`.
     - `12.6`: Context propagation for `dense`, `collapsed`, `selectedKey`, `layout` down to children via `@lit/context`.
     - `12.7`: `moul-sidebar-group` collapses height via pure CSS `grid-template-rows: 0fr` to `1fr` without JavaScript height calculations.
     - `12.8`: `moul-sidebar-item` wrapped in `<moul-tooltip>` when `collapsed: true` (icon-only mode).
   - `rdt/design.md:732-783` (Section 8.6 Category 6: Composite Block Components):
     - Details exact interfaces for `sidebarContext` (`SidebarContextValue`), `MoulSidebar`, `MoulSidebarAside`, `MoulSidebarMain`, `MoulSidebarHeader`, `MoulSidebarBrand`, `MoulSidebarGroup`, `MoulSidebarItem`, `MoulSidebarDivider`, `MoulSidebarFooter`, `MoulSidebarUser`.
     - Motion architecture: `animateActiveIndicator` (`SPRING_SNAPPY`) for active item selection indicator pill and level filter pill; `IOS_SHEET_CURVE` for aside width collapse; `subtleAnimate` (`SPRING_SNAPPY`) for group chevron rotation (`rotate: collapsed ? -90 : 0`).
   - `rdt/tasks.md:186-199` (Phase 9 tasks 9.1, 9.2, 9.3):
     - 9.1: Implement `moul-logs-viewer`, `moul-logs`, pure parser utilities.
     - 9.2: Implement `moul-sidebar` compound suite (10 elements) with `@lit/context`, CSS grid collapse, tooltips, and active indicator motion.
     - 9.3: Write `ui/src/components/Blocks.test.ts`.

2. **Existing Legacy Codebase State**:
   - `ui/src/components/LogsViewer/` contains legacy React implementation:
     - `parseLogs.ts` exports `normalizeLogLevel`, `parseAttributes`, `stripAttributes`, `parseLogLine`, `parseLogs`.
     - `exampleLogs.ts` exports `SERVER_LOG_RAW` and `SERVER_LOGS` (17 items).
     - `Logs.types.ts` defines `LogLevel`, `LogItem`, `LogFilterLevel`, etc.
   - `ui/src/components/Sidebar/` contains legacy React implementation:
     - `Sidebar.tsx` and `Sidebar.styles.ts` implement 10 subcomponents with React state and StyleX.
   - `ui/src/components/Blocks.test.ts` does not yet exist.
   - `ui/package.json` includes `lit: ^3.2.1`, `@lit/context: ^1.1.3`, `@lit-labs/virtualizer: ^2.1.0`, and `motion: ^13.4.1`.
   - `scripts/verify-no-react.ts` strictly rejects any React or StyleX imports in `ui/`.

---

## 2. Logic Chain

1. **Zero-React Strict Constraint**:
   Because `scripts/verify-no-react.ts` and `banReactImportsPlugin` enforce zero imports from `react`, `react-dom`, `react-aria`, `@stylexjs/stylex`, and `@lit/react`, all Phase 9 implementations must be built purely with Lit 3 (`LitElement`, `html`, `css`), `@lit/context`, `@lit-labs/virtualizer`, and vanilla `motion` exports.
2. **Context Subscriptions**:
   Because compound sidebar components are nested arbitrarily (e.g., `<moul-sidebar><moul-sidebar-aside><moul-sidebar-group><moul-sidebar-item>...`), prop-drilling is fragile and forbidden per Requirement 12.6. Using `sidebarContext` provided by `moul-sidebar` via `ContextProvider` and consumed via `ContextConsumer` ensures automatic reactive synchronization of `dense`, `collapsed`, `selectedKey`, and `layout`.
3. **Pure CSS Grid Collapse**:
   Per Requirement 12.7, group collapse must use CSS `grid-template-rows: 0fr` to `1fr` with an inner `overflow: clip` / `hidden` element. This avoids layout recalculations, bounding box measurements, and race conditions during rapid toggling.
4. **Collapsed Tooltip Integration**:
   Per Requirement 12.8, when the sidebar is in collapsed icon-only mode, item text is truncated/hidden and `<moul-sidebar-item>` must wrap its trigger in `<moul-tooltip content=${this.label} placement="right">` to preserve accessible label visibility on hover and focus.
5. **Comprehensive Test Suite Contract**:
   Per Task 9.3, `ui/src/components/Blocks.test.ts` must comprehensively verify all parser functions, component rendering, level/search filtering, context propagation, keyboard interaction, pure CSS grid collapse, and custom element registration idempotency.

---

## 3. Caveats

- In headless test environments (Vitest + Happy DOM), `@lit-labs/virtualizer` or elements with zero computed layout dimensions may need a fallback (direct item rendering or explicit sizing) to ensure row elements are queryable by test assertions.
- Mobile bottom navigation dock was present in the legacy React sidebar, but the authoritative RDT specifications (Requirement 12, Design §8.6, Task 9.2) strictly specify the 10-element desktop/responsive compound suite (`moul-sidebar`, `moul-sidebar-aside`, `moul-sidebar-main`, `moul-sidebar-header`, `moul-sidebar-brand`, `moul-sidebar-group`, `moul-sidebar-item`, `moul-sidebar-divider`, `moul-sidebar-footer`, `moul-sidebar-user`).

---

## 4. Conclusion

The specification mining for Phase 9 is complete and documented in full detail in `.agents/teamwork/spec_miner_survey_1/spec_report.md`.
All component contracts, properties, events, CSS specifications, motion configurations, and test cases have been cataloged and ready for implementation by the builder agent.

---

## 5. Verification Method

To verify the findings and specifications:
1. Inspect the generated report:
   ```bash
   cat .agents/teamwork/spec_miner_survey_1/spec_report.md
   ```
2. Verify cross-references against authoritative sources:
   - `rdt/requirements.md` (Requirement 12, lines 249–264)
   - `rdt/design.md` (Section 6.6, 8.6, lines 473–550, 732–783)
   - `rdt/tasks.md` (Phase 9: Tasks 9.1–9.3, lines 186–199)
   - `ORIGINAL_REQUEST.md` (lines 221–276)
