import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const drawerStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    dialog {
      padding: 0;
      border: none;
      background: transparent;
      overflow: hidden;
      margin: 0;
      width: 100vw;
      height: 100vh;
      max-width: 100vw;
      max-height: 100vh;
      position: fixed;
      inset: 0;
      display: flex;
      z-index: var(--z-modal, 1000);
    }

    dialog:not([open]) {
      display: none;
    }

    dialog::backdrop {
      background-color: var(--color-overlay, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(4px);
    }

    :host([placement="right"]) dialog {
      justify-content: flex-end;
      align-items: stretch;
    }

    :host([placement="left"]) dialog {
      justify-content: flex-start;
      align-items: stretch;
    }

    :host([placement="top"]) dialog {
      justify-content: stretch;
      align-items: flex-start;
    }

    :host([placement="bottom"]) dialog {
      justify-content: stretch;
      align-items: flex-end;
    }

    [part~="base"] {
      background-color: var(--color-bg-elevated, #ffffff);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
      box-sizing: border-box;
      color: var(--color-fg, #111827);
    }

    /* Horizontal placements (left & right) */
    :host([placement="left"]) [part~="base"],
    :host([placement="right"]) [part~="base"] {
      height: 100%;
      max-width: 100vw;
    }

    :host([placement="left"][size="sm"]) [part~="base"],
    :host([placement="right"][size="sm"]) [part~="base"] {
      width: 20rem;
    }

    :host([placement="left"][size="md"]) [part~="base"],
    :host([placement="right"][size="md"]) [part~="base"] {
      width: 28rem;
    }

    :host([placement="left"][size="lg"]) [part~="base"],
    :host([placement="right"][size="lg"]) [part~="base"] {
      width: 36rem;
    }

    /* Vertical placements (top & bottom) */
    :host([placement="top"]) [part~="base"],
    :host([placement="bottom"]) [part~="base"] {
      width: 100%;
      max-height: 90vh;
    }

    :host([placement="top"][size="sm"]) [part~="base"],
    :host([placement="bottom"][size="sm"]) [part~="base"] {
      height: 16rem;
    }

    :host([placement="top"][size="md"]) [part~="base"],
    :host([placement="bottom"][size="md"]) [part~="base"] {
      height: 24rem;
    }

    :host([placement="top"][size="lg"]) [part~="base"],
    :host([placement="bottom"][size="lg"]) [part~="base"] {
      height: 32rem;
    }

    [part~="header"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-fg, #111827);
      border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    [part~="body"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      overflow-y: auto;
      flex: 1 1 auto;
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
    }

    [part~="footer"] {
      padding: var(--spacing-4, 1rem) var(--spacing-6, 1.5rem);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-3, 0.75rem);
      border-top: 1px solid var(--color-border-subtle, #f3f4f6);
      flex-shrink: 0;
    }
  `,
  overlayStyles,
  css`
    /* Edge-attached sheet: round only the corners facing the content */
    :host([placement="right"]) [part~="base"] {
      border-radius: calc(1.5rem * var(--brand-radius-factor, 1)) 0 0 calc(1.5rem * var(--brand-radius-factor, 1));
    }
    :host([placement="left"]) [part~="base"] {
      border-radius: 0 calc(1.5rem * var(--brand-radius-factor, 1)) calc(1.5rem * var(--brand-radius-factor, 1)) 0;
    }
    :host([placement="top"]) [part~="base"] {
      border-radius: 0 0 calc(1.5rem * var(--brand-radius-factor, 1)) calc(1.5rem * var(--brand-radius-factor, 1));
    }
    :host([placement="bottom"]) [part~="base"] {
      border-radius: calc(1.5rem * var(--brand-radius-factor, 1)) calc(1.5rem * var(--brand-radius-factor, 1)) 0 0;
      position: relative;
      padding-top: 0.75rem;
    }
    /* iOS sheet grabber */
    :host([placement="bottom"]) [part~="base"]::before {
      content: "";
      position: absolute;
      top: 0.5rem;
      left: 50%;
      width: 2.25rem;
      height: 0.3125rem;
      translate: -50% 0;
      border-radius: 9999px;
      background-color: var(--color-fill-track-strong);
    }
  `,
]
