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
      stroke: var(--color-separator, oklch(0.92 0.004 286.32));
      stroke-dasharray: 3 3;
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .axis-label {
      fill: var(--color-muted, oklch(0.55 0.014 285.94));
      font-size: var(--font-size-xs, 0.75rem);
      font-family: var(--font-family-base, inherit);
      font-variant-numeric: tabular-nums;
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

    /* Charts usually sit on a card, so the dot ring matches the surface. */
    .point-marker {
      stroke: var(--color-surface, #ffffff);
      stroke-width: 2;
      cursor: pointer;
      transition:
        r 150ms var(--ease-out, ease-out),
        transform 150ms var(--ease-out, ease-out);
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
      .point-marker {
        transition: none;
      }
    }
  `,
]

export const styles = areaChartStyles
export default areaChartStyles
