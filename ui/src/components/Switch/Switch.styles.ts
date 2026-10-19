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
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      -webkit-tap-highlight-color: transparent;
    }

    /* Geometry: thumb is a circle inset by --_pad; it stretches by --_stretch while pressed */
    :host {
      --_track-w: 2.75rem;
      --_track-h: 1.625rem;
      --_pad: 2px;
      --_stretch: 0.375rem;
    }

    :host([size='sm']) {
      --_track-w: 2.125rem;
      --_track-h: 1.25rem;
      --_stretch: 0.25rem;
    }

    :host([size='lg']) {
      --_track-w: 3.25rem;
      --_track-h: 1.9375rem;
      --_stretch: 0.5rem;
    }

    [part~='track'] {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: var(--_track-w);
      height: var(--_track-h);
      padding: var(--_pad);
      border-radius: var(--radius-full, 9999px);
      background-color: var(--color-fill-track-strong);
      box-shadow: inset 0 0 0 0.5px light-dark(oklch(0 0 0 / 0.04), oklch(1 0 0 / 0.06));
      transition: background-color var(--duration-base, 240ms) ease, box-shadow var(--duration-fast, 140ms) ease;
      flex-shrink: 0;
    }

    :host([is-checked]) [part~='track'] {
      background-color: var(--color-primary-500, #3b82f6);
    }

    :host(:focus-visible) {
      outline: none;
    }

    :host(:focus-visible) [part~='track'] {
      box-shadow: var(--focus-ring);
    }

    [part~='thumb'] {
      --_w: calc(var(--_track-h) - 2 * var(--_pad));
      display: block;
      width: var(--_w);
      height: calc(var(--_track-h) - 2 * var(--_pad));
      border-radius: var(--radius-full, 9999px);
      background-color: oklch(1 0 0);
      box-shadow:
        0 3px 8px oklch(0 0 0 / 0.15),
        0 1px 1px oklch(0 0 0 / 0.16),
        0 0 0 0.5px oklch(0 0 0 / 0.04);
      translate: 0 0;
      transition:
        translate var(--duration-slow, 420ms) var(--ease-spring, ease),
        width var(--duration-base, 240ms) var(--ease-out, ease);
      pointer-events: none;
    }

    /* Press-and-hold stretches the thumb toward the travel direction, like iOS */
    [part~='base']:active [part~='thumb'] {
      --_w: calc(var(--_track-h) - 2 * var(--_pad) + var(--_stretch));
    }

    :host([is-checked]) [part~='thumb'] {
      translate: calc(var(--_track-w) - 2 * var(--_pad) - var(--_w)) 0;
    }

    [part~='label'] {
      display: inline-flex;
      align-items: center;
      color: inherit;
    }

    :host([is-disabled]) {
      opacity: 0.45;
      cursor: not-allowed;
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='track'],
      [part~='thumb'] {
        transition: none;
      }
    }
  `,
]
