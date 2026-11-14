import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { codeLinesStyles } from '../CodeBlock/CodeBlock.styles'
import { codeTokenStyles, copyButtonStyles } from '../CodeBlock/code-view'

export const activityFeedStyles = [
  resetStyles,
  codeTokenStyles,
  copyButtonStyles,
  codeLinesStyles,
  css`
    :host {
      display: block;
      min-width: 0;
    }

    .base {
      overflow: hidden;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl, 0.75rem);
      background: var(--color-surface);
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      min-height: 2.75rem;
      padding-inline: var(--spacing-4, 1rem) var(--spacing-2, 0.5rem);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-semibold, 600);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .pulse {
      position: relative;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-success);
    }

    .pulse::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: inherit;
      animation: pulse 1.8s var(--ease-out, ease-out) infinite;
    }

    .status[data-paused] .pulse {
      background: var(--color-fg-subtle);
    }

    .status[data-paused] .pulse::after {
      animation: none;
    }

    @keyframes pulse {
      from {
        opacity: 0.7;
        scale: 1;
      }
      to {
        opacity: 0;
        scale: 2.6;
      }
    }

    .pause-button {
      padding: 0.3rem 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md, 0.375rem);
      background: transparent;
      color: var(--color-fg);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition: background-color var(--duration-fast, 150ms) ease;
    }

    .pause-button:hover {
      background: var(--color-fill-hover);
    }

    .pause-button:focus-visible,
    .pending:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    .body {
      position: relative;
      max-height: var(--activity-feed-max-height, 28rem);
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    /* No height of its own, so the pill floats over the rows instead of pushing them down. */
    .pending-bar {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      justify-content: center;
      height: 0;
      overflow: visible;
    }

    .pending {
      flex-shrink: 0;
      height: max-content;
      margin-top: var(--spacing-2, 0.5rem);
      padding: 0.3rem 0.75rem;
      border: 0;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-accent);
      color: var(--color-accent-fg);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      box-shadow: var(--shadow-md);
      cursor: pointer;
    }

    .empty {
      padding: var(--spacing-6, 1.5rem) var(--spacing-4, 1rem);
      color: var(--color-fg-subtle);
      font-size: var(--font-size-sm, 0.875rem);
      text-align: center;
    }

    .list {
      --animated-list-gap: 0;
    }

    .item {
      --_tone: var(--color-fg-subtle);
      border-bottom: 1px solid var(--color-border-subtle);
      background: var(--color-surface);
    }

    .item:last-child {
      border-bottom: 0;
    }

    .item[data-tone='primary'] {
      --_tone: var(--color-primary-solid);
    }

    .item[data-tone='accent'] {
      --_tone: var(--color-accent);
    }

    .item[data-tone='success'] {
      --_tone: var(--color-success);
    }

    .item[data-tone='warning'] {
      --_tone: var(--color-warning);
    }

    .item[data-tone='error'] {
      --_tone: var(--color-danger);
    }

    .head {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: start;
    }

    button.head {
      cursor: pointer;
      transition: background-color var(--duration-fast, 150ms) ease;
    }

    button.head:hover {
      background: var(--color-fill-hover);
    }

    button.head:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    .dot {
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      margin-top: 0.45rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--_tone);
    }

    .text {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;
      gap: 0.1rem;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-width: 0;
    }

    .title {
      overflow: hidden;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      flex-shrink: 0;
      padding: 0 0.4rem;
      border-radius: var(--radius-sm, 0.25rem);
      background: color-mix(in oklab, var(--_tone) 14%, transparent);
      color: var(--color-fg);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.4rem;
    }

    .description {
      overflow: hidden;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      flex-shrink: 0;
      margin-top: 0.1rem;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .chevron {
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      margin-top: 0.15rem;
      color: var(--color-fg-subtle);
      transition: rotate 200ms var(--ease-out, ease-out);
    }

    .item[data-open] .chevron {
      rotate: 180deg;
    }

    .payload-inner {
      position: relative;
      margin: 0 var(--spacing-4, 1rem) var(--spacing-3, 0.75rem)
        calc(var(--spacing-4, 1rem) + 0.5rem + var(--spacing-3, 0.75rem));
      overflow: auto;
      max-height: 20rem;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg, 0.5rem);
      background: var(--color-code-bg);
    }

    .payload .code {
      padding-block: var(--spacing-3, 0.75rem);
      font-size: var(--font-size-xs, 0.75rem);
    }

    .payload .line {
      padding-inline: var(--spacing-3, 0.75rem) 2.75rem;
    }

    .payload .copy-button {
      position: absolute;
      top: var(--spacing-1, 0.25rem);
      right: var(--spacing-1, 0.25rem);
    }

    @media (prefers-reduced-motion: reduce) {
      .pulse::after {
        animation: none;
      }

      .pause-button,
      button.head,
      .chevron {
        transition: none;
      }
    }
  `,
]
