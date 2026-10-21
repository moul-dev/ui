import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const kbdStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      vertical-align: middle;
    }

    /* Key combo wrapper: lay keys and "+" out on a fixed gap */
    [role="group"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
    }

    .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      min-width: 1.5rem;
      height: 1.5rem;
      padding: 0 var(--spacing-2, 0.5rem);
      font-family: var(--font-family-base, inherit);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      text-align: center;
      white-space: nowrap;
      word-spacing: -0.25rem;
      color: var(--color-muted);
      background-color: var(--color-default);
      border-radius: var(--radius-lg, 0.5rem);
    }

    .separator {
      color: var(--color-muted);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      user-select: none;
    }
  `,
]
