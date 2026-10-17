import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const skeletonStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    [part="base"] {
      display: block;
      box-sizing: border-box;
      background-color: var(--color-bg-subtle, #e5e7eb);
      overflow: hidden;
      position: relative;
    }

    :host([shape="line"]) [part="base"],
    :host(:not([shape])) [part="base"] {
      width: 100%;
      height: 1rem;
      border-radius: var(--radius-sm, 0.25rem);
    }

    :host([shape="circle"]) [part="base"] {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
    }

    :host([shape="rect"]) [part="base"] {
      width: 100%;
      height: 6rem;
      border-radius: var(--radius-md, 0.375rem);
    }

    /* Pulse variant */
    :host([variant="pulse"]) [part="base"],
    :host(:not([variant])) [part="base"] {
      animation: moul-skeleton-pulse 1.5s ease-in-out infinite;
    }

    @keyframes moul-skeleton-pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.4;
      }
    }

    /* Wave shimmer variant */
    :host([variant="wave"]) [part="base"] {
      background: linear-gradient(
        90deg,
        var(--color-bg-subtle, #e5e7eb) 0%,
        var(--color-bg-elevated, #f3f4f6) 50%,
        var(--color-bg-subtle, #e5e7eb) 100%
      );
      background-size: 200% 100%;
      animation: moul-skeleton-wave 1.6s linear infinite;
    }

    @keyframes moul-skeleton-wave {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part="base"] {
        animation: none !important;
        opacity: 0.7;
      }
    }
  `,
]
