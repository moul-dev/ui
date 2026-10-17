## 2026-10-17T03:09:10Z

You are spec_miner_survey_1.
Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1

MANDATORY: Read /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md before starting work.
Do NOT write code or modify source code files. You are a read-only specification investigator.

Your task is to thoroughly analyze the design specifications for Phase 8: Category 1 — Charts & Data Visualization (7 Components + 2 Companions + Container):
1. Read rdt/design.md (especially Section 8.1 / Category 1, Section 7, and any other chart specifications).
2. Read rdt/requirements.md (Requirement 7 or related requirements for Charts & Data Visualization).
3. Read rdt/tasks.md (Phase 8 or Category 1 tasks).
4. Read the latest user request in ORIGINAL_REQUEST.md (under ## 2026-10-17T03:06:45Z).

Enumerate the exact requirements and contracts for all 10 elements:
1. `moul-chart-container`
2. `moul-chart-tooltip`
3. `moul-line-chart`
4. `moul-area-chart`
5. `moul-bar-chart`
6. `moul-doughnut-chart`
7. `moul-top-list`
8. `moul-stat`
9. `moul-percentage-bar`
10. `moul-percentage-circle`

For every component, identify:
- Exact element name & registration contract (idempotent `defineElement`, HTMLElementTagNameMap)
- Attributes, properties, types, default values, reflected attributes
- Slots (default, empty, etc.)
- SVG rendering logic, D3 usage (d3-scale, d3-shape, curves, generators, inner-radius-ratio, orientations)
- Styling & CSS tokens (--color-chart-1 through --color-chart-8)
- Animation & Motion expectations (motion, durations, prefers-reduced-motion, NumberSpringController)
- Tooltip interactions via native Popover API (events, open/close, coordinates/positioning)
- Empty state rendering condition (`<slot name="empty">`)
- Error handling / boundary behavior

Write your complete, structured specification report to:
/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/spec_miner_survey_1/handoff.md

When complete, update progress.md in your directory and send a message back to parent.
