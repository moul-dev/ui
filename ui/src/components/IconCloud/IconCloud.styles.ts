import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const iconCloudStyles = [
  resetStyles,
  canvasColorProbeStyles,
  css`
    /* Square by default; give it a height (or an aspect-ratio) to change that.
       Up and down on a touch screen still scrolls the page. */
    :host {
      display: block;
      position: relative;
      inline-size: 100%;
      aspect-ratio: 1;
      touch-action: pan-y;
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: absolute;
      inset: 0;
      cursor: grab;
    }

    .base.is-over-action {
      cursor: pointer;
    }

    .base.is-dragging {
      cursor: grabbing;
    }

    canvas {
      display: block;
      inline-size: 100%;
      block-size: 100%;
    }

    /* The icons themselves stay in the page for screen readers and the
       keyboard, out of sight: the canvas draws them, and rings the focused one. */
    .items {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
]
