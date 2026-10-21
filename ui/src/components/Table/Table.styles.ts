import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tableStyles = [
  resetStyles,
  css`
    /* Secondary-surface frame; header sits on the frame, the body is a white card inside it */
    :host {
      display: block;
      width: 100%;
      overflow-x: auto;
      box-sizing: border-box;
      font-family: var(--font-family-base, inherit);
      padding: 0 var(--spacing-1, 0.25rem) var(--spacing-1, 0.25rem);
      border-radius: min(2rem, calc(var(--radius-base, 0.5rem) * 2.5));
      background-color: var(--color-surface-secondary);
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      /* HeroUI separator-tertiary at 50%: the hairline between body rows */
      --_row-separator: color-mix(
        in oklab,
        color-mix(in oklab, var(--color-surface) 81%, var(--color-fg) 19%) 50%,
        transparent
      );
      --_body-radius: var(--radius-2xl, 1rem);
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      text-align: start;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-fg, inherit);
    }

    thead {
      background-color: transparent;
    }

    /* Column headers: small muted labels with a short separator between columns */
    th {
      position: relative;
      padding: 0.625rem var(--spacing-4, 1rem);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
      user-select: none;
      text-align: start;
      white-space: nowrap;
      transition: color var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    th::after {
      content: "";
      position: absolute;
      inset-inline-end: 0;
      top: 50%;
      width: 1px;
      height: 1rem;
      transform: translateY(-50%);
      border-radius: var(--radius-sm, 0.25rem);
      background-color: var(--color-separator);
      pointer-events: none;
    }

    th:last-child::after {
      content: none;
    }

    th[aria-sort] {
      cursor: pointer;
    }

    @media (hover: hover) {
      th[aria-sort]:hover {
        color: var(--color-fg);
      }
    }

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
    }

    .sort-icon {
      display: inline-grid;
      place-content: center;
      width: 0.75rem;
      height: 0.75rem;
      transition: transform 100ms var(--ease-out, ease-out);
    }

    .sort-icon.desc {
      transform: rotate(180deg);
    }

    .sort-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Body cells carry the surface so the card's corners can be rounded per cell */
    td {
      padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
      vertical-align: middle;
      background-color: var(--color-surface);
      border-bottom: 1px solid var(--_row-separator);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:first-child td:first-child {
      border-start-start-radius: var(--_body-radius);
    }

    tbody tr:first-child td:last-child {
      border-start-end-radius: var(--_body-radius);
    }

    tbody tr:last-child td:first-child {
      border-end-start-radius: var(--_body-radius);
    }

    tbody tr:last-child td:last-child {
      border-end-end-radius: var(--_body-radius);
    }

    /* Hover and selection thin the surface so the frame shows through */
    @media (hover: hover) {
      tbody tr[part~="row"]:hover td {
        background-color: color-mix(in oklab, var(--color-surface) 40%, transparent);
      }
    }

    tbody tr[part~="row"][aria-selected="true"] td {
      background-color: color-mix(in oklab, var(--color-surface) 10%, transparent);
    }

    .checkbox-cell {
      width: 2.5rem;
      padding-inline: var(--spacing-2, 0.5rem);
      text-align: center;
    }

    .empty-cell {
      padding: var(--spacing-8, 2rem);
      text-align: center;
      color: var(--color-muted);
    }

    /* Footer sits on the frame, below the body card */
    tfoot {
      background-color: transparent;
    }

    ::slotted([slot="footer"]) {
      padding: 0.625rem var(--spacing-4, 1rem);
    }

    input[type="checkbox"] {
      cursor: pointer;
      accent-color: var(--color-accent);
    }

    @media (prefers-reduced-motion: reduce) {
      th,
      .sort-icon {
        transition: none;
      }
    }
  `,
]
