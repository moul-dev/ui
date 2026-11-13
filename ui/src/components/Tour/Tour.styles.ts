import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tourStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    /* A transparent full-viewport layer in the top layer; the overlay does the dimming */
    dialog {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: none;
      background: transparent;
      color: inherit;
      overflow: hidden;
      z-index: var(--z-modal, 1300);
    }

    dialog:not([open]) {
      display: none;
    }

    dialog::backdrop {
      background: transparent;
    }

    /* Dims the page; its clip-path cuts the hole around the target */
    [part~="overlay"] {
      position: absolute;
      inset: 0;
      background-color: var(--tour-overlay, var(--color-overlay));
    }

    /* Reads the default corner radius of the hole from a token */
    .probe {
      position: absolute;
      width: 0;
      height: 0;
      visibility: hidden;
      border-radius: var(--radius-xl, 0.75rem);
    }

    [part~="card"] {
      position: absolute;
      top: 0;
      left: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      width: min(22rem, calc(100vw - 1.5rem));
      max-height: calc(100vh - 1.5rem);
      overflow: auto;
      padding: var(--spacing-5, 1.25rem);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      border-radius: var(--radius-3xl, 1.5rem);
      box-shadow: var(--shadow-overlay);
      font-family: var(--font-family-base, inherit);
      transform-origin: top center;
    }

    [part~="card"][data-side="top"] {
      transform-origin: bottom center;
    }

    [part~="card"][data-side="left"] {
      transform-origin: center right;
    }

    [part~="card"][data-side="right"] {
      transform-origin: center left;
    }

    [part~="card"][data-side="center"] {
      transform-origin: center;
    }

    [part~="header"] {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
    }

    [part~="heading"] {
      margin: 0;
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg);
    }

    [part~="close-button"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      margin: calc(-1 * var(--spacing-1, 0.25rem));
      padding: 0;
      border: none;
      border-radius: var(--radius-full, 9999px);
      background: transparent;
      color: var(--color-muted);
      cursor: pointer;
      transition: background-color 100ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~="close-button"]:hover {
        background-color: var(--color-default);
      }
    }

    [part~="close-button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~="close-button"] svg {
      width: 1rem;
      height: 1rem;
      pointer-events: none;
    }

    [part~="body"] {
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="footer"] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      margin-top: var(--spacing-1, 0.25rem);
    }

    [part~="progress"] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      font-variant-numeric: tabular-nums;
    }

    .actions {
      display: flex;
      gap: var(--spacing-2, 0.5rem);
      margin-inline-start: auto;
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

    @media (prefers-reduced-motion: reduce) {
      [part~="close-button"] {
        transition: none;
      }
    }
  `,
]

export const tourStepStyles = css`
  :host {
    display: block;
  }

  :host(:not([is-active])) {
    display: none;
  }
`
