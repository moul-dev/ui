import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'

export const dissolveStyles = [
  canvasColorProbeStyles,
  css`
    :host {
      display: block;
      position: relative;
      --_dissolve-to: to right;
    }

    :host([hidden]),
    :host([is-dissolved][collapse]) {
      display: none;
    }

    :host([direction='left']) {
      --_dissolve-to: to left;
    }

    :host([direction='up']) {
      --_dissolve-to: to top;
    }

    :host([direction='down']) {
      --_dissolve-to: to bottom;
    }

    .content {
      display: block;
    }

    /*
     * The wipe: a soft edge, a fifth of the item long, travels across it.
     * At --_dissolve 0 the item is whole; at 1 it is gone. The dust on the
     * canvas covers the edge.
     */
    :host([data-dissolving]) .content {
      -webkit-mask-image: linear-gradient(
        var(--_dissolve-to),
        transparent calc(var(--_dissolve, 0) * 120% - 20%),
        black calc(var(--_dissolve, 0) * 120%)
      );
      mask-image: linear-gradient(
        var(--_dissolve-to),
        transparent calc(var(--_dissolve, 0) * 120% - 20%),
        black calc(var(--_dissolve, 0) * 120%)
      );
    }

    :host([is-dissolved]) .content {
      visibility: hidden;
    }

    canvas {
      display: none;
    }

    /* Shown only while the item dissolves, in the top layer and fixed to the viewport. */
    :host([data-dissolving]) canvas {
      display: block;
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      max-width: none;
      max-height: none;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      overflow: visible;
      pointer-events: none;
      z-index: var(--z-toast, 1700);
    }
  `,
]
