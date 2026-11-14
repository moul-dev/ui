import { css } from 'lit'

/*
 * The host's view-timeline progress arrives as --_sticky-stack-progress
 * (0 to 1, animated natively or written once per frame by the fallback).
 * The script writes four variables on each child once per layout, never
 * while the reader scrolls:
 *
 * - --_sticky-stack-index: its place in the pile, for its sticky top;
 * - --_sticky-stack-from: the progress at which the next child reaches it;
 * - --_sticky-stack-span: 1 / the progress over which it shrinks;
 * - --_sticky-stack-depth: 0 for the top card, 1 for the bottom one.
 *
 * Each child turns those into --_sticky-stack-t, 0 to 1, and from it a
 * `scale` and a `filter`. Only the individual `scale` property is used, so
 * a transform of the author's own on a card is left alone.
 */

export const stickyStackStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .stack {
    display: flex;
    flex-direction: column;
    gap: var(--sticky-stack-gap, var(--spacing-8, 2rem));
  }

  ::slotted(*) {
    --_sticky-stack-t: clamp(
      0,
      (var(--_sticky-stack-progress, 0) - var(--_sticky-stack-from, 1)) *
        var(--_sticky-stack-span, 0),
      1
    );

    position: sticky;
    top: calc(
      var(--sticky-stack-top, var(--spacing-4, 1rem)) +
        var(--_sticky-stack-index, 0) *
        var(--sticky-stack-step, var(--spacing-4, 1rem))
    );
    transform-origin: 50% 0;
    scale: calc(
      1 - var(--_sticky-stack-t) * (1 - var(--_sticky-stack-min-scale, 0.9)) *
        var(--_sticky-stack-depth, 0)
    );
    filter: brightness(
      calc(
        1 - var(--_sticky-stack-t) * var(--sticky-stack-dim, 0.2) *
          var(--_sticky-stack-depth, 0)
      )
    );
  }

  /* Layers only while the pile is near the screen. */
  .near ::slotted(*) {
    will-change: transform, filter;
  }

  /* The cards still stick and stack: that is layout, moved by the reader. */
  @media (prefers-reduced-motion: reduce) {
    ::slotted(*) {
      scale: none;
      filter: none;
    }

    .near ::slotted(*) {
      will-change: auto;
    }
  }

  @media print {
    ::slotted(*) {
      position: static;
      scale: none;
      filter: none;
    }
  }
`
