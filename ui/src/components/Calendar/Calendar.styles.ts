import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const calendarStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part='base'] {
      display: inline-flex;
      flex-direction: column;
      width: fit-content;
      background-color: var(--color-bg-elevated, #ffffff);
      border-radius: var(--radius-md, 0.375rem);
      padding: var(--spacing-3, 0.75rem);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      border: 1px solid var(--color-border, #e5e7eb);
    }

    [part='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-2, 0.5rem);
      margin-bottom: var(--spacing-2, 0.5rem);
    }

    [part='heading'] {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--color-fg, inherit);
      text-align: center;
      flex: 1;
    }

    [part='nav-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: var(--radius-sm, 0.25rem);
      border: 1px solid var(--color-border-subtle, #e5e7eb);
      background-color: transparent;
      color: var(--color-fg, inherit);
      cursor: pointer;
      outline: none;
      padding: 0;
      transition: background-color 0.15s ease, border-color 0.15s ease;
    }

    [part='nav-btn']:hover:not(:disabled) {
      background-color: var(--color-neutral-100, #f3f4f6);
      border-color: var(--color-border, #d1d5db);
    }

    [part='nav-btn']:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    [part='nav-btn'] svg {
      width: 1rem;
      height: 1rem;
    }

    [part='grid'] {
      border-collapse: collapse;
      width: 100%;
    }

    [part='grid-header'] th {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 500;
      color: var(--color-fg-subtle, #6b7280);
      text-align: center;
      padding: var(--spacing-1, 0.25rem) 0;
      width: 2.25rem;
    }

    [part='grid-cell'] {
      text-align: center;
      padding: 1px;
    }

    [part='day-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.125rem;
      height: 2.125rem;
      border-radius: var(--radius-sm, 0.25rem);
      border: 1px solid transparent;
      background-color: transparent;
      color: var(--color-fg, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      cursor: pointer;
      outline: none;
      padding: 0;
      transition: background-color 0.12s ease, color 0.12s ease;
    }

    [part='day-btn']:hover:not(:disabled) {
      background-color: var(--color-neutral-100, #f3f4f6);
    }

    [part='day-btn']:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 1px;
    }

    [part='day-btn'][data-selected='true'] {
      background-color: var(--color-primary-500, #3b82f6);
      color: var(--color-fg-on-primary, #ffffff);
      font-weight: 600;
    }

    [part='day-btn'][data-today='true']:not([data-selected='true']) {
      border-color: var(--color-primary-500, #3b82f6);
      font-weight: 600;
    }

    [part='day-btn'][data-outside='true'] {
      color: var(--color-neutral-400, #9ca3af);
      opacity: 0.5;
    }

    [part='day-btn']:disabled {
      color: var(--color-neutral-300, #d1d5db);
      cursor: not-allowed;
      opacity: 0.35;
      pointer-events: none;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
]
