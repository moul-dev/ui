import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const historyLedgerStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      container-type: inline-size;
      color: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    :host([hidden]) {
      display: none;
    }

    /* A history list sits beside work; the current version is marked, not pulsing. */
    moul-timeline-item::part(marker)::after {
      display: none;
    }

    .heading {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
    }

    .title {
      color: var(--color-fg);
      font-weight: var(--font-weight-semibold, 600);
      border-radius: var(--radius-sm, 0.25rem);
      outline: none;
    }

    .title:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }

    .meta {
      display: inline-flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      color: var(--color-fg-subtle);
    }

    .author {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      color: var(--color-fg);
    }

    .author + time::before {
      content: '·';
      margin-inline-end: var(--spacing-2, 0.5rem);
      color: var(--color-muted);
    }

    time {
      white-space: nowrap;
    }

    .summary {
      margin: 0;
      color: var(--color-fg);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      margin-block-start: var(--spacing-2, 0.5rem);
    }

    .restore {
      margin-inline-start: auto;
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      margin-inline-start: calc(var(--spacing-2, 0.5rem) * -1);
      padding: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      border: 0;
      border-radius: var(--radius-md, 0.375rem);
      background: transparent;
      color: var(--color-fg-subtle);
      font: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      cursor: pointer;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        color var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      .toggle:hover {
        background: var(--color-default);
        color: var(--color-fg);
      }
    }

    .toggle:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 1px;
    }

    .chevron {
      inline-size: 0.875rem;
      block-size: 0.875rem;
      transform: rotate(-90deg);
      transition: transform var(--duration-base, 250ms) var(--ease-spring, ease-out);
    }

    :host(:dir(rtl)) .chevron {
      transform: rotate(90deg);
    }

    .toggle[aria-expanded='true'] .chevron {
      transform: none;
    }

    .changes[data-animating] {
      overflow: hidden;
    }

    .change-list {
      display: grid;
      gap: var(--spacing-2, 0.5rem);
      margin: var(--spacing-2, 0.5rem) 0 0;
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      border: 1px solid var(--color-border-subtle);
      border-radius: var(--radius-lg, 0.5rem);
      background: var(--color-surface-secondary);
      list-style: none;
    }

    .change {
      display: grid;
      grid-template-columns: minmax(5rem, 30%) minmax(0, 1fr);
      align-items: baseline;
      gap: var(--spacing-3, 0.75rem);
    }

    @container (max-width: 24rem) {
      .change {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--spacing-1, 0.25rem);
      }
    }

    .field {
      overflow-wrap: anywhere;
      color: var(--color-fg-subtle);
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
    }

    .values {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      min-inline-size: 0;
    }

    .before,
    .after {
      padding: 0 var(--spacing-1, 0.25rem);
      border-radius: var(--radius-sm, 0.25rem);
      overflow-wrap: anywhere;
    }

    .before {
      background: var(--color-danger-soft);
      color: var(--color-danger-soft-fg);
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }

    .after {
      background: var(--color-success-soft);
      color: var(--color-success-soft-fg);
      text-decoration: none;
    }

    .empty-value {
      font-style: italic;
      opacity: 0.8;
    }

    .arrow {
      color: var(--color-muted);
    }

    :host(:dir(rtl)) .arrow {
      display: inline-block;
      transform: scaleX(-1);
    }

    .empty {
      padding: var(--spacing-4, 1rem);
      color: var(--color-fg-subtle);
      text-align: center;
    }

    .sr-only {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle,
      .chevron {
        transition: none;
      }
    }
  `,
]
