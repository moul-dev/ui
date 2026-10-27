/**
 * Moul UI - Shared overlay surface
 * Panel and backdrop for every <dialog>-based overlay (modal, alert dialog,
 * drawer, command palette), after HeroUI: an opaque scrim and a solid overlay
 * panel with large rounded corners and a soft layered shadow. Appended after
 * component styles so it refines rather than replaces their layout rules.
 */
import { type CSSResultGroup, css } from 'lit'

export const overlayStyles: CSSResultGroup = css`
  dialog::backdrop {
    background-color: var(--color-overlay);
  }

  dialog[open]::backdrop {
    animation: moul-backdrop-in var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  @keyframes moul-backdrop-in {
    from {
      opacity: 0;
    }
  }

  [part~='base'] {
    border: none;
    border-radius: var(--radius-surface, 1.5rem);
    background-color: var(--color-bg-elevated);
    box-shadow: var(--shadow-overlay);
    color: var(--color-fg);
  }

  @media (prefers-reduced-motion: reduce) {
    dialog[open]::backdrop {
      animation: none;
    }
  }
`

export default overlayStyles
