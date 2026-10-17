import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const toggleButtonGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      position: relative;
      box-sizing: border-box;
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
      border: 1px solid var(--color-border, oklch(0.85 0.01 250));
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--spacing-1, 0.25rem);
      user-select: none;
      -webkit-user-select: none;
    }

    [part="base"] {
      display: inline-flex;
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      gap: var(--spacing-1, 0.25rem);
    }

    /* Orientation */
    :host([orientation="horizontal"]),
    :host(:not([orientation])) {
      flex-direction: row;
    }

    :host([orientation="horizontal"]) [part="base"],
    :host(:not([orientation])) [part="base"] {
      flex-direction: row;
      align-items: center;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
    }

    :host([orientation="vertical"]) [part="base"] {
      flex-direction: column;
      align-items: stretch;
    }

    /* Active selection indicator pill */
    .active-indicator {
      position: absolute;
      top: 0;
      left: 0;
      border-radius: var(--radius-sm, 0.375rem);
      background-color: var(--color-bg-elevated, #ffffff);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      pointer-events: none;
      z-index: 0;
      display: none;
    }

    .active-indicator.is-visible {
      display: block;
    }

    ::slotted(moul-toggle-button) {
      position: relative;
      z-index: 1;
    }

    /* Disabled state */
    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }
  `,
]
