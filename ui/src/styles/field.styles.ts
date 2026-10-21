/**
 * Moul UI - Shared field surface
 * One look for every text-entry control (text, number, search, textarea, select,
 * combobox, date picker), after HeroUI: a white, borderless shell lifted by a
 * soft shadow, a faint wash on hover, and a flush 2px focus ring. Appended after
 * each component's own styles so it wins the cascade without !important.
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
    border-radius: var(--radius-field, 0.75rem);
    background-color: var(--color-field);
    color: var(--color-field-fg);
    box-shadow: var(--shadow-field);
    outline: none;
    transition:
      background-color var(--duration-fast, 150ms) var(--ease-smooth, ease),
      box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    [part~='input-container']:hover:not([data-disabled]):not(:focus-within),
    [part~='textarea']:hover:not(:disabled):not(:focus),
    [part~='trigger']:hover:not(:disabled):not(:focus-visible) {
      background-color: var(--color-field-hover);
    }
  }

  [part~='input-container']:focus-within:not([data-disabled]),
  [part~='textarea']:focus-visible,
  [part~='textarea']:focus,
  [part~='trigger']:focus-visible,
  [part~='slot']:focus {
    outline: none;
    background-color: var(--color-field-focus);
    box-shadow: var(--focus-ring-field), var(--shadow-field);
  }

  [part~='input']::placeholder,
  [part~='textarea']::placeholder {
    color: var(--color-field-placeholder);
  }

  /* Errors show once touched (or when an explicit error-message is supplied) */
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='input-container'],
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='textarea'],
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='trigger'] {
    box-shadow: 0 0 0 1px var(--color-danger), var(--shadow-field);
  }

  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='input-container']:focus-within,
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='textarea']:focus,
  :host([is-invalid]:is([data-touched], [error-message]:not([error-message=""]))) [part~='trigger']:focus-visible {
    box-shadow: var(--focus-ring-invalid), var(--shadow-field);
  }

  /* Affixes only take space when something is slotted into them */
  [part~='prefix'],
  [part~='suffix'] {
    padding-inline: 0;
    color: var(--color-field-placeholder);
  }

  [part~='prefix'] ::slotted(*) {
    margin-inline-start: var(--spacing-3, 0.75rem);
  }

  [part~='suffix'] ::slotted(*) {
    margin-inline-end: var(--spacing-3, 0.75rem);
  }

  [part~='description'] {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--color-muted);
  }

  [part~='error'] {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--color-danger, #ef4444);
  }
`

export default fieldStyles
