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
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg, inherit);
    }

    .bar-label {
      font-weight: 500;
      color: var(--color-fg-subtle, #6b7280);
    }

    .bar-value {
      font-weight: 600;
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    .bar-svg {
      display: block;
      width: 100%;
      overflow: hidden;
      border-radius: var(--radius-full, 9999px);
    }

    :host([size="sm"]) .bar-svg {
      height: 4px;
    }

    :host([size="md"]) .bar-svg,
    :host(:not([size])) .bar-svg {
      height: 8px;
    }

    :host([size="lg"]) .bar-svg {
      height: 12px;
    }

    .bar-track {
      fill: var(--color-neutral-100, rgba(156, 163, 175, 0.2));
    }

    .bar-fill {
      fill: var(--bar-color, var(--color-chart-1, #6366f1));
      transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    }

    :host([tone="primary"]) { --bar-color: var(--color-chart-1, #6366f1); }
    :host([tone="accent"]) { --bar-color: var(--color-chart-2, #8b5cf6); }
    :host([tone="success"]) { --bar-color: var(--color-success, #22c55e); }
    :host([tone="warning"]) { --bar-color: var(--color-warning, #f59e0b); }
    :host([tone="error"]) { --bar-color: var(--color-error, #ef4444); }
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

    .circle-track {
      fill: var(--color-neutral-100, rgba(156, 163, 175, 0.2));
    }

    .circle-fill {
      fill: var(--circle-color, var(--color-chart-1, #6366f1));
      transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
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
      font-weight: 700;
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    .circle-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 500;
      color: var(--color-fg-subtle, #6b7280);
      text-align: center;
    }

    :host([tone="primary"]) { --circle-color: var(--color-chart-1, #6366f1); }
    :host([tone="accent"]) { --circle-color: var(--color-chart-2, #8b5cf6); }
    :host([tone="success"]) { --circle-color: var(--color-success, #22c55e); }
    :host([tone="warning"]) { --circle-color: var(--color-warning, #f59e0b); }
    :host([tone="error"]) { --circle-color: var(--color-error, #ef4444); }
  `,
]
