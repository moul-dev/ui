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

    /* HeroUI tooltip surface: elevated fill lifted by the overlay shadow, no border */
    [part~="container"],
    .tooltip-container {
      display: inline-flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem);
      background-color: var(--color-bg-elevated);
      border: none;
      border-radius: min(2rem, var(--radius-xl, 0.75rem));
      box-shadow: var(--shadow-overlay);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-fg);
      white-space: nowrap;
      pointer-events: none;
    }

    /*
     * Opt-in glass (variant="glass"): a hairline-edged solid elevated fallback,
     * frosted with a 12px blur where backdrop-filter is supported.
     */
    :host([variant="glass"]) [part~="container"],
    :host([variant="glass"]) .tooltip-container {
      border: 1px solid var(--color-border-subtle);
    }

    @supports (backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)) {
      :host([variant="glass"]) [part~="container"],
      :host([variant="glass"]) .tooltip-container {
        background-color: var(--color-bg-glass, oklch(1 0 0 / 0.64));
        border-color: var(--color-border-glass, oklch(0 0 0 / 0.08));
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
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
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
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      display: inline-block;
    }

    [part~="label"],
    .label {
      color: var(--color-muted);
    }

    [part~="value"],
    .value {
      color: var(--color-fg);
      font-weight: var(--font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
    }
  `,
]

export const styles = chartTooltipStyles
