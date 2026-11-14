import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'

export const pressParticlesStyles = [
  canvasColorProbeStyles,
  css`
    :host {
      display: inline-block;
      position: relative;
      vertical-align: middle;
    }

    :host([hidden]) {
      display: none;
    }

    canvas {
      display: none;
    }

    /*
     * Shown only while particles fly, in the top layer so they pass over
     * dialogs too, and fixed to the viewport. Every UA popover style is
     * reset: no border, no fill, and clicks pass through.
     */
    :host([data-active]) canvas {
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
