import { type SVGTemplateResult, svg } from 'lit'

/**
 * A check mark whose stroke draws itself: `pathLength="1"` lets the styles
 * run `stroke-dashoffset` from 1 to 0 whatever the path's real length.
 */
export const drawnCheck = (): SVGTemplateResult => svg`
  <svg
    class="mark"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path pathLength="1" d="M6 12.5 10 16.5 18 8" />
  </svg>
`

/** A cross whose two strokes draw themselves one after the other. */
export const drawnCross = (): SVGTemplateResult => svg`
  <svg
    class="mark"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    aria-hidden="true"
    focusable="false"
  >
    <path pathLength="1" d="M8 8l8 8" />
    <path pathLength="1" d="M16 8l-8 8" />
  </svg>
`
