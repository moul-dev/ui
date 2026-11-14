import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const cursorTrailStyles = [
  resetStyles,
  canvasColorProbeStyles,
  css`
    :host {
      display: block;
      position: relative;
      isolation: isolate;
      /* Sideways drags draw the trail on a touch screen; vertical swipes still scroll. */
      touch-action: pan-y pinch-zoom;
    }

    :host([hidden]) {
      display: none;
    }

    .content {
      position: relative;
    }

    /* Over the content, and never in the way of a click. */
    canvas {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: block;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    slot[name='image'] {
      display: none;
    }

    .font-probe {
      position: absolute;
      width: 0;
      height: 0;
      overflow: hidden;
      font-family: var(--font-family-mono, ui-monospace, monospace);
      pointer-events: none;
    }
  `,
]
