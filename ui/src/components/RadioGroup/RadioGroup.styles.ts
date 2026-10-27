import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const radioStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    :host([hidden]) {
      display: none !important;
    }

    :host(:focus-visible) {
      outline: none;
    }

    [part~='base'] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
    }

    /* A white, borderless field circle that fills with the accent when selected */
    [part~='indicator'] {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-field);
      box-shadow:
        var(--_control-ring, 0 0 0 0 transparent),
        var(--shadow-field);
      transition:
        background-color 200ms var(--ease-out, ease-out),
        box-shadow 150ms var(--ease-out, ease-out),
        transform 100ms var(--ease-out, ease-out);
    }

    :host([is-checked]) [part~='indicator'] {
      background-color: var(--color-accent);
    }

    :host(:focus-visible) [part~='indicator'] {
      box-shadow:
        var(--focus-ring),
        var(--shadow-field);
    }

    [part~='base']:active:not([data-disabled]) [part~='indicator'] {
      transform: scale(0.95);
    }

    :host([is-checked]) [part~='base']:active:not([data-disabled]) [part~='indicator'] {
      background-color: var(--color-accent-hover);
    }

    /* A clear disc fills the control (leaving the field hairline visible), then
       turns accent-fg and shrinks to a 6px pip when selected */
    [part~='dot'] {
      width: 100%;
      height: 100%;
      border-radius: var(--radius-full, 9999px);
      background-color: transparent;
      scale: 1;
      transition:
        scale 200ms var(--ease-out, ease-out),
        background-color 200ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      :host(:not([is-checked])) [part~='base']:hover:not([data-disabled]) [part~='dot'] {
        background-color: var(--color-field-hover);
      }
    }

    :host([is-checked]) [part~='dot'] {
      background-color: var(--color-accent-fg);
      scale: 0.4286;
    }

    :host([is-checked]) [part~='base']:active:not([data-disabled]) [part~='dot'] {
      scale: 0.5714;
    }

    [part~='label'] {
      display: inline-flex;
      align-items: center;
      color: inherit;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='indicator'],
      [part~='dot'] {
        transition: none;
      }

      [part~='base']:active:not([data-disabled]) [part~='indicator'] {
        transform: none;
      }
    }
  `,
]

export const radioGroupStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
    }

    :host([hidden]) {
      display: none !important;
    }

    /* Inherited by the slotted radios, which outline their circles in danger */
    :host([is-invalid][data-touched]) {
      --_control-ring: 0 0 0 1px var(--color-danger);
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
    }

    [part~='label'] {
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
    }

    :host([is-invalid][data-touched]) [part~='label'] {
      color: var(--color-danger);
    }

    [part~='description'] {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      color: var(--color-muted);
    }

    [part~='group'] {
      display: flex;
      gap: var(--spacing-4, 1rem);
    }

    [part~='label'] ~ [part~='group'],
    [part~='description'] ~ [part~='group'] {
      margin-top: var(--spacing-3, 0.75rem);
    }

    :host([orientation='vertical']) [part~='group'] {
      flex-direction: column;
    }

    :host([orientation='horizontal']) [part~='group'] {
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Each radio dims itself; only the group's own text needs it here */
    :host([is-disabled]) {
      cursor: not-allowed;
    }

    :host([is-disabled]) [part~='label'],
    :host([is-disabled]) [part~='description'] {
      opacity: var(--disabled-opacity, 0.5);
    }
  `,
]
