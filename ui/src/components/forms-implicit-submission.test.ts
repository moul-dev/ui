import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'

import './Button/Button'
import './Form/Form'
import './NumberField/NumberField'
import './SearchField/SearchField'
import './TextField/TextField'

import type { MoulButton } from './Button/Button'
import type { MoulForm } from './Form/Form'
import type { MoulNumberField } from './NumberField/NumberField'
import type { MoulSearchField } from './SearchField/SearchField'
import type { MoulTextField } from './TextField/TextField'

type TextControl = MoulTextField | MoulNumberField | MoulSearchField

async function mount<T extends HTMLElement>(template: unknown): Promise<T> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const root = container.firstElementChild as T
  await Promise.all(
    [root, ...Array.from(root.querySelectorAll('*'))].map(
      (el) => (el as Partial<LitElement>).updateComplete,
    ),
  )
  return root
}

/** Presses Enter in the control's shadow <input> and waits out the deferral. */
async function pressEnter(
  control: TextControl,
  init: KeyboardEventInit = {},
): Promise<KeyboardEvent> {
  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    composed: true,
    cancelable: true,
    ...init,
  })
  control.inputElement!.dispatchEvent(event)
  await new Promise((resolve) => setTimeout(resolve, 0))
  return event
}

/** Records native submits and keeps happy-dom from navigating. */
function spyOnSubmit(form: HTMLFormElement) {
  const spy = vi.fn((event: Event) => event.preventDefault())
  form.addEventListener('submit', spy)
  return spy
}

describe('Enter submits the form from shadow-DOM text inputs', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('inside a native <form>', () => {
    it('IS-01: each text control submits a form that has one field', async () => {
      for (const template of [
        html`<form><moul-text-field name="q" label="Query"></moul-text-field></form>`,
        html`<form><moul-number-field name="n" label="Count"></moul-number-field></form>`,
        html`<form><moul-search-field name="s" label="Search"></moul-search-field></form>`,
      ]) {
        const form = await mount<HTMLFormElement>(template)
        const submit = spyOnSubmit(form)
        await pressEnter(form.firstElementChild as TextControl)
        expect(submit).toHaveBeenCalledTimes(1)
        form.parentElement!.remove()
      }
    })

    it('IS-02: clicks the default button, so the submitter is reported', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form>
          <moul-text-field name="email" label="Email"></moul-text-field>
          <moul-text-field name="password" label="Password"></moul-text-field>
          <button type="button">Help</button>
          <button name="intent" value="login">Sign in</button>
          <button type="submit">Other</button>
        </form>
      `)
      const submit = spyOnSubmit(form)
      const defaultButton = form.querySelector('[name="intent"]')!
      const click = vi.fn()
      defaultButton.addEventListener('click', click)

      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)

      expect(click).toHaveBeenCalledTimes(1)
      expect(submit).toHaveBeenCalledTimes(1)
      expect((submit.mock.calls[0][0] as SubmitEvent).submitter).toBe(
        defaultButton,
      )
    })

    it('IS-03: a disabled default button blocks submission', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form>
          <moul-text-field name="q" label="Query"></moul-text-field>
          <button type="submit" disabled>Go</button>
          <button type="submit">Fallback</button>
        </form>
      `)
      const submit = spyOnSubmit(form)
      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)
      expect(submit).not.toHaveBeenCalled()
    })

    it('IS-04: without a submit button, two text fields block submission', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form>
          <moul-text-field name="first" label="First name"></moul-text-field>
          <input name="last" aria-label="Last name" />
          <input type="checkbox" name="agree" aria-label="Agree" />
        </form>
      `)
      const submit = spyOnSubmit(form)
      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)
      expect(submit).not.toHaveBeenCalled()
    })

    it('IS-05: a read-only number field still submits', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form>
          <moul-number-field name="n" label="Count" value="3" is-readonly></moul-number-field>
        </form>
      `)
      const submit = spyOnSubmit(form)
      await pressEnter(
        form.querySelector<MoulNumberField>('moul-number-field')!,
      )
      expect(submit).toHaveBeenCalledTimes(1)
    })

    it('IS-06: Enter that ends an IME composition does not submit', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form><moul-text-field name="q" label="Query"></moul-text-field></form>
      `)
      const submit = spyOnSubmit(form)
      const field = form.querySelector<MoulTextField>('moul-text-field')!

      await pressEnter(field, { isComposing: true })
      // Safari reports the composition-ending Enter as keyCode 229.
      await pressEnter(field, { keyCode: 229 })
      expect(submit).not.toHaveBeenCalled()

      await pressEnter(field)
      expect(submit).toHaveBeenCalledTimes(1)
    })

    it('IS-07: modifier shortcuts and other keys do not submit', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form><moul-text-field name="q" label="Query"></moul-text-field></form>
      `)
      const submit = spyOnSubmit(form)
      const field = form.querySelector<MoulTextField>('moul-text-field')!

      await pressEnter(field, { ctrlKey: true })
      await pressEnter(field, { metaKey: true })
      await pressEnter(field, { altKey: true })
      await pressEnter(field, { key: 'a' })
      expect(submit).not.toHaveBeenCalled()
    })

    it('IS-08: a keydown listener can cancel submission with preventDefault()', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form><moul-text-field name="q" label="Query"></moul-text-field></form>
      `)
      const submit = spyOnSubmit(form)
      // Registered on an ancestor, so it runs after the field's own handler.
      form.addEventListener('keydown', (event) => event.preventDefault())

      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)
      expect(submit).not.toHaveBeenCalled()
    })

    it('IS-09: a search field submits the form once and keeps its own submit event out of it', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form><moul-search-field name="s" label="Search" value="moul"></moul-search-field></form>
      `)
      const submit = spyOnSubmit(form)
      const field = form.querySelector<MoulSearchField>('moul-search-field')!
      const fieldSubmit = vi.fn()
      field.addEventListener('submit', fieldSubmit)

      await pressEnter(field)

      expect(submit).toHaveBeenCalledTimes(1)
      expect(submit.mock.calls[0][0]).not.toBeInstanceOf(CustomEvent)
      expect(fieldSubmit).not.toHaveBeenCalled()
    })

    it('IS-10: a standalone search field still fires submit with its value', async () => {
      const field = await mount<MoulSearchField>(html`
        <moul-search-field label="Search" value="kittens"></moul-search-field>
      `)
      const fieldSubmit = vi.fn()
      field.addEventListener('submit', fieldSubmit)

      await pressEnter(field, { isComposing: true })
      expect(fieldSubmit).not.toHaveBeenCalled()

      await pressEnter(field)
      expect(fieldSubmit).toHaveBeenCalledTimes(1)
      expect(fieldSubmit.mock.calls[0][0].detail.value).toBe('kittens')
    })

    it('IS-11: buttons and fields of a nested <moul-form> belong to that form', async () => {
      const form = await mount<HTMLFormElement>(html`
        <form>
          <moul-text-field name="title" label="Title"></moul-text-field>
          <moul-form>
            <moul-text-field name="tag" label="Tag"></moul-text-field>
            <moul-button type="submit">Add tag</moul-button>
          </moul-form>
        </form>
      `)
      const submit = spyOnSubmit(form)
      const innerSubmit = vi.fn()
      form.querySelector('moul-form')!.addEventListener('submit', innerSubmit)

      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)

      expect(submit).toHaveBeenCalledTimes(1)
      expect(innerSubmit).not.toHaveBeenCalled()
    })

    it('IS-12: a text field outside any form does nothing on Enter', async () => {
      const field = await mount<MoulTextField>(html`
        <moul-text-field label="Query"></moul-text-field>
      `)
      const event = await pressEnter(field)
      expect(event.defaultPrevented).toBe(false)
    })
  })

  describe('inside <moul-form>', () => {
    it('IS-13: presses the default <moul-button type="submit">', async () => {
      const form = await mount<MoulForm>(html`
        <moul-form>
          <moul-text-field name="email" label="Email" value="a@moul.dev"></moul-text-field>
          <moul-text-field name="password" label="Password" value="secret"></moul-text-field>
          <moul-button>Cancel</moul-button>
          <moul-button type="submit">Sign in</moul-button>
        </moul-form>
      `)
      const submit = vi.fn()
      form.addEventListener('submit', submit)
      const press = vi.fn()
      form
        .querySelector('moul-button[type="submit"]')!
        .addEventListener('press', press)

      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)

      expect(press).toHaveBeenCalledTimes(1)
      expect(submit).toHaveBeenCalledTimes(1)
      const formData: FormData = submit.mock.calls[0][0].detail.formData
      expect(formData.get('email')).toBe('a@moul.dev')
      expect(formData.get('password')).toBe('secret')
    })

    it('IS-14: a disabled or pending default button blocks submission', async () => {
      const form = await mount<MoulForm>(html`
        <moul-form>
          <moul-text-field name="q" label="Query"></moul-text-field>
          <moul-button type="submit" is-disabled>Go</moul-button>
        </moul-form>
      `)
      const submit = vi.fn()
      form.addEventListener('submit', submit)
      const field = form.querySelector<MoulTextField>('moul-text-field')!
      const button = form.querySelector<MoulButton>('moul-button')!

      await pressEnter(field)
      button.isDisabled = false
      button.isPending = true
      await button.updateComplete
      await pressEnter(field)

      expect(submit).not.toHaveBeenCalled()
    })

    it('IS-15: a single field without a button submits through moul-form validation', async () => {
      const form = await mount<MoulForm>(html`
        <moul-form>
          <moul-number-field name="seats" label="Seats" is-required></moul-number-field>
        </moul-form>
      `)
      const submit = vi.fn()
      const invalid = vi.fn()
      form.addEventListener('submit', submit)
      form.addEventListener('invalid', invalid)
      const field = form.querySelector<MoulNumberField>('moul-number-field')!
      field.value = null
      await field.updateComplete

      await pressEnter(field)
      expect(invalid).toHaveBeenCalledTimes(1)
      expect(submit).not.toHaveBeenCalled()

      field.value = 4
      await field.updateComplete
      await pressEnter(field)
      expect(submit).toHaveBeenCalledTimes(1)
      expect(submit.mock.calls[0][0].detail.formData.get('seats')).toBe('4')
    })

    it('IS-16: a search field submits moul-form exactly once', async () => {
      const form = await mount<MoulForm>(html`
        <moul-form>
          <moul-search-field name="s" label="Search" value="lit"></moul-search-field>
        </moul-form>
      `)
      const submit = vi.fn()
      form.addEventListener('submit', submit)

      await pressEnter(
        form.querySelector<MoulSearchField>('moul-search-field')!,
      )

      expect(submit).toHaveBeenCalledTimes(1)
      expect(submit.mock.calls[0][0].detail.formData.get('s')).toBe('lit')
    })

    it('IS-17: native submit buttons do not count, since they cannot submit moul-form', async () => {
      const form = await mount<MoulForm>(html`
        <moul-form>
          <moul-text-field name="q" label="Query" value="x"></moul-text-field>
          <button type="submit">Native</button>
        </moul-form>
      `)
      const submit = vi.fn()
      form.addEventListener('submit', submit)

      await pressEnter(form.querySelector<MoulTextField>('moul-text-field')!)
      expect(submit).toHaveBeenCalledTimes(1)
    })
  })
})
