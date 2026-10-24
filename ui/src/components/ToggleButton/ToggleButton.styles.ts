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
      border-radius: var(--radius-3xl, 1.5rem);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
      cursor: pointer;
      --_press-scale: var(--press-scale, 0.97);
      /* Unselected: neutral fill */
      --_bg: var(--color-default);
      --_bg-hover: var(--color-default-hover);
      --_fg: var(--color-default-fg);
    }

    /* Selected: soft accent tint */
    :host([is-selected]) {
      --_bg: var(--color-accent-soft);
      --_bg-hover: var(--color-accent-soft-hover);
      --_fg: var(--color-accent-soft-fg);
    }

    [part~="button"] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      border: none;
      border-radius: inherit;
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
        color 100ms var(--ease-out, ease-out);
      cursor: pointer;
      position: relative;
      white-space: nowrap;
    }

    @media (hover: hover) {
      :host(:not([is-disabled])) [part~="button"]:hover {
        background-color: var(--_bg-hover);
      }
    }

    :host(:not([is-disabled])) [part~="button"]:active {
      background-color: var(--_bg-hover);
      transform: scale(var(--_press-scale));
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~="button"],
    [part~="button"]:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
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
      gap: var(--spacing-2, 0.5rem);
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

    /*
     * Inside a moul-toggle-button-group the group paints the neutral fill and
     * slides the selected tint (its indicator) beneath the buttons, so the
     * buttons themselves stay transparent and don't scale on press.
     */
    :host([data-in-group]) {
      --_press-scale: 1;
      --_bg: transparent;
      --_bg-hover: var(--color-default-hover);
    }

    :host([data-in-group][is-selected]) {
      --_bg: transparent;
      /* Layered over the indicator's accent-soft, this lands near accent-soft-hover */
      --_bg-hover: color-mix(in oklab, var(--color-accent) 6%, transparent);
    }

    /* Inset ring so it stays inside the group's clipped outline */
    :host([data-in-group]:focus-visible) [part~="button"],
    :host([data-in-group]) [part~="button"]:focus-visible {
      box-shadow: inset 0 0 0 2px var(--color-focus);
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

    .content {
      display: inline-flex;
      align-items: center;
      gap: inherit;
    }

    ::slotted(svg) {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="button"] {
        transition: none;
      }

      :host(:not([is-disabled])) [part~="button"]:active {
        transform: none;
      }
    }
  `,
]
