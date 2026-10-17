import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const progressBarStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
    }

    [part="header"] {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg, inherit);
    }

    [part="track"] {
      width: 100%;
      background-color: var(--color-bg-subtle, #e5e7eb);
      overflow: hidden;
      position: relative;
    }

    :host([size="sm"]) [part="track"] {
      height: 4px;
    }

    :host([size="md"]) [part="track"],
    :host(:not([size])) [part="track"] {
      height: 8px;
    }

    :host([size="lg"]) [part="track"] {
      height: 12px;
    }

    :host([shape="square"]) [part="track"],
    :host([shape="square"]) [part="fill"] {
      border-radius: var(--radius-none, 0);
    }

    :host([shape="rounded"]) [part="track"],
    :host([shape="rounded"]) [part="fill"] {
      border-radius: var(--radius-md, 0.375rem);
    }

    :host([shape="pill"]) [part="track"],
    :host(:not([shape])) [part="track"],
    :host([shape="pill"]) [part="fill"],
    :host(:not([shape])) [part="fill"] {
      border-radius: var(--radius-full, 9999px);
    }

    [part="fill"] {
      height: 100%;
      width: 0%;
      background-color: var(--_tone-solid-bg, var(--color-primary-600, #3b82f6));
      border-radius: inherit;
      transition: width 0.3s ease;
    }

    :host([is-indeterminate]) [part="fill"] {
      width: 100%;
      transform-origin: left center;
      animation: moul-progress-indeterminate 1.5s infinite ease-in-out;
    }

    @keyframes moul-progress-indeterminate {
      0% {
        transform: translateX(-100%) scaleX(0.2);
      }
      50% {
        transform: translateX(0%) scaleX(0.7);
      }
      100% {
        transform: translateX(100%) scaleX(0.2);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([is-indeterminate]) [part="fill"] {
        animation: none;
        transform: none;
        width: 100%;
        opacity: 0.7;
      }
    }
  `,
]
