import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tableStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      overflow-x: auto;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      border: 1px solid var(--color-border, #e5e7eb);
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-bg, #ffffff);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: start;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
    }

    thead {
      background-color: var(--color-bg-subtle, #f9fafb);
      border-bottom: 1px solid var(--color-border, #e5e7eb);
    }

    th {
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      font-weight: 600;
      color: var(--color-fg, inherit);
      user-select: none;
      text-align: start;
      white-space: nowrap;
    }

    th[aria-sort] {
      cursor: pointer;
    }

    th[aria-sort]:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
    }

    .sort-icon {
      display: inline-flex;
      align-items: center;
      transition: transform 0.2s ease;
      width: 1rem;
      height: 1rem;
    }

    .sort-icon.desc {
      transform: rotate(180deg);
    }

    .sort-icon svg {
      width: 100%;
      height: 100%;
    }

    td {
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border-bottom: 1px solid var(--color-border-subtle, #f3f4f6);
    }

    tbody tr:hover {
      background-color: var(--color-bg-subtle, #f9fafb);
    }

    tbody tr[aria-selected="true"] {
      background-color: rgba(59, 130, 246, 0.08);
    }

    .checkbox-cell {
      width: 2.5rem;
      padding-inline: var(--spacing-2, 0.5rem);
      text-align: center;
    }

    .empty-cell {
      padding: var(--spacing-8, 2rem);
      text-align: center;
      color: var(--color-fg-subtle, #6b7280);
    }

    tfoot {
      background-color: var(--color-bg-subtle, #f9fafb);
      border-top: 1px solid var(--color-border, #e5e7eb);
    }

    input[type="checkbox"] {
      cursor: pointer;
    }
  `,
]
