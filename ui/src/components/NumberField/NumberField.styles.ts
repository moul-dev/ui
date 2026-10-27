import { css } from 'lit'
import { fieldStyles } from '../../styles/field.styles'
import { resetStyles } from '../../styles/reset.styles'

/* Layout and inner bits only; the shell look (fill, radius, shadow, hover,
   focus and invalid rings) comes from the shared fieldStyles appended last. */
export const numberFieldStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
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

    /* Stretch so the stepper column fills the shell; overflow clips it to the radius */
    [part~='input-container'] {
      display: flex;
      align-items: stretch;
      position: relative;
      width: 100%;
      min-height: 2.25rem;
      overflow: hidden;
      font-size: var(--font-size-sm, 0.875rem);
    }

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
      padding: var(--spacing-2, 0.5rem) var(--spacing-3, 0.75rem);
    }

    [part~='input']:-webkit-autofill {
      box-shadow: 0 0 0 1000px transparent inset;
      -webkit-text-fill-color: var(--color-field-fg);
      caret-color: var(--color-field-fg);
      transition: background-color 9999s ease-in-out 0s;
    }

    [part~='prefix'],
    [part~='suffix'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Steppers: a flush column split by hairlines in the placeholder tint */
    [part~='stepper-group'] {
      display: flex;
      flex-direction: column;
      width: 2rem;
      flex-shrink: 0;
      border-inline-start: 1px solid
        color-mix(in oklab, var(--color-field-placeholder) 15%, transparent);
    }

    [part~='stepper-btn'] {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-height: 0;
      border: none;
      border-radius: 0;
      background: transparent;
      color: var(--color-field-fg);
      cursor: pointer;
      padding: 0;
      font-size: 0.5625rem;
      line-height: 1;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      transition:
        background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
        color var(--duration-fast, 150ms) var(--ease-smooth, ease);
    }

    [part~='stepper-btn-up'] {
      border-bottom: 1px solid
        color-mix(in oklab, var(--color-field-placeholder) 15%, transparent);
    }

    @media (hover: hover) {
      [part~='stepper-btn']:hover:not(:disabled) {
        background-color: color-mix(in oklab, var(--color-field-fg) 5%, transparent);
      }
    }

    [part~='stepper-btn']:active:not(:disabled) {
      background-color: color-mix(in oklab, var(--color-field-fg) 10%, transparent);
    }

    [part~='stepper-btn']:disabled {
      cursor: not-allowed;
      opacity: var(--disabled-opacity, 0.5);
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* The host already dims; don't dim the steppers a second time */
    :host([is-disabled]) [part~='stepper-btn']:disabled {
      opacity: 1;
    }

    /* :host raises specificity past the shared shell's transition */
    @media (prefers-reduced-motion: reduce) {
      :host [part~='input-container'],
      [part~='stepper-btn'] {
        transition: none;
      }
    }
  `,
  fieldStyles,
]
