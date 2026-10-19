/**
 * Moul UI - Shared field surface
 * One look for every text-entry control (text, number, search, textarea, select,
 * combobox, date picker): a softly recessed fill that brightens on hover and lifts
 * onto a glassy surface with a focus halo. Appended after each component's own
 * styles so it wins the cascade without !important.
 */
import { type CSSResultGroup, css } from 'lit'

export const fieldStyles: CSSResultGroup = css`
  [part~='label'] {
    font-size: var(--font-size-sm, 0.875rem);
    font-weight: var(--font-weight-medium, 500);
    color: var(--color-fg, inherit);
  }

  [part~='input-container'],
  [part~='textarea'],
  [part~='trigger'],
  [part~='slot'] {
    border: none;
    border-radius: calc(0.625rem * var(--brand-radius-factor, 1));
    background-color: var(--color-fill-hover);
    box-shadow:
      inset 0 0 0 1px var(--color-border-glass),
      inset 0 1px 2px light-dark(oklch(0 0 0 / 0.04), oklch(0 0 0 / 0.25));
    outline: none;
    transition:
      background-color var(--duration-fast, 140ms) ease,
      box-shadow var(--duration-fast, 140ms) ease;
  }

  [part~='input-container']:hover:not([data-disabled]),
  [part~='textarea']:hover:not(:disabled),
  [part~='trigger']:hover:not(:disabled) {
    background-color: var(--color-fill-pressed);
  }

  [part~='input-container']:focus-within:not([data-disabled]),
  [part~='textarea']:focus-visible,
  [part~='textarea']:focus,
  [part~='trigger']:focus-visible,
  [part~='slot']:focus {
    outline: none;
    background-color: light-dark(oklch(1 0 0), oklch(0.24 0 0));
    box-shadow:
      inset 0 0 0 1px var(--color-border-focus),
      var(--focus-ring);
  }

  /* Errors show once touched (or when an explicit error-message is supplied) */
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='input-container'],
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='textarea'],
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='trigger'] {
    box-shadow: inset 0 0 0 1px var(--color-error-500);
  }

  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='input-container']:focus-within {
    box-shadow:
      inset 0 0 0 1px var(--color-error-500),
      0 0 0 3px color-mix(in oklch, var(--color-error-500) 30%, transparent);
  }

  /* Affixes only take space when something is slotted into them */
  [part~='prefix'],
  [part~='suffix'] {
    padding-inline: 0;
  }

  [part~='prefix'] ::slotted(*) {
    margin-inline-start: var(--spacing-3, 0.75rem);
  }

  [part~='suffix'] ::slotted(*) {
    margin-inline-end: var(--spacing-3, 0.75rem);
  }

  [part~='error'] {
    color: var(--color-error-600, #ef4444);
  }
`

export default fieldStyles
