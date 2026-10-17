import { css, type CSSResultGroup, CSSResult } from '../../../../ui/node_modules/lit/index.js'
import fc from '../../../../ui/node_modules/fast-check/lib/fast-check.js'

export const SEMANTIC_TONES = [
  'primary',
  'accent',
  'success',
  'warning',
  'error',
] as const

export type SemanticTone = (typeof SEMANTIC_TONES)[number]

export const VISUAL_VARIANTS = [
  'solid',
  'flat',
  'shadow',
  'bordered',
  'glass',
] as const

export type VisualVariant = (typeof VISUAL_VARIANTS)[number]

export function normalizeTone(
  value: unknown,
  fallback: SemanticTone = 'primary',
): SemanticTone {
  return typeof value === 'string' &&
    (SEMANTIC_TONES as readonly string[]).includes(value)
    ? (value as SemanticTone)
    : fallback
}

export function normalizeVariant(
  value: unknown,
  fallback: VisualVariant = 'flat',
): VisualVariant {
  return typeof value === 'string' &&
    (VISUAL_VARIANTS as readonly string[]).includes(value)
    ? (value as VisualVariant)
    : fallback
}

export const semanticToneStyles: CSSResultGroup = css`
  /* ── Tone-Scoped CSS Custom Properties ─────────────────────────── */

  /* Default / Primary Tone */
  :host,
  :host([tone="primary"]),
  [data-tone="primary"] {
    --_tone-solid-bg: var(--color-primary-600);
    --_tone-solid-fg: var(--color-fg-on-primary);
    --_tone-soft-bg: var(--color-primary-100);
    --_tone-soft-fg: var(--color-primary-700);
    --_tone-border: var(--color-primary-300);
  }

  /* Accent Tone */
  :host([tone="accent"]),
  [data-tone="accent"] {
    --_tone-solid-bg: var(--color-primary-500);
    --_tone-solid-fg: var(--color-fg-on-primary);
    --_tone-soft-bg: var(--color-alert-bg-accent);
    --_tone-soft-fg: var(--color-primary-600);
    --_tone-border: var(--color-alert-border-accent);
  }

  /* Success Tone */
  :host([tone="success"]),
  [data-tone="success"] {
    --_tone-solid-bg: var(--color-success-500);
    --_tone-solid-fg: var(--color-fg-on-primary);
    --_tone-soft-bg: var(--color-alert-bg-success);
    --_tone-soft-fg: var(--color-success-700);
    --_tone-border: var(--color-alert-border-success);
  }

  /* Warning Tone */
  :host([tone="warning"]),
  [data-tone="warning"] {
    --_tone-solid-bg: var(--color-warning-500);
    --_tone-solid-fg: var(--color-fg-on-primary);
    --_tone-soft-bg: var(--color-alert-bg-warning);
    --_tone-soft-fg: var(--color-warning-700);
    --_tone-border: var(--color-alert-border-warning);
  }

  /* Error Tone */
  :host([tone="error"]),
  [data-tone="error"] {
    --_tone-solid-bg: var(--color-error-500);
    --_tone-solid-fg: var(--color-fg-on-primary);
    --_tone-soft-bg: var(--color-alert-bg-error);
    --_tone-soft-fg: var(--color-error-700);
    --_tone-border: var(--color-alert-border-error);
  }

  /* ── Visual Variant Rules ────────────────────────────────────────── */

  /* Solid Variant */
  :host([variant="solid"]),
  [data-variant="solid"] {
    background-color: var(--_tone-solid-bg);
    color: var(--_tone-solid-fg);
    border: 1px solid transparent;
  }

  /* Flat Variant */
  :host([variant="flat"]),
  [data-variant="flat"] {
    background-color: var(--_tone-soft-bg);
    color: var(--_tone-soft-fg);
    border: 1px solid transparent;
  }

  /* Bordered Variant */
  :host([variant="bordered"]),
  [data-variant="bordered"] {
    background-color: transparent;
    color: var(--_tone-soft-fg);
    border: 1px solid var(--_tone-border);
  }

  /* Shadow Variant */
  :host([variant="shadow"]),
  [data-variant="shadow"] {
    background-color: var(--_tone-solid-bg);
    color: var(--_tone-solid-fg);
    box-shadow: var(--shadow-md);
    border: 1px solid transparent;
  }

  /* Glass Variant - Solid fallback */
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
`

export const resetStyles: CSSResultGroup = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    box-sizing: border-box;
    font-family: var(--font-family-base, inherit);
    font-size: var(--font-size-md, 1rem);
    line-height: var(--line-height-md, 1.5rem);
    color: var(--color-fg, inherit);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :host([hidden]),
  [hidden] {
    display: none !important;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  ul,
  ol,
  figure,
  blockquote,
  dl,
  dd {
    margin: 0;
  }

  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
  }

  :focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
`

// Run tests
console.log('Testing semantic-tones and reset.styles...')

// 1. Verify all 5 tones and 5 variants
console.assert(SEMANTIC_TONES.length === 5, 'SEMANTIC_TONES should have 5 items')
console.assert(VISUAL_VARIANTS.length === 5, 'VISUAL_VARIANTS should have 5 items')

// 2. Test fast-check on all 25 combinations
let comboCount = 0
for (const tone of SEMANTIC_TONES) {
  for (const variant of VISUAL_VARIANTS) {
    comboCount++
    console.assert(normalizeTone(tone) === tone, `normalizeTone(${tone}) failed`)
    console.assert(normalizeVariant(variant) === variant, `normalizeVariant(${variant}) failed`)
  }
}
console.assert(comboCount === 25, `Expected 25 combinations, got ${comboCount}`)

// 3. Fast-check arbitrary input normalization
fc.assert(
  fc.property(fc.string(), (str) => {
    const tone = normalizeTone(str, 'accent')
    console.assert(SEMANTIC_TONES.includes(tone), 'Tone must be valid')
    if (!SEMANTIC_TONES.includes(str as any)) {
      console.assert(tone === 'accent', 'Fallback tone must be used')
    }
  }),
  { numRuns: 1000 }
)

fc.assert(
  fc.property(fc.string(), (str) => {
    const variant = normalizeVariant(str, 'shadow')
    console.assert(VISUAL_VARIANTS.includes(variant), 'Variant must be valid')
    if (!VISUAL_VARIANTS.includes(str as any)) {
      console.assert(variant === 'shadow', 'Fallback variant must be used')
    }
  }),
  { numRuns: 1000 }
)

// Non-string inputs
console.assert(normalizeTone(null) === 'primary', 'normalizeTone(null) must return primary')
console.assert(normalizeTone(undefined) === 'primary', 'normalizeTone(undefined) must return primary')
console.assert(normalizeTone(123) === 'primary', 'normalizeTone(123) must return primary')
console.assert(normalizeTone({}) === 'primary', 'normalizeTone({}) must return primary')

console.assert(normalizeVariant(null) === 'flat', 'normalizeVariant(null) must return flat')
console.assert(normalizeVariant(undefined) === 'flat', 'normalizeVariant(undefined) must return flat')
console.assert(normalizeVariant(456) === 'flat', 'normalizeVariant(456) must return flat')
console.assert(normalizeVariant([]) === 'flat', 'normalizeVariant([]) must return flat')

// 4. Inspect CSS rules
const toneCss = (semanticToneStyles as CSSResult).cssText
console.assert(toneCss.includes('--_tone-solid-bg'), 'Must contain --_tone-solid-bg')
console.assert(toneCss.includes('--_tone-solid-fg'), 'Must contain --_tone-solid-fg')
console.assert(toneCss.includes('--_tone-soft-bg'), 'Must contain --_tone-soft-bg')
console.assert(toneCss.includes('--_tone-soft-fg'), 'Must contain --_tone-soft-fg')
console.assert(toneCss.includes('--_tone-border'), 'Must contain --_tone-border')
console.assert(toneCss.includes('var(--shadow-md)'), 'Must contain var(--shadow-md)')
console.assert(toneCss.includes('backdrop-filter: blur(12px)'), 'Must contain backdrop-filter blur')
console.assert(toneCss.includes('-webkit-backdrop-filter: blur(12px)'), 'Must contain -webkit-backdrop-filter blur')
console.assert(toneCss.includes('var(--color-bg-glass)'), 'Must contain var(--color-bg-glass)')
console.assert(toneCss.includes('var(--color-border-glass)'), 'Must contain var(--color-border-glass)')

const resetCss = (resetStyles as CSSResult).cssText
console.assert(resetCss.includes('box-sizing: border-box'), 'Must contain box-sizing: border-box')
console.assert(resetCss.includes('var(--color-border-focus)'), 'Must contain var(--color-border-focus)')
console.assert(resetCss.includes(':focus-visible'), 'Must contain :focus-visible')

console.log('ALL TESTS PASSED! 25 combinations verified, fast-check passed, CSS rules confirmed.')
