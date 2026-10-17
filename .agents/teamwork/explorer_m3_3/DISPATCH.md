## 2026-10-17T05:20:00Z
You are explorer_m3_3.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m3_3

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work (focus on ## 2026-10-17T03:06:45Z).
Also read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase8_2/PROJECT.md and `rdt/design.md` §8.1.

Task: Investigate `moul-top-list` (`TopList.ts` and `TopList.styles.ts`).
1. Inspect legacy `ui/src/components/TopList/TopList.tsx` and requirements in `rdt/design.md` §8.1.
2. Specify Lit 3 component architecture:
   - Component tag: `moul-top-list`, class: `MoulTopList as TopList`, exported types (`TopListItem` from `ChartCommon.ts`).
   - Reactive properties: `data` (`TopListItem[]`), `max`, `valueFormatter`, `showRank` (boolean).
   - Layout: HTML list / cards with ranked items, label, formatted value, and horizontal proportional progress bar (`percentage = (item.value / maxValue) * 100`).
   - CSS tokens: progress bar fill styled with `item.color` or `getChartColor(idx)` or primary token.
   - Event contracts: clickable items dispatching `item-press` (`{ detail: { item: TopListItem, index: number } }`).
   - Accessibility: `role="list"`, `role="listitem"`, progress indicator `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`.
   - Domain safeguards: empty data slot `<slot name="empty">`, 0 values, negative values, missing labels.
3. Recommend complete implementation blueprint and test cases for the worker.
Record your findings in `handoff.md` in your working directory and notify the orchestrator.
Do NOT modify source files (Explorers are read-only).
