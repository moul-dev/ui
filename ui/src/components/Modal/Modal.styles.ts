import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const modalStyles = [
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

    [part="base"] {
      background-color: var(--color-bg-elevated, #ffffff);
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid var(--color-border, #e5e7eb);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
      box-sizing: border-box;
      margin: var(--spacing-4, 1rem);
    }

    :host([size="sm"]) [part="base"] {
      max-width: 24rem;
    }

    :host([size="md"]) [part="base"] {
      max-width: 32rem;
    }

    :host([size="lg"]) [part="base"] {
      max-width: 48rem;
    }

    :host([size="fullscreen"]) [part="base"] {
      max-width: 100vw;
      width: 100vw;
      height: 100vh;
      max-height: 100vh;
      border-radius: 0;
      border: none;
      margin: 0;
    }

    [part="header"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-fg, #111827);
      border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
    }

    [part="body"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      overflow-y: auto;
      flex: 1 1 auto;
      color: var(--color-fg, #111827);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    [part="footer"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-3, 0.75rem);
      border-top: 1px solid var(--color-border-subtle, #f3f4f6);
    }
  `,
]
