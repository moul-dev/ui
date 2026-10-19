import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const breadcrumbsStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    [part~="base"] {
      display: flex;
      padding: 0;
      margin: 0;
    }

    [part~="list"] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      list-style: none;
      padding: 0;
      margin: 0;
      gap: var(--spacing-1, 0.25rem);
    }
  `,
]

export const breadcrumbItemStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg-subtle, #6b7280);
      font-family: inherit;
    }

    [part~="item"] {
      display: inline-flex;
      align-items: center;
      list-style: none;
    }

    [part~="link"] {
      color: inherit;
      text-decoration: none;
      transition: color 0.15s ease;
      cursor: pointer;
    }

    [part~="link"]:hover {
      text-decoration: underline;
      color: var(--color-fg, #111827);
    }

    [part~="link"]:focus-visible {
      outline: 2px solid var(--color-border-focus, #3b82f6);
      outline-offset: 2px;
      border-radius: var(--radius-xs, 0.125rem);
    }

    :host([is-current]) [part~="text"],
    [aria-current="page"] {
      color: var(--color-fg, #111827);
      font-weight: 600;
      pointer-events: none;
    }

    [part~="separator"] {
      display: inline-flex;
      align-items: center;
      margin-inline-start: var(--spacing-1, 0.25rem);
      margin-inline-end: var(--spacing-1, 0.25rem);
      color: var(--color-fg-subtle, #9ca3af);
      user-select: none;
    }

    :host(:last-of-type) [part~="separator"],
    :host(:last-child) [part~="separator"] {
      display: none !important;
    }
  `,
]
