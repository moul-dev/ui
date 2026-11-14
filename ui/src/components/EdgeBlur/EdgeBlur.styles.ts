import { css } from 'lit'

export const edgeBlurStyles = css`
  :host {
    display: block;
    /* The element is the scroller. Content wider than it is clipped; use
       orientation="horizontal" for content that scrolls sideways. */
    overflow: hidden auto;
    --_edge-blur-size: var(--edge-blur-size, 4rem);
    --_edge-blur-strength: var(--edge-blur-strength, 8px);
    --_edge-blur-fade-color: var(--edge-blur-fade-color, transparent);
    /* How far in from each end the blur reaches: the band, or nothing. */
    --_edge-blur-start: var(--_edge-blur-size);
    --_edge-blur-end: var(--_edge-blur-size);
    /* Focus and scrollIntoView keep their target clear of the blurred bands. */
    scroll-padding-block: var(--_edge-blur-start) var(--_edge-blur-end);
  }

  :host([hidden]) {
    display: none;
  }

  :host([edges="start"]) {
    --_edge-blur-end: 0px;
  }

  :host([edges="end"]) {
    --_edge-blur-start: 0px;
  }

  :host(:focus-visible) {
    outline: 2px solid var(--color-focus, var(--color-accent));
    outline-offset: 2px;
  }

  .content {
    /* Contains the content's margins, and keeps any z-index inside it below the bands. */
    display: flow-root;
    isolation: isolate;
  }

  /* Each band sticks to its end of the scrollport and takes no space: its
     negative margin lets the content slide underneath. */
  .edge {
    position: sticky;
    z-index: 1;
    block-size: var(--_edge-blur-size);
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
  }

  .edge.start {
    inset-block-start: 0;
    margin-block-end: calc(-1 * var(--_edge-blur-size));
    /* Each layer's mask runs from the inner side of the band toward the edge. */
    --_edge-blur-toward: to top;
  }

  .edge.end {
    inset-block-end: 0;
    margin-block-start: calc(-1 * var(--_edge-blur-size));
    --_edge-blur-toward: to bottom;
  }

  /* A row that scrolls sideways. */
  :host([orientation="horizontal"]) {
    display: flex;
    overflow: auto hidden;
    scroll-padding-block: 0;
    scroll-padding-inline: var(--_edge-blur-start) var(--_edge-blur-end);
  }

  :host([orientation="horizontal"]) .content {
    display: flex;
    flex: none;
    gap: var(--edge-blur-gap, var(--spacing-4, 1rem));
  }

  :host([orientation="horizontal"]) .content ::slotted(*) {
    flex-shrink: 0;
  }

  :host([orientation="horizontal"]) .edge {
    flex: none;
    block-size: auto;
    inline-size: var(--_edge-blur-size);
  }

  :host([orientation="horizontal"]) .edge.start {
    inset-block-start: auto;
    inset-inline-start: 0;
    margin-block-end: 0;
    margin-inline-end: calc(-1 * var(--_edge-blur-size));
    --_edge-blur-toward: to left;
  }

  :host([orientation="horizontal"]) .edge.end {
    inset-block-end: auto;
    inset-inline-end: 0;
    margin-block-start: 0;
    margin-inline-start: calc(-1 * var(--_edge-blur-size));
    --_edge-blur-toward: to right;
  }

  :host([orientation="horizontal"]:dir(rtl)) .edge.start {
    --_edge-blur-toward: to right;
  }

  :host([orientation="horizontal"]:dir(rtl)) .edge.end {
    --_edge-blur-toward: to left;
  }

  /* The layers. Never put opacity, a filter or a mask on .edge itself: that
     would make it the backdrop root, and the layers would have nothing
     behind them to blur. Each layer blurs twice as hard as the one before
     and covers its own stretch of the band, cross-fading into the next, so
     the blur ramps up toward the edge instead of starting at a hard line. */
  .layer {
    position: absolute;
    inset: 0;
  }

  .layer-1 {
    -webkit-backdrop-filter: blur(calc(var(--_edge-blur-strength) / 8));
    backdrop-filter: blur(calc(var(--_edge-blur-strength) / 8));
    -webkit-mask-image: linear-gradient(var(--_edge-blur-toward), transparent 0%, black 25%, black 50%, transparent 75%);
    mask-image: linear-gradient(var(--_edge-blur-toward), transparent 0%, black 25%, black 50%, transparent 75%);
  }

  .layer-2 {
    -webkit-backdrop-filter: blur(calc(var(--_edge-blur-strength) / 4));
    backdrop-filter: blur(calc(var(--_edge-blur-strength) / 4));
    -webkit-mask-image: linear-gradient(var(--_edge-blur-toward), transparent 25%, black 50%, black 75%, transparent 100%);
    mask-image: linear-gradient(var(--_edge-blur-toward), transparent 25%, black 50%, black 75%, transparent 100%);
  }

  .layer-3 {
    -webkit-backdrop-filter: blur(calc(var(--_edge-blur-strength) / 2));
    backdrop-filter: blur(calc(var(--_edge-blur-strength) / 2));
    -webkit-mask-image: linear-gradient(var(--_edge-blur-toward), transparent 50%, black 75%);
    mask-image: linear-gradient(var(--_edge-blur-toward), transparent 50%, black 75%);
  }

  .layer-4 {
    -webkit-backdrop-filter: blur(var(--_edge-blur-strength));
    backdrop-filter: blur(var(--_edge-blur-strength));
    -webkit-mask-image: linear-gradient(var(--_edge-blur-toward), transparent 75%, black 100%);
    mask-image: linear-gradient(var(--_edge-blur-toward), transparent 75%, black 100%);
  }

  /* An optional fade into a colour, on top of the blur. */
  .tint {
    background-image: linear-gradient(
      var(--_edge-blur-toward),
      transparent,
      var(--_edge-blur-fade-color)
    );
  }

  /* Where scrolling can drive animations, each band shows only when there
     is more to scroll its way: the start band fades in over the first band's
     length of scrolling, the end band fades out over the last. With nothing
     to scroll the timeline is inactive and neither band shows. The fade
     follows the reader's own scrolling and nothing else, so it stays under
     prefers-reduced-motion: reduce. */
  @supports (animation-timeline: scroll()) {
    .layer {
      opacity: 0;
      animation-duration: auto;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: scroll(nearest block);
    }

    :host([orientation="horizontal"]) .layer {
      animation-timeline: scroll(nearest inline);
    }

    .start .layer {
      animation-name: moul-edge-blur-show;
      animation-range: 0px var(--_edge-blur-size);
    }

    .end .layer {
      animation-name: moul-edge-blur-hide;
      animation-range: calc(100% - var(--_edge-blur-size)) 100%;
    }
  }

  /* Elsewhere both bands always show, so pad the content by the band's
     length: the first and last lines can still be scrolled clear of them. */
  @supports not (animation-timeline: scroll()) {
    .content {
      padding-block: var(--_edge-blur-start) var(--_edge-blur-end);
    }

    :host([orientation="horizontal"]) .content {
      padding-block: 0;
      padding-inline: var(--_edge-blur-start) var(--_edge-blur-end);
    }
  }

  @keyframes moul-edge-blur-show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes moul-edge-blur-hide {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  /* Blurred text is no help where the system forces its own colours, or on paper. */
  @media (forced-colors: active), print {
    .edge {
      display: none;
    }
  }
`
