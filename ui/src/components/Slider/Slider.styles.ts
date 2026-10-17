import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const sliderStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
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

    [part='header'] {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 500;
    }

    [part='label'] {
      color: var(--color-fg, inherit);
    }

    [part='output'] {
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-xs, 0.75rem);
    }

    [part='track-container'] {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 1.5rem;
      cursor: pointer;
      touch-action: none;
    }

    [part='track'] {
      position: relative;
      width: 100%;
      height: 0.375rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-neutral-200, #e5e7eb);
    }

    [part='fill'] {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-primary-500, #3b82f6);
    }

    [part='thumb'] {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 1.125rem;
      height: 1.125rem;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid var(--color-primary-500, #3b82f6);
      background-color: var(--color-bg, #ffffff);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      cursor: grab;
      outline: none;
      transition: border-color 0.1s ease, box-shadow 0.1s ease;
    }

    [part='thumb']:active {
      cursor: grabbing;
    }

    [part='thumb']:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) [part='track-container'] {
      cursor: not-allowed;
    }
  `,
]
