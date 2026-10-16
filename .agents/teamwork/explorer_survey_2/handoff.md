# Handoff Report: Design Token Survey & Mapping Analysis

## 1. Observation

### 1.1 Source Files Examined
Direct observation via `view_file` and `grep_search`:
- `ui/src/tokens/tokens.stylex.ts` (183 lines): The canonical source of all design token values in the repository.
- `ui/src/styles/theme.css` (20 lines): Current brand hook variables and theme selectors.
- `ui/src/tokens/tokens.test.ts` (183 lines): Legacy test verifying token definitions, StyleX exports, and CSS files.
- `rdt/requirements.md` (Lines 70–89, Requirement 3): Formal requirements for the CSS Design Token Layer.
- `rdt/design.md` (Lines 290–323, Section 4): Technical specification and token mapping table.
- `rdt/tasks.md` (Lines 34–51, Tasks 2.1–2.4): Task breakdown for Phase 2.
- `ui/package.json`: Current library package configuration showing export entries for tokens and CSS.
- `docs/src/styles/globals.css`: Documentation site CSS consuming `@moul-dev/ui/style` and brand variables.

### 1.2 Extracted Raw Token Definitions (`ui/src/tokens/tokens.stylex.ts`)

#### A. Neutral Scale (Lines 6–15)
Zero chroma (`C = 0`), hue irrelevant (`H = 0`):
```ts
colorNeutral50:  'light-dark(oklch(0.98 0 0),   oklch(0.14 0 0))',
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

#### B. Primary Scale (Lines 18–37)
Dynamic hue (`var(--brand-hue, 250)`) and scaled chroma (`calc(C_base * var(--brand-chroma-multiplier, 1))`):
```ts
colorPrimary50:
  'light-dark(oklch(0.96 calc(0.025 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.22 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary100:
  'light-dark(oklch(0.92 calc(0.050 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.080 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary200:
  'light-dark(oklch(0.85 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.36 calc(0.120 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary300:
  'light-dark(oklch(0.77 calc(0.140 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.45 calc(0.160 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary400:
  'light-dark(oklch(0.66 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.56 calc(0.200 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary500:
  'light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary600:
  'light-dark(oklch(0.46 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.75 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary700:
  'light-dark(oklch(0.38 calc(0.190 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.83 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary800:
  'light-dark(oklch(0.30 calc(0.150 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.90 calc(0.090 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorPrimary900:
  'light-dark(oklch(0.22 calc(0.110 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.95 calc(0.040 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
```

#### C. Error Scale (Lines 40–44)
Fixed hue `27` (red):
```ts
colorError300: 'light-dark(oklch(0.80 0.120 27), oklch(0.45 0.150 27))',
colorError400: 'light-dark(oklch(0.68 0.170 27), oklch(0.58 0.180 27))',
colorError500: 'light-dark(oklch(0.56 0.200 27), oklch(0.68 0.190 27))',
colorError600: 'light-dark(oklch(0.46 0.190 27), oklch(0.78 0.150 27))',
colorError700: 'light-dark(oklch(0.36 0.160 27), oklch(0.87 0.090 27))',
```

#### D. Warning Scale (Lines 47–51)
Fixed hue `85` (yellow):
```ts
colorWarning300: 'light-dark(oklch(0.85 0.130 85), oklch(0.48 0.140 85))',
colorWarning400: 'light-dark(oklch(0.78 0.160 85), oklch(0.60 0.165 85))',
colorWarning500: 'light-dark(oklch(0.70 0.175 85), oklch(0.72 0.165 85))',
colorWarning600: 'light-dark(oklch(0.60 0.165 85), oklch(0.82 0.130 85))',
colorWarning700: 'light-dark(oklch(0.48 0.140 85), oklch(0.90 0.080 85))',
```

#### E. Success Scale (Lines 54–58)
Fixed hue `145` (green):
```ts
colorSuccess300: 'light-dark(oklch(0.82 0.120 145), oklch(0.44 0.130 145))',
colorSuccess400: 'light-dark(oklch(0.72 0.155 145), oklch(0.56 0.160 145))',
colorSuccess500: 'light-dark(oklch(0.62 0.175 145), oklch(0.68 0.170 145))',
colorSuccess600: 'light-dark(oklch(0.52 0.165 145), oklch(0.78 0.135 145))',
colorSuccess700: 'light-dark(oklch(0.40 0.135 145), oklch(0.87 0.085 145))',
```

#### F. Semantic Surface / Text Aliases (Lines 61–76)
```ts
colorBg: 'light-dark(oklch(1 0 0),      oklch(0.12 0 0))',
colorBgSubtle: 'light-dark(oklch(0.97 0 0),   oklch(0.16 0 0))',
colorBgElevated: 'light-dark(oklch(1 0 0),      oklch(0.20 0 0))',
colorFg: 'light-dark(oklch(0.14 0 0),   oklch(0.96 0 0))',
colorFgSubtle: 'light-dark(oklch(0.42 0 0),   oklch(0.68 0 0))',
colorFgOnPrimary: 'light-dark(oklch(1 0 0),      oklch(0.10 0 0))',
colorBorder: 'light-dark(oklch(0.84 0 0),   oklch(0.28 0 0))',
colorBorderSubtle: 'light-dark(oklch(0.92 0 0),   oklch(0.22 0 0))',
colorBorderFocus:
  'light-dark(oklch(0.55 calc(0.240 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.66 calc(0.220 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorBgGlass: 'light-dark(oklch(1 0 0 / 0.55), oklch(0.20 0 0 / 0.45))',
colorBorderGlass: 'light-dark(oklch(0 0 0 / 0.08), oklch(1 0 0 / 0.10))',
colorShadow: 'light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.40))',
colorOverlay: 'light-dark(oklch(0 0 0 / 0.40), oklch(0 0 0 / 0.60))',
```

#### G. Alert / Status Tokens (Lines 79–115)
20 tokens covering 5 variants (`info`, `accent`, `success`, `warning`, `error`) × 4 properties (`Bg`, `Border`, `Hover`, `Active`):
```ts
// Info (neutral hue)
colorAlertBgInfo: 'light-dark(oklch(0.97 0 0), oklch(0.16 0 0))',
colorAlertBorderInfo: 'light-dark(oklch(0.92 0 0), oklch(0.22 0 0))',
colorAlertHoverInfo:
  'light-dark(oklch(0.92 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.12 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorAlertActiveInfo:
  'light-dark(oklch(0.88 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.08 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',

// Accent (brand hue 250)
colorAlertBgAccent:
  'light-dark(oklch(0.97 calc(0.02 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.19 calc(0.035 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorAlertBorderAccent:
  'light-dark(oklch(0.88 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorAlertHoverAccent:
  'light-dark(oklch(0.92 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.14 calc(0.05 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
colorAlertActiveAccent:
  'light-dark(oklch(0.87 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.10 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',

// Success (hue 145)
colorAlertBgSuccess:
  'light-dark(oklch(0.97 0.02 145), oklch(0.19 0.035 145))',
colorAlertBorderSuccess:
  'light-dark(oklch(0.88 0.04 145), oklch(0.28 0.06 145))',
colorAlertHoverSuccess:
  'light-dark(oklch(0.92 0.04 145), oklch(0.14 0.05 145))',
colorAlertActiveSuccess:
  'light-dark(oklch(0.87 0.06 145), oklch(0.10 0.06 145))',

// Warning (hue 85)
colorAlertBgWarning: 'light-dark(oklch(0.98 0.02 85), oklch(0.19 0.035 85))',
colorAlertBorderWarning:
  'light-dark(oklch(0.90 0.05 85), oklch(0.28 0.06 85))',
colorAlertHoverWarning:
  'light-dark(oklch(0.93 0.04 85), oklch(0.14 0.05 85))',
colorAlertActiveWarning:
  'light-dark(oklch(0.88 0.06 85), oklch(0.10 0.06 85))',

// Error (hue 27)
colorAlertBgError: 'light-dark(oklch(0.97 0.02 27), oklch(0.19 0.035 27))',
colorAlertBorderError: 'light-dark(oklch(0.90 0.05 27), oklch(0.28 0.06 27))',
colorAlertHoverError: 'light-dark(oklch(0.92 0.04 27), oklch(0.14 0.05 27))',
colorAlertActiveError: 'light-dark(oklch(0.87 0.06 27), oklch(0.10 0.06 27))',
```

#### H. Typography Tokens (Lines 118–138)
```ts
fontSizeXs: 'calc(0.75rem * var(--brand-font-scale, 1))',   // 12px
fontSizeSm: 'calc(0.875rem * var(--brand-font-scale, 1))',  // 14px
fontSizeMd: 'calc(1rem * var(--brand-font-scale, 1))',      // 16px
fontSizeLg: 'calc(1.125rem * var(--brand-font-scale, 1))',  // 18px
fontSizeXl: 'calc(1.25rem * var(--brand-font-scale, 1))',   // 20px
fontSizeXxl: 'calc(1.5rem * var(--brand-font-scale, 1))',   // 24px
fontSize3xl: 'calc(1.875rem * var(--brand-font-scale, 1))',  // 30px
fontSize4xl: 'calc(2.25rem * var(--brand-font-scale, 1))',   // 36px
lineHeightXs: 'calc(1rem * var(--brand-font-scale, 1))',
lineHeightSm: 'calc(1.25rem * var(--brand-font-scale, 1))',
lineHeightMd: 'calc(1.5rem * var(--brand-font-scale, 1))',
lineHeightLg: 'calc(1.75rem * var(--brand-font-scale, 1))',
lineHeightXl: 'calc(1.75rem * var(--brand-font-scale, 1))',
lineHeightXxl: 'calc(2rem * var(--brand-font-scale, 1))',
lineHeight3xl: 'calc(2.25rem * var(--brand-font-scale, 1))',
lineHeight4xl: 'calc(2.5rem * var(--brand-font-scale, 1))',
fontWeightNormal: '400',
fontWeightMedium: '500',
fontWeightSemibold: '600',
fontWeightBold: '700',
fontFamilyBase: 'var(--brand-font-family, inherit)',
```

#### I. Spacing Tokens (Lines 141–148)
```ts
spacing1: 'calc(0.25rem * var(--brand-density-factor, 1))', // 4px * density
spacing2: 'calc(0.5rem * var(--brand-density-factor, 1))',  // 8px * density
spacing3: 'calc(0.75rem * var(--brand-density-factor, 1))', // 12px * density
spacing4: 'calc(1rem * var(--brand-density-factor, 1))',    // 16px * density
spacing5: 'calc(1.25rem * var(--brand-density-factor, 1))', // 20px * density
spacing6: 'calc(1.5rem * var(--brand-density-factor, 1))',  // 24px * density
spacing7: 'calc(1.75rem * var(--brand-density-factor, 1))', // 28px * density
spacing8: 'calc(2rem * var(--brand-density-factor, 1))',    // 32px * density
```

#### J. Border Radius Tokens (Lines 151–155)
```ts
radiusNone: '0',
radiusSm: 'calc(0.375rem * var(--brand-radius-factor, 1))',
radiusMd: 'calc(0.75rem * var(--brand-radius-factor, 1))',
radiusLg: 'calc(1.25rem * var(--brand-radius-factor, 1))',
radiusFull: '9999px',
```

#### K. Shadow Tokens (Lines 158–162)
```ts
shadowSm: '0 1px 2px 0 var(--colorShadow)',
shadowMd:
  '0 4px 6px -1px var(--colorShadow), 0 2px 4px -2px var(--colorShadow)',
shadowLg:
  '0 10px 15px -3px var(--colorShadow), 0 4px 6px -4px var(--colorShadow)',
```

#### L. Z-Index Tokens (Lines 165–169)
```ts
zIndexBase: '0',
zIndexDropdown: '1000',
zIndexModal: '1300',
zIndexTooltip: '1500',
zIndexToast: '1700',
```

#### M. Chart Color Tokens (Lines 172–179)
```ts
colorChart1: 'light-dark(oklch(0.60 0.18 250), oklch(0.65 0.16 250))', // Blue
colorChart2: 'light-dark(oklch(0.75 0.15 75),  oklch(0.75 0.14 75))',  // Yellow / Gold
colorChart3: 'light-dark(oklch(0.65 0.18 5),   oklch(0.68 0.16 5))',   // Rose / Pink
colorChart4: 'light-dark(oklch(0.62 0.20 300), oklch(0.65 0.18 300))', // Purple / Violet
colorChart5: 'light-dark(oklch(0.68 0.16 195), oklch(0.70 0.14 195))', // Teal / Cyan
colorChart6: 'light-dark(oklch(0.58 0.16 45),  oklch(0.62 0.15 45))',  // Orange / Rust
colorChart7: 'light-dark(oklch(0.64 0.17 145), oklch(0.68 0.15 145))', // Green
colorChart8: 'light-dark(oklch(0.60 0 0),      oklch(0.65 0 0))',      // Gray / Neutral
```

#### N. Brand Customization Hooks (`ui/src/styles/theme.css` Lines 4–10 & `rdt/requirements.md` Req 3.2)
```css
--brand-hue: 250;
--brand-chroma-multiplier: 1;
--brand-font-family: inherit;
--brand-font-scale: 1;
--brand-density-factor: 1;
--brand-radius-factor: 1;
```

---

## 2. Logic Chain

1. **Architecture Shift from Compile-Time StyleX to Native CSS Custom Properties**:
   - In the legacy architecture, `tokens.stylex.ts` exported a `stylex.defineVars()` object. This required the `@stylexjs/unplugin` Vite plugin to compile style definitions into generated classes and precompiled CSS variables (`dist/assets/stylex.css`).
   - In Lit Web Components, each component renders within an isolated Shadow DOM. CSS custom properties automatically pierce Shadow DOM boundaries, whereas CSS classes cannot penetrate shadow roots.
   - Therefore, declaring all design tokens as raw CSS custom properties on `:root` in `ui/src/styles/style.css` provides zero-runtime, framework-agnostic styling directly accessible to all Lit components.

2. **Native `light-dark()` Function Evaluation**:
   - The CSS `light-dark(lightVal, darkVal)` function evaluates dynamically against the computed `color-scheme` property of the element or nearest ancestor.
   - By setting `:root { color-scheme: light dark; }`, the browser resolves `light-dark()` according to the operating system's prefers-color-scheme setting.
   - By declaring `[data-theme="light"] { color-scheme: light; }` and `[data-theme="dark"], .dark { color-scheme: dark; }`, application consumers can switch themes either globally or on any subtree without running JavaScript.

3. **Kebab-Case Name Mapping & Token Harmonization**:
   - StyleX required JavaScript identifier keys (`colorNeutral50`, `colorShadow`). Standard CSS variables follow kebab-case (`--color-neutral-50`, `--color-shadow`).
   - In `tokens.stylex.ts` lines 158, 160, and 162, the shadow tokens referenced `var(--colorShadow)`. This was a bug/mismatch with native CSS variable naming; in native CSS, it must reference `var(--color-shadow)`. Requirement 3.8 explicitly mandates this correction.
   - `theme.css` defined 5 brand hooks but omitted `--brand-font-family: inherit;`. Requirement 3.2 explicitly requires 6 brand hooks (`--brand-hue: 250`, `--brand-chroma-multiplier: 1`, `--brand-font-family: inherit`, `--brand-font-scale: 1`, `--brand-density-factor: 1`, `--brand-radius-factor: 1`).

4. **Exact Formula & Value Preservation**:
   - The lightness, chroma, and hue values for all 5 scales (Neutral, Primary, Error, Warning, Success), 13 semantic aliases, 20 alert tokens, and 8 chart colors in `tokens.stylex.ts` are mathematically consistent and carefully balanced for contrast.
   - To prevent visual regression during the migration from React/StyleX to Lit, `ui/src/styles/style.css` must preserve these exact numbers and formulas verbatim.

---

## 3. Caveats

1. **Read-Only Inspection**:
   - This survey was performed under strict read-only constraints. Neither `ui/src/styles/style.css` nor `ui/src/styles/semantic-tones.ts` were created or modified during this task.
2. **Post-Build File Emission**:
   - Currently, Vite builds `dist/assets/stylex.css` via StyleX. In Phase 1/Phase 2 Task 2.1, `ui/vite.config.ts` will copy `ui/src/styles/style.css` directly to `ui/dist/assets/style.css` during `closeBundle`, preserving raw `light-dark(...)` expressions.
3. **Docs Dependency**:
   - `docs/src/styles/globals.css` currently imports `@moul-dev/ui/style`. Once `ui/package.json` updates its export contract to only expose `.` and `./style.css`, docs will import `@moul-dev/ui/style.css`.

---

## 4. Conclusion

The complete design token layer consists of **118 individual design tokens** plus **6 brand customization hooks** (124 total `:root` properties).

### 4.1 Ready-to-Implement Mapping for `ui/src/styles/style.css`

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

### 4.2 Key Naming Differences & Conversions Summary Table

| Category | `tokens.stylex.ts` (StyleX) | `ui/src/styles/style.css` (Native CSS) | Notes |
| :--- | :--- | :--- | :--- |
| **Neutral Scale** | `colorNeutral50` … `colorNeutral900` | `--color-neutral-50` … `--color-neutral-900` | camelCase to kebab-case |
| **Primary Scale** | `colorPrimary50` … `colorPrimary900` | `--color-primary-50` … `--color-primary-900` | Dynamic chroma/hue formulas preserved |
| **Error Scale** | `colorError300` … `colorError700` | `--color-error-300` … `--color-error-700` | Hue 27 preserved |
| **Warning Scale** | `colorWarning300` … `colorWarning700` | `--color-warning-300` … `--color-warning-700` | Hue 85 preserved |
| **Success Scale** | `colorSuccess300` … `colorSuccess700` | `--color-success-300` … `--color-success-700` | Hue 145 preserved |
| **Semantic Aliases** | `colorBg`, `colorBgSubtle`, etc. | `--color-bg`, `--color-bg-subtle`, etc. | 13 aliases mapped |
| **Shadow Token Ref** | `var(--colorShadow)` | `var(--color-shadow)` | **Critical Fix**: stylex referenced camelCase token name; native CSS requires `--color-shadow` |
| **Brand Hooks** | `theme.css` had 5 hooks | 6 hooks on `:root` | Added missing `--brand-font-family: inherit;` (Req 3.2) |
| **Alert Tokens** | `colorAlertBgInfo` … `colorAlertActiveError` | `--color-alert-bg-info` … `--color-alert-active-error` | 20 tokens covering 5 variants × 4 properties |
| **Typography** | `fontSizeXxl`, `lineHeightXs`, etc. | `--font-size-xxl`, `--line-height-xs`, etc. | 8 sizes, 8 line heights, 4 weights, 1 base family |
| **Spacing** | `spacing1` … `spacing8` | `--spacing-1` … `--spacing-8` | 4px increments scaled by density factor |
| **Radius** | `radiusNone` … `radiusFull` | `--radius-none` … `--radius-full` | 5 steps scaled by radius factor |
| **Z-Index** | `zIndexBase`, `zIndexDropdown`, etc. | `--z-base`, `--z-dropdown`, etc. | `0, 1000, 1300, 1500, 1700` |
| **Chart Colors** | `colorChart1` … `colorChart8` | `--color-chart-1` … `--color-chart-8` | 8 responsive colorway tokens |

---

## 5. Verification Method

1. **Verify Token Completeness**:
   - Inspect `ui/src/tokens/tokens.stylex.ts` and confirm all 118 design tokens and 6 brand hooks are accounted for in the table above.
   - Run grep to verify exact OKLCH values:
     ```bash
     grep -E "oklch|light-dark" ui/src/tokens/tokens.stylex.ts
     ```
2. **Post-Implementation Verification (Phase 2 Task 2.4)**:
   - When `ui/src/styles/style.css` is implemented, run the Vitest suite in `ui/src/tokens/Tokens.test.ts`:
     ```bash
     bun run --cwd ui test
     ```
   - Invalidation conditions: Any discrepancy in lightness, chroma, or hue between `tokens.stylex.ts` and `style.css`, or any missing custom property names from the 124 properties specified above.
