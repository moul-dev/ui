import { css } from 'lit'

/*
 * The element writes --_pointer-parallax-x and -y (each -1 to 1) on the
 * layers wrapper, at most once per frame, and each child's depth once, as
 * --_pointer-parallax-depth on the child. Every child moves by the
 * independent translate property, so it keeps whatever transform the page
 * gives it; a transition smooths the frame-by-frame targets into a float.
 */

export const pointerParallaxStyles = css`
  :host {
    display: block;
    position: relative;
  }

  :host([hidden]) {
    display: none;
  }

  .layers {
    display: contents;
  }

  ::slotted(*) {
    translate: calc(
        var(--_pointer-parallax-x, 0) * var(--_pointer-parallax-depth, 0) *
          var(--_pointer-parallax-strength, 24) * 1px
      )
      calc(
        var(--_pointer-parallax-y, 0) * var(--_pointer-parallax-depth, 0) *
          var(--_pointer-parallax-strength, 24) * 1px
      );
    transition: translate var(--pointer-parallax-duration, 600ms)
      var(--ease-out, ease-out);
  }

  .layers.is-active ::slotted(*) {
    will-change: translate;
  }

  @media (prefers-reduced-motion: reduce) {
    ::slotted(*),
    .layers.is-active ::slotted(*) {
      translate: none;
      transition: none;
      will-change: auto;
    }
  }
`
