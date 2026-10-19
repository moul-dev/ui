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
      padding: 0;
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
      padding-top: 12vh;
      z-index: var(--z-modal, 1000);
      margin: 0;
      box-sizing: border-box;
    }

    dialog:not([open]) {
      display: none;
    }

    dialog::backdrop {
      background-color: var(--color-overlay, rgba(0, 0, 0, 0.5));
      backdrop-filter: blur(4px);
    }

    [part~="base"] {
      background-color: var(--color-bg-elevated, #ffffff);
      border-radius: var(--radius-lg, 0.5rem);
      border: 1px solid var(--color-border, #e5e7eb);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      width: 100%;
      max-width: 36rem;
      max-height: 28rem;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      outline: none;
      box-sizing: border-box;
      color: var(--color-fg, #111827);
    }

    [part~="input-wrapper"] {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
      min-height: 3.25rem;
      box-sizing: border-box;
    }

    .search-icon {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--color-fg-subtle, #9ca3af);
      flex-shrink: 0;
      display: inline-flex;
    }

    .search-icon svg {
      width: 100%;
      height: 100%;
    }

    [part~="input"] {
      flex: 1 1 auto;
      border: none;
      outline: none;
      background: transparent;
      color: var(--color-fg, #111827);
      font-family: inherit;
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      padding: 0;
    }

    [part~="input"]::placeholder {
      color: var(--color-fg-subtle, #9ca3af);
    }

    [part~="list"] {
      max-height: 20rem;
      overflow-y: auto;
      padding: var(--spacing-2, 0.5rem);
      display: flex;
      flex-direction: column;
      gap: 2px;
      outline: none;
    }

    [part~="item"] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border-radius: var(--radius-sm, 0.25rem);
      color: var(--color-fg, #111827);
      font-size: var(--font-size-sm, 0.875rem);
      cursor: pointer;
      user-select: none;
      transition: background-color 0.12s ease;
      gap: var(--spacing-3, 0.75rem);
    }

    [part~="item"]:hover,
    [part~="item-active"] {
      background-color: var(--color-bg-subtle, #f3f4f6);
      color: var(--color-primary-600, #4f46e5);
    }

    [part~="item"]:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: -2px;
    }

    .item-content {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-width: 0;
    }

    .item-title {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-description {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-shortcut {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #9ca3af);
      background-color: var(--color-bg-subtle, #f3f4f6);
      padding: 2px 6px;
      border-radius: var(--radius-xs, 0.125rem);
      flex-shrink: 0;
    }

    [part~="empty"] {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      color: var(--color-fg-subtle, #9ca3af);
      font-size: var(--font-size-sm, 0.875rem);
      text-align: center;
    }

    [part~="footer"] {
      padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-4, 1rem);
      border-top: 1px solid var(--color-border-subtle, #f3f4f6);
      background-color: var(--color-bg-subtle, #f9fafb);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #9ca3af);
    }
  `,
  overlayStyles,
  css`
    [part~="base"] {
      overflow: hidden;
    }
    [part~="input-wrapper"] {
      background: transparent;
      border-bottom: 1px solid var(--color-border-glass);
    }
    [part~="item"] {
      border-radius: calc(0.625rem * var(--brand-radius-factor, 1));
      transition: none;
    }
    [part~="item-active"] {
      background-color: var(--color-primary-solid);
      color: var(--color-fg-on-primary);
    }
    [part~="item-active"] * {
      color: inherit !important;
    }
    [part~="item-active"] .item-shortcut {
      background-color: oklch(1 0 0 / 0.2);
      border-color: transparent;
    }
    [part~="footer"] {
      background-color: transparent;
      border-top: 1px solid var(--color-border-glass);
    }
  `,
]
