import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { chartScrubStyles } from '../ChartScrub'

export const lineChartStyles = [
  resetStyles,
  chartScrubStyles,
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

    .chart-frame {
      position: relative;
      width: 100%;
    }

    .chart-container {
      position: relative;
      width: 100%;
      height: 100%;
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

    /* Live mode: the newest point pulses, and a small button pauses the feed. */
    .live-head {
      pointer-events: none;
    }

    .live-halo {
      pointer-events: none;
      opacity: 0.25;
      transform-box: fill-box;
      transform-origin: center;
      animation: live-pulse 1.6s var(--ease-out, ease-out) infinite;
    }

    @keyframes live-pulse {
      0% {
        transform: scale(0.5);
        opacity: 0.45;
      }
      100% {
        transform: scale(1.6);
        opacity: 0;
      }
    }

    .live-toggle {
      position: absolute;
      top: var(--spacing-1, 0.25rem);
      right: var(--spacing-1, 0.25rem);
      display: grid;
      place-items: center;
      width: 1.75rem;
      height: 1.75rem;
      padding: 0;
      border: 1px solid var(--color-border, currentColor);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-surface, transparent);
      color: var(--color-fg-subtle, currentColor);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    .live-toggle:hover {
      background: var(--color-surface-hover, transparent);
      color: var(--color-fg, currentColor);
    }

    .live-toggle:focus-visible {
      outline: 2px solid var(--color-focus, currentColor);
      outline-offset: 2px;
    }

    .live-toggle[aria-pressed='true'] {
      color: var(--color-accent, currentColor);
    }

    .live-toggle svg {
      width: 0.875rem;
      height: 0.875rem;
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
      .point-marker,
      .live-toggle {
        transition: none;
      }

      .live-halo {
        animation: none;
        opacity: 0;
      }
    }
  `,
]

export const styles = lineChartStyles
export default lineChartStyles
