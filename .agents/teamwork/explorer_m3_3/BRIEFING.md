# BRIEFING — 2026-10-17T05:26:00Z

## Mission
Investigate moul-top-list requirements, legacy TopList.tsx, and formulate complete Lit 3 architecture, ranked items list, proportional progress bars, item-press custom events, a11y roles, and test cases.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_3
- Original parent: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Milestone: M3 (Discrete & Categorical Charts — TopList)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source files
- Adhere strictly to Lit 3, zero React/Recharts/StyleX
- Comply with CSS design tokens, Light/Dark OKLCH, a11y, and motion guidelines

## Current Parent
- Conversation ID: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Updated: 2026-10-17T05:26:00Z

## Investigation State
- **Explored paths**:
  - `rdt/design.md` §8.1
  - `ui/src/components/TopList/TopList.tsx` (legacy React/StyleX)
  - `ui/src/components/TopList/TopList.styles.ts` (legacy StyleX styles)
  - `ui/src/components/ChartCommon.ts` (types & getChartColor)
  - `ui/src/components/LineChart/LineChart.ts` and `AreaChart.styles.ts` (Lit 3 patterns)
  - `ui/src/components/Charts.test.ts` (test harness, 41 passing tests verified)
- **Key findings**:
  - Legacy TopList was tied to React and `@stylexjs/stylex`.
  - Architecture for `moul-top-list` (`MoulTopList`) formulated with:
    - Reactive properties: `data` (`TopListItem[]`), `max`, `maxValue`, `maxItems`, `valueFormatter`, `showRank`, `multiColor`, `barColor`, `interactive`.
    - Proportional progress bars with safe math: `Math.min(100, Math.max(0, (clampedValue / effectiveMax) * 100))`.
    - Responsive grid layout handling `[show-rank]` toggling.
    - Color tokens hierarchy: `item.color` -> `multiColor ? getChartColor(idx) : barColor`.
    - Event contracts: `item-press` with `{ detail: { item, index } }`.
    - Accessibility roles: `role="list"`, `role="listitem"`, `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`, `aria-valuetext`.
    - Domain safeguards: empty slot `<slot name="empty">`, division-by-zero protection (clamping max >= 1), negative values clamping, missing label fallbacks.
    - Motion: Staggered row entrance and bar fill transition, respecting `prefersReducedMotion()`.
    - 11 comprehensive Vitest test cases designed covering all contracts.
- **Unexplored areas**: None. Complete blueprint ready for worker handoff.

## Key Decisions Made
- Dual support for both `max` and `maxValue` properties to ensure backwards and cross-spec compatibility.
- Interactive mode provides both click and keyboard (`Enter`/`Space`) activation while preserving accessible list structure.

## Artifact Index
- `.agents/teamwork/explorer_m3_3/BRIEFING.md` — persistent memory
- `.agents/teamwork/explorer_m3_3/progress.md` — heartbeat & progress
- `.agents/teamwork/explorer_m3_3/handoff.md` — final 5-component report
