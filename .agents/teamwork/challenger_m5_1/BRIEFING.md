# BRIEFING — 2026-10-16T10:16:00Z

## Mission
Author an empirical adversarial stress test suite in ui/src/components/surfaces-challenge.test.ts verifying Card, Badge, Alert, Tag/TagGroup, Avatar/AvatarGroup under extreme workloads and edge cases.

## 🔒 My Identity
- Archetype: empirical challenger
- Roles: critic, specialist
- Working directory: /Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m5_1
- Original parent: 8ce10391-b075-41f8-9af9-fa6eb0c45e28
- Milestone: Milestone 5 (Surfaces & Feedback)
- Instance: 1 of 2

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Report any failures as findings — do NOT fix them yourself
- Empirically verify: write and execute tests
- Never trust worker's claims or logs
- Test file: ui/src/components/surfaces-challenge.test.ts

## Current Parent
- Conversation ID: 8ce10391-b075-41f8-9af9-fa6eb0c45e28
- Updated: 2026-10-16T10:16:00Z

## Review Scope
- **Files to review**: `ui/src/components/Alert/Alert.ts`, `ui/src/components/TagGroup/Tag.ts`, `ui/src/components/TagGroup/TagGroup.ts`, `ui/src/components/Avatar/Avatar.ts`, `ui/src/components/Avatar/AvatarGroup.ts`, `ui/src/components/Card/Card.ts`, `ui/src/components/Badge/Badge.ts`
- **Interface contracts**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/ORIGINAL_REQUEST.md`, `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/orchestrator_phase4_7_1/SCOPE.md`
- **Review criteria**: Empirical adversarial stress testing, boundary conditions, rapid interactions, edge cases

## Key Decisions Made
- Authored 32 empirical challenge tests in `ui/src/components/surfaces-challenge.test.ts`
- Verified via Vitest (`32 passed (32)`) and formatted with Biome
- Replicated 3 distinct component bugs and 1 worker handoff documentation discrepancy
- Verdict: REQUEST_CHANGES due to fatal runtime crash in `MoulAvatar` on whitespace-only names, lifecycle bug on image error recovery, and broken size cascade in `MoulAvatarGroup`.

## Artifact Index
- `.agents/teamwork/challenger_m5_1/DISPATCH.md` — Incoming task instructions
- `.agents/teamwork/challenger_m5_1/BRIEFING.md` — Situational awareness
- `.agents/teamwork/challenger_m5_1/handoff.md` — Empirical challenge report and verdict
- `ui/src/components/surfaces-challenge.test.ts` — 32-test adversarial stress harness

## Attack Surface
- **Hypotheses tested**:
  - MoulAlert: rapid dismiss bursts, 100 rapid tone mutations, dismiss button a11y & contract, dynamic is-dismissible toggling, 25 tone x variant combinations.
  - MoulTag & MoulTagGroup: 50 concurrent tag removals, selection mode transitions (multiple -> single -> none), remove button event isolation from press, disabled state immunity, group is-removable propagation, missing key resilience.
  - MoulAvatar & MoulAvatarGroup: whitespace-only name strings, empty string fallback, single char names, irregular multi-word names, accented names, Unicode/emoji names, image error recovery, max=0/1/100 boundary conditions, dynamic DOM addition/removal, group size cascade.
  - MoulCard: dynamic isInteractive reflection, non-interactive trigger immunity, keyboard navigation (Space, Enter, repeat), 50 rapid clicks, slotted interactive elements.
  - MoulBadge: 50-cycle tone/variant mutations, invalid value normalization, empty slots, is-dot property audit.
- **Vulnerabilities found**:
  1. CRITICAL: `MoulAvatar` crashes with unhandled `TypeError` when given whitespace-only name string (`getInitials` executes `undefined.toUpperCase()`).
  2. HIGH: `MoulAvatar` fails to recover from image error on `src` change due to post-render `hasImageError = false` clearing in `updated()`.
  3. MEDIUM: `MoulAvatarGroup` size cascade is broken because `MoulAvatar` reflects default `size="md"` attribute, blocking `!avatar.hasAttribute('size')`.
  4. DISCREPANCY: Worker handoff falsely claims `is-dot` support on `MoulBadge`.
- **Untested angles**:
  - Long text truncation inside Card slots
  - Keyboard focus rings under high contrast CSS media queries
