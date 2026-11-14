import { css } from 'lit'

export const noiseStyles = css`
  :host {
    display: block;
    position: relative;
    /* The grain stays inside the element's own stacking, over its content and nothing else. */
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  [part="grain"] {
    position: absolute;
    inset: 0;
    /* Over the content: the grain textures everything inside, text included. */
    z-index: 1;
    border-radius: inherit;
    pointer-events: none;
    background-color: var(--noise-color, var(--color-fg));
    opacity: var(--noise-opacity, 0.12);
    -webkit-mask-image: var(--_noise-image);
    mask-image: var(--_noise-image);
    -webkit-mask-size: var(--noise-size, 200px);
    mask-size: var(--noise-size, 200px);
  }

  /* Ten jumps a second, each to a new place on the tile, as film does. */
  :host([is-animated]) [part="grain"] {
    animation: moul-noise-jitter 1s steps(1, end) infinite;
  }

  @keyframes moul-noise-jitter {
    0% {
      mask-position: 0 0;
    }
    10% {
      mask-position: -47px 31px;
    }
    20% {
      mask-position: 83px -59px;
    }
    30% {
      mask-position: -121px -17px;
    }
    40% {
      mask-position: 29px 97px;
    }
    50% {
      mask-position: -71px -113px;
    }
    60% {
      mask-position: 137px 53px;
    }
    70% {
      mask-position: -13px -89px;
    }
    80% {
      mask-position: 61px 139px;
    }
    90% {
      mask-position: -103px 7px;
    }
    100% {
      mask-position: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part="grain"] {
      animation: none !important;
    }
  }

  /* Decoration only: where the system forces its colours, the content shows plain. */
  @media (forced-colors: active) {
    [part="grain"] {
      display: none;
    }
  }
`
