import { css } from 'lit'

/*
 * The beam is a strip as tall as the track, moved up out of sight and back
 * down by a transform, so the fill never lays the page out again and runs on
 * the compositor. Where CSS has scroll-driven animations a view timeline on
 * the rail moves it, with no script at all; elsewhere the element writes
 * --_tracing-beam-progress (0 to 1) on the host once per frame and the same
 * transforms read it.
 *
 * The timeline's range is `contain` on a view inset by --tracing-beam-start
 * at the top: 0 when the article's top reaches that line, 1 when its bottom
 * reaches the bottom of the view. The fallback computes the same thing.
 */

export const tracingBeamStyles = css`
  :host {
    --_tracing-beam-gutter: var(--tracing-beam-gutter, 2.5rem);
    --_tracing-beam-width: var(--tracing-beam-width, 2px);
    --_tracing-beam-dot: var(--tracing-beam-dot-size, 1.125rem);
    --_tracing-beam-from: var(--tracing-beam-from, var(--color-chart-5));
    --_tracing-beam-to: var(--tracing-beam-to, var(--color-chart-4));

    display: block;
    position: relative;
    padding-inline-start: var(--_tracing-beam-gutter);
  }

  :host([hidden]) {
    display: none;
  }

  .content {
    min-inline-size: 0;
  }

  .rail {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: var(--_tracing-beam-dot);
    pointer-events: none;
  }

  /* The unfilled line, centred under the dot. Only the block axis is
     clipped, so the head's glow can spill sideways. */
  .track {
    position: absolute;
    inset-block: 0;
    inset-inline-start: calc(50% - var(--_tracing-beam-width) / 2);
    inline-size: var(--_tracing-beam-width);
    border-radius: 999px;
    background: var(--tracing-beam-track, var(--color-border));
    overflow-x: visible;
    overflow-y: clip;
  }

  .beam {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      to bottom,
      var(--_tracing-beam-from),
      var(--_tracing-beam-to)
    );
    transform: translateY(
      calc((var(--_tracing-beam-progress, 0) - 1) * 100%)
    );
  }

  .head {
    position: absolute;
    inset-block-end: 0;
    left: 50%;
    inline-size: calc(var(--_tracing-beam-width) * 3);
    block-size: calc(var(--_tracing-beam-width) * 3);
    border-radius: 50%;
    background: var(--_tracing-beam-to);
    box-shadow:
      0 0 6px 1px color-mix(in oklab, var(--_tracing-beam-to) 70%, transparent),
      0 0 18px 4px color-mix(in oklab, var(--_tracing-beam-to) 35%, transparent);
    transform: translate(-50%, 50%);
    opacity: clamp(0, var(--_tracing-beam-progress, 0) * 200, 1);
  }

  /* The ring at the top of the line, over the track. */
  .dot {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    box-sizing: border-box;
    inline-size: var(--_tracing-beam-dot);
    block-size: var(--_tracing-beam-dot);
    border: 1px solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm, 0 1px 2px rgb(0 0 0 / 0.08));
  }

  .dot-light {
    position: absolute;
    inset: 25%;
    border-radius: 50%;
    background: var(--_tracing-beam-to);
    box-shadow: 0 0 0 3px
      color-mix(in oklab, var(--_tracing-beam-to) 25%, transparent);
    opacity: clamp(0, var(--_tracing-beam-progress, 0) * 200, 1);
  }

  /* Native: one view timeline on the rail moves everything, with no script.
     The rail is as tall as the article, so its view range is the article's. */
  @supports (animation-timeline: view()) {
    .rail {
      view-timeline: --_tracing-beam block;
      view-timeline-inset: var(--tracing-beam-start, 50%) 0px;
    }

    .beam,
    .head,
    .dot-light {
      animation: linear both;
      animation-timeline: --_tracing-beam;
      animation-range: contain 0% contain 100%;
    }

    .beam {
      animation-name: moul-tracing-beam-fill;
    }

    .head,
    .dot-light {
      animation-name: moul-tracing-beam-light;
    }
  }

  @keyframes moul-tracing-beam-fill {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  /* Off until reading starts, then on for the rest of the range. */
  @keyframes moul-tracing-beam-light {
    0% {
      opacity: 0;
    }
    0.5%,
    100% {
      opacity: 1;
    }
  }

  /* The fill is the reader's own position and stays; the glowing head that
     streaks down the line does not. */
  @media (prefers-reduced-motion: reduce) {
    .head {
      display: none;
    }
  }

  @media (forced-colors: active) {
    .track {
      background: GrayText;
    }

    .beam,
    .dot-light {
      background: Highlight;
    }

    .head {
      display: none;
    }

    .dot {
      border-color: CanvasText;
    }
  }

  @media print {
    :host {
      padding-inline-start: 0;
    }

    .rail {
      display: none;
    }
  }
`
