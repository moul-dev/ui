import { css } from 'lit'

/*
 * The highlight is one absolutely placed box behind the items. Its place and
 * size come from `placeIndicator` (utils/motion), which writes `translate`,
 * `width` and `height` inline and lets the transitions below glide them; it
 * moves only when the pointer crosses into another item, never per frame.
 * The visible fill is its ::before, so the fade in and out is independent of
 * the snap `placeIndicator` makes when the highlight first appears.
 */

export const hoverHighlightStyles = css`
  :host {
    display: block;
    position: relative;
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  .highlight {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    box-sizing: border-box;
    pointer-events: none;
    transition:
      translate var(--hover-highlight-duration, var(--duration-base, 250ms))
        var(--ease-out, ease-out),
      width var(--hover-highlight-duration, var(--duration-base, 250ms))
        var(--ease-out, ease-out),
      height var(--hover-highlight-duration, var(--duration-base, 250ms))
        var(--ease-out, ease-out);
  }

  .highlight::before {
    content: '';
    position: absolute;
    inset: var(--hover-highlight-inset, 0px);
    border-radius: var(
      --hover-highlight-radius,
      var(--_hover-highlight-item-radius, var(--radius-lg, 0.75rem))
    );
    background: var(--hover-highlight-background, var(--color-fill-hover));
    opacity: 0;
    transition: opacity var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  :host([data-highlight]) .highlight::before {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .highlight {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .highlight::before {
      background: none;
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }
`
