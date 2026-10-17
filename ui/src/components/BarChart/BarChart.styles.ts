import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const barChartStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      overflow: hidden;
    }

    .chart-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--color-border-subtle, #e5e7eb);
      stroke-dasharray: 3 3;
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-line {
      stroke: var(--color-border-subtle, #e5e7eb);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-tick {
      fill: var(--color-fg-subtle, #6b7280);
      font-size: 11px;
      font-family: var(--font-family-base, inherit);
      user-select: none;
    }

    .chart-bar {
      cursor: pointer;
      transition: opacity 0.15s ease, filter 0.15s ease;
    }

    .chart-bar:hover,
    .chart-bar.is-active {
      filter: brightness(1.1);
      opacity: 0.9;
    }

    [part="empty"],
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      min-height: 200px;
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }
  `,
]

export const styles = barChartStyles
export default barChartStyles
