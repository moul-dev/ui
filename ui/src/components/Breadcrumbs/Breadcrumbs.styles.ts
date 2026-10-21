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
      gap: 0.375rem;
    }
  `,
]

export const breadcrumbItemStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      align-items: center;
      flex-shrink: 0;
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
    }

    [part~="item"] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      list-style: none;
    }

    [part~="link"] {
      color: inherit;
      text-decoration: none;
      border-radius: var(--radius-sm, 0.25rem);
      outline: none;
      cursor: pointer;
      transition:
        color 100ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~="link"]:hover {
        text-decoration: underline;
      }
    }

    [part~="link"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    :host([is-current]) [part~="text"],
    [aria-current="page"] {
      color: var(--color-link, var(--color-fg));
      pointer-events: none;
    }

    [part~="separator"] {
      display: inline-flex;
      align-items: center;
      color: var(--color-muted);
      user-select: none;
    }

    [part~="separator"] ::slotted(svg) {
      width: 0.75rem;
      height: 0.75rem;
    }

    [part~="separator"]:dir(rtl) ::slotted(svg) {
      rotate: 180deg;
    }

    :host(:last-of-type) [part~="separator"],
    :host(:last-child) [part~="separator"] {
      display: none !important;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="link"] {
        transition: none;
      }
    }
  `,
]
