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
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
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

    /* Ring */
    .spinner-svg {
      display: block;
      width: 100%;
      height: 100%;
      animation: moul-spin 0.75s linear infinite;
    }

    /* Dots: three dots rise and fade in turn */
    .dots {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      padding-inline: 4%;
    }

    .dot {
      width: 24%;
      aspect-ratio: 1;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0.35;
      animation: moul-spinner-rise 1.2s var(--ease-smooth, ease-in-out) infinite;
    }

    .dot:nth-child(2) {
      animation-delay: 0.15s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.3s;
    }

    /* Shape: a rounded square turns a quarter and rounds into a circle, then back */
    .shape {
      display: block;
      width: 56%;
      height: 56%;
      border-radius: 22%;
      background-color: currentColor;
      animation: moul-spinner-morph 1.8s ease-in-out infinite;
    }

    /* Orbit: one dot circles a faint track */
    .orbit {
      position: relative;
      display: block;
      width: 100%;
      height: 100%;
      border: 2px solid color-mix(in oklch, currentColor 20%, transparent);
      border-radius: 50%;
    }

    .satellite {
      position: absolute;
      inset: -2px;
      animation: moul-spin 1.2s linear infinite;
    }

    /* Centred on the track's middle line, 1px in from its outer edge */
    .satellite::before {
      content: "";
      position: absolute;
      top: 1px;
      left: 50%;
      width: 28%;
      aspect-ratio: 1;
      border-radius: 50%;
      background-color: currentColor;
      translate: -50% -50%;
    }

    @keyframes moul-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes moul-spinner-rise {
      0%,
      70%,
      100% {
        transform: translateY(0);
        opacity: 0.35;
      }
      35% {
        transform: translateY(-80%);
        opacity: 1;
      }
    }

    /* A square looks the same after a quarter turn, so 180deg loops seamlessly */
    @keyframes moul-spinner-morph {
      0% {
        border-radius: 22%;
        transform: rotate(0deg) scale(1);
      }
      50% {
        border-radius: 50%;
        transform: rotate(90deg) scale(0.82);
      }
      100% {
        border-radius: 22%;
        transform: rotate(180deg) scale(1);
      }
    }

    @keyframes moul-spin-pulse {
      50% {
        opacity: 0.4;
      }
    }

    @keyframes moul-spinner-fade {
      0%,
      70%,
      100% {
        opacity: 0.35;
      }
      35% {
        opacity: 1;
      }
    }

    /* Reduced motion: nothing turns or travels, but a slow pulse still says "working" */
    @media (prefers-reduced-motion: reduce) {
      .spinner-svg,
      .shape,
      .satellite::before {
        animation: moul-spin-pulse 1.5s var(--ease-smooth, ease) infinite;
      }

      .satellite {
        animation: none;
      }

      .shape {
        border-radius: 30%;
      }

      .dot {
        animation: moul-spinner-fade 1.8s var(--ease-smooth, ease) infinite;
      }

      .dot:nth-child(2) {
        animation-delay: 0.3s;
      }

      .dot:nth-child(3) {
        animation-delay: 0.6s;
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
