import { type CSSResultGroup, css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const statStyles: CSSResultGroup = [
  resetStyles,
  semanticToneStyles,
  css`
    /* Presented as a card surface: muted label, large value, soft status delta */
    :host {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-4, 1rem);
      border-radius: var(--radius-surface, 1.5rem);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
      min-width: 160px;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      /* Secondary copy; variants swap it for a tint of their own text color */
      --_stat-muted: var(--color-muted);
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        border-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        box-shadow var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    :host(:not([variant])) {
      background-color: var(--color-surface);
      color: var(--color-fg);
      border: none;
      box-shadow: var(--shadow-surface);
    }

    :host([variant]) {
      --_stat-muted: color-mix(in oklch, currentColor 78%, transparent);
    }

    /* Bordered and glass keep neutral copy; the tone shows in the frame */
    :host([variant="bordered"]),
    :host([variant="glass"]) {
      color: var(--color-fg);
      --_stat-muted: var(--color-muted);
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 0.5rem);
    }

    .label {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--_stat-muted);
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--_stat-muted);
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
      font-weight: var(--font-weight-medium, 500);
      color: var(--_stat-muted);
    }

    .value {
      font-size: var(--font-size-3xl, 1.875rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-3xl, 2.25rem);
      color: inherit;
      font-variant-numeric: tabular-nums;
    }

    /* Sparkline follows the tone on the default surface, the text color on variants */
    .sparkline-svg {
      display: block;
      color: inherit;
    }

    :host(:not([variant])) .sparkline-svg {
      color: var(--_tone-solid-bg);
    }

    .description {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--_stat-muted);
    }

    .footer {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    /* Delta chip: soft status fill, readable soft foreground */
    .trend-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      font-weight: var(--font-weight-medium, 500);
      padding-block: 0.125rem;
      padding-inline: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-2xl, 1rem);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-variant-numeric: tabular-nums;
    }

    .trend-badge.trend-up {
      background-color: var(--color-success-soft);
      color: var(--color-success-soft-fg);
    }

    .trend-badge.trend-down {
      background-color: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
    }

    .trend-badge.trend-neutral {
      background-color: var(--color-default-soft);
      color: var(--color-default-fg);
    }

    .trend-icon {
      width: 12px;
      height: 12px;
      stroke-width: 2.5;
    }

    @media (prefers-reduced-motion: reduce) {
      :host {
        transition: none;
      }
    }
  `,
]
