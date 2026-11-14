import { css } from 'lit'
import { readableCopyStyles } from '../../utils/landing-text'

export const typewriterStyles = [
  readableCopyStyles,
  css`
    :host {
      display: inline;
    }

    :host([hidden]) {
      display: none;
    }

    /* The last letter and the cursor stay on one line together. */
    .tail {
      white-space: nowrap;
    }

    [part="cursor"] {
      display: inline-block;
      inline-size: max(1px, 0.08em);
      block-size: 1.05em;
      margin-inline-start: 0.06em;
      vertical-align: -0.15em;
      background-color: var(--typewriter-cursor-color, currentColor);
      animation: moul-typewriter-blink 1s steps(1, end) infinite;
    }

    /* Solid while letters are going in or out, and while paused. */
    [part="cursor"].is-busy,
    :host([is-paused]) [part="cursor"] {
      animation: none;
    }

    /* The run is over: a few more blinks, then the cursor hides. */
    [part="cursor"].is-done {
      opacity: 0;
      animation-iteration-count: 4;
    }

    @keyframes moul-typewriter-blink {
      from {
        opacity: 1;
      }
      50%,
      to {
        opacity: 0;
      }
    }

    @media (forced-colors: active) {
      [part="cursor"] {
        background-color: CanvasText;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      [part="cursor"] {
        animation: none !important;
      }
    }
  `,
]
