import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartTooltipStyles = [
  resetStyles,
  css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      z-index: var(--z-tooltip, 1500);
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      color: var(--color-fg, inherit);
      pointer-events: none;
      user-select: none;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
    }

    :host(:not([is-open])) {
      display: none;
    }

    :host([is-open]) {
      display: block;
    }

    :host(:not(:popover-open):not(.\:popover-open)):not([is-open]) {
      display: none;
    }

    :host(:popover-open),
    :host(.\:popover-open) {
      display: block;
    }

    [part~="container"],
    .tooltip-container {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      background-color: var(--color-bg-elevated, #ffffff);
      border: 1px solid var(--color-border-subtle, rgba(0, 0, 0, 0.1));
      border-radius: var(--radius-md, 0.5rem);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg, #111827);
      white-space: nowrap;
      pointer-events: none;
    }

    /* Glass progressive enhancement with 12px blur */
    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
      [part~="container"],
      .tooltip-container {
        background-color: var(--color-bg-glass, rgba(255, 255, 255, 0.75));
        border-color: var(--color-border-glass, rgba(0, 0, 0, 0.1));
        -webkit-backdrop-filter: blur(12px);
        backdrop-filter: blur(12px);
      }
    }

    [part~="header"],
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~="title"],
    .tooltip-title {
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, #111827);
    }

    /* Multi-series list & item layout */
    [part~="list"],
    .tooltip-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    [part~="item"],
    .tooltip-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
    }

    .tooltip-item-series {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~="indicator"],
    .indicator {
      width: 8px;
      height: 8px;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      display: inline-block;
    }

    [part~="label"],
    .label {
      color: var(--color-fg-subtle, #6b7280);
      font-weight: var(--font-weight-medium, 500);
    }

    [part~="value"],
    .value {
      color: var(--color-fg, #111827);
      font-weight: var(--font-weight-semibold, 600);
    }
  `,
]

export const styles = chartTooltipStyles
