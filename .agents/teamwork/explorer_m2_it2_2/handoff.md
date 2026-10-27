# Investigation Report: Subnormal Domain Vulnerability in `AreaChart.ts`

**Agent**: `explorer_m2_it2_2`  
**Roles**: Investigator, Analyzer, Synthesizer  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_2`  
**Target File**: `ui/src/components/AreaChart/AreaChart.ts` (lines 230–350)  
**Parent Agent**: `4562f942-bc5a-4d72-ad00-d87e731f5321`  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Direct File Observations: `ui/src/components/AreaChart/AreaChart.ts`

1. **Baseline and Domain Bounds Initialization (`AreaChart.ts:242–243`)**:
   ```ts
   242: let minY = 0
   243: let maxY = 0
   ```
   - `minY` is initialized to `0`. It is only updated via `minY = Math.min(minY, y0, y1)`. Therefore, `minY <= 0` at all times.
   - `maxY` is initialized to `0`. It is only updated via `maxY = Math.max(maxY, y0, y1)`. Therefore, `maxY >= 0` at all times.

2. **Value Normalization Defect (`AreaChart.ts:253–256`)**:
   ```ts
   253: const raw = d[s.key]
   254: const val =
   255:   typeof raw === 'number' && Number.isFinite(raw)
   256:     ? raw
   257:     : Number(raw) || 0
   ```
   - When `raw === Infinity` or `raw === -Infinity`: `typeof raw === 'number'` evaluates to `true`, but `Number.isFinite(raw)` evaluates to `false`.
   - The fallback branch evaluates `Number(raw) || 0` which equals `Infinity || 0 = Infinity` (or `-Infinity || 0 = -Infinity`).
   - `Infinity` enters `y0`, `y1`, `minY`, and `maxY`, causing `yScale(Infinity)` to evaluate to `NaN` and emitting `NaN` into SVG `<path>` and `<circle>` attributes.

3. **Domain Calculation and the Ineffective `domainMin === domainMax` Check (`AreaChart.ts:296–306`)**:
   ```ts
   296: // Y Scale domain bounds
   297: const domainMin = minY < 0 ? minY : 0
   298: let domainMax = maxY > 0 ? maxY : 1
   299: if (domainMin === domainMax) {
   300:   domainMax = domainMin + 1
   301: }
   302: 
   303: const yScale = scaleLinear()
   304:   .domain([domainMin, domainMax])
   305:   .range([height - padding.bottom, padding.top])
   306:   .nice()
   ```
   - Line 297: `domainMin` is `minY < 0 ? minY : 0`. Because `minY <= 0`, `domainMin <= 0` always.
   - Line 298: `domainMax` is `maxY > 0 ? maxY : 1`. If `maxY <= 0`, `domainMax = 1`. If `maxY > 0`, `domainMax > 0`. Therefore, `domainMax > 0` always.
   - Lines 299–301: Because `domainMin <= 0` and `domainMax > 0`, `domainMin === domainMax` is **mathematically impossible** (`domainMin <= 0 < domainMax`). Lines 299–301 are **dead code** and never execute.
   - When input records have subnormal double-precision floating-point values spanning zero (e.g. `raw = -5e-324` and `raw = 5e-324`):
     - `minY` evaluates to `-5e-324`.
     - `maxY` evaluates to `5e-324`.
     - `domainMin` evaluates to `-5e-324` (since `-5e-324 < 0` is true).
     - `domainMax` evaluates to `5e-324` (since `5e-324 > 0` is true).
     - The check `domainMin === domainMax` evaluates to `false` (since `-5e-324 !== 5e-324`).
     - `domainMax` remains `5e-324`.
     - The scale domain passed to D3 is `[-5e-324, 5e-324]`.

4. **Synchronous Unprotected `yScale.ticks(5)` Invocation (`AreaChart.ts:320`)**:
   ```ts
   320: const yTicks = yScale.ticks(5)
   ```
   - Line 320 executes `yScale.ticks(5)` directly inside `render()` without domain span protection or exception wrapping.

---

### 1.2 D3 Scale & Ticks Mechanism (`d3-array/src/ticks.js:1–35`)

In `d3-array@3.2.4/node_modules/d3-array/src/ticks.js`:
```js
5: function tickSpec(start, stop, count) {
6:   const step = (stop - start) / Math.max(0, count),
7:       power = Math.floor(Math.log10(step)),
8:       error = step / Math.pow(10, power),
9:       factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
10:   let i1, i2, inc;
11:   if (power < 0) {
12:     inc = Math.pow(10, -power) / factor;
13:     i1 = Math.round(start * inc);
14:     i2 = Math.round(stop * inc);
15:     if (i1 / inc < start) ++i1;
16:     if (i2 / inc > stop) --i2;
17:     inc = -inc;
...
26:   return [i1, i2, inc];
27: }
...
29: export default function ticks(start, stop, count) {
...
35:   const n = i2 - i1 + 1, ticks = new Array(n);
...
44:   return ticks;
45: }
```
- In double precision IEEE-754 floats, the largest finite double is `Number.MAX_VALUE ≈ 1.7976931348623157e+308`.
- In JS, `Math.pow(10, 308) = 1e+308 < Infinity`, whereas `Math.pow(10, 309) = Infinity`.
- When domain span `stop - start < 5e-308`, `step = (stop - start) / 5 < 1e-308`.
- `power = Math.floor(Math.log10(step)) <= -309`.
- `-power >= 309`, causing line 12 `inc = Math.pow(10, -power) / factor` to evaluate to `Infinity`.
- When `start < 0 < stop` (spanning zero):
  - Line 13: `i1 = Math.round(start * Infinity) = -Infinity`.
  - Line 14: `i2 = Math.round(stop * Infinity) = Infinity`.
  - Line 35: `n = i2 - i1 + 1 = Infinity - (-Infinity) + 1 = Infinity`.
  - Line 35: `new Array(Infinity)` throws `RangeError: Array length must be a positive integer of safe magnitude` (JavaScriptCore/Bun) / `RangeError: Invalid array length` (V8).

---

### 1.3 Verbatim Command Executions and Empirical Proof

#### Command 1: Reproduction of `RangeError` with `AreaChart` Domain Logic
```bash
bun --cwd ui -e "
import { scaleLinear } from 'd3-scale';

const sampleData = [
  { x: 'a', rev: 5e-324, exp: -5e-324 },
  { x: 'b', rev: -5e-324, exp: 5e-324 }
];

const seriesList = [{ key: 'rev' }, { key: 'exp' }];
let minY = 0, maxY = 0;
const posBaselines = [0, 0], negBaselines = [0, 0];

seriesList.forEach((s) => {
  sampleData.forEach((d, i) => {
    const raw = d[s.key];
    const val = typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0;
    let y0 = 0, y1 = 0;
    if (val >= 0) {
      y0 = posBaselines[i]; y1 = posBaselines[i] + val; posBaselines[i] += val;
    } else {
      y0 = negBaselines[i]; y1 = negBaselines[i] + val; negBaselines[i] += val;
    }
    minY = Math.min(minY, y0, y1);
    maxY = Math.max(maxY, y0, y1);
  });
});

const domainMin = minY < 0 ? minY : 0;
let domainMax = maxY > 0 ? maxY : 1;
if (domainMin === domainMax) domainMax = domainMin + 1;

const yScale = scaleLinear().domain([domainMin, domainMax]).range([260, 20]).nice();
try {
  yScale.ticks(5);
} catch (e: any) {
  console.log('Empirical AreaChart crash:', e.name, e.message);
}
"
```
**Output**:
```
Empirical AreaChart crash: RangeError Array length must be a positive integer of safe magnitude.
```

#### Command 2: Mathematical Boundary Threshold Verification
```bash
bun --cwd ui -e "
import { scaleLinear } from 'd3-scale';

const spanSafe = 1e-307;
const s1 = scaleLinear().domain([-spanSafe/2, spanSafe/2]).nice();
console.log('span 1e-307 ticks count:', s1.ticks(5).length);

const spanCrash = 1e-309;
const s2 = scaleLinear().domain([-spanCrash/2, spanCrash/2]).nice();
try {
  s2.ticks(5);
} catch (e: any) {
  console.log('span 1e-309 crash:', e.name, e.message);
}
"
```
**Output**:
```
span 1e-307 ticks count: 7
span 1e-309 crash: RangeError Array length must be a positive integer of safe magnitude.
```

#### Command 3: Why Existing Tests in `area-chart-challenge.test.ts` and `Charts.test.ts` Passed
- In `ui/src/components/Charts.test.ts:1162–1163` (`CHART-AREA-09`):
  ```ts
  rev: fc.double({ min: 1, max: 1000, noNaN: true }),
  exp: fc.double({ min: 1, max: 1000, noNaN: true }),
  ```
  `CHART-AREA-09` constrained values strictly to positive integers `[1, 1000]`. It never generated zero or subnormal values, masking the vulnerability.
- In `ui/src/components/area-chart-challenge.test.ts:224–226` (`CHALLENGE-AREA-04`):
  ```ts
  valA: fc.double({ min: -5000, max: 5000, noNaN: true }),
  ```
  `fc.asyncProperty` executed 20 runs where fast-check's PRNG did not hit the subnormal float range `[-5e-324, 5e-324]`.

---

## 2. Logic Chain

1. **Existence of Identical Vulnerability**:
   - As observed in §1.1 Item 3, when input values to `MoulAreaChart` are subnormal and opposite-signed (e.g. `[-5e-324, 5e-324]`), `minY = -5e-324` and `maxY = 5e-324`.
   - `domainMin = -5e-324` and `domainMax = 5e-324`.
   - The condition `domainMin === domainMax` evaluates to `false`, leaving the domain unexpanded at `[-5e-324, 5e-324]`.
   - As observed in §1.2 and verified empirically in §1.3 Command 1, `yScale.ticks(5)` crashes with `RangeError: Array length must be a positive integer of safe magnitude`.
   - Therefore, the identical `yScale.ticks(5)` subnormal vulnerability **definitely exists** in `AreaChart.ts:320`.

2. **Analysis of Domain Span Dynamics in Area Charts**:
   - Unlike line charts where the Y baseline can float freely, an area chart geometrically anchors its polygon baselines (`y0`) to `0` (or `posBaselines`/`negBaselines` accumulating from `0`).
   - Consequently, `minY` is bounded by `minY <= 0` and `maxY` is bounded by `maxY >= 0`.
   - Therefore, `domainMax - domainMin = domainMax + |domainMin|`.
   - A degenerate domain span `domainMax - domainMin < 1e-6` only occurs when both:
     - `domainMin` is within `[-1e-6, 0]`, and
     - `domainMax` is within `(0, 1e-6)`.
   - If values cross zero (`domainMin < 0 && domainMax > 0`), expanding symmetrically around zero to `[-0.5, 0.5]` keeps the zero baseline centered and yields clean, human-readable ticks (`[-0.4, -0.2, 0, 0.2, 0.4]`).
   - If values are strictly non-negative (`domainMin === 0`), expanding upward to `[0, 1]` preserves the zero baseline at the bottom of the chart area and yields clean ticks (`[0, 0.2, 0.4, 0.6, 0.8, 1.0]`).
   - If values are strictly non-positive (`domainMax <= 0` or negative baseline), expanding downward to `[-1, 0]` preserves the zero baseline at the top.

3. **Analysis of Value Normalization and Non-Finite Input**:
   - As observed in §1.1 Item 2, lines 253–256 evaluate `Number(raw) || 0` when `Number.isFinite(raw)` is false.
   - For `raw = Infinity` or `raw = -Infinity`, `Number(raw) || 0` returns `Infinity` or `-Infinity`.
   - This causes `maxY = Infinity`, `domainMax = Infinity`, and `yScale(Infinity) = NaN`, corrupting SVG paths.
   - Replacing this with `const num = Number(d[s.key]); const val = Number.isFinite(num) ? num : 0` eliminates this risk completely.

---

## 3. Recommended Fix Strategy for Worker

### Proposed Change 1: Value Normalization (`AreaChart.ts:253–256`)
```ts
<<<<
        const raw = d[s.key]
        const val =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : Number(raw) || 0
====
        const raw = d[s.key]
        const num = Number(raw)
        const val = Number.isFinite(num) ? num : 0
>>>>
```

### Proposed Change 2: Domain Span Safeguard (`AreaChart.ts:297–306`)
```ts
<<<<
    // Y Scale domain bounds
    const domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1
    if (domainMin === domainMax) {
      domainMax = domainMin + 1
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - padding.bottom, padding.top])
      .nice()
====
    // Y Scale domain bounds
    let domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1

    // Domain span safeguard against degenerate or subnormal ranges (< 1e-6)
    if (Math.abs(domainMax - domainMin) < 1e-6) {
      if (domainMin < 0 && domainMax > 0) {
        // Symmetrically expand across zero for mixed signs
        domainMin = -0.5
        domainMax = 0.5
      } else if (domainMin < 0) {
        // Expand downward from zero for all-negative data
        domainMin = -1
        domainMax = 0
      } else {
        // Expand upward from zero for all-positive or zero data
        domainMin = 0
        domainMax = 1
      }
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - padding.bottom, padding.top])
      .nice()
>>>>
```

### Proposed Change 3: Defensive `yScale.ticks(5)` Handling (`AreaChart.ts:320`)
```ts
<<<<
    const yTicks = yScale.ticks(5)
====
    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }
    if (yTicks.length === 0) {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }
>>>>
```

---

## 4. Caveats

1. **Test Suite Alignment**:
   - `CHART-AREA-09` in `ui/src/components/Charts.test.ts` should be updated or an additional test added to explicitly test subnormal numbers `[-5e-324, 5e-324]` on `MoulAreaChart`, ensuring both `LineChart` and `AreaChart` have identical adversarial test coverage.
2. **Worker Permission**:
   - As an explorer agent, no source code was directly modified. The above before/after changes are ready for immediate adoption by the worker agent.

---

## 5. Conclusion

- **Vulnerability Confirmed**: `ui/src/components/AreaChart/AreaChart.ts:320` has the identical `yScale.ticks(5)` crash vulnerability on subnormal double-precision float ranges as `LineChart.ts:293`.
- **Ineffective Dead Code**: The existing check `if (domainMin === domainMax)` at lines 299–301 can never execute because `domainMin <= 0` and `domainMax > 0` by construction.
- **Root Cause**: D3's `d3.ticks` underflows when domain span `< 5e-308`, computing `Math.pow(10, 309) = Infinity` and attempting `new Array(Infinity)`.
- **Actionable Solution**:
  1. Normalize input values with `Number.isFinite(Number(raw)) ? Number(raw) : 0`.
  2. Guard domain span with `Math.abs(domainMax - domainMin) < 1e-6` expanding with respect to zero-baselines.
  3. Wrap `yScale.ticks(5)` in a defensive `try / catch` with empty array fallback.

---

## 6. Verification Method

To independently verify these findings:

1. **Verify Crash on Current AreaChart Logic**:
   ```bash
   bun --cwd ui -e "
   import { scaleLinear } from 'd3-scale';
   const yScale = scaleLinear().domain([-5e-324, 5e-324]).nice();
   yScale.ticks(5);
   "
   ```
   *Expected outcome*: `RangeError: Array length must be a positive integer of safe magnitude`.

2. **Verify Proposed Safeguard Resolution**:
   ```bash
   bun --cwd ui -e "
   import { scaleLinear } from 'd3-scale';
   let domainMin = -5e-324, domainMax = 5e-324;
   if (Math.abs(domainMax - domainMin) < 1e-6) {
     if (domainMin < 0 && domainMax > 0) { domainMin = -0.5; domainMax = 0.5; }
     else if (domainMin < 0) { domainMin = -1; domainMax = 0; }
     else { domainMin = 0; domainMax = 1; }
   }
   const yScale = scaleLinear().domain([domainMin, domainMax]).nice();
   let yTicks = [];
   try { yTicks = yScale.ticks(5); } catch { yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]; }
   if (yTicks.length === 0) yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax];
   console.log('Safe yTicks:', yTicks);
   "
   ```
   *Expected outcome*: `Safe yTicks: [ -0.4, -0.2, 0, 0.2, 0.4 ]`.
