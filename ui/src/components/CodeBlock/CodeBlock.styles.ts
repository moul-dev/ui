import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { codeTokenStyles, copyButtonStyles } from './code-view'

/** The `<pre>` and its lines, shared with `<moul-code-comparison>`. */
export const codeLinesStyles = css`
  .code {
    margin: 0;
    padding-block: var(--spacing-4, 1rem);
    color: var(--color-code-fg);
    font-family: var(--font-family-mono);
    font-size: var(--code-block-font-size, var(--font-size-sm, 0.875rem));
    line-height: 1.7;
    tab-size: 2;
    text-align: left;
    white-space: pre;
    direction: ltr;
  }

  /* As wide as the longest line, so line backgrounds reach across when scrolled. */
  .code code {
    display: inline-block;
    min-width: 100%;
    counter-reset: line;
    font: inherit;
  }

  .line {
    display: inline-block;
    width: 100%;
    min-height: 1lh;
    padding-inline: var(--spacing-4, 1rem);
  }

  .line[data-highlighted] {
    background: color-mix(in oklab, var(--color-accent) 12%, transparent);
    box-shadow: inset 2px 0 0 var(--color-accent);
  }

  /* Numbers come from CSS, so they are never selected, copied or read out. */
  .numbered .line {
    display: inline-grid;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .numbered .line::before {
    counter-increment: line;
    content: counter(line);
    content: counter(line) / '';
    min-width: calc(var(--_digits, 2) * 1ch);
    margin-inline-end: var(--spacing-4, 1rem);
    color: var(--color-code-comment);
    text-align: right;
    user-select: none;
  }

  .wrapped .code {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  .wrapped .code code {
    display: block;
  }
`

export const codeBlockStyles = [
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
      position: relative;
      overflow: hidden;
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-xl, 0.75rem);
      background: var(--color-code-bg);
      color: var(--color-code-fg);
    }

    .header {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-height: 2.75rem;
      padding-inline: var(--spacing-4, 1rem) var(--spacing-2, 0.5rem);
      border-bottom: 1px solid var(--color-border-subtle);
    }

    .filename {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      color: var(--color-fg-subtle);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs, 0.75rem);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .tabs {
      position: relative;
      display: flex;
      flex: 1;
      align-self: stretch;
      min-width: 0;
      margin-inline-start: calc(-1 * var(--spacing-2, 0.5rem));
      overflow-x: auto;
      isolation: isolate;
      scrollbar-width: none;
    }

    .tabs::-webkit-scrollbar {
      display: none;
    }

    .tab {
      position: relative;
      padding: 0 var(--spacing-3, 0.75rem);
      border: 0;
      background: transparent;
      color: var(--color-fg-subtle);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      white-space: nowrap;
      cursor: pointer;
      transition: color var(--duration-fast, 150ms) ease;
    }

    .tab:hover,
    .tab[aria-selected='true'] {
      color: var(--color-fg);
    }

    .tab:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -6px;
      border-radius: var(--radius-md, 0.375rem);
    }

    .indicator {
      position: absolute;
      top: 0;
      left: 0;
      z-index: -1;
      opacity: 0;
      pointer-events: none;
      transition:
        translate 250ms var(--ease-out-fluid, ease-out),
        width 250ms var(--ease-out-fluid, ease-out),
        opacity var(--duration-fast, 150ms) ease;
    }

    .indicator[data-visible] {
      opacity: 1;
    }

    .indicator::after {
      content: '';
      position: absolute;
      inset: auto var(--spacing-2, 0.5rem) 0;
      height: 2px;
      border-radius: 2px;
      background: var(--color-accent);
    }

    .body {
      position: relative;
    }

    .scroller {
      max-height: var(--code-block-max-height, none);
      overflow: auto;
      overscroll-behavior-x: contain;
    }

    .scroller:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    .copy-button.floating {
      position: absolute;
      top: var(--spacing-2, 0.5rem);
      right: var(--spacing-2, 0.5rem);
      border: 1px solid var(--color-border-subtle);
      background: var(--color-code-bg);
      opacity: 0;
      transition:
        opacity var(--duration-fast, 150ms) ease,
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease;
    }

    .body:hover .copy-button.floating,
    .copy-button.floating:focus-visible,
    .copy-button.floating[data-copied] {
      opacity: 1;
    }

    @media (hover: none) {
      .copy-button.floating {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .tab,
      .indicator,
      .copy-button.floating {
        transition: none;
      }
    }
  `,
]
