import { type SVGTemplateResult, svg } from 'lit'

/** Two chevrons pointing along the track: "slide this way". */
export const slideArrow = (): SVGTemplateResult => svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m6 17 5-5-5-5" />
    <path d="m13 17 5-5-5-5" />
  </svg>
`

export const slideCheck = (): SVGTemplateResult => svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
`
