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

    /* Tone/variant drive the fill only — never paint the host surface */
    :host,
    :host([variant]) {
      background: none;
      border: none;
      box-shadow: none;
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
      color: var(--color-fg, inherit);
    }

    [part~="header"] {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      font-variant-numeric: tabular-nums;
      color: var(--color-fg, inherit);
    }

    /* Flat neutral track, solid tone fill */
    [part~="track"] {
      width: 100%;
      background-color: var(--color-default);
      overflow: hidden;
      position: relative;
    }

    :host([size="sm"]) [part~="track"] {
      height: 0.25rem;
    }

    :host([size="md"]) [part~="track"],
    :host(:not([size])) [part~="track"] {
      height: 0.5rem;
    }

    :host([size="lg"]) [part~="track"] {
      height: 0.75rem;
    }

    :host([shape="square"]) [part~="track"],
    :host([shape="square"]) [part~="fill"] {
      border-radius: var(--radius-none, 0);
    }

    /* Rounded follows the size: 2px / 4px / 6px corners */
    :host([shape="rounded"]) [part~="track"],
    :host([shape="rounded"]) [part~="fill"] {
      border-radius: var(--radius-sm, 0.25rem);
    }

    :host([shape="rounded"][size="sm"]) [part~="track"],
    :host([shape="rounded"][size="sm"]) [part~="fill"] {
      border-radius: var(--radius-xs, 0.125rem);
    }

    :host([shape="rounded"][size="lg"]) [part~="track"],
    :host([shape="rounded"][size="lg"]) [part~="fill"] {
      border-radius: var(--radius-md, 0.375rem);
    }

    :host([shape="pill"]) [part~="track"],
    :host(:not([shape])) [part~="track"],
    :host([shape="pill"]) [part~="fill"],
    :host(:not([shape])) [part~="fill"] {
      border-radius: var(--radius-full, 9999px);
    }

    [part~="fill"] {
      height: 100%;
      width: 0%;
      background-color: var(--_tone-solid-bg, var(--color-accent));
      border-radius: inherit;
      transition: width 300ms var(--ease-out, ease-out);
    }

    :host([is-indeterminate]) [part~="fill"] {
      width: 40%;
      animation: moul-progress-indeterminate 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    }

    @keyframes moul-progress-indeterminate {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(350%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="fill"] {
        transition: none;
      }

      :host([is-indeterminate]) [part~="fill"] {
        animation: none;
        transform: none;
        width: 100%;
        opacity: 0.7;
      }
    }
  `,
]
