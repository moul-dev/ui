import type { MoulButton } from '../components/Button/Button'
import type { MoulForm } from '../components/Form/Form'

export type ImplicitSubmissionForm = HTMLFormElement | MoulForm

/** `<input>` types that HTML counts as fields blocking implicit submission. */
const BLOCKING_INPUT_TYPES = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
])

const MOUL_TEXT_FIELDS = 'moul-text-field, moul-number-field, moul-search-field'

/**
 * Enter outside IME composition (Safari reports the composition-ending Enter
 * with `keyCode` 229 and `isComposing` already false). Ctrl, Meta, and Alt
 * combinations are left to app shortcuts.
 */
export function isImplicitSubmissionKey(event: KeyboardEvent): boolean {
  return (
    event.key === 'Enter' &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  )
}

/**
 * The form Enter submits: the control's native form owner, else the nearest
 * `<moul-form>`, whose `<form>` sits in a shadow root that slotted controls
 * never associate with.
 */
export function findImplicitSubmissionForm(
  host: HTMLElement,
  ownerForm: HTMLFormElement | null,
): ImplicitSubmissionForm | null {
  return ownerForm ?? host.closest('moul-form')
}

/**
 * Submits `form` after an Enter keydown the way a light-DOM `<input>` would.
 * A shadow-DOM `<input>` has no form owner, so the browser never runs
 * implicit submission for it. Submission waits until the keydown has finished
 * dispatching, so any listener can still cancel it with `preventDefault()`.
 */
export function submitOnEnter(
  event: KeyboardEvent,
  form: ImplicitSubmissionForm | null,
): void {
  if (!form || !isImplicitSubmissionKey(event)) return
  setTimeout(() => {
    if (!event.defaultPrevented) submitImplicitly(form)
  })
}

/**
 * HTML implicit submission: click the form's default (first) submit button,
 * and submit nothing when that button is disabled. Without a submit button,
 * submit only when the form has a single text-like field.
 */
function submitImplicitly(form: ImplicitSubmissionForm): void {
  const nestedForms = Array.from(form.querySelectorAll('form, moul-form'))
  const belongsToForm = (el: Element) =>
    !nestedForms.some((nested) => nested.contains(el))

  const defaultButton = Array.from(
    form.querySelectorAll<HTMLElement>('button, input, moul-button'),
  ).find((el) =>
    el instanceof HTMLButtonElement || el instanceof HTMLInputElement
      ? // Native buttons only submit their own form owner, so they never
        // submit a <moul-form>.
        el.form === form && (el.type === 'submit' || el.type === 'image')
      : el.localName === 'moul-button' &&
        belongsToForm(el) &&
        (el as MoulButton).type === 'submit',
  )

  if (defaultButton) {
    if (defaultButton.matches(':disabled')) return
    // <moul-button> ignores clicks while disabled or pending.
    defaultButton.click()
    return
  }

  const fields = Array.from(
    form.querySelectorAll(`input, ${MOUL_TEXT_FIELDS}`),
  ).filter(
    (el) =>
      belongsToForm(el) &&
      (!(el instanceof HTMLInputElement) || BLOCKING_INPUT_TYPES.has(el.type)),
  )
  if (fields.length > 1) return

  if (form instanceof HTMLFormElement) {
    form.requestSubmit()
  } else {
    // MoulForm.submit() validates first, like a native requestSubmit().
    form.submit()
  }
}
