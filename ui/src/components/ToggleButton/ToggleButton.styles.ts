import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const toggleButtonStyles = [
  resetStyles,
  css`
    :host {
      display: inline-flex;
      vertical-align: middle;
      position: relative;
      font-family: var(--font-family-base, inherit);
      border-radius: var(--radius-full, 9999px);
      user-select: none;
      -webkit-user-select: none;
      cursor: pointer;
    }

    [part~="button"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border-radius: inherit;
      font-family: inherit;
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      text-decoration: none;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
      transition:
        background-color var(--duration-fast, 140ms) ease,
        box-shadow var(--duration-fast, 140ms) ease,
        color var(--duration-base, 240ms) ease;
      background-color: var(--glass-bg-thick);
      color: var(--color-fg, oklch(0.15 0.01 250));
      border: none;
      box-shadow: var(--glass-highlight), 0 0 0 0.5px var(--glass-edge), var(--shadow-sm);
    }

    :host(:not([data-in-group]):not([is-selected]):not([is-disabled])) [part~="button"]:hover {
      background-color: light-dark(oklch(1 0 0 / 0.9), oklch(0.3 0 0 / 0.8));
    }

    /* Selected state: tinted glass, like an active toolbar toggle */
    :host(:not([data-in-group])[is-selected]) [part~="button"] {
      background-color: color-mix(in oklch, var(--color-primary-500) 16%, var(--glass-bg-thick));
      color: var(--color-primary-600, oklch(0.55 0.22 250));
      box-shadow:
        inset 0 0 0 1px color-mix(in oklch, var(--color-primary-500) 30%, transparent),
        var(--shadow-sm);
    }

    :host(:not([data-in-group])[is-selected]:not([is-disabled])) [part~="button"]:hover {
      background-color: color-mix(in oklch, var(--color-primary-500) 22%, var(--glass-bg-thick));
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~="button"] {
      box-shadow: var(--focus-ring);
    }

    /* Inside a group the group's sliding thumb carries the selection */
    :host([data-in-group]) [part~="button"],
    :host([data-in-group][is-selected]) [part~="button"],
    :host([data-in-group]:not([is-selected]):not([is-disabled])) [part~="button"]:hover {
      background-color: transparent;
      box-shadow: none;
      color: var(--color-fg-subtle, oklch(0.45 0 0));
    }

    :host([data-in-group][is-selected]) [part~="button"],
    :host([data-in-group]:not([is-disabled])) [part~="button"]:hover {
      color: var(--color-fg, oklch(0.15 0 0));
    }

    :host([data-in-group]:focus-visible) [part~="button"] {
      box-shadow: var(--focus-ring);
    }

    /* Sizes */
    :host([size="sm"]) [part~="button"] {
      height: 2rem;
      padding: 0 var(--spacing-3, 0.75rem);
      font-size: var(--font-size-sm, 0.875rem);
      gap: var(--spacing-1, 0.25rem);
    }

    :host([size="md"]) [part~="button"],
    :host(:not([size])) [part~="button"] {
      height: 2.25rem;
      padding: 0 var(--spacing-4, 1rem);
      font-size: var(--font-size-sm, 0.875rem);
      gap: var(--spacing-2, 0.5rem);
    }

    :host([size="lg"]) [part~="button"] {
      height: 3rem;
      padding: 0 var(--spacing-6, 1.5rem);
      font-size: var(--font-size-lg, 1.125rem);
      gap: var(--spacing-3, 0.75rem);
    }

    /* Disabled State */
    :host([is-disabled]) {
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) [part~="button"] {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }
  `,
]
