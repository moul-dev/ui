import { css } from 'lit'

export const perspectiveGridStyles = css`
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
    /* The planes are sized in this layer's container units, so the grid looks the same at any height. */
    container-type: size;

    --_perspective-grid-size: var(--perspective-grid-size, 60px);
    --_perspective-grid-color: var(
      --perspective-grid-color,
      color-mix(in oklab, var(--color-fg) 22%, transparent)
    );
    --_perspective-grid-line-width: var(--perspective-grid-line-width, 1px);
    --_perspective-grid-duration: var(--perspective-grid-duration, 1s);
  }

  /*
   * The floor is seen from the middle of the bottom edge, from one and a half
   * times the host's height away, so its horizon sits (1.5 / tan angle) of
   * the height above the bottom: --_perspective-grid-reach, worked out by the
   * element. The fade runs from nothing a quarter of the way down from the
   * horizon to the full grid a little past halfway, and hides the far end of
   * the plane.
   */
  .stage {
    position: absolute;
    inset: 0;
    perspective: 150cqh;
    perspective-origin: 50% 100%;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent calc(100% - var(--_perspective-grid-reach) * 75%),
      black calc(100% - var(--_perspective-grid-reach) * 45%)
    );
    mask-image: linear-gradient(
      to bottom,
      transparent calc(100% - var(--_perspective-grid-reach) * 75%),
      black calc(100% - var(--_perspective-grid-reach) * 45%)
    );
  }

  .plane {
    position: absolute;
    overflow: hidden;
  }

  /*
   * Every plane runs from its near edge, at the top of its box, into the
   * distance, down its box. The floor's near edge lies on the host's bottom
   * edge and the plane tilts back and up from it. It is wide and long enough
   * to fill the view until the fade hides it.
   */
  .floor {
    top: 100%;
    left: -150%;
    width: 400%;
    height: 700cqh;
    transform-origin: 50% 0;
    transform: rotateX(calc(var(--_perspective-grid-angle) - 180deg));
  }

  .lines {
    position: absolute;
    /* One cell longer than its plane, so moving one cell nearer never uncovers the far end. */
    inset: 0 0 calc(var(--_perspective-grid-size) * -1);
    background-image:
      linear-gradient(
        to right,
        var(--_perspective-grid-color) var(--_perspective-grid-line-width),
        transparent var(--_perspective-grid-line-width)
      ),
      linear-gradient(
        to bottom,
        var(--_perspective-grid-color) var(--_perspective-grid-line-width),
        transparent var(--_perspective-grid-line-width)
      );
    background-size: var(--_perspective-grid-size) var(--_perspective-grid-size);
    /* One line runs down the middle of each plane, to the vanishing point. */
    background-position: calc(50% + var(--_perspective-grid-size) / 2) 0;
    animation: moul-perspective-grid-flow var(--_perspective-grid-duration)
      linear infinite;
  }

  /* One cell toward the near edge per loop; the pattern repeats every cell, so the loop has no seam. */
  @keyframes moul-perspective-grid-flow {
    to {
      translate: 0 calc(var(--_perspective-grid-size) * -1);
    }
  }

  /*
   * The tunnel is seen from the centre, so its four walls meet at a vanishing
   * point there. Each wall is as deep as six times the viewing distance, and
   * the fade, round the centre, hides its far end.
   */
  :host([variant='tunnel']) .stage {
    perspective: 50cqmin;
    perspective-origin: 50% 50%;
    -webkit-mask-image: radial-gradient(closest-side, transparent 22%, black 75%);
    mask-image: radial-gradient(closest-side, transparent 22%, black 75%);
  }

  .wall {
    height: 300cqmin;
    transform-origin: 0 0;
  }

  .wall-top {
    top: 0;
    left: 0;
    width: 100%;
    transform: rotateX(-90deg);
  }

  .wall-bottom {
    top: 100%;
    left: 0;
    width: 100%;
    transform: rotateX(-90deg);
  }

  /* The side walls turn a quarter first, so their rows run down the host's edges. */
  .wall-left {
    top: 0;
    left: 0;
    width: 100cqh;
    transform: rotate(90deg) rotateX(-90deg);
  }

  .wall-right {
    top: 0;
    left: 100%;
    width: 100cqh;
    transform: rotate(90deg) rotateX(-90deg);
  }

  /* The grid holds still. */
  @media (prefers-reduced-motion: reduce) {
    .lines {
      animation: none !important;
    }
  }

  /* Decoration only: where the system forces its colours, the grid is not drawn. */
  @media (forced-colors: active) {
    [part='background'] {
      display: none;
    }
  }
`
