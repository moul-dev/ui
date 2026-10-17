import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const spinnerStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      color: currentColor;
    }

    [part="base"] {
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

    :host([size="sm"]) [part="base"] {
      width: var(--spacing-4, 1rem);
      height: var(--spacing-4, 1rem);
    }

    :host([size="md"]) [part="base"],
    :host(:not([size])) [part="base"] {
      width: var(--spacing-5, 1.25rem);
      height: var(--spacing-5, 1.25rem);
    }

    :host([size="lg"]) [part="base"] {
      width: var(--spacing-7, 1.75rem);
      height: var(--spacing-7, 1.75rem);
    }

    @keyframes moul-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner-svg {
        animation: none;
        opacity: 0.8;
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
