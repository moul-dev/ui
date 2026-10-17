import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const switchStyles = [
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

    [part='track'] {
      position: relative;
      display: inline-flex;
      align-items: center;
      padding: 2px;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-neutral-300, #d1d5db);
      transition: background-color 0.2s ease, box-shadow 0.2s ease;
      flex-shrink: 0;
    }

    /* Size sm */
    :host([size='sm']) [part='track'] {
      width: 2rem;
      height: 1.125rem;
    }
    :host([size='sm']) [part='thumb'] {
      width: 0.875rem;
      height: 0.875rem;
    }
    :host([size='sm'][is-checked]) [part='thumb'] {
      transform: translateX(0.875rem);
    }

    /* Size md (default) */
    :host([size='md']) [part='track'],
    :host(:not([size])) [part='track'] {
      width: 2.5rem;
      height: 1.375rem;
    }
    :host([size='md']) [part='thumb'],
    :host(:not([size])) [part='thumb'] {
      width: 1.125rem;
      height: 1.125rem;
    }
    :host([size='md'][is-checked]) [part='thumb'],
    :host(:not([size])[is-checked]) [part='thumb'] {
      transform: translateX(1.125rem);
    }

    /* Size lg */
    :host([size='lg']) [part='track'] {
      width: 3rem;
      height: 1.625rem;
    }
    :host([size='lg']) [part='thumb'] {
      width: 1.375rem;
      height: 1.375rem;
    }
    :host([size='lg'][is-checked]) [part='thumb'] {
      transform: translateX(1.375rem);
    }

    :host(:focus-visible) [part='track'],
    [part='base']:focus-visible [part='track'] {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    :host([is-checked]) [part='track'] {
      background-color: var(--color-primary-500, #3b82f6);
    }

    [part='thumb'] {
      display: block;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-bg, #ffffff);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      pointer-events: none;
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
      [part='track'],
      [part='thumb'] {
        transition: none;
      }
    }
  `,
]
