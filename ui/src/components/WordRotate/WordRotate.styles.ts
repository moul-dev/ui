import { css } from 'lit'

export const wordRotateStyles = css`
  :host {
    display: inline;
    /* Room above and below the word, so ascenders, descenders and Khmer subscripts are not clipped mid-change. */
    --_bleed: 0.25em;
    --_ease: var(--ease-out, cubic-bezier(0.22, 1, 0.36, 1));
  }

  :host([hidden]) {
    display: none;
  }

  /* Every word, once, for screen readers. */
  .readable {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
    user-select: none;
  }

  [part="base"] {
    display: inline-block;
    white-space: nowrap;
  }

  /*
   * The window the words move through. Its width glides from one word to the
   * next; the padding and matching negative margin give the clip some room
   * without changing the line height or the baseline.
   */
  .window {
    display: inline-block;
    position: relative;
    padding-block: var(--_bleed);
    margin-block: calc(-1 * var(--_bleed));
    transition: width var(--_duration, 450ms) var(--_ease);
  }

  .window[data-changing] {
    clip-path: inset(0);
  }

  :host([effect="flip"]) .window {
    perspective: 20em;
  }

  [part="word"] {
    display: inline-block;
    white-space: nowrap;
    animation-duration: var(--_duration, 450ms);
    animation-timing-function: var(--_ease);
    animation-fill-mode: both;
  }

  /* The outgoing word sits on top of the incoming one, out of the flow. */
  [part="word"][data-state="leave"] {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: var(--_bleed);
  }

  :host([effect="flip"]) [part="word"] {
    transform-origin: 50% 50% -0.5em;
  }

  :host([effect="slide"]) [data-state="enter"] {
    animation-name: moul-word-rotate-slide-in;
  }
  :host([effect="slide"]) [data-state="leave"] {
    animation-name: moul-word-rotate-slide-out;
  }
  :host([effect="fade"]) [data-state="enter"] {
    animation-name: moul-word-rotate-fade-in;
  }
  :host([effect="fade"]) [data-state="leave"] {
    animation-name: moul-word-rotate-fade-out;
  }
  :host([effect="blur"]) [data-state="enter"] {
    animation-name: moul-word-rotate-blur-in;
  }
  :host([effect="blur"]) [data-state="leave"] {
    animation-name: moul-word-rotate-blur-out;
  }
  :host([effect="flip"]) [data-state="enter"] {
    animation-name: moul-word-rotate-flip-in;
  }
  :host([effect="flip"]) [data-state="leave"] {
    animation-name: moul-word-rotate-flip-out;
  }

  @keyframes moul-word-rotate-slide-in {
    from {
      translate: 0 calc(100% + var(--_bleed));
    }
  }
  @keyframes moul-word-rotate-slide-out {
    to {
      translate: 0 calc(-100% - var(--_bleed));
    }
  }
  @keyframes moul-word-rotate-fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes moul-word-rotate-fade-out {
    to {
      opacity: 0;
    }
  }
  @keyframes moul-word-rotate-blur-in {
    from {
      opacity: 0;
      filter: blur(0.2em);
    }
  }
  @keyframes moul-word-rotate-blur-out {
    to {
      opacity: 0;
      filter: blur(0.2em);
    }
  }
  /* A drum turning upwards: the old word rolls over the top, the new one comes up from underneath. */
  @keyframes moul-word-rotate-flip-in {
    from {
      opacity: 0;
      transform: rotateX(-90deg);
    }
  }
  @keyframes moul-word-rotate-flip-out {
    to {
      opacity: 0;
      transform: rotateX(90deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .window,
    [part="word"] {
      transition: none !important;
      animation: none !important;
    }
  }
`
