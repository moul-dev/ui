import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const alertDialogStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
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
      z-index: var(--z-modal, 1000);
      margin: 0;
    }

    dialog:not([open]) {
      display: none;
    }

    dialog::backdrop {
      background-color: var(--color-overlay, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(4px);
    }

    [part~="base"] {
      background-color: var(--color-bg-elevated, #ffffff);
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid var(--color-border, #e5e7eb);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      width: 100%;
      max-width: 28rem;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
      box-sizing: border-box;
      margin: var(--spacing-4, 1rem);
    }

    :host([size="sm"]) [part~="base"] {
      max-width: 24rem;
    }

    :host([size="md"]) [part~="base"] {
      max-width: 28rem;
    }

    :host([size="lg"]) [part~="base"] {
      max-width: 36rem;
    }

    [part~="header"] {
      padding: var(--spacing-6, 1.5rem) var(--spacing-6, 1.5rem) var(--spacing-2, 0.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-fg, #111827);
    }

    [part~="body"] {
      padding: var(--spacing-2, 0.5rem) var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg-subtle, #4b5563);
      overflow-y: auto;
    }

    [part~="footer"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem) var(--spacing-6, 1.5rem);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-3, 0.75rem);
    }
  `,
  overlayStyles,
]
