# BRIEFING — 2026-10-17T03:51:00Z

## Mission
Investigate ChartTooltip coordinate positioning offset bug and recommend clean remediation ensuring CHART-TLP-04 passes.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_it2_1
- Original parent: 5d04df52-77dd-4159-8972-455e52835bdb
- Milestone: m1_it2

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Output structured handoff report in working directory
- Communicate via send_message to caller 5d04df52-77dd-4159-8972-455e52835bdb

## Current Parent
- Conversation ID: 5d04df52-77dd-4159-8972-455e52835bdb
- Updated: 2026-10-17T03:51:00Z

## Investigation State
- **Explored paths**:
  - `ui/src/components/ChartTooltip/ChartTooltip.ts`
  - `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`
  - `ui/src/components/Charts.test.ts` (specifically `CHART-TLP-04`)
  - `ui/src/components/chart-tooltip-challenge.test.ts`
  - `ui/src/controllers/overlay-presence.controller.ts`
  - `ui/src/test-setup.ts`
  - `.agents/teamwork/reviewer_m1_2/handoff.md`
- **Key findings**:
  - Root cause confirmed: Setting both `style.left/top` and `transform: translate3d(x, y, 0)` causes cumulative 2x coordinate displacement in real browser layouts.
  - Option 1 (`this.style.left = '0px'; this.style.top = '0px'; this.style.transform = 'translate3d(' + this.x + 'px, ' + this.y + 'px, 0) translate(-50%, -100%) translateY(-8px)'`) is the recommended high-performance fix: leverages GPU compositing, avoids reflow/layout recalculations during 60/120fps mouse movement, preserves subpixel precision from D3 scales, and satisfies `hasTransform` in `CHART-TLP-04`.
  - Option 2 (`this.style.left = this.x + 'px'; this.style.top = this.y + 'px'; this.style.transform = 'translate(-50%, -100%) translateY(-8px)'`) is a valid alternative, but forces browser layout recomputation on each mousemove. Satisfies `hasLeftTop` in `CHART-TLP-04`.
  - Both options pass `CHART-TLP-04` in `Charts.test.ts` cleanly.
  - `chart-tooltip-challenge.test.ts` asserts on both `style.left` and `style.transform`; once the fix removes one of the duplicate assignments, the corresponding assertion in the challenge test will need an update by the implementer.
  - Optional decoupled animation: setting `target: () => this.shadowRoot?.querySelector('[part="container"]')` in `OverlayPresenceController` isolates spring micro-animations to the inner container, preventing collision with host coordinates.
- **Unexplored areas**: None.

## Key Decisions Made
- Recommend Option 1 (Transform-based coordinates with inline 0px left/top reset) as primary remediation.
- Document Option 2 as alternative with full trade-off matrix.
- Detail required updates to `chart-tooltip-challenge.test.ts` and compatibility verification with `Charts.test.ts`.

## Artifact Index
- DISPATCH.md — Initial dispatch prompt
- BRIEFING.md — Situational awareness
- progress.md — Liveness heartbeat
- handoff.md — 5-component handoff report
