import { css } from 'lit'

export const orbitStyles = css`
  :host {
    display: inline-block;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  /* The square: twice the radius, plus one item so the items at the edges
     stay inside it. --_orbit-radius and --_orbit-duration are set here from
     the attributes, never on the host. */
  .orbit {
    position: relative;
    --_orbit-item-size: var(--orbit-item-size, 2.5rem);
    --_orbit-side: calc(2 * var(--_orbit-radius, 120px) + var(--_orbit-item-size));
    /* 1 turns clockwise and lays the items out clockwise from the top; -1 mirrors both. */
    --_orbit-sign: 1;
    --_orbit-direction: normal;
    inline-size: var(--_orbit-side);
    block-size: var(--_orbit-side);
  }

  :host([is-reverse]) .orbit {
    --_orbit-direction: reverse;
  }

  /* Right-to-left text mirrors the orbit: items run anticlockwise from the
     top, and the ring turns that way too. */
  :host(:dir(rtl)) .orbit {
    --_orbit-sign: -1;
    --_orbit-direction: reverse;
  }

  :host([is-reverse]:dir(rtl)) .orbit {
    --_orbit-direction: normal;
  }

  .path {
    position: absolute;
    inset: calc(var(--_orbit-item-size) / 2);
    box-sizing: border-box;
    border: 1px solid var(--orbit-path-color, var(--color-border));
    border-radius: 50%;
    pointer-events: none;
  }

  .center {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    pointer-events: none;
  }

  .center > slot::slotted(*) {
    pointer-events: auto;
  }

  /* The turning layer. Only the items on it take the pointer, so the
     centre underneath stays clickable. It turns by animating the registered
     --moul-orbit-turn angle (see Orbit.ts), which the items inherit. */
  .ring {
    position: absolute;
    inset: 0;
    pointer-events: none;
    rotate: var(--moul-orbit-turn, 0turn);
    animation: moul-orbit-turn var(--_orbit-duration, 20s) linear infinite;
    animation-direction: var(--_orbit-direction);
  }

  /* Each item sits at its angle on the ring, counted from the top, and turns
     back by the ring's own angle, read from the inherited --moul-orbit-turn,
     so it stays upright in the same frame. No animation runs on the slotted
     items themselves: engines that do not look up a shadow root's
     @keyframes for ::slotted elements would leave them tilted. */
  .ring > slot::slotted(*) {
    --_orbit-angle: calc(
      var(--moul-orbit-index, 0) / var(--_orbit-count, 1) * 1turn - 0.25turn
    );
    /* !important: a page rule or an item's own :host style that made it
       relative would knock it off the ring. */
    position: absolute !important;
    inset-block-start: 50%;
    /* Physical on purpose: --_orbit-sign mirrors the ring in right-to-left text. */
    left: 50%;
    box-sizing: border-box;
    inline-size: var(--_orbit-item-size);
    block-size: var(--_orbit-item-size);
    margin: 0;
    object-fit: contain;
    pointer-events: auto;
    translate:
      calc(
        var(--_orbit-sign) * cos(var(--_orbit-angle)) * var(--_orbit-radius) -
          50%
      )
      calc(sin(var(--_orbit-angle)) * var(--_orbit-radius) - 50%);
    rotate: calc(var(--moul-orbit-turn, 0turn) * -1);
  }

  @keyframes moul-orbit-turn {
    from {
      --moul-orbit-turn: 0turn;
    }
    to {
      --moul-orbit-turn: 1turn;
    }
  }

  /* Only the ring animates, so pausing it holds the items still too. */
  :host([pause-on-hover]:hover) .ring,
  :host(:focus-within) .ring,
  .is-offscreen .ring {
    animation-play-state: paused;
  }

  /* A still picture: every item rests at its place, upright. */
  @media (prefers-reduced-motion: reduce) {
    .ring {
      animation: none !important;
    }
  }

  @media (forced-colors: active) {
    .path {
      display: none;
    }
  }
`
