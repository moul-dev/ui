import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const paginationStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      list-style: none;
      padding: 0;
      margin: 0;
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
    }

    [part~="button"],
    [part~="page"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.25rem;
      height: 2.25rem;
      padding: 0 var(--spacing-2, 0.5rem);
      border: 1px solid transparent;
      background: transparent;
      color: var(--color-fg, #111827);
      font-weight: 500;
      font-size: inherit;
      cursor: pointer;
      user-select: none;
      border-radius: var(--radius-md, 0.375rem);
      transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
    }

    [part~="button"]:active:not(:disabled),
    [part~="page"]:active:not(:disabled) {
      transform: scale(0.95);
    }

    :host([shape="rounded"]) [part~="button"],
    :host([shape="rounded"]) [part~="page"] {
      border-radius: var(--radius-md, 0.375rem);
    }

    :host([shape="square"]) [part~="button"],
    :host([shape="square"]) [part~="page"] {
      border-radius: var(--radius-none, 0);
    }

    :host([shape="pill"]) [part~="button"],
    :host([shape="pill"]) [part~="page"] {
      border-radius: var(--radius-full, 9999px);
    }

    [part~="page"]:hover:not(:disabled):not([aria-current="page"]),
    [part~="button"]:hover:not(:disabled) {
      background-color: var(--color-bg-subtle, #f3f4f6);
    }

    [part~="page"][aria-current="page"] {
      background-color: var(--color-primary-solid, #4f46e5);
      color: var(--color-fg-on-primary, #ffffff);
      font-weight: 600;
      border-color: var(--color-primary-500, #4f46e5);
    }

    [part~="button"]:focus-visible,
    [part~="page"]:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    [part~="button"]:disabled,
    [part~="button"][aria-disabled="true"] {
      opacity: 0.35;
      cursor: not-allowed;
      pointer-events: none;
    }

    [part~="ellipsis"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.25rem;
      height: 2.25rem;
      color: var(--color-fg-subtle, #9ca3af);
      user-select: none;
    }

    .icon {
      display: inline-flex;
      width: 1rem;
      height: 1rem;
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }
  `,
]
