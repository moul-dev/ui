import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const resultCardStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg);
      /* The icon's stroke and its soft disc, per status */
      --_fg: var(--color-success-soft-fg);
      --_soft: var(--color-success-soft);
    }

    :host([hidden]) {
      display: none;
    }

    :host([status="error"]) {
      --_fg: var(--color-danger-soft-fg);
      --_soft: var(--color-danger-soft);
    }

    :host([status="pending"]) {
      --_fg: var(--color-muted);
      --_soft: var(--color-fill-track, var(--color-default-soft));
    }

    /* The same white surface as moul-card */
    [part~="base"] {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      padding: var(--spacing-6, 1.5rem);
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-surface);
      text-align: center;
    }

    [part~="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: var(--result-card-icon-size, 3.5rem);
      height: var(--result-card-icon-size, 3.5rem);
      margin-bottom: var(--spacing-2, 0.5rem);
      color: var(--_fg);
      transition: color var(--duration-base, 250ms) var(--ease-smooth, ease);
    }

    .status-icon {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .disc {
      fill: var(--_soft);
      stroke: none;
    }

    /* pathLength="1" makes every dash one stroke long, so 1 → 0 draws it */
    .ring {
      stroke-width: 2.5;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      transform: rotate(-90deg);
      transform-origin: center;
      transform-box: fill-box;
      animation: moul-result-draw 0.5s var(--ease-out, ease-out) forwards;
    }

    .glyph {
      stroke-width: 3.5;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: moul-result-draw 0.35s var(--ease-out, ease-out) 0.4s forwards;
    }

    .glyph + .glyph {
      animation-delay: 0.52s;
    }

    /* Once drawn, the icon gives one small pop */
    :host(:not([status="pending"])) .status-icon {
      animation: moul-result-pop 0.4s var(--ease-out, ease-out) 0.6s;
    }

    /* Pending: a quarter arc that keeps turning */
    :host([status="pending"]) .ring {
      stroke-dasharray: 0.25 0.75;
      stroke-dashoffset: 0;
      animation: moul-result-turn 1s linear infinite;
    }

    [part~="heading"] {
      font-size: var(--font-size-lg, 1.125rem);
      line-height: var(--line-height-lg, 1.75rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg);
    }

    [part~="description"] {
      margin: 0;
      max-width: 36ch;
      color: var(--color-muted);
    }

    [part~="details"] {
      align-self: stretch;
      margin-top: var(--spacing-2, 0.5rem);
      text-align: start;
    }

    [part~="actions"] {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--spacing-2, 0.5rem);
      margin-top: var(--spacing-3, 0.75rem);
    }

    [hidden] {
      display: none !important;
    }

    @keyframes moul-result-draw {
      to {
        stroke-dashoffset: 0;
      }
    }

    @keyframes moul-result-turn {
      from {
        transform: rotate(-90deg);
      }
      to {
        transform: rotate(270deg);
      }
    }

    @keyframes moul-result-pop {
      50% {
        transform: scale(1.06);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="icon"] {
        transition: none;
      }

      .ring,
      .glyph,
      :host(:not([status="pending"])) .status-icon,
      :host([status="pending"]) .ring {
        animation: none;
        stroke-dashoffset: 0;
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
