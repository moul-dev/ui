import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const iconMorphStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      flex-shrink: 0;
      width: 1em;
      height: 1em;
      /* Follow the surrounding text, not the reset's base size and colour. */
      font-size: inherit;
      line-height: 1;
      color: inherit;
      vertical-align: -0.125em;
    }

    :host([size="sm"]) {
      width: 1rem;
      height: 1rem;
    }

    :host([size="md"]) {
      width: 1.5rem;
      height: 1.5rem;
    }

    :host([size="lg"]) {
      width: 2rem;
      height: 2rem;
    }

    [part~="base"] {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
    }

    .layer {
      position: absolute;
      inset: 0;
    }

    svg,
    ::slotted(*) {
      display: block;
      width: 100%;
      height: 100%;
    }

    svg {
      overflow: visible;
      fill: none;
      stroke: currentColor;
      stroke-width: var(--icon-morph-stroke-width, 2);
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Mask shapes are pure fill; an inherited stroke would leak into the mask. */
    mask {
      stroke: none;
    }

    .fill {
      fill: currentColor;
      stroke: none;
    }

    .spin {
      transform-box: view-box;
      transform-origin: center;
      animation: icon-morph-spin 0.75s linear infinite;
    }

    @keyframes icon-morph-spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes icon-morph-pulse {
      50% {
        opacity: 0.4;
      }
    }

    /* Reduced motion: no turning, but a slow pulse still says "working" */
    @media (prefers-reduced-motion: reduce) {
      .spin {
        animation: icon-morph-pulse 1.5s var(--ease-smooth, ease) infinite;
      }
    }
  `,
]
