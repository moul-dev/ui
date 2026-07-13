import * as stylex from '@stylexjs/stylex'

export const tokens = stylex.defineVars({
  // ── Color palette — oklch(L C H) ──────────────────────────────────
  // Neutral — zero chroma (C=0), hue irrelevant
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

  // Primary — dynamic hue & chroma
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

  // Error — red hue (H ≈ 27)
  colorError300: 'light-dark(oklch(0.80 0.120 27), oklch(0.45 0.150 27))',
  colorError400: 'light-dark(oklch(0.68 0.170 27), oklch(0.58 0.180 27))',
  colorError500: 'light-dark(oklch(0.56 0.200 27), oklch(0.68 0.190 27))',
  colorError600: 'light-dark(oklch(0.46 0.190 27), oklch(0.78 0.150 27))',
  colorError700: 'light-dark(oklch(0.36 0.160 27), oklch(0.87 0.090 27))',

  // Warning — yellow hue (H ≈ 85)
  colorWarning300: 'light-dark(oklch(0.85 0.130 85), oklch(0.48 0.140 85))',
  colorWarning400: 'light-dark(oklch(0.78 0.160 85), oklch(0.60 0.165 85))',
  colorWarning500: 'light-dark(oklch(0.70 0.175 85), oklch(0.72 0.165 85))',
  colorWarning600: 'light-dark(oklch(0.60 0.165 85), oklch(0.82 0.130 85))',
  colorWarning700: 'light-dark(oklch(0.48 0.140 85), oklch(0.90 0.080 85))',

  // Success — green hue (H ≈ 145)
  colorSuccess300: 'light-dark(oklch(0.82 0.120 145), oklch(0.44 0.130 145))',
  colorSuccess400: 'light-dark(oklch(0.72 0.155 145), oklch(0.56 0.160 145))',
  colorSuccess500: 'light-dark(oklch(0.62 0.175 145), oklch(0.68 0.170 145))',
  colorSuccess600: 'light-dark(oklch(0.52 0.165 145), oklch(0.78 0.135 145))',
  colorSuccess700: 'light-dark(oklch(0.40 0.135 145), oklch(0.87 0.085 145))',

  // ── Semantic surface / text aliases ───────────────────────────────
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

  // Shadows use oklch with alpha (oklch L C H / alpha)
  colorShadow: 'light-dark(oklch(0 0 0 / 0.10), oklch(0 0 0 / 0.40))',
  colorOverlay: 'light-dark(oklch(0 0 0 / 0.40), oklch(0 0 0 / 0.60))',

  // Alert/Status status variants
  colorAlertBgInfo: 'light-dark(oklch(0.97 0 0), oklch(0.16 0 0))',
  colorAlertBorderInfo: 'light-dark(oklch(0.92 0 0), oklch(0.22 0 0))',
  colorAlertHoverInfo:
    'light-dark(oklch(0.92 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.12 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
  colorAlertActiveInfo:
    'light-dark(oklch(0.88 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.08 calc(0.01 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',

  colorAlertBgAccent:
    'light-dark(oklch(0.97 calc(0.02 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.19 calc(0.035 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
  colorAlertBorderAccent:
    'light-dark(oklch(0.88 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.28 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
  colorAlertHoverAccent:
    'light-dark(oklch(0.92 calc(0.04 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.14 calc(0.05 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',
  colorAlertActiveAccent:
    'light-dark(oklch(0.87 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)), oklch(0.10 calc(0.06 * var(--brand-chroma-multiplier, 1)) var(--brand-hue, 250)))',

  colorAlertBgSuccess:
    'light-dark(oklch(0.97 0.02 145), oklch(0.19 0.035 145))',
  colorAlertBorderSuccess:
    'light-dark(oklch(0.88 0.04 145), oklch(0.28 0.06 145))',
  colorAlertHoverSuccess:
    'light-dark(oklch(0.92 0.04 145), oklch(0.14 0.05 145))',
  colorAlertActiveSuccess:
    'light-dark(oklch(0.87 0.06 145), oklch(0.10 0.06 145))',

  colorAlertBgWarning: 'light-dark(oklch(0.98 0.02 85), oklch(0.19 0.035 85))',
  colorAlertBorderWarning:
    'light-dark(oklch(0.90 0.05 85), oklch(0.28 0.06 85))',
  colorAlertHoverWarning:
    'light-dark(oklch(0.93 0.04 85), oklch(0.14 0.05 85))',
  colorAlertActiveWarning:
    'light-dark(oklch(0.88 0.06 85), oklch(0.10 0.06 85))',

  colorAlertBgError: 'light-dark(oklch(0.97 0.02 27), oklch(0.19 0.035 27))',
  colorAlertBorderError: 'light-dark(oklch(0.90 0.05 27), oklch(0.28 0.06 27))',
  colorAlertHoverError: 'light-dark(oklch(0.92 0.04 27), oklch(0.14 0.05 27))',
  colorAlertActiveError: 'light-dark(oklch(0.87 0.06 27), oklch(0.10 0.06 27))',

  // ── Typography ────────────────────────────────────────────────────
  fontSizeXs: '0.75rem', // 12px
  fontSizeSm: '0.875rem', // 14px
  fontSizeMd: '1rem', // 16px
  fontSizeLg: '1.125rem', // 18px
  fontSizeXl: '1.25rem', // 20px
  fontSizeXxl: '1.5rem', // 24px
  fontSize3xl: '1.875rem', // 30px
  fontSize4xl: '2.25rem', // 36px
  lineHeightXs: '1rem',
  lineHeightSm: '1.25rem',
  lineHeightMd: '1.5rem',
  lineHeightLg: '1.75rem',
  lineHeightXl: '1.75rem',
  lineHeightXxl: '2rem',
  lineHeight3xl: '2.25rem',
  lineHeight4xl: '2.5rem',
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
  fontFamilyBase: "'Google Sans', 'Inter', system-ui, sans-serif",

  // ── Spacing (8 steps, 4px base) ───────────────────────────────────
  spacing1: '0.25rem', // 4px
  spacing2: '0.5rem', // 8px
  spacing3: '0.75rem', // 12px
  spacing4: '1rem', // 16px
  spacing5: '1.25rem', // 20px
  spacing6: '1.5rem', // 24px
  spacing7: '1.75rem', // 28px
  spacing8: '2rem', // 32px

  // ── Border radius ─────────────────────────────────────────────────
  radiusNone: '0',
  radiusSm: '0.375rem',
  radiusMd: '0.75rem',
  radiusLg: '1.25rem',
  radiusFull: '9999px',

  // ── Shadows — use colorShadow token for the shadow color ──────────
  shadowSm: '0 1px 2px 0 var(--colorShadow)',
  shadowMd:
    '0 4px 6px -1px var(--colorShadow), 0 2px 4px -2px var(--colorShadow)',
  shadowLg:
    '0 10px 15px -3px var(--colorShadow), 0 4px 6px -4px var(--colorShadow)',

  // ── Z-index ───────────────────────────────────────────────────────
  zIndexBase: '0',
  zIndexDropdown: '1000',
  zIndexModal: '1300',
  zIndexTooltip: '1500',
  zIndexToast: '1700',

  // ── Chart Colors (8 steps for light/dark responsive graphs) ───────
  colorChart1: 'light-dark(oklch(0.60 0.18 250), oklch(0.65 0.16 250))', // Blue
  colorChart2: 'light-dark(oklch(0.75 0.15 75),  oklch(0.75 0.14 75))',  // Yellow / Gold
  colorChart3: 'light-dark(oklch(0.65 0.18 5),   oklch(0.68 0.16 5))',   // Rose / Pink
  colorChart4: 'light-dark(oklch(0.62 0.20 300), oklch(0.65 0.18 300))', // Purple / Violet
  colorChart5: 'light-dark(oklch(0.68 0.16 195), oklch(0.70 0.14 195))', // Teal / Cyan
  colorChart6: 'light-dark(oklch(0.58 0.16 45),  oklch(0.62 0.15 45))',  // Orange / Rust
  colorChart7: 'light-dark(oklch(0.64 0.17 145), oklch(0.68 0.15 145))', // Green
  colorChart8: 'light-dark(oklch(0.60 0 0),      oklch(0.65 0 0))',      // Gray / Neutral
})

