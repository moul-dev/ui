import { css } from 'lit'

/*
 * The host's view-timeline progress arrives as --_scroll-parallax-progress
 * (0 to 1). The script writes --_scroll-parallax-speed (px) on the host and
 * --_scroll-parallax-factor on each track, once; scrolling changes only the
 * progress. A track is centred at progress 0.5, when the host is in the
 * middle of the screen, and travels half the speed each way from there.
 */

export const scrollParallaxStyles = css`
  :host {
    --_scroll-parallax-direction: 1;

    display: block;
    overflow: hidden;
    overflow: clip;
  }

  :host([hidden]) {
    display: none;
  }

  /* Rows slide toward the inline end first, so they mirror in right-to-left text. */
  :host(:dir(rtl)) {
    --_scroll-parallax-direction: -1;
  }

  .tracks {
    display: flex;
    flex-direction: column;
    gap: var(--scroll-parallax-gap, var(--spacing-4, 1rem));
  }

  :host([orientation="columns"]) .tracks {
    flex-direction: row;
    align-items: flex-start;
  }

  ::slotted(*) {
    --_scroll-parallax-shift: calc(
      (var(--_scroll-parallax-progress, 0.5) - 0.5) *
        var(--_scroll-parallax-speed, 300px) *
        var(--_scroll-parallax-factor, 1)
    );

    translate: calc(
        var(--_scroll-parallax-shift) * var(--_scroll-parallax-direction)
      )
      0;
  }

  :host([orientation="columns"]) ::slotted(*) {
    flex: 1 1 0;
    min-inline-size: 0;
    translate: 0 var(--_scroll-parallax-shift);
  }

  .near ::slotted(*) {
    will-change: transform;
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*),
    :host([orientation="columns"]) ::slotted(*) {
      translate: none;
    }

    .near ::slotted(*) {
      will-change: auto;
    }
  }

  @media print {
    ::slotted(*),
    :host([orientation="columns"]) ::slotted(*) {
      translate: none;
    }
  }
`
