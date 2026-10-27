import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const switchStyles = [
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

    [part~='base'] {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
      -webkit-tap-highlight-color: transparent;
    }

    /* Geometry: a pill thumb, wider than tall, inset by --_pad from either end */
    :host {
      --_track-w: 2.5rem;
      --_track-h: 1.25rem;
      --_track-radius: var(--radius-xl, 0.75rem);
      --_thumb-w: 1.375rem;
      --_thumb-h: 1rem;
      --_thumb-radius: var(--radius-lg, 0.5rem);
      --_pad: 0.125rem;
      --_track-bg: var(--color-default);
      --_track-bg-hover: color-mix(in oklab, var(--color-default) 80%, transparent);
    }

    :host([size='sm']) {
      --_track-w: 2rem;
      --_track-h: 1rem;
      --_track-radius: var(--radius-lg, 0.5rem);
      --_thumb-w: 1.03125rem;
      --_thumb-h: 0.75rem;
      --_thumb-radius: var(--radius-md, 0.375rem);
    }

    :host([size='lg']) {
      --_track-w: 3rem;
      --_track-h: 1.5rem;
      --_track-radius: var(--radius-xl, 0.75rem);
      --_thumb-w: 1.71875rem;
      --_thumb-h: 1.25rem;
      --_thumb-radius: var(--radius-xl, 0.75rem);
    }

    :host([is-checked]) {
      --_track-bg: var(--color-accent);
      --_track-bg-hover: var(--color-accent-hover);
    }

    [part~='track'] {
      position: relative;
      display: flex;
      align-items: center;
      flex-shrink: 0;
      width: var(--_track-w);
      height: var(--_track-h);
      overflow: hidden;
      border-radius: var(--_track-radius);
      background-color: var(--_track-bg);
      transition:
        background-color 250ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    @media (hover: hover) {
      [part~='base']:hover:not([data-disabled]) [part~='track'] {
        background-color: var(--_track-bg-hover);
      }
    }

    [part~='base']:active:not([data-disabled]) [part~='track'] {
      background-color: var(--_track-bg-hover);
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~='track'] {
      box-shadow: var(--focus-ring);
    }

    /* Margin, not translate, so the travel mirrors under RTL */
    [part~='thumb'] {
      display: block;
      flex-shrink: 0;
      width: var(--_thumb-w);
      height: var(--_thumb-h);
      margin-inline-start: var(--_pad);
      border-radius: var(--_thumb-radius);
      background-color: var(--color-white, #fff);
      box-shadow: var(--shadow-field);
      transition:
        margin 300ms var(--ease-out-fluid, ease-out),
        background-color 200ms var(--ease-out, ease-out);
      pointer-events: none;
    }

    :host([is-checked]) [part~='thumb'] {
      margin-inline-start: calc(100% - var(--_thumb-w) - var(--_pad));
      background-color: var(--color-accent-fg);
      box-shadow:
        0 0 5px 0 oklch(0 0 0 / 0.02),
        0 2px 10px 0 oklch(0 0 0 / 0.06),
        0 0 1px 0 oklch(0 0 0 / 0.3);
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

    :host([is-disabled]:not([is-checked])) [part~='thumb'] {
      background-color: color-mix(in oklab, var(--color-default-fg) 20%, transparent);
    }

    :host([is-disabled][is-checked]) [part~='thumb'] {
      opacity: 0.4;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='track'],
      [part~='thumb'] {
        transition: none;
      }
    }
  `,
]
