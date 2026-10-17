import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const selectStyles = [
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

    [part='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    [part='label'] {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    [part='trigger'] {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
      color: var(--color-fg, inherit);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      cursor: pointer;
      outline: none;
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      user-select: none;
    }

    [part='trigger']:hover:not(:disabled) {
      border-color: var(--color-neutral-400, #9ca3af);
    }

    [part='trigger']:focus-visible {
      border-color: var(--color-border-focus, #3b82f6);
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 1px;
    }

    :host([is-invalid]) [part='trigger'] {
      border-color: var(--color-error-500, #ef4444);
    }

    [part='value'] {
      flex: 1;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [part='value'][data-placeholder='true'] {
      color: var(--color-fg-subtle, #9ca3af);
    }

    [part='chevron'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-fg-subtle, #9ca3af);
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      margin-inline-start: var(--spacing-2, 0.5rem);
      transition: transform 0.2s ease;
    }

    :host([is-open]) [part='chevron'] {
      transform: rotate(180deg);
    }

    [part='popover'] {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 100%;
      min-width: 8rem;
      max-height: 16rem;
      overflow-y: auto;
      border: 1px solid var(--color-border, #d1d5db);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg-elevated, #ffffff);
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
      z-index: var(--z-dropdown, 1000);
      padding: var(--spacing-1, 0.25rem);
      display: flex;
      flex-direction: column;
      gap: 2px;
      outline: none;
    }

    [part='popover'][hidden] {
      display: none !important;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
]

export const selectItemStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part='item'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border-radius: var(--radius-sm, 0.25rem);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      transition: background-color 0.1s ease, color 0.1s ease;
    }

    [part='item']:hover:not([data-disabled='true']),
    :host([is-active]) [part='item'] {
      background-color: var(--color-bg-subtle, #f3f4f6);
    }

    :host([aria-selected='true']) [part='item'] {
      background-color: var(--color-primary-50, #eff6ff);
      color: var(--color-primary-700, #1d4ed8);
      font-weight: 500;
    }

    [part='check'] {
      display: inline-flex;
      color: var(--color-primary-600, #2563eb);
      width: 1rem;
      height: 1rem;
    }

    :host([is-disabled]) {
      opacity: 0.4;
      cursor: not-allowed;
      pointer-events: none;
    }
  `,
]
