import { css } from 'lit'
import { overlayStyles } from '../../styles/overlay.styles'
import { resetStyles } from '../../styles/reset.styles'

export const commandPaletteStyles = [
  resetStyles,
  css`
    :host {
      display: contents;
    }

    dialog {
      padding: 12vh var(--spacing-4, 1rem) var(--spacing-4, 1rem);
      border: none;
      background: transparent;
      overflow: visible;
      color: inherit;
      max-width: none;
      max-height: none;
      width: 100%;
      height: 100%;
      inset: 0;
      position: fixed;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      z-index: var(--z-modal, 1300);
      margin: 0;
      box-sizing: border-box;
    }

    dialog:not([open]) {
      display: none;
    }

    /*
     * Panel surface (fill, radius, shadow) comes from the shared overlay styles.
     * The 8px inset keeps the field and row radii concentric with the panel's.
     */
    [part~="base"] {
      width: 100%;
      max-width: 36rem;
      max-height: min(28rem, 100%);
      display: flex;
      flex-direction: column;
      padding: var(--spacing-2, 0.5rem);
      overflow: hidden;
      outline: none;
      box-sizing: border-box;
    }

    /* Search field (HeroUI secondary search field: soft fill, no shadow) */
    [part~="input-wrapper"] {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      height: 2.25rem;
      border-radius: var(--radius-field, 0.75rem);
      background-color: var(--color-default);
      color: var(--color-field-fg);
      transition:
        background-color 150ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~="input-wrapper"]:hover:not(:focus-within) {
        background-color: var(--color-default-hover);
      }
    }

    [part~="input-wrapper"]:focus-within {
      box-shadow: var(--focus-ring-field);
    }

    .search-icon {
      width: 1rem;
      height: 1rem;
      margin-inline-start: var(--spacing-3, 0.75rem);
      color: var(--color-field-placeholder);
      flex-shrink: 0;
      display: inline-flex;
      pointer-events: none;
    }

    .search-icon svg {
      width: 100%;
      height: 100%;
    }

    [part~="input"] {
      flex: 1 1 auto;
      min-width: 0;
      height: 100%;
      border: none;
      outline: none;
      background: transparent;
      color: var(--color-field-fg);
      font-family: inherit;
      /* 16px on touch screens avoids iOS focus zoom */
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      padding: 0 var(--spacing-3, 0.75rem) 0 var(--spacing-2, 0.5rem);
    }

    @media (min-width: 640px) {
      [part~="input"] {
        font-size: var(--font-size-sm, 0.875rem);
        line-height: var(--line-height-sm, 1.25rem);
      }
    }

    [part~="input"]::placeholder {
      color: var(--color-field-placeholder);
    }

    /* List box */
    [part~="list"] {
      flex: 0 1 auto;
      min-height: 0;
      max-height: 20rem;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      margin-top: var(--spacing-1, 0.25rem);
      padding: var(--spacing-1, 0.25rem) 0;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      outline: none;
    }

    [part~="item"] {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      min-height: 2.25rem;
      padding: 0.375rem var(--spacing-2, 0.5rem);
      border-radius: var(--radius-2xl, 1rem);
      color: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      cursor: pointer;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      /* scale, not transform: the virtualizer positions rows with transform */
      transition:
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~="item"]:hover {
        background-color: var(--color-default);
      }
    }

    [part~="item-active"] {
      background-color: var(--color-default);
    }

    [part~="item"]:active {
      scale: 0.98;
    }

    [part~="item"]:focus-visible {
      box-shadow: var(--focus-ring);
    }

    [part~="item"][aria-disabled="true"] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-width: 0;
    }

    .item-title {
      font-weight: var(--font-weight-medium, 500);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-description {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Shortcut key cap (HeroUI kbd) */
    .item-shortcut {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      height: 1.5rem;
      padding: 0 var(--spacing-2, 0.5rem);
      border-radius: var(--radius-lg, 0.5rem);
      background-color: var(--color-default);
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      white-space: nowrap;
    }

    /* Keep the key cap distinct on a highlighted row */
    [part~="item-active"] .item-shortcut {
      background-color: var(--color-bg-elevated);
    }

    @media (hover: hover) {
      [part~="item"]:hover .item-shortcut {
        background-color: var(--color-bg-elevated);
      }
    }

    [part~="empty"] {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      color: var(--color-muted);
      font-size: var(--font-size-sm, 0.875rem);
      text-align: center;
    }

    [part~="footer"] {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-shrink: 0;
      gap: var(--spacing-4, 1rem);
      margin-top: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-2, 0.5rem) 0;
      border-top: 1px solid var(--color-separator);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
    }

    /*
     * No open/close motion: the palette is summoned from the keyboard many times a
     * day, and any entrance would stand between the shortcut and the first keystroke.
     * :host outranks the shared backdrop fade appended after these styles.
     */
    :host dialog[open]::backdrop {
      animation: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="input-wrapper"],
      [part~="item"] {
        transition: none;
      }

      [part~="item"]:active {
        scale: none;
      }
    }
  `,
  overlayStyles,
]
