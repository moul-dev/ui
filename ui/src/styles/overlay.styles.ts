/**
 * Moul UI - Shared overlay surface
 * Liquid-glass panel and frosted backdrop for every <dialog>-based overlay
 * (modal, alert dialog, drawer, command palette). Appended after component
 * styles so it refines rather than replaces their layout rules.
 */
import { type CSSResultGroup, css } from 'lit'

export const overlayStyles: CSSResultGroup = css`
  dialog::backdrop {
    background-color: light-dark(oklch(0.22 0 0 / 0.2), oklch(0 0 0 / 0.5));
    -webkit-backdrop-filter: blur(10px) saturate(140%);
    backdrop-filter: blur(10px) saturate(140%);
  }

  dialog[open]::backdrop {
    animation: moul-backdrop-in var(--duration-base, 240ms) var(--ease-out, ease-out);
  }

  @keyframes moul-backdrop-in {
    from {
      opacity: 0;
    }
  }

  [part~='base'] {
    border: none;
    border-radius: calc(1.5rem * var(--brand-radius-factor, 1));
    background-color: var(--glass-bg-thick);
    -webkit-backdrop-filter: var(--glass-filter);
    backdrop-filter: var(--glass-filter);
    box-shadow: var(--glass-highlight), var(--shadow-glass), var(--shadow-lg);
    color: var(--color-fg);
  }

  @media (prefers-reduced-motion: reduce) {
    dialog[open]::backdrop {
      animation: none;
    }
  }
`

export default overlayStyles
