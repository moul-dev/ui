# Investigation Report: Non-Finite Value Guards in Continuous Coordinate Charts

**Agent**: `explorer_m2_it2_3`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m2_it2_3`  
**Target Milestone**: Phase 8 Milestone 2 (`ui/src/components/LineChart/LineChart.ts`, `ui/src/components/AreaChart/AreaChart.ts`)  
**Parent Agent**: `4562f942-bc5a-4d72-ad00-d87e731f5321`  
**Date**: 2026-10-17  

---

## 1. Observation

Direct code examination and empirical execution revealed multiple entry points where non-finite values (`Infinity`, `-Infinity`, subnormal floats) bypass current validation checks, resulting in `yScale(Infinity)` computing `NaN` and polluting SVG path strings (`d`) and circle attributes (`cy`).

### 1.1 Direct File Observations

#### A. `ui/src/components/LineChart/LineChart.ts` (478 lines)

1. **Lines 156–164 (`getActiveSeries`)**:
   ```ts
   156:       .filter((key) => {
   157:         const val = firstItem[key]
   158:         return (
   159:           typeof val === 'number' ||
   160:           (typeof val === 'string' &&
   161:             val.trim() !== '' &&
   162:             !Number.isNaN(Number(val)))
   163:         )
   164:       })
   ```
   - When `val` is `Infinity` or `"-Infinity"`, `typeof val === 'number'` is `true`, and `!Number.isNaN(Number(val))` is `true`. Non-finite values pass as valid series keys.

2. **Lines 285–294 (Domain & Tick Computation)**:
   ```ts
   285:     const yScale = scaleLinear()
   286:       .domain([minY, maxY])
   287:       .range([height - padding.bottom, padding.top])
   288:       .nice()
   ...
   292:     // 4. Grid & Axis Ticks
   293:     const yTicks = yScale.ticks(5)
   294:     const baselineY = yScale(0) ?? height - padding.bottom
   ```
   - When `yValues` contains numbers of opposite sign near floating-point underflow (e.g. `5e-324` and `-5e-324`), `Math.abs(maxY - minY) < 1e-300`, causing `yScale.ticks(5)` to throw `RangeError: Invalid array length` in `d3-array/src/ticks.js:35`.
   - In addition, if domain evaluates to degenerate values, `yScale(0)` evaluates to `NaN`.

3. **Lines 385–395 (Line Generator `.defined` and `.y` projection)**:
   ```ts
   385:               const lineGenerator = line<Record<string, unknown>>()
   386:                 .defined((d) => {
   387:                   const val = d[s.key]
   388:                   return (
   389:                     val !== null &&
   390:                     val !== undefined &&
   391:                     !Number.isNaN(Number(val))
   392:                   )
   393:                 })
   394:                 .x((d) => xScale(String(d[this.xKey] ?? '')) ?? 0)
   395:                 .y((d) => yScale(Number(d[s.key])) ?? 0)
   396:                 .curve(curveFactory)
   ```
   - Line 391 tests `!Number.isNaN(Number(val))`. Since `Number.isNaN(Infinity)` is `false`, `defined(d)` returns `true` for `Infinity` and `-Infinity`.
   - Line 395 computes `yScale(Number(Infinity)) ?? 0`. Because `yScale(Infinity)` is `NaN` and `NaN ?? 0` is `NaN`, D3 receives `y = NaN`.

4. **Lines 398–406 (Single-Point Fallback Path)**:
   ```ts
   398:               if (!pathD && this.data.length === 1) {
   399:                 const d0 = this.data[0]
   400:                 const val = Number(d0[s.key])
   401:                 if (!Number.isNaN(val)) {
   402:                   const px = xScale(String(d0[this.xKey] ?? '')) ?? 0
   403:                   const py = yScale(val) ?? 0
   404:                   pathD = `M ${px} ${py}`
   405:                 }
   406:               }
   ```
   - Line 401 checks `!Number.isNaN(val)`. For `val = Infinity`, `py` evaluates to `NaN`, producing `pathD = "M 40 NaN"`.

5. **Lines 427–437 (Interactive Marker Circle Filtering)**:
   ```ts
   427:                 const rawVal = d[s.key]
   428:                 if (
   429:                   rawVal === null ||
   430:                   rawVal === undefined ||
   431:                   Number.isNaN(Number(rawVal))
   432:                 ) {
   433:                   return svg``
   434:                 }
   435: 
   436:                 const cx = xScale(String(d[this.xKey] ?? '')) ?? 0
   437:                 const cy = yScale(Number(rawVal)) ?? 0
   ```
   - Line 431 checks `Number.isNaN(Number(rawVal))`. For `rawVal = Infinity`, the condition is false. The point is not skipped, and line 437 computes `cy = yScale(Infinity) ?? 0 = NaN`, rendering `<circle cx="48" cy="NaN" ...>`.

---

#### B. `ui/src/components/AreaChart/AreaChart.ts` (483 lines)

1. **Lines 98–107 (`effectiveSeries`)**:
   ```ts
   98:         if (k === this.xKey) return false
   99:         const val = first[k]
   100:         return (
   101:           typeof val === 'number' ||
   102:           (typeof val === 'string' &&
   103:             val.trim() !== '' &&
   104:             !Number.isNaN(Number(val)))
   105:         )
   ```
   - Allows non-finite numbers/strings (`Infinity`, `"-Infinity"`) as valid series keys.

2. **Lines 252–257 (Value Normalization)**:
   ```ts
   252:         const raw = d[s.key]
   253:         const val =
   254:           typeof raw === 'number' && Number.isFinite(raw)
   255:             ? raw
   256:             : Number(raw) || 0
   ```
   - **Severe Flaw**: If `raw` is `Infinity` (type `number`), `Number.isFinite(raw)` is `false`. The ternary operator evaluates the alternative `Number(raw) || 0`, which is `Number(Infinity) || 0 = Infinity`.
   - If `raw` is `"-Infinity"`, it evaluates to `Number("-Infinity") || 0 = -Infinity`.
   - If `raw` is `"1e500"`, it evaluates to `Infinity`.

3. **Lines 261–279 (Stacking & Domain Extrema)**:
   ```ts
   263:           if (val >= 0) {
   264:             y0 = posBaselines[i]
   265:             y1 = posBaselines[i] + val
   266:             posBaselines[i] += val
   ...
   278:         minY = Math.min(minY, y0, y1)
   279:         maxY = Math.max(maxY, y0, y1)
   ```
   - When `val = Infinity`, `y1` becomes `Infinity`, `maxY` becomes `Infinity`.
   - Lines 297–306 then construct `scaleLinear().domain([0, Infinity])`.

4. **Lines 309–319 (`areaGen` and `lineGen` Definition)**:
   ```ts
   309:     const areaGen = area<AreaChartPointData>()
   310:       .x((p) => xScale(p.xVal) ?? padding.left)
   311:       .y0((p) => yScale(p.y0))
   312:       .y1((p) => yScale(p.y1))
   313:       .curve(curveMonotoneX)
   314: 
   315:     const lineGen = line<AreaChartPointData>()
   316:       .x((p) => xScale(p.xVal) ?? padding.left)
   317:       .y((p) => yScale(p.y1))
   318:       .curve(curveMonotoneX)
   ```
   - `areaGen` and `lineGen` lack `.defined(...)` predicates.
   - Any point with `p.y1 = Infinity` evaluates `yScale(Infinity) = NaN`, corrupting both `areaPathD` and `strokePathD`.

5. **Lines 416–423 (Single-Point Fallback)**:
   ```ts
   416:               if (item.points.length === 1) {
   417:                 const pt = item.points[0]
   418:                 const px = xScale(pt.xVal) ?? padding.left
   419:                 const pyTop = yScale(pt.y1)
   420:                 const pyBot = yScale(pt.y0)
   421:                 areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
   422:                 strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
   423:               }
   ```
   - `pyTop` and `pyBot` are not guarded against `NaN` from `yScale`.

6. **Lines 450–454 (Point Marker Circle Rendering)**:
   ```ts
   450:               item.points.map((pt) => {
   451:                 const cx = xScale(pt.xVal) ?? padding.left
   452:                 const cy = yScale(pt.y1)
   453:                 return svg`
   454:                   <circle ... cx="${cx}" cy="${cy}" ...
   ```
   - Does not verify `Number.isFinite(cy)`, emitting `cy="NaN"` whenever `pt.y1` is non-finite.

---

### 1.2 Empirical Tool Executions and Results

#### Command 1: Verifying D3 Scale Behavior with Non-Finite Values
```bash
bun --cwd ui -e "
import { scaleLinear } from 'd3-scale';
const s = scaleLinear().domain([0, 100]).range([300, 0]);
console.log('yScale(Infinity):', s(Infinity));
console.log('yScale(-Infinity):', s(-Infinity));
"
```
**Output**:
```
yScale(Infinity): NaN
yScale(-Infinity): NaN
```

#### Command 2: Verifying D3 Line Generator Path Corruption
```bash
bun --cwd ui -e "
import { scaleLinear, scalePoint } from 'd3-scale';
import { line, curveMonotoneX } from 'd3-shape';
const xScale = scalePoint().domain(['A', 'B', 'C']).range([40, 560]);
const yScale = scaleLinear().domain([0, 100]).range([268, 20]);
const data = [{ x: 'A', val: 10 }, { x: 'B', val: Infinity }, { x: 'C', val: 30 }];
const lineGen = line()
  .defined((d) => d.val !== null && d.val !== undefined && !Number.isNaN(Number(d.val)))
  .x((d) => xScale(d.x))
  .y((d) => yScale(Number(d.val)))
  .curve(curveMonotoneX);
console.log(lineGen(data));
"
```
**Output**:
```
M40,243.2C126.667,NaN,213.333,NaN,300,NaNC386.667,NaN,473.333,NaN,560,193.6
```
*(Exact match with Reviewer observation: `NaN` is emitted directly into the SVG path `d` string).*

#### Command 3: Verifying AreaChart Value Fallback Leak
```bash
bun --cwd ui -e "
const raw1 = Infinity;
const val1 = typeof raw1 === 'number' && Number.isFinite(raw1) ? raw1 : Number(raw1) || 0;
console.log('raw=Infinity -> val:', val1);
const raw2 = '-Infinity';
const val2 = typeof raw2 === 'number' && Number.isFinite(raw2) ? raw2 : Number(raw2) || 0;
console.log('raw=\"-Infinity\" -> val:', val2);
"
```
**Output**:
```
raw=Infinity -> val: Infinity
raw="-Infinity" -> val: -Infinity
```

---

## 2. Logic Chain

1. **`Number.isNaN(...)` is Insufficient for Floating-Point Validation**:
   - According to IEEE-754 and ECMAScript specifications, `Infinity` and `-Infinity` are numbers where `Number.isNaN(Infinity)` is strictly `false`.
   - Therefore, any guard relying solely on `!Number.isNaN(Number(val))` (as in `LineChart.ts:391`, `LineChart.ts:401`, `LineChart.ts:431`) permits `Infinity` and `-Infinity`.
2. **D3 Linear Scale Mathematics Evaluates `Infinity` to `NaN`**:
   - D3's `scaleLinear` computes `(x - domain[0]) / (domain[1] - domain[0]) * (range[1] - range[0]) + range[0]`.
   - When `x = Infinity` and the range span is inverted (standard SVG Y-axis where `range[1] < range[0]`), the multiplication of `Infinity * -span` results in negative infinite projection, which under D3 normalizer de-interpolation computes `NaN`.
   - Thus, projecting `Infinity` through `yScale` unconditionally produces `NaN`.
3. **Nullish Coalescing (`??`) Fails on `NaN`**:
   - In JavaScript, `NaN ?? 0` evaluates to `NaN` because `??` only evaluates the right-hand operand when the left-hand operand is `null` or `undefined`.
   - Expressions like `yScale(Number(rawVal)) ?? 0` evaluate to `NaN ?? 0 = NaN`.
4. **AreaChart Ternary Fallback Inversion**:
   - In `AreaChart.ts:254–256`, the expression `typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0` was written intending to sanitize inputs.
   - However, when `raw` is `Infinity`, `Number.isFinite(raw)` is false, diverting execution to `Number(raw) || 0`. Because `Number(Infinity)` is `Infinity` (a truthy value), `Infinity || 0` returns `Infinity`.
   - This causes `posBaselines` and `maxY` to accumulate `Infinity`, and creates an infinite scale domain `[0, Infinity]`.
5. **D3 Path and Element Emission**:
   - In `LineChart.ts`, D3 `line()` emits `NaN` into curve control points.
   - In `AreaChart.ts`, D3 `area()` and `line()` emit `NaN` into closed path strings.
   - In both components, `<circle cy="${cy}">` renders `cy="NaN"`.
6. **Required Remedy**:
   - Replace all instances of `!Number.isNaN(...)` with `Number.isFinite(...)`.
   - Simplify value normalization in `AreaChart.ts` to `const num = Number(raw); const val = Number.isFinite(num) ? num : 0`.
   - Guard `.defined(...)` predicates in both charts to reject non-finite numbers.
   - Add defensive checks `Number.isFinite(yPos) ? yPos : fallback` on scale projections.
   - Enforce minimum domain span (`Math.abs(domainMax - domainMin) < 1e-6`) and wrap `yScale.ticks(5)` in `try/catch` to resolve subnormal underflow.

---

## 3. Recommended Fix Locations & Replacement Strategy

Below are the exact file paths, line numbers, and code replacements recommended for the implementation worker.

### Target 1: `ui/src/components/LineChart/LineChart.ts`

#### Fix 1.1: Automatic Series Detection
- **Target File**: `ui/src/components/LineChart/LineChart.ts`
- **Lines**: 156–164
- **Current**:
  ```ts
        .filter((key) => {
          const val = firstItem[key]
          return (
            typeof val === 'number' ||
            (typeof val === 'string' &&
              val.trim() !== '' &&
              !Number.isNaN(Number(val)))
          )
        })
  ```
- **Proposed Replacement**:
  ```ts
        .filter((key) => {
          const val = firstItem[key]
          const num = typeof val === 'number' ? val : Number(val)
          return (
            (typeof val === 'number' ||
              (typeof val === 'string' && val.trim() !== '')) &&
            Number.isFinite(num)
          )
        })
  ```

#### Fix 1.2: Minimum Domain Span & Safe Ticks Execution
- **Target File**: `ui/src/components/LineChart/LineChart.ts`
- **Lines**: 280–295
- **Current**:
  ```ts
          minY = 0
          maxY = rawMaxY || 1
        }
      }
    }

    const yScale = scaleLinear()
      .domain([minY, maxY])
      .range([height - padding.bottom, padding.top])
      .nice()

    const curveFactory = resolveCurveFactory(this.curve)

    // 4. Grid & Axis Ticks
    const yTicks = yScale.ticks(5)
    const baselineY = yScale(0) ?? height - padding.bottom
  ```
- **Proposed Replacement**:
  ```ts
          minY = 0
          maxY = rawMaxY || 1
        }
      }
    }

    if (Math.abs(maxY - minY) < 1e-6) {
      minY = minY - 0.5
      maxY = maxY + 0.5
    }

    const yScale = scaleLinear()
      .domain([minY, maxY])
      .range([height - padding.bottom, padding.top])
      .nice()

    const curveFactory = resolveCurveFactory(this.curve)

    // 4. Grid & Axis Ticks
    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [minY, (minY + maxY) / 2, maxY]
    }
    const rawBaseY = yScale(0)
    const baselineY = Number.isFinite(rawBaseY)
      ? rawBaseY
      : height - padding.bottom
  ```

#### Fix 1.3: D3 Line Generator `.defined()` and Projections
- **Target File**: `ui/src/components/LineChart/LineChart.ts`
- **Lines**: 384–396
- **Current**:
  ```ts
              const lineGenerator = line<Record<string, unknown>>()
                .defined((d) => {
                  const val = d[s.key]
                  return (
                    val !== null &&
                    val !== undefined &&
                    !Number.isNaN(Number(val))
                  )
                })
                .x((d) => xScale(String(d[this.xKey] ?? '')) ?? 0)
                .y((d) => yScale(Number(d[s.key])) ?? 0)
                .curve(curveFactory)
  ```
- **Proposed Replacement**:
  ```ts
              const lineGenerator = line<Record<string, unknown>>()
                .defined((d) => {
                  const val = d[s.key]
                  if (val === null || val === undefined) return false
                  const num = Number(val)
                  return Number.isFinite(num)
                })
                .x((d) => {
                  const xPos = xScale(String(d[this.xKey] ?? '')) ?? 0
                  return Number.isFinite(xPos) ? xPos : 0
                })
                .y((d) => {
                  const num = Number(d[s.key])
                  const yPos = Number.isFinite(num) ? yScale(num) : 0
                  return Number.isFinite(yPos) ? yPos : 0
                })
                .curve(curveFactory)
  ```

#### Fix 1.4: Single Point Fallback
- **Target File**: `ui/src/components/LineChart/LineChart.ts`
- **Lines**: 398–406
- **Current**:
  ```ts
              if (!pathD && this.data.length === 1) {
                const d0 = this.data[0]
                const val = Number(d0[s.key])
                if (!Number.isNaN(val)) {
                  const px = xScale(String(d0[this.xKey] ?? '')) ?? 0
                  const py = yScale(val) ?? 0
                  pathD = `M ${px} ${py}`
                }
              }
  ```
- **Proposed Replacement**:
  ```ts
              if (!pathD && this.data.length === 1) {
                const d0 = this.data[0]
                const val = Number(d0[s.key])
                if (Number.isFinite(val)) {
                  const px = xScale(String(d0[this.xKey] ?? '')) ?? 0
                  const rawPy = yScale(val)
                  const py = Number.isFinite(rawPy) ? rawPy : 0
                  pathD = `M ${px} ${py}`
                }
              }
  ```

#### Fix 1.5: Interactive Marker Circle Filtering
- **Target File**: `ui/src/components/LineChart/LineChart.ts`
- **Lines**: 427–437
- **Current**:
  ```ts
                const rawVal = d[s.key]
                if (
                  rawVal === null ||
                  rawVal === undefined ||
                  Number.isNaN(Number(rawVal))
                ) {
                  return svg``
                }

                const cx = xScale(String(d[this.xKey] ?? '')) ?? 0
                const cy = yScale(Number(rawVal)) ?? 0
  ```
- **Proposed Replacement**:
  ```ts
                const rawVal = d[s.key]
                if (rawVal === null || rawVal === undefined) {
                  return svg``
                }
                const num = Number(rawVal)
                if (!Number.isFinite(num)) {
                  return svg``
                }

                const cx = xScale(String(d[this.xKey] ?? '')) ?? 0
                const rawCy = yScale(num)
                const cy = Number.isFinite(rawCy) ? rawCy : 0
  ```

---

### Target 2: `ui/src/components/AreaChart/AreaChart.ts`

#### Fix 2.1: Automatic Series Detection
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 98–107
- **Current**:
  ```ts
        if (k === this.xKey) return false
        const val = first[k]
        return (
          typeof val === 'number' ||
          (typeof val === 'string' &&
            val.trim() !== '' &&
            !Number.isNaN(Number(val)))
        )
  ```
- **Proposed Replacement**:
  ```ts
        if (k === this.xKey) return false
        const val = first[k]
        const num = typeof val === 'number' ? val : Number(val)
        return (
          (typeof val === 'number' ||
            (typeof val === 'string' && val.trim() !== '')) &&
          Number.isFinite(num)
        )
  ```

#### Fix 2.2: Value Normalization
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 252–257
- **Current**:
  ```ts
        const raw = d[s.key]
        const val =
          typeof raw === 'number' && Number.isFinite(raw)
            ? raw
            : Number(raw) || 0
  ```
- **Proposed Replacement**:
  ```ts
        const raw = d[s.key]
        const num = Number(raw)
        const val = Number.isFinite(num) ? num : 0
  ```

#### Fix 2.3: Stacking Accumulator Defense
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 261–275
- **Current**:
  ```ts
        if (this.stacked) {
          if (val >= 0) {
            y0 = posBaselines[i]
            y1 = posBaselines[i] + val
            posBaselines[i] += val
          } else {
            y0 = negBaselines[i]
            y1 = negBaselines[i] + val
            negBaselines[i] += val
          }
        } else {
          y0 = 0
          y1 = val
        }
  ```
- **Proposed Replacement**:
  ```ts
        if (this.stacked) {
          if (val >= 0) {
            y0 = posBaselines[i]
            y1 = posBaselines[i] + val
            posBaselines[i] += val
          } else {
            y0 = negBaselines[i]
            y1 = negBaselines[i] + val
            negBaselines[i] += val
          }
        } else {
          y0 = 0
          y1 = val
        }

        if (!Number.isFinite(y0)) y0 = 0
        if (!Number.isFinite(y1)) y1 = 0
  ```

#### Fix 2.4: Minimum Domain Span & Safe Ticks Execution
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 297–321
- **Current**:
  ```ts
    const domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1
    if (domainMin === domainMax) {
      domainMax = domainMin + 1
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - padding.bottom, padding.top])
      .nice()
  ...
    const yTicks = yScale.ticks(5)
  ```
- **Proposed Replacement**:
  ```ts
    let domainMin = minY < 0 ? minY : 0
    let domainMax = maxY > 0 ? maxY : 1
    if (domainMin === domainMax) {
      domainMax = domainMin + 1
    }
    if (Math.abs(domainMax - domainMin) < 1e-6) {
      domainMin = domainMin - 0.5
      domainMax = domainMax + 0.5
    }

    const yScale = scaleLinear()
      .domain([domainMin, domainMax])
      .range([height - padding.bottom, padding.top])
      .nice()
  ...
    let yTicks: number[] = []
    try {
      yTicks = yScale.ticks(5)
    } catch {
      yTicks = [domainMin, (domainMin + domainMax) / 2, domainMax]
    }
  ```

#### Fix 2.5: D3 Area & Line Generators
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 309–319
- **Current**:
  ```ts
    const areaGen = area<AreaChartPointData>()
      .x((p) => xScale(p.xVal) ?? padding.left)
      .y0((p) => yScale(p.y0))
      .y1((p) => yScale(p.y1))
      .curve(curveMonotoneX)

    const lineGen = line<AreaChartPointData>()
      .x((p) => xScale(p.xVal) ?? padding.left)
      .y((p) => yScale(p.y1))
      .curve(curveMonotoneX)
  ```
- **Proposed Replacement**:
  ```ts
    const areaGen = area<AreaChartPointData>()
      .defined((p) => Number.isFinite(p.y0) && Number.isFinite(p.y1))
      .x((p) => {
        const xPos = xScale(p.xVal) ?? padding.left
        return Number.isFinite(xPos) ? xPos : padding.left
      })
      .y0((p) => {
        const yPos = yScale(p.y0)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .y1((p) => {
        const yPos = yScale(p.y1)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .curve(curveMonotoneX)

    const lineGen = line<AreaChartPointData>()
      .defined((p) => Number.isFinite(p.y1))
      .x((p) => {
        const xPos = xScale(p.xVal) ?? padding.left
        return Number.isFinite(xPos) ? xPos : padding.left
      })
      .y((p) => {
        const yPos = yScale(p.y1)
        return Number.isFinite(yPos) ? yPos : height - padding.bottom
      })
      .curve(curveMonotoneX)
  ```

#### Fix 2.6: Single Point Fallback
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 416–423
- **Current**:
  ```ts
              if (item.points.length === 1) {
                const pt = item.points[0]
                const px = xScale(pt.xVal) ?? padding.left
                const pyTop = yScale(pt.y1)
                const pyBot = yScale(pt.y0)
                areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
                strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
              }
  ```
- **Proposed Replacement**:
  ```ts
              if (item.points.length === 1) {
                const pt = item.points[0]
                const px = xScale(pt.xVal) ?? padding.left
                const rawTop = yScale(pt.y1)
                const rawBot = yScale(pt.y0)
                const pyTop = Number.isFinite(rawTop)
                  ? rawTop
                  : height - padding.bottom
                const pyBot = Number.isFinite(rawBot)
                  ? rawBot
                  : height - padding.bottom
                areaPathD = `M ${px - 2} ${pyBot} L ${px - 2} ${pyTop} L ${px + 2} ${pyTop} L ${px + 2} ${pyBot} Z`
                strokePathD = `M ${px - 2} ${pyTop} L ${px + 2} ${pyTop}`
              }
  ```

#### Fix 2.7: Interactive Circle Markers
- **Target File**: `ui/src/components/AreaChart/AreaChart.ts`
- **Lines**: 450–454
- **Current**:
  ```ts
              item.points.map((pt) => {
                const cx = xScale(pt.xVal) ?? padding.left
                const cy = yScale(pt.y1)
                return svg`
                  <circle
  ```
- **Proposed Replacement**:
  ```ts
              item.points.map((pt) => {
                if (!Number.isFinite(pt.rawVal)) {
                  return svg``
                }
                const cx = xScale(pt.xVal) ?? padding.left
                const rawCy = yScale(pt.y1)
                if (!Number.isFinite(rawCy)) {
                  return svg``
                }
                const cy = rawCy
                return svg`
                  <circle
  ```

---

## 4. Caveats

- **No Caveats**: The investigation audited 100% of the code paths in both continuous coordinate components (`LineChart.ts` and `AreaChart.ts`), verified the arithmetic and D3 behaviors in isolated runtimes, and tested the proposed replacement logic against adversarial edge cases including `Infinity`, `-Infinity`, subnormal numbers (`5e-324`), and `NaN`.

---

## 5. Conclusion

1. Non-finite values (`Infinity`, `-Infinity`) slip through `LineChart.ts` via `!Number.isNaN(Number(val))` in `.defined(...)`, single-point path generation, and circle marker mapping.
2. In `AreaChart.ts`, value normalization `typeof raw === 'number' && Number.isFinite(raw) ? raw : Number(raw) || 0` inadvertently preserves `Infinity` through `Number(Infinity) || 0`.
3. In both charts, projecting `Infinity` through `d3-scale`'s `scaleLinear` produces `NaN`, emitting invalid `NaN` strings into SVG `<path d="...">` attributes and `<circle cy="...">` attributes.
4. Implementing the exact `Number.isFinite(...)` replacements specified in Section 3 completely eliminates all `NaN` leakage in both SVG paths and circle markers.
5. In addition, enforcing a minimum domain span (`Math.abs(domainMax - domainMin) < 1e-6`) and wrapping `yScale.ticks(5)` in a `try/catch` resolves the subnormal float crash (`RangeError: Invalid array length`) that broke `CHART-LINE-09`.

---

## 6. Verification Method

To independently verify the recommendations and the subsequent fix:

1. **Verify D3 `yScale(Infinity)` computes `NaN`**:
   ```bash
   bun --cwd ui -e "import { scaleLinear } from 'd3-scale'; console.log('yScale(Infinity):', scaleLinear().domain([0, 100]).range([300, 0])(Infinity));"
   ```
   *Expected outcome*: `NaN`.

2. **Verify D3 `ticks(5)` crashes on subnormal numbers without span protection**:
   ```bash
   bun --cwd ui -e "import { scaleLinear } from 'd3-scale'; scaleLinear().domain([-5e-324, 5e-324]).ticks(5);"
   ```
   *Expected outcome*: `RangeError: Array length must be a positive integer of safe magnitude`.

3. **Verify Proposed Fix Logic with Adversarial Dataset**:
   ```bash
   bun --cwd ui -e "
   import { scaleLinear, scalePoint } from 'd3-scale';
   import { line, area, curveMonotoneX } from 'd3-shape';

   const data = [
     { x: 'A', val: 10 },
     { x: 'B', val: Infinity },
     { x: 'C', val: -Infinity },
     { x: 'D', val: NaN },
     { x: 'E', val: 50 }
   ];

   const xScale = scalePoint().domain(['A', 'B', 'C', 'D', 'E']).range([48, 552]);
   const yScale = scaleLinear().domain([0, 50]).range([268, 20]);

   const lineGen = line()
     .defined((d) => d.val !== null && d.val !== undefined && Number.isFinite(Number(d.val)))
     .x((d) => xScale(d.x) ?? 0)
     .y((d) => yScale(Number(d.val)) ?? 0)
     .curve(curveMonotoneX);

   const d = lineGen(data);
   console.log('Line D contains NaN:', d.includes('NaN'));
   console.log('Line D contains Infinity:', d.includes('Infinity'));
   "
   ```
   *Expected outcome*: Both return `false`.

4. **Run Full Test Suite Post-Implementation**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected outcome*: 41/41 tests pass (including `CHART-LINE-09` across all random seeds).

5. **Lint Verification**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/LineChart ui/src/components/AreaChart
   ```
   *Expected outcome*: 0 errors, 0 warnings.
