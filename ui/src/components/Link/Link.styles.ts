import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const linkStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      vertical-align: baseline;
      font-size: inherit;
      line-height: inherit;
      border-radius: var(--radius-xl, 0.75rem);
      /* Underline colors: faint at rest, muted on hover and press */
      --_decoration: color-mix(in oklab, var(--color-surface) 81%, var(--color-fg) 19%);
      --_decoration-hover: color-mix(in oklab, var(--color-muted) 50%, transparent);
      --_decoration-pressed: var(--color-muted);
    }

    [part~="base"] {
      position: relative;
      display: inline-flex;
      align-items: center;
      border-radius: inherit;
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-link);
      text-decoration-line: none;
      text-decoration-color: var(--_decoration);
      text-decoration-thickness: 1.5px;
      text-underline-offset: 4px;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      -webkit-tap-highlight-color: transparent;
      transition:
        color 100ms var(--ease-smooth, ease),
        text-decoration-color 100ms var(--ease-smooth, ease),
        background-color 150ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out),
        opacity 100ms var(--ease-out, ease-out);
    }

    /* Variants */
    :host([variant="subtle"]) [part~="base"] {
      color: var(--color-muted);
    }

    :host([variant="underline"]) [part~="base"] {
      text-decoration-line: underline;
    }

    @media (hover: hover) {
      :host(:not([is-disabled])) [part~="base"]:hover {
        text-decoration-line: underline;
        text-decoration-color: var(--_decoration-hover);
      }

      :host([variant="subtle"]:not([is-disabled])) [part~="base"]:hover {
        color: var(--color-fg);
      }
    }

    :host(:not([is-disabled])) [part~="base"]:active {
      text-decoration-line: underline;
      text-decoration-color: var(--_decoration-pressed);
    }

    [part~="base"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    /* Disabled State */
    :host([is-disabled]) {
      cursor: not-allowed;
      pointer-events: none;
    }

    [part~="base"]:disabled,
    [part~="base"][aria-disabled="true"] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
      text-decoration-line: none;
    }

    [part~="external-icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 0.75em;
      height: 0.75em;
      flex-shrink: 0;
      margin-inline-start: var(--spacing-1, 0.25rem);
      color: currentColor;
      opacity: 0.6;
      pointer-events: none;
      transition: opacity 150ms var(--ease-out, ease-out);
    }

    [part~="external-icon"] svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    @media (hover: hover) {
      [part~="base"]:hover [part~="external-icon"] {
        opacity: 1;
      }
    }

    [part~="base"]:active [part~="external-icon"],
    [part~="base"]:focus-visible [part~="external-icon"] {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="base"],
      [part~="external-icon"] {
        transition: none;
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
