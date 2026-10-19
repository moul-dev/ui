import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

export const textAreaStyles = [
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

    [part~='textarea'] {
      display: block;
      width: 100%;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg, inherit);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      outline: none;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      resize: vertical;
      min-height: 4.5rem;
    }

    :host([auto-resize]) [part~='textarea'] {
      field-sizing: content;
      resize: none;
    }

    [part~='textarea']:hover:not(:disabled) {
      border-color: var(--color-neutral-400, #9ca3af);
    }

    [part~='textarea']:focus:not(:disabled) {
      border-color: var(--color-border-focus, #3b82f6);
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 1px;
    }

    :host([is-invalid]) [part~='textarea'],
    [part~='textarea'][data-invalid='true'] {
      border-color: var(--color-error-500, #ef4444);
    }

    :host([is-invalid]) [part~='textarea']:focus,
    [part~='textarea'][data-invalid='true']:focus {
      outline-color: var(--color-error-500, #ef4444);
    }

    [part~='textarea']::placeholder {
      color: var(--color-fg-subtle, #9ca3af);
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

    :host([is-disabled]) [part~='textarea'] {
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='textarea'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
