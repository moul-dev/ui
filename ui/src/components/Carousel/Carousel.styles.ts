import { css } from 'lit'
import { slideControlStyles, visuallyHiddenStyles } from '../../utils/slides'

export const carouselStyles = [
  visuallyHiddenStyles,
  slideControlStyles,
  css`
    :host {
      --_gap: var(--carousel-gap, 1rem);
      --_size: var(--carousel-slide-size, 100%);
      --_pad: var(--carousel-viewport-padding, 0.5rem);

      display: block;
      min-inline-size: 0;
    }

    :host([hidden]) {
      display: none;
    }

    /* The buttons come first in the source, for the tab order the carousel
       pattern asks for, and are placed after the slides. */
    .carousel {
      position: relative;
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-areas:
        'viewport viewport'
        'dots buttons';
      align-items: center;
      gap: var(--spacing-3, 0.75rem);
    }

    /* overflow: clip, unlike hidden, cannot be scrolled, so focusing a link
       in a slide never shifts the row behind the track's back. The padding
       gives slide shadows room and the negative margin takes it back. */
    .viewport {
      grid-area: viewport;
      min-inline-size: 0;
      margin-block: calc(var(--_pad) * -1);
      padding-block: var(--_pad);
      overflow: hidden;
      overflow: clip;
      border-radius: var(--radius-lg, 0.5rem);
      outline: none;
      cursor: grab;
    }

    .viewport:focus-visible {
      box-shadow: var(--focus-ring);
    }

    .viewport[data-dragging] {
      cursor: grabbing;
    }

    .track {
      position: relative;
      display: flex;
      align-items: stretch;
      gap: var(--_gap);
      translate: var(--_drag-x, 0px) 0;
    }

    /* The gap spaces the slides, so their own margins (a figure has 40px)
       would only push the stops off the edge. */
    .track > slot::slotted(*) {
      flex: 0 0 var(--_size);
      box-sizing: border-box;
      margin: 0;
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    .buttons {
      grid-area: buttons;
      display: flex;
      gap: var(--spacing-2, 0.5rem);
    }

    .dots {
      grid-area: dots;
    }

    /* Surface buttons beside the slides, in the theme's colours. */
    .control {
      --_control-size: 2.25rem;
      --_control-bg: var(--color-surface);
      --_control-hover-bg: var(--color-surface-hover);
      --_control-fg: var(--color-fg);
      --_control-border: var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .control:focus-visible {
      box-shadow: var(--focus-ring);
    }

    .dots {
      --_dot-color: var(--color-fill-track-strong);
      --_dot-current-color: var(--color-fg);
    }
  `,
]
