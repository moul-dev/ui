import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const fileTreeStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
    }

    :host([hidden]) {
      display: none;
    }

    moul-tree {
      --moul-tree-indent: var(--moul-file-tree-indent, 1.25rem);
    }

    .icon {
      display: inline-flex;
      flex: none;
      inline-size: 1rem;
      block-size: 1rem;
      margin-inline-end: var(--spacing-1, 0.25rem);
      color: var(--color-fg-subtle);
    }

    .icon svg {
      inline-size: 100%;
      block-size: 100%;
    }

    .icon.folder {
      color: var(--color-chart-2);
    }

    .icon.code {
      color: var(--color-chart-1);
    }

    .icon.markup {
      color: var(--color-chart-3);
    }

    .icon.style {
      color: var(--color-chart-4);
    }

    .icon.data {
      color: var(--color-chart-5);
    }

    .icon.image {
      color: var(--color-chart-6);
    }

    .icon.doc {
      color: var(--color-chart-7);
    }

    .meta {
      font-family: var(--font-family-mono, ui-monospace, monospace);
    }

    .empty {
      padding: var(--spacing-4, 1rem);
      color: var(--color-fg-subtle);
      text-align: center;
    }
  `,
]
