import { type CSSResult, css, unsafeCSS } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/**
 * The card layout, written once and scoped to a host selector: `auto` gets it
 * below the container breakpoint, `cards` always. Each row becomes a card of
 * label and value pairs, labelled from `data-label` rather than extra markup.
 */
const cards = (host: string): CSSResult => {
  const h = unsafeCSS(host)
  return css`
    ${h} table,
    ${h} caption,
    ${h} thead,
    ${h} tbody,
    ${h} tbody td {
      display: block;
    }

    /* The header row turns into a strip of sort buttons and the select-all box */
    ${h} thead tr {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }

    ${h} th {
      width: auto !important;
      padding: var(--spacing-2, 0.5rem);
    }

    ${h} th:not([aria-sort], .checkbox-cell),
    ${h} th::after {
      display: none;
    }

    ${h} tbody tr {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-block-end: var(--spacing-2, 0.5rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
      border-radius: var(--_body-radius);
      background-color: var(--_bg, var(--color-surface));
    }

    ${h} .scroller {
      padding-block-start: var(--spacing-1, 0.25rem);
    }

    ${h} tbody tr:last-child {
      margin-block-end: 0;
    }

    ${h} tbody td {
      flex: 1 0 100%;
      padding: var(--spacing-1, 0.25rem) 0;
      border: 0;
      background: none;
    }

    ${h} td[data-label] {
      display: flow-root;
      text-align: end;
    }

    ${h} td[data-label]::before {
      content: attr(data-label);
      float: inline-start;
      margin-inline-end: var(--spacing-4, 1rem);
      color: var(--color-muted);
      font-size: var(--font-size-xs, 0.75rem);
    }

    /* Checkbox (start) and expand button (end) share the card's first line */
    ${h} td:is(.checkbox-cell, .expand-cell) {
      flex: 0 0 auto;
      order: -2;
      width: auto;
      padding-inline: 0;
    }

    ${h} td.expand-cell {
      order: -1;
      margin-inline-start: auto;
    }

    /* An open row and its details read as one card */
    ${h} tr.open {
      margin-block-end: 0;
      border-end-start-radius: 0;
      border-end-end-radius: 0;
    }

    ${h} tr.details-row,
    ${h} tr.details-row > td {
      padding: 0;
      border-start-start-radius: 0;
      border-start-end-radius: 0;
    }
  `
}

export const tableStyles = [
  resetStyles,
  css`
    /* Secondary-surface frame; header sits on the frame, the body is a white card inside it */
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;
      container-type: inline-size;
      font-family: var(--font-family-base, inherit);
      padding: 0 var(--spacing-1, 0.25rem) var(--spacing-1, 0.25rem);
      border-radius: min(2rem, calc(var(--radius-base, 0.5rem) * 2.5));
      background-color: var(--color-surface-secondary);
      /* HeroUI separator-tertiary at 50%: the hairline between body rows */
      --_row-separator: color-mix(
        in oklab,
        color-mix(in oklab, var(--color-surface) 81%, var(--color-fg) 19%) 50%,
        transparent
      );
      --_body-radius: var(--radius-2xl, 1rem);
      --_pad: var(--spacing-3, 0.75rem);
    }

    :host([is-dense]) {
      --_pad: var(--spacing-2, 0.5rem);
    }

    .toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      padding: var(--spacing-2, 0.5rem) var(--spacing-1, 0.25rem);
    }

    .toolbar moul-search-field {
      flex: 1 1 14rem;
      max-width: 22rem;
    }

    .toolbar moul-select {
      flex: 0 1 11rem;
      width: auto;
    }

    .toolbar-end {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      margin-inline-start: auto;
    }

    .scroller {
      overflow-x: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
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

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
    }

    button.th-content {
      padding: 0;
      border: 0;
      border-radius: var(--radius-xs, 0.125rem);
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    .sort-icon {
      display: inline-grid;
      place-content: center;
      width: 0.75rem;
      height: 0.75rem;
      opacity: 0.4;
      transition:
        transform var(--duration-base, 250ms) var(--ease-spring, ease-out),
        opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    .sort-icon.on {
      opacity: 1;
    }

    .sort-icon.desc {
      transform: rotate(180deg);
    }

    .sort-icon svg {
      width: 100%;
      height: 100%;
    }

    @media (hover: hover) {
      th[aria-sort]:hover {
        color: var(--color-fg);
      }

      th[aria-sort]:hover .sort-icon {
        opacity: 1;
      }

      tbody tr[part~="row"]:hover {
        --_bg: color-mix(in oklab, var(--color-surface) 40%, transparent);
      }

      [part~="expand-button"]:hover {
        color: var(--color-fg);
      }
    }

    .right {
      text-align: end;
      font-variant-numeric: tabular-nums;
    }

    .center {
      text-align: center;
    }

    /* Body cells carry the surface so the card's corners can be rounded per cell */
    td {
      padding: var(--_pad) var(--spacing-4, 1rem);
      vertical-align: middle;
      background-color: var(--_bg, var(--color-surface));
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

    /* Selection thins the surface so the frame shows through */
    tbody tr[part~="row"][aria-selected="true"] {
      --_bg: color-mix(in oklab, var(--color-surface) 10%, transparent);
    }

    .checkbox-cell,
    .expand-cell {
      width: 2.5rem;
      padding-inline: var(--spacing-2, 0.5rem);
      text-align: center;
    }

    input[type="checkbox"] {
      cursor: pointer;
      accent-color: var(--color-accent);
    }

    [part~="expand-button"] {
      display: inline-grid;
      place-content: center;
      width: 1.5rem;
      height: 1.5rem;
      padding: 0;
      border: 0;
      border-radius: var(--radius-sm, 0.25rem);
      background: none;
      color: var(--color-muted);
      cursor: pointer;
    }

    [part~="expand-button"] svg {
      width: 1rem;
      height: 1rem;
      transform: rotate(-90deg);
      transition: transform var(--duration-base, 250ms) var(--ease-spring, ease-out);
    }

    [part~="expand-button"][aria-expanded="true"] svg {
      transform: none;
    }

    /* An open row and its details read as one block */
    tr.open td {
      border-bottom-color: transparent;
    }

    .details-row > td {
      padding: 0;
    }

    .details {
      overflow: hidden;
    }

    [part~="details"] {
      padding: var(--_pad) var(--spacing-4, 1rem);
    }

    /* Outside the table so it spans the visible width, not the scroll width */
    .empty-cell {
      position: sticky;
      inset-inline-start: 0;
      padding: var(--spacing-8, 2rem);
      border-radius: var(--_body-radius);
      background-color: var(--color-surface);
      text-align: center;
      color: var(--color-muted);
    }

    ::slotted([slot="footer"]) {
      display: block;
      padding: 0.625rem var(--spacing-4, 1rem);
    }

    /* Utilities for render() templates, which land in this shadow root, not the page's */
    .mono {
      font-family: var(--font-family-mono, ui-monospace, monospace);
    }

    .muted {
      color: var(--color-muted);
    }

    .small {
      font-size: 0.8125rem;
    }

    .nowrap {
      white-space: nowrap;
    }

    /* One line cut with an ellipsis; pair it with a title attribute for the full value */
    .truncate {
      display: inline-block;
      max-width: var(--table-truncate-width, 16rem);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: middle;
    }

    .sr-only,
    moul-search-field::part(label),
    moul-select::part(label) {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @container (width < 30rem) {
      ${cards(':host([layout="auto"])')}
    }

    ${cards(':host([layout="cards"])')}

    @media (prefers-reduced-motion: reduce) {
      th,
      .sort-icon,
      [part~="expand-button"] svg {
        transition: none;
      }
    }
  `,
]
