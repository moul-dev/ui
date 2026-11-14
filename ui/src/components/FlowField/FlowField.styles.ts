import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const flowFieldStyles = [
  resetStyles,
  canvasColorProbeStyles,
  css`
    :host {
      display: block;
      position: relative;
      isolation: isolate;
    }

    :host([hidden]) {
      display: none;
    }

    /* Clips the canvas, which reaches past the box so blurred edges stay full. */
    .field {
      --_blur: 0px;
      position: absolute;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
      opacity: var(--flow-field-opacity, 1);
    }

    canvas {
      position: absolute;
      inset: calc(var(--_blur) * -2);
      display: block;
      width: calc(100% + var(--_blur) * 4);
      height: calc(100% + var(--_blur) * 4);
    }

    .is-blurred canvas {
      filter: blur(var(--_blur));
    }

    .content {
      position: relative;
    }
  `,
]
