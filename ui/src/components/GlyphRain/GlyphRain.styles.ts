import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const glyphRainStyles = [
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

    canvas {
      position: absolute;
      inset: 0;
      z-index: -1;
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
      /* Read by the element when it draws its glyph atlas. */
      font-family: var(
        --glyph-rain-font-family,
        var(--font-family-mono, ui-monospace, monospace)
      );
    }

    .content {
      position: relative;
    }
  `,
]
