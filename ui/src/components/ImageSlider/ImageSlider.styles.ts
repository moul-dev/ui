import { css } from 'lit'
import { slideControlStyles, visuallyHiddenStyles } from '../../utils/slides'

export const imageSliderStyles = [
  visuallyHiddenStyles,
  slideControlStyles,
  css`
    :host {
      display: block;
      min-inline-size: 0;
    }

    :host([hidden]) {
      display: none;
    }

    .slider {
      position: relative;
      overflow: hidden;
      border-radius: var(--image-slider-radius, 0);
      isolation: isolate;
    }

    .frame {
      position: relative;
      block-size: var(--image-slider-height, 28rem);
      aspect-ratio: var(--image-slider-aspect-ratio, auto);
      overflow: hidden;
      background: var(--color-bg-subtle);
      outline: none;
      cursor: grab;
    }

    .frame:focus-visible {
      outline: 3px solid var(--color-focus);
      outline-offset: -3px;
    }

    /* The images lean a fifth of the way after a swiping finger. */
    .slides {
      position: absolute;
      inset: 0;
      translate: calc(var(--_swipe-x, 0px) * 0.2) 0;
    }

    /* Every image covers the frame; only the current one, and the one on
       its way out, are drawn. The current one is on top, so it fades in
       over the last one rather than through a gap. */
    .slides > slot::slotted(*) {
      position: absolute !important;
      inset: 0;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      object-fit: cover;
      opacity: 0;
      user-select: none;
      -webkit-user-drag: none;
    }

    .slides > slot::slotted([data-moul-slide]) {
      opacity: 1;
    }

    .slides > slot::slotted([data-moul-slide='current']) {
      z-index: 1;
    }

    /* Dark in both themes: overlay text sits on a photograph, not on the page. */
    .scrim {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      background: var(
        --image-slider-scrim,
        linear-gradient(
          to top,
          color-mix(in oklab, var(--color-black) 62%, transparent),
          color-mix(in oklab, var(--color-black) 22%, transparent) 55%,
          color-mix(in oklab, var(--color-black) 8%, transparent)
        )
      );
    }

    .scrim[hidden] {
      display: none;
    }

    .overlay {
      position: absolute;
      inset: 0;
      z-index: 3;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: var(--spacing-4, 1rem);
      padding: var(--spacing-8, 2rem) var(--spacing-16, 4rem)
        var(--spacing-12, 3rem);
      color: var(--image-slider-overlay-color, var(--color-white));
      text-align: center;
      pointer-events: none;
    }

    .overlay ::slotted(*) {
      pointer-events: auto;
    }

    /* Controls float on the image: glassy dark chips with light icons. */
    .control {
      --_control-size: 2.5rem;
      --_control-bg: color-mix(in oklab, var(--color-black) 38%, transparent);
      --_control-hover-bg: color-mix(
        in oklab,
        var(--color-black) 55%,
        transparent
      );
      --_control-fg: var(--color-white);
      --_control-border: color-mix(in oklab, var(--color-white) 28%, transparent);

      position: absolute;
      z-index: 4;
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }

    .control:focus-visible {
      box-shadow: 0 0 0 2px var(--color-white), 0 0 0 4px var(--color-focus);
    }

    .arrow {
      inset-block-start: calc(50% - var(--_control-size) / 2);
    }

    .prev {
      inset-inline-start: var(--spacing-4, 1rem);
    }

    .next {
      inset-inline-end: var(--spacing-4, 1rem);
    }

    .play {
      --_control-size: 2.25rem;

      inset-block-end: var(--spacing-4, 1rem);
      inset-inline-end: var(--spacing-4, 1rem);
    }

    .play svg {
      inline-size: 0.875rem;
      block-size: 0.875rem;
    }

    /* Centred along the bottom with auto margins, which hold in either direction. */
    .dots {
      --_dot-color: color-mix(in oklab, var(--color-white) 55%, transparent);
      --_dot-current-color: var(--color-white);

      position: absolute;
      z-index: 4;
      inset-block-end: var(--spacing-4, 1rem);
      inset-inline: 0;
      inline-size: fit-content;
      max-inline-size: calc(100% - 7rem);
      margin-inline: auto;
      padding: 0.375rem 0.5rem;
      border-radius: var(--radius-full, 9999px);
      background: color-mix(in oklab, var(--color-black) 38%, transparent);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }

    .dot:focus-visible {
      box-shadow: 0 0 0 2px var(--color-white);
    }

    @media (max-width: 30rem) {
      .control {
        --_control-size: 2.25rem;
      }

      .overlay {
        padding-inline: var(--spacing-12, 3rem);
      }

      .prev {
        inset-inline-start: var(--spacing-2, 0.5rem);
      }

      .next {
        inset-inline-end: var(--spacing-2, 0.5rem);
      }
    }

    @media (forced-colors: active) {
      .control,
      .dots {
        border: 1px solid CanvasText;
      }
    }
  `,
]
