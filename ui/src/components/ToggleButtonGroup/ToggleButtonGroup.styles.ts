import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const toggleButtonGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      position: relative;
      box-sizing: border-box;
      background-color: var(--color-fill-track);
      border: none;
      border-radius: var(--radius-full, 9999px);
      padding: 3px;
      user-select: none;
      -webkit-user-select: none;
    }

    [part~="base"] {
      display: inline-flex;
      position: relative;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      gap: 0;
      isolation: isolate;
    }

    :host([orientation="vertical"]) {
      border-radius: var(--radius-md, 0.75rem);
    }

    /* Orientation */
    :host([orientation="horizontal"]),
    :host(:not([orientation])) {
      flex-direction: row;
    }

    :host([orientation="horizontal"]) [part~="base"],
    :host(:not([orientation])) [part~="base"] {
      flex-direction: row;
      align-items: center;
    }

    :host([orientation="vertical"]) {
      flex-direction: column;
    }

    :host([orientation="vertical"]) [part~="base"] {
      flex-direction: column;
      align-items: stretch;
    }

    /* Floating glass thumb that glides between segments */
    .active-indicator {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      border-radius: var(--radius-full, 9999px);
      background-color: light-dark(oklch(1 0 0), oklch(0.36 0 0));
      box-shadow:
        var(--glass-highlight),
        0 0 0 0.5px var(--glass-edge),
        0 3px 8px -2px light-dark(oklch(0 0 0 / 0.14), oklch(0 0 0 / 0.5));
      pointer-events: none;
      opacity: 0;
      transition:
        translate var(--duration-slow, 420ms) var(--ease-spring, ease),
        width var(--duration-slow, 420ms) var(--ease-spring, ease),
        height var(--duration-slow, 420ms) var(--ease-spring, ease),
        opacity var(--duration-fast, 140ms) ease;
    }

    :host([orientation="vertical"]) .active-indicator {
      border-radius: calc(var(--radius-md, 0.75rem) - 3px);
    }

    .active-indicator[data-visible] {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      .active-indicator {
        transition: none;
      }
    }

    ::slotted(moul-toggle-button) {
      position: relative;
    }

    /* Disabled state */
    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }
  `,
]
