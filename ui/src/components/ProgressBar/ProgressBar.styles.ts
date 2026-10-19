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
      color: var(--color-fg, inherit);
    }

    [part~="track"] {
      width: 100%;
      background-color: var(--color-fill-track);
      box-shadow: inset 0 1px 1px light-dark(oklch(0 0 0 / 0.05), oklch(0 0 0 / 0.3));
      overflow: hidden;
      position: relative;
    }

    :host([size="sm"]) [part~="track"] {
      height: 4px;
    }

    :host([size="md"]) [part~="track"],
    :host(:not([size])) [part~="track"] {
      height: 8px;
    }

    :host([size="lg"]) [part~="track"] {
      height: 12px;
    }

    :host([shape="square"]) [part~="track"],
    :host([shape="square"]) [part~="fill"] {
      border-radius: var(--radius-none, 0);
    }

    :host([shape="rounded"]) [part~="track"],
    :host([shape="rounded"]) [part~="fill"] {
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
      background:
        linear-gradient(to bottom, oklch(1 0 0 / 0.22), oklch(1 0 0 / 0) 70%),
        var(--_tone-solid-bg, var(--color-primary-solid, #3b82f6));
      box-shadow: 0 0 8px -1px color-mix(in oklch, var(--_tone-solid-bg) 50%, transparent);
      border-radius: inherit;
      transition: width var(--duration-slow, 420ms) var(--ease-out, ease);
    }

    :host([is-indeterminate]) [part~="fill"] {
      width: 40%;
      animation: moul-progress-indeterminate 1.4s infinite var(--ease-sheet, ease-in-out);
    }

    @keyframes moul-progress-indeterminate {
      0% {
        translate: -100% 0;
      }
      100% {
        translate: 250% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      :host([is-indeterminate]) [part~="fill"] {
        animation: none;
        transform: none;
        width: 100%;
        opacity: 0.7;
      }
    }
  `,
]
