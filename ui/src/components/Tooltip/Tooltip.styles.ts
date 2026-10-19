import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tooltipStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-tooltip-anchor;
    }

    [part~="popover"],
    [part~="tooltip"] {
      margin: 0;
      padding: 0.3125rem 0.625rem;
      background-color: light-dark(oklch(0.22 0 0 / 0.86), oklch(0.36 0 0 / 0.86));
      -webkit-backdrop-filter: blur(12px) saturate(160%);
      backdrop-filter: blur(12px) saturate(160%);
      color: oklch(1 0 0);
      border-radius: calc(0.5rem * var(--brand-radius-factor, 1));
      font-weight: var(--font-weight-medium, 500);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      box-shadow: inset 0 1px 0 oklch(1 0 0 / 0.12), var(--shadow-md);
      border: none;
      z-index: var(--z-tooltip, 2000);
      pointer-events: none;
      position-anchor: --moul-tooltip-anchor;
      inset: auto;
      max-width: 16rem;
      box-sizing: border-box;
      white-space: normal;
    }

    [part~="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="popover"]:popover-open,
    [part~="popover"].\:popover-open {
      display: block;
    }

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
