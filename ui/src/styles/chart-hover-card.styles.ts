import { type CSSResultGroup, css } from 'lit'

/**
 * The readout a chart shows for the hovered or focused mark: the value leads,
 * the label follows. Same surface as `<moul-chart-tooltip>`, but rendered inside
 * the chart's shadow root and positioned with `placeHoverCard()`.
 */
export const chartHoverCardStyles: CSSResultGroup = css`
  .hover-card {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    background-color: var(--color-bg-elevated);
    border-radius: min(2rem, var(--radius-xl, 0.75rem));
    box-shadow: var(--shadow-overlay);
    font-size: var(--font-size-xs, 0.75rem);
    line-height: var(--line-height-xs, 1rem);
    color: var(--color-fg);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .hover-card[data-open] {
    opacity: 1;
  }

  .hover-card-value {
    font-size: var(--font-size-sm, 0.875rem);
    line-height: var(--line-height-sm, 1.25rem);
    font-weight: var(--font-weight-semibold, 600);
    font-variant-numeric: tabular-nums;
  }

  .hover-card-label {
    color: var(--color-muted);
  }

  .hover-card-row {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-4, 1rem);
    color: var(--color-muted);
  }

  .hover-card-row strong {
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-fg);
    font-variant-numeric: tabular-nums;
  }

  @media (prefers-reduced-motion: reduce) {
    .hover-card {
      transition: none;
    }
  }
`
