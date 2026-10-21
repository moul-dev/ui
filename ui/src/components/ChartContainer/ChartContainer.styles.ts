import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const chartContainerStyles = [
  resetStyles,
  css`
    /* HeroUI card surface: white fill lifted by a soft shadow, no border. */
    :host {
      display: block;
      position: relative;
      background-color: var(--color-surface, #ffffff);
      border-radius: var(--radius-surface, 1.5rem);
      box-shadow: var(--shadow-surface, 0 1px 2px 0 rgba(0, 0, 0, 0.06));
      padding: var(--spacing-4, 1rem);
      color: var(--color-fg, #18181b);
      box-sizing: border-box;
      overflow: hidden;
      font-family: var(--font-family-base, inherit);
    }

    [part~="header"],
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
      min-width: 0;
    }

    [part~="title"],
    .title {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, #18181b);
      margin: 0;
      line-height: var(--line-height-md, 1.5rem);
    }

    [part~="description"],
    .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-muted, #71717a);
      margin: 0;
      line-height: var(--line-height-sm, 1.25rem);
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~="content"],
    .content {
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    [part~="empty"],
    .empty-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      min-height: 200px;
      gap: var(--spacing-2, 0.5rem);
      color: var(--color-muted, #71717a);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding: var(--spacing-8, 2rem) var(--spacing-4, 1rem);
      text-align: center;
    }

    .empty-message {
      margin: 0;
    }

    /* Legend: a wrapping row of muted, chip-sized entries. */
    [part~="legend"],
    .legend {
      margin-top: var(--spacing-3, 0.75rem);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted, #71717a);
      line-height: var(--line-height-xs, 1rem);
    }

    ::slotted([slot="legend"]) {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
    }
  `,
]

export const styles = chartContainerStyles
