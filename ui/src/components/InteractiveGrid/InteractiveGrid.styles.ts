import { css } from 'lit'
import { canvasColorProbeStyles } from '../../controllers/canvas-color.controller'
import { resetStyles } from '../../styles/reset.styles'

export const interactiveGridStyles = [
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

    .grid {
      position: absolute;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }

    .pattern,
    canvas {
      position: absolute;
      inset: 0;
      display: block;
      width: 100%;
      height: 100%;
    }

    /* Lines on each cell's top and left edges; the canvas fills inside them. */
    .pattern {
      background-image:
        linear-gradient(
          to right,
          var(--interactive-grid-line, var(--color-border)) 1px,
          transparent 1px
        ),
        linear-gradient(
          to bottom,
          var(--interactive-grid-line, var(--color-border)) 1px,
          transparent 1px
        );
      background-size: var(--_cell, 40px) var(--_cell, 40px);
    }

    /* With a gap: one rounded tile per cell, cut out by a mask. */
    .pattern.tiles {
      background: var(--interactive-grid-tile, var(--color-surface-secondary));
      -webkit-mask-image: var(--_tile-mask);
      mask-image: var(--_tile-mask);
      -webkit-mask-size: var(--_cell, 40px) var(--_cell, 40px);
      mask-size: var(--_cell, 40px) var(--_cell, 40px);
    }

    :host([variant='dots']) .pattern {
      background-image: radial-gradient(
        circle at center,
        var(--interactive-grid-dot, var(--color-border)) var(--_dot, 1px),
        transparent calc(var(--_dot, 1px) + 0.75px)
      );
      background-size: var(--_cell, 20px) var(--_cell, 20px);
    }

    :host([fade='radial']) .grid {
      -webkit-mask-image: radial-gradient(
        ellipse at center,
        black 25%,
        transparent 72%
      );
      mask-image: radial-gradient(ellipse at center, black 25%, transparent 72%);
    }

    :host([fade='top']) .grid {
      -webkit-mask-image: linear-gradient(to bottom, transparent, black 45%);
      mask-image: linear-gradient(to bottom, transparent, black 45%);
    }

    :host([fade='bottom']) .grid {
      -webkit-mask-image: linear-gradient(to top, transparent, black 45%);
      mask-image: linear-gradient(to top, transparent, black 45%);
    }

    :host([fade='edges']) .grid {
      -webkit-mask-image:
        linear-gradient(
          to right,
          transparent,
          black 18%,
          black 82%,
          transparent
        ),
        linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
      -webkit-mask-composite: source-in;
      mask-image:
        linear-gradient(
          to right,
          transparent,
          black 18%,
          black 82%,
          transparent
        ),
        linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
      mask-composite: intersect;
    }

    .content {
      position: relative;
    }
  `,
]
