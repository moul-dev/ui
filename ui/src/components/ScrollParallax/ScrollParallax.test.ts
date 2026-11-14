import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockIntersectionObserver,
} from '../../test-setup'
import './index'
import { type MoulScrollParallax, trackFactor } from './ScrollParallax'
import { scrollParallaxStyles } from './ScrollParallax.styles'

const settle = () => new Promise((resolve) => setTimeout(resolve))
const factors = (el: MoulScrollParallax) =>
  [...el.children].map((track) =>
    (track as HTMLElement).style.getPropertyValue('--_scroll-parallax-factor'),
  )
const tracksEl = (el: MoulScrollParallax) =>
  el.shadowRoot?.querySelector<HTMLElement>('[part="tracks"]') as HTMLElement

async function parallax(orientation = 'rows') {
  const el = await fixture<MoulScrollParallax>(
    html`<moul-scroll-parallax orientation=${orientation}>
      <div>Angkor Wat · Bayon · Ta Prohm</div>
      <div>Kampot · Kep · Koh Rong</div>
      <div>Mondulkiri · Ratanakiri</div>
    </moul-scroll-parallax>`,
  )
  await settle()
  return el
}

describe('trackFactor', () => {
  it('alternates rows, the first toward the inline end', () => {
    expect([0, 1, 2, 3].map((i) => trackFactor('rows', i))).toEqual([
      1, -1, 1, -1,
    ])
  })

  it('alternates columns, the first rising', () => {
    expect([0, 1, 2].map((i) => trackFactor('columns', i))).toEqual([-1, 1, -1])
  })

  it('lets a finite data-speed replace the pattern, including 0', () => {
    expect(trackFactor('rows', 1, '0.5')).toBe(0.5)
    expect(trackFactor('rows', 0, '-2')).toBe(-2)
    expect(trackFactor('rows', 0, '0')).toBe(0)
    expect(trackFactor('rows', 1, 'fast')).toBe(-1)
    expect(trackFactor('rows', 1, ' ')).toBe(-1)
  })
})

describe('<moul-scroll-parallax>', () => {
  let frames: ManualFrames

  beforeEach(() => {
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    fixtureCleanup()
    frames.restore()
  })

  it('lays its tracks out in a part and adds no role', async () => {
    const el = await parallax()
    expect(customElements.get('moul-scroll-parallax')).toBeDefined()
    expect(tracksEl(el).querySelector('slot')).not.toBeNull()
    expect(el.hasAttribute('role')).toBe(false)
    expect(el.hasAttribute('tabindex')).toBe(false)
  })

  it('writes each row its share of the travel once', async () => {
    const el = await parallax()
    expect(factors(el)).toEqual(['1', '-1', '1'])
  })

  it('switches the pattern for columns', async () => {
    const el = await parallax()
    el.orientation = 'columns'
    await el.updateComplete
    expect(el.getAttribute('orientation')).toBe('columns')
    expect(factors(el)).toEqual(['-1', '1', '-1'])
  })

  it('falls back to rows for an unknown orientation', async () => {
    const el = await parallax('diagonal')
    expect(el.orientation).toBe('rows')
    expect(el.getAttribute('orientation')).toBe('rows')
  })

  it('takes a track’s own data-speed, also when it changes later', async () => {
    const el = await parallax()
    const second = el.children[1] as HTMLElement
    second.dataset.speed = '2.5'
    await settle()
    expect(factors(el)).toEqual(['1', '2.5', '1'])
    delete second.dataset.speed
    await settle()
    expect(factors(el)).toEqual(['1', '-1', '1'])
  })

  it('renumbers after a track is removed and cleans up the removed one', async () => {
    const el = await parallax()
    const first = el.children[0] as HTMLElement
    first.remove()
    await settle()
    expect(first.style.getPropertyValue('--_scroll-parallax-factor')).toBe('')
    expect(factors(el)).toEqual(['1', '-1'])
  })

  it('hands speed to the styles in pixels, falling back on nonsense', async () => {
    const el = await parallax()
    expect(el.style.getPropertyValue('--_scroll-parallax-speed')).toBe('300px')
    el.setAttribute('speed', '480')
    await el.updateComplete
    expect(el.style.getPropertyValue('--_scroll-parallax-speed')).toBe('480px')
    el.speed = Number.NaN
    await el.updateComplete
    expect(el.style.getPropertyValue('--_scroll-parallax-speed')).toBe('300px')
  })

  it('follows its view timeline with the script fallback where there is no native one', async () => {
    const el = await parallax()
    const height = 500
    el.getBoundingClientRect = () =>
      ({
        top: 100,
        bottom: 100 + height,
        height,
        left: 0,
        right: 400,
        width: 400,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect
    window.dispatchEvent(new Event('scroll'))
    frames.step(16)
    const port = window.innerHeight
    const progress = Number(
      el.style.getPropertyValue('--_scroll-parallax-progress'),
    )
    expect(progress).toBeCloseTo((port - 100) / (port + height), 3)
  })

  it('removes the factors when it disconnects', async () => {
    const el = await parallax()
    const tracks = [...el.children] as HTMLElement[]
    el.remove()
    for (const track of tracks) {
      expect(track.style.getPropertyValue('--_scroll-parallax-factor')).toBe('')
    }
  })

  it('writes the factors again when it is moved', async () => {
    const el = await parallax()
    const parent = el.parentElement as HTMLElement
    el.remove()
    parent.append(el)
    expect(factors(el)).toEqual(['1', '-1', '1'])
  })

  it('gives the tracks layers only while it is near the screen', async () => {
    const io = mockIntersectionObserver()
    try {
      const el = await parallax()
      expect(tracksEl(el).classList.contains('near')).toBe(false)
      io.enter(el)
      await el.updateComplete
      expect(tracksEl(el).classList.contains('near')).toBe(true)
      io.leave(el)
      await el.updateComplete
      expect(tracksEl(el).classList.contains('near')).toBe(false)
    } finally {
      io.restore()
    }
  })

  it('moves tracks by translate alone, mirrored in right-to-left text', () => {
    const text = scrollParallaxStyles.cssText
    expect(text).toMatch(/translate:\s*calc/)
    expect(text).not.toMatch(/transform:/)
    expect(text).toMatch(/:host\(:dir\(rtl\)\)/)
  })

  describe('keyboard and screen readers', () => {
    it('leaves the tracks and their links in reading and tab order', async () => {
      const el = await fixture<MoulScrollParallax>(
        html`<moul-scroll-parallax>
          <div><a href="#angkor">Angkor</a></div>
          <div><a href="#kep">Kep</a></div>
        </moul-scroll-parallax>`,
      )
      const links = [...el.querySelectorAll('a')]
      for (const link of links) {
        expect(link.hasAttribute('tabindex')).toBe(false)
        expect(link.closest('[inert], [aria-hidden]')).toBeNull()
      }
      expect(el.getAttribute('aria-hidden')).toBeNull()
      links[1].focus()
      expect(document.activeElement).toBe(links[1])
    })
  })

  describe('reduced motion', () => {
    it('holds every track still in its centred place', () => {
      const text = scrollParallaxStyles.cssText
      const start = text.indexOf('@media (prefers-reduced-motion')
      const block = text.slice(start, text.indexOf('@media print'))
      expect(start).toBeGreaterThan(0)
      expect(block).toMatch(/translate:\s*none/)
      expect(block).toMatch(/will-change:\s*auto/)
    })
  })
})
