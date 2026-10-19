import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const buttonStyles = [
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
      transition:
        background-color var(--duration-fast, 140ms) ease,
        box-shadow var(--duration-fast, 140ms) ease,
        color var(--duration-fast, 140ms) ease,
        opacity var(--duration-fast, 140ms) ease,
        filter var(--duration-fast, 140ms) ease;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
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
      height: 2.75rem;
      padding: 0 var(--spacing-6, 1.5rem);
      font-size: var(--font-size-md, 1rem);
      gap: var(--spacing-3, 0.75rem);
    }

    /* Icon-only size variants */
    :host([is-icon][size="sm"]) [part~="button"] {
      width: 2rem;
      padding: 0;
    }

    :host([is-icon][size="md"]) [part~="button"],
    :host([is-icon]:not([size])) [part~="button"] {
      width: 2.25rem;
      padding: 0;
    }

    :host([is-icon][size="lg"]) [part~="button"] {
      width: 2.75rem;
      padding: 0;
    }

    /* Variants */
    /* Lit gem: brand fill, specular top edge, soft colored drop */
    :host([variant="primary"]) [part~="button"],
    :host(:not([variant])) [part~="button"],
    :host([variant="danger"]) [part~="button"] {
      --_fill: var(--color-primary-solid, oklch(0.56 0.22 250));
      background:
        linear-gradient(to bottom, oklch(1 0 0 / 0.16), oklch(1 0 0 / 0) 60%),
        var(--_fill);
      color: var(--color-fg-on-primary, #ffffff);
      border: none;
      box-shadow:
        inset 0 1px 0 oklch(1 0 0 / 0.3),
        inset 0 0 0 1px oklch(0 0 0 / 0.06),
        0 1px 2px color-mix(in oklch, var(--_fill) 30%, transparent),
        0 4px 12px -4px color-mix(in oklch, var(--_fill) 55%, transparent);
    }

    :host([variant="danger"]) [part~="button"] {
      --_fill: var(--color-error-solid, oklch(0.58 0.22 27));
    }

    :host([variant="primary"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover,
    :host(:not([variant]):not([is-disabled]):not([is-pending])) [part~="button"]:hover,
    :host([variant="danger"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      filter: brightness(1.06) saturate(1.05);
    }

    /* Glass: translucent pane with rim light */
    :host([variant="secondary"]) [part~="button"] {
      background-color: var(--glass-bg-thick);
      color: var(--color-fg, oklch(0.15 0 0));
      border: none;
      box-shadow: var(--glass-highlight), 0 0 0 0.5px var(--glass-edge), var(--shadow-sm);
      -webkit-backdrop-filter: var(--glass-filter);
      backdrop-filter: var(--glass-filter);
    }

    :host([variant="secondary"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      background-color: light-dark(oklch(1 0 0 / 0.92), oklch(0.32 0 0 / 0.82));
    }

    /* Tertiary: quiet tinted fill */
    :host([variant="tertiary"]) [part~="button"] {
      background-color: var(--color-fill-hover);
      color: var(--color-primary-600, oklch(0.5 0.2 250));
      border: none;
    }

    :host([variant="tertiary"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      background-color: var(--color-fill-pressed);
    }

    /* Outline */
    :host([variant="outline"]) [part~="button"] {
      background-color: transparent;
      color: var(--color-fg, oklch(0.15 0 0));
      border: none;
      box-shadow: inset 0 0 0 1px var(--color-border, oklch(0.85 0 0));
    }

    :host([variant="outline"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      background-color: var(--color-fill-hover);
    }

    /* Ghost */
    :host([variant="ghost"]) [part~="button"] {
      background-color: transparent;
      color: var(--color-fg, oklch(0.15 0 0));
      border: none;
    }

    :host([variant="ghost"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      background-color: var(--color-fill-hover);
    }

    /* Danger-Soft */
    :host([variant="danger-soft"]) [part~="button"] {
      background-color: color-mix(in oklch, var(--color-error-solid) 14%, transparent);
      color: light-dark(var(--color-error-600), var(--color-error-600));
      border: none;
    }

    :host([variant="danger-soft"]:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
      background-color: color-mix(in oklch, var(--color-error-solid) 22%, transparent);
    }

    [part~="button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
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

    /* Pending State */
    :host([is-pending]) {
      cursor: wait;
      pointer-events: none;
    }

    :host([is-pending]) [part~="button"] {
      cursor: wait;
      pointer-events: none;
    }

    .spinner {
      margin-inline-end: var(--spacing-2, 0.5rem);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :host([is-icon]) .spinner {
      margin-inline-end: 0;
    }

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }

    ::slotted([slot="prefix"]),
    ::slotted([slot="suffix"]) {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `,
]
