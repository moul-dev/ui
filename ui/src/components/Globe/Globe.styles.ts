import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const globeStyles = [
  resetStyles,
  canvasColorProbeStyles,
  css`
    /* Square by default; give it a height (or an aspect-ratio) to change that.
       A finger drags it sideways while up and down still scrolls the page. */
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

    .base.is-dragging {
      cursor: grabbing;
    }

    canvas {
      display: block;
      inline-size: 100%;
      block-size: 100%;
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
  `,
]
