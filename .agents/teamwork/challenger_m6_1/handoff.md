# Milestone 6 Challenge Report: Navigation Components Adversarial Verification

**Agent**: `challenger_m6_1`  
**Date**: 2026-10-16T13:43:00Z  
**Recipient**: `8ce10391-b075-41f8-9af9-fa6eb0c45e28` (orchestrator_phase4_7_1)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### Empirical Test Harness Execution
Authored a 16-test empirical adversarial stress harness in `ui/src/components/navigation-challenge.test.ts` covering `moul-tabs`, `moul-pagination`, `moul-breadcrumbs`, and `moul-link`.

**Execution Command**:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts
```

**Verbatim Output**:
```text
 RUN  v2.1.9 /Users/phearak/github/orgs/moul-dev/ui/ui

stderr | src/components/navigation-challenge.test.ts
Lit is in dev mode. Not recommended for production! See https://lit.dev/msg/dev-mode for more information.

stderr | src/components/navigation-challenge.test.ts > Empirical Adversarial Challenge: Navigation Components (Milestone 6) > MoulPagination (`moul-pagination`) Fuzzing & Boundaries > CHALLENGE-PAG-03: Component attribute clamping and rapid page jumps
Element moul-pagination scheduled an update (generally because a property was set) after an update completed, causing a new update to be scheduled. This is inefficient and should be avoided unless the next update can only be scheduled as a side effect of the previous update. See https://lit.dev/msg/change-in-update for more information.

 ✓ src/components/navigation-challenge.test.ts (16)
   ✓ Empirical Adversarial Challenge: Navigation Components (Milestone 6) (16)
     ✓ MoulTabs (`moul-tabs`) Adversarial Stress (5)
       ✓ CHALLENGE-TAB-01: Roving tabindex wrapping across 25 tabs under rapid arrow navigation
       ✓ CHALLENGE-TAB-02: Skipping multiple consecutive disabled tabs and boundary disabled tabs
       ✓ CHALLENGE-TAB-03: Survives pathological state: all tabs disabled without infinite loop
       ✓ CHALLENGE-TAB-04: Dynamic tab removal and insertion with slot update
       ✓ CHALLENGE-TAB-05: Orientation switching dynamically updates aria-orientation and vertical navigation
     ✓ MoulPagination (`moul-pagination`) Fuzzing & Boundaries (3)
       ✓ CHALLENGE-PAG-01: Boundary edge cases in generatePagination
       ✓ CHALLENGE-PAG-02: Property-based invariant fuzzing via fast-check
       ✓ CHALLENGE-PAG-03: Component attribute clamping and rapid page jumps
     ✓ MoulBreadcrumbs (`moul-breadcrumbs`) Mutation Stress (2)
       ✓ CHALLENGE-BRD-01: Stress mutation with empty, single, and 50+ items
       ✓ CHALLENGE-BRD-02: Dynamic is-current toggle and custom item separator preservation
     ✓ MoulLink (`moul-link`) Stress & Event Verification (3)
       ✓ CHALLENGE-LNK-01: Dynamic external vs internal toggle preserves rel and updates DOM
       ✓ CHALLENGE-LNK-02: Rapid press storm and composed event bubbling
       ✓ CHALLENGE-LNK-03: Disabled state suppresses press storm and keyboard activation
     ✓ Empirical Verification of Discovered Defects (3)
       ✓ CHAL-DEFECT-01: Lit undefined-attribute bug serializes aria-disabled="" and role="" in MoulLink
       ✓ CHAL-DEFECT-02: Lit undefined-attribute bug serializes aria-current="" on inactive pagination buttons
       ✓ CHAL-DEFECT-03: Secondary update cycle scheduled in MoulPagination.updated()

 Test Files  1 passed (1)
      Tests  16 passed (16)
   Start at  20:41:12
   Duration  772ms (transform 88ms, setup 25ms, collect 197ms, tests 117ms, environment 130ms, prepare 45ms)
```

### Full Regression Suite Execution
Executed all 4 migrated component test suites:
```bash
node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts
```
**Result**: 71 passed (71) across 4 test files in 4.07s.

### Code Quality & Dependency Verification
- **Biome Check**: `./node_modules/.bin/biome check ui/src/components/navigation-challenge.test.ts`: Checked 1 file, 0 errors, 0 warnings.
- **Zero-React Dependency Guard**: `bun ./scripts/verify-no-react.ts all`:
  `✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.`

---

### Confirmed Empirical Defects

#### Defect 1 (CRITICAL ARIA & HTML): Lit `undefined` attribute serialization leaks `aria-disabled=""`, `role=""`, and `href=""` in `MoulLink`
- **File**: `ui/src/components/Link/Link.ts`, lines 89–98:
  ```ts
  return html`
    <a
      part="base"
      href=${this.isDisabled ? undefined : this.href || undefined}
      target=${target || undefined}
      rel=${effectiveRel || undefined}
      role=${!this.href ? 'button' : undefined}
      tabindex=${this.isDisabled ? '-1' : '0'}
      aria-disabled=${this.isDisabled ? 'true' : undefined}
      @click=${this.handleClick}
      @keydown=${this.handleKeyDown}
    >
  `
  ```
- **Observed Behavior**:
  1. In Lit templates, passing `undefined` to an HTML attribute expression does NOT remove the attribute. Instead, Lit stringifies `undefined` as `""` (empty string). To conditionally remove an attribute in Lit, one MUST use `nothing` from `'lit'` (or `ifDefined` from `'lit/directives/if-defined.js'`).
  2. Because `aria-disabled=${this.isDisabled ? 'true' : undefined}` is used: when `this.isDisabled` is `false`, the rendered DOM anchor has `aria-disabled=""` (`anchor.hasAttribute('aria-disabled') === true`). In WAI-ARIA 1.2, boolean attributes present with an empty or non-"false" token are treated as `"true"` by assistive technology (screen readers like NVDA, VoiceOver, JAWS). Enabled links are therefore announced to assistive tech users as disabled!
  3. Because `role=${!this.href ? 'button' : undefined}` is used: when `this.href` is provided, the anchor renders `role=""`, which is an invalid ARIA role.
  4. Because `href=${this.isDisabled ? undefined : this.href || undefined}` is used: when `this.isDisabled` is `true`, the anchor retains `href=""`, which in standard HTML is an active hyperlink to the current page. Similarly, in button mode (no `href`), it also renders `href=""`.
- **Reproduced in Test**: `CHAL-DEFECT-01` in `ui/src/components/navigation-challenge.test.ts`:
  ```ts
  expect(anchor?.hasAttribute('aria-disabled')).toBe(true)
  expect(anchor?.getAttribute('aria-disabled')).toBe('')
  expect(anchor?.hasAttribute('role')).toBe(true)
  expect(anchor?.getAttribute('role')).toBe('')
  ```

#### Defect 2 (CRITICAL ARIA): `MoulPagination` serializes `aria-current=""` on all inactive page buttons
- **File**: `ui/src/components/Pagination/Pagination.ts`, line 162:
  ```ts
  <button
    key="page-${item}"
    part="page ${isCurrent ? 'page-active' : ''}"
    aria-label="Page ${item}"
    aria-current=${isCurrent ? 'page' : undefined}
    @click=${() => this.setPage(item)}
  >
  ```
- **Observed Behavior**:
  For all non-active page buttons (`isCurrent === false`), `isCurrent ? 'page' : undefined` evaluates to `undefined`.
  Lit renders `<button aria-current="" ...>`.
  Under WAI-ARIA 1.2, any element with the `aria-current` attribute present (with empty or unspecified value) defaults to `aria-current="page"`. Assistive technology announces EVERY single button in the pagination control as the current page!
- **Reproduced in Test**: `CHAL-DEFECT-02` in `ui/src/components/navigation-challenge.test.ts`:
  ```ts
  const page2Btn = pagination.shadowRoot?.querySelector('button[aria-label="Page 2"]')
  expect(page2Btn?.hasAttribute('aria-current')).toBe(true)
  expect(page2Btn?.getAttribute('aria-current')).toBe('')
  ```

#### Defect 3 (PERFORMANCE & LIFECYCLE): Inefficient secondary update cycle scheduled in `MoulPagination.updated()`
- **File**: `ui/src/components/Pagination/Pagination.ts`, lines 106–116:
  ```ts
  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('totalPages') || changedProps.has('currentPage')) {
      const maxPages = Math.max(1, this.totalPages || 1)
      const clamped = Math.max(1, Math.min(this.currentPage || 1, maxPages))
      if (this.currentPage !== clamped) {
        this.currentPage = clamped
      }
    }
  }
  ```
- **Observed Behavior**:
  Mutating reactive properties (`this.currentPage = clamped`) inside `updated()` executes *after* the DOM has already been rendered. This immediately queues an additional render cycle, emitting Lit's runtime warning:
  `Element moul-pagination scheduled an update (generally because a property was set) after an update completed, causing a new update to be scheduled. This is inefficient and should be avoided unless the next update can only be scheduled as a side effect of the previous update.`
  In Lit, property sanitation and boundary clamping must be handled in `willUpdate(changedProps)` *before* DOM rendering, ensuring zero redundant renders.
- **Reproduced in Test**: `CHAL-DEFECT-03` in `ui/src/components/navigation-challenge.test.ts`:
  Observed multiple `requestUpdate()` calls for a single property change when clamping occurs.

#### Defect 4 (ACCESSIBILITY): `MoulBreadcrumbItem` serializes `aria-current=""` when unlinked and not current
- **File**: `ui/src/components/Breadcrumbs/BreadcrumbItem.ts`, lines 28–32:
  ```ts
  ${
    this.href && !this.isCurrent
      ? html`<a part="link" href=${this.href}><slot></slot></a>`
      : html`<span part="text" aria-current=${this.isCurrent ? 'page' : undefined}><slot></slot></span>`
  }
  ```
- **Observed Behavior**:
  When a breadcrumb item has no `href` and `isCurrent` is `false`, it renders a `<span>` with `aria-current=""` instead of omitting the attribute. Screen readers treat it as the active page.

---

## 2. Logic Chain

1. **Premise 1**: Lit's templating engine distinguishes between property/attribute removal (`nothing`) and empty values (`undefined` / `null`).
   - In React JSX, `attr={undefined}` omits the attribute from the DOM.
   - In Lit HTML templates, `attr=${undefined}` sets `attr=""` in the DOM. To omit the attribute, `nothing` from `'lit'` must be passed.
   - Observation: `MoulLink`, `MoulPagination`, and `MoulBreadcrumbItem` use `${condition ? value : undefined}` in attribute positions across `aria-disabled`, `aria-current`, `role`, `href`, `target`, and `rel`.
   - Conclusion: This migration oversight causes attribute leakage across all three components.

2. **Premise 2**: Assistive technologies (screen readers) rely on standard WAI-ARIA attribute omission to determine state.
   - WAI-ARIA 1.2 explicitly specifies that the mere presence of `aria-disabled` without the value `"false"` communicates disabled status, and the presence of `aria-current` without `"false"` communicates active item status.
   - Observation: Every enabled `<moul-link>` receives `aria-disabled=""`, and every non-current `<moul-pagination>` button receives `aria-current=""`.
   - Conclusion: Defect 1 and Defect 2 break accessibility semantics for keyboard and screen reader users.

3. **Premise 3**: Reactive Web Component lifecycles must avoid double rendering and render loops.
   - Lit provides `willUpdate()` specifically for deriving or clamping reactive properties before the element renders. Setting reactive properties in `updated()` forces Lit to immediately schedule another update cycle.
   - Observation: `MoulPagination.updated()` clamps `this.currentPage = clamped`, triggering Lit's runtime warning and causing redundant DOM updates.
   - Conclusion: Defect 3 is an unneeded performance cost that violates Lit lifecycle best practices.

---

## 3. Caveats

- **Algorithmic Correctness**:
  - `generatePagination` is mathematically sound and passed all boundary fuzzing and fast-check property tests (300 randomized runs from -500 to 20,000 pages).
  - `MoulTabs` roving tabindex wrapping, rapid arrow-key spam, Home/End jumps, and multi-disabled skipping across 25 tabs are completely robust and correctly implemented.
  - `MoulBreadcrumbs` item mutation, separator propagation, and dynamic slot updates passed 55-item bulk stress tests.
  - `MoulLink` pointer and keyboard press event bubbling with `composed: true` passed a 50-event burst storm cleanly.
- The required fixes are localized to template bindings (replacing `undefined` with `nothing`) and moving one lifecycle method from `updated` to `willUpdate`. No architectural redesign is necessary.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone 6 cannot be approved due to critical accessibility defects (leaking `aria-disabled=""` on enabled links and `aria-current=""` on inactive pagination buttons) and a redundant update cycle in `MoulPagination`.

### Required Worker Remediations:

1. **Fix `ui/src/components/Link/Link.ts`**:
   Import `nothing` from `'lit'` and update template bindings:
   ```ts
   import { html, LitElement, nothing } from 'lit'
   ...
   return html`
     <a
       part="base"
       href=${this.isDisabled ? nothing : this.href || nothing}
       target=${target || nothing}
       rel=${effectiveRel || nothing}
       role=${!this.href ? 'button' : nothing}
       tabindex=${this.isDisabled ? '-1' : '0'}
       aria-disabled=${this.isDisabled ? 'true' : nothing}
       @click=${this.handleClick}
       @keydown=${this.handleKeyDown}
     >
   `
   ```

2. **Fix `ui/src/components/Pagination/Pagination.ts`**:
   - Import `nothing` from `'lit'` and update `aria-current`:
     ```ts
     aria-current=${isCurrent ? 'page' : nothing}
     ```
   - Move property clamping from `updated()` to `willUpdate()`:
     ```ts
     protected override willUpdate(changedProps: PropertyValues): void {
       super.willUpdate(changedProps)

       if (changedProps.has('totalPages') || changedProps.has('currentPage')) {
         const maxPages = Math.max(1, this.totalPages || 1)
         const clamped = Math.max(1, Math.min(this.currentPage || 1, maxPages))
         if (this.currentPage !== clamped) {
           this.currentPage = clamped
         }
       }
     }
     ```

3. **Fix `ui/src/components/Breadcrumbs/BreadcrumbItem.ts`**:
   Import `nothing` from `'lit'` and update `aria-current`:
   ```ts
   import { html, LitElement, nothing } from 'lit'
   ...
   : html`<span part="text" aria-current=${this.isCurrent ? 'page' : nothing}><slot></slot></span>`
   ```

---

## 5. Verification Method

To independently reproduce the findings and verify the challenge test suite:

1. **Run the Challenge Test Harness**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/navigation-challenge.test.ts
   ```
   *Expected outcome*: 16 passed tests verifying navigation stress resilience and asserting the presence of Defects 1, 2, and 3.

2. **Run All Component Test Suites**:
   ```bash
   node ui/node_modules/.bin/vitest run --root ui src/components/Navigation.test.ts src/components/Overlays.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts
   ```
   *Expected outcome*: 71 passed tests with zero regressions.

3. **Run Biome Verification**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/navigation-challenge.test.ts
   ```
   *Expected outcome*: 0 errors, 0 warnings.

4. **Run Zero-React Package Check**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected outcome*: Exit code 0, 0 disallowed packages.
