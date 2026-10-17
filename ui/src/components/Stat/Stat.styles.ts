import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const statStyles: CSSResultGroup = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-5, 1.25rem);
      border-radius: var(--radius-lg, 0.75rem);
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      min-width: 160px;
      box-sizing: border-box;
      transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      position: relative;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 0.5rem);
    }

    .label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 500;
      color: var(--color-fg-subtle, #6b7280);
      letter-spacing: 0.02em;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-fg-subtle, #6b7280);
      flex-shrink: 0;
    }

    .body {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      flex-grow: 1;
    }

    .value-row {
      display: flex;
      align-items: baseline;
      gap: 2px;
    }

    .prefix,
    .suffix {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--color-fg-subtle, #6b7280);
    }

    .value {
      font-size: var(--font-size-3xl, 1.875rem);
      font-weight: 700;
      line-height: 1.2;
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    .description {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    .footer {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;
      padding-block: 2px;
      padding-inline: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-full, 9999px);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1;
    }

    .trend-badge.trend-up {
      background-color: var(--color-success-bg, rgba(34, 197, 94, 0.12));
      color: var(--color-success-fg, #16a34a);
    }

    .trend-badge.trend-down {
      background-color: var(--color-error-bg, rgba(239, 68, 68, 0.12));
      color: var(--color-error-fg, #dc2626);
    }

    .trend-badge.trend-neutral {
      background-color: var(--color-neutral-bg, rgba(107, 114, 128, 0.12));
      color: var(--color-neutral-fg, #6b7280);
    }

    .trend-icon {
      width: 12px;
      height: 12px;
      stroke-width: 2.5;
    }
  `,
]
