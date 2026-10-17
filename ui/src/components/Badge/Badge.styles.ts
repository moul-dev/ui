import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const badgeStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      font-weight: 500;
      white-space: nowrap;
      border-radius: var(--radius-full, 9999px);
      vertical-align: middle;
      box-sizing: border-box;
      line-height: 1;
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
      padding: 0 calc(var(--spacing-2, 0.5rem) + 2px);
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([size="lg"]) {
      height: 1.75rem;
      padding: 0 var(--spacing-3, 0.75rem);
      font-size: var(--font-size-md, 1rem);
    }

    /* Dot badge */
    :host([is-dot]) {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    :host([is-dot][size="sm"]) {
      min-width: 0.375rem;
      width: 0.375rem;
      height: 0.375rem;
      padding: 0;
    }

    :host([is-dot][size="md"]),
    :host([is-dot]:not([size])) {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
    }

    :host([is-dot][size="lg"]) {
      min-width: 0.625rem;
      width: 0.625rem;
      height: 0.625rem;
      padding: 0;
    }

    :host([is-dot]) [part="base"] {
      display: none;
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: inline-flex;
      align-items: center;
      font-size: 0.9em;
    }
  `,
]
