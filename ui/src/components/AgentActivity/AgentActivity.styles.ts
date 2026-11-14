import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const agentActivityStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      min-width: 0;
    }

    .base {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .header {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      gap: var(--spacing-2, 0.5rem);
      max-width: 100%;
      margin-inline-start: calc(-1 * var(--spacing-2, 0.5rem));
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border: 0;
      border-radius: var(--radius-md, 0.5rem);
      background: transparent;
      color: var(--color-fg-subtle);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: start;
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease;
    }

    .header:hover {
      background: var(--color-fill-hover);
      color: var(--color-fg);
    }

    .header:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .summary {
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    [data-running] .summary {
      background-image: linear-gradient(
        90deg,
        var(--color-fg-subtle) 0%,
        var(--color-fg-subtle) 35%,
        var(--color-fg) 50%,
        var(--color-fg-subtle) 65%,
        var(--color-fg-subtle) 100%
      );
      background-size: 250% 100%;
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: moul-agent-shimmer 2.2s linear infinite;
    }

    @keyframes moul-agent-shimmer {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -150% 0;
      }
    }

    .chevron {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      transition: rotate var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .header[aria-expanded='false'] .chevron {
      rotate: -90deg;
    }

    :host(:dir(rtl)) .header[aria-expanded='false'] .chevron {
      rotate: 90deg;
    }

    .status-icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .status-icon.done {
      color: var(--color-success-soft-fg);
    }

    .status-icon.error {
      color: var(--color-danger-soft-fg);
    }

    .spinner {
      width: 0.875rem;
      height: 0.875rem;
      margin: 0.0625rem;
      flex-shrink: 0;
      border: 2px solid var(--color-fill-track, var(--color-border));
      border-top-color: var(--color-accent);
      border-radius: var(--radius-full, 9999px);
      animation: moul-agent-spin 0.8s linear infinite;
    }

    @keyframes moul-agent-spin {
      to {
        rotate: 1turn;
      }
    }

    .steps {
      padding-block: var(--spacing-2, 0.5rem) var(--spacing-1, 0.25rem);
      padding-inline-start: var(--spacing-1, 0.25rem);
    }

    .step-heading {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    .tool {
      padding: 0 0.4em;
      border-radius: var(--radius-sm, 0.25rem);
      background: var(--color-code-bg);
      color: var(--color-code-fg);
      font-family: var(--font-family-mono, ui-monospace, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-normal, 400);
    }

    .step[data-status='pending'] .step-title {
      color: var(--color-fg-subtle);
    }

    .detail,
    .step-error {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg-subtle);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .step-error {
      color: var(--color-danger-soft-fg);
    }

    .details-button {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      margin-top: var(--spacing-1, 0.25rem);
      margin-inline-start: calc(-1 * var(--spacing-1, 0.25rem));
      padding: 0 var(--spacing-1, 0.25rem);
      border: 0;
      border-radius: var(--radius-sm, 0.25rem);
      background: transparent;
      color: var(--color-fg-subtle);
      font: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-sm, 1.25rem);
      cursor: pointer;
    }

    .details-button:hover {
      color: var(--color-fg);
    }

    .details-button:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .details-button .chevron {
      width: 0.875rem;
      height: 0.875rem;
    }

    .details-button[aria-expanded='false'] .chevron {
      rotate: -90deg;
    }

    :host(:dir(rtl)) .details-button[aria-expanded='false'] .chevron {
      rotate: 90deg;
    }

    .details-inner {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      padding-top: var(--spacing-2, 0.5rem);
    }

    .payload {
      --code-block-max-height: 16rem;
      --code-block-font-size: var(--font-size-xs, 0.75rem);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .header,
      .chevron {
        transition: none;
      }

      [data-running] .summary {
        animation: none;
        background-image: none;
        -webkit-text-fill-color: currentColor;
      }

      .spinner {
        animation-duration: 2.4s;
      }
    }

    @media (forced-colors: active) {
      [data-running] .summary {
        background-image: none;
        -webkit-text-fill-color: currentColor;
      }
    }
  `,
]
