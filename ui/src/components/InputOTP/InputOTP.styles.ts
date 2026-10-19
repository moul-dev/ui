import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

export const inputOtpStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~='label'] {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    [part~='group'] {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~='slot'] {
      width: 2.5rem;
      height: 2.75rem;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg, inherit);
      font-family: inherit;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      outline: none;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    [part~='slot']:hover:not(:disabled) {
      border-color: var(--color-neutral-400, #9ca3af);
    }

    [part~='slot']:focus:not(:disabled) {
      border-color: var(--color-border-focus, #3b82f6);
      box-shadow: 0 0 0 2px var(--color-border-focus, #3b82f6);
    }

    :host([is-invalid]) [part~='slot'],
    [part~='slot'][data-invalid='true'] {
      border-color: var(--color-error-500, #ef4444);
    }

    [part~='slot']:disabled {
      opacity: 0.5;
      background-color: var(--color-bg-subtle, #f3f4f6);
      cursor: not-allowed;
    }

    [part~='separator'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-fg-subtle, #9ca3af);
      font-weight: bold;
      user-select: none;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
  fieldStyles,
]
