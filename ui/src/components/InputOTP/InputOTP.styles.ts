import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Each slot is its own field shell (fill, radius, shadow, focus ring from the
   shared fieldStyles appended last); hover and invalid are added here because
   the shared shell only covers grouped inputs. */
export const inputOtpStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2, 0.5rem);
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

    [part~='group'] {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: var(--spacing-2, 0.5rem);
    }

    [part~='slot'] {
      position: relative;
      width: 2.375rem;
      min-width: 0;
      height: 2.5rem;
      margin: 0;
      padding: 0;
      font-family: inherit;
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      line-height: var(--line-height-md, 1.5rem);
      font-variant-numeric: tabular-nums;
      text-align: center;
      caret-color: var(--color-field-placeholder);
    }

    /* Lift the focused slot so its ring isn't covered by its neighbour */
    [part~='slot']:focus {
      z-index: 1;
    }

    @media (hover: hover) {
      [part~='slot']:hover:not(:disabled):not(:focus) {
        background-color: var(--color-field-hover);
      }
    }

    :host([is-invalid]:is([data-touched], [error-message]:not([error-message='']))) [part~='slot'] {
      box-shadow: 0 0 0 1px var(--color-danger), var(--shadow-field);
    }

    :host([is-invalid]:is([data-touched], [error-message]:not([error-message='']))) [part~='slot']:focus {
      box-shadow: var(--focus-ring-invalid), var(--shadow-field);
    }

    [part~='slot']:disabled {
      cursor: not-allowed;
    }

    /* A short rule between slot groups instead of a typed dash */
    [part~='separator'] {
      display: inline-block;
      flex-shrink: 0;
      width: 6px;
      height: 2px;
      border-radius: var(--radius-sm, 0.25rem);
      background-color: var(--color-separator);
      color: transparent;
      font-size: 0;
      line-height: 0;
      overflow: hidden;
      user-select: none;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='slot'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
