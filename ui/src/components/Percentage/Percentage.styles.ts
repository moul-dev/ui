import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const percentageBarStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      box-sizing: border-box;
    }

    .bar-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    .bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
    }

    .bar-label {
      color: var(--color-fg, inherit);
    }

    .bar-value {
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    /* Flat neutral track, solid tone fill, fully rounded */
    .bar-svg {
      display: block;
      width: 100%;
      overflow: hidden;
      border-radius: var(--radius-full, 9999px);
    }

    :host([size="sm"]) .bar-svg {
      height: 0.25rem;
    }

    :host([size="md"]) .bar-svg,
    :host(:not([size])) .bar-svg {
      height: 0.5rem;
    }

    :host([size="lg"]) .bar-svg {
      height: 0.75rem;
    }

    .bar-track {
      fill: var(--color-default);
    }

    .bar-fill {
      fill: var(--bar-color, var(--color-accent));
      transition: width 300ms var(--ease-out, ease-out);
    }

    :host([tone="primary"]) { --bar-color: var(--color-accent); }
    :host([tone="accent"]) { --bar-color: var(--color-chart-2); }
    :host([tone="success"]) { --bar-color: var(--color-success); }
    :host([tone="warning"]) { --bar-color: var(--color-warning); }
    :host([tone="error"]) { --bar-color: var(--color-danger); }

    @media (prefers-reduced-motion: reduce) {
      .bar-fill {
        transition: none;
      }
    }
  `,
]

export const percentageCircleStyles: CSSResultGroup = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-2, 0.5rem);
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      box-sizing: border-box;
    }

    .circle-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .circle-svg {
      display: block;
      overflow: visible;
    }

    /* Flat neutral ring, solid tone arc */
    .circle-track {
      fill: var(--color-default);
    }

    .circle-fill {
      fill: var(--circle-color, var(--color-accent));
      transition: fill 300ms var(--ease-out, ease-out);
    }

    .circle-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }

    .circle-value {
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    .circle-label {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
      text-align: center;
    }

    :host([tone="primary"]) { --circle-color: var(--color-accent); }
    :host([tone="accent"]) { --circle-color: var(--color-chart-2); }
    :host([tone="success"]) { --circle-color: var(--color-success); }
    :host([tone="warning"]) { --circle-color: var(--color-warning); }
    :host([tone="error"]) { --circle-color: var(--color-danger); }

    @media (prefers-reduced-motion: reduce) {
      .circle-fill {
        transition: none;
      }
    }
  `,
]
