# Handoff Report: Progressive Glass Enhancement & Solid Fallback for ChartTooltip

**Agent**: `explorer_m1_it2_2`  
**Working Directory**: `/Users/phearak/github/orgs/moul-dev/ui/.agents/teamwork/explorer_m1_it2_2`  
**Target File**: `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`  
**Task**: Investigate exact CSS rules needed to implement progressive glass enhancement with reliable solid fallback when unsupported.  
**Date**: 2026-10-17  

---

## 1. Observation

### 1.1 Current State in `ChartTooltip.styles.ts`
In `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`, lines 40–54:
```css
    [part="container"],
    .tooltip-container {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
      border-radius: var(--radius-md, 0.5rem);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg, #111827);
      white-space: nowrap;
      pointer-events: none;
    }
```
Direct observations:
- `background-color` is set to `var(--color-bg-elevated, #ffffff)`.
- `border` is set to `1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1))`.
- Neither `@supports (backdrop-filter: blur(12px))` nor `@supports (-webkit-backdrop-filter: blur(12px))` is present anywhere in the file.
- The tokens `--color-bg-glass` and `--color-border-glass` are never referenced.
- No `backdrop-filter` or `-webkit-backdrop-filter` properties are declared.

### 1.2 Design Token Definitions in `style.css`
In `ui/src/styles/style.css`:
- **Line 137**: `--color-bg-elevated: light-dark(oklch(1 0 0), oklch(0.2 0 0));`
  (100% opaque elevated surface; pure white in light mode, solid dark in dark mode).
- **Line 142**: `--color-border-subtle: light-dark(oklch(0.92 0 0), oklch(0.22 0 0));`
  (100% opaque subtle border).
- **Line 151**: `--color-bg-glass: light-dark(oklch(1 0 0 / 0.55), oklch(0.2 0 0 / 0.45));`
  (Translucent surface; 55% alpha in light mode, 45% alpha in dark mode).
- **Line 152**: `--color-border-glass: light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.1));`
  (Translucent border; 8% alpha in light mode, 10% alpha in dark mode).

### 1.3 Reference Implementations in Codebase
1. **`ui/src/styles/semantic-tones.ts` (lines 150–168)**:
```css
  /* Glass Variant - Base fallback when backdrop-filter is unsupported */
  :host([variant="glass"]),
  [data-variant="glass"] {
    background-color: var(--color-bg-glass);
    border: 1px solid var(--color-border-glass);
    color: var(--_tone-soft-fg);
  }

  /* Glass Variant - Progressive enhancement with blur */
  @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
    :host([variant="glass"]),
    [data-variant="glass"] {
      background-color: var(--color-bg-glass);
      border: 1px solid var(--color-border-glass);
      color: var(--_tone-soft-fg);
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
    }
  }
```
2. **`ui/src/tokens/tokens.test.ts` (lines 197–206)**:
```ts
    it('provides solid background fallback and progressive blur enhancement for glass variant', () => {
      const stylesText = Array.isArray(semanticToneStyles)
        ? semanticToneStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((semanticToneStyles as any).cssText ?? String(semanticToneStyles))

      expect(stylesText).toMatch(/var\(--color-bg-glass\)/)
      expect(stylesText).toMatch(/var\(--color-border-glass\)/)
      expect(stylesText).toMatch(/@supports\s*\([^)]*backdrop-filter:\s*blur/)
      expect(stylesText).toMatch(/var\(--shadow-md\)/)
    })
```
3. **`reviewer_m1_2/handoff.md` (Finding 2, lines 157–171)**:
```markdown
#### [Major] Finding 2: Missing Glass Backdrop-Filter Fallback in `ChartTooltip.styles.ts`
- **Location**: `ui/src/components/ChartTooltip/ChartTooltip.styles.ts:40–54`
- **Issue**: Tooltip styling lacks glass progressive enhancement (`@supports (backdrop-filter: blur(12px))`) and references to `--color-bg-glass` / `--color-border-glass`.
- **Suggested Fix**: Add glass progressive enhancement to `ChartTooltip.styles.ts`:
  ```css
  @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
    [part="container"],
    .tooltip-container {
      background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.75));
      border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
      -webkit-backdrop-filter: blur(12px);
      backdrop-filter: blur(12px);
    }
  }
  ```
```

---

## 2. Logic Chain

1. **The Nature of Chart Tooltips and Readability**:
   - `MoulChartTooltip` hovers directly above dense, multi-color SVG chart elements: line curves, gradient area fills, vertical bar columns, grid lines, and axis labels.
   - If a semi-transparent background (`--color-bg-glass` at 45–55% opacity) were applied *without* `backdrop-filter: blur(12px)`, high-frequency chart graphics directly beneath the tooltip would show through unblurred. This causes severe text legibility failure and contrast ratio violations (WCAG 2.1 AA §1.4.3).

2. **Progressive Enhancement Pattern**:
   - In browsers that do **NOT** support `backdrop-filter` (e.g. older browser engines, environments with software rendering, or users with forced contrast / disabled compositing):
     - The browser skips the `@supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))` block.
     - The base styling on `[part="container"], .tooltip-container` applies:
       `background-color: var(--color-bg-elevated, #ffffff);`
       `border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));`
     - Because `--color-bg-elevated` is 100% opaque (`oklch(1 0 0)` in light mode, `oklch(0.2 0 0)` in dark mode), the tooltip forms an opaque, solid elevated card, ensuring 100% legibility and zero visual noise bleed.
   - In modern browsers that **DO** support `backdrop-filter`:
     - The `@supports` condition evaluates to true.
     - `background-color` is overridden with `var(--color-bg-glass, rgba(255, 255, 255, 0.75))`.
     - `border-color` is overridden with `var(--color-border-glass, rgba(0, 0, 0, 0.1))`.
     - Both `-webkit-backdrop-filter: blur(12px);` (for WebKit/Safari) and `backdrop-filter: blur(12px);` (W3C standard) are applied.
     - The 12px Gaussian blur diffuses all background graphics, rendering a frosted glass aesthetic while maintaining high foreground contrast.

3. **Vendor Prefix Requirement**:
   - Safari on iOS and macOS requires `-webkit-backdrop-filter`.
   - The `@supports` query must check `(backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))` to properly activate on Safari.
   - Inside the rule, `-webkit-backdrop-filter` must precede the standard `backdrop-filter` property.

4. **Shadow and Rounded Corner Integration**:
   - The base rule already specifies `border-radius: var(--radius-md, 0.5rem);` and `box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));`.
   - These properties apply uniformly to both the solid fallback and the glass enhancement, anchoring the floating tooltip above the SVG chart canvas.

---

## 3. Caveats

- **Top Layer / Popover API Interaction**: `MoulChartTooltip` uses `popover="manual"`. When opened, it renders in the top layer. In all modern browsers (Chromium 114+, Safari 17+, Firefox 125+), `backdrop-filter` operates correctly on top-layer elements against underlying document content.
- **Token Fallbacks**: If `style.css` is not loaded in an ad-hoc test environment, the inline fallbacks `rgba(255, 255, 255, 0.75)` for glass background and `rgba(0, 0, 0, 0.1)` for glass border ensure that the component renders without breakage.
- **No Direct Source Changes**: As an explorer subagent, no edits have been written to `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`. The exact code changes are provided below for the implementer worker.

---

## 4. Conclusion & Concrete Recommendations

### 4.1 Recommended Code Changes in `ui/src/components/ChartTooltip/ChartTooltip.styles.ts`

Replace lines 40–54 in `ui/src/components/ChartTooltip/ChartTooltip.styles.ts` with the progressive glass enhancement implementation below:

```ts
    /* Container base styles (Solid fallback when backdrop-filter is unsupported) */
    [part="container"],
    .tooltip-container {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
      border-radius: var(--radius-md, 0.5rem);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg, #111827);
      white-space: nowrap;
      pointer-events: none;
    }

    /* Glass progressive enhancement with 12px blur */
    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
      [part="container"],
      .tooltip-container {
        background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.75));
        border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
      }
    }
```

### 4.2 Exact Diff

```diff
--- a/ui/src/components/ChartTooltip/ChartTooltip.styles.ts
+++ b/ui/src/components/ChartTooltip/ChartTooltip.styles.ts
@@ -40,6 +40,7 @@ export const chartTooltipStyles = [
     [part="container"],
     .tooltip-container {
       display: inline-flex;
       flex-direction: column;
       gap: var(--spacing-1, 0.25rem);
       padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
       background-color: var(--color-bg-elevated, #ffffff);
       border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
       border-radius: var(--radius-md, 0.5rem);
       box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
       font-size: var(--font-size-xs, 0.75rem);
       color: var(--color-fg, #111827);
       white-space: nowrap;
       pointer-events: none;
     }
+
+    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
+      [part="container"],
+      .tooltip-container {
+        background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.75));
+        border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
+        -webkit-backdrop-filter: blur(12px);
+        backdrop-filter: blur(12px);
+      }
+    }
```

### 4.3 Recommended Unit Test in `ui/src/components/Charts.test.ts`

Add the following test under the `MoulChartTooltip` describe block in `ui/src/components/Charts.test.ts`:

```ts
    it('CHART-TLP-06: Tooltip styles provide solid elevated fallback and progressive glass enhancement', () => {
      const stylesText = Array.isArray(chartTooltipStyles)
        ? chartTooltipStyles.map((s: any) => s.cssText ?? String(s)).join('\n')
        : ((chartTooltipStyles as any).cssText ?? String(chartTooltipStyles))

      // Solid elevated fallback when unsupported
      expect(stylesText).toMatch(/var\(--color-bg-elevated/)
      expect(stylesText).toMatch(/var\(--color-border-subtle/)
      // Progressive blur enhancement
      expect(stylesText).toMatch(/@supports\s*\([^)]*backdrop-filter:\s*blur\(12px\)/)
      expect(stylesText).toMatch(/var\(--color-bg-glass/)
      expect(stylesText).toMatch(/var\(--color-border-glass/)
      expect(stylesText).toMatch(/backdrop-filter:\s*blur\(12px\)/)
    })
```

---

## 5. Verification Method

Once implemented by the worker:

1. **Verify Unit & Integration Tests**:
   ```bash
   ./ui/node_modules/.bin/vitest run --root ui src/components/Charts.test.ts
   ```
   *Expected Outcome*: All tests pass (including new `CHART-TLP-06`).

2. **Verify Biome Linter**:
   ```bash
   ./node_modules/.bin/biome check ui/src/components/ChartTooltip/ChartTooltip.styles.ts
   ```
   *Expected Outcome*: 0 errors, 0 warnings.

3. **Verify Zero-React Dependency Guard**:
   ```bash
   bun ./scripts/verify-no-react.ts all
   ```
   *Expected Outcome*: Exit code 0. Zero prohibited dependencies or imports.

---

### Modern Web Guidance
Checked `modern-web-guidance` for glassmorphism and backdrop-filter fallback patterns; local project design token architecture in `style.css` and the established `@supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px))` progressive enhancement pattern from `semantic-tones.ts` were synthesized into the exact implementation rules.
