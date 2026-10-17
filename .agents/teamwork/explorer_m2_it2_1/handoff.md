# Investigation & Fix Strategy Report: LineChart Domain Span Safeguard & Defensive Ticks

**Agent**: `explorer_m2_it2_1`  
**Role**: Explorer / Read-Only Investigator  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_1`  
**Parent Agent**: `4562f942-bc5a-4d72-ad00-d87e731f5321`  
**Target Component**: `MoulLineChart` (`ui/src/components/LineChart/LineChart.ts`) & related `MoulAreaChart` (`ui/src/components/AreaChart/AreaChart.ts`)  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Verbatim Failure in `CHART-LINE-09`
In `ui/src/components/Charts.test.ts:857–888`:
```ts
it('CHART-LINE-09: Fast-check property test: path data d starts with M and never contains NaN', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(
        fc.record({
          x: fc.string({ minLength: 1, maxLength: 8 }),
          val: fc.double({ min: -10000, max: 10000, noNaN: true }),
        }),
        { minLength: 2, maxLength: 10 },
      ),
      async (generatedData) => { ... }
    )
  )
})
```
Running Vitest with seed `-1191213113` yields the following deterministic failure:
```
FAIL src/components/Charts.test.ts > Milestone 2: Continuous Coordinate Charts Test Suite > MoulLineChart (`moul-line-chart`) > CHART-LINE-09
Error: Property failed after 3 tests
{ seed: -1191213113, path: "2:0:0:1:1:0:1:0:0", endOnFailure: true }
Counterexample: [[{"x":" ","val":5e-324},{"x":" ","val":-5e-324}]]
Shrunk 8 time(s)
Got RangeError: Invalid array length (or Array length must be a positive integer of safe magnitude)
    at ticks (/Users/phearak/github/orgs/moul-dev/ui/node_modules/.bun/d3-array@3.2.4/node_modules/d3-array/src/ticks.js:35:34)
    at Function.scale.ticks (/Users/phearak/github/orgs/moul-dev/ui/node_modules/.bun/d3-scale@4.0.2/node_modules/d3-scale/src/linear.js:11:12)
    at MoulLineChart.render (/Users/phearak/github/orgs/moul-dev/ui/ui/src/components/LineChart/LineChart.ts:293:27)
```

### 1.2 Inspection of `ui/src/components/LineChart/LineChart.ts` Lines 254–295
```ts
254:     let minY = 0
255:     let maxY = 1
256: 
257:     if (yValues.length > 0) {
258:       const rawMinY = Math.min(...yValues)
259:       const rawMaxY = Math.max(...yValues)
260: 
261:       if (rawMinY === rawMaxY) {
262:         // All-identical values safeguard
263:         if (rawMinY === 0) {
264:           minY = 0
265:           maxY = 1
266:         } else if (rawMinY > 0) {
267:           minY = 0
268:           maxY = rawMaxY * 1.2
269:         } else {
270:           minY = rawMinY * 1.2
271:           maxY = 0
272:         }
273:       } else {
274:         // Normal domain calculation with negative safeguards
275:         if (rawMinY < 0) {
276:           minY = rawMinY
277:           maxY = Math.max(0, rawMaxY)
278:         } else {
279:           minY = 0
280:           maxY = rawMaxY || 1
281:         }
282:       }
283:     }
284: 
285:     const yScale = scaleLinear()
286:       .domain([minY, maxY])
287:       .range([height - padding.bottom, padding.top])
288:       .nice()
289: 
290:     const curveFactory = resolveCurveFactory(this.curve)
291: 
292:     // 4. Grid & Axis Ticks
293:     const yTicks = yScale.ticks(5)
294:     const baselineY = yScale(0) ?? height - padding.bottom
```

### 1.3 Inspection of `d3-array/src/ticks.js` Lines 5–35
```javascript
6:   const step = (stop - start) / Math.max(0, count),
7:       power = Math.floor(Math.log10(step)),
...
11:   if (power < 0) {
12:     inc = Math.pow(10, -power) / factor;
13:     i1 = Math.round(start * inc);
14:     i2 = Math.round(stop * inc);
...
35:   const n = i2 - i1 + 1, ticks = new Array(n);
```

### 1.4 Non-Finite Value Check in Line & Area Generators
- In `LineChart.ts:386–392`:
  ```ts
  .defined((d) => {
    const val = d[s.key]
    return (
      val !== null &&
      val !== undefined &&
      !Number.isNaN(Number(val))
    )
  })
  ```
  `Number.isNaN(Infinity)` evaluates to `false`. When `val` is `Infinity` or `-Infinity`, `yScale(Infinity)` computes `NaN`, emitting `NaN` into SVG path data `d` and circle coordinates.
- In `AreaChart.ts:255–256`:
  ```ts
  const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0
  ```
  When `raw === Infinity`, `Number(raw) || 0` returns `Infinity`, leaking `NaN` into `yScale(p.y1)`.

---

## 2. Logic Chain

1. **The IEEE-754 Subnormal Underflow Mechanism**:
   - When input values contain subnormal floats (e.g. `rawMinY = -5e-324` and `rawMaxY = 5e-324`), `rawMinY < 0`, so `minY = -5e-324` and `maxY = 5e-324`.
   - The domain span `maxY - minY = 1e-323`.
   - In `d3-array/src/ticks.js`, `step = 1e-323 / 5 = 2e-324`.
   - `power = Math.floor(Math.log10(2e-324)) = -324`.
   - In JavaScript, `10^308 <= Number.MAX_VALUE < 10^309`. Thus `Math.pow(10, -(-324)) = Math.pow(10, 324)` overflows to `Infinity`.
   - `inc = Infinity`.
   - `i1 = Math.round(-5e-324 * Infinity) = -Infinity`.
   - `i2 = Math.round(5e-324 * Infinity) = Infinity`.
   - `n = i2 - i1 + 1 = Infinity - (-Infinity) + 1 = Infinity`.
   - `new Array(Infinity)` immediately throws `RangeError: Invalid array length` (V8) / `RangeError: Array length must be a positive integer of safe magnitude` (JavaScriptCore/Bun).
   - Because `yScale.ticks(5)` is called unconditionally at line 293 during Lit's synchronous `render()` cycle, the entire component fails to render and crashes the test run.

2. **Domain Clamping Boundary**:
   - Empirical testing proves that any domain span whose `step < 1e-308` (i.e. span `< 5e-308`) causes D3 `ticks()` to crash.
   - In user interfaces and business dashboards, values clustered within `1e-6` of each other are visually identical on SVG displays (less than 0.001 pixel displacement).
   - In `LineChart.ts`, non-negative values are anchored with `minY = 0` (line 279) and non-positive values are anchored with `maxY = 0` (line 277).
   - Therefore, a domain span safeguard checking `(maxY - minY) < 1e-6` cleanly differentiates three cases:
     - **Straddling zero** (`minY < 0 && maxY > 0`): Expand symmetrically to `minY = -1`, `maxY = 1`.
     - **All non-positive** (`maxY <= 0`): Expand to `minY = -1`, `maxY = 0`.
     - **All non-negative** (`minY >= 0`): Expand to `minY = 0`, `maxY = 1`.

3. **Defense-in-Depth: Defensive Ticks Handling**:
   - Even with domain span safeguards, a defensive `try / catch` around `yScale.ticks(5)` ensures that no pathological floating-point combinations can ever crash Lit's `render()` method.
   - If `yScale.ticks(5)` throws, fallback to a safe 3-point or 2-point array: `[minY, (minY + maxY) / 2, maxY]`.

4. **Identical Vulnerability in `AreaChart.ts`**:
   - `ui/src/components/AreaChart/AreaChart.ts:297–320` performs identical `scaleLinear()` domain setup and calls `yScale.ticks(5)` unconditionally at line 320.
   - The same safeguard must be applied to `AreaChart.ts` to ensure full stability across the entire chart family.

---

## 3. Caveats

1. **Subnormal Data Context**: Subnormal floating-point numbers (`5e-324`) do not represent real-world business metrics, but they are valid IEEE-754 doubles generated by property-based test suites (`fast-check`) and scientific sensor streams. Robust components must handle them without crashing.
2. **Challenge Test Suite Update**: `ui/src/components/line-chart-challenge.test.ts` lines 367–389 currently has an `EMPIRICAL BUG REPRODUCTION` test that asserts `RangeError` is thrown. Once the worker applies the fix, that test should be updated to assert that it now renders cleanly without error.

---

## 4. Conclusion & Recommended Fix Strategy

### Recommendation 1: Domain Span Safeguard in `LineChart.ts`
Insert directly after line 283 (right after the `if (yValues.length > 0)` block):

```ts
    // Safeguard against degenerate subnormal domains (span < 1e-6)
    if (maxY - minY < 1e-6) {
      if (minY < 0 && maxY > 0) {
        minY = -1
        maxY = 1
      } else if (minY < 0) {
        minY = -1
        maxY = 0
      } else {
        minY = 0
        maxY = 1
      }
    }
```

### Recommendation 2: Defensive `yScale.ticks(5)` Handling in `LineChart.ts`
Replace line 293 (`const yTicks = yScale.ticks(5)`) with:

```ts
    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [minY, (minY + maxY) / 2, maxY]
    }
```

### Recommendation 3: Sanitize Non-Finite Numbers in `LineChart.ts`
- Line 390: Change `!Number.isNaN(Number(val))` to `Number.isFinite(Number(val))`.
- Line 431: Change `!Number.isNaN(Number(rawVal))` to `Number.isFinite(Number(rawVal))`.

### Recommendation 4: Mirror Safeguards in `AreaChart.ts`
- In `ui/src/components/AreaChart/AreaChart.ts` around line 301, apply the domain span check:
  ```ts
  if (domainMax - domainMin < 1e-6) {
    if (domainMin < 0 && domainMax > 0) {
      domainMin = -1
      domainMax = 1
    } else if (domainMin < 0) {
      domainMin = -1
      domainMax = 0
    } else {
      domainMin = 0
      domainMax = 1
    }
  }
  ```
- Wrap `yScale.ticks(5)` in a `try/catch` fallback.
- In line 255: `const num = Number(raw); const val = Number.isFinite(num) ? num : 0;`

---

## 5. Verification Method

1. **Verify Fix on Fast-Check Property Failure Seed**:
   ```bash
   bun --cwd ui -e "
   import * as fc from 'fast-check';
   import { scaleLinear } from 'd3-scale';

   fc.assert(
     fc.property(
       fc.array(
         fc.record({
           x: fc.string({ minLength: 1, maxLength: 8 }),
           val: fc.double({ min: -10000, max: 10000, noNaN: true }),
         }),
         { minLength: 2, maxLength: 10 },
       ),
       (data) => {
         const yValues = data.map(d => d.val).filter(n => Number.isFinite(n));
         let minY = 0, maxY = 1;
         if (yValues.length > 0) {
           const rawMinY = Math.min(...yValues);
           const rawMaxY = Math.max(...yValues);
           if (rawMinY === rawMaxY) {
             if (rawMinY === 0) { minY = 0; maxY = 1; }
             else if (rawMinY > 0) { minY = 0; maxY = rawMaxY * 1.2; }
             else { minY = rawMinY * 1.2; maxY = 0; }
           } else {
             if (rawMinY < 0) { minY = rawMinY; maxY = Math.max(0, rawMaxY); }
             else { minY = 0; maxY = rawMaxY || 1; }
           }
         }
         if (maxY - minY < 1e-6) {
           if (minY < 0 && maxY > 0) { minY = -1; maxY = 1; }
           else if (minY < 0) { minY = -1; maxY = 0; }
           else { minY = 0; maxY = 1; }
         }
         const scale = scaleLinear().domain([minY, maxY]).nice();
         let ticks = [];
         try { ticks = scale.ticks(5); } catch { ticks = [minY, maxY]; }
         if (!Array.isArray(ticks) || ticks.length === 0) throw new Error('Empty ticks');
       }
     ),
     { seed: -1191213113 }
   );
   console.log('PASS: Counterexample seed passed without error');
   "
   ```

2. **Verify Full Test Suite in Vitest**:
   ```bash
   node ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: 41 tests pass (100% green).

3. **Verify Biome Linter**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/LineChart ui/src/components/AreaChart
   ```
   *Expected outcome*: 0 errors, 0 warnings.
