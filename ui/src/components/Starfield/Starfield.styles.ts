import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const starfieldStyles = [
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

    /* The field sits behind the content, follows the host's rounded corners
       and lets the pointer through to what is under it. */
    canvas {
      position: absolute;
      inset: 0;
      z-index: -1;
      display: block;
      width: 100%;
      height: 100%;
      border-radius: inherit;
      pointer-events: none;
    }

    .content {
      position: relative;
    }

    /* Forced colours replace the page's palette; a field drawn in the old
       one would only get in the way of the text. */
    @media (forced-colors: active) {
      canvas {
        display: none;
      }
    }
  `,
]
