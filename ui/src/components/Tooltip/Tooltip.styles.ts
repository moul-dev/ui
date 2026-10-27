import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tooltipStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
      /* Grow out of the trigger edge, nudged 4px toward it (default: top) */
      --_origin: bottom center;
    }

    :host([placement="bottom"]) {
      --_origin: top center;
    }

    :host([placement="left"]) {
      --_origin: center right;
    }

    :host([placement="right"]) {
      --_origin: center left;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-tooltip-anchor;
    }

    /* A light floating label: elevated fill and overlay shadow, not an inverted bubble */
    [part~="popover"],
    [part~="tooltip"] {
      margin: 0;
      padding: var(--spacing-2, 0.5rem);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      border: none;
      border-radius: min(2rem, var(--radius-xl, 0.75rem));
      box-shadow: var(--shadow-overlay);
      font-family: inherit;
      font-weight: var(--font-weight-normal, 400);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      z-index: var(--z-tooltip, 1500);
      pointer-events: none;
      position-anchor: --moul-tooltip-anchor;
      inset: auto;
      max-width: 20rem;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
      transform-origin: var(--_origin);
    }

    [part~="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="popover"]:popover-open,
    [part~="popover"].\:popover-open {
      display: block;
    }

    /* Enter/exit motion (fade + zoom) is driven by OverlayPresenceController on the panel. */
    @supports (anchor-name: --test) {
      :host([placement="top"]) [part~="popover"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: -50% 0;
        margin-bottom: 6px;
      }

      :host([placement="bottom"]) [part~="popover"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: -50% 0;
        margin-top: 6px;
      }

      :host([placement="left"]) [part~="popover"] {
        right: anchor(left);
        top: anchor(center);
        translate: 0 -50%;
        margin-right: 6px;
      }

      :host([placement="right"]) [part~="popover"] {
        left: anchor(right);
        top: anchor(center);
        translate: 0 -50%;
        margin-left: 6px;
      }
    }
  `,
]
