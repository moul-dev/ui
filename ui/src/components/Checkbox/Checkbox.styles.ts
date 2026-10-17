import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const checkboxStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part='base'] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part='indicator'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.125rem;
      height: 1.125rem;
      border-radius: var(--radius-sm, 0.25rem);
      border: 1px solid var(--color-border, #d1d5db);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg-on-primary, #ffffff);
      transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
      flex-shrink: 0;
    }

    [part='base']:hover:not([data-disabled='true']) [part='indicator'] {
      border-color: var(--color-neutral-400, #9ca3af);
    }

    :host(:focus-visible) [part='indicator'],
    [part='base']:focus-visible [part='indicator'] {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    :host([is-checked]) [part='indicator'],
    :host([is-indeterminate]) [part='indicator'] {
      background-color: var(--color-primary-500, #3b82f6);
      border-color: var(--color-primary-500, #3b82f6);
    }

    :host([is-checked]:hover:not([is-disabled])) [part='indicator'],
    :host([is-indeterminate]:hover:not([is-disabled])) [part='indicator'] {
      background-color: var(--color-primary-600, #2563eb);
      border-color: var(--color-primary-600, #2563eb);
    }

    :host([is-invalid]) [part='indicator'] {
      border-color: var(--color-error-500, #ef4444);
    }

    [part='icon'] {
      width: 0.875rem;
      height: 0.875rem;
      stroke: currentColor;
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    [part='label'] {
      display: inline-flex;
      align-items: center;
      color: inherit;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part='indicator'] {
        transition: none;
      }
    }
  `,
]

export const checkboxGroupStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    [part='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
    }

    [part='label'] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    [part='description'] {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
    }

    [part='group'] {
      display: flex;
      gap: var(--spacing-3, 0.75rem);
    }

    :host([orientation='vertical']) [part='group'] {
      flex-direction: column;
    }

    :host([orientation='horizontal']) [part='group'] {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `,
]
