import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type IntersectionMock,
  mockIntersectionObserver,
} from '../../test-setup'
import './Reveal'
import type { MoulReveal } from './Reveal'
import { revealStyles } from './Reveal.styles'

describe('<moul-reveal>', () => {
  let io: IntersectionMock

  beforeEach(() => {
    io = mockIntersectionObserver()
  })

  afterEach(() => {
    io.restore()
  })

  it('stays hidden until it enters the viewport, then reveals once', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal><p>Hello</p></moul-reveal>`,
    )
    expect(el.isRevealed).toBe(false)
    expect(el.hasAttribute('is-revealed')).toBe(false)

    io.enter(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
    expect(el.hasAttribute('is-revealed')).toBe(true)

    // Plays once: the observer lets go after the first entry, so leaving changes nothing.
    io.leave(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
  })

  it('hides again on leaving with is-repeating, and reveals on the next entry', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal is-repeating><p>Hello</p></moul-reveal>`,
    )
    io.enter(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)

    io.leave(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(false)

    io.enter(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
  })

  it('keeps the content shown when is-repeating is turned off after an entry', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal is-repeating><p>Hello</p></moul-reveal>`,
    )
    io.enter(el)
    io.leave(el)
    await el.updateComplete
    expect(el.isRevealed).toBe(false)

    el.isRepeating = false
    await el.updateComplete
    expect(el.isRevealed).toBe(true)
  })

  it('replays with play(): hidden for a moment, then revealed', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal><p>Hello</p></moul-reveal>`,
    )
    io.enter(el)
    await el.updateComplete
    // Each record is the attribute and its value before the change: '' when present, null when absent.
    const changes: string[] = []
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        changes.push(`${record.attributeName}:${record.oldValue}`)
      }
    })
    observer.observe(el, {
      attributeFilter: ['is-revealed', 'data-resetting'],
      attributeOldValue: true,
    })
    await el.play()
    await new Promise((resolve) => setTimeout(resolve))
    observer.disconnect()
    // Transitions go off before the hide and come back on before the reveal.
    expect(changes).toEqual([
      'data-resetting:null',
      'is-revealed:',
      'data-resetting:',
      'is-revealed:null',
    ])
    expect(revealStyles.cssText).toMatch(
      /:host\(\[data-resetting\]\)[^{]*\{[^}]*transition: none !important;/,
    )
    expect(el.isRevealed).toBe(true)
  })

  it('reveals at once where IntersectionObserver is missing', async () => {
    io.restore()
    const original = globalThis.IntersectionObserver
    // @ts-expect-error: simulating a runtime without the API
    delete globalThis.IntersectionObserver
    try {
      const el = await fixture<MoulReveal>(
        html`<moul-reveal><p>Hello</p></moul-reveal>`,
      )
      await el.updateComplete
      expect(el.isRevealed).toBe(true)
    } finally {
      globalThis.IntersectionObserver = original
    }
  })

  it('writes its timing and distance as CSS variables', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal
        distance="24"
        blur-radius="0"
        duration="400"
        delay="100"
        stagger="80"
      ><p>A</p></moul-reveal>`,
    )
    expect(el.style.getPropertyValue('--_reveal-distance')).toBe('24px')
    expect(el.style.getPropertyValue('--_reveal-blur')).toBe('0px')
    expect(el.style.getPropertyValue('--_reveal-duration')).toBe('400ms')
    expect(el.style.getPropertyValue('--_reveal-delay')).toBe('100ms')
    expect(el.style.getPropertyValue('--_reveal-stagger')).toBe('80ms')
  })

  it('numbers each child element so a stagger reveals them in order', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal stagger="60"
        ><div>One</div>
        <div>Two</div>
        <div>Three</div></moul-reveal
      >`,
    )
    await new Promise((resolve) => setTimeout(resolve))
    const indexes = [...el.children].map((child) =>
      (child as HTMLElement).style.getPropertyValue('--moul-reveal-index'),
    )
    expect(indexes).toEqual(['0', '1', '2'])
  })

  it('falls back to rising up for an unknown direction', async () => {
    const el = await fixture<MoulReveal>(
      html`<moul-reveal direction="sideways"><p>A</p></moul-reveal>`,
    )
    await el.updateComplete
    expect(el.direction).toBe('up')
    expect(el.getAttribute('direction')).toBe('up')
  })

  describe('keyboard and screen readers', () => {
    it('is not focusable and adds no role, so the content keeps its own semantics', async () => {
      const el = await fixture<MoulReveal>(
        html`<moul-reveal><a href="#x">Link</a></moul-reveal>`,
      )
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.hasAttribute('role')).toBe(false)
      expect(el.hasAttribute('aria-hidden')).toBe(false)
      expect(el.shadowRoot?.querySelector('[aria-hidden]')).toBeNull()
    })

    it('shows hidden content as soon as focus moves into it', () => {
      const css = revealStyles.cssText
      expect(css).toContain(':not(:focus-within)')
      expect(css).toMatch(
        /:host\(:focus-within\)[^{]*\{[^}]*transition-duration: 0s/,
      )
    })
  })

  describe('reduced motion', () => {
    it('shows the content from the start, with no fade, blur or movement', () => {
      const css = revealStyles.cssText
      const block =
        /@media \(prefers-reduced-motion: reduce\), print \{([\s\S]*)\}\s*$/.exec(
          css,
        )?.[1]
      expect(block).toBeDefined()
      expect(block).toContain('opacity: 1 !important')
      expect(block).toContain('filter: none !important')
      expect(block).toContain('translate: none !important')
      expect(block).toContain('transition: none !important')
    })
  })
})
