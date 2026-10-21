import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const buttonGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      box-sizing: border-box;
    }

    [part~="base"] {
      display: inline-flex;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
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

    /* Spacing */
    :host([spacing="none"]) [part~="base"] {
      gap: 0;
    }

    :host([spacing="sm"]) [part~="base"],
    :host(:not([spacing])) [part~="base"] {
      gap: var(--spacing-1, 0.25rem);
    }

    :host([spacing="md"]) [part~="base"] {
      gap: var(--spacing-2, 0.5rem);
    }

    /*
     * Attached group (spacing="none"): the buttons read as one pill, rounded
     * only at the outer ends. Buttons keep their own radius-3xl at the ends;
     * inner corners are squared off and 1px borders overlap.
     */
    :host([spacing="none"]) ::slotted(*) {
      /* No press scale inside an attached group */
      --_press-scale: 1;
    }

    /* Raise the focused button so its offset ring paints over its neighbors */
    :host([spacing="none"]) ::slotted(:focus-within) {
      z-index: 1;
    }

    /* Horizontal collapse */
    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:not(:first-child):not(:last-child)) {
      border-radius: 0 !important;
      margin-inline-start: -1px;
    }

    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:first-child:not(:last-child)) {
      border-start-end-radius: 0 !important;
      border-end-end-radius: 0 !important;
    }

    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:last-child:not(:first-child)) {
      border-start-start-radius: 0 !important;
      border-end-start-radius: 0 !important;
      margin-inline-start: -1px;
    }

    /* Vertical collapse */
    :host([spacing="none"][orientation="vertical"]) ::slotted(*:not(:first-child):not(:last-child)) {
      border-radius: 0 !important;
      margin-block-start: -1px;
    }

    :host([spacing="none"][orientation="vertical"]) ::slotted(*:first-child:not(:last-child)) {
      border-end-start-radius: 0 !important;
      border-end-end-radius: 0 !important;
    }

    :host([spacing="none"][orientation="vertical"]) ::slotted(*:last-child:not(:first-child)) {
      border-start-start-radius: 0 !important;
      border-start-end-radius: 0 !important;
      margin-block-start: -1px;
    }

    /*
     * Separators: a 1px divider over the middle half of each inner edge, in the
     * button's own foreground at 15%. It sits in the 1px overlap with the previous
     * button; outline buttons skip it since their collapsed border divides them.
     */
    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(:not(:first-child):not([variant="outline"])) {
      border-inline-start: 1px solid transparent;
      border-image: linear-gradient(
          transparent 25%,
          color-mix(in oklab, var(--_fg, currentColor) 15%, transparent) 25% 75%,
          transparent 75%
        )
        1;
    }

    :host([spacing="none"][orientation="vertical"]) ::slotted(:not(:first-child):not([variant="outline"])) {
      border-block-start: 1px solid transparent;
      border-image: linear-gradient(
          to right,
          transparent 25%,
          color-mix(in oklab, var(--_fg, currentColor) 15%, transparent) 25% 75%,
          transparent 75%
        )
        1;
    }

    /* Disabled state: moul buttons dim themselves; dim anything else here */
    :host([is-disabled]) {
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) ::slotted(:not(moul-button):not(moul-toggle-button)) {
      opacity: var(--disabled-opacity, 0.5);
    }
  `,
]
