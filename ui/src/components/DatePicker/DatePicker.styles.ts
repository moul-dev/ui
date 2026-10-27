import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Layout and inner bits only; the shell look (fill, radius, shadow, hover,
   focus and invalid rings) comes from the shared fieldStyles appended last. */
export const datePickerStyles = [
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

    /* The calendar button carries the end inset, so the text stops short of it */
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
      font-variant-numeric: tabular-nums;
      padding-block: var(--spacing-2, 0.5rem);
      padding-inline: var(--spacing-3, 0.75rem) var(--spacing-2, 0.5rem);
    }

    [part~='trigger-btn'] {
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
      padding-inline: var(--spacing-1, 0.25rem) var(--spacing-3, 0.75rem);
      outline: none;
      -webkit-tap-highlight-color: transparent;
      transition: color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    @media (hover: hover) {
      [part~='trigger-btn']:hover:not(:disabled) {
        color: var(--color-field-fg);
      }
    }

    :host([is-open]) [part~='trigger-btn'] {
      color: var(--color-field-fg);
    }

    [part~='trigger-btn'] svg {
      width: 1rem;
      height: 1rem;
    }

    /* Calendar panel: a solid overlay surface; the calendar itself is unframed.
       The controller matches the panel to the field's width, so center it. */
    [part~='popover'] {
      margin: 0;
      border: none;
      border-radius: min(2rem, calc(var(--radius-base, 0.5rem) * 2.5));
      background-color: var(--color-bg-elevated);
      box-shadow: var(--shadow-overlay);
      color: var(--color-fg);
      z-index: var(--z-dropdown, 1000);
      outline: none;
      width: fit-content;
      text-align: center;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: none;
      padding: var(--spacing-3, 0.75rem);
    }

    [part~='popover'][hidden] {
      display: none !important;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='input-container'],
      [part~='trigger-btn'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
