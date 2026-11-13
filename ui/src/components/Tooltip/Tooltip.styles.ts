import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const tooltipStyles = [
  resetStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
      /* Grow out of the trigger edge, nudged 4px toward it (default: top) */
      --_origin: bottom center;
    }

    :host([placement="bottom"]) {
      --_origin: top center;
    }

    :host([placement="left"]) {
      --_origin: center right;
    }

    :host([placement="right"]) {
      --_origin: center left;
    }

    [part~="trigger"] {
      display: inline-block;
      anchor-name: --moul-tooltip-anchor;
    }

    /* A light floating label: elevated fill and overlay shadow, not an inverted bubble */
    [part~="popover"],
    [part~="tooltip"] {
      margin: 0;
      padding: var(--spacing-2, 0.5rem);
      background-color: var(--color-bg-elevated);
      color: var(--color-fg);
      border: none;
      border-radius: min(2rem, var(--radius-xl, 0.75rem));
      box-shadow: var(--shadow-overlay);
      font-family: inherit;
      font-weight: var(--font-weight-normal, 400);
      font-size: var(--font-size-xs, 0.75rem);
      line-height: var(--line-height-xs, 1rem);
      z-index: var(--z-tooltip, 1500);
      pointer-events: none;
      position-anchor: --moul-tooltip-anchor;
      inset: auto;
      max-width: 20rem;
      box-sizing: border-box;
      white-space: normal;
      overflow-wrap: anywhere;
      transform-origin: var(--_origin);
      /* Leans into the pointer's travel while following (script-driven). */
      rotate: var(--_tilt, 0deg);
    }

    [part~="popover"]:not(:popover-open):not(.\:popover-open) {
      display: none;
    }

    [part~="popover"]:popover-open,
    [part~="popover"].\:popover-open {
      display: block;
    }

    /* A tooltip card: room for an image above a few lines of text. */
    :host([is-rich]) [part~="popover"] {
      --_inset: var(--spacing-3, 0.75rem);
      padding: var(--_inset);
      border-radius: var(--radius-surface, 1.5rem);
      width: max-content;
      max-width: min(18rem, calc(100vw - 2rem));
      font-size: var(--font-size-sm, 0.875rem);
      line-height: var(--line-height-sm, 1.25rem);
    }

    slot[name="media"]::slotted(*) {
      display: block;
      width: 100%;
      height: auto;
      max-height: 10rem;
      object-fit: cover;
      margin-bottom: var(--spacing-2, 0.5rem);
      border-radius: max(
        0px,
        calc(var(--radius-surface, 1.5rem) - var(--_inset, 0.5rem))
      );
    }

    /*
     * Enter/exit fade and zoom are driven by OverlayPresenceController on the
     * panel's transform. The slide out of the trigger edge (--_slide, toward
     * the trigger) and the pointer follow (--_follow, along the edge) ride on
     * the separate translate property, so the two never overwrite each other.
     */
    @supports (anchor-name: --test) {
      :host([placement="top"]) [part~="popover"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: calc(-50% + var(--_follow, 0px)) var(--_slide, 0px);
        margin-bottom: 6px;
      }

      :host([placement="bottom"]) [part~="popover"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: calc(-50% + var(--_follow, 0px))
          calc(var(--_slide, 0px) * -1);
        margin-top: 6px;
      }

      :host([placement="left"]) [part~="popover"] {
        right: anchor(left);
        top: anchor(center);
        translate: var(--_slide, 0px) calc(-50% + var(--_follow, 0px));
        margin-right: 6px;
      }

      :host([placement="right"]) [part~="popover"] {
        left: anchor(right);
        top: anchor(center);
        translate: calc(var(--_slide, 0px) * -1)
          calc(-50% + var(--_follow, 0px));
        margin-left: 6px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part~="popover"] {
        rotate: none;
      }
    }
  `,
]
