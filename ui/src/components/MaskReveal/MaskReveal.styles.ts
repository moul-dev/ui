import { css } from 'lit'

/*
 * The pointer controller writes the circle's centre on the hidden layer, and
 * the element copies it to the visible one, at most once per frame:
 * --_mask-reveal-pointer-x and -y (registered, not inherited). The radius,
 * --_mask-reveal-r, comes from the state classes on .layers: at rest, active
 * (pointer over or finger down) and full (is-revealed or focus inside the
 * hidden layer). Both layers are cut by the same circle, the hidden one to
 * it and the visible one around it, so whatever their backgrounds the circle
 * shows only the hidden layer. Clipping and masking never lay the page out.
 */

export const maskRevealStyles = css`
  :host {
    display: block;
    --_mask-reveal-duration: var(--mask-reveal-duration, 0.3s);
  }

  :host([hidden]) {
    display: none;
  }

  /* Both layers in one grid cell: the element is as large as the larger one. */
  .layers {
    display: grid;
  }

  .layer {
    grid-area: 1 / 1;
    min-width: 0;
    --_mask-reveal-r: calc(var(--_mask-reveal-size, 0px) / 2);
    transition:
      --_mask-reveal-r var(--_mask-reveal-duration) var(--ease-out, ease-out),
      --_mask-reveal-pointer-x 80ms linear,
      --_mask-reveal-pointer-y 80ms linear;
  }

  .layers.is-active > .layer {
    --_mask-reveal-r: calc(var(--_mask-reveal-active-size, 240px) / 2);
  }

  .layers.is-full > .layer {
    --_mask-reveal-r: var(--_mask-reveal-full, 150vmax);
  }

  /* A hole where the circle is. */
  [part="content"] {
    -webkit-mask-image: radial-gradient(
      circle var(--_mask-reveal-r) at var(--_mask-reveal-pointer-x, 50%)
        var(--_mask-reveal-pointer-y, 50%),
      transparent calc(100% - 1px),
      #000 100%
    );
    mask-image: radial-gradient(
      circle var(--_mask-reveal-r) at var(--_mask-reveal-pointer-x, 50%)
        var(--_mask-reveal-pointer-y, 50%),
      transparent calc(100% - 1px),
      #000 100%
    );
  }

  /* The hidden layer, on top and cut to the circle: it takes the pointer only inside it. */
  [part="revealed"] {
    clip-path: circle(
      var(--_mask-reveal-r) at var(--_mask-reveal-pointer-x, 50%)
        var(--_mask-reveal-pointer-y, 50%)
    );
  }

  /* No circle: the whole hidden layer shows at once while active, and nothing at rest. */
  @media (prefers-reduced-motion: reduce) {
    .layers > .layer {
      transition: none;
      --_mask-reveal-r: 0px;
    }

    .layers.is-active > .layer,
    .layers.is-full > .layer {
      --_mask-reveal-r: var(--_mask-reveal-full, 150vmax);
    }
  }

  /* On paper, the visible layer only. */
  @media print {
    [part="content"] {
      -webkit-mask-image: none;
      mask-image: none;
    }

    [part="revealed"] {
      display: none;
    }
  }
`
