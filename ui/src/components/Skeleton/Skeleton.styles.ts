import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const skeletonStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
      pointer-events: none;
    }

    [part~="base"] {
      display: block;
      box-sizing: border-box;
      background-color: color-mix(in oklab, var(--color-surface-tertiary) 70%, transparent);
      overflow: hidden;
      position: relative;
      border-radius: var(--radius-sm, 0.25rem);
    }

    :host([shape="line"]) [part~="base"],
    :host(:not([shape])) [part~="base"] {
      width: 100%;
      height: 1rem;
      border-radius: var(--radius-lg, 0.5rem);
    }

    :host([shape="circle"]) {
      flex-shrink: 0;
    }

    :host([shape="circle"]) [part~="base"] {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
    }

    :host([shape="rect"]) [part~="base"] {
      width: 100%;
      height: 6rem;
      border-radius: var(--radius-lg, 0.5rem);
    }

    /* Pulse variant: the whole block breathes */
    :host([variant="pulse"]) [part~="base"],
    :host(:not([variant])) [part~="base"] {
      animation: moul-skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    @keyframes moul-skeleton-pulse {
      50% {
        opacity: 0.5;
      }
    }

    /* Wave variant: a shimmer band sweeps across the block */
    :host([variant="wave"]) [part~="base"]::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background-image: linear-gradient(
        to right,
        transparent,
        var(--color-surface-tertiary),
        transparent
      );
      animation: moul-skeleton-shimmer 2s linear infinite;
    }

    @keyframes moul-skeleton-shimmer {
      100% {
        transform: translateX(200%);
      }
    }

    /* Reduced motion: drop the moving shimmer; the opacity pulse is not movement, so every variant keeps it */
    @media (prefers-reduced-motion: reduce) {
      [part~="base"]::after {
        animation: none !important;
      }

      :host([variant="wave"]) [part~="base"]::after {
        content: none;
      }

      :host([variant="wave"]) [part~="base"] {
        animation: moul-skeleton-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
    }
  `,
]
