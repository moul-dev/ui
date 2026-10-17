## 2026-10-17T04:57:24Z

You are worker_m2_sidebar_1.
Your working directory is: /Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/worker_m2_sidebar_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Task: Implement Milestone 2: 10-element Sidebar compound element suite in `ui/src/components/Sidebar/`.

1. Read reference files:
   - `/Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/ORIGINAL_REQUEST.md` (specifically 2026-10-17T03:54:46Z entry)
   - `/Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/orchestrator_phase9_1/PROJECT.md`
   - `/Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/explorer_survey_sidebar_1/analysis.md`
   - `/Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/spec_miner_survey_1/spec_report.md`

2. File ownership (exclusive):
   You own all files in `ui/src/components/Sidebar/`:
   - `Sidebar.types.ts`: Define `SidebarLayout` (`'sidebar-framed' | 'main-framed'`), `SidebarContextValue` (`layout`, `dense`, `collapsed`, `selectedKey`, `previousActiveRect`, `onSelect`), and props/interfaces for all 10 compound elements.
   - `Sidebar.context.ts`: Create and export `sidebarContext` using `createContext<SidebarContextValue>(Symbol('sidebar-context'))`.
   - `Sidebar.styles.ts`: Authored with Lit `css` + `resetStyles` and CSS design tokens (`--color-bg`, `--color-fg`, `--color-border`, etc.). Implement pure CSS grid height collapse: `grid-template-rows: 0fr` to `1fr` with inner wrapper having `min-height: 0` and `overflow: clip` / `hidden`. Transition aside width smoothly.
   - `Sidebar.ts`: Implement all 10 custom elements, each registered idempotently with `defineElement()`:
     1. `moul-sidebar` (`MoulSidebar`): Root compound container with `ContextProvider(this, { context: sidebarContext, initialValue })`. Manages properties `layout` (default `'sidebar-framed'`), `dense` (default `false`), `collapsed` (default `false`), `selectedKey`. Tracks active indicator rects and dispatches `selectionchange` `{ detail: { selectedKey } }`.
     2. `moul-sidebar-aside` (`MoulSidebarAside`): Aside container consuming `sidebarContext` (`ContextConsumer`). Reflects `collapsed` and `dense`.
     3. `moul-sidebar-main` (`MoulSidebarMain`): Main content container.
     4. `moul-sidebar-header` (`MoulSidebarHeader`): Header container.
     5. `moul-sidebar-brand` (`MoulSidebarBrand`): Logo, brand name, and optional description.
     6. `moul-sidebar-group` (`MoulSidebarGroup`): Collapsible section grouping with title, collapsible toggle chevron, and pure CSS grid collapse transition without JS height calculations.
     7. `moul-sidebar-item` (`MoulSidebarItem`): Nav item consuming `sidebarContext`. If `key === selectedKey`, renders active state with pill indicator animated via `animateActiveIndicator` (`SPRING_SNAPPY`). Dispatches selection event when clicked. In collapsed mode (`collapsed: true`), wraps button/link trigger inside `<moul-tooltip content=${this.label} placement="right">`.
     8. `moul-sidebar-divider` (`MoulSidebarDivider`): Visual separator rule.
     9. `moul-sidebar-footer` (`MoulSidebarFooter`): Bottom pinned container.
     10. `moul-sidebar-user` (`MoulSidebarUser`): User profile snippet with avatar, name, and role.
   - `ui/src/components/Sidebar/index.ts`: Clean barrel export of all 10 components, context, and types.
   - Purge legacy React files: delete `ui/src/components/Sidebar/Sidebar.tsx`, `ui/src/components/Sidebar/Sidebar.styles.ts`, `ui/src/components/Sidebar/Sidebar.test.tsx` (if present).
   - Write comprehensive unit tests in `ui/src/components/Sidebar/Sidebar.test.ts`.

3. Verification requirements:
   - Run tests: `cd ui && ./node_modules/.bin/vitest run src/components/Sidebar/Sidebar.test.ts`
   - Run dependency guard: `bun ./scripts/verify-no-react.ts all`
   - Run linter: `cd ui && ./node_modules/.bin/biome check src/components/Sidebar/`

4. Output handoff to:
   `/Users/phearak/.gemini/antigravity/worktrees/ui/implement_phase_nine_rdt/.agents/teamwork/worker_m2_sidebar_1/handoff.md`
   Send message to orchestrator upon completion.
