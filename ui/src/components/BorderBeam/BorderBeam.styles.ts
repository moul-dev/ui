import { css } from 'lit'

export const borderBeamStyles = css`
  :host {
    display: block;
    position: relative;
    /* The moul-card radius. Set border-radius on the element to change it: the ring and the beam's path follow. */
    border-radius: var(--radius-surface, 1.5rem);
    --_border-beam-size: var(--border-beam-size, 80px);
    --_border-beam-width: var(--border-beam-width, 1.5px);
    --_border-beam-duration: var(--border-beam-duration, 6s);
    --_border-beam-delay: var(--border-beam-delay, 0s);
    --_border-beam-from: var(--border-beam-color-from, var(--color-accent));
    --_border-beam-to: var(--border-beam-color-to, var(--color-chart-4));
    /* Clockwise from the top left. */
    --_border-beam-direction: normal;
    --_border-beam-rotate: auto;
    /* The fallback ring: the head at the end of the turn, the tail fading behind it. */
    --_border-beam-stops: transparent 78%, var(--_border-beam-to) 94%,
      var(--_border-beam-from);
    /* Where the still highlight rests under reduced motion. */
    --_border-beam-corner: 0 0;
  }

  /* The other way round: the beam runs backwards along the path, turned to face where it goes. */
  :host([is-reverse]),
  :host(:dir(rtl)) {
    --_border-beam-direction: reverse;
    --_border-beam-rotate: reverse;
    --_border-beam-stops: var(--_border-beam-from), var(--_border-beam-to) 6%,
      transparent 22%;
  }

  :host([is-reverse]:dir(rtl)) {
    --_border-beam-direction: normal;
    --_border-beam-rotate: auto;
    --_border-beam-stops: transparent 78%, var(--_border-beam-to) 94%,
      var(--_border-beam-from);
  }

  :host(:dir(rtl)) {
    --_border-beam-corner: 100% 0;
  }

  :host([hidden]) {
    display: none;
  }

  /* Left empty, it is an overlay: let the pointer through to the box beneath. */
  :host(:empty) {
    pointer-events: none;
  }

  /* Slotted content can take the element's radius with border-radius: inherit. */
  slot {
    border-radius: inherit;
  }

  /* A ring of --border-beam-width over the content's edge: the padding is all that the mask lets through. */
  [part="border"] {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    padding: var(--_border-beam-width);
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  /* A square that fades from the head colour to nothing, carried round the
     ring's own rounded edge (a lone box in offset-path is that box with its
     border-radius) and turned to face the way it goes. */
  .beam {
    position: absolute;
    top: 0;
    left: 0;
    width: var(--_border-beam-size);
    aspect-ratio: 1;
    background: linear-gradient(
      to left,
      var(--_border-beam-from),
      var(--_border-beam-to),
      transparent
    );
    offset-path: border-box;
    offset-rotate: var(--_border-beam-rotate);
    animation: moul-border-beam-travel var(--_border-beam-duration) linear
      calc(var(--_border-beam-delay) * -1) infinite
      var(--_border-beam-direction);
  }

  @keyframes moul-border-beam-travel {
    from {
      offset-distance: 0%;
    }
    to {
      offset-distance: 100%;
    }
  }

  /* No motion path: a conic ring turns instead, its bright end leading. */
  @supports not (offset-path: border-box) {
    .beam {
      display: none;
    }

    [part="border"] {
      background: conic-gradient(
        from var(--moul-border-beam-angle, 0deg),
        var(--_border-beam-stops)
      );
      animation: moul-border-beam-turn var(--_border-beam-duration) linear
        calc(var(--_border-beam-delay) * -1) infinite
        var(--_border-beam-direction);
    }
  }

  @keyframes moul-border-beam-turn {
    to {
      --moul-border-beam-angle: 1turn;
    }
  }

  /* Nothing travels: a soft highlight rests on the corner the beam starts from. */
  @media (prefers-reduced-motion: reduce) {
    .beam {
      display: none;
    }

    [part="border"] {
      animation: none !important;
      background: radial-gradient(
        circle var(--_border-beam-size) at var(--_border-beam-corner),
        var(--_border-beam-from),
        var(--_border-beam-to) 45%,
        transparent
      );
    }
  }

  /* A decoration only: not drawn where colours are forced, or on paper. */
  @media (forced-colors: active), print {
    [part="border"] {
      display: none;
    }
  }
`
