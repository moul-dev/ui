import { css, unsafeCSS } from 'lit'

/*
 * One tile of a honeycomb of flat-topped hexagons, 40px corner to corner:
 * a whole hexagon and the bar to the next, plus short stubs across the
 * tile's edges so the joins between tiles have no notches. The stroke stays
 * one pixel wide at any --pattern-size.
 */
const HEXAGON_TILE = unsafeCSS(
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='34.641' viewBox='0 0 60 34.641' preserveAspectRatio='none'%3E%3Cpath d='M10 0H30L40 17.3205L30 34.641H10L0 17.3205ZM40 17.3205H60M60 17.3205L70 0M60 17.3205L70 34.641M10 0L0 -17.3205M30 0L40 -17.3205M10 34.641L0 51.9615M30 34.641L40 51.9615' fill='none' stroke='black' stroke-width='1' vector-effect='non-scaling-stroke'/%3E%3C/svg%3E\")",
)

export const patternStyles = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  [part='background'] {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;

    --_pattern-size: var(--pattern-size, 24px);
    --_pattern-color: var(
      --pattern-color,
      color-mix(in oklab, var(--color-fg) 15%, transparent)
    );
    --_pattern-line-width: var(--pattern-line-width, 1px);
    --_pattern-dot-size: var(--pattern-dot-size, 2px);
    --_pattern-highlight: var(
      --pattern-highlight,
      color-mix(in oklab, var(--color-accent) 30%, transparent)
    );
    --_pattern-duration: var(--pattern-duration, 4s);
    /* How far the drift moves in one loop: one tile along the row. */
    --_pattern-tile-x: var(--_pattern-size);
    --_pattern-drift-sign: 1;
  }

  /* The drift runs toward the inline end, so leftward in right-to-left text. */
  :host(:dir(rtl)) [part='background'] {
    --_pattern-drift-sign: -1;
  }

  :host([variant='dots']) [part='background'] {
    --_pattern-color: var(
      --pattern-color,
      color-mix(in oklab, var(--color-fg) 25%, transparent)
    );
    --_pattern-highlight: var(
      --pattern-highlight,
      color-mix(in oklab, var(--color-accent) 85%, transparent)
    );
  }

  :host([variant='grid']) [part='background'] {
    --_pattern-size: var(--pattern-size, 40px);
  }

  :host([variant='hexagons']) [part='background'] {
    --_pattern-size: var(--pattern-size, 40px);
    --_pattern-tile-x: calc(var(--_pattern-size) * 1.5);
    --_pattern-duration: var(--pattern-duration, 12s);
  }

  :host([variant='stripes']) [part='background'] {
    --_pattern-color: var(
      --pattern-color,
      color-mix(in oklab, var(--color-fg) 6%, transparent)
    );
    --_pattern-duration: var(--pattern-duration, 6s);
  }

  :host([variant='lines']) [part='background'] {
    --_pattern-size: var(--pattern-size, 10px);
    --_pattern-duration: var(--pattern-duration, 3s);
  }

  /* Every pattern tiles from the top left, so lit cells line up with drawn cells at any size. */
  .pattern {
    position: absolute;
    inset: 0;
    background-size: var(--_pattern-size) var(--_pattern-size);
  }

  /* A dot in the middle of each cell. */
  :host([variant='dots']) .pattern {
    background-image: radial-gradient(
      circle at center,
      var(--_pattern-color) calc(var(--_pattern-dot-size) / 2),
      transparent calc(var(--_pattern-dot-size) / 2 + 0.5px)
    );
  }

  /* A line along the top and the left of each cell. */
  :host([variant='grid']) .pattern {
    background-image:
      linear-gradient(
        to right,
        var(--_pattern-color) var(--_pattern-line-width),
        transparent var(--_pattern-line-width)
      ),
      linear-gradient(
        to bottom,
        var(--_pattern-color) var(--_pattern-line-width),
        transparent var(--_pattern-line-width)
      );
  }

  /* Two bands per tile at 45 degrees, which meet the next tile's bands without a seam. */
  :host([variant='stripes']) .pattern {
    background-image: linear-gradient(
      315deg,
      var(--_pattern-color) 25%,
      transparent 25% 50%,
      var(--_pattern-color) 50% 75%,
      transparent 75%
    );
  }

  /* Hairlines at 45 degrees, one through each tile and one across its corners. */
  :host([variant='lines']) .pattern {
    background-image: repeating-linear-gradient(
      315deg,
      var(--_pattern-color) 0 var(--_pattern-line-width),
      transparent calc(var(--_pattern-line-width) + 0.75px) 50%
    );
  }

  /* The colour shows through a honeycomb mask, one tile 1.5 hexagons wide. */
  :host([variant='hexagons']) .pattern {
    background-color: var(--_pattern-color);
    -webkit-mask-image: ${HEXAGON_TILE};
    mask-image: ${HEXAGON_TILE};
    -webkit-mask-size: var(--_pattern-tile-x)
      calc(var(--_pattern-size) * 0.866025);
    mask-size: var(--_pattern-tile-x) calc(var(--_pattern-size) * 0.866025);
  }

  /* The drift: one tile wider on each side, moved by one tile per loop, so the loop has no seam. */
  :host([is-animated][variant='stripes']) .pattern,
  :host([is-animated][variant='lines']) .pattern,
  :host([is-animated][variant='hexagons']) .pattern {
    left: calc(var(--_pattern-tile-x) * -1);
    right: calc(var(--_pattern-tile-x) * -1);
    animation: moul-pattern-drift var(--_pattern-duration) linear infinite;
  }

  @keyframes moul-pattern-drift {
    to {
      translate: calc(var(--_pattern-tile-x) * var(--_pattern-drift-sign)) 0;
    }
  }

  /* Lit cells: placed by column and row in units of the cell size, as the pattern is drawn. */
  .cells,
  .probe {
    position: absolute;
    inset: 0;
  }

  .probe {
    inset: 0 auto auto 0;
    width: var(--_pattern-size);
    height: 0;
    visibility: hidden;
  }

  .cell {
    position: absolute;
    left: calc(var(--_pattern-x) * var(--_pattern-size));
    top: calc(var(--_pattern-y) * var(--_pattern-size));
    width: var(--_pattern-size);
    height: var(--_pattern-size);
    opacity: 0;
    /* A negative delay starts each cell part-way through its cycle. */
    animation: moul-pattern-flicker var(--_pattern-duration) ease-in-out
      calc(var(--_pattern-duration) * var(--_pattern-phase) * -1) infinite;
  }

  /* A grid cell fills the square inside its lines. */
  :host([variant='grid']) .cell {
    left: calc(
      var(--_pattern-x) * var(--_pattern-size) + var(--_pattern-line-width)
    );
    top: calc(
      var(--_pattern-y) * var(--_pattern-size) + var(--_pattern-line-width)
    );
    width: calc(var(--_pattern-size) - var(--_pattern-line-width));
    height: calc(var(--_pattern-size) - var(--_pattern-line-width));
    background-color: var(--_pattern-highlight);
  }

  /* A lit dot grows and glows over the dot in the middle of its cell. */
  :host([variant='dots']) .cell::before {
    content: '';
    position: absolute;
    inset: 0;
    margin: auto;
    width: calc(var(--_pattern-dot-size) * 2);
    height: calc(var(--_pattern-dot-size) * 2);
    border-radius: 50%;
    background-color: var(--_pattern-highlight);
    box-shadow: 0 0 calc(var(--_pattern-dot-size) * 3)
      var(--_pattern-dot-size) var(--_pattern-highlight);
  }

  @keyframes moul-pattern-flicker {
    0%,
    100% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
  }

  /* Fades: masks on the layer, so the lit cells fade with the pattern. Not mirrored: they are visual, not reading order. */
  :host([fade='radial']) [part='background'] {
    -webkit-mask-image: radial-gradient(
      closest-side at 50% 50%,
      black 30%,
      transparent 100%
    );
    mask-image: radial-gradient(
      closest-side at 50% 50%,
      black 30%,
      transparent 100%
    );
  }

  :host([fade='top']) [part='background'] {
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 70%);
    mask-image: linear-gradient(to bottom, transparent, black 70%);
  }

  :host([fade='bottom']) [part='background'] {
    -webkit-mask-image: linear-gradient(to top, transparent, black 70%);
    mask-image: linear-gradient(to top, transparent, black 70%);
  }

  :host([fade='edges']) [part='background'] {
    -webkit-mask-image:
      linear-gradient(
        to right,
        transparent,
        black min(20%, 8rem),
        black calc(100% - min(20%, 8rem)),
        transparent
      ),
      linear-gradient(
        to bottom,
        transparent,
        black min(20%, 8rem),
        black calc(100% - min(20%, 8rem)),
        transparent
      );
    mask-image:
      linear-gradient(
        to right,
        transparent,
        black min(20%, 8rem),
        black calc(100% - min(20%, 8rem)),
        transparent
      ),
      linear-gradient(
        to bottom,
        transparent,
        black min(20%, 8rem),
        black calc(100% - min(20%, 8rem)),
        transparent
      );
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
  }

  /* Nothing moves: the lit cells hold still at different strengths, and the drift stops. */
  @media (prefers-reduced-motion: reduce) {
    .pattern {
      animation: none !important;
    }

    .cell {
      animation: none !important;
      opacity: calc(0.35 + var(--_pattern-phase) * 0.5);
    }
  }

  /* Decoration only: where the system forces its colours, the pattern is not drawn. */
  @media (forced-colors: active) {
    [part='background'] {
      display: none;
    }
  }
`
