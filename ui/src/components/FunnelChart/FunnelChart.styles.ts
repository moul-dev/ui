import { type CSSResultGroup, css } from 'lit'
import { chartHoverCardStyles } from '../../styles/chart-hover-card.styles'
import { resetStyles } from '../../styles/reset.styles'

export const funnelChartStyles: CSSResultGroup = [
  resetStyles,
  chartHoverCardStyles,
  css`
    :host {
      display: block;
      position: relative;
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
      /* Ordinal ramp ends; stages without a color step between them */
      --_from: var(--color-chart-ordinal-from, oklch(0.64 0.18 277));
      --_to: var(--color-chart-ordinal-to, oklch(0.8 0.1 180));
      --_bar-h: 1.875rem;
      /* Keep in sync with NECK_HEIGHT */
      --_neck-h: 28px;
      --_fade-top: 0.3;
      --_fade-bottom: 0.04;
    }

    .frame {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-5, 1.25rem);
    }

    .summary p {
      margin: 0;
    }

    .headline {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      column-gap: var(--spacing-2, 0.5rem);
    }

    [part~="conversion"],
    .conversion {
      font-size: var(--font-size-xxl, 1.5rem);
      line-height: var(--line-height-xxl, 2rem);
      font-weight: var(--font-weight-bold, 700);
      letter-spacing: -0.035em;
      font-variant-numeric: tabular-nums;
    }

    .conversion-label {
      color: var(--color-muted);
      font-size: var(--font-size-md, 1rem);
    }

    .summary .biggest-drop {
      margin-top: var(--spacing-2, 0.5rem);
      color: var(--color-muted);
    }

    .drop-value {
      color: var(--color-danger);
      font-weight: var(--font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    [part~="stages"],
    .stages {
      display: flex;
      flex-direction: column;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .stage {
      position: relative;
    }

    .stage-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      margin-bottom: var(--spacing-2, 0.5rem);
    }

    .stage + .stage .stage-header {
      margin-top: var(--spacing-1, 0.25rem);
    }

    .stage-label {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stage-value {
      flex: none;
      font-variant-numeric: tabular-nums;
    }

    .stage-sep {
      margin: 0 0.25em;
      color: var(--color-muted);
    }

    .stage-percent {
      color: var(--color-muted);
    }

    .track {
      display: flex;
      justify-content: center;
    }

    [part~="bar"],
    .bar {
      width: max(var(--_bar-h), var(--_w, 100%));
      max-width: 100%;
      height: var(--_bar-h);
      border-radius: var(--radius-lg, 0.5rem);
      background-color: var(--_color);
      transition: opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .connector {
      position: relative;
      height: var(--_neck-h);
    }

    .neck {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
      transition: opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    [part~="drop"],
    .drop {
      position: absolute;
      top: 50%;
      left: 50%;
      translate: -50% -50%;
      padding: 0 var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-surface);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.125rem;
      color: var(--color-muted);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    /* Hovering a stage recedes the others */
    .stage.is-dimmed .bar,
    .stage.is-dimmed .neck {
      opacity: 0.45;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    [part~="empty"],
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 200px;
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .bar,
      .neck {
        transition: none;
      }
    }
  `,
]

export const styles = funnelChartStyles
export default funnelChartStyles
