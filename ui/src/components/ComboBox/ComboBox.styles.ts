import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Layout and inner bits only; the shell look (fill, radius, shadow, hover,
   focus and invalid rings) comes from the shared fieldStyles appended last. */
export const comboBoxStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      position: relative;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    /* Flex drops template whitespace so the required mark sits tight to the text */
    [part~='label'] {
      display: flex;
      align-items: baseline;
      width: fit-content;
      line-height: var(--line-height-sm, 1.25rem);
    }

    :host([is-required][label]:not([label=''])) [part~='label']::after {
      content: '*';
      margin-inline-start: 0.125rem;
      color: var(--color-danger);
    }

    :host([is-invalid]:is([data-touched], [error-message]:not([error-message='']))) [part~='label'] {
      color: var(--color-danger);
    }

    [part~='input-container'] {
      display: flex;
      align-items: center;
      position: relative;
      width: 100%;
      min-height: 2.25rem;
      font-size: var(--font-size-sm, 0.875rem);
    }

    /* The toggle rides in the flow and carries the end inset itself */
    [part~='input'] {
      flex: 1;
      width: 100%;
      min-width: 0;
      border: none;
      border-radius: 0;
      outline: none;
      background: transparent;
      box-shadow: none;
      color: inherit;
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      padding-block: var(--spacing-2, 0.5rem);
      padding-inline: var(--spacing-3, 0.75rem) 0;
    }

    [part~='toggle-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      align-self: stretch;
      flex-shrink: 0;
      margin: 0;
      border: none;
      background: transparent;
      color: var(--color-field-placeholder);
      cursor: pointer;
      padding-inline: var(--spacing-1, 0.25rem) var(--spacing-2, 0.5rem);
      outline: none;
      -webkit-tap-highlight-color: transparent;
      transition: color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~='toggle-btn'] svg {
      width: 1rem;
      height: 1rem;
      transition: transform var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    @media (hover: hover) {
      [part~='toggle-btn']:hover:not(:disabled) {
        color: var(--color-field-fg);
      }
    }

    [part~='toggle-btn']:active:not(:disabled) {
      opacity: 0.7;
    }

    :host([is-open]) [part~='toggle-btn'] svg {
      transform: rotate(180deg);
    }

    /* Listbox panel: a solid overlay surface; geometry is set by the overlay
       controller against the trigger */
    [part~='popover'] {
      margin: 0;
      border: none;
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--color-bg-elevated);
      box-shadow: var(--shadow-overlay);
      color: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      z-index: var(--z-dropdown, 1000);
      outline: none;
      min-width: 8rem;
      max-height: 16rem;
      overflow-y: auto;
      overscroll-behavior: contain;
      scroll-padding-block: var(--spacing-1, 0.25rem);
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      padding: 0.375rem;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
    }

    [part~='popover'][hidden] {
      display: none !important;
    }

    [part~='empty'] {
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      color: var(--color-muted);
      text-align: center;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='input-container'],
      [part~='toggle-btn'],
      [part~='toggle-btn'] svg {
        transition: none;
      }
    }
  `,
  fieldStyles,
]

/* List rows: rounded, a neutral wash on hover, and a focus ring for keyboard
   navigation. */
export const comboBoxItemStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
      -webkit-user-select: none;
      outline: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='item'] {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--spacing-3, 0.75rem);
      min-height: 2.25rem;
      width: 100%;
      padding: 0.375rem 0.625rem;
      border-radius: var(--radius-2xl, 1rem);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      -webkit-tap-highlight-color: transparent;
      transition:
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='item']:hover:not([data-disabled]) {
        background-color: var(--color-default);
      }
    }

    :host([is-active]) [part~='item'] {
      background-color: var(--color-default);
    }

    :host(:focus-visible) [part~='item'] {
      box-shadow: var(--focus-ring);
    }

    [part~='item']:active:not([data-disabled]) {
      transform: scale(0.98);
    }

    /* Trailing check on the selected row, drawn in CSS to match the select list */
    :host([aria-selected='true']) [part~='item']::after {
      content: '';
      flex-shrink: 0;
      width: 0.875rem;
      height: 0.875rem;
      background-color: var(--color-default-fg);
      -webkit-mask: var(--_check) center / contain no-repeat;
      mask: var(--_check) center / contain no-repeat;
      --_check: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='item'] {
        transition: none;
      }

      [part~='item']:active:not([data-disabled]) {
        transform: none;
      }
    }
  `,
]
