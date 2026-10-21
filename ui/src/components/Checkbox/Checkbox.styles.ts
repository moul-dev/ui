import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const checkboxStyles = [
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

    /* Errors show once touched, like the text fields */
    :host([is-invalid][data-touched]) {
      --_control-ring: 0 0 0 1px var(--color-danger);
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

    /* A white, borderless field box; the accent fill grows in from a ::before layer */
    [part~='indicator'] {
      position: relative;
      isolation: isolate;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
      overflow: hidden;
      border-radius: var(--radius-md, 0.375rem);
      background-color: var(--color-field);
      box-shadow:
        var(--_control-ring, 0 0 0 0 transparent),
        var(--shadow-field);
      color: var(--color-accent-fg);
      transition:
        background-color 200ms var(--ease-out, ease-out),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    [part~='indicator']::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background-color: var(--color-accent);
      opacity: 0;
      scale: 0.7;
      pointer-events: none;
      transition:
        scale 100ms linear,
        opacity 200ms linear,
        background-color 200ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      :host(:not([is-checked]):not([is-indeterminate]))
        [part~='base']:hover:not([data-disabled])
        [part~='indicator'] {
        background-color: var(--color-field-hover);
      }

      [part~='base']:hover:not([data-disabled]) [part~='indicator']::before {
        background-color: var(--color-accent-hover);
      }
    }

    :host([is-checked]) [part~='indicator'],
    :host([is-indeterminate]) [part~='indicator'] {
      box-shadow: var(--shadow-field);
    }

    :host([is-checked]) [part~='indicator']::before,
    :host([is-indeterminate]) [part~='indicator']::before {
      opacity: 1;
      scale: 1;
    }

    /* Invalid + selected: the fill turns danger */
    :host([is-invalid][data-touched]:is([is-checked], [is-indeterminate]))
      [part~='indicator'] {
      color: var(--color-danger-fg);
    }

    :host([is-invalid][data-touched]:is([is-checked], [is-indeterminate]))
      [part~='indicator']::before {
      background-color: var(--color-danger);
    }

    :host(:focus-visible) [part~='indicator'] {
      box-shadow:
        var(--focus-ring),
        var(--shadow-field);
    }

    [part~='icon'] {
      position: relative;
      z-index: 1;
      width: 0.875rem;
      height: 0.875rem;
      stroke: currentColor;
      stroke-width: 2.5;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* The check mark draws itself in */
    [part~='icon'] path {
      stroke-dasharray: 24;
      stroke-dashoffset: 24;
      animation: moul-check-draw 150ms linear 15ms forwards;
    }

    @keyframes moul-check-draw {
      to {
        stroke-dashoffset: 0;
      }
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
      [part~='indicator']::before {
        transition: none;
      }

      [part~='icon'] path {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  `,
]

export const checkboxGroupStyles = [
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

    /* Inherited by the slotted checkboxes, which outline their boxes in danger */
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

    /* Each checkbox dims itself; only the group's own text needs it here */
    :host([is-disabled]) {
      cursor: not-allowed;
    }

    :host([is-disabled]) [part~='label'],
    :host([is-disabled]) [part~='description'] {
      opacity: var(--disabled-opacity, 0.5);
    }
  `,
]
