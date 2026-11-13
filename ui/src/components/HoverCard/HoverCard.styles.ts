import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const hoverCardStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
      --_gap: var(--hover-card-offset, 8px);
      /* Grow out of the trigger edge */
      --_origin: top center;
    }

    :host([hidden]) {
      display: none;
    }

    :host([placement="top"]) {
      --_origin: bottom center;
    }

    :host([placement="left"]) {
      --_origin: center right;
    }

    :host([placement="right"]) {
      --_origin: center left;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-hover-card-anchor;
    }

    [part~="card"] {
      margin: 0;
      padding: var(--spacing-4, 1rem);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      border: none;
      border-radius: var(--radius-surface, 1.5rem);
      box-shadow: var(--shadow-overlay);
      font-family: inherit;
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
      position-anchor: --moul-hover-card-anchor;
      inset: auto;
      width: max-content;
      min-width: 12rem;
      max-width: min(20rem, calc(100vw - 2rem));
      box-sizing: border-box;
      overflow: visible;
      z-index: var(--z-popover, 1000);
      transform-origin: var(--_origin);
    }

    [part~="card"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="card"]:popover-open,
    [part~="card"].\:popover-open {
      display: block;
    }

    /*
     * Invisible bridges over the gap on both sides of the placement axis, so
     * the pointer is already inside the card as it crosses from the trigger,
     * whichever way the card flipped.
     */
    [part~="card"]::before,
    [part~="card"]::after {
      content: "";
      position: absolute;
      inset-inline: 0;
      height: var(--_gap);
    }

    [part~="card"]::before {
      bottom: 100%;
    }

    [part~="card"]::after {
      top: 100%;
    }

    :host([placement="left"]) [part~="card"]::before,
    :host([placement="left"]) [part~="card"]::after,
    :host([placement="right"]) [part~="card"]::before,
    :host([placement="right"]) [part~="card"]::after {
      inset-inline: auto;
      inset-block: 0;
      width: var(--_gap);
      height: auto;
    }

    :host([placement="left"]) [part~="card"]::before,
    :host([placement="right"]) [part~="card"]::before {
      right: 100%;
    }

    :host([placement="left"]) [part~="card"]::after,
    :host([placement="right"]) [part~="card"]::after {
      left: 100%;
    }

    /* Enter/exit motion (fade + zoom) is driven by OverlayPresenceController on the card. */
    @supports (anchor-name: --test) {
      :host([placement="bottom"]) [part~="card"],
      :host(:not([placement])) [part~="card"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: -50% 0;
        margin-top: var(--_gap);
        position-try-fallbacks: flip-block;
      }

      :host([placement="top"]) [part~="card"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: -50% 0;
        margin-bottom: var(--_gap);
        position-try-fallbacks: flip-block;
      }

      :host([placement="left"]) [part~="card"] {
        right: anchor(left);
        top: anchor(center);
        translate: 0 -50%;
        margin-right: var(--_gap);
        position-try-fallbacks: flip-inline;
      }

      :host([placement="right"]) [part~="card"] {
        left: anchor(right);
        top: anchor(center);
        translate: 0 -50%;
        margin-left: var(--_gap);
        position-try-fallbacks: flip-inline;
      }
    }
  `,
]
