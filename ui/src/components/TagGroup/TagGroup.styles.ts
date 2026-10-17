import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const tagStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      border-radius: var(--radius-full, 9999px);
      cursor: pointer;
      user-select: none;
      vertical-align: middle;
      box-sizing: border-box;
      line-height: 1;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    :host([is-disabled]) {
      opacity: 0.5;
      pointer-events: none;
      cursor: not-allowed;
    }

    [part="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      height: 100%;
    }

    :host([size="sm"]) {
      height: 1.25rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]),
    :host(:not([size])) {
      height: 1.5rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([size="lg"]) {
      height: 1.75rem;
      padding: 0 var(--spacing-3, 0.75rem);
      font-size: var(--font-size-md, 1rem);
    }

    :host([is-selected]) {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 1px;
    }

    .remove-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 1rem;
      padding: 0;
      border: none;
      background: transparent;
      color: currentColor;
      border-radius: var(--radius-full, 9999px);
      cursor: pointer;
      opacity: 0.7;
      margin-inline-start: 0.125rem;
    }

    .remove-button:hover {
      opacity: 1;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .remove-button svg {
      width: 0.75rem;
      height: 0.75rem;
    }
  `,
]

export const tagGroupStyles = [
  resetStyles,
  css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
      box-sizing: border-box;
    }

    .label {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
      color: var(--color-fg, inherit);
    }

    .tag-container {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      align-items: center;
    }
  `,
]
