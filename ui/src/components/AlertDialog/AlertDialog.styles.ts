import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const alertDialogStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    /* Status icon chip colors, per tone (default tone is error) */
    :host,
    :host([tone="error"]) {
      --_icon-bg: var(--color-danger-soft);
      --_icon-fg: var(--color-danger-soft-fg);
    }

    :host([tone="primary"]),
    :host([tone="accent"]) {
      --_icon-bg: var(--color-accent-soft);
      --_icon-fg: var(--color-accent-soft-fg);
    }

    :host([tone="success"]) {
      --_icon-bg: var(--color-success-soft);
      --_icon-fg: var(--color-success-soft-fg);
    }

    :host([tone="warning"]) {
      --_icon-bg: var(--color-warning-soft);
      --_icon-fg: var(--color-warning-soft-fg);
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

    /* An <svg> slotted into the header becomes the tone-tinted status icon */
    ::slotted(svg[slot="header"]) {
      box-sizing: content-box;
      align-self: flex-start;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      padding: 0.625rem;
      border-radius: var(--radius-3xl, 1.5rem);
      background-color: var(--_icon-bg);
      color: var(--_icon-fg);
      user-select: none;
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

    ::slotted([slot="body"]) {
      margin: 0;
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
      animation: moul-alert-dialog-in 250ms var(--ease-out, ease-out);
    }

    :host(:not([is-open])) dialog[open] [part~="base"] {
      animation: moul-alert-dialog-out 100ms var(--ease-out, ease-out)
        forwards;
      pointer-events: none;
    }

    :host(:not([is-open])) dialog[open]::backdrop {
      animation: moul-alert-dialog-backdrop-out 100ms var(--ease-out, ease-out)
        forwards;
    }

    @keyframes moul-alert-dialog-in {
      from {
        opacity: 0;
        transform: scale(1.05);
      }
    }

    @keyframes moul-alert-dialog-out {
      to {
        opacity: 0;
        transform: scale(0.95);
      }
    }

    @keyframes moul-alert-dialog-backdrop-out {
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
