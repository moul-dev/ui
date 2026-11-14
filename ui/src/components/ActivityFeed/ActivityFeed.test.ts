import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './ActivityFeed'
import type { ActivityEvent, MoulActivityFeed } from './ActivityFeed'

const NOW = Date.now()

const EVENTS: ActivityEvent[] = [
  {
    id: 3,
    title: 'POST /v1/records',
    badge: '201',
    tone: 'success',
    description: 'admin · 42 ms',
    timestamp: NOW - 5_000,
    payload: { id: 'rec_1', name: 'Dara', tags: ['a'] },
  },
  {
    id: 2,
    title: 'Deploy finished',
    description: 'moul-api',
    timestamp: new Date(NOW - 3 * 60_000),
  },
  {
    id: 1,
    title: 'DELETE /v1/records/9',
    badge: '404',
    tone: 'error',
    timestamp: NOW - 2 * 3_600_000,
    payload: '{"error":"not_found"}',
  },
]

const shadow = (el: MoulActivityFeed) => el.shadowRoot as ShadowRoot
const items = (el: MoulActivityFeed) =>
  Array.from(shadow(el).querySelectorAll<HTMLElement>('.item'))
const titles = (el: MoulActivityFeed) =>
  items(el).map((item) => item.querySelector('.title')?.textContent)
const rowButtons = (el: MoulActivityFeed) =>
  Array.from(shadow(el).querySelectorAll<HTMLButtonElement>('button.head'))
const pill = (el: MoulActivityFeed) =>
  shadow(el).querySelector<HTMLButtonElement>('[part~="pending"]')

async function mount(attrs = {}): Promise<MoulActivityFeed> {
  const el = await fixture<MoulActivityFeed>(
    html`<moul-activity-feed .events=${EVENTS}></moul-activity-feed>`,
  )
  Object.assign(el, attrs)
  await el.updateComplete
  return el
}

describe('<moul-activity-feed>', () => {
  it('lists events newest first with their title, badge, description and time', async () => {
    const el = await mount()
    expect(titles(el)).toEqual([
      'POST /v1/records',
      'Deploy finished',
      'DELETE /v1/records/9',
    ])
    const first = items(el)[0]
    expect(first.dataset.tone).toBe('success')
    expect(first.querySelector('.badge')?.textContent).toBe('201')
    expect(first.querySelector('.description')?.textContent).toBe(
      'admin · 42 ms',
    )
    const time = first.querySelector('time')
    expect(time?.getAttribute('datetime')).toBe(
      new Date(NOW - 5_000).toISOString(),
    )
    expect(time?.getAttribute('title')).toBeTruthy()
    expect(time?.textContent).toBe('now')
    expect(items(el)[1].querySelector('time')?.textContent).toMatch(/3 min/)
  })

  it('formats clock times with time-format="time"', async () => {
    const el = await mount({ timeFormat: 'time', locale: 'en-GB' })
    expect(items(el)[0].querySelector('time')?.textContent).toMatch(
      /^\d\d:\d\d:\d\d$/,
    )
  })

  it('adds pushed events to the top, updates known ids in place and keeps at most `max`', async () => {
    const el = await mount({ max: 3 })
    el.push({ id: 4, title: 'Sign-up' })
    await el.updateComplete
    expect(titles(el)).toEqual([
      'Sign-up',
      'POST /v1/records',
      'Deploy finished',
    ])
    el.push({ id: 2, title: 'Deploy rolled back' })
    await el.updateComplete
    expect(titles(el)).toEqual([
      'Sign-up',
      'POST /v1/records',
      'Deploy rolled back',
    ])
    el.push({ id: 6, title: 'Six' }, { id: 5, title: 'Five' })
    await el.updateComplete
    expect(titles(el)).toEqual(['Six', 'Five', 'Sign-up'])
  })

  it('shows the empty slot without events', async () => {
    const el = await fixture<MoulActivityFeed>(
      html`<moul-activity-feed><span slot="empty">Nothing here</span></moul-activity-feed>`,
    )
    expect(shadow(el).querySelector('slot[name="empty"]')).not.toBeNull()
    expect(
      shadow(el).querySelector('[part~="list"]')?.hasAttribute('hidden'),
    ).toBe(true)
  })

  describe('payloads', () => {
    let writeText: ReturnType<typeof vi.fn>

    beforeEach(() => {
      writeText = vi.fn(() => Promise.resolve())
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText },
      })
    })

    it('opens a payload as formatted, highlighted JSON and copies it', async () => {
      const onToggle = vi.fn()
      const el = await mount()
      el.addEventListener('expandedchange', onToggle)
      expect(rowButtons(el)).toHaveLength(2)
      const button = rowButtons(el)[0]
      expect(button.getAttribute('aria-expanded')).toBe('false')
      button.click()
      await el.updateComplete
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(onToggle.mock.calls[0][0].detail).toMatchObject({
        id: 3,
        isExpanded: true,
      })
      const payload = shadow(el).querySelector(
        '[part~="payload"]',
      ) as HTMLElement
      expect(payload.getAttribute('role')).toBe('region')
      expect(button.getAttribute('aria-controls')).toBe(payload.id)
      const text =
        '{\n  "id": "rec_1",\n  "name": "Dara",\n  "tags": [\n    "a"\n  ]\n}'
      expect(payload.querySelector('pre')?.textContent).toBe(text)
      expect(payload.querySelector('.tok-property')?.textContent).toBe('"id"')
      payload.querySelector<HTMLButtonElement>('[part~="copy-button"]')?.click()
      await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith(text))
    })

    it('formats JSON strings, and shows other strings and unserialisable values as text', async () => {
      const circular: Record<string, unknown> = {}
      circular.self = circular
      const el = await mount({
        events: [
          { id: 'a', title: 'A', payload: '{"ok":true}' },
          { id: 'b', title: 'B', payload: 'plain text' },
          { id: 'c', title: 'C', payload: circular },
        ],
      })
      for (const button of rowButtons(el)) button.click()
      await el.updateComplete
      const pres = Array.from(
        shadow(el).querySelectorAll('[part~="payload"] pre'),
      )
      expect(pres.map((pre) => pre.textContent)).toEqual([
        '{\n  "ok": true\n}',
        'plain text',
        '[object Object]',
      ])
    })
  })

  describe('holding new events', () => {
    it('holds new events while the pointer is over the feed, then shows them', async () => {
      const el = await mount()
      const body = shadow(el).querySelector('.body') as HTMLElement
      body.dispatchEvent(new Event('pointerenter'))
      await el.updateComplete
      el.push({ id: 9, title: 'New one' })
      await el.updateComplete
      expect(titles(el)[0]).toBe('POST /v1/records')
      expect(el.pendingCount).toBe(1)
      expect(pill(el)?.textContent?.trim()).toBe('↑ 1 new')
      body.dispatchEvent(new Event('pointerleave'))
      await el.updateComplete
      expect(titles(el)[0]).toBe('New one')
      expect(pill(el)).toBeNull()
    })

    it('holds while paused, and the pill shows what waits', async () => {
      const onPause = vi.fn()
      const el = await mount()
      el.addEventListener('pausechange', onPause)
      const pause = shadow(el).querySelector<HTMLButtonElement>(
        '[part~="pause-button"]',
      )
      expect(pause?.textContent?.trim()).toBe('Pause')
      pause?.click()
      await el.updateComplete
      expect(el.isPaused).toBe(true)
      expect(onPause.mock.calls[0][0].detail).toEqual({ isPaused: true })
      expect(pause?.textContent?.trim()).toBe('Resume')
      expect(
        shadow(el).querySelector('[part~="status"]')?.textContent?.trim(),
      ).toBe('Paused')

      el.push({ id: 9, title: 'Held' }, { id: 8, title: 'Held too' })
      await el.updateComplete
      expect(titles(el)[0]).toBe('POST /v1/records')
      expect(pill(el)?.textContent?.trim()).toBe('↑ 2 new')
      pill(el)?.click()
      await el.updateComplete
      expect(titles(el).slice(0, 2)).toEqual(['Held', 'Held too'])
      expect(el.isPaused).toBe(true)
    })

    it('still updates rows on screen while holding', async () => {
      const el = await mount({ isPaused: true })
      el.push({ id: 2, title: 'Deploy rolled back' })
      await el.updateComplete
      expect(titles(el)[1]).toBe('Deploy rolled back')
      expect(el.pendingCount).toBe(0)
    })
  })

  describe('keyboard and screen readers', () => {
    it('is a list named by its label, or a log with is-live', async () => {
      const el = await mount({ label: 'Requests' })
      const list = shadow(el).querySelector('[part~="list"]') as HTMLElement
      expect(list.getAttribute('role')).toBe('list')
      expect(list.getAttribute('aria-label')).toBe('Requests')
      expect(items(el)[0].getAttribute('role')).toBe('listitem')
      el.isLive = true
      await el.updateComplete
      expect(list.getAttribute('role')).toBe('log')
      expect(items(el)[0].hasAttribute('role')).toBe(false)
    })

    it('gives the rows with payloads one tab stop and moves with the arrow keys', async () => {
      const el = await mount({
        events: [...EVENTS, { id: 0, title: 'Older', payload: { a: 1 } }],
      })
      const buttons = rowButtons(el)
      expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1])
      buttons[0].focus()
      const key = (k: string) =>
        (shadow(el).activeElement as HTMLElement).dispatchEvent(
          new KeyboardEvent('keydown', {
            key: k,
            bubbles: true,
            composed: true,
          }),
        )
      key('ArrowDown')
      expect(shadow(el).activeElement).toBe(buttons[1])
      expect(buttons.map((button) => button.tabIndex)).toEqual([-1, 0, -1])
      key('End')
      expect(shadow(el).activeElement).toBe(buttons[2])
      key('ArrowDown')
      expect(shadow(el).activeElement).toBe(buttons[2])
      key('Home')
      expect(shadow(el).activeElement).toBe(buttons[0])
      key('ArrowUp')
      expect(shadow(el).activeElement).toBe(buttons[0])
    })

    it('hides the tone dot and offers a labelled pause button', async () => {
      const el = await mount()
      expect(
        items(el)[0].querySelector('.dot')?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(shadow(el).querySelector('[part~="pause-button"]')?.tagName).toBe(
        'BUTTON',
      )
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    afterEach(() => motion?.restore())

    it('opens and closes payloads at once', async () => {
      motion = mockReducedMotion(true)
      const el = await mount()
      rowButtons(el)[0].click()
      await el.updateComplete
      const payload = shadow(el).querySelector(
        '[part~="payload"]',
      ) as HTMLElement
      expect(payload.style.height).toBe('')
      rowButtons(el)[0].click()
      await el.updateComplete
      expect(shadow(el).querySelector('[part~="payload"]')).toBeNull()
    })
  })
})
