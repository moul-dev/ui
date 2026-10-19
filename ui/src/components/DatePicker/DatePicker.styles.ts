import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

export const datePickerStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      position: relative;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    [part~='label'] {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    [part~='input-container'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
      width: 100%;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg, inherit);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    }

    [part~='input-container']:hover:not([data-disabled='true']) {
      border-color: var(--color-neutral-400, #9ca3af);
    }

    [part~='input-container']:focus-within:not([data-disabled='true']) {
      border-color: var(--color-border-focus, #3b82f6);
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 1px;
    }

    :host([is-invalid]) [part~='input-container'],
    [part~='input-container'][data-invalid='true'] {
      border-color: var(--color-error-500, #ef4444);
    }

    [part~='input'] {
      flex: 1;
      width: 100%;
      min-width: 0;
      border: none;
      outline: none;
      background: transparent;
      color: inherit;
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    }

    [part~='input']::placeholder {
      color: var(--color-fg-subtle, #9ca3af);
    }

    [part~='trigger-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-fg-subtle, #9ca3af);
      cursor: pointer;
      padding-inline: var(--spacing-3, 0.75rem);
      height: 100%;
      transition: color 0.1s ease;
    }

    [part~='trigger-btn']:hover:not(:disabled) {
      color: var(--color-fg, inherit);
    }

    [part~='trigger-btn'] svg {
      width: 1.125rem;
      height: 1.125rem;
    }

    [part~='popover'] {
      margin: 0;
      border: none;
      border-radius: calc(0.875rem * var(--brand-radius-factor, 1));
      background-color: var(--glass-bg-thick);
      -webkit-backdrop-filter: var(--glass-filter);
      backdrop-filter: var(--glass-filter);
      box-shadow: var(--glass-highlight), var(--shadow-glass);
      color: var(--color-fg);
      z-index: var(--z-dropdown, 1000);
      outline: none;
      padding: 6px;
    }

    [part~='popover'][hidden] {
      display: none !important;
    }

    [part~='description'] {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    [part~='error'] {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-error-500, #ef4444);
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
  fieldStyles,
]
