# Review & Adversarial Challenge Report: Milestone 5 (Surfaces & Feedback)

**Reviewer / Critic:** `reviewer_m5_2`  
**Milestone:** Milestone 5 (Phase 5: Surface & Feedback Components)  
**Date:** 2026-10-16  
**Final Verdict:** **APPROVE**  
**Integrity Status:** **VERIFIED (Zero Violations Detected)**  

---

## 1. Observation

Direct empirical observations and command outputs recorded during review:

1. **Regression & Test Suite Execution:**
   - Command:
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts
     ```
   - Verbatim Output:
     ```
     Test Files  5 passed (5)
          Tests  163 passed (163)
       Start at  17:10:29
       Duration  3.93s (transform 403ms, setup 137ms, collect 1.30s, tests 3.71s, environment 1.00s, prepare 351ms)
     ```
   - Breakdown of passed test files:
     - `src/components/Surfaces.test.ts`: **26 passed (26)**
     - `src/components/Actions.test.ts`: **21 passed (21)**
     - `src/controllers/Controllers.test.ts`: **45 passed (45)**
     - `src/tokens/tokens.test.ts`: **35 passed (35)**
     - `src/utils/utils-challenge.test.ts`: **36 passed (36)**

2. **Standalone Surfaces Test Execution:**
   - Command:
     ```bash
     node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts
     ```
   - Verbatim Output:
     ```
     ✓ src/components/Surfaces.test.ts (26) 466ms
       ✓ Phase 5: Surface & Feedback Components (26) 466ms
         ✓ MoulTypography (`moul-typography`) (2)
           ✓ SURF-TYP-01: Semantic tag mapping for variants
           ✓ SURF-TYP-02: Tone attribute reflection
         ✓ MoulKbd (`moul-kbd`) (1)
           ✓ SURF-KBD-01: Keyboard notation with slot fallback and keys splitting
         ✓ MoulSeparator (`moul-separator`) (1)
           ✓ SURF-SEP-01: ARIA separator role and orientation
         ✓ MoulSpinner (`moul-spinner`) (1)
           ✓ SURF-SPN-01: Accessible loading status and SVG rendering
         ✓ MoulSkeleton (`moul-skeleton`) (1)
           ✓ SURF-SKL-01: Shape, animation variant, and dimension styling
         ✓ MoulBadge (`moul-badge`) (2)
           ✓ SURF-BDG-01: Tone × Variant combination matrix & size
           ✓ SURF-BDG-02: Slots projection for prefix, default, and suffix
         ✓ MoulCard (`moul-card`) (2)
           ✓ SURF-CRD-01: Slots projection for header, body, and footer
           ✓ SURF-CRD-02: Interactive card button role and press event
         ✓ MoulEmptyState (`moul-empty-state`) (1)
           ✓ SURF-EMP-01: Slot layout, alignment, and status role
         ✓ MoulAlert (`moul-alert`) (2)
           ✓ SURF-ALT-01: Alert role for error/warning and status role for info
           ✓ SURF-ALT-02: Dismissible alert triggers dismiss event on button click
         ✓ MoulProgressBar (`moul-progress-bar`) (2)
           ✓ SURF-PRG-01: ARIA progress role, bounds, and clamping
           ✓ SURF-PRG-02: Indeterminate progress removes aria-valuenow
         ✓ MoulAvatar (`moul-avatar`) (2)
           ✓ SURF-AVT-01: Initials fallback derivation from name
           ✓ SURF-AVT-02: Image error dispatches error event and shows initials fallback
         ✓ MoulAvatarGroup (`moul-avatar-group`) (1)
           ✓ SURF-AVG-01: Overflow counter badge when avatars exceed max
         ✓ MoulTag & MoulTagGroup (2)
           ✓ SURF-TAG-01: MoulTag removal button dispatches remove event
           ✓ SURF-TAG-02: MoulTagGroup manages single and multiple selection
         ✓ MoulTable (`moul-table`) (3)
           ✓ SURF-TBL-01: Loading state renders skeleton placeholder rows
           ✓ SURF-TBL-02: Sorting headers and selection change events
           ✓ SURF-TBL-03: Empty state when data is empty and not loading
         ✓ MoulToast & toastQueue (3)
           ✓ SURF-TST-01: Toast initialization, role status, and popover manual
           ✓ SURF-TST-02: toastQueue adds toast, auto-dismisses after duration
           ✓ SURF-TST-03: Close button dismisses toast

     Test Files  1 passed (1)
          Tests  26 passed (26)
       Duration  1.14s
     ```

3. **Zero-React Enforcement Verification:**
   - Manifest check:
     ```bash
     bun ./scripts/verify-no-react.ts all
     ```
     Result: `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`
   - AST / Import scan across all 14 Phase 5 component directories:
     - Disallowed imports matching `react`, `react-dom`, `@stylexjs/stylex`, `@lit/react`: **0 found**.
     - Legacy `.tsx` files in the 14 directories: **0 found (all deleted)**.

4. **Code Health & Biome Check:**
   - Command:
     ```bash
     node_modules/.bin/biome check ui/src/components/Typography ui/src/components/Kbd ui/src/components/Separator ui/src/components/Spinner ui/src/components/Skeleton ui/src/components/Badge ui/src/components/Card ui/src/components/EmptyState ui/src/components/Alert ui/src/components/ProgressBar ui/src/components/Avatar ui/src/components/TagGroup ui/src/components/Table ui/src/components/Toast ui/src/components/Surfaces.test.ts
     ```
   - Result: `Checked 46 files in 50ms. No fixes applied.` (0 errors, 0 warnings).

5. **Custom Element Registration Verification:**
   - Verified that all 20 elements (16 component families + companions) register in `customElements` via `defineElement`:
     - `moul-typography`: `MoulTypography`
     - `moul-kbd`: `MoulKbd`
     - `moul-separator`: `MoulSeparator`
     - `moul-spinner`: `MoulSpinner`
     - `moul-skeleton`: `MoulSkeleton`
     - `moul-badge`: `MoulBadge`
     - `moul-card`: `MoulCard`
     - `moul-card-header`: `MoulCardHeader`
     - `moul-card-body`: `MoulCardBody`
     - `moul-card-footer`: `MoulCardFooter`
     - `moul-empty-state`: `MoulEmptyState`
     - `moul-alert`: `MoulAlert`
     - `moul-progress-bar`: `MoulProgressBar`
     - `moul-avatar`: `MoulAvatar`
     - `moul-avatar-group`: `MoulAvatarGroup`
     - `moul-tag`: `MoulTag`
     - `moul-tag-group`: `MoulTagGroup`
     - `moul-table`: `MoulTable`
     - `moul-toast`: `MoulToast`
     - `moul-toast-region`: `MoulToastRegion`

6. **Public Exports (`ui/src/index.ts`):**
   - Verified all 16 component classes, aliases (`MoulAlert as Alert`, `MoulCard as Card`, etc.), companion classes, types, and the global singleton `toastQueue` are cleanly exported.

---

## 2. Logic Chain

1. *Integrity Audit:* Scrutinized source code and tests for hardcoded outputs, facade classes, or fake assertions.
   - All components extend standard `LitElement`, declare reactive `properties`, open Shadow DOM templates, and bind real DOM event listeners.
   - `Surfaces.test.ts` utilizes dynamic property updates, simulated pointer events (`pointerdown`, `pointerup`, `click`), asynchronous timer advancement via `vi.advanceTimersByTimeAsync`, and generative property testing via `fast-check`.
   - Result: No cheating, no facade implementations, no hardcoded bypasses.

2. *Requirement 11 Conformance:*
   - `moul-typography` (Req 11.16): Tested and mapped to semantic HTML tags (`h1`–`h6`, `span`, `code`, `p`) based on `variant`.
   - `moul-kbd` (Req 11.7): Tested key splitting by `+`, mapping modifier symbols (`⌘`, `⌥`, `⇧`, `⌃`) to accessible ARIA labels with `role="group"`.
   - `moul-separator` (Req 11.9): Tested `<hr>` with `orientation` attribute and `role="separator"`.
   - `moul-spinner` (Req 11.11): Tested SVG circular spinner with `size` and accessible loading label (`role="status"`).
   - `moul-skeleton` (Req 11.10): Tested `shape` (`circle`, `line`, `rect`), `variant` (`pulse`, `wave`), dimension styling, and `aria-hidden="true"`.
   - `moul-badge` (Req 11.4): Verified 25 combinations of `tone` × `variant` with `fast-check` property tests, mount animation, and slot projections (`prefix`, default, `suffix`).
   - `moul-card` (Req 11.5): Tested named slots (`header`, `body`, `footer`), `is-interactive` triggering `role="button"` and `tabindex="0"`, and `PressController` tactile press scale.
   - `moul-empty-state` (Req 11.6): Tested named slots (`icon`, `title`, `description`, `actions`), `size`, `align`, and `role="status"`.
   - `moul-alert` (Req 11.1): Tested tone-driven role assignment (`alert` for error/warning, `status` for info), `is-dismissible` with animated collapse before `dismiss` event dispatch.
   - `moul-progress-bar` (Req 11.8): Tested bounds clamping, fill percentage, `role="progressbar"`, `aria-valuemin/max/now`, and `is-indeterminate` removing `aria-valuenow`.
   - `moul-avatar` & `moul-avatar-group` (Req 11.2, 11.3): Tested initials generation from single/two words, image error fallback to initials, and `max` overflow counter badge (`+2`) with excess avatar hiding.
   - `moul-tag` & `moul-tag-group` (Req 11.14): Tested `is-removable` with scale-out animation before `remove` event dispatch, and `MoulTagGroup` managing single/multiple selection synchronization.
   - `moul-table` (Req 11.12, 11.13): Tested `is-loading` rendering 3 skeleton placeholder rows, column header sorting toggling `asc`/`desc` and dispatching `sortchange`, checkbox row selection dispatching `selectionchange`, and empty data fallback.
   - `moul-toast` & `toastQueue` (Req 11.15): Tested `popover="manual"` top-layer promotion via `OverlayPresenceController`, `toastQueue.add()` inserting into `moul-toast-region` and auto-dismissing on timer expiration, and close button dismissal.

3. *Happy-DOM Compatibility:* Confirmed the patch in `ui/src/test-setup.ts` adding `undefined` to `HTMLElementConfig[tag].permittedParents` correctly resolves Happy-DOM stripping table elements inside Lit `<template>` fragments without affecting runtime browser behavior.

---

## 3. Adversarial Challenges & Findings

### [Minor] Finding 1: Whitespace-only name causes TypeError in `MoulAvatar.getInitials`
- **Location:** `ui/src/components/Avatar/Avatar.ts:10-17`
- **Mechanism:**
  ```ts
  function getInitials(name: string): string {
    if (!name) return ''
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) {
      return parts[0][0].toUpperCase()
    }
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  ```
- **Failure Scenario:** When `name = "   "`, `name` is truthy, so `if (!name)` does not return. `name.trim()` evaluates to `""`. Calling `"".split(/\s+/)` yields `[""]` (length 1). `parts[0]` is `""`, so `parts[0][0]` is `undefined`. Calling `.toUpperCase()` throws `TypeError: Cannot read properties of undefined (reading 'toUpperCase')`.
- **Blast Radius:** Renders an avatar inoperable if passed a whitespace-only string name without `src`.
- **Suggested Mitigation:** Check `const trimmed = name.trim(); if (!trimmed) return ''` at the top of `getInitials()`.

### [Minor] Finding 2: `MoulTable` loading state with no columns or data renders zero skeleton cells
- **Location:** `ui/src/components/Table/Table.ts:68-80`, `207-230`
- **Mechanism:** When `is-loading` is set on `<moul-table>` without `columns` or `data`, `getEffectiveColumns()` returns `[]`. The 3 loading rows render with 0 `<td>` elements (unless `is-selectable` is true, which renders only the checkbox skeleton).
- **Blast Radius:** Visual layout inconsistency if `<moul-table is-loading>` is instantiated before column metadata is loaded.
- **Suggested Mitigation:** Fallback to a default column count (e.g. 3 placeholder cells) when `cols.length === 0 && this.isLoading`.

### [Observation] Finding 3: `MoulTable` sorting is event-driven / controlled
- **Location:** `ui/src/components/Table/Table.ts:82-100`
- **Mechanism:** Clicking a sortable column header updates `sortColumn` and `sortDirection`, toggles the chevron rotation, and dispatches `sortchange` with `{ column, direction }`. It does not sort the in-memory `data` array in place.
- **Assessment:** Conforms to design requirements for controlled/server-side tables. Consumers implement sorting by listening to `sortchange` and providing re-sorted `data`.

---

## 4. Caveats

- Unmigrated legacy React test files in other milestones (e.g. `Properties.test.tsx`, `DatePicker.test.tsx`, `ListBox.test.tsx`, `Sidebar.test.tsx`) fail under global `tsc -b` because they attempt to use the newly migrated Lit custom element classes (`Table`, `Button`, `Toast`) as React JSX components. These belong to Phase 6 and Phase 7 migrations.
- In Happy-DOM, physical CSS animations and transitions are not visually rendered, but controller lifecycle timing and callbacks (`OverlayPresenceController`, `subtleAnimate`, `requestUpdate`) were fully verified.

---

## 5. Conclusion

**Verdict: APPROVE**

Milestone 5 (Phase 5: Surface & Feedback Components) is thoroughly and robustly implemented.
- All 16 custom elements across 14 component families are implemented in pure Lit 3.
- All 26 tests in `Surfaces.test.ts` pass cleanly.
- All 163 tests across the full regression suite pass without regression.
- Zero React/StyleX imports exist across all Phase 5 modules and manifests.
- Biome check passes with 0 errors and 0 warnings.
- Zero integrity violations were detected.

---

## 6. Verification Method

To independently reproduce this verification:

```bash
# 1. Run full regression test suite (163 tests)
node ui/node_modules/.bin/vitest run --root ui src/components/Surfaces.test.ts src/components/Actions.test.ts src/controllers/Controllers.test.ts src/tokens/tokens.test.ts src/utils/utils-challenge.test.ts

# 2. Run zero-React manifest verification
bun ./scripts/verify-no-react.ts all

# 3. Run Biome lint across touched component directories
node_modules/.bin/biome check ui/src/components/Typography ui/src/components/Kbd ui/src/components/Separator ui/src/components/Spinner ui/src/components/Skeleton ui/src/components/Badge ui/src/components/Card ui/src/components/EmptyState ui/src/components/Alert ui/src/components/ProgressBar ui/src/components/Avatar ui/src/components/TagGroup ui/src/components/Table ui/src/components/Toast ui/src/components/Surfaces.test.ts
```
