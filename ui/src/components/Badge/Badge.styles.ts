import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const badgeStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    /* Chip-style label: soft tone fill (the default flat variant), 16px corners, xs medium text */
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      font-weight: var(--font-weight-medium, 500);
      white-space: nowrap;
      border-radius: var(--radius-2xl, 1rem);
      vertical-align: middle;
      box-sizing: border-box;
      flex-shrink: 0;
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      height: 100%;
    }

    :host([size="sm"]) {
      height: 1.25rem;
      padding: 0 calc(var(--spacing-1, 0.25rem) + 0.125rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]),
    :host(:not([size])) {
      height: 1.5rem;
      padding: 0 calc(var(--spacing-2, 0.5rem) + 0.125rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="lg"]) {
      height: 1.75rem;
      padding: 0 calc(var(--spacing-3, 0.75rem) + 0.125rem);
      font-size: var(--font-size-sm, 0.875rem);
    }

    /* Dot badge: a solid tone fill so the dot reads at a few pixels */
    :host([is-dot]) {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    :host([is-dot][variant="flat"]),
    :host([is-dot]:not([variant])) {
      background-color: var(--_tone-solid-bg);
    }

    :host([is-dot][size="sm"]) {
      min-width: 0.375rem;
      width: 0.375rem;
      height: 0.375rem;
      padding: 0;
    }

    :host([is-dot][size="md"]),
    :host([is-dot]:not([size])) {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
    }

    :host([is-dot][size="lg"]) {
      min-width: 0.625rem;
      width: 0.625rem;
      height: 0.625rem;
      padding: 0;
    }

    :host([is-dot]) [part~="base"] {
      display: none;
    }

    .count {
      display: inline-flex;
      align-items: baseline;
    }

    /* Live: a dot badge sends a ring out of itself; a text badge leads with a pulsing dot. */
    :host([is-dot][is-live]) {
      position: relative;
      overflow: visible;
    }

    .pulse {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-color: var(--_tone-solid-bg);
      pointer-events: none;
      animation: moul-badge-pulse 1.6s var(--ease-out, ease-out) infinite;
    }

    .live-dot {
      position: relative;
      flex-shrink: 0;
      width: 0.375rem;
      height: 0.375rem;
      border-radius: var(--radius-full, 9999px);
      background-color: currentColor;
    }

    .live-dot::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-color: inherit;
      animation: moul-badge-pulse 1.6s var(--ease-out, ease-out) infinite;
    }

    @keyframes moul-badge-pulse {
      0% {
        transform: scale(1);
        opacity: 0.6;
      }
      80%,
      100% {
        transform: scale(2.75);
        opacity: 0;
      }
    }

    /* Reduced motion: the dot stays lit; the ring does not pulse. */
    @media (prefers-reduced-motion: reduce) {
      .pulse,
      .live-dot::after {
        animation: none;
        opacity: 0;
      }
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: inline-flex;
      align-items: center;
      font-size: 0.9em;
    }
  `,
]
