import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const modalStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    /* Full-viewport positioning layer; the panel is centred inside its padding */
    dialog {
      padding: var(--spacing-4, 1rem);
      border: none;
      background: transparent;
      overflow: visible;
      color: inherit;
      max-width: none;
      max-height: none;
      width: 100%;
      height: 100%;
      inset: 0;
      position: fixed;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal, 1300);
      margin: 0;
    }

    @media (min-width: 640px) {
      dialog {
        padding: 2.5rem;
      }
    }

    dialog:not([open]) {
      display: none;
    }

    /* Panel surface (fill, radius, shadow) comes from the shared overlay styles */
    [part~="base"] {
      position: relative;
      width: 100%;
      max-width: 28rem;
      max-height: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: var(--spacing-6, 1.5rem);
      overflow: hidden;
      outline: none;
      --_enter-scale: 1.05;
    }

    :host([size="sm"]) [part~="base"] {
      max-width: 24rem;
    }

    :host([size="md"]) [part~="base"] {
      max-width: 28rem;
    }

    :host([size="lg"]) [part~="base"] {
      max-width: 32rem;
    }

    :host([size="fullscreen"]) dialog {
      padding: 0;
    }

    :host([size="fullscreen"]) [part~="base"] {
      max-width: none;
      width: 100%;
      height: 100%;
      border-radius: 0;
      box-shadow: none;
      --_enter-scale: 1;
    }

    [part~="header"] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      margin-bottom: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
    }

    /* Headings slotted into the header take its type instead of UA heading styles */
    ::slotted([slot="header"]) {
      margin: 0;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
    }

    [part~="body"] {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      /* Room for focus rings of controls inside the scroll area */
      margin-inline: -3px;
      padding: 3px;
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="footer"] {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-2, 0.5rem);
      margin-top: var(--spacing-5, 1.25rem);
    }

    /* Collapse sections with nothing slotted, where :has-slotted is supported */
    [part~="header"]:not(:has(> slot:has-slotted)),
    [part~="footer"]:not(:has(> slot:has-slotted)) {
      display: none;
    }

    /* Enter: fade + settle from 1.05; exit while closing: fade + shrink to .95 */
    dialog[open] [part~="base"] {
      animation: moul-modal-in 250ms var(--ease-out-quad, ease-out);
    }

    :host(:not([is-open])) dialog[open] [part~="base"] {
      animation: moul-modal-out 100ms var(--ease-out-quad, ease-out) forwards;
      pointer-events: none;
    }

    :host(:not([is-open])) dialog[open]::backdrop {
      animation: moul-modal-backdrop-out 100ms var(--ease-out, ease-out) forwards;
    }

    @keyframes moul-modal-in {
      from {
        opacity: 0;
        transform: scale(var(--_enter-scale, 1.05));
      }
    }

    @keyframes moul-modal-out {
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    @keyframes moul-modal-backdrop-out {
      to {
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      dialog[open] [part~="base"],
      :host(:not([is-open])) dialog[open] [part~="base"],
      :host(:not([is-open])) dialog[open]::backdrop {
        animation: none;
      }
    }
  `,
  overlayStyles,
]
