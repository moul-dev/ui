import { css } from 'lit'

/*
 * The element writes --magnetic-x and --magnetic-y (px) on the body, at most
 * once per frame and only when they change. The body moves by the
 * independent translate property; a short transition smooths the targets
 * while the pointer pulls, and a spring brings it home when it lets go. The
 * variables inherit into the wrapped control, so a label inside it can
 * follow further.
 */

export const magneticStyles = css`
  :host {
    display: inline-block;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .body {
    display: block;
    translate: var(--magnetic-x, 0px) var(--magnetic-y, 0px);
    transition: translate var(--magnetic-duration, 700ms)
      var(--ease-spring, ease-out);
  }

  .body.is-active {
    transition: translate 150ms var(--ease-out, ease-out);
    will-change: translate;
  }

  @media (prefers-reduced-motion: reduce) {
    .body,
    .body.is-active {
      translate: none;
      transition: none;
      will-change: auto;
    }
  }
`
