import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const areaChartStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      position: relative;
      user-select: none;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
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
      stroke: var(--color-border-subtle, oklch(0.84 0 0));
      stroke-dasharray: 3 3;
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-label {
      fill: var(--color-fg-subtle, oklch(0.42 0 0));
      font-size: var(--font-size-xs, 0.75rem);
      font-family: var(--font-family-base, inherit);
    }

    .axis-label-x {
      text-anchor: middle;
      dominant-baseline: hanging;
    }

    .axis-label-y {
      text-anchor: end;
      dominant-baseline: central;
    }

    .area-path,
    .chart-area {
      pointer-events: none;
    }

    .stroke-path,
    .area-stroke,
    .chart-line {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: none;
    }

    .point-marker {
      stroke: var(--color-bg, #ffffff);
      stroke-width: 2;
      cursor: pointer;
      transition: r 150ms ease, transform 150ms ease;
    }

    .point-marker:hover {
      r: 6;
    }

    [part~="empty"],
    .empty-state {
      display: flex;
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

export const styles = areaChartStyles
export default areaChartStyles
