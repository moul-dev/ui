import { type SVGTemplateResult, svg } from 'lit'

/**
 * Zero-dependency SVG chrome icons for internal component affordances.
 * All icons include aria-hidden="true" and focusable="false" per accessibility guidelines.
 */

export const close = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
`

export const chevronDown = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
`

export const search = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
`

export const clear = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6m0-6 6 6" />
  </svg>
`

export const alertInfo = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
`

export const alertSuccess = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
`

export const alertWarning = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
`

export const alertError = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
`

export const spinnerRing = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.2" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" />
  </svg>
`

export const calendarNavPrev = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
`

export const calendarNavNext = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
`

export const externalLink = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
`

export const copy = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
`

export const check = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
`

export const replay = (classes = ''): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
  </svg>
`

const icon = (
  classes: string,
  body: SVGTemplateResult,
): SVGTemplateResult => svg`
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class=${classes}
    aria-hidden="true"
    focusable="false"
  >
    ${body}
  </svg>
`

export const arrowUp = (classes = ''): SVGTemplateResult =>
  icon(classes, svg`<path d="m5 12 7-7 7 7" /><path d="M12 19V5" />`)

export const arrowDown = (classes = ''): SVGTemplateResult =>
  icon(classes, svg`<path d="M12 5v14" /><path d="m19 12-7 7-7-7" />`)

export const stopSquare = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />`,
  )

export const paperclip = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />`,
  )

export const thumbUp = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="M7 10v12" /><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />`,
  )

export const thumbDown = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="M17 14V2" /><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z" />`,
  )

export const sidebarPanel = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18" />`,
  )

export const pencilSquare = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.38 2.63a1.88 1.88 0 1 1 2.65 2.65L12 14.3 9 15l.7-3z" />`,
  )

export const imageIcon = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />`,
  )

export const wrench = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />`,
  )

export const sparkle = (classes = ''): SVGTemplateResult =>
  icon(
    classes,
    svg`<path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5A2 2 0 0 0 15.5 9.94l6.14 1.58a.5.5 0 0 1 0 .96L15.5 14.06a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />`,
  )
