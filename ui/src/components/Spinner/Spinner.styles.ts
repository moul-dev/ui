import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const spinnerStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      vertical-align: middle;
      color: currentColor;
      pointer-events: none;
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .spinner-svg {
      display: block;
      width: 100%;
      height: 100%;
      animation: moul-spin 0.75s linear infinite;
    }

    :host([size="sm"]) [part~="base"] {
      width: 1rem;
      height: 1rem;
    }

    :host([size="md"]) [part~="base"],
    :host(:not([size])) [part~="base"] {
      width: 1.5rem;
      height: 1.5rem;
    }

    :host([size="lg"]) [part~="base"] {
      width: 2rem;
      height: 2rem;
    }

    @keyframes moul-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes moul-spin-pulse {
      50% {
        opacity: 0.4;
      }
    }

    /* Reduced motion: no rotation, but a slow pulse still says "working" */
    @media (prefers-reduced-motion: reduce) {
      .spinner-svg {
        animation: moul-spin-pulse 1.5s var(--ease-smooth, ease) infinite;
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
