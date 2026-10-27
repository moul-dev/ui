/**
 * Moul UI - Semantic Tone & Visual Variant System
 * Implements 25 combinations of 5 Semantic Tones × 5 Visual Variants for Lit Web Components.
 */

import { type CSSResultGroup, css } from 'lit'

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

/**
 * Normalizes an unknown tone value to a valid SemanticTone.
 * Falls back to the provided fallback (default: 'primary') if unrecognized.
 */
export function normalizeTone(
  value: unknown,
  fallback: SemanticTone = 'primary',
): SemanticTone {
  return typeof value === 'string' &&
    (SEMANTIC_TONES as readonly string[]).includes(value)
    ? (value as SemanticTone)
    : fallback
}

/**
 * Normalizes an unknown variant value to a valid VisualVariant.
 * Falls back to the provided fallback (default: 'flat') if unrecognized.
 */
export function normalizeVariant(
  value: unknown,
  fallback: VisualVariant = 'flat',
): VisualVariant {
  return typeof value === 'string' &&
    (VISUAL_VARIANTS as readonly string[]).includes(value)
    ? (value as VisualVariant)
    : fallback
}

/**
 * Generates Lit CSS styles for all 25 combinations of 5 tones × 5 variants.
 * Defines tone-scoped properties (--_tone-solid-bg, --_tone-solid-fg, --_tone-soft-bg, --_tone-soft-fg, --_tone-border)
 * and combines them with variant rules (solid, flat, bordered, shadow, glass).
 */
export const semanticToneStyles: CSSResultGroup = css`
  /* ── Tone-Scoped CSS Custom Properties ─────────────────────────── */

  /* Default / Primary Tone */
  :host,
  :host([tone="primary"]),
  [data-tone="primary"] {
    --_tone-solid-bg: var(--color-accent);
    --_tone-solid-fg: var(--color-accent-fg);
    --_tone-soft-bg: var(--color-accent-soft);
    --_tone-soft-fg: var(--color-accent-soft-fg);
    --_tone-border: var(--color-alert-border-accent);
  }

  /* Accent Tone */
  :host([tone="accent"]),
  [data-tone="accent"] {
    --_tone-solid-bg: var(--color-primary-500);
    --_tone-solid-fg: var(--color-accent-fg);
    --_tone-soft-bg: var(--color-alert-bg-accent);
    --_tone-soft-fg: var(--color-primary-600);
    --_tone-border: var(--color-alert-border-accent);
  }

  /* Success Tone */
  :host([tone="success"]),
  [data-tone="success"] {
    --_tone-solid-bg: var(--color-success);
    --_tone-solid-fg: var(--color-success-fg);
    --_tone-soft-bg: var(--color-success-soft);
    --_tone-soft-fg: var(--color-success-soft-fg);
    --_tone-border: var(--color-alert-border-success);
  }

  /* Warning Tone */
  :host([tone="warning"]),
  [data-tone="warning"] {
    --_tone-solid-bg: var(--color-warning);
    --_tone-solid-fg: var(--color-warning-fg);
    --_tone-soft-bg: var(--color-warning-soft);
    --_tone-soft-fg: var(--color-warning-soft-fg);
    --_tone-border: var(--color-alert-border-warning);
  }

  /* Error Tone */
  :host([tone="error"]),
  [data-tone="error"] {
    --_tone-solid-bg: var(--color-danger);
    --_tone-solid-fg: var(--color-danger-fg);
    --_tone-soft-bg: var(--color-danger-soft);
    --_tone-soft-fg: var(--color-danger-soft-fg);
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

  /* Flat Variant - soft tint of the tone */
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

  /* Shadow Variant - solid fill with a glow in its own color */
  :host([variant="shadow"]),
  [data-variant="shadow"] {
    background-color: var(--_tone-solid-bg);
    color: var(--_tone-solid-fg);
    box-shadow:
      0 6px 16px -4px color-mix(in oklab, var(--_tone-solid-bg) 45%, transparent),
      var(--shadow-md);
    border: 1px solid transparent;
  }

  /* Glass Variant - Liquid glass material: tinted translucent fill, rim light, soft depth */
  :host([variant="glass"]),
  [data-variant="glass"] {
    background-color: color-mix(in oklch, var(--_tone-soft-bg) 45%, var(--glass-bg-thick));
    border: 1px solid var(--color-border-glass);
    color: var(--_tone-soft-fg);
    box-shadow: var(--glass-highlight), var(--shadow-glass);
  }

  /* Progressive enhancement: frost what's behind once backdrop-filter is available */
  @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
    :host([variant="glass"]),
    [data-variant="glass"] {
      background-color: color-mix(in oklch, var(--_tone-soft-bg) 40%, var(--color-bg-glass));
      -webkit-backdrop-filter: var(--glass-filter);
      backdrop-filter: var(--glass-filter);
    }
  }
`
