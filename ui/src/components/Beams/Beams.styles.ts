import { css } from 'lit'

export const beamsStyles = css`
  :host {
    display: block;
    position: relative;
    /* The background sits at z-index -1 inside the element, behind the content but over the element's own background. */
    isolation: isolate;
    --_beams-color: var(
      --beams-color,
      light-dark(
        color-mix(in oklab, var(--color-fg) 9%, transparent),
        color-mix(in oklab, var(--color-fg) 12%, transparent)
      )
    );
    --_beams-light: var(--beams-light, var(--color-accent));
    --_beams-light-tail: var(--beams-light-tail, var(--color-chart-4));
    --_beams-glow: color-mix(in oklab, var(--_beams-light) 65%, transparent);
    --_beams-duration: var(--beams-duration, 10s);
    /* The bright head of every pulse, as a share of its path. */
    --_beams-head: 0.035;
  }

  :host([variant="lines"]),
  :host([variant="rain"]) {
    --_beams-duration: var(--beams-duration, 8s);
  }

  :host([variant="rain"]) {
    --_beams-head: 0.05;
  }

  :host([hidden]) {
    display: none;
  }

  /* Left empty, it is a layer: let the pointer through to what is beneath. */
  :host(:empty) {
    pointer-events: none;
  }

  [part="background"] {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }

  /* The beams come in from the top-right corner instead. */
  :host(:dir(rtl)) [part="background"] {
    scale: -1 1;
  }

  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .tracks path {
    fill: none;
    stroke: var(--_beams-color);
    stroke-width: 1;
  }

  /* Rain tracks fade out towards the top, so they read as falling light, not bars. */
  :host([variant="rain"]) .tracks {
    -webkit-mask-image: linear-gradient(transparent, #000);
    mask-image: linear-gradient(transparent, #000);
  }

  .lights {
    filter: drop-shadow(0 0 3px var(--_beams-glow));
  }

  /* A pulse is three dashes that share a head: a long dim tail, a brighter
     body and a short head, so it fades from head to tail. Each dash is a
     share of its path (pathLength="1") with a gap longer than the path, so
     only one shows. Its offset puts the head at --_beams-rest (hidden
     below 0) until the animation moves it. Dash values carry px (user units,
     scaled by pathLength): Chrome will not interpolate a unitless calc() on
     stroke-dashoffset and jumps from start to end instead. */
  .pulse {
    fill: none;
    stroke-linecap: round;
    stroke-dasharray: calc(var(--_beams-len) * 1px) 4px;
    stroke-dashoffset: calc((var(--_beams-len) - var(--_beams-rest)) * 1px);
    animation-name: moul-beams-travel;
    animation-duration: calc(var(--_beams-duration) * var(--_beams-speed));
    animation-delay: calc(
      var(--_beams-duration) * var(--_beams-speed) * var(--_beams-phase) * -1
    );
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
  }

  .tail {
    --_beams-len: var(--_beams-tail);
    stroke: var(--_beams-light-tail);
    stroke-width: 1.5;
    stroke-opacity: 0.4;
  }

  .body {
    --_beams-len: calc(var(--_beams-tail) / 2);
    stroke: var(--_beams-light-tail);
    stroke-width: 1.5;
    stroke-opacity: 0.6;
  }

  .head {
    --_beams-len: var(--_beams-head);
    stroke: var(--_beams-light);
    stroke-width: 2;
  }

  :host([variant="lines"]) .pulse {
    animation-name: moul-beams-flow;
    animation-timing-function: linear;
  }

  :host([variant="rain"]) .pulse {
    animation-name: moul-beams-fall;
  }

  /* The head runs from just before the path's start until the tail has
     passed its end, then the path rests dark until the next cycle. */
  @keyframes moul-beams-travel {
    from {
      stroke-dashoffset: calc((var(--_beams-len) + 0.02) * 1px);
    }
    70%,
    to {
      stroke-dashoffset: calc((var(--_beams-len) - 1.02 - var(--_beams-tail)) * 1px);
    }
  }

  @keyframes moul-beams-flow {
    from {
      stroke-dashoffset: calc((var(--_beams-len) + 0.02) * 1px);
    }
    60%,
    to {
      stroke-dashoffset: calc((var(--_beams-len) - 1.02 - var(--_beams-tail)) * 1px);
    }
  }

  /* Falls faster and faster, lands at 40% (when its flash goes off), then drains into the edge. */
  @keyframes moul-beams-fall {
    from {
      stroke-dashoffset: calc((var(--_beams-len) + 0.02) * 1px);
      animation-timing-function: ease-in;
    }
    40% {
      stroke-dashoffset: calc((var(--_beams-len) - 1) * 1px);
      animation-timing-function: linear;
    }
    47%,
    to {
      stroke-dashoffset: calc((var(--_beams-len) - 1.02 - var(--_beams-tail)) * 1px);
    }
  }

  /* Where a falling beam lands: a soft burst on the bottom edge, half of it below. */
  .flash {
    position: absolute;
    bottom: 0;
    width: 5rem;
    height: 1.75rem;
    translate: -50% 50%;
    border-radius: 50%;
    background: radial-gradient(
      closest-side,
      var(--_beams-light),
      color-mix(in oklab, var(--_beams-light) 35%, transparent) 55%,
      transparent
    );
    opacity: 0;
    animation: moul-beams-flash calc(var(--_beams-duration) * var(--_beams-speed))
      ease-out
      calc(
        var(--_beams-duration) * var(--_beams-speed) * var(--_beams-phase) * -1
      )
      infinite both;
  }

  @keyframes moul-beams-flash {
    0%,
    39.5% {
      opacity: 0;
      scale: 0.2 0.4;
    }
    41% {
      opacity: 1;
      scale: 1;
    }
    58%,
    100% {
      opacity: 0;
      scale: 1.5 1;
    }
  }

  .is-offscreen .pulse,
  .is-offscreen .flash {
    animation-play-state: paused;
  }

  /* The paths stay; nothing travels. Pulses with a rest point stay lit there. */
  @media (prefers-reduced-motion: reduce) {
    .pulse,
    .flash {
      animation: none !important;
    }
  }

  /* A decoration only: not drawn where colours are forced, or on paper. */
  @media (forced-colors: active), print {
    [part="background"] {
      display: none;
    }
  }
`
