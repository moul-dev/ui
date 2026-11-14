import { css } from 'lit'

export const spotlightStyles = css`
  :host {
    display: block;
    position: relative;
    /* The light sits behind the content but never behind the page. */
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
    /* White light would vanish on a light page, so there the light is the accent. */
    --_spotlight-light: var(
      --spotlight-color,
      light-dark(
        var(--color-accent),
        color-mix(in oklab, var(--color-accent) 12%, var(--color-white))
      )
    );
    /* The bright heart of a beam, its wider halo, and the glow around the lamp's line. */
    --_spotlight-core: light-dark(
      color-mix(in oklab, var(--_spotlight-light) 38%, transparent),
      color-mix(in oklab, var(--_spotlight-light) 30%, transparent)
    );
    --_spotlight-halo: light-dark(
      color-mix(in oklab, var(--_spotlight-light) 16%, transparent),
      color-mix(in oklab, var(--_spotlight-light) 12%, transparent)
    );
    --_spotlight-glow: light-dark(
      color-mix(in oklab, var(--_spotlight-light) 45%, transparent),
      color-mix(in oklab, var(--_spotlight-light) 35%, transparent)
    );
    --_spotlight-duration: var(--spotlight-duration, 2s);
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

  :host([variant="sway"]) [part="background"] {
    --_spotlight-duration: var(--spotlight-duration, 8s);
  }

  /* Cone: one long, soft ellipse of light, its near end past a top corner. */
  .cone {
    --_spotlight-x: 20%;
    --_spotlight-y: 8%;
    --_spotlight-angle: 30deg;
    /* Where it starts before it lights: further back along the beam, in its own widths and heights. */
    --_spotlight-from-x: -20%;
    --_spotlight-from-y: -45%;
    position: absolute;
    top: var(--_spotlight-y);
    left: var(--_spotlight-x);
    width: max(120%, 40rem);
    aspect-ratio: 3 / 1;
    background:
      radial-gradient(closest-side, var(--_spotlight-core), transparent)
        center / 100% 45% no-repeat,
      radial-gradient(closest-side, var(--_spotlight-halo), transparent);
    rotate: var(--_spotlight-angle);
    opacity: 0;
    scale: 0.5;
    translate: calc(-50% + var(--_spotlight-from-x))
      calc(-50% + var(--_spotlight-from-y));
  }

  :host([placement="center"]) .cone {
    --_spotlight-x: 50%;
    --_spotlight-y: 0%;
    --_spotlight-angle: 90deg;
    --_spotlight-from-x: 0%;
    --_spotlight-from-y: -50%;
  }

  :host([placement="end"]) .cone {
    --_spotlight-x: 80%;
    --_spotlight-angle: -30deg;
    --_spotlight-from-x: 20%;
  }

  :host([is-lit]) .cone {
    opacity: 1;
    scale: 1;
    translate: -50% -50%;
  }

  /* Lamp: a bright line along the top, a glow around it, and a cone of light spreading down from it. */
  .lamp-line,
  .lamp-glow,
  .lamp-cone {
    position: absolute;
    top: 0;
    left: 50%;
    /* Before it lights: half as wide and dim. */
    opacity: 0.4;
    scale: 0.5 1;
  }

  .lamp-line {
    width: min(60%, 32rem);
    height: 2px;
    border-radius: 1px;
    translate: -50% 0;
    background-color: var(--_spotlight-light);
    box-shadow: 0 0 0.75rem 0.125rem var(--_spotlight-glow);
  }

  .lamp-glow {
    width: min(70%, 36rem);
    height: 10rem;
    translate: -50% -50%;
    background-image: radial-gradient(
      closest-side,
      var(--_spotlight-glow),
      transparent
    );
  }

  /* A wedge from a point above the line, so it is about as wide as the line where it leaves it, faded out toward the sides and the bottom. */
  .lamp-cone {
    width: min(100%, 64rem);
    height: min(100%, 30rem);
    translate: -50% 0;
    transform-origin: 50% 0;
    background-image: conic-gradient(
      from 130deg at 50% -120%,
      transparent,
      var(--_spotlight-core) 35deg,
      var(--_spotlight-core) 65deg,
      transparent 100deg
    );
    -webkit-mask-image: radial-gradient(
      ellipse 50% 100% at 50% 0%,
      black 30%,
      transparent
    );
    mask-image: radial-gradient(
      ellipse 50% 100% at 50% 0%,
      black 30%,
      transparent
    );
  }

  :host([is-lit]) .lamp-line,
  :host([is-lit]) .lamp-glow,
  :host([is-lit]) .lamp-cone {
    opacity: 1;
    scale: 1;
  }

  /* Sway: two soft beams hanging from the top corners, swinging toward the middle and back. */
  .sway {
    position: absolute;
    top: 0;
    width: max(56%, 26rem);
    height: 160%;
    translate: -50% 0;
    transform-origin: 50% 0;
    /* Both gradients end inside the box (a horizontal radius of 50% at
       most), so the light has faded out before the box's sides: a wider
       halo was cut off by them and showed as a hard edge. */
    background:
      radial-gradient(30% 45% at 50% 0%, var(--_spotlight-core), transparent),
      radial-gradient(50% 70% at 50% 0%, var(--_spotlight-halo), transparent);
    /* Leaning in from its corner: negative leans the far end right, positive left. */
    rotate: calc(var(--_spotlight-tilt) * 32deg);
    opacity: 0;
    animation: moul-spotlight-sway var(--_spotlight-duration) ease-in-out
      infinite alternate;
  }

  .sway-start {
    --_spotlight-tilt: -1;
    left: 0;
  }

  .sway-end {
    --_spotlight-tilt: 1;
    left: 100%;
  }

  :host([is-lit]) .sway {
    opacity: 1;
  }

  @keyframes moul-spotlight-sway {
    from {
      rotate: calc(var(--_spotlight-tilt) * 44deg);
    }
    to {
      rotate: calc(var(--_spotlight-tilt) * 20deg);
    }
  }

  /* Only lighting up is animated; putting the light out for a replay is instant. */
  :host([is-lit]) .cone,
  :host([is-lit]) .lamp-line,
  :host([is-lit]) .lamp-glow,
  :host([is-lit]) .lamp-cone,
  :host([is-lit]) .sway {
    transition-property: opacity, scale, translate;
    transition-duration: var(--_spotlight-duration);
    transition-timing-function: var(--ease-out, ease-out);
    transition-delay: calc(var(--_spotlight-duration) * 0.1);
  }

  /* The sway beams only fade in, over a quarter of a swing. */
  :host([is-lit]) .sway {
    transition-duration: calc(var(--_spotlight-duration) / 4);
    transition-delay: 0s;
  }

  /* The light in place from the start, and the sway beams at rest. */
  @media (prefers-reduced-motion: reduce) {
    .cone,
    .lamp-line,
    .lamp-glow,
    .lamp-cone,
    .sway {
      transition: none !important;
      animation: none !important;
      opacity: 1 !important;
      scale: none !important;
    }

    .cone {
      translate: -50% -50% !important;
    }
  }

  /* Decoration only: where the system forces its colours, the content stands on the plain background. */
  @media (forced-colors: active) {
    [part="background"] {
      display: none;
    }
  }
`
