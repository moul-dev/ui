import { css } from 'lit'

/*
 * The pointer controller writes --_lens-pointer-x and -y (px, registered,
 * not inherited) on the lens once per frame, and the element copies them to
 * .zoomed. The lens is moved to the pointer with `translate`, and the copy
 * inside it is moved the other way and scaled from its top-left corner, so
 * the point under the pointer sits in the middle of the lens:
 *
 *   copy offset = lens size / 2 - pointer * zoom
 *
 * The host carries --_lens-size, --_lens-zoom, the content's size
 * (--_lens-width and -height) and, for a static lens, --_lens-position-x
 * and -y. Only transforms change while the pointer moves.
 */

export const lensStyles = css`
  :host {
    display: block;
    position: relative;
    --_lens-size: 160px;
    --_lens-zoom: 2;
  }

  :host([hidden]) {
    display: none;
  }

  .viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }

  [part="lens"] {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--_lens-size);
    height: var(--_lens-size);
    border-radius: 50%;
    overflow: hidden;
    background: var(--lens-background, var(--color-bg, var(--color-surface)));
    box-shadow:
      0 0 0 1px var(--lens-border-color, var(--color-border)),
      var(--shadow-lg, 0 10px 30px -10px rgb(0 0 0 / 0.35));
    translate: calc(var(--_lens-pointer-x, 0px) - var(--_lens-size) / 2)
      calc(var(--_lens-pointer-y, 0px) - var(--_lens-size) / 2);
    opacity: 0;
    scale: 0.6;
    transition:
      opacity 150ms ease-out,
      scale 200ms var(--ease-out, ease-out);
  }

  .viewport.is-active [part="lens"],
  :host([is-static]) [part="lens"] {
    opacity: 1;
    scale: 1;
  }

  .viewport.is-active [part="lens"] {
    will-change: translate;
  }

  /* The copy of the content, laid out at the content's own width. */
  .zoomed {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--_lens-width, 100%);
    height: var(--_lens-height, auto);
    transform-origin: 0 0;
    translate: calc(
        var(--_lens-size) / 2 - var(--_lens-pointer-x, 0px) * var(--_lens-zoom)
      )
      calc(
        var(--_lens-size) / 2 - var(--_lens-pointer-y, 0px) * var(--_lens-zoom)
      );
    scale: var(--_lens-zoom);
  }

  /* A lens that stays put. Percentages in left and top are of the content;
     in the copy's translate they are of the copy, which is the same size. */
  :host([is-static]) [part="lens"] {
    left: var(--_lens-position-x, 50%);
    top: var(--_lens-position-y, 50%);
    translate: -50% -50%;
  }

  :host([is-static]) .zoomed {
    translate: calc(
        var(--_lens-size) / 2 - var(--_lens-position-x, 50%) *
          var(--_lens-zoom)
      )
      calc(
        var(--_lens-size) / 2 - var(--_lens-position-y, 50%) *
          var(--_lens-zoom)
      );
  }

  /* The lens appears and goes at once. */
  @media (prefers-reduced-motion: reduce) {
    [part="lens"] {
      transition: none;
      scale: 1;
    }
  }

  @media (forced-colors: active) {
    [part="lens"] {
      border: 1px solid CanvasText;
    }
  }

  @media print {
    .viewport {
      display: none;
    }
  }
`
