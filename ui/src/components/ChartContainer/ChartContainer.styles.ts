import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartContainerStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      position: relative;
      background-color: var(--color-bg, #ffffff);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-lg, 0.75rem);
      box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
      padding: var(--spacing-4, 1rem);
      color: var(--color-fg, #111827);
      box-sizing: border-box;
      overflow: hidden;
      font-family: var(--font-family-base, inherit);
    }

    [part="header"],
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--spacing-4, 1rem);
      margin-bottom: var(--spacing-3, 0.75rem);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
    }

    [part="title"],
    .title {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-fg, #111827);
      margin: 0;
      line-height: var(--line-height-lg, 1.5rem);
    }

    [part="description"],
    .description {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-fg-subtle, #6b7280);
      margin: 0;
      line-height: var(--line-height-xs, 1rem);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    [part="content"],
    .content {
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    [part="empty"],
    .empty-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
      gap: var(--spacing-2, 0.5rem);
      color: var(--color-fg-subtle, #6b7280);
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }

    [part="legend"],
    .legend {
      margin-top: var(--spacing-3, 0.75rem);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-fg-subtle, #6b7280);
      line-height: var(--line-height-sm, 1.25rem);
    }
  `,
]

export const styles = chartContainerStyles
