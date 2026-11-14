import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './TextField'
import type { MoulTextField } from './TextField'

const HINTS = ['Search collections', 'Find a record', 'Ask about errors']

const input = (el: MoulTextField) =>
  el.shadowRoot?.querySelector('input') as HTMLInputElement
const overlay = (el: MoulTextField) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="placeholder"]')
const shownHint = (el: MoulTextField) =>
  overlay(el)?.querySelector('.hint:not(.leaving)')?.textContent

describe('<moul-text-field> cycling placeholder', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('rotates through the hints while empty', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field label="Search" .placeholders=${HINTS}></moul-text-field>`,
    )
    expect(shownHint(el)).toBe('Search collections')
    vi.advanceTimersByTime(3000)
    await el.updateComplete
    expect(shownHint(el)).toBe('Find a record')
    expect(overlay(el)?.querySelector('.leaving')?.textContent).toBe(
      'Search collections',
    )
    vi.advanceTimersByTime(6000)
    await el.updateComplete
    expect(shownHint(el)).toBe('Search collections')
  })

  it('honours placeholder-interval, at least one second', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field
        label="Search"
        placeholder-interval="200"
        .placeholders=${HINTS}
      ></moul-text-field>`,
    )
    vi.advanceTimersByTime(999)
    await el.updateComplete
    expect(shownHint(el)).toBe('Search collections')
    vi.advanceTimersByTime(1)
    await el.updateComplete
    expect(shownHint(el)).toBe('Find a record')
  })

  it('hides the hint and stops cycling while the field holds text', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field label="Search" .placeholders=${HINTS}></moul-text-field>`,
    )
    el.value = 'dara'
    await el.updateComplete
    expect(overlay(el)?.hidden).toBe(true)
    vi.advanceTimersByTime(9000)
    await el.updateComplete
    el.value = ''
    await el.updateComplete
    expect(shownHint(el)).toBe('Search collections')
  })

  describe('keyboard and screen readers', () => {
    it('hides the rotating copy and keeps one stable native placeholder', async () => {
      const el = await fixture<MoulTextField>(
        html`<moul-text-field label="Search" .placeholders=${HINTS}></moul-text-field>`,
      )
      expect(overlay(el)?.getAttribute('aria-hidden')).toBe('true')
      expect(input(el).placeholder).toBe('Search collections')
      expect(input(el).hasAttribute('data-cycling')).toBe(true)
      vi.advanceTimersByTime(3000)
      await el.updateComplete
      expect(input(el).placeholder).toBe('Search collections')
    })

    it('prefers an explicit placeholder for screen readers', async () => {
      const el = await fixture<MoulTextField>(
        html`<moul-text-field
          label="Search"
          placeholder="Search"
          .placeholders=${HINTS}
        ></moul-text-field>`,
      )
      expect(input(el).placeholder).toBe('Search')
    })
  })

  it('renders no overlay without placeholders', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field label="Name" placeholder="Dara"></moul-text-field>`,
    )
    expect(overlay(el)).toBeNull()
    expect(input(el).hasAttribute('data-cycling')).toBe(false)
  })
})

describe('<moul-text-field> vanish', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
  })

  it('clears the field and fires input', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field label="Search" value="hello"></moul-text-field>`,
    )
    const onInput = vi.fn()
    el.addEventListener('input', onInput)
    await el.vanish()
    expect(el.value).toBe('')
    expect(onInput).toHaveBeenCalledOnce()
    expect(
      el.shadowRoot?.querySelector('.vanish-layer')?.childNodes,
    ).toHaveLength(0)
  })

  it('does nothing on an empty field', async () => {
    const el = await fixture<MoulTextField>(
      html`<moul-text-field label="Search"></moul-text-field>`,
    )
    const onInput = vi.fn()
    el.addEventListener('input', onInput)
    await el.vanish()
    expect(onInput).not.toHaveBeenCalled()
  })

  it('with vanish-on-submit, clears after the form has read the value', async () => {
    const form = await fixture<HTMLFormElement>(html`
      <form>
        <moul-text-field label="Search" name="q" value="dara" vanish-on-submit></moul-text-field>
      </form>
    `)
    const field = form.querySelector('moul-text-field') as MoulTextField
    await field.updateComplete
    let seen = ''
    form.addEventListener('submit', (event) => {
      event.preventDefault()
      seen = field.value
    })
    form.requestSubmit()
    expect(seen).toBe('dara')
    expect(field.value).toBe('dara')
    await new Promise((resolve) => setTimeout(resolve, 0))
    await field.updateComplete
    expect(field.value).toBe('')
  })

  describe('reduced motion', () => {
    it('clears at once without scattering letters', async () => {
      motion.set(true)
      const el = await fixture<MoulTextField>(
        html`<moul-text-field label="Search" value="hello"></moul-text-field>`,
      )
      const layer = el.shadowRoot?.querySelector('.vanish-layer') as HTMLElement
      const animate = vi.fn()
      layer.animate = animate as unknown as typeof layer.animate
      await el.vanish()
      expect(el.value).toBe('')
      expect(animate).not.toHaveBeenCalled()
      expect(layer.childNodes).toHaveLength(0)
    })
  })
})
