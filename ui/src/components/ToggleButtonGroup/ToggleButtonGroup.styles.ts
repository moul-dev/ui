import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const toggleButtonGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      box-sizing: border-box;
      border-radius: var(--radius-3xl, 1.5rem);
      user-select: none;
      -webkit-user-select: none;
    }

    /*
     * Attached buttons read as one pill: the base carries the neutral fill and
     * clips the outer ends, so the sliding indicator picks up the end radius.
     */
    [part~="base"] {
      display: inline-flex;
      position: relative;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      gap: 0;
      border-radius: inherit;
      background-color: var(--color-default);
      overflow: hidden;
      isolation: isolate;
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

    /* Selected tint: accent-soft composited over the surface, gliding between items */
    .active-indicator {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      background-color: var(--color-surface);
      background-image: linear-gradient(var(--color-accent-soft), var(--color-accent-soft));
      pointer-events: none;
      opacity: 0;
      transition:
        translate 250ms var(--ease-out-fluid, ease-out),
        width 250ms var(--ease-out-fluid, ease-out),
        height 250ms var(--ease-out-fluid, ease-out),
        opacity var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    .active-indicator[data-visible] {
      opacity: 1;
    }

    /* Inner corners square off; the outer ends match the group pill */
    ::slotted(*) {
      position: relative;
      border-radius: 0;
    }

    :host(:not([orientation="vertical"])) ::slotted(:first-child) {
      border-start-start-radius: var(--radius-3xl, 1.5rem);
      border-end-start-radius: var(--radius-3xl, 1.5rem);
    }

    :host(:not([orientation="vertical"])) ::slotted(:last-child) {
      border-start-end-radius: var(--radius-3xl, 1.5rem);
      border-end-end-radius: var(--radius-3xl, 1.5rem);
    }

    :host([orientation="vertical"]) ::slotted(:first-child) {
      border-start-start-radius: var(--radius-3xl, 1.5rem);
      border-start-end-radius: var(--radius-3xl, 1.5rem);
    }

    :host([orientation="vertical"]) ::slotted(:last-child) {
      border-end-start-radius: var(--radius-3xl, 1.5rem);
      border-end-end-radius: var(--radius-3xl, 1.5rem);
    }

    /* Separators: 1px over the middle half of each inner edge, at 15% of the item's text color */
    :host(:not([orientation="vertical"])) ::slotted(:not(:first-child)) {
      border-inline-start: 1px solid transparent;
      border-image: linear-gradient(
          transparent 25%,
          color-mix(in oklab, var(--_fg, currentColor) 15%, transparent) 25% 75%,
          transparent 75%
        )
        1;
    }

    :host([orientation="vertical"]) ::slotted(:not(:first-child)) {
      border-block-start: 1px solid transparent;
      border-image: linear-gradient(
          to right,
          transparent 25%,
          color-mix(in oklab, var(--_fg, currentColor) 15%, transparent) 25% 75%,
          transparent 75%
        )
        1;
    }

    /* Disabled state: items dim themselves, so only fade the group's own paint */
    :host([is-disabled]) {
      pointer-events: none;
      cursor: not-allowed;
    }

    :host([is-disabled]) [part~="base"] {
      background-color: color-mix(in oklab, var(--color-default) 50%, transparent);
    }

    :host([is-disabled]) .active-indicator[data-visible] {
      opacity: var(--disabled-opacity, 0.5);
    }

    @media (prefers-reduced-motion: reduce) {
      .active-indicator {
        transition: none;
      }
    }
  `,
]
