import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const toastStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-radius: var(--radius-lg, 0.75rem);
      min-width: 280px;
      max-width: 420px;
      box-sizing: border-box;
      box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1));
      pointer-events: auto;
      font-family: var(--font-family-base, inherit);
      position: relative;
    }

    :host([popover]) {
      inset: auto;
      margin: unset;
      border: inherit;
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
      gap: var(--spacing-1, 0.125rem);
      flex: 1 1 auto;
      min-width: 0;
    }

    [part="title"] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 600;
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part="description"] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
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
      width: 1.25rem;
      height: 1.25rem;
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
      width: 0.875rem;
      height: 0.875rem;
    }
  `,
]

export const toastRegionStyles = [
  resetStyles,
  css`
    :host {
      position: fixed;
      bottom: var(--spacing-4, 1rem);
      right: var(--spacing-4, 1rem);
      z-index: var(--z-toast, 90);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      pointer-events: none;
      box-sizing: border-box;
      max-width: 100vw;
    }
  `,
]
