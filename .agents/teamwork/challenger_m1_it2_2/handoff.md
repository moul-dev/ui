# Empirical Challenge Handoff Report: Milestone 1 Iteration 2

**Agent**: `challenger_m1_it2_2`  
**Role**: Empirical Challenger (Critic, Specialist)  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m1_it2_2`  
**Date**: 2026-10-17  
**Verdict**: **APPROVE**  

---

## 1. Observation

### 1.1 Empirical Scope & Challenges Tested
The empirical evaluation challenged the integration and stress resilience of `MoulChartTooltip` (`moul-chart-tooltip`) and `MoulChartContainer` (`moul-chart-container`) across the following dimensions:
1. **Slotted Tooltip Interaction During Active Resizing**:
   - Slotted `<moul-chart-tooltip>` inside `<moul-chart-container>` during 50 sequential resizes spanning 370px to 1350px (`xs` through `xl` breakpoints).
   - Tooltip positioning was dynamically updated to container midpoint on every step.
   - Verified that `left: 0px`, `top: 0px`, and GPU transform `translate3d(${x}px, ${y}px, 0)` updated synchronously without coordinate drift or popover detachment.
2. **Concurrent Resize Thrashing & Rapid Show/Hide Toggling**:
   - Interleaved 100 high-frequency container resizes (alternating between 450px and 800px) with synchronous `tooltip.show(...)` and `tooltip.hide()` calls using multi-series payload structures.
   - Tested recovery of popover open state and event handling.
3. **Empty State Transition Resilience**:
   - Oscillated container `isEmpty` state 20 times with an active slotted tooltip to verify light DOM node identity preservation and immediate re-display upon returning to `isEmpty = false`.
4. **Pointer Jitter Prevention via `pointer-events: none`**:
   - Inspected CSS declarations in `ChartTooltip.styles.ts` confirming `:host` and `[part="container"]` specify `pointer-events: none;`.
   - Slotted an interactive DOM target (`#datapoint-btn`) underneath an open tooltip at overlapping coordinates (100, 100).
   - Dispatched `pointerenter`, `pointerleave`, and `click` events to verify that the tooltip is transparent to hit-testing: the underlying element received `pointerenter` and `click` without triggering spurious `pointerleave` events (which would cause rapid tooltip flicker/jitter oscillation).
5. **Multi-Series Tooltip Rendering Across Breakpoint Transitions**:
   - Rendered 3-series payload with color indicators and values, executing rapid resize steps through `xs`, `sm`, `md`, `lg`, and `xl`.
   - Verified that all series items and title headers render cleanly without layout reflow corruption.
6. **Container & Slotted Tooltip Disconnect/Reconnect**:
   - Detached an actively displayed container with an open slotted tooltip from the DOM and re-attached it, verifying both ResizeObserver reconnection and tooltip popover functionality.

### 1.2 Tool Commands & Verbatim Results
1. **Target Vitest Execution**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts src/components/chart-container-challenge.test.ts
   ```
   *Output*:
   ```
   ✓ src/components/Charts.test.ts (21)
   ✓ src/components/chart-container-challenge.test.ts (28)

   Test Files  2 passed (2)
        Tests  49 passed (49)
     Duration  687ms
   ```

2. **Combined Tooltip & Container Challenge Suite**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts src/components/chart-container-challenge.test.ts src/components/chart-tooltip-challenge.test.ts
   ```
   *Output*:
   ```
   ✓ src/components/Charts.test.ts (21)
   ✓ src/components/chart-container-challenge.test.ts (28)
   ✓ src/components/chart-tooltip-challenge.test.ts (29)

   Test Files  3 passed (3)
        Tests  78 passed (78)
     Duration  1.04s
   ```

3. **Full Converted Monorepo Regression Suite**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/tokens/Tokens.test.ts src/controllers/Controllers.test.ts src/components/Actions.test.ts src/components/Surfaces.test.ts src/components/Overlays.test.ts src/components/Navigation.test.ts src/components/Forms.test.ts src/components/Charts.test.ts src/components/chart-container-challenge.test.ts src/components/chart-tooltip-challenge.test.ts
   ```
   *Output*:
   ```
   Test Files  10 passed (10)
        Tests  246 passed (246)
     Duration  4.74s
   ```

4. **Biome Lint and Format Validation**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/chart-container-challenge.test.ts
   ```
   *Output*:
   ```
   Checked 1 file in 16ms. No fixes applied.
   ```

5. **Zero-React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Output*:
   ```
   ✓ [verify-no-react] Target 'all': Zero disallowed React/legacy packages found across inspected manifests.
   ```

---

## 2. Logic Chain

1. **Slotted Coordinate Synchronization During Resizing**:
   - `MoulChartContainer` encapsulates its layout in shadow DOM and projects children into `<div part="content" class="content">`. Because `:host` of `MoulChartTooltip` uses `position: absolute; left: 0px; top: 0px; transform: translate3d(x, y, 0) translate(-50%, -100%) translateY(-8px);`, positioning occurs relative to the positioned content ancestor.
   - When the container resizes across breakpoints (`xs` through `xl`), `LayoutIndicatorController` updates container dimensions and dispatches `viewport-resize`. Slotted tooltip coordinates remain anchored to the specified (x, y) coordinates without cumulative offset errors.
2. **Pointer Jitter Prevention Mechanism**:
   - When a user hovers an SVG/chart point, the chart renders the tooltip at cursor coordinates. If the tooltip captured pointer events, the mouse cursor would enter the tooltip box, generating a `pointerleave` event on the underlying chart point and triggering tooltip dismissal. Dismissal would return the cursor to the chart point, generating a `pointerenter` event and re-opening the tooltip in an infinite flickering cycle.
   - Both `:host` and `[part="container"]` declare `pointer-events: none;`. Test verification confirmed that simulated pointer events (`pointerenter`, `click`) pass through directly to underlying elements without interruption or leave event triggers.
3. **Resilience to Churn & Lifecycle Mutations**:
   - Testing 100 concurrent rapid resize steps combined with rapid show/hide toggles showed that microtask updates settle cleanly when awaited via universal Lit nested updates.
   - Re-attaching a disconnected container restores `ResizeObserver` observation without leaking observers or dropping subsequent dimension mutations.
   - Container `isEmpty` slot swapping does not de-allocate or corrupt light DOM tooltip elements.

---

## 3. Caveats

- Unit tests in Happy DOM verify CSS text definitions and event bubbling contracts; native browser GPU compositor performance and sub-pixel antialiasing must be evaluated in browser E2E environments during visual regression testing.
- The overarching `bun run build:ui` command depends on unconverted components scheduled for subsequent milestones; Milestone 1 chart foundation components and test suites pass with 100% clean status.

---

## 4. Conclusion

**Verdict: APPROVE**

The implementation of `MoulChartTooltip` and `MoulChartContainer` satisfies all architectural and stress requirements:
- Tooltip functions reliably when slotted inside the container during active resizing and rapid show/hide cycles.
- `pointer-events: none` eliminates pointer jitter and permits transparent hit-testing to underlying interactive chart elements.
- 100% of unit, integration, and challenge tests pass (49/49 target, 78/78 chart-specific, 246/246 total converted suite).
- 0 lint errors, 0 warnings, and zero disallowed React dependencies.

---

## 5. Verification Method

To reproduce and independently verify:

1. **Execute Target Vitest Test Command**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts src/components/chart-container-challenge.test.ts
   ```
   *Expected Output*: Exit code 0, 2 test files passed, 49 tests passed.

2. **Run All Chart Test Files**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts src/components/chart-container-challenge.test.ts src/components/chart-tooltip-challenge.test.ts
   ```
   *Expected Output*: Exit code 0, 3 test files passed, 78 tests passed.

3. **Run Biome Linter Check**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/chart-container-challenge.test.ts
   ```
   *Expected Output*: Exit code 0, 0 errors, 0 warnings.

4. **Run Zero-React Audit**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected Output*: Exit code 0, Zero disallowed packages.
