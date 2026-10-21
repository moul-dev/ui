import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Layout and inner bits only; the trigger's shell look (fill, radius, shadow,
   hover, focus and invalid rings) comes from the shared fieldStyles appended last. */
export const selectStyles = [
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

    /* The chevron rides in the flow, so the end padding is shorter than the start */
    [part~='trigger'] {
      display: flex;
      align-items: center;
      width: 100%;
      min-width: 0;
      min-height: 2.25rem;
      margin: 0;
      padding-block: var(--spacing-2, 0.5rem);
      padding-inline: var(--spacing-3, 0.75rem) var(--spacing-2, 0.5rem);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      text-align: start;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    [part~='value'] {
      flex: 1;
      min-width: 0;
      text-align: start;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    [part~='value'][data-placeholder] {
      color: var(--color-field-placeholder);
    }

    [part~='chevron'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--color-field-placeholder);
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      margin-inline-start: var(--spacing-1, 0.25rem);
      transition: transform var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~='chevron'] svg {
      width: 100%;
      height: 100%;
    }

    :host([is-open]) [part~='chevron'] {
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

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='trigger'],
      [part~='chevron'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]

/* List rows: rounded, a neutral wash on hover, a focus ring for keyboard
   navigation, and a trailing check on the selected row. */
export const selectItemStyles = [
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
        transform 250ms var(--ease-out, ease-out),
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

    [part~='check'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--color-default-fg);
      width: 0.875rem;
      height: 0.875rem;
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
