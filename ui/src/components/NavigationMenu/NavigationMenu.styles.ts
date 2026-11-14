import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/* The menu is the box every floating panel is placed against: items and
   their panels are not positioned, so a panel's containing block is the
   menu's base. The base carries the geometry of the open panel as private
   variables (--_nm-x, --_nm-w, --_nm-h, --_nm-ix), which the floating
   surface, the indicator and, through inheritance, the items read. */
export const navigationMenuStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    [part~='base'] {
      position: relative;
      --_nm-offset: var(--navigation-menu-offset, 0.5rem);
      --_nm-bg: var(--navigation-menu-background, var(--color-bg-elevated));
      --_nm-radius: var(--navigation-menu-radius, var(--radius-2xl, 1rem));
      --_nm-move: var(--duration-base, 250ms) var(--ease-out, ease-out);
    }

    [part~='list'] {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      margin: 0;
      padding: 0;
    }

    :host([orientation='vertical']) [part~='list'] {
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: stretch;
      gap: 0;
    }

    /* The surface behind the open panel. It morphs between items: its place
       and size glide, and it fades and scales in from the open trigger. */
    [part~='viewport'] {
      position: absolute;
      inset-block-start: calc(100% + var(--_nm-offset));
      left: var(--_nm-x, 0px);
      z-index: var(--z-dropdown, 1000);
      inline-size: var(--_nm-w, 0px);
      block-size: var(--_nm-h, 0px);
      border-radius: var(--_nm-radius);
      background: var(--_nm-bg);
      box-shadow: var(--shadow-overlay);
      transform-origin: var(--_nm-origin, 50% 0);
      opacity: 0;
      scale: 0.96;
      visibility: hidden;
      pointer-events: none;
      transition:
        left var(--_nm-move),
        inline-size var(--_nm-move),
        block-size var(--_nm-move),
        opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
        scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
        visibility 0s linear var(--duration-fast, 150ms);
    }

    /* A small arrow on the surface's top edge, under the open trigger. */
    [part~='indicator'] {
      position: absolute;
      inset-block-start: calc(100% + var(--_nm-offset) - 5px);
      left: calc(var(--_nm-ix, 0px) - 6px);
      z-index: var(--z-dropdown, 1000);
      inline-size: 12px;
      block-size: 12px;
      border-start-start-radius: 3px;
      background: var(--_nm-bg);
      rotate: 45deg;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition:
        left var(--_nm-move),
        opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
        visibility 0s linear var(--duration-fast, 150ms);
    }

    [part~='base'][data-open] [part~='viewport'],
    [part~='base'][data-open] [part~='indicator'] {
      opacity: 1;
      scale: 1;
      visibility: visible;
      pointer-events: auto;
      transition-delay: 0s;
    }

    /* The first panel to open appears where it belongs, without gliding there. */
    [part~='base'][data-instant] [part~='viewport'],
    [part~='base'][data-instant] [part~='indicator'] {
      transition-property: opacity, scale, visibility;
    }

    :host([orientation='vertical']) [part~='viewport'],
    :host([orientation='vertical']) [part~='indicator'] {
      display: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='viewport'],
      [part~='indicator'] {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      [part~='viewport'] {
        border: 1px solid CanvasText;
      }

      [part~='indicator'] {
        display: none;
      }
    }
  `,
]

export const navigationMenuItemStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      --_nm-ease: var(--ease-out, ease-out);
    }

    [part~='trigger'],
    [part~='link'] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-1, 0.25rem);
      min-block-size: 2.25rem;
      margin: 0;
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: var(--radius-full, 9999px);
      background: transparent;
      color: var(--color-fg-subtle);
      font: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
      text-decoration: none;
      white-space: nowrap;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background-color var(--duration-fast, 150ms) var(--_nm-ease),
        color var(--duration-fast, 150ms) var(--_nm-ease);
    }

    @media (hover: hover) {
      [part~='trigger']:hover,
      [part~='link']:hover {
        background-color: var(--color-default);
        color: var(--color-fg);
      }
    }

    :host([is-open]) [part~='trigger'],
    [aria-current='page'] {
      color: var(--color-fg);
    }

    :host([is-open]) [part~='trigger'] {
      background-color: var(--color-default);
    }

    [part~='trigger']:focus-visible,
    [part~='link']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='chevron'] {
      display: inline-flex;
      inline-size: 0.875rem;
      block-size: 0.875rem;
      color: var(--color-muted);
      transition: rotate var(--duration-base, 250ms) var(--_nm-ease);
    }

    [part~='chevron'] svg {
      inline-size: 100%;
      block-size: 100%;
    }

    :host([is-open]) [part~='chevron'] {
      rotate: 180deg;
    }

    /* Horizontal: the panel floats over the menu's surface, placed by the
       menu (left is set inline), and is laid out only while open or while
       it slides out. */
    [part~='panel'] {
      position: absolute;
      inset-block-start: calc(100% + var(--_nm-offset, 0.5rem));
      left: 0;
      z-index: calc(var(--z-dropdown, 1000) + 1);
      display: none;
      inline-size: max-content;
      max-inline-size: min(
        var(--navigation-menu-panel-max-width, 44rem),
        calc(100vw - 1rem)
      );
      color: var(--color-fg);
    }

    [part~='panel'][data-open],
    [part~='panel'][data-leaving] {
      display: block;
    }

    [part~='panel'][data-leaving] {
      pointer-events: none;
    }

    [part~='content'] {
      display: grid;
      grid-template-columns: repeat(var(--_nm-columns, 1), minmax(0, auto));
      gap: var(--spacing-1, 0.25rem);
      padding: var(--spacing-2, 0.5rem);
    }

    /* Vertical: a disclosure. The trigger spans the row and the panel opens
       under it in the flow, its height growing from nothing. */
    :host([data-orientation='vertical']) [part~='trigger'],
    :host([data-orientation='vertical']) [part~='link'] {
      display: flex;
      justify-content: space-between;
      inline-size: 100%;
      min-block-size: 2.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-lg, 0.75rem);
      font-size: var(--font-size-md, 1rem);
      text-align: start;
    }

    :host([data-orientation='vertical']) [part~='panel'] {
      position: static;
      display: grid;
      grid-template-rows: 0fr;
      inline-size: auto;
      max-inline-size: none;
      visibility: hidden;
      transition:
        grid-template-rows var(--duration-base, 250ms) var(--_nm-ease),
        visibility 0s linear var(--duration-base, 250ms);
    }

    :host([data-orientation='vertical']) [part~='panel'][data-open] {
      grid-template-rows: 1fr;
      visibility: visible;
      transition-delay: 0s;
    }

    :host([data-orientation='vertical']) .clip {
      min-block-size: 0;
      overflow: hidden;
    }

    :host([data-orientation='vertical']) [part~='content'] {
      grid-template-columns: minmax(0, 1fr);
      padding: var(--spacing-1, 0.25rem) 0 var(--spacing-2, 0.5rem)
        var(--spacing-2, 0.5rem);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='trigger'],
      [part~='link'],
      [part~='chevron'],
      :host([data-orientation='vertical']) [part~='panel'] {
        transition: none;
      }
    }
  `,
]

export const navigationMenuLinkStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      inline-size: var(--navigation-menu-link-width, 16rem);
      max-inline-size: 100%;
    }

    [part~='base'] {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-3, 0.75rem);
      padding: 0.625rem 0.75rem;
      border-radius: var(--radius-xl, 0.875rem);
      color: var(--color-fg);
      text-decoration: none;
      -webkit-tap-highlight-color: transparent;
      transition: background-color var(--duration-fast, 150ms)
        var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='base']:hover {
        background-color: var(--color-default);
      }
    }

    [part~='base']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='base'][aria-current='page'] {
      background-color: var(--color-accent-soft);
    }

    [part~='icon'] {
      display: none;
      flex-shrink: 0;
      place-items: center;
      inline-size: 2.25rem;
      block-size: 2.25rem;
      border-radius: var(--radius-lg, 0.75rem);
      background: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    [data-has-icon] [part~='icon'] {
      display: grid;
    }

    ::slotted([slot='icon']) {
      inline-size: 1.125rem;
      block-size: 1.125rem;
    }

    .text {
      display: grid;
      gap: 0.125rem;
      min-inline-size: 0;
    }

    [part~='label'] {
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: var(--line-height-sm, 1.25rem);
    }

    [part~='description'] {
      color: var(--color-muted);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='base'] {
        transition: none;
      }
    }

    @media (forced-colors: active) {
      [part~='base'][aria-current='page'] {
        outline: 1px solid LinkText;
      }
    }
  `,
]
