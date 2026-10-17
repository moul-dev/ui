import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const buttonGroupStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      position: relative;
      box-sizing: border-box;
    }

    [part="base"] {
      display: inline-flex;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
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

    /* Spacing */
    :host([spacing="none"]) [part="base"] {
      gap: 0;
    }

    :host([spacing="sm"]) [part="base"],
    :host(:not([spacing])) [part="base"] {
      gap: var(--spacing-1, 0.25rem);
    }

    :host([spacing="md"]) [part="base"] {
      gap: var(--spacing-2, 0.5rem);
    }

    /* Border radius collapse when spacing="none" */
    /* Horizontal collapse */
    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:not(:first-child):not(:last-child)),
    :host([spacing="none"][orientation="horizontal"]) ::slotted(*:not(:first-child):not(:last-child)) {
      border-radius: 0 !important;
      margin-inline-start: -1px;
    }

    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:first-child:not(:last-child)),
    :host([spacing="none"][orientation="horizontal"]) ::slotted(*:first-child:not(:last-child)) {
      border-top-right-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
    }

    :host([spacing="none"]:not([orientation="vertical"])) ::slotted(*:last-child:not(:first-child)),
    :host([spacing="none"][orientation="horizontal"]) ::slotted(*:last-child:not(:first-child)) {
      border-top-left-radius: 0 !important;
      border-bottom-left-radius: 0 !important;
      margin-inline-start: -1px;
    }

    /* Vertical collapse */
    :host([spacing="none"][orientation="vertical"]) ::slotted(*:not(:first-child):not(:last-child)) {
      border-radius: 0 !important;
      margin-block-start: -1px;
    }

    :host([spacing="none"][orientation="vertical"]) ::slotted(*:first-child:not(:last-child)) {
      border-bottom-left-radius: 0 !important;
      border-bottom-right-radius: 0 !important;
    }

    :host([spacing="none"][orientation="vertical"]) ::slotted(*:last-child:not(:first-child)) {
      border-top-left-radius: 0 !important;
      border-top-right-radius: 0 !important;
      margin-block-start: -1px;
    }

    /* Disabled state */
    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
  `,
]
