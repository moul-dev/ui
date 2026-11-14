import { css } from 'lit'

export const worldMapStyles = css`
  :host {
    display: block;
    /* Map units per CSS pixel, written from the rendered width (see measure()). */
    --_world-map-unit: 0.5;
    --_world-map-arc: var(--world-map-arc-color, var(--color-accent));
    --_world-map-marker: var(--world-map-marker-color, var(--color-accent));
    --_world-map-duration: var(--world-map-arc-duration, 1.4s);
    --_world-map-stagger: var(--world-map-arc-stagger, 0.35s);
  }

  :host([hidden]) {
    display: none;
  }

  .base {
    position: relative;
  }

  /* Arcs between northern places bow above the top row, so nothing clips them. */
  .map {
    display: block;
    inline-size: 100%;
    block-size: auto;
    overflow: visible;
  }

  /* Each dot is a zero-length line with a round cap, 0.55 of a cell across,
     and never less than 1.4px on screen, so a phone-sized map still reads. */
  .land {
    fill: none;
    stroke: var(
      --world-map-dot-color,
      color-mix(in oklab, var(--color-fg) 22%, transparent)
    );
    stroke-width: max(1.1px, calc(1.4px * var(--_world-map-unit)));
    stroke-linecap: round;
  }

  /* pathLength="1" on each arc, so a dash of 1 is the whole line. */
  .arc,
  .beam {
    fill: none;
    stroke: var(--_world-map-arc);
    stroke-linecap: round;
  }

  .arc {
    stroke-width: calc(1.5 * var(--_world-map-unit));
    stroke-dasharray: 1px 1px;
    stroke-dashoffset: 1px;
    opacity: 0.8;
  }

  /* A short light, parked before the start of the line until it runs. */
  .beam {
    stroke-width: calc(3 * var(--_world-map-unit));
    stroke-dasharray: 0.1px 2px;
    stroke-dashoffset: 0.1px;
  }

  .is-drawing .arc {
    animation: moul-world-map-draw var(--_world-map-duration)
      var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1))
      calc(var(--_world-map-index, 0) * var(--_world-map-stagger)) forwards;
  }

  .is-drawing .beam {
    animation: moul-world-map-travel 2.6s linear
      calc(
        var(--_world-map-duration) + var(--_world-map-index, 0) *
          var(--_world-map-stagger)
      )
      infinite;
  }

  @keyframes moul-world-map-draw {
    to {
      stroke-dashoffset: 0px;
    }
  }

  @keyframes moul-world-map-travel {
    from {
      stroke-dashoffset: 0.1px;
    }
    to {
      stroke-dashoffset: -1px;
    }
  }

  /* Pins are HTML over the SVG, so they keep their size at any map width. */
  .markers {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .marker {
    position: absolute;
    inline-size: 0.5rem;
    block-size: 0.5rem;
    translate: -50% -50%;
    border-radius: 50%;
    background: var(--_world-map-marker);
    box-shadow: 0 0 0 2px var(--color-background, transparent);
  }

  .marker::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--_world-map-marker);
    opacity: 0;
  }

  .is-drawing .marker::before {
    animation: moul-world-map-pulse 2.4s var(--ease-out, ease-out) infinite;
  }

  @keyframes moul-world-map-pulse {
    from {
      opacity: 0.5;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(3.2);
    }
  }

  /* Physical on purpose: the map runs west to east in any writing direction,
     and a label beside a pin near the eastern edge goes to its west. */
  .label {
    position: absolute;
    inset-block-start: 50%;
    left: calc(100% + 0.375rem);
    translate: 0 -50%;
    padding: 0.0625rem 0.375rem;
    border-radius: var(--radius-sm, 0.25rem);
    background: color-mix(in oklab, var(--color-background) 80%, transparent);
    color: var(--color-fg);
    font-size: var(--font-size-xs, 0.75rem);
    line-height: 1.4;
    white-space: nowrap;
  }

  .label.is-start {
    left: auto;
    right: calc(100% + 0.375rem);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* A still picture: every arc drawn, no light running, no pulse. */
  @media (prefers-reduced-motion: reduce) {
    .arc {
      stroke-dashoffset: 0px;
      animation: none !important;
    }

    .beam {
      display: none;
    }

    .marker::before {
      animation: none !important;
    }
  }

  @media (forced-colors: active) {
    .land {
      stroke: GrayText;
    }

    .arc,
    .beam,
    .marker,
    .marker::before {
      stroke: Highlight;
      background: Highlight;
    }
  }
`
