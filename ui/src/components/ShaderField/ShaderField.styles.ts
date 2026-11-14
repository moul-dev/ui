import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const shaderFieldStyles = [
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

    /* The field sits behind the content, clipped to the host's corners; the content is not clipped. */
    .layer {
      position: absolute;
      inset: 0;
      /*
       * Sized outright: in a host with display: grid and place-items: center,
       * an absolutely positioned child is otherwise centred at its content
       * size, which for a canvas layer is zero.
       */
      width: 100%;
      height: 100%;
      place-self: stretch;
      z-index: -1;
      overflow: hidden;
      border-radius: inherit;
      pointer-events: none;
    }

    canvas,
    .fallback {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Square dither cells are drawn one per CSS pixel and scaled up crisp. */
    :host([shape='square']:not([variant='clouds'])) canvas {
      image-rendering: pixelated;
    }

    /*
     * Without WebGL: a still gradient of the same colours, written as CSS so
     * the tokens follow the theme on their own. --_c0 to --_c3 are set inline.
     */
    .fallback {
      display: none;
      background:
        radial-gradient(120% 90% at 18% 12%, var(--_c2) 0%, transparent 58%),
        radial-gradient(110% 85% at 86% 92%, var(--_c1) 0%, transparent 62%),
        linear-gradient(to bottom, var(--_c3), var(--_c0) 70%);
    }

    :host(:not([variant='clouds'])) .fallback {
      background:
        radial-gradient(
            circle,
            color-mix(in oklch, var(--_c2) 45%, transparent) 0 1.5px,
            transparent 2px
          )
          0 0 / 6px 6px,
        radial-gradient(120% 90% at 18% 12%, var(--_c1) 0%, transparent 62%),
        var(--_c0);
    }

    :host([is-fallback]) .fallback {
      display: block;
    }

    :host([is-fallback]) canvas {
      visibility: hidden;
    }

    .content {
      position: relative;
    }
  `,
]
