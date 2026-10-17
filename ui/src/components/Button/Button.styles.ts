import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const buttonStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      font-family: var(--font-family-base, inherit);
      border-radius: var(--radius-md, 0.5rem);
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }

    [part="button"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border-radius: inherit;
      font-family: inherit;
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      text-decoration: none;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
    }

    /* Sizes */
    :host([size="sm"]) [part="button"] {
      height: 2rem;
      padding: 0 var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      gap: var(--spacing-1, 0.25rem);
    }

    :host([size="md"]) [part="button"],
    :host(:not([size])) [part="button"] {
      height: 2.5rem;
      padding: 0 var(--spacing-4, 1rem);
      font-size: var(--font-size-md, 1rem);
      gap: var(--spacing-2, 0.5rem);
    }

    :host([size="lg"]) [part="button"] {
      height: 3rem;
      padding: 0 var(--spacing-6, 1.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      gap: var(--spacing-3, 0.75rem);
    }

    /* Icon-only size variants */
    :host([is-icon][size="sm"]) [part="button"] {
      width: 2rem;
      padding: 0;
    }

    :host([is-icon][size="md"]) [part="button"],
    :host([is-icon]:not([size])) [part="button"] {
      width: 2.5rem;
      padding: 0;
    }

    :host([is-icon][size="lg"]) [part="button"] {
      width: 3rem;
      padding: 0;
    }

    /* Variants */
    /* Primary */
    :host([variant="primary"]) [part="button"],
    :host(:not([variant])) [part="button"] {
      background-color: var(--color-primary-600, oklch(0.55 0.22 250));
      color: var(--color-fg-on-primary, #ffffff);
      border: 1px solid transparent;
    }

    :host([variant="primary"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-primary-700, oklch(0.48 0.22 250));
    }

    /* Secondary */
    :host([variant="secondary"]) [part="button"] {
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
      color: var(--color-fg, oklch(0.15 0.01 250));
      border: 1px solid var(--color-border, oklch(0.85 0.01 250));
    }

    :host([variant="secondary"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-bg-elevated, oklch(0.92 0.01 250));
      border-color: var(--color-border-subtle, oklch(0.75 0.01 250));
    }

    /* Tertiary */
    :host([variant="tertiary"]) [part="button"] {
      background-color: transparent;
      color: var(--color-fg-subtle, oklch(0.45 0.01 250));
      border: 1px solid transparent;
    }

    :host([variant="tertiary"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
      color: var(--color-fg, oklch(0.15 0.01 250));
    }

    /* Outline */
    :host([variant="outline"]) [part="button"] {
      background-color: transparent;
      color: var(--color-fg, oklch(0.15 0.01 250));
      border: 1px solid var(--color-border, oklch(0.85 0.01 250));
    }

    :host([variant="outline"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
      border-color: var(--color-border-subtle, oklch(0.75 0.01 250));
    }

    /* Ghost */
    :host([variant="ghost"]) [part="button"] {
      background-color: transparent;
      color: var(--color-fg, oklch(0.15 0.01 250));
      border: 1px solid transparent;
    }

    :host([variant="ghost"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
    }

    /* Danger */
    :host([variant="danger"]) [part="button"] {
      background-color: var(--color-error-600, oklch(0.55 0.22 25));
      color: #ffffff;
      border: 1px solid transparent;
    }

    :host([variant="danger"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-error-700, oklch(0.45 0.22 25));
    }

    /* Danger-Soft */
    :host([variant="danger-soft"]) [part="button"] {
      background-color: var(--color-error-100, oklch(0.95 0.04 25));
      color: var(--color-error-700, oklch(0.45 0.2 25));
      border: 1px solid var(--color-error-300, oklch(0.85 0.08 25));
    }

    :host([variant="danger-soft"]:not([is-disabled]):not([is-pending])) [part="button"]:hover {
      background-color: var(--color-error-200, oklch(0.9 0.06 25));
    }

    /* Disabled State */
    :host([is-disabled]) {
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) [part="button"] {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    /* Pending State */
    :host([is-pending]) {
      cursor: wait;
      pointer-events: none;
    }

    :host([is-pending]) [part="button"] {
      cursor: wait;
      pointer-events: none;
    }

    .spinner {
      margin-inline-end: var(--spacing-2, 0.5rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :host([is-icon]) .spinner {
      margin-inline-end: 0;
    }

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `,
]
