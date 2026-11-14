import { css } from 'lit'

export const lightRaysStyles = css`
  :host {
    display: block;
    position: relative;
    /* The rays sit behind the content but never behind the page. */
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [part="background"] {
    /* White light would vanish on a light page, so there the light is a soft accent blue. */
    --_light-rays-light: var(
      --light-rays-color,
      light-dark(
        color-mix(in oklab, var(--color-accent) 70%, var(--color-white)),
        color-mix(in oklab, var(--color-accent) 20%, var(--color-white))
      )
    );
    /* Strong enough to see on a light page; soft enough on a dark one that light text over it stays clear. */
    --_light-rays-fill: light-dark(
      color-mix(in oklab, var(--_light-rays-light) 70%, transparent),
      color-mix(in oklab, var(--_light-rays-light) 35%, transparent)
    );
    --_light-rays-blur: var(--light-rays-blur, 12px);
    --_light-rays-length: var(--light-rays-length, 70%);
    --_light-rays-duration: var(--light-rays-duration, 12s);
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }

  :host(:dir(rtl)) [part="background"] {
    transform: scaleX(-1);
  }

  /* A faint glow along the top, where the light comes in. */
  .glow {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      ellipse 70% 45% at 50% 0%,
      color-mix(in oklab, var(--_light-rays-fill) 45%, transparent),
      transparent 70%
    );
  }

  /* Larger than the element, so the blur fades out past its edges and the rays start above the top. */
  .rays {
    position: absolute;
    inset: calc(var(--_light-rays-blur) * -2);
    filter: blur(var(--_light-rays-blur));
  }

  /* Each ray hangs from the top and turns about the point where it comes in. */
  .ray {
    position: absolute;
    top: 0;
    left: var(--_light-rays-x);
    width: max(var(--_light-rays-width), 3rem);
    height: calc(var(--_light-rays-length) * var(--_light-rays-reach));
    translate: -50% 0;
    transform-origin: 50% 0;
    rotate: var(--_light-rays-angle);
    /* Narrow where it comes in, wider as it falls, fading out at the far end. */
    clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%);
    background-image: linear-gradient(
      to bottom,
      var(--_light-rays-fill),
      transparent
    );
    opacity: calc(var(--_light-rays-peak) * 0.6);
    animation:
      moul-light-rays-sway
        calc(var(--_light-rays-duration) * var(--_light-rays-pace) * 0.7)
        ease-in-out
        calc(var(--_light-rays-duration) * var(--_light-rays-delay) * -1)
        infinite alternate,
      moul-light-rays-breathe
        calc(var(--_light-rays-duration) * var(--_light-rays-pace) * 0.5)
        ease-in-out
        calc(var(--_light-rays-duration) * var(--_light-rays-delay) * -0.5)
        infinite alternate;
  }

  @keyframes moul-light-rays-sway {
    from {
      rotate: calc(var(--_light-rays-angle) - var(--_light-rays-swing));
    }
    to {
      rotate: calc(var(--_light-rays-angle) + var(--_light-rays-swing));
    }
  }

  @keyframes moul-light-rays-breathe {
    from {
      opacity: calc(var(--_light-rays-peak) * 0.25);
    }
    to {
      opacity: var(--_light-rays-peak);
    }
  }

  /* Each ray rests at its own angle, at a medium brightness. */
  @media (prefers-reduced-motion: reduce) {
    .ray {
      animation: none !important;
    }
  }

  /* Decoration only: where the system forces its colours, the content stands on the plain background. */
  @media (forced-colors: active) {
    [part="background"] {
      display: none;
    }
  }
`
