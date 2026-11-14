import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { codeTokenStyles, copyButtonStyles } from '../CodeBlock/code-view'

export const codeComparisonStyles = [
  resetStyles,
  codeTokenStyles,
  copyButtonStyles,
  css`
    :host {
      display: block;
      min-width: 0;
    }

    .base {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl, 0.75rem);
      background: var(--color-code-bg);
      color: var(--color-code-fg);
    }

    .header {
      display: grid;
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .header.split {
      grid-template-columns: 1fr 1fr;
    }

    .header.split .side + .side {
      border-inline-start: 1px solid var(--color-border-subtle);
    }

    .side {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-width: 0;
      min-height: 2.75rem;
      padding-inline: var(--spacing-4, 1rem) var(--spacing-2, 0.5rem);
    }

    .label {
      min-width: 0;
      overflow: hidden;
      color: var(--color-fg-subtle);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs, 0.75rem);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .arrow {
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .copy-button,
    .stats {
      margin-inline-start: auto;
    }

    .stats + .copy-button {
      margin-inline-start: 0;
    }

    .stats {
      display: flex;
      gap: 0.75ch;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs, 0.75rem);
      font-variant-numeric: tabular-nums;
    }

    .stats .removed {
      color: var(--color-danger-soft-fg);
    }

    .stats .added {
      color: var(--color-success-soft-fg);
    }

    .scroller {
      max-height: var(--code-comparison-max-height, none);
      overflow: auto;
    }

    .diff {
      --_num: calc(var(--_digits, 2) * 1ch + 1.25rem);
      display: grid;
      padding-block: var(--spacing-3, 0.75rem);
      font-family: var(--font-family-mono);
      font-size: var(--code-block-font-size, var(--font-size-sm, 0.875rem));
      line-height: 1.7;
      tab-size: 2;
      text-align: left;
      direction: ltr;
    }

    .diff.split {
      grid-template-columns: var(--_num) minmax(0, 1fr) var(--_num) minmax(0, 1fr);
    }

    .diff.unified {
      grid-template-columns: var(--_num) var(--_num) minmax(0, 1fr);
    }

    /* The after side of a split row starts at its third cell. */
    .diff.split > :nth-child(4n + 3) {
      border-inline-start: 1px solid var(--color-border-subtle);
    }

    .num {
      padding-inline: 0.5rem 0.75rem;
      color: var(--color-code-comment);
      text-align: right;
      user-select: none;
    }

    /* The sign keeps its own column, so wrapped lines stay clear of it. */
    .cell {
      display: grid;
      grid-template-columns: 2ch minmax(0, 1fr);
      min-width: 0;
      padding-inline-end: var(--spacing-4, 1rem);
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }

    .sign {
      color: var(--color-code-punctuation);
      user-select: none;
    }

    [data-kind='removed'] {
      background: color-mix(in oklab, var(--color-danger) 10%, transparent);
    }

    [data-kind='added'] {
      background: color-mix(in oklab, var(--color-success) 12%, transparent);
    }

    .num[data-kind='removed'],
    [data-kind='removed'] .sign {
      color: var(--color-danger-soft-fg);
    }

    .num[data-kind='added'],
    [data-kind='added'] .sign {
      color: var(--color-success-soft-fg);
    }

    /* A gap that keeps the two sides level. */
    [data-kind='empty'] {
      background: repeating-linear-gradient(
        -45deg,
        transparent 0 5px,
        color-mix(in oklab, var(--color-border-subtle) 70%, transparent) 5px 6px
      );
    }

    .change {
      border-radius: 2px;
    }

    [data-kind='removed'] .change {
      background: color-mix(in oklab, var(--color-danger) 26%, transparent);
    }

    [data-kind='added'] .change {
      background: color-mix(in oklab, var(--color-success) 30%, transparent);
    }
  `,
]
