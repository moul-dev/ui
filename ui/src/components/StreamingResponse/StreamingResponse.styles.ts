import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'
import { copyButtonStyles } from '../CodeBlock/code-view'

/** Typography for rendered Markdown, shared with anything else that shows an answer. */
export const proseStyles = css`
  .content {
    min-width: 0;
    font-size: var(--font-size-md, 1rem);
    line-height: 1.7;
    color: var(--color-fg);
    overflow-wrap: anywhere;
  }

  .content > :first-child {
    margin-top: 0;
  }

  .content > :last-child {
    margin-bottom: 0;
  }

  p {
    margin: 0 0 var(--spacing-3, 0.75rem);
  }

  .heading {
    margin: var(--spacing-5, 1.25rem) 0 var(--spacing-2, 0.5rem);
    font-weight: var(--font-weight-semibold, 600);
    line-height: 1.35;
    color: var(--color-fg);
  }

  .h1 {
    font-size: var(--font-size-xl, 1.25rem);
  }

  .h2 {
    font-size: var(--font-size-lg, 1.125rem);
  }

  .h3,
  .h4,
  .h5,
  .h6 {
    font-size: var(--font-size-md, 1rem);
  }

  ul,
  ol {
    margin: 0 0 var(--spacing-3, 0.75rem);
    padding-inline-start: 1.5em;
  }

  li {
    margin: var(--spacing-1, 0.25rem) 0;
  }

  li > p {
    margin-bottom: var(--spacing-1, 0.25rem);
  }

  li::marker {
    color: var(--color-fg-subtle);
  }

  ul.tasks {
    padding-inline-start: 0.25em;
    list-style: none;
  }

  li.task {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-2, 0.5rem);
  }

  li.task input {
    margin: 0;
    accent-color: var(--color-accent);
    translate: 0 0.125em;
  }

  blockquote {
    margin: 0 0 var(--spacing-3, 0.75rem);
    padding-inline-start: var(--spacing-3, 0.75rem);
    border-inline-start: 3px solid var(--color-border);
    color: var(--color-fg-subtle);
  }

  hr {
    margin: var(--spacing-5, 1.25rem) 0;
    border: 0;
    border-top: 1px solid var(--color-border);
  }

  a {
    color: var(--color-link, var(--color-accent));
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 0.18em;
  }

  a:focus-visible {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
    border-radius: var(--radius-xs, 0.125rem);
  }

  .image-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
  }

  .image-icon {
    width: 1em;
    height: 1em;
    flex-shrink: 0;
  }

  .inline-code {
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm, 0.25rem);
    background: var(--color-code-bg);
    color: var(--color-code-fg);
    font-family: var(--font-family-mono, ui-monospace, monospace);
    font-size: 0.875em;
  }

  .code {
    display: block;
    margin: 0 0 var(--spacing-3, 0.75rem);
  }

  .table-wrap {
    max-width: 100%;
    margin: 0 0 var(--spacing-3, 0.75rem);
    overflow-x: auto;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 0.5rem);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-sm, 0.875rem);
    line-height: var(--line-height-sm, 1.25rem);
  }

  th,
  td {
    padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    text-align: start;
    vertical-align: top;
    border-bottom: 1px solid var(--color-border);
  }

  th {
    font-weight: var(--font-weight-semibold, 600);
    background: var(--color-bg-subtle);
  }

  tbody tr:last-child td {
    border-bottom: 0;
  }

  .citation {
    display: inline-grid;
    place-items: center;
    min-width: 1.35em;
    height: 1.35em;
    margin-inline: 0.15em;
    padding: 0 0.3em;
    border-radius: var(--radius-full, 9999px);
    background: var(--color-default-soft, var(--color-bg-subtle));
    color: var(--color-fg-subtle);
    font-size: 0.7em;
    font-weight: var(--font-weight-medium, 500);
    line-height: 1;
    text-decoration: none;
    vertical-align: 0.25em;
    transition:
      background-color var(--duration-fast, 150ms) ease,
      color var(--duration-fast, 150ms) ease;
  }

  a.citation:hover {
    background: var(--color-accent-soft);
    color: var(--color-accent-soft-fg);
  }
`

export const streamingResponseStyles = [
  resetStyles,
  copyButtonStyles,
  proseStyles,
  css`
    :host {
      display: block;
      min-width: 0;
    }

    .base {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3, 0.75rem);
      min-width: 0;
    }

    .caret {
      display: inline-block;
      width: 0.55em;
      height: 0.55em;
      margin-inline-start: 0.2em;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-fg);
      vertical-align: 0.05em;
      animation: moul-caret-pulse 1s var(--ease-smooth, ease-in-out) infinite;
    }

    .caret-line {
      margin: 0;
    }

    @keyframes moul-caret-pulse {
      0%,
      100% {
        opacity: 1;
        scale: 1;
      }
      50% {
        opacity: 0.35;
        scale: 0.8;
      }
    }

    .error {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
      background: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .error-icon {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .error-text {
      flex: 1;
      min-width: 0;
    }

    .retry {
      flex-shrink: 0;
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border: 0;
      border-radius: var(--radius-sm, 0.25rem);
      background: transparent;
      color: inherit;
      font: inherit;
      font-weight: var(--font-weight-medium, 500);
      text-decoration: underline;
      cursor: pointer;
    }

    .retry:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .sources {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
    }

    .sources-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg-subtle);
    }

    .source-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-2, 0.5rem);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .source {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      max-width: 16rem;
      padding: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem) var(--spacing-1, 0.25rem)
        var(--spacing-1, 0.25rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full, 9999px);
      background: var(--color-surface);
      color: var(--color-fg);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: 1.3;
      text-decoration: none;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        border-color var(--duration-fast, 150ms) ease;
    }

    a.source:hover {
      background: var(--color-surface-hover);
      border-color: var(--color-border-focus, var(--color-border));
    }

    a.source:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    .source-index {
      display: grid;
      flex-shrink: 0;
      place-items: center;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-full, 9999px);
      background: var(--color-default-soft, var(--color-bg-subtle));
      color: var(--color-fg-subtle);
      font-weight: var(--font-weight-medium, 500);
    }

    .source-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .source-title,
    .source-meta {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .source-title {
      font-weight: var(--font-weight-medium, 500);
    }

    .source-meta {
      color: var(--color-fg-subtle);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      margin-inline-start: calc(-1 * var(--spacing-2, 0.5rem));
      animation: moul-actions-in 240ms var(--ease-out, ease-out) both;
    }

    .actions[hidden] {
      display: none;
    }

    /* The copy button's ghost look, for every action. */
    .action {
      display: inline-grid;
      flex-shrink: 0;
      place-items: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-md, 0.375rem);
      background: transparent;
      color: var(--color-fg-subtle);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) ease,
        color var(--duration-fast, 150ms) ease;
    }

    .action:hover {
      background: var(--color-fill-hover);
      color: var(--color-fg);
    }

    .action:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .action svg {
      width: 1rem;
      height: 1rem;
    }

    .action[aria-pressed='true'] {
      color: var(--color-accent);
    }

    @keyframes moul-actions-in {
      from {
        opacity: 0;
        translate: 0 2px;
      }
      to {
        opacity: 1;
        translate: 0 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .caret,
      .actions {
        animation: none;
      }

      .citation,
      .source,
      .action {
        transition: none;
      }
    }
  `,
]
