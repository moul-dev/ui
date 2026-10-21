import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

/* Unframed, after HeroUI: the calendar takes the surface it sits on (a card,
   a popover). Days are round cells: accent fill when selected, a soft accent
   tint for today, a neutral wash on hover, muted outside the month. */
export const calendarStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      text-align: start;
      user-select: none;
      -webkit-user-select: none;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: inline-flex;
      flex-direction: column;
      width: 15.75rem;
      max-width: 100%;
    }

    /* Month on the leading edge, previous/next grouped on the trailing edge */
    [part~='header'] {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.125rem var(--spacing-4, 1rem);
    }

    [part~='heading'] {
      order: 0;
      flex: 1;
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-fg, inherit);
      text-align: start;
    }

    [part~='nav-btn-prev'] {
      order: 1;
    }

    [part~='nav-btn-next'] {
      order: 2;
    }

    [part~='nav-btn'] {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: var(--radius-2xl, 1rem);
      border: none;
      background-color: transparent;
      color: var(--color-accent-soft-fg);
      cursor: pointer;
      outline: none;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 250ms var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out),
        opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='nav-btn']:hover:not(:disabled) {
        background-color: var(--color-default);
      }
    }

    [part~='nav-btn']:active:not(:disabled) {
      transform: scale(0.95);
    }

    [part~='nav-btn']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='nav-btn']:disabled {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
    }

    [part~='nav-btn'] svg {
      width: 1rem;
      height: 1rem;
    }

    :host(:dir(rtl)) [part~='nav-btn'] svg {
      transform: rotate(180deg);
    }

    [part~='grid'] {
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      width: 100%;
    }

    [part~='grid-header'] th {
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-muted);
      text-align: center;
      padding: 0 0 var(--spacing-2, 0.5rem);
    }

    [part~='grid-cell'] {
      text-align: center;
      padding: 0;
    }

    tbody tr:first-child [part~='grid-cell'] {
      padding-top: var(--spacing-1, 0.25rem);
    }

    /* Block-level so the cell's line box doesn't add baseline slack under it */
    [part~='day-btn'] {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      max-width: 2.25rem;
      aspect-ratio: 1;
      margin: 0 auto;
      border-radius: var(--radius-3xl, 1.5rem);
      border: none;
      background-color: transparent;
      color: var(--color-fg, inherit);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: var(--font-weight-medium, 500);
      line-height: 1;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      outline: none;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 250ms var(--ease-out, ease-out),
        background-color 100ms var(--ease-out, ease-out),
        box-shadow 100ms var(--ease-out, ease-out);
    }

    [part~='day-btn']:focus-visible {
      outline: none;
      box-shadow: var(--focus-ring);
    }

    [part~='day-btn'][data-today='true'] {
      background-color: var(--color-accent-soft);
      color: var(--color-accent-soft-fg);
    }

    [part~='day-btn'][data-selected='true'] {
      background-color: var(--color-accent);
      color: var(--color-accent-fg);
    }

    @media (hover: hover) {
      [part~='day-btn']:hover:not([data-selected='true']) {
        background-color: var(--color-default);
      }

      [part~='day-btn'][data-today='true']:hover:not([data-selected='true']) {
        background-color: var(--color-accent-soft-hover);
      }
    }

    [part~='day-btn']:active {
      background-color: var(--color-default);
      transform: scale(0.95);
    }

    [part~='day-btn'][data-selected='true']:active {
      background-color: var(--color-accent-hover);
    }

    [part~='day-btn'][data-outside='true'] {
      color: var(--color-muted);
      opacity: 0.5;
    }

    [part~='day-btn'][data-selected='true'][data-outside='true'] {
      background-color: var(--color-default);
    }

    /* Out-of-range dates: dimmed and struck through, but outside-month days stay as they are */
    [part~='day-btn']:disabled:not([data-outside='true']) {
      opacity: var(--disabled-opacity, 0.5);
      text-decoration: line-through;
    }

    [part~='day-btn']:disabled {
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    /* The host already dims; don't dim its controls a second time */
    :host([is-disabled]) [part~='nav-btn']:disabled {
      opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='nav-btn'],
      [part~='day-btn'] {
        transition: none;
      }

      [part~='nav-btn']:active:not(:disabled),
      [part~='day-btn']:active {
        transform: none;
      }
    }
  `,
]
