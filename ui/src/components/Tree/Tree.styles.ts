import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const treeStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-size: var(--font-size-sm, 0.875rem);
    }
  `,
]

/* Each level is indented by the group's start padding. A nested item draws
   its own guide in that padding: a spine down from the parent's chevron
   (cut short on the last sibling) and a rounded branch into its row. */
export const treeItemStyles = [
  resetStyles,
  css`
    :host {
      --_row: var(--spacing-8, 2rem);
      --_indent: var(--moul-tree-indent, 1.5rem);
      /* The parent's chevron centre: row padding plus half the toggle. */
      --_spine: calc(var(--spacing-2, 0.5rem) + 0.5rem);
      --_guide: var(--moul-tree-guide-color, var(--color-border));
      position: relative;
      display: block;
      outline: none;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      min-height: var(--_row);
      padding-inline: var(--spacing-2, 0.5rem);
      border-radius: var(--radius-lg, 0.5rem);
      color: var(--color-fg);
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-out, ease-out),
        color var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      :host(:not([is-disabled])) .row:hover {
        background-color: var(--color-default);
      }

      :host([is-selected]:not([is-disabled])) .row:hover {
        background-color: var(--color-accent-soft-hover);
      }
    }

    :host([is-selected]) .row {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    :host(:focus-visible) .row {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }

    :host([is-disabled]) .row {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    .toggle {
      display: inline-flex;
      flex: none;
      width: 1rem;
      height: 1rem;
      color: var(--color-muted);
    }

    .chevron {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
      transition: transform var(--duration-base, 250ms) var(--ease-spring, ease-out);
    }

    :host(:dir(rtl)) .chevron {
      transform: rotate(90deg);
    }

    :host([is-expanded]) .chevron {
      transform: none;
    }

    ::slotted([slot='prefix']) {
      display: inline-flex;
      flex: none;
      align-items: center;
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    ::slotted([slot='suffix']) {
      flex: none;
      color: var(--color-muted);
      font-size: var(--font-size-xs, 0.75rem);
    }

    :host([is-selected]) ::slotted([slot='suffix']) {
      color: inherit;
    }

    .group {
      padding-inline-start: var(--_indent);
    }

    .group[data-animating] {
      overflow: hidden;
    }

    .guide {
      display: none;
    }

    :host([aria-level]:not([aria-level='1'])) .guide {
      display: block;
      position: absolute;
      inset-block: 0;
      inset-inline-start: calc(var(--_spine) - var(--_indent) - 0.5px);
      width: calc(var(--_indent) - var(--_spine));
      border-inline-start: 1px solid var(--_guide);
      pointer-events: none;
    }

    .guide::after {
      content: '';
      position: absolute;
      top: 0;
      inset-inline-start: -1px;
      width: calc(100% + 1px);
      height: calc(var(--_row) / 2);
      border-inline-start: 1px solid var(--_guide);
      border-block-end: 1px solid var(--_guide);
      border-end-start-radius: var(--radius-md, 0.375rem);
    }

    :host([aria-level]:not([aria-level='1'])) .guide.last {
      bottom: auto;
      height: calc(var(--_row) / 2);
      border-inline-start-color: transparent;
    }

    @media (prefers-reduced-motion: reduce) {
      .row,
      .chevron {
        transition: none;
      }
    }
  `,
]
