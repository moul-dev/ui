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

    .kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      padding: var(--spacing-1, 0.125rem) var(--spacing-2, 0.375rem);
      font-family: var(--font-family-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      background-color: var(--color-bg-subtle, #f3f4f6);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-sm, 0.25rem);
      color: var(--color-fg, inherit);
      box-shadow: 0 1px 0 var(--color-shadow, rgba(0, 0, 0, 0.08));
    }

    .separator {
      color: var(--color-fg-subtle, #9ca3af);
      font-size: var(--font-size-xs, 0.75rem);
      user-select: none;
    }
  `,
]
