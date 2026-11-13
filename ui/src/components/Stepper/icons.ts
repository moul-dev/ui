import { type SVGTemplateResult, svg } from 'lit'

/** A bare check mark, drawn inside a completed step's indicator. */
export const stepCheck = (): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
`

/** A bare exclamation mark, drawn inside an invalid step's indicator. */
export const stepAlert = (): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M12 6v7" />
    <path d="M12 18h.01" />
  </svg>
`
