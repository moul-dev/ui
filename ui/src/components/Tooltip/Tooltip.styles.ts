import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tooltipStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
    }

    [part="trigger"] {
      display: inline-block;
      anchor-name: --moul-tooltip-anchor;
    }

    [part="popover"],
    [part="tooltip"] {
      margin: 0;
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      background-color: var(--color-bg-elevated, #1f2937);
      color: var(--color-fg-on-primary, #ffffff);
      border-radius: var(--radius-sm, 0.25rem);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05));
      border: 1px solid var(--color-border-subtle, #374151);
      z-index: var(--z-tooltip, 2000);
      pointer-events: none;
      position-anchor: --moul-tooltip-anchor;
      inset: auto;
      max-width: 16rem;
      box-sizing: border-box;
      white-space: normal;
    }

    [part="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part="popover"]:popover-open,
    [part="popover"].\:popover-open {
      display: block;
    }

    @supports (anchor-name: --test) {
      :host([placement="top"]) [part="popover"] {
        bottom: anchor(top);
        left: anchor(center);
        transform: translateX(-50%);
        margin-bottom: 6px;
      }

      :host([placement="bottom"]) [part="popover"] {
        top: anchor(bottom);
        left: anchor(center);
        transform: translateX(-50%);
        margin-top: 6px;
      }

      :host([placement="left"]) [part="popover"] {
        right: anchor(left);
        top: anchor(center);
        transform: translateY(-50%);
        margin-right: 6px;
      }

      :host([placement="right"]) [part="popover"] {
        left: anchor(right);
        top: anchor(center);
        transform: translateY(-50%);
        margin-left: 6px;
      }
    }
  `,
]
