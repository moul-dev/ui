import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

export const searchFieldStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
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

    search,
    [part~='search'] {
      display: block;
      width: 100%;
      margin: 0;
      padding: 0;
    }

    [part~='input-container'] {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg, inherit);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      padding-inline: var(--spacing-2, 0.5rem);
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

    [part~='search-icon'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-fg-subtle, #9ca3af);
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    [part~='search-icon'] svg {
      width: 100%;
      height: 100%;
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
      padding: var(--spacing-2, 0.5rem) var(--spacing-2, 0.5rem);
    }

    [part~='input']::-webkit-search-cancel-button,
    [part~='input']::-webkit-search-decoration,
    [part~='input']::-webkit-search-results-button,
    [part~='input']::-webkit-search-results-decoration {
      display: none;
      -webkit-appearance: none;
    }

    [part~='input']::placeholder {
      color: var(--color-fg-subtle, #9ca3af);
    }

    [part~='clear-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--color-fg-subtle, #9ca3af);
      cursor: pointer;
      padding: 0;
      width: 1.25rem;
      height: 1.25rem;
      border-radius: var(--radius-full, 9999px);
      flex-shrink: 0;
      transition: color 0.1s ease, transform 0.1s ease;
    }

    [part~='clear-btn']:hover {
      color: var(--color-fg, inherit);
    }

    [part~='clear-btn'] svg {
      width: 1rem;
      height: 1rem;
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
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='input-container'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
