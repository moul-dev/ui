import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const popoverStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
    }

    [part="trigger"] {
      display: inline-block;
      anchor-name: --moul-popover-anchor;
    }

    [part="popover"] {
      margin: 0;
      padding: var(--spacing-4, 1rem);
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1));
      color: var(--color-fg, #111827);
      outline: none;
      position-anchor: --moul-popover-anchor;
      inset: auto;
      min-width: 8rem;
      max-width: 24rem;
      box-sizing: border-box;
      z-index: var(--z-popover, 1000);
    }

    /* Native popover visibility */
    [part="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part="popover"]:popover-open,
    [part="popover"].\:popover-open {
      display: block;
    }

    /* Anchor positioning styles */
    @supports (anchor-name: --test) {
      :host([placement="bottom"]) [part="popover"] {
        top: anchor(bottom);
        left: anchor(center);
        transform: translateX(-50%);
        margin-top: var(--_offset, 8px);
      }

      :host([placement="top"]) [part="popover"] {
        bottom: anchor(top);
        left: anchor(center);
        transform: translateX(-50%);
        margin-bottom: var(--_offset, 8px);
      }

      :host([placement="left"]) [part="popover"] {
        right: anchor(left);
        top: anchor(center);
        transform: translateY(-50%);
        margin-right: var(--_offset, 8px);
      }

      :host([placement="right"]) [part="popover"] {
        left: anchor(right);
        top: anchor(center);
        transform: translateY(-50%);
        margin-left: var(--_offset, 8px);
      }
    }
  `,
]
