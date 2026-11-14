import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const imageLoaderStyles = [
  resetStyles,
  canvasColorProbeStyles,
  css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      aspect-ratio: var(--_ratio, 4 / 3);
    }

    :host([hidden]) {
      display: none;
    }

    .base {
      position: absolute;
      inset: 0;
      border-radius: inherit;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: inherit;
    }
  `,
]
