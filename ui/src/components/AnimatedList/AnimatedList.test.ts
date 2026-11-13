import { html, LitElement } from 'lit'
import { afterEach, describe, expect, it } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './AnimatedList'
import type { MoulAnimatedList } from './AnimatedList'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Lets the slot report its new children, then the list react. */
async function flush(list: MoulAnimatedList): Promise<void> {
  await Promise.resolve()
  await list.updateComplete
  await Promise.resolve()
}

/** Gives an element a layout box of `height` px at `top` px, which happy-dom does not compute. */
function stubBox(el: HTMLElement, top: number, height = 40): void {
  Object.defineProperty(el, 'offsetHeight', {
    configurable: true,
    get: () => height,
  })
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + height,
      left: 0,
      right: 200,
      width: 200,
      height,
      x: 0,
      y: top,
    }) as DOMRect
}

function item(text: string): HTMLElement {
  const el = document.createElement('div')
  el.textContent = text
  return el
}

async function mount(
  count = 3,
  attrs = '',
): Promise<{ list: MoulAnimatedList; rows: HTMLElement[] }> {
  const host = document.createElement('div')
  host.innerHTML = `<moul-animated-list ${attrs}>${Array.from(
    { length: count },
    (_, i) => `<div>Item ${i + 1}</div>`,
  ).join('')}</moul-animated-list>`
  const list = host.firstElementChild as MoulAnimatedList
  const rows = Array.from(list.children) as HTMLElement[]
  rows.forEach((row, i) => {
    stubBox(row, i * 50)
  })
  document.body.append(host)
  await list.updateComplete
  await flush(list)
  return { list, rows }
}

describe('<moul-animated-list>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
  })

  it('is registered with an open shadow root and lists its slotted items', async () => {
    const { list, rows } = await mount(2)
    expect(customElements.get('moul-animated-list')).toBeDefined()
    expect(list.shadowRoot?.querySelector('[part="base"] slot')).not.toBeNull()
    expect(list.items).toEqual(rows)
    expect(list.delay).toBe(0)
  })

  it('shows the items it starts with at once, without animating them', async () => {
    motion = mockReducedMotion(false)
    const { rows } = await mount(3)
    for (const row of rows) {
      expect(row.style.opacity).toBe('')
      expect(row.style.height).toBe('')
      expect(row.style.display).toBe('')
    }
  })

  it('grows a new item in from nothing, then hands it back to its own styles', async () => {
    motion = mockReducedMotion(false)
    const { list } = await mount(2)
    const fresh = item('New')
    stubBox(fresh, 0)
    list.prepend(fresh)
    await flush(list)

    // It gives back all 40px of its height through its margin, and is clipped away.
    expect(fresh.style.marginBottom).toBe('-40px')
    expect(fresh.style.clipPath).toBe('inset(-48px -48px 40px)')
    expect(fresh.style.opacity).toBe('0')
    expect(list.items[0]).toBe(fresh)

    await wait(900)
    expect(fresh.getAttribute('style') ?? '').toBe('')
  })

  it('glides the remaining items into the gap when one is removed directly', async () => {
    motion = mockReducedMotion(false)
    const { list, rows } = await mount(3)
    // The first row goes and the others move up a slot (happy-dom reports
    // the slot change as the row leaves, so the new layout is stubbed first).
    stubBox(rows[1], 0)
    stubBox(rows[2], 50)
    rows[0].remove()
    await flush(list)

    expect(list.items).toEqual([rows[1], rows[2]])
    expect(rows[1].style.transform).toMatch(/^translateY\((49|50)(\.\d+)?px\)$/)
    expect(rows[2].style.transform).toMatch(/^translateY\((49|50)(\.\d+)?px\)$/)
    await wait(900)
    expect(rows[1].style.transform).toBe('')
  })

  it('removeItem() shrinks the item away, then removes it', async () => {
    motion = mockReducedMotion(false)
    const { list, rows } = await mount(3)
    const removing = list.removeItem(rows[1])
    expect(rows[1].isConnected).toBe(true)
    expect(rows[1].style.clipPath).toBe('inset(-48px -48px -48px)')
    expect(list.items).toEqual([rows[0], rows[2]])
    await removing
    expect(rows[1].isConnected).toBe(false)
    expect(list.items).toEqual([rows[0], rows[2]])
  })

  it('removeItem() still resolves when the list leaves the page mid-way', async () => {
    motion = mockReducedMotion(false)
    const { list, rows } = await mount(2)
    const removing = list.removeItem(rows[0])
    list.parentElement?.remove()
    await removing
    expect(rows[0].isConnected).toBe(false)
    expect(rows[1].getAttribute('style')).toBeNull()
  })

  it('reveals its first items one at a time with `delay`, last item first', async () => {
    motion = mockReducedMotion(false)
    const { list, rows } = await mount(3, 'delay="60"')
    const shown = () => rows.filter((row) => row.style.display !== 'none')

    expect(shown()).toEqual([rows[2]])
    expect(list.items).toEqual([rows[2]])
    await wait(70)
    expect(shown()).toEqual([rows[1], rows[2]])
    await wait(70)
    expect(shown()).toEqual(rows)
    expect(list.items).toEqual(rows)
    await wait(900)
    for (const row of rows) expect(row.getAttribute('style') ?? '').toBe('')
  })

  it('follows a slot that another element forwards into it', async () => {
    motion = mockReducedMotion(false)
    class ForwardingHost extends LitElement {
      protected override render() {
        return html`<moul-animated-list><slot></slot></moul-animated-list>`
      }
    }
    customElements.define('animated-list-forwarder', ForwardingHost)
    const host = document.createElement(
      'animated-list-forwarder',
    ) as ForwardingHost
    host.innerHTML = '<p>One</p><p>Two</p>'
    document.body.append(host)
    await host.updateComplete
    const list = host.shadowRoot?.querySelector(
      'moul-animated-list',
    ) as MoulAnimatedList
    await flush(list)
    expect(list.items.map((el) => el.textContent)).toEqual(['One', 'Two'])

    const fresh = item('Three')
    stubBox(fresh, 0)
    host.prepend(fresh)
    await flush(list)
    await flush(list)
    expect(list.items[0]).toBe(fresh)
    expect(fresh.style.marginBottom).toBe('-40px')
  })

  describe('keyboard and screen readers', () => {
    it('takes no focus and has no role until it is live', async () => {
      const { list } = await mount(1)
      expect(list.hasAttribute('tabindex')).toBe(false)
      expect(list.hasAttribute('role')).toBe(false)
    })

    it('becomes a polite log with `is-live`, and lets go of the role after', async () => {
      const { list } = await mount(1, 'is-live')
      expect(list.isLive).toBe(true)
      expect(list.getAttribute('role')).toBe('log')
      list.isLive = false
      await list.updateComplete
      expect(list.hasAttribute('role')).toBe(false)
    })

    it('keeps a role the page set', async () => {
      const { list } = await mount(1, 'is-live role="feed"')
      expect(list.getAttribute('role')).toBe('feed')
      list.isLive = false
      await list.updateComplete
      expect(list.getAttribute('role')).toBe('feed')
    })
  })

  describe('reduced motion', () => {
    it('adds and removes items at once', async () => {
      motion = mockReducedMotion(true)
      const { list, rows } = await mount(2)
      const fresh = item('New')
      stubBox(fresh, 0)
      list.prepend(fresh)
      await flush(list)
      expect(fresh.getAttribute('style')).toBeNull()

      rows[0].remove()
      await flush(list)
      expect(rows[1].getAttribute('style')).toBeNull()

      await list.removeItem(fresh)
      expect(fresh.isConnected).toBe(false)
    })

    it('shows every item at once despite `delay`', async () => {
      motion = mockReducedMotion(true)
      const { list, rows } = await mount(3, 'delay="60"')
      expect(list.items).toEqual(rows)
      for (const row of rows) expect(row.style.display).toBe('')
    })
  })
})
