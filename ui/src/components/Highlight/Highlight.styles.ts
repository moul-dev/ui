import { css } from 'lit'

export const highlightStyles = css`
  :host {
    display: inline;
    --_highlight-tone: var(--color-warning);
    --_highlight-color: var(--highlight-color, var(--_highlight-tone));
    --_highlight-ease: var(--ease-smooth, ease);
    --_highlight-thickness: max(2px, 0.14em);
    /* The marks grow from the inline start. */
    --_highlight-x: 0%;
  }

  :host([hidden]) {
    display: none;
  }

  :host(:dir(rtl)) {
    --_highlight-x: 100%;
  }

  :host([tone="primary"]) {
    --_highlight-tone: var(--color-accent);
  }
  :host([tone="accent"]) {
    --_highlight-tone: var(--color-primary-500);
  }
  :host([tone="success"]) {
    --_highlight-tone: var(--color-success);
  }
  :host([tone="error"]) {
    --_highlight-tone: var(--color-danger);
  }

  /* A <mark> inside keeps its meaning but drops the browser's yellow, so the drawn mark shows. */
  ::slotted(mark) {
    background: none;
    color: inherit;
  }

  /*
   * Marker and underline are a background on the inline box. Its fragments
   * are painted as one strip cut into lines (box-decoration-break: slice, the
   * default), so growing the background's width draws line after line.
   */
  :host([effect="marker"]),
  :host([effect="underline"]) {
    background-repeat: no-repeat;
    background-position: var(--_highlight-x) 100%;
  }

  :host([effect="marker"]) {
    background-image: linear-gradient(
      color-mix(in oklab, var(--_highlight-color) 40%, transparent),
      color-mix(in oklab, var(--_highlight-color) 40%, transparent)
    );
    background-size: 0% 100%;
    /* Reaches a little past the first and last letters without moving them. */
    padding-inline: 0.12em;
    margin-inline: -0.12em;
  }

  :host([effect="marker"][is-drawn]) {
    background-size: 100% 100%;
  }

  :host([effect="underline"]) {
    background-image: linear-gradient(var(--_highlight-color), var(--_highlight-color));
    background-size: 0% var(--_highlight-thickness);
  }

  :host([effect="underline"][is-drawn]) {
    background-size: 100% var(--_highlight-thickness);
  }

  /* Box and circle draw an SVG stroke around the words, which stay on one line. */
  :host([effect="box"]),
  :host([effect="circle"]) {
    display: inline-block;
    position: relative;
    white-space: nowrap;
  }

  svg {
    position: absolute;
    overflow: visible;
    pointer-events: none;
  }

  :host([effect="box"]) svg {
    inset-inline-start: -0.3em;
    inset-block-start: -0.12em;
    width: calc(100% + 0.6em);
    height: calc(100% + 0.24em);
  }

  /* An ellipse needs more room than a box to clear the corners of the words. */
  :host([effect="circle"]) svg {
    inset-inline-start: calc(-12% - 0.25em);
    inset-block-start: -0.45em;
    width: calc(124% + 0.5em);
    height: calc(100% + 0.9em);
  }

  :host(:dir(rtl)) svg {
    transform: scaleX(-1);
  }

  /* pathLength="1": a dash one path long, then a gap of two, offset just past the start so not even a round cap shows. */
  path {
    fill: none;
    stroke: var(--_highlight-color);
    stroke-width: max(2px, 0.08em);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1 2;
    stroke-dashoffset: 1.05;
  }

  :host([is-drawn]) path {
    stroke-dashoffset: 0;
  }

  /* Only the drawing transitions; erasing for a replay is instant. */
  :host([is-drawn]),
  :host([is-drawn]) path {
    transition-property: background-size, stroke-dashoffset;
    transition-duration: var(--_duration, 700ms);
    transition-timing-function: var(--_highlight-ease);
    transition-delay: var(--_delay, 0ms);
  }

  @media (prefers-reduced-motion: reduce), print {
    :host,
    path {
      transition: none !important;
    }

    :host([effect="marker"]) {
      background-size: 100% 100% !important;
    }

    :host([effect="underline"]) {
      background-size: 100% var(--_highlight-thickness) !important;
    }

    path {
      stroke-dashoffset: 0 !important;
    }
  }

  /* In the system's text colour where colours are forced; the marker band is still a 40% mix behind the text. */
  @media (forced-colors: active) {
    :host {
      --_highlight-color: CanvasText;
    }
  }
`
