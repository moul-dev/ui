import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { semanticToneStyles } from '../../styles/semantic-tones'

export const badgeStyles = [
  resetStyles,
  semanticToneStyles,
  css`
    /* Chip-style label: soft tone fill (the default flat variant), 16px corners, xs medium text */
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      font-weight: var(--font-weight-medium, 500);
      white-space: nowrap;
      border-radius: var(--radius-2xl, 1rem);
      vertical-align: middle;
      box-sizing: border-box;
      flex-shrink: 0;
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~="base"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
      height: 100%;
    }

    :host([size="sm"]) {
      height: 1.25rem;
      padding: 0 calc(var(--spacing-1, 0.25rem) + 0.125rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="md"]),
    :host(:not([size])) {
      height: 1.5rem;
      padding: 0 calc(var(--spacing-2, 0.5rem) + 0.125rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([size="lg"]) {
      height: 1.75rem;
      padding: 0 calc(var(--spacing-3, 0.75rem) + 0.125rem);
      font-size: var(--font-size-sm, 0.875rem);
    }

    /* Dot badge: a solid tone fill so the dot reads at a few pixels */
    :host([is-dot]) {
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
    }

    :host([is-dot][variant="flat"]),
    :host([is-dot]:not([variant])) {
      background-color: var(--_tone-solid-bg);
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

    :host([is-dot]) [part~="base"] {
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
