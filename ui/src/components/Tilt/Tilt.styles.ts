import { css } from 'lit'

/*
 * The pointer controller writes --_tilt-pointer-ratio-x and -y (0 to 1 across
 * the host) on the surface, once per frame. They are registered as
 * non-inheriting, so only the surface and the glare (which inherits them
 * explicitly) restyle while the pointer moves. The tilt is a single transform
 * on the surface; a short transition smooths the frame-by-frame targets, and
 * a spring brings the surface back flat when the pointer leaves.
 */

export const tiltStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  /* No variable derived from the pointer is declared on the surface: it would
     inherit into the content and restyle all of it on every frame. */
  .surface {
    position: relative;
    border-radius: inherit;
    transform-style: preserve-3d;
    transform: none;
    transition: transform var(--tilt-duration, 700ms) var(--ease-spring, ease-out);
  }

  /* So a box inside can take the element's radius with border-radius: inherit. */
  .surface > slot {
    border-radius: inherit;
  }

  .surface.is-active {
    /* Pointer on the right edge: the right side presses away (rotateY > 0).
       Pointer on the top edge: the top presses away (rotateX < 0). */
    transform: perspective(var(--_tilt-perspective, 1000px))
      rotateX(
        calc(
          (0.5 - clamp(0, var(--_tilt-pointer-ratio-y, 0.5), 1)) * 2 * var(--_tilt-max, 10) *
            var(--_tilt-direction, 1) * 1deg
        )
      )
      rotateY(
        calc(
          (clamp(0, var(--_tilt-pointer-ratio-x, 0.5), 1) - 0.5) * 2 * var(--_tilt-max, 10) *
            var(--_tilt-direction, 1) * 1deg
        )
      )
      scale(var(--_tilt-scale, 1.03));
    transition: transform 120ms var(--ease-out, ease-out);
    will-change: transform;
  }

  .glare {
    --_tilt-pointer-ratio-x: inherit;
    --_tilt-pointer-ratio-y: inherit;
    position: absolute;
    z-index: 1;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: 0;
    background: radial-gradient(
      farthest-corner circle at
        calc(clamp(0, var(--_tilt-pointer-ratio-x, 0.5), 1) * 100%)
        calc(clamp(0, var(--_tilt-pointer-ratio-y, 0.5), 1) * 100%),
      var(
        --tilt-glare-color,
        light-dark(
          color-mix(in oklab, var(--color-white) 38%, transparent),
          color-mix(in oklab, var(--color-white) 22%, transparent)
        )
      ),
      transparent 65%
    );
    transition: opacity var(--duration-slow, 400ms) var(--ease-out, ease-out);
  }

  .surface.is-active .glare {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .surface,
    .surface.is-active {
      transform: none;
      transition: none;
      will-change: auto;
    }

    .glare {
      display: none;
    }
  }

  @media (forced-colors: active) {
    .glare {
      display: none;
    }
  }
`
