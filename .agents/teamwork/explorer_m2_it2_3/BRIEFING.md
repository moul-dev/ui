# BRIEFING — 2026-10-17T04:57:30Z

## Mission
Investigate ui/src/components/LineChart/LineChart.ts and ui/src/components/AreaChart/AreaChart.ts for non-finite values (Infinity / -Infinity) leaking into SVG paths or circle positions, and recommend exact locations where Number.isFinite(...) guards should be applied.

## 🔒 My Identity
- Archetype: explorer
- Roles: Explorer, Static Code Analyst
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_3
- Original parent: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Milestone: Milestone 2 remediation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source files
- Provide exact line numbers and concrete recommendations

## Current Parent
- Conversation ID: 4562f942-bc5a-4d72-ad00-d87e731f5321
- Updated: not yet

## Investigation State
- **Explored paths**: `ui/src/components/LineChart/LineChart.ts`, `ui/src/components/AreaChart/AreaChart.ts`, `ui/src/components/ChartCommon.ts`, `ui/src/components/Charts.test.ts`, `reviewer_m2_it2_1/handoff.md`.
- **Key findings**:
  1. `LineChart.ts`:
     - Line 385–392: `.defined((d) => ... !Number.isNaN(Number(val)))` allows `Infinity` because `Number.isNaN(Infinity)` is false. `yScale(Infinity)` evaluates to `NaN`.
     - Line 401: Single-point fallback checks `!Number.isNaN(val)`, emitting `pathD = "M px NaN"`.
     - Lines 428–437: Marker circles check `Number.isNaN(Number(rawVal))`, allowing `Infinity` and emitting `cy="NaN"`.
     - Lines 156–164: `getActiveSeries()` allows `Infinity` strings/numbers.
     - Lines 285–294: Domain calculation lacks degenerate span safeguard, causing `yScale.ticks(5)` to throw `RangeError: Invalid array length` on subnormal floats.
  2. `AreaChart.ts`:
     - Lines 253–256: `typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0` is broken for `Infinity` and `"-Infinity"` because `Number(Infinity) || 0` returns `Infinity`. Leaks into `posBaselines`, `y1`, `maxY = Infinity`, `domain = [0, Infinity]`, and `yScale(Infinity) = NaN`.
     - Lines 309–318: `areaGen` and `lineGen` lack `.defined(...)` predicates.
     - Lines 416–423: Single-point fallback does not guard `yScale(pt.y1)`.
     - Lines 450–454: Circle markers do not guard against non-finite `rawVal` or `cy`.
     - Lines 297–320: Scale domain span lacks subnormal expansion and try/catch on `yScale.ticks(5)`.
- **Unexplored areas**: None for M2 components. All data paths, filters, and projections analyzed and experimentally verified.

## Key Decisions Made
- Cataloged all 6 vulnerable locations in `LineChart.ts` and 7 vulnerable locations in `AreaChart.ts`.
- Formulated exact `Number.isFinite(...)` code replacements for both components.
- Tested proposed fix logic in Bun to ensure 100% elimination of `NaN` and `Infinity` in SVG outputs without regressions.

## Artifact Index
- `handoff.md` — Comprehensive report with line numbers, code snippets, and verification method.
- `progress.md` — Activity and liveness log.
