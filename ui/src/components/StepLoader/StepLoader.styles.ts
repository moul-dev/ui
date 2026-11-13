import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const stepLoaderStyles = [
  resetStyles,
  css`
    /*
     * Give the host a height or max-height and it scrolls, keeping the current
     * step in view by itself. No scrollbar: the row sliding in would flash one.
     */
    :host {
      display: block;
      position: relative;
      overflow-y: auto;
      scrollbar-width: none;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg);
    }

    :host([hidden]) {
      display: none;
    }

    :host::-webkit-scrollbar {
      display: none;
    }

    [part~="list"] {
      display: flex;
      flex-direction: column;
      gap: var(--step-loader-gap, var(--spacing-3, 0.75rem));
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      transition: color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    .indicator {
      position: relative;
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: 50%;
      transition: background-color var(--duration-base, 250ms)
        var(--ease-smooth, ease);
    }

    .text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      padding-top: calc((1.25rem - var(--line-height-sm, 1.25rem)) / 2);
    }

    .description {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
    }

    /* Pending: a hollow ring and muted copy */
    .step[data-state="pending"] {
      color: var(--color-muted);
    }

    .step[data-state="pending"] .indicator {
      box-shadow: inset 0 0 0 1.5px var(--color-border);
    }

    /* Current: a spinner, and the row in full weight */
    .step[data-state="current"] .indicator {
      color: var(--color-accent);
    }

    .step[data-state="current"] .label,
    .step[data-state="failed"] .label {
      font-weight: var(--font-weight-medium, 500);
    }

    .step[data-state="current"],
    .step[data-state="failed"] {
      animation: moul-step-loader-enter var(--duration-slow, 400ms)
        var(--ease-out, ease-out) both;
    }

    .step[data-state="done"] .indicator {
      background-color: var(--color-success-soft);
      color: var(--color-success-soft-fg);
    }

    .step[data-state="failed"] .indicator {
      background-color: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
    }

    .mark {
      width: 0.875rem;
      height: 0.875rem;
    }

    /* Marks draw themselves: pathLength="1" makes the dash one path long */
    .mark path {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: moul-step-loader-draw 0.35s var(--ease-out, ease-out) forwards;
    }

    .mark path + path {
      animation-delay: 0.12s;
    }

    @keyframes moul-step-loader-draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes moul-step-loader-enter {
      from {
        opacity: 0.4;
        transform: translateY(0.375rem);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .step,
      .indicator {
        transition: none;
      }

      .step[data-state="current"],
      .step[data-state="failed"] {
        animation: none;
      }

      .mark path {
        stroke-dashoffset: 0;
        animation: none;
      }
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
  `,
]
