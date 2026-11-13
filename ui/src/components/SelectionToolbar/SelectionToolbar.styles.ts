import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const selectionToolbarStyles = [
  resetStyles,
  css`
    :host {
      --_offset: var(--selection-toolbar-offset, var(--spacing-4, 1rem));
      display: flex;
      justify-content: center;
      /* The host can span the width; only the bar takes clicks. */
      pointer-events: none;
    }

    /* Bottom centre of the viewport, clear of the home indicator. */
    :host([position="fixed"]) {
      position: fixed;
      inset-inline: 0;
      bottom: calc(var(--_offset) + env(safe-area-inset-bottom, 0px));
      z-index: var(--z-dropdown, 1000);
      padding-inline: var(--spacing-4, 1rem);
    }

    /* Bottom of the nearest scroll container, e.g. under a table. */
    :host([position="sticky"]) {
      position: sticky;
      bottom: var(--_offset);
      z-index: 1;
    }

    :host([position="static"]) {
      justify-content: flex-start;
    }

    [part~="bar"] {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      max-width: 100%;
      padding-block: var(--spacing-1, 0.25rem);
      padding-inline: var(--spacing-3, 0.75rem) var(--spacing-1, 0.25rem);
      min-height: 2.75rem;
      border-radius: var(--radius-3xl, 1.5rem);
      background-color: var(--color-bg-elevated, var(--color-surface));
      color: var(--color-fg);
      box-shadow: var(--shadow-overlay);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      transform-origin: 50% 100%;
    }

    [part~="label"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      flex: none;
      white-space: nowrap;
      font-weight: var(--font-weight-medium, 500);
    }

    [part~="count"] {
      display: inline-block;
      min-width: 1.5rem;
      padding-inline: var(--spacing-1, 0.25rem);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
      font-variant-numeric: tabular-nums;
      font-weight: var(--font-weight-semibold, 600);
      text-align: center;
    }

    /* Many actions wrap inside the bar; the label and clear button stay put. */
    [part~="actions"] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      min-width: 0;
    }

    [part~="divider"] {
      flex: none;
      align-self: stretch;
      width: 1px;
      margin-block: var(--spacing-1, 0.25rem);
      background-color: var(--color-separator);
    }

    [part~="clear-button"] {
      flex: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: none;
      border-radius: var(--radius-full, 9999px);
      background-color: transparent;
      color: var(--color-muted);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        color var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    [part~="clear-button"] svg {
      width: 1rem;
      height: 1rem;
    }

    @media (hover: hover) {
      [part~="clear-button"]:hover {
        background-color: var(--color-fill-hover);
        color: var(--color-fg);
      }
    }

    [part~="clear-button"]:active {
      background-color: var(--color-fill-pressed);
    }

    [part~="clear-button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="clear-button"] {
        transition: none;
      }
    }
  `,
]
