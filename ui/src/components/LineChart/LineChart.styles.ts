import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const lineChartStyles = [
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

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .grid-line {
      stroke: var(--color-separator, oklch(0.92 0.004 286.32));
      stroke-dasharray: 3 3;
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-line {
      stroke: var(--color-border, oklch(0.9 0.004 286.32));
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-tick {
      fill: var(--color-muted, oklch(0.55 0.014 285.94));
      font-size: var(--font-size-xs, 0.75rem);
      font-family: var(--font-family-base, inherit);
      font-variant-numeric: tabular-nums;
      user-select: none;
    }

    .series-path,
    .line-path,
    .chart-line {
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
      pointer-events: stroke;
      transition: stroke-width var(--duration-fast, 150ms)
        var(--ease-out, ease-out);
    }

    /* Hollow dots filled with the card surface the chart usually sits on. */
    .point-marker {
      fill: var(--color-surface, #ffffff);
      cursor: pointer;
      transform-origin: center;
      transition: r var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .point-marker:hover,
    .point-marker.is-active {
      r: 6;
    }

    [part~="empty"],
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 200px;
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .series-path,
      .line-path,
      .chart-line,
      .point-marker {
        transition: none;
      }
    }
  `,
]

export const styles = lineChartStyles
export default lineChartStyles
