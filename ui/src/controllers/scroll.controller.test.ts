import { html, LitElement } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ManualFrames, manualAnimationFrames } from '../test-setup'
import {
  ScrollController,
  type ScrollControllerOptions,
} from './scroll.controller'

let hostCount = 0

class ScrollHost extends LitElement {
  scrolling!: ScrollController
  protected override render() {
    return html`<slot></slot>`
  }
}

async function mount(options: ScrollControllerOptions): Promise<ScrollHost> {
  const tag = `scroll-host-${++hostCount}`
  customElements.define(
    tag,
    class extends ScrollHost {
      constructor() {
        super()
        this.scrolling = new ScrollController(this, options)
      }
    },
  )
  const el = document.createElement(tag) as ScrollHost
  document.body.append(el)
  await el.updateComplete
  return el
}

/** A container with a fixed scroll range: 1000px of content in a 200px box. */
function scroller(): HTMLElement & { scrollTo(top: number): void } {
  const el = document.createElement('div') as HTMLElement & {
    scrollTo(top: number): void
  }
  let top = 0
  Object.defineProperties(el, {
    scrollHeight: { configurable: true, get: () => 1000 },
    clientHeight: { configurable: true, get: () => 200 },
    scrollWidth: { configurable: true, get: () => 0 },
    clientWidth: { configurable: true, get: () => 0 },
    scrollTop: {
      configurable: true,
      get: () => top,
      set: (value: number) => {
        top = value
      },
    },
  })
  el.scrollTo = (value: number) => {
    top = value
    el.dispatchEvent(new Event('scroll'))
  }
  document.body.append(el)
  return el
}

describe('ScrollController', () => {
  let frames: ManualFrames

  beforeEach(() => {
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    frames.restore()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('script fallback', () => {
    it('writes scroll progress as a CSS variable once per frame', async () => {
      const source = scroller()
      const el = await mount({ source: () => source })
      expect(el.scrolling.isNative).toBe(false)
      expect(el.style.getPropertyValue('--scroll-progress')).toBe('0')

      source.scrollTo(100)
      source.scrollTo(200)
      expect(frames.pending).toBe(1)
      frames.step(16)
      expect(el.style.getPropertyValue('--scroll-progress')).toBe('0.25')
      expect(el.scrolling.state.progress).toBe(0.25)
      expect(el.scrolling.state.offset).toBe(200)

      source.scrollTo(800)
      frames.step(32)
      expect(el.style.getPropertyValue('--scroll-progress')).toBe('1')
    })

    it('writes to a custom variable on another element', async () => {
      const source = scroller()
      const bar = document.createElement('div')
      await mount({
        source: () => source,
        property: '--reading',
        styleTarget: () => bar,
      })
      source.scrollTo(400)
      frames.step(16)
      expect(bar.style.getPropertyValue('--reading')).toBe('0.5')
    })

    it('measures a view timeline from entering the bottom to leaving the top', async () => {
      const page = document.scrollingElement ?? document.documentElement
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
      const el = await mount({ timeline: 'view' })
      const placeAt = (top: number) => {
        el.getBoundingClientRect = () =>
          ({ top, left: 0, width: 300, height: 200 }) as DOMRect
      }

      placeAt(800)
      page.dispatchEvent(new Event('scroll'))
      window.dispatchEvent(new Event('scroll'))
      frames.step(16)
      expect(el.scrolling.state.progress).toBe(0)

      placeAt(300)
      window.dispatchEvent(new Event('scroll'))
      frames.step(32)
      expect(el.scrolling.state.progress).toBe(0.5)

      placeAt(-200)
      window.dispatchEvent(new Event('scroll'))
      frames.step(48)
      expect(el.scrolling.state.progress).toBe(1)
    })
  })

  describe('direction and velocity', () => {
    it('flips direction after the threshold and re-renders the host only on a flip', async () => {
      const source = scroller()
      const el = await mount({ source: () => source, trackDirection: true })
      const requestUpdate = vi.spyOn(el, 'requestUpdate')

      source.scrollTo(5)
      frames.step(16)
      expect(el.scrolling.state.direction).toBeNull()

      source.scrollTo(40)
      frames.step(32)
      expect(el.scrolling.state.direction).toBe('forward')
      expect(el.scrolling.state.velocity).toBeGreaterThan(0)

      source.scrollTo(80)
      frames.step(48)
      expect(requestUpdate).toHaveBeenCalledTimes(1)

      source.scrollTo(75)
      frames.step(64)
      expect(el.scrolling.state.direction).toBe('forward')

      source.scrollTo(60)
      frames.step(80)
      expect(el.scrolling.state.direction).toBe('backward')
      expect(el.scrolling.state.velocity).toBeLessThan(0)
      expect(requestUpdate).toHaveBeenCalledTimes(2)
    })

    it('reports each frame to onScroll and drops velocity to zero when scrolling stops', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const source = scroller()
      const onScroll = vi.fn()
      await mount({ source: () => source, onScroll })
      onScroll.mockClear()

      source.scrollTo(100)
      frames.step(16)
      expect(onScroll).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(200)
      expect(onScroll).toHaveBeenCalledTimes(2)
      expect(onScroll.mock.lastCall?.[0].velocity).toBe(0)
    })
  })

  describe('native scroll timelines', () => {
    function installNative() {
      const created: Array<{ kind: string; options: unknown }> = []
      class FakeScrollTimeline {
        constructor(options: unknown) {
          created.push({ kind: 'scroll', options })
        }
      }
      class FakeViewTimeline {
        constructor(options: unknown) {
          created.push({ kind: 'view', options })
        }
      }
      const animation = {
        cancel: vi.fn(),
        effect: { getComputedTiming: () => ({ progress: 0.42 }) },
      }
      const animate = vi.fn(() => animation)
      const registerProperty = vi.fn()
      vi.stubGlobal('ScrollTimeline', FakeScrollTimeline)
      vi.stubGlobal('ViewTimeline', FakeViewTimeline)
      vi.stubGlobal('CSS', { supports: () => false, registerProperty })
      ;(HTMLElement.prototype as any).animate = animate
      return {
        created,
        animate,
        animation,
        registerProperty,
        uninstall() {
          vi.unstubAllGlobals()
          delete (HTMLElement.prototype as any).animate
        },
      }
    }

    it('animates the variable on a native timeline and adds no scroll listener', async () => {
      const native = installNative()
      try {
        const source = scroller()
        const listen = vi.spyOn(source, 'addEventListener')
        const el = await mount({ source: () => source, property: '--native-a' })

        expect(el.scrolling.isNative).toBe(true)
        expect(native.registerProperty).toHaveBeenCalledWith(
          expect.objectContaining({ name: '--native-a', syntax: '<number>' }),
        )
        expect(native.created).toEqual([
          { kind: 'scroll', options: { source, axis: 'block' } },
        ])
        expect(native.animate).toHaveBeenCalledWith(
          { '--native-a': ['0', '1'] },
          expect.objectContaining({ fill: 'both', easing: 'linear' }),
        )
        expect(listen).not.toHaveBeenCalled()

        el.remove()
        expect(native.animation.cancel).toHaveBeenCalled()
      } finally {
        native.uninstall()
      }
    })

    it('passes the page as the source rather than an inactive null', async () => {
      const native = installNative()
      try {
        await mount({ property: '--native-b' })
        const options = native.created[0].options as { source: Element }
        expect(options.source).toBe(
          document.scrollingElement ?? document.documentElement,
        )
      } finally {
        native.uninstall()
      }
    })

    it('uses a view timeline over the cover range for view progress', async () => {
      const native = installNative()
      try {
        const el = await mount({ timeline: 'view', property: '--native-c' })
        expect(native.created).toEqual([
          { kind: 'view', options: { subject: el, axis: 'block' } },
        ])
        expect(native.animate).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            rangeStart: 'cover 0%',
            rangeEnd: 'cover 100%',
          }),
        )
      } finally {
        native.uninstall()
      }
    })

    it('still listens for direction and reads progress from the native animation', async () => {
      const native = installNative()
      try {
        const source = scroller()
        const el = await mount({
          source: () => source,
          trackDirection: true,
          property: '--native-d',
        })
        source.scrollTo(300)
        frames.step(16)
        expect(el.scrolling.state.direction).toBe('forward')
        expect(el.scrolling.state.progress).toBe(0.42)
        expect(el.style.getPropertyValue('--native-d')).toBe('')
      } finally {
        native.uninstall()
      }
    })

    it('falls back to the script when forced', async () => {
      const native = installNative()
      try {
        const source = scroller()
        const el = await mount({ source: () => source, forceFallback: true })
        expect(el.scrolling.isNative).toBe(false)
        expect(native.animate).not.toHaveBeenCalled()
      } finally {
        native.uninstall()
      }
    })
  })

  it('stops listening and cancels its frame when disconnected', async () => {
    const source = scroller()
    const el = await mount({ source: () => source })
    source.scrollTo(100)
    el.remove()
    expect(frames.pending).toBe(0)
    source.scrollTo(500)
    expect(frames.pending).toBe(0)
  })
})
