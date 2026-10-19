import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const popoverStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-popover-anchor;
    }

    [part~="popover"] {
      margin: 0;
      padding: var(--spacing-4, 1rem);
      background-color: var(--glass-bg-thick, #ffffff);
      -webkit-backdrop-filter: var(--glass-filter);
      backdrop-filter: var(--glass-filter);
      border: none;
      border-radius: calc(1rem * var(--brand-radius-factor, 1));
      box-shadow: var(--glass-highlight), var(--shadow-glass);
      color: var(--color-fg, #111827);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      outline: none;
      position-anchor: --moul-popover-anchor;
      inset: auto;
      min-width: 8rem;
      max-width: 24rem;
      box-sizing: border-box;
      z-index: var(--z-popover, 1000);
    }

    /* Native popover visibility */
    [part~="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="popover"]:popover-open,
    [part~="popover"].\:popover-open {
      display: block;
    }

    /* Anchor positioning styles */
    @supports (anchor-name: --test) {
      :host([placement="bottom"]) [part~="popover"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: -50% 0;
        margin-top: var(--_offset, 8px);
      }

      :host([placement="top"]) [part~="popover"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: -50% 0;
        margin-bottom: var(--_offset, 8px);
      }

      :host([placement="left"]) [part~="popover"] {
        right: anchor(left);
        top: anchor(center);
        translate: 0 -50%;
        margin-right: var(--_offset, 8px);
      }

      :host([placement="right"]) [part~="popover"] {
        left: anchor(right);
        top: anchor(center);
        translate: 0 -50%;
        margin-left: var(--_offset, 8px);
      }
    }
  `,
]
