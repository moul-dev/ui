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

    /* Ghost buttons; the current page gets the neutral fill of a tertiary button */
    [part~="button"],
    [part~="page"] {
      --_bg: transparent;
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      padding: 0 var(--spacing-1, 0.25rem);
      border: none;
      border-radius: var(--radius-3xl, 1.5rem);
      background-color: var(--_bg);
      color: var(--color-default-fg);
      font-family: inherit;
      font-size: inherit;
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      transform-origin: center;
      transition:
        transform 250ms var(--ease-smooth, ease),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out);
    }

    [part~="page"][aria-current="page"] {
      --_bg: var(--color-default);
    }

    @media (hover: hover) {
      [part~="button"]:hover:not(:disabled),
      [part~="page"]:hover:not(:disabled) {
        background-color: var(--color-default-hover);
      }
    }

    [part~="button"]:active:not(:disabled),
    [part~="page"]:active:not(:disabled) {
      background-color: var(--color-default-hover);
      transform: scale(var(--press-scale, 0.97));
    }

    :host([shape="rounded"]) [part~="button"],
    :host([shape="rounded"]) [part~="page"] {
      border-radius: var(--radius-3xl, 1.5rem);
    }

    :host([shape="square"]) [part~="button"],
    :host([shape="square"]) [part~="page"] {
      border-radius: var(--radius-none, 0);
    }

    :host([shape="pill"]) [part~="button"],
    :host([shape="pill"]) [part~="page"] {
      border-radius: var(--radius-full, 9999px);
    }

    [part~="button"]:focus-visible,
    [part~="page"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~="button"]:disabled,
    [part~="button"][aria-disabled="true"] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    [part~="ellipsis"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-muted);
      user-select: none;
    }

    .icon {
      display: inline-flex;
      width: 1rem;
      height: 1rem;
    }

    .icon:dir(rtl) {
      rotate: 180deg;
    }

    .icon svg {
      width: 100%;
      height: 100%;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="button"],
      [part~="page"] {
        transition: none;
      }

      [part~="button"]:active:not(:disabled),
      [part~="page"]:active:not(:disabled) {
        transform: none;
      }
    }
  `,
]
