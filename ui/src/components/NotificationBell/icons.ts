import { type SVGTemplateResult, svg } from 'lit'

/** A bell; the body and the clapper are separate paths so the clapper can lag the swing. */
export const bell = (): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path class="clapper" d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
`
