import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/*
 * The accordion styles its items from outside through `::slotted()` and two
 * private custom properties the items read: `--_accordion-divider` (the rule
 * between items) and `--_accordion-inset` (the header and panel side padding).
 */
export const accordionStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
    }

    [part~="base"] {
      display: flex;
      flex-direction: column;
    }

    ::slotted(moul-accordion-item) {
      --_accordion-divider: 1px;
      --_accordion-inset: 0px;
    }

    /* Separated: every item is its own raised surface */
    :host([variant="separated"]) [part~="base"] {
      gap: var(--spacing-2, 0.5rem);
    }

    :host([variant="separated"]) ::slotted(moul-accordion-item) {
      --_accordion-divider: 0px;
      --_accordion-inset: var(--spacing-4, 1rem);
      background-color: var(--color-surface);
      border-radius: var(--radius-2xl, 1rem);
      box-shadow: var(--shadow-surface);
    }

    /* Bordered: one framed list, divided inside */
    :host([variant="bordered"]) [part~="base"] {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-2xl, 1rem);
    }

    :host([variant="bordered"]) ::slotted(moul-accordion-item) {
      --_accordion-inset: var(--spacing-4, 1rem);
    }
  `,
]

export const accordionItemStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    :host(:not(:first-of-type)) {
      border-top: var(--_accordion-divider, 0px) solid var(--color-separator);
    }

    [part~="heading"] {
      margin: 0;
    }

    [part~="trigger"] {
      display: flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      width: 100%;
      padding: var(--spacing-4, 1rem) var(--_accordion-inset, 0px);
      font-size: var(--font-size-md, 1rem);
      line-height: var(--line-height-md, 1.5rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg);
      text-align: start;
      background: transparent;
      border: none;
      border-radius: var(--radius-lg, 0.5rem);
      cursor: pointer;
      user-select: none;
    }

    [part~="trigger"]:disabled {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    [part~="prefix"] {
      display: inline-flex;
      flex-shrink: 0;
      color: var(--color-muted);
    }

    [part~="label"] {
      flex: 1;
      min-width: 0;
    }

    [part~="indicator"] {
      display: inline-flex;
      flex-shrink: 0;
      width: 1.125rem;
      height: 1.125rem;
      color: var(--color-muted);
      transition:
        rotate var(--duration-slow, 400ms) var(--ease-spring, ease-out),
        color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~="indicator"] svg {
      width: 100%;
      height: 100%;
    }

    :host([is-open]) [part~="indicator"] {
      rotate: 180deg;
    }

    @media (hover: hover) {
      [part~="trigger"]:hover:not(:disabled) [part~="indicator"] {
        color: var(--color-fg);
      }
    }

    /* Clipped only while the height springs; an open panel lets focus rings and menus out */
    [part~="panel"][data-animating] {
      overflow: hidden;
    }

    [part~="content"] {
      padding: 0 var(--_accordion-inset, 0px) var(--spacing-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-muted);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="indicator"] {
        transition: none;
      }
    }
  `,
]
