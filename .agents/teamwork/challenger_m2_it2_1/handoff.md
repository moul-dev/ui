# Empirical Challenge Handoff: MoulLineChart (`moul-line-chart`)

**Agent**: `challenger_m2_it2_1`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/challenger_m2_it2_1`  
**Parent Agent**: `4562f942-bc5a-4d72-ad00-d87e731f5321`  
**Target Component**: `MoulLineChart` (`ui/src/components/LineChart/LineChart.ts`)  
**Verdict**: **REQUEST_CHANGES**  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Test Suite Failure in `Charts.test.ts`
When executing the test suite committed by `worker_m2_1`:
```bash
node ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
```
**Result**: 1 test failed out of 41 tests.
```
FAIL  src/components/Charts.test.ts > Milestone 2: Continuous Coordinate Charts Test Suite > MoulLineChart (`moul-line-chart`) > CHART-LINE-09: Fast-check property test: path data d starts with M and never contains NaN
Error: Property failed after 5 tests
{ seed: -1854865618, path: "4:0:0:1:0:0:0:0:2:0:0:0:0:0", endOnFailure: true }
Counterexample: [[{"x":" ","val":-5e-324},{"x":" ","val":5e-324}]]
Shrunk 13 time(s)
Got RangeError: Invalid array length
    at ticks (file:///Users/phearak/github/orgs/moul-dev/ui/node_modules/.bun/d3-array@3.2.4/node_modules/d3-array/src/ticks.js:35:34)
    at Function.scale.ticks (file:///Users/phearak/github/orgs/moul-dev/ui/node_modules/.bun/d3-scale@4.0.2/node_modules/d3-scale/src/linear.js:11:12)
    at MoulLineChart.render (/Users/phearak/github/orgs/moul-dev/ui/ui/src/components/LineChart/LineChart.ts:293:27)
```

### 1.2 Root Cause in Source Code
In `ui/src/components/LineChart/LineChart.ts`, lines 258–295:
```ts
258:     if (yValues.length > 0) {
259:       const rawMinY = Math.min(...yValues)
260:       const rawMaxY = Math.max(...yValues)
261: 
262:       if (rawMinY === rawMaxY) {
263:         // All-identical values safeguard
264:         if (rawMinY === 0) {
...
274:       } else {
275:         // Normal domain calculation with negative safeguards
276:         if (rawMinY < 0) {
277:           minY = rawMinY
278:           maxY = Math.max(0, rawMaxY)
279:         } else {
280:           minY = 0
281:           maxY = rawMaxY || 1
282:         }
283:       }
284:     }
285: 
286:     const yScale = scaleLinear()
287:       .domain([minY, maxY])
288:       .range([height - padding.bottom, padding.top])
289:       .nice()
...
293:     const yTicks = yScale.ticks(5)
```
When `yValues` contain subnormal floats (or floating-point values where `Math.abs(maxY - minY) < 1e-300`, such as `-5e-324` and `5e-324`), `rawMinY !== rawMaxY`, so `minY` is `-5e-324` and `maxY` is `5e-324`.
Line 293 calls `yScale.ticks(5)` without checking whether `Math.abs(maxY - minY)` is below minimum normal threshold or wrapping `yScale.ticks(5)` in a try/catch fallback. D3's internal `d3-array/src/ticks.js:35` evaluates `const n = i2 - i1 + 1, ticks = new Array(n)` where `n` underflows, throwing an unhandled `RangeError: Invalid array length`.

### 1.3 Adversarial Challenge Suite (`line-chart-challenge.test.ts`)
Created `ui/src/components/line-chart-challenge.test.ts` containing 34 adversarial tests covering:
1. **0 Points (Empty / Null / Undefined)**:
   - `data = []` renders empty state slot `<slot name="empty"><p class="empty-message">No data available</p></slot>`.
   - `data = null` and `data = undefined` render empty state without throwing.
   - Dynamic switching between empty and populated states updates DOM correctly.
2. **1 Point**:
   - Single point renders valid `M px py` move command.
   - Coordinates are finite numbers, no `NaN`. Exactly 1 circle rendered. Hover dispatches `point-hover`.
3. **2 Identical Points**:
   - Identical X and Y: valid path, no NaN.
   - Identical X with different Y (vertical line): valid path, no NaN.
   - Different X with identical Y (flat horizontal line): valid path, no NaN.
   - 5 consecutive identical points: valid path, no NaN.
4. **All Zero Y Values**:
   - `[0, 0, 0, 0]`: domain defaults safely to `[0, 1]`, finite coordinates.
5. **Negative Y Values**:
   - All negative values: correctly plotted (-50 lower / larger cy than -10).
   - Mixed negative, zero, positive: baseline aligned at `yScale(0)`.
   - Identical negative values (`[-35, -35]`): domain expanded to `[-42, 0]`, no division by zero.
6. **Mixed Null / Undefined / Non-numeric Values**:
   - Nulls and undefined in records create gaps in line path via D3 `defined()`, circles only rendered for valid numbers.
   - String numbers (`'10'`, `'30'`) correctly converted to numbers.
   - Non-numeric strings and `NaN` safely skipped.
   - Completely null data renders empty path with 0 circles, without throwing.
   - Missing `xKey` in records falls back to empty string label.
7. **100+ Points Stress Test**:
   - 120 points: renders smoothly, exact 120 circles, verified hover on indices 0, 59, 119.
   - 250 points: mounts in under 1 second (measured ~35ms), no coordinate overflow.
8. **Curve Factory Permutations**:
   - All 6 curves (`linear`, `natural`, `step`, `stepAfter`, `stepBefore`, `monotoneX`) and unrecognized fallback string render valid paths.
9. **Empirical Bug Reproduction**:
   - Directly asserts the subnormal float `RangeError: Invalid array length` crash with `[-5e-324, 5e-324]`.

Execution command:
```bash
node ./ui/node_modules/.bin/vitest run --root ui src/components/line-chart-challenge.test.ts
```
**Result**: 34 passed (34).

Lint and formatting check:
```bash
./node_modules/.bin/biome check ui/src/components/line-chart-challenge.test.ts
```
**Result**: Checked 1 file in 13ms. No fixes applied. 0 errors.

---

## 2. Logic Chain

1. **Worker's Claim vs. Empirical Reality**:
   - In `worker_m2_1/handoff.md`, the worker claimed 41/41 tests passed and "No Caveats: All tasks... with 100% passing automated test coverage."
   - However, Vitest execution of `Charts.test.ts` reveals that `CHART-LINE-09` consistently fails when fast-check generates float values close to 0 (`[-5e-324, 5e-324]`).
2. **Crash Mechanism**:
   - Fast-check generates randomized doubles in `fc.double({ min: -10000, max: 10000, noNaN: true })`.
   - Subnormal numbers within `[-1e-300, 1e-300]` have an infinitesimal delta.
   - `LineChart.ts` passes this domain directly to `scaleLinear().domain([minY, maxY]).nice()`.
   - `yScale.ticks(5)` in `d3-scale`/`d3-array` fails during array allocation: `new Array(n)` where `n` is an invalid array length.
3. **Required Fix**:
   - In `LineChart.ts` (and identically in `AreaChart.ts`), a domain delta safeguard and tick fallback should be added:
     ```ts
     // If domain span is too small (< 1e-6) or subnormal, expand domain
     if (Math.abs(maxY - minY) < 1e-6) {
       minY -= 1
       maxY += 1
     }
     ```
     And wrap tick generation in a safe fallback:
     ```ts
     let yTicks: number[] = []
     try {
       yTicks = yScale.ticks(5)
     } catch {
       yTicks = [minY, maxY]
     }
     ```
4. **Review-Only Constraint Adherence**:
   - In accordance with the system rules ("Review-only — do NOT modify implementation code" and "Report any failures as findings — do NOT fix them yourself"), `LineChart.ts` was NOT modified by this challenger agent.
   - The failure was isolated, empirically verified, and preserved as a finding.

---

## 3. Caveats

- **Scope of Vulnerability**:
  - In normal business dashboards, values are rarely subnormal IEEE-754 floats (`1e-324`).
  - However, because `CHART-LINE-09` in the existing test suite uses `fc.double(...)`, CI test runs will intermittently or permanently fail until the worker applies the domain safeguard.
- **Other Edge Cases**:
  - All other edge cases specified in the dispatch (0 points, 1 point, 2 identical points, all zero Y values, negative Y values, mixed null/undefined, 100+ points, path data `d` validity) passed all assertions.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

`MoulLineChart` is robust across all standard pathological data scenarios (0 points, 1 point, flat zero lines, negative temperatures/revenues, null/undefined gaps, and 250+ points). However, changes are required because:
1. `CHART-LINE-09` in `ui/src/components/Charts.test.ts` is currently failing in test execution.
2. `LineChart.ts:293` lacks a guard against infinitesimal/subnormal floating-point deltas, leading to an unhandled `RangeError: Invalid array length` in `yScale.ticks(5)`.

---

## 5. Verification Method

To independently reproduce the failure and verify the challenge findings:

1. **Run Existing Test Suite (demonstrating failure)**:
   ```bash
   node ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: `CHART-LINE-09` fails with `RangeError: Invalid array length` at `LineChart.ts:293`.

2. **Run Empirical Challenge Suite**:
   ```bash
   node ./ui/node_modules/.bin/vitest run --root ui src/components/line-chart-challenge.test.ts
   ```
   *Expected outcome*: 34 tests pass (including explicit empirical reproduction of the subnormal float crash).

3. **Verify Lint & Format**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/line-chart-challenge.test.ts
   ```
   *Expected outcome*: Checked 1 file in ~13ms. No fixes applied. Exit code 0.
