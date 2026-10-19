import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const linkStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      line-height: inherit;
      vertical-align: baseline;
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      font-weight: 500;
      color: var(--color-primary-500, #4f46e5);
      text-decoration: none;
      cursor: pointer;
      background: transparent;
      border: none;
      padding: 0;
      margin: 0;
      transition: color 0.15s ease, opacity 0.15s ease;
    }

    :host([variant="default"]) [part~="base"] {
      color: var(--color-primary-500, #4f46e5);
      text-decoration: none;
    }

    :host([variant="default"]) [part~="base"]:hover {
      color: var(--color-primary-600, #4338ca);
      text-decoration: underline;
    }

    :host([variant="subtle"]) [part~="base"] {
      color: var(--color-fg-subtle, #6b7280);
      text-decoration: none;
    }

    :host([variant="subtle"]) [part~="base"]:hover {
      color: var(--color-fg, #111827);
      text-decoration: underline;
    }

    :host([variant="underline"]) [part~="base"] {
      color: var(--color-primary-500, #4f46e5);
      text-decoration: underline;
      text-underline-offset: 0.2em;
    }

    :host([variant="underline"]) [part~="base"]:hover {
      color: var(--color-primary-600, #4338ca);
    }

    :host([is-disabled]),
    [part~="base"]:disabled,
    [part~="base"][aria-disabled="true"] {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
      text-decoration: none;
    }

    [part~="base"]:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
      border-radius: var(--radius-xs, 0.125rem);
    }

    [part~="external-icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 0.875em;
      height: 0.875em;
      flex-shrink: 0;
      margin-inline-start: 0.125em;
      transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    [part~="external-icon"] svg {
      width: 100%;
      height: 100%;
    }

    [part~="base"]:hover [part~="external-icon"],
    :host(:hover) [part~="external-icon"] {
      transform: translate(2px, -2px);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="base"]:hover [part~="external-icon"],
      :host(:hover) [part~="external-icon"] {
        transform: none;
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
