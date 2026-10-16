# Handoff Report: Milestone 2 Task 2.1 — CSS Design Token Layer (`ui/src/styles/style.css`)

## 1. Observation

### 1.1 Source Files Examined
- `ui/src/tokens/tokens.stylex.ts` (lines 1–183): The canonical token source defining 118 design tokens as `stylex.defineVars()`.
- `ui/src/styles/theme.css` (lines 1–20): Legacy theme variables containing 5 brand hooks and basic theme selectors.
- `ui/src/tokens/tokens.test.ts` (lines 1–183): Legacy Vitest test asserting token structure and CSS outputs.
- `ui/vite.config.ts` (lines 40–55): `copyCssTokensPlugin()` configured to copy `ui/src/styles/style.css` to `ui/dist/assets/style.css` during `closeBundle`.
- `rdt/requirements.md` (lines 70–89, Requirement 3): Formal requirements for the CSS Design Token Layer.
- `rdt/design.md` (lines 290–323, Section 4): Technical specification and token mapping table.
- `rdt/tasks.md` (lines 34–38, Task 2.1): Task breakdown for Phase 2 Task 2.1.
- `explorer_survey_2/handoff.md` (lines 1–502): Design token survey and initial extraction.
- `spec_miner_survey_3/handoff.md` (lines 1–447): Phase 1 & Phase 2 foundation specification mining.

### 1.2 Verbatim Observations from `ui/src/tokens/tokens.stylex.ts`
1. **Neutral Scale (lines 6–15)**: Zero chroma (`C=0`), hue `0`:
   ```ts
   colorNeutral50: 'light-dark(oklch(0.98 0 0),   oklch(0.14 0 0))',
   colorNeutral100: 'light-dark(oklch(0.96 0 0),   oklch(0.18 0 0))',
   colorNeutral200: 'light-dark(oklch(0.92 0 0),   oklch(0.24 0 0))',
   colorNeutral300: 'light-dark(oklch(0.84 0 0),   oklch(0.32 0 0))',
   colorNeutral400: 'light-dark(oklch(0.70 0 0),   oklch(0.45 0 0))',
   colorNeutral500: 'light-dark(oklch(0.55 0 0),   oklch(0.55 0 0))',
   colorNeutral600: 'light-dark(oklch(0.42 0 0),   oklch(0.68 0 0))',
   colorNeutral700: 'light-dark(oklch(0.32 0 0),   oklch(0.78 0 0))',
   colorNeutral800: 'light-dark(oklch(0.22 0 0),   oklch(0.88 0 0))',
   colorNeutral900: 'light-dark(oklch(0.14 0 0),   oklch(0.96 0 0))',
   ```
2. **Primary Scale (lines 18–37)**: Dynamic chroma and hue:
   ```ts
   colorPrimary50: 'light-dark(oklch(0.96 calc(0.025 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.22 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary100: 'light-dark(oklch(0.92 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.080 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary200: 'light-dark(oklch(0.85 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.36 calc(0.120 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary300: 'light-dark(oklch(0.77 calc(0.140 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.45 calc(0.160 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary400: 'light-dark(oklch(0.66 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.56 calc(0.200 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary500: 'light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary600: 'light-dark(oklch(0.46 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.75 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary700: 'light-dark(oklch(0.38 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.83 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary800: 'light-dark(oklch(0.30 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.90 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorPrimary900: 'light-dark(oklch(0.22 calc(0.110 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.95 calc(0.040 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   ```
3. **Error Scale (lines 40–44)**: Hue `27`:
   ```ts
   colorError300: 'light-dark(oklch(0.80 0.120 27), oklch(0.45 0.150 27))',
   colorError400: 'light-dark(oklch(0.68 0.170 27), oklch(0.58 0.180 27))',
   colorError500: 'light-dark(oklch(0.56 0.200 27), oklch(0.68 0.190 27))',
   colorError600: 'light-dark(oklch(0.46 0.190 27), oklch(0.78 0.150 27))',
   colorError700: 'light-dark(oklch(0.36 0.160 27), oklch(0.87 0.090 27))',
   ```
4. **Warning Scale (lines 47–51)**: Hue `85`:
   ```ts
   colorWarning300: 'light-dark(oklch(0.85 0.130 85), oklch(0.48 0.140 85))',
   colorWarning400: 'light-dark(oklch(0.78 0.160 85), oklch(0.60 0.165 85))',
   colorWarning500: 'light-dark(oklch(0.70 0.175 85), oklch(0.72 0.165 85))',
   colorWarning600: 'light-dark(oklch(0.60 0.165 85), oklch(0.82 0.130 85))',
   colorWarning700: 'light-dark(oklch(0.48 0.140 85), oklch(0.90 0.080 85))',
   ```
5. **Success Scale (lines 54–58)**: Hue `145`:
   ```ts
   colorSuccess300: 'light-dark(oklch(0.82 0.120 145), oklch(0.44 0.130 145))',
   colorSuccess400: 'light-dark(oklch(0.72 0.155 145), oklch(0.56 0.160 145))',
   colorSuccess500: 'light-dark(oklch(0.62 0.175 145), oklch(0.68 0.170 145))',
   colorSuccess600: 'light-dark(oklch(0.52 0.165 145), oklch(0.78 0.135 145))',
   colorSuccess700: 'light-dark(oklch(0.40 0.135 145), oklch(0.87 0.085 145))',
   ```
6. **Semantic Aliases (lines 61–76)**:
   ```ts
   colorBg: 'light-dark(oklch(1 0 0),      oklch(0.12 0 0))',
   colorBgSubtle: 'light-dark(oklch(0.97 0 0),   oklch(0.16 0 0))',
   colorBgElevated: 'light-dark(oklch(1 0 0),      oklch(0.20 0 0))',
   colorFg: 'light-dark(oklch(0.14 0 0),   oklch(0.96 0 0))',
   colorFgSubtle: 'light-dark(oklch(0.42 0 0),   oklch(0.68 0 0))',
   colorFgOnPrimary: 'light-dark(oklch(1 0 0),      oklch(0.10 0 0))',
   colorBorder: 'light-dark(oklch(0.84 0 0),   oklch(0.28 0 0))',
   colorBorderSubtle: 'light-dark(oklch(0.92 0 0),   oklch(0.22 0 0))',
   colorBorderFocus: 'light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
   colorBgGlass: 'light-dark(oklch(1 0 0 / 0.55), oklch(0.20 0 0 / 0.45))',
   colorBorderGlass: 'light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.10))',
   colorShadow: 'light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.40))',
   colorOverlay: 'light-dark(oklch(0 0 0 / 0.40), oklch(0 0 0 / 0.60))',
   ```
7. **Alert Status Variants (lines 79–115)**: 20 tokens covering `info`, `accent`, `success`, `warning`, `error` × `Bg`, `Border`, `Hover`, `Active`.
8. **Typography Tokens (lines 118–138)**:
   - Font sizes: `xs` (0.75rem), `sm` (0.875rem), `md` (1rem), `lg` (1.125rem), `xl` (1.25rem), `xxl` (1.5rem), `3xl` (1.875rem), `4xl` (2.25rem) scaled by `var(--brand-font-scale, 1)`.
   - Line heights: `xs` (1rem), `sm` (1.25rem), `md` (1.5rem), `lg` (1.75rem), `xl` (1.75rem), `xxl` (2rem), `3xl` (2.25rem), `4xl` (2.5rem) scaled by `var(--brand-font-scale, 1)`.
   - Font weights: `normal: 400`, `medium: 500`, `semibold: 600`, `bold: 700`.
   - Base font family: `var(--brand-font-family, inherit)`.
9. **Spacing Tokens (lines 141–148)**:
   - `spacing1` through `spacing8`: 4px increments (`0.25rem` through `2rem`) multiplied by `var(--brand-density-factor, 1)`.
10. **Border Radius Tokens (lines 151–155)**:
    - `radiusNone`: `0`
    - `radiusSm`: `calc(0.375rem * var(--brand-radius-factor, 1))`
    - `radiusMd`: `calc(0.75rem * var(--brand-radius-factor, 1))`
    - `radiusLg`: `calc(1.25rem * var(--brand-radius-factor, 1))`
    - `radiusFull`: `9999px`
11. **Shadow Tokens (lines 158–162)**:
    - `shadowSm`: `0 1px 2px 0 var(--colorShadow)`
    - `shadowMd`: `0 4px 6px -1px var(--colorShadow), 0 2px 4px -2px var(--colorShadow)`
    - `shadowLg`: `0 10px 15px -3px var(--colorShadow), 0 4px 6px -4px var(--colorShadow)`
    *(Observation: referenced `--colorShadow` camelCase; must reference `--color-shadow` in native CSS)*.
12. **Z-Index Tokens (lines 165–169)**:
    - `zIndexBase`: `0`
    - `zIndexDropdown`: `1000`
    - `zIndexModal`: `1300`
    - `zIndexTooltip`: `1500`
    - `zIndexToast`: `1700`
13. **Chart Color Tokens (lines 172–179)**: 8 tokens `colorChart1` through `colorChart8`.

---

## 2. Logic Chain

1. **Native CSS Custom Property Cascade for Lit Web Components**:
   - Web Components encapsulate template markup and local CSS in Shadow DOM.
   - However, standard CSS custom properties defined on `:root` automatically pierce open Shadow Roots, making all 124 design properties available to any `<moul-*>` element without requiring individual style imports or JavaScript runtime context providers.
   - Therefore, writing `ui/src/styles/style.css` as pure CSS variables on `:root` is the optimal foundation for the Lit migration.

2. **Dynamic `color-scheme` & `light-dark()` Evaluation**:
   - Native CSS `light-dark(lightVal, darkVal)` resolves based on the element's computed `color-scheme`.
   - Setting `:root { color-scheme: light dark; }` ensures the browser automatically selects light or dark token values matching the user's OS `prefers-color-scheme` setting without executing JavaScript.
   - Adding selector rules `[data-theme="light"] { color-scheme: light; }` and `[data-theme="dark"], .dark { color-scheme: dark; }` allows applications or specific containers to force light or dark mode declaratively.

3. **Correction of Legacy StyleX Inconsistencies**:
   - In `tokens.stylex.ts`, shadows referenced `var(--colorShadow)`. CSS variables must use standard kebab-case naming (`--color-shadow`). Requirement 3.8 explicitly mandates `--color-shadow`.
   - In `ui/src/styles/theme.css`, only 5 brand hooks were defined, omitting `--brand-font-family: inherit`. Requirement 3.2 explicitly requires 6 brand customization hooks (`--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, `--brand-radius-factor: 1`).
   - Adding `--brand-font-family: inherit` ensures the typography system honors customized root fonts seamlessly.

4. **Preservation of Exact Color Contrasts and Calculations**:
   - The lightness, chroma, and hue numbers in `tokens.stylex.ts` were engineered for strict WCAG contrast compliance.
   - Preserving every numerical coefficient and OKLCH value ensures zero visual regression during the monorepo rebuild.

5. **Build and Package Contract Verification**:
   - `ui/vite.config.ts` has `copyCssTokensPlugin()` that copies `src/styles/style.css` directly to `dist/assets/style.css` on bundle close.
   - `ui/package.json` specifies `"./style.css": { "style": "./dist/assets/style.css", "default": "./dist/assets/style.css" }`.
   - Thus, once `ui/src/styles/style.css` is written, running `bun run build:ui` will emit `dist/assets/style.css` cleanly without additional build configuration changes.

---

## 3. Caveats

1. **Read-Only Scope**:
   - This analysis was performed under read-only constraints. The target file `ui/src/styles/style.css` was NOT created during this task.
2. **Legacy `ui/src/styles/theme.css`**:
   - `ui/src/styles/theme.css` still exists in `ui/src/styles/`. It is superseded by `ui/src/styles/style.css`. Once `style.css` is implemented, `theme.css` should either be kept for backwards compatibility or replaced/redirected depending on Phase 2 instructions.
3. **Step Name in Typography**:
   - Requirement 3.5 and `tokens.stylex.ts` use `--font-size-xxl` and `--line-height-xxl` (not `2xl`). For complete spec adherence, `--font-size-xxl` is used, and optional `--font-size-2xl` alias can be added if desired.
4. **Browser Requirements**:
   - Native `light-dark()` and `oklch()` require modern browsers (Chrome 123+, Firefox 120+, Safari 17.5+). For older runtimes or Vitest `happy-dom`, the raw token strings are inspected directly in unit tests.

---

## 4. Conclusion & Actionable Implementation Plan

The CSS design token layer requires authoring `ui/src/styles/style.css` with **124 custom properties** (6 brand hooks + 118 design tokens) on `:root`, along with theme selectors.

### Complete Target Code for `ui/src/styles/style.css`

```css
/**
 * Moul UI Native CSS Design Token Layer
 * Defines all design tokens at :root using light-dark() and oklch().
 * Inherits across Shadow DOM boundaries for Lit Web Components.
 */

:root {
  /* Color Scheme declaration for native light-dark() resolution */
  color-scheme: light dark;

  /* ── Brand Customization Hooks ────────────────────────────────── */
  --brand-hue: 250;
  --brand-chroma-multiplier: 1;
  --brand-font-family: inherit;
  --brand-font-scale: 1;
  --brand-density-factor: 1;
  --brand-radius-factor: 1;

  /* ── Neutral Scale (10 steps) ─────────────────────────────────── */
  --color-neutral-50: light-dark(oklch(0.98 0 0), oklch(0.14 0 0));
  --color-neutral-100: light-dark(oklch(0.96 0 0), oklch(0.18 0 0));
  --color-neutral-200: light-dark(oklch(0.92 0 0), oklch(0.24 0 0));
  --color-neutral-300: light-dark(oklch(0.84 0 0), oklch(0.32 0 0));
  --color-neutral-400: light-dark(oklch(0.70 0 0), oklch(0.45 0 0));
  --color-neutral-500: light-dark(oklch(0.55 0 0), oklch(0.55 0 0));
  --color-neutral-600: light-dark(oklch(0.42 0 0), oklch(0.68 0 0));
  --color-neutral-700: light-dark(oklch(0.32 0 0), oklch(0.78 0 0));
  --color-neutral-800: light-dark(oklch(0.22 0 0), oklch(0.88 0 0));
  --color-neutral-900: light-dark(oklch(0.14 0 0), oklch(0.96 0 0));

  /* ── Primary Scale (10 steps) ─────────────────────────────────── */
  --color-primary-50: light-dark(oklch(0.96 calc(0.025 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.22 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-100: light-dark(oklch(0.92 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.080 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-200: light-dark(oklch(0.85 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.36 calc(0.120 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-300: light-dark(oklch(0.77 calc(0.140 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.45 calc(0.160 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-400: light-dark(oklch(0.66 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.56 calc(0.200 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-500: light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-600: light-dark(oklch(0.46 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.75 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-700: light-dark(oklch(0.38 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.83 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-800: light-dark(oklch(0.30 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.90 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-primary-900: light-dark(oklch(0.22 calc(0.110 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.95 calc(0.040 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));

  /* ── Error Scale (5 steps, hue 27) ────────────────────────────── */
  --color-error-300: light-dark(oklch(0.80 0.120 27), oklch(0.45 0.150 27));
  --color-error-400: light-dark(oklch(0.68 0.170 27), oklch(0.58 0.180 27));
  --color-error-500: light-dark(oklch(0.56 0.200 27), oklch(0.68 0.190 27));
  --color-error-600: light-dark(oklch(0.46 0.190 27), oklch(0.78 0.150 27));
  --color-error-700: light-dark(oklch(0.36 0.160 27), oklch(0.87 0.090 27));

  /* ── Warning Scale (5 steps, hue 85) ──────────────────────────── */
  --color-warning-300: light-dark(oklch(0.85 0.130 85), oklch(0.48 0.140 85));
  --color-warning-400: light-dark(oklch(0.78 0.160 85), oklch(0.60 0.165 85));
  --color-warning-500: light-dark(oklch(0.70 0.175 85), oklch(0.72 0.165 85));
  --color-warning-600: light-dark(oklch(0.60 0.165 85), oklch(0.82 0.130 85));
  --color-warning-700: light-dark(oklch(0.48 0.140 85), oklch(0.90 0.080 85));

  /* ── Success Scale (5 steps, hue 145) ─────────────────────────── */
  --color-success-300: light-dark(oklch(0.82 0.120 145), oklch(0.44 0.130 145));
  --color-success-400: light-dark(oklch(0.72 0.155 145), oklch(0.56 0.160 145));
  --color-success-500: light-dark(oklch(0.62 0.175 145), oklch(0.68 0.170 145));
  --color-success-600: light-dark(oklch(0.52 0.165 145), oklch(0.78 0.135 145));
  --color-success-700: light-dark(oklch(0.40 0.135 145), oklch(0.87 0.085 145));

  /* ── Semantic Surface & Text Aliases (13 tokens) ─────────────── */
  --color-bg: light-dark(oklch(1 0 0), oklch(0.12 0 0));
  --color-bg-subtle: light-dark(oklch(0.97 0 0), oklch(0.16 0 0));
  --color-bg-elevated: light-dark(oklch(1 0 0), oklch(0.20 0 0));
  --color-fg: light-dark(oklch(0.14 0 0), oklch(0.96 0 0));
  --color-fg-subtle: light-dark(oklch(0.42 0 0), oklch(0.68 0 0));
  --color-fg-on-primary: light-dark(oklch(1 0 0), oklch(0.10 0 0));
  --color-border: light-dark(oklch(0.84 0 0), oklch(0.28 0 0));
  --color-border-subtle: light-dark(oklch(0.92 0 0), oklch(0.22 0 0));
  --color-border-focus: light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-bg-glass: light-dark(oklch(1 0 0 / 0.55), oklch(0.20 0 0 / 0.45));
  --color-border-glass: light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.10));
  --color-shadow: light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.40));
  --color-overlay: light-dark(oklch(0 0 0 / 0.40), oklch(0 0 0 / 0.60));

  /* ── Alert / Status Variants (20 tokens) ──────────────────────── */
  /* Info */
  --color-alert-bg-info: light-dark(oklch(0.97 0 0), oklch(0.16 0 0));
  --color-alert-border-info: light-dark(oklch(0.92 0 0), oklch(0.22 0 0));
  --color-alert-hover-info: light-dark(oklch(0.92 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.12 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-alert-active-info: light-dark(oklch(0.88 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.08 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));

  /* Accent */
  --color-alert-bg-accent: light-dark(oklch(0.97 calc(0.02 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.19 calc(0.035 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-alert-border-accent: light-dark(oklch(0.88 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-alert-hover-accent: light-dark(oklch(0.92 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.14 calc(0.05 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));
  --color-alert-active-accent: light-dark(oklch(0.87 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.10 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)));

  /* Success */
  --color-alert-bg-success: light-dark(oklch(0.97 0.02 145), oklch(0.19 0.035 145));
  --color-alert-border-success: light-dark(oklch(0.88 0.04 145), oklch(0.28 0.06 145));
  --color-alert-hover-success: light-dark(oklch(0.92 0.04 145), oklch(0.14 0.05 145));
  --color-alert-active-success: light-dark(oklch(0.87 0.06 145), oklch(0.10 0.06 145));

  /* Warning */
  --color-alert-bg-warning: light-dark(oklch(0.98 0.02 85), oklch(0.19 0.035 85));
  --color-alert-border-warning: light-dark(oklch(0.90 0.05 85), oklch(0.28 0.06 85));
  --color-alert-hover-warning: light-dark(oklch(0.93 0.04 85), oklch(0.14 0.05 85));
  --color-alert-active-warning: light-dark(oklch(0.88 0.06 85), oklch(0.10 0.06 85));

  /* Error */
  --color-alert-bg-error: light-dark(oklch(0.97 0.02 27), oklch(0.19 0.035 27));
  --color-alert-border-error: light-dark(oklch(0.90 0.05 27), oklch(0.28 0.06 27));
  --color-alert-hover-error: light-dark(oklch(0.92 0.04 27), oklch(0.14 0.05 27));
  --color-alert-active-error: light-dark(oklch(0.87 0.06 27), oklch(0.10 0.06 27));

  /* ── Typography (21 tokens) ──────────────────────────────────── */
  --font-size-xs: calc(0.75rem * var(--brand-font-scale, 1));
  --font-size-sm: calc(0.875rem * var(--brand-font-scale, 1));
  --font-size-md: calc(1rem * var(--brand-font-scale, 1));
  --font-size-lg: calc(1.125rem * var(--brand-font-scale, 1));
  --font-size-xl: calc(1.25rem * var(--brand-font-scale, 1));
  --font-size-xxl: calc(1.5rem * var(--brand-font-scale, 1));
  --font-size-3xl: calc(1.875rem * var(--brand-font-scale, 1));
  --font-size-4xl: calc(2.25rem * var(--brand-font-scale, 1));

  --line-height-xs: calc(1rem * var(--brand-font-scale, 1));
  --line-height-sm: calc(1.25rem * var(--brand-font-scale, 1));
  --line-height-md: calc(1.5rem * var(--brand-font-scale, 1));
  --line-height-lg: calc(1.75rem * var(--brand-font-scale, 1));
  --line-height-xl: calc(1.75rem * var(--brand-font-scale, 1));
  --line-height-xxl: calc(2rem * var(--brand-font-scale, 1));
  --line-height-3xl: calc(2.25rem * var(--brand-font-scale, 1));
  --line-height-4xl: calc(2.5rem * var(--brand-font-scale, 1));

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-family-base: var(--brand-font-family, inherit);

  /* ── Spacing (8 steps, 4px base) ──────────────────────────────── */
  --spacing-1: calc(0.25rem * var(--brand-density-factor, 1));
  --spacing-2: calc(0.5rem * var(--brand-density-factor, 1));
  --spacing-3: calc(0.75rem * var(--brand-density-factor, 1));
  --spacing-4: calc(1rem * var(--brand-density-factor, 1));
  --spacing-5: calc(1.25rem * var(--brand-density-factor, 1));
  --spacing-6: calc(1.5rem * var(--brand-density-factor, 1));
  --spacing-7: calc(1.75rem * var(--brand-density-factor, 1));
  --spacing-8: calc(2rem * var(--brand-density-factor, 1));

  /* ── Border Radius (5 steps) ─────────────────────────────────── */
  --radius-none: 0;
  --radius-sm: calc(0.375rem * var(--brand-radius-factor, 1));
  --radius-md: calc(0.75rem * var(--brand-radius-factor, 1));
  --radius-lg: calc(1.25rem * var(--brand-radius-factor, 1));
  --radius-full: 9999px;

  /* ── Shadows (3 steps, referencing --color-shadow) ───────────── */
  --shadow-sm: 0 1px 2px 0 var(--color-shadow);
  --shadow-md: 0 4px 6px -1px var(--color-shadow), 0 2px 4px -2px var(--color-shadow);
  --shadow-lg: 0 10px 15px -3px var(--color-shadow), 0 4px 6px -4px var(--color-shadow);

  /* ── Z-Index (5 steps) ────────────────────────────────────────── */
  --z-base: 0;
  --z-dropdown: 1000;
  --z-modal: 1300;
  --z-tooltip: 1500;
  --z-toast: 1700;

  /* ── Chart Colors (8 steps) ───────────────────────────────────── */
  --color-chart-1: light-dark(oklch(0.60 0.18 250), oklch(0.65 0.16 250));
  --color-chart-2: light-dark(oklch(0.75 0.15 75),  oklch(0.75 0.14 75));
  --color-chart-3: light-dark(oklch(0.65 0.18 5),   oklch(0.68 0.16 5));
  --color-chart-4: light-dark(oklch(0.62 0.20 300), oklch(0.65 0.18 300));
  --color-chart-5: light-dark(oklch(0.68 0.16 195), oklch(0.70 0.14 195));
  --color-chart-6: light-dark(oklch(0.58 0.16 45),  oklch(0.62 0.15 45));
  --color-chart-7: light-dark(oklch(0.64 0.17 145), oklch(0.68 0.15 145));
  --color-chart-8: light-dark(oklch(0.60 0 0),      oklch(0.65 0 0));
}

/* ── Theme Selectors ────────────────────────────────────────────── */
[data-theme="light"] {
  color-scheme: light;
}

[data-theme="dark"],
.dark {
  color-scheme: dark;
}
```

### 4.2 Step-by-Step Implementation Strategy for Worker Agent
1. **Create `ui/src/styles/style.css`**:
   - Write the exact CSS content above to `ui/src/styles/style.css`.
2. **Build and Asset Emission**:
   - Run `bun run build:ui` (or `vite build` within `ui/`).
   - Verify `ui/dist/assets/style.css` is emitted by `copyCssTokensPlugin`.
3. **Format & Lint**:
   - Run `bun run format` and `bun run lint` to confirm zero Biome formatting or lint issues in the stylesheet.
4. **Prepare for Task 2.4 Test Suite**:
   - In Task 2.4, write tests in `ui/src/tokens/Tokens.test.ts` verifying all 124 custom properties and selector blocks.

---

## 5. Verification Method

To independently verify the strategy and implementation:

1. **Verify Source Token Alignment**:
   - Compare every token in `style.css` against `ui/src/tokens/tokens.stylex.ts`.
   - Confirm OKLCH numbers match character-for-character.
2. **Verify Variable Count**:
   - Count `:root` custom properties:
     ```bash
     grep -E "^\s*--(brand|color|font|line|spacing|radius|shadow|z)-" ui/src/styles/style.css | wc -l
     ```
     Expected count: **124** (6 brand hooks + 10 neutral + 10 primary + 5 error + 5 warning + 5 success + 13 semantic aliases + 20 alert variants + 21 typography + 8 spacing + 5 radius + 3 shadows + 5 z-index + 8 chart colors).
3. **Verify Shadow Reference Fix**:
   - Run:
     ```bash
     grep "var(--colorShadow)" ui/src/styles/style.css
     ```
     Must return 0 results.
   - Run:
     ```bash
     grep "var(--color-shadow)" ui/src/styles/style.css
     ```
     Must return 3 lines (`--shadow-sm`, `--shadow-md`, `--shadow-lg`).
4. **Verify Theme Selectors**:
   - Ensure `color-scheme: light dark;` is defined in `:root`.
   - Ensure `[data-theme="light"] { color-scheme: light; }`.
   - Ensure `[data-theme="dark"], .dark { color-scheme: dark; }`.
5. **Verify Build Emission**:
   - Run `bun run --cwd ui build` and inspect `ui/dist/assets/style.css`.
