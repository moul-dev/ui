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
      border-radius: var(--radius-3xl, 1.5rem);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      --_press-scale: var(--press-scale, 0.97);
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
      border: 1px solid transparent;
      background-color: var(--_bg);
      color: var(--_fg);
      font-family: inherit;
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      text-decoration: none;
      transform-origin: center;
      transition:
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out),
        opacity var(--duration-fast, 150ms) ease;
      cursor: pointer;
      position: relative;
      white-space: nowrap;
    }

    /* Sizes */
    :host([size="sm"]) {
      --_press-scale: 0.98;
    }

    :host([size="lg"]) {
      --_press-scale: 0.96;
    }

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
      height: 2.5rem;
      padding: 0 var(--spacing-4, 1rem);
      font-size: var(--font-size-md, 1rem);
      gap: var(--spacing-2, 0.5rem);
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
      width: 2.5rem;
      padding: 0;
    }

    /* Variants: each sets the fill trio; the shared rules below apply it. */
    :host([variant="primary"]),
    :host(:not([variant])) {
      --_bg: var(--color-accent);
      --_bg-hover: var(--color-accent-hover);
      --_fg: var(--color-accent-fg);
    }

    :host([variant="secondary"]) {
      --_bg: var(--color-default);
      --_bg-hover: var(--color-default-hover);
      --_fg: var(--color-accent-soft-fg);
    }

    :host([variant="tertiary"]) {
      --_bg: var(--color-default);
      --_bg-hover: var(--color-default-hover);
      --_fg: var(--color-default-fg);
    }

    :host([variant="ghost"]),
    :host([variant="outline"]) {
      --_bg: transparent;
      --_bg-hover: var(--color-default);
      --_fg: var(--color-default-fg);
    }

    :host([variant="outline"]) {
      --_bg-hover: color-mix(in srgb, var(--color-default) 60%, transparent);
    }

    :host([variant="outline"]) [part~="button"] {
      border-color: var(--color-border);
    }

    :host([variant="danger"]) {
      --_bg: var(--color-danger);
      --_bg-hover: var(--color-danger-hover);
      --_fg: var(--color-danger-fg);
    }

    :host([variant="danger-soft"]) {
      --_bg: var(--color-danger-soft);
      --_bg-hover: var(--color-danger-soft-hover);
      --_fg: var(--color-danger-soft-fg);
    }

    @media (hover: hover) {
      :host(:not([is-disabled]):not([is-pending])) [part~="button"]:hover {
        background-color: var(--_bg-hover);
      }
    }

    :host(:not([is-disabled]):not([is-pending])) [part~="button"]:active {
      background-color: var(--_bg-hover);
      transform: scale(var(--_press-scale));
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
      opacity: var(--disabled-opacity, 0.5);
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

    ::slotted(svg) {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="button"] {
        transition: none;
      }

      :host(:not([is-disabled]):not([is-pending])) [part~="button"]:active {
        transform: none;
      }
    }
  `,
]
