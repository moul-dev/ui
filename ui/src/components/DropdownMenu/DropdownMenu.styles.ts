import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/* The trigger stays in the page flow; the menu floats in the top layer as a
   transparent shell (positioned and scaled by the component) around the
   visible panel, so the gooey layer can reach past the panel to the trigger. */
export const dropdownMenuStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      vertical-align: middle;
      --_menu-bg: var(--dropdown-menu-background, var(--color-bg-elevated));
    }

    [part~='trigger'] {
      display: contents;
    }

    :host([is-disabled]) [part~='trigger'] {
      display: inline-block;
      opacity: var(--disabled-opacity, 0.5);
      pointer-events: none;
      cursor: not-allowed;
    }

    [part~='popover'] {
      position: fixed;
      inset: auto;
      margin: 0;
      padding: 0;
      border: 0;
      overflow: visible;
      background: transparent;
      color: var(--color-fg);
      z-index: var(--z-dropdown, 1000);
    }

    /* Positioned so it paints above the goo layer that comes before it. */
    [part~='menu'] {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: max(
        var(--dropdown-menu-min-width, 10rem),
        var(--_trigger-width, 0px)
      );
      max-width: min(var(--dropdown-menu-max-width, 20rem), calc(100vw - 1rem));
      max-height: min(
        var(--dropdown-menu-max-height, 20rem),
        var(--_available, 100vh)
      );
      padding: 0.375rem;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: var(--color-scrollbar-thumb) transparent;
      border-radius: var(--radius-surface, 1.5rem);
      background-color: var(--_menu-bg);
      box-shadow: var(--shadow-overlay);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      outline: none;
      transition:
        background-color 160ms var(--ease-out, ease-out),
        box-shadow 160ms var(--ease-out, ease-out);
    }

    /* Gooey: while the blobs move, the panel is bare and the goo layer draws
       its shape; when they settle, the panel fades back in over them. */
    [part~='goo'] {
      position: absolute;
      overflow: hidden;
      pointer-events: none;
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 160ms var(--ease-out, ease-out),
        visibility 0s linear 160ms;
    }

    .goo-fill {
      position: absolute;
      inset: 0;
    }

    .goo-fill > span {
      position: absolute;
      background-color: var(--_menu-bg);
      will-change: transform;
    }

    .goo-defs {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      pointer-events: none;
    }

    [data-goo] [part~='goo'] {
      opacity: 1;
      visibility: visible;
      transition: none;
    }

    [data-goo] [part~='menu'] {
      background-color: transparent;
      box-shadow: none;
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='menu'],
      [part~='goo'] {
        transition: none;
      }
    }
  `,
]

/* Rows: rounded, a neutral wash on the focused row (the pointer moves focus
   as it hovers), a ring for keyboard focus, and a muted shortcut hint. */
export const menuItemStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      outline: none;
      user-select: none;
      -webkit-user-select: none;
    }

    [part~='item'] {
      position: relative;
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 0.5rem);
      min-height: 2.25rem;
      padding: 0.375rem 0.625rem;
      border-radius: var(--radius-2xl, 1rem);
      color: var(--color-fg);
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      cursor: pointer;
      transition:
        background-color 100ms var(--ease-out, ease-out),
        box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    :host(:focus) [part~='item'] {
      background-color: var(--color-default);
    }

    :host(:focus-visible) [part~='item'] {
      box-shadow: var(--focus-ring);
    }

    :host([variant='danger']) [part~='item'] {
      color: var(--color-danger-soft-fg);
    }

    :host([variant='danger']:focus) [part~='item'] {
      background-color: var(--color-danger-soft);
    }

    :host([is-disabled]) [part~='item'] {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    [part~='label'] {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    ::slotted([slot='prefix']),
    ::slotted([slot='suffix']) {
      display: inline-flex;
      flex-shrink: 0;
      align-items: center;
    }

    [part~='indicator'] {
      display: inline-flex;
      flex-shrink: 0;
      width: 1rem;
      height: 1rem;
    }

    [part~='indicator'] svg {
      width: 100%;
      height: 100%;
      opacity: 0;
      transform: scale(0.6);
      transition:
        opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
        transform var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    :host([is-checked]) [part~='indicator'] svg {
      opacity: 1;
      transform: none;
    }

    [part~='shortcut'] {
      flex-shrink: 0;
      margin-inline-start: var(--spacing-4, 1rem);
      font-family: inherit;
      font-size: var(--font-size-xs, 0.75rem);
      letter-spacing: 0.04em;
      color: var(--color-muted);
      white-space: nowrap;
    }

    [part~='link'] {
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='item'],
      [part~='indicator'] svg {
        transition: none;
      }
    }
  `,
]

export const menuGroupStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    [part~='label'] {
      padding: 0.375rem 0.625rem 0.25rem;
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
    }

    [part~='items'] {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }
  `,
]

export const menuSeparatorStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      height: 1px;
      margin: 0.25rem 0.625rem;
      background-color: var(--color-separator);
    }
  `,
]
