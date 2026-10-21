import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const sliderStyles = [
  resetStyles,
  css`
    :host {
      display: block;
      width: 100%;
      font-family: var(--font-family-base, inherit);
      color: var(--color-fg, inherit);
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      /* Half the thumb's width: the bar runs this far past either end of the value range */
      --_inset: 0.75rem;
    }

    :host([hidden]) {
      display: none !important;
    }

    [part~='base'] {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-1, 0.25rem);
      width: 100%;
    }

    [part~='header'] {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      font-weight: var(--font-weight-medium, 500);
    }

    [part~='label'] {
      color: var(--color-fg, inherit);
    }

    [part~='output'] {
      color: var(--color-fg, inherit);
      font-variant-numeric: tabular-nums;
    }

    /* The padding keeps the track (the value range) clear of the bar's rounded ends */
    [part~='track-container'] {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
      height: 1.25rem;
      padding-inline: var(--_inset);
      cursor: pointer;
      touch-action: none;
    }

    [part~='track-container']::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: var(--radius-xl, 0.75rem);
      background-color: var(--color-default);
    }

    [part~='track'] {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /* Extends back over the inset so the fill starts at the bar's rounded end */
    [part~='fill'] {
      position: absolute;
      left: 0;
      top: 0;
      box-sizing: content-box;
      height: 100%;
      margin-left: calc(-1 * var(--_inset));
      padding-left: var(--_inset);
      border-radius: var(--radius-xl, 0.75rem) 0 0 var(--radius-xl, 0.75rem);
      background-color: var(--color-accent);
      pointer-events: none;
    }

    /* An accent socket holding a white pill */
    [part~='thumb'] {
      position: absolute;
      top: 50%;
      translate: -50% -50%;
      display: flex;
      align-items: center;
      justify-content: center;
      width: calc(2 * var(--_inset) + 0.25rem);
      height: 100%;
      border-radius: var(--radius-xl, 0.75rem);
      background-color: var(--color-accent);
      cursor: grab;
      outline: none;
      transition:
        background-color 250ms var(--ease-smooth, ease),
        box-shadow 150ms var(--ease-out, ease-out);
    }

    [part~='thumb']::after {
      content: '';
      width: 1.5rem;
      height: 1rem;
      border-radius: var(--radius-lg, 0.5rem);
      background-color: var(--color-accent-fg);
      box-shadow: var(--shadow-field);
      transition: scale 150ms var(--ease-out, ease-out);
    }

    [part~='track-container']:active [part~='thumb'] {
      cursor: grabbing;
    }

    [part~='track-container']:active [part~='thumb']::after {
      scale: 0.9;
    }

    [part~='thumb']:focus-visible {
      z-index: 1;
      outline: none;
      box-shadow: var(--focus-ring);
    }

    :host([is-disabled]) {
      opacity: var(--disabled-opacity, 0.5);
      cursor: not-allowed;
      pointer-events: none;
    }

    :host([is-disabled]) [part~='track-container'],
    :host([is-disabled]) [part~='thumb'] {
      cursor: not-allowed;
    }

    @media (prefers-reduced-motion: reduce) {
      [part~='thumb'],
      [part~='thumb']::after {
        transition: none;
      }

      [part~='track-container']:active [part~='thumb']::after {
        scale: none;
      }
    }
  `,
]
