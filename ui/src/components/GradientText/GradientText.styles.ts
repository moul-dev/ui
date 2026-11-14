import { css } from 'lit'

export const gradientTextStyles = css`
  :host {
    display: inline;
    /* First colour equals the last, so the flowing gradient loops without a seam. */
    --_gradient-colors: var(
      --gradient-text-colors,
      var(--color-accent),
      var(--color-chart-3),
      var(--color-chart-5),
      var(--color-accent)
    );
    --_gradient-direction: to right;
    /* Where the gradient ends a loop: one whole tile along, so it starts again where it began. */
    --_gradient-flow-to: -200% 0;
    --_gradient-shine-base: var(
      --gradient-text-shine-base,
      color-mix(in oklab, var(--color-fg) 65%, transparent)
    );
    --_gradient-shine-color: var(--gradient-text-shine-color, var(--color-fg));
    /* The band starts past the inline start and ends past the inline end. */
    --_gradient-shine-from: -100% 0;
    --_gradient-shine-to: 200% 0;
  }

  :host(:dir(rtl)) {
    --_gradient-direction: to left;
    --_gradient-flow-to: 200% 0;
    --_gradient-shine-from: 200% 0;
    --_gradient-shine-to: -100% 0;
  }

  :host([hidden]) {
    display: none;
  }

  /* Only where text clipping works: elsewhere the text keeps its own colour. */
  @supports (background-clip: text) or (-webkit-background-clip: text) {
    :host {
      color: transparent;
      -webkit-background-clip: text;
      background-clip: text;
      /* Each wrapped line gets the whole gradient, rather than a slice of one long strip. */
      -webkit-box-decoration-break: clone;
      box-decoration-break: clone;
      background-image: linear-gradient(var(--_gradient-direction), var(--_gradient-colors));
      background-size: 200% 100%;
      background-repeat: repeat;
      background-position: 0% 0;
      animation: moul-gradient-text-flow var(--gradient-text-duration, 6s)
        linear infinite;
    }

    /* Subdued text with a bright band that sweeps across, then rests. */
    :host([effect="shine"]) {
      background-image:
        linear-gradient(
          to right,
          transparent,
          var(--_gradient-shine-color),
          transparent
        ),
        linear-gradient(var(--_gradient-shine-base), var(--_gradient-shine-base));
      background-size:
        40% 100%,
        100% 100%;
      background-repeat: no-repeat;
      background-position:
        var(--_gradient-shine-from),
        0 0;
      animation: moul-gradient-text-shine var(--gradient-text-duration, 4s)
        var(--ease-smooth, ease) infinite;
    }

    /* Colours drift slowly in two directions and blend into one another. */
    :host([effect="aurora"]) {
      background-image: linear-gradient(135deg, var(--_gradient-colors));
      background-size: 300% 300%;
      background-position: 0% 50%;
      animation: moul-gradient-text-aurora var(--gradient-text-duration, 12s)
        ease-in-out infinite;
    }
  }

  @keyframes moul-gradient-text-flow {
    to {
      background-position: var(--_gradient-flow-to);
    }
  }

  @keyframes moul-gradient-text-shine {
    0% {
      background-position:
        var(--_gradient-shine-from),
        0 0;
    }
    40%,
    100% {
      background-position:
        var(--_gradient-shine-to),
        0 0;
    }
  }

  @keyframes moul-gradient-text-aurora {
    0%,
    100% {
      background-position: 0% 50%;
    }
    25% {
      background-position: 50% 100%;
    }
    50% {
      background-position: 100% 50%;
    }
    75% {
      background-position: 50% 0%;
    }
  }

  /* A still gradient; the shine band waits out of sight, past the inline start. */
  @media (prefers-reduced-motion: reduce) {
    :host {
      animation: none !important;
    }
  }

  /* Plain text where colours are forced, and on paper, where backgrounds are often dropped. */
  @media (forced-colors: active), print {
    :host {
      color: inherit !important;
      background: none !important;
      -webkit-background-clip: border-box !important;
      background-clip: border-box !important;
      animation: none !important;
    }
  }
`
