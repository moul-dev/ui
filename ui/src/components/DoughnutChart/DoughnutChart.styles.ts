import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const doughnutChartStyles: CSSResultGroup = [
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

    .chart-wrapper {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chart-svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    /* Slice gaps are painted in the card surface the chart usually sits on. */
    .slice {
      stroke: var(--color-surface, #ffffff);
      cursor: pointer;
      outline: none;
      transition: opacity var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    .slice:hover,
    .slice.is-active {
      opacity: 0.85;
    }

    .slice:focus-visible {
      outline: 2px solid var(--color-focus, #3b82f6);
      outline-offset: 2px;
    }

    /* Empty ring reads as an unfilled track, like HeroUI progress/meter. */
    .empty-track {
      stroke: var(--color-default, oklch(0.94 0.001 286.375));
      pointer-events: none;
    }

    .center-container {
      position: absolute;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 50%;
      box-sizing: border-box;
      padding: var(--spacing-2, 0.5rem);
    }

    .center-labels {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
    }

    .center-label {
      font-size: var(--font-size-xl, 1.25rem);
      font-weight: var(--font-weight-semibold, 600);
      font-variant-numeric: tabular-nums;
      color: var(--color-fg, inherit);
      line-height: var(--line-height-xl, 1.75rem);
    }

    .center-sublabel {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted, #71717a);
      line-height: var(--line-height-xs, 1rem);
    }

    ::slotted([slot="center"]) {
      pointer-events: auto;
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
      .slice {
        transition: none;
      }
    }
  `,
]

export const styles = doughnutChartStyles
export default doughnutChartStyles
