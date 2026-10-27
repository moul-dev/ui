import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const popoverStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
      /* Grow out of the trigger edge */
      --_origin: top center;
    }

    :host([placement="top"]) {
      --_origin: bottom center;
    }

    :host([placement="left"]) {
      --_origin: center right;
    }

    :host([placement="right"]) {
      --_origin: center left;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-popover-anchor;
    }

    [part~="popover"] {
      margin: 0;
      padding: var(--spacing-4, 1rem);
      background-color: var(--color-bg-elevated);
      border: none;
      border-radius: var(--radius-surface, 1.5rem);
      box-shadow: var(--shadow-overlay);
      color: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      outline: none;
      position-anchor: --moul-popover-anchor;
      inset: auto;
      min-width: 8rem;
      max-width: 24rem;
      box-sizing: border-box;
      z-index: var(--z-popover, 1000);
      transform-origin: var(--_origin);
    }

    /* Native popover visibility */
    [part~="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="popover"]:popover-open,
    [part~="popover"].\:popover-open {
      display: block;
    }

    /* Enter/exit motion (fade + zoom) is driven by OverlayPresenceController on the panel. */
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
