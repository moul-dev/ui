import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const alertStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-4, 1rem);
      border-radius: var(--radius-lg, 0.75rem);
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }

    [part="base"] {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
    }

    [part="icon"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.25rem;
      height: 1.25rem;
      margin-top: 0.125rem;
    }

    [part="icon"] svg {
      width: 100%;
      height: 100%;
    }

    [part="content"] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      flex: 1 1 auto;
      min-width: 0;
    }

    [part="title"] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 600;
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part="description"] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      opacity: 0.9;
    }

    [part="actions"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      flex-shrink: 0;
      margin-inline-start: auto;
    }

    .dismiss-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: none;
      background: transparent;
      color: currentColor;
      border-radius: var(--radius-sm, 0.25rem);
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.15s ease;
    }

    .dismiss-button:hover {
      opacity: 1;
    }

    .dismiss-button:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
      opacity: 1;
    }

    .dismiss-button svg {
      width: 1rem;
      height: 1rem;
    }
  `,
]
