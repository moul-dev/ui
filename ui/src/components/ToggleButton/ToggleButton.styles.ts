import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const toggleButtonStyles = [
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
      cursor: pointer;
      position: relative;
      white-space: nowrap;
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
      background-color: transparent;
      color: var(--color-fg, oklch(0.15 0.01 250));
      border: 1px solid var(--color-border, oklch(0.85 0.01 250));
    }

    :host(:not([is-selected]):not([is-disabled])) [part="button"]:hover {
      background-color: var(--color-bg-subtle, oklch(0.96 0.005 250));
      border-color: var(--color-border-subtle, oklch(0.75 0.01 250));
    }

    /* Selected state */
    :host([is-selected]) [part="button"] {
      background-color: var(--color-primary-600, oklch(0.55 0.22 250));
      color: var(--color-fg-on-primary, #ffffff);
      border-color: var(--color-primary-600, oklch(0.55 0.22 250));
    }

    :host([is-selected]:not([is-disabled])) [part="button"]:hover {
      background-color: var(--color-primary-700, oklch(0.48 0.22 250));
      border-color: var(--color-primary-700, oklch(0.48 0.22 250));
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

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }
  `,
]
