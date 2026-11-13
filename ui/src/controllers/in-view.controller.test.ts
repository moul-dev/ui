import { html, LitElement } from 'lit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InViewController,
  type InViewControllerOptions,
} from './in-view.controller'

let hostCount = 0

class InViewHost extends LitElement {
  inView!: InViewController
  protected override render() {
    return html`<div part="stage"></div>`
  }
}

async function mount(
  options:
    | InViewControllerOptions
    | ((host: InViewHost) => InViewControllerOptions) = {},
): Promise<InViewHost> {
  const tag = `in-view-host-${++hostCount}`
  customElements.define(
    tag,
    class extends InViewHost {
      constructor() {
        super()
        this.inView = new InViewController(
          this,
          typeof options === 'function' ? options(this) : options,
        )
      }
    },
  )
  const el = document.createElement(tag) as InViewHost
  document.body.append(el)
  await el.updateComplete
  return el
}

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = []
  readonly targets: Element[] = []
  isDisconnected = false
  readonly callback: IntersectionObserverCallback
  readonly options: IntersectionObserverInit
  constructor(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {},
  ) {
    this.callback = callback
    this.options = options
    FakeIntersectionObserver.instances.push(this)
  }
  observe(target: Element) {
    this.targets.push(target)
  }
  unobserve() {}
  disconnect() {
    this.isDisconnected = true
  }
  takeRecords() {
    return []
  }
  /** Reports the target as intersecting or not, with the given visible share. */
  report(isIntersecting: boolean, intersectionRatio = isIntersecting ? 1 : 0) {
    this.callback(
      [
        {
          isIntersecting,
          intersectionRatio,
          target: this.targets[0],
        } as unknown as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

const latestObserver = () =>
  FakeIntersectionObserver.instances[
    FakeIntersectionObserver.instances.length - 1
  ]

function fakeAnimation(playState: AnimationPlayState) {
  const animation = {
    playState,
    pause: vi.fn(() => {
      animation.playState = 'paused'
    }),
    play: vi.fn(() => {
      animation.playState = 'running'
    }),
  }
  return animation
}

describe('InViewController', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('tracks entering and leaving, and re-renders the host on each change', async () => {
    const onChange = vi.fn()
    const el = await mount({ onChange })
    const requestUpdate = vi.spyOn(el, 'requestUpdate')
    expect(el.inView.isInView).toBe(false)
    expect(latestObserver().targets).toEqual([el])

    latestObserver().report(true)
    expect(el.inView.isInView).toBe(true)
    expect(el.inView.hasEntered).toBe(true)
    expect(onChange).toHaveBeenLastCalledWith(true, expect.anything())

    latestObserver().report(true)
    expect(requestUpdate).toHaveBeenCalledTimes(1)

    latestObserver().report(false)
    expect(el.inView.isInView).toBe(false)
    expect(el.inView.hasEntered).toBe(true)
    expect(requestUpdate).toHaveBeenCalledTimes(2)
  })

  it('counts as in view only once the threshold share is visible', async () => {
    const el = await mount({ threshold: 0.5, rootMargin: '0px 0px -10% 0px' })
    expect(latestObserver().options).toMatchObject({
      threshold: [0, 0.5],
      rootMargin: '0px 0px -10% 0px',
    })
    latestObserver().report(true, 0.3)
    expect(el.inView.isInView).toBe(false)
    latestObserver().report(true, 0.6)
    expect(el.inView.isInView).toBe(true)
  })

  it('stops watching after the first entry when once is set', async () => {
    const el = await mount({ once: true })
    const observer = latestObserver()
    observer.report(true)
    expect(observer.isDisconnected).toBe(true)
    el.requestUpdate()
    await el.updateComplete
    expect(FakeIntersectionObserver.instances).toHaveLength(1)
    expect(el.inView.isInView).toBe(true)
  })

  it('observes a shadow-root target once the host has rendered', async () => {
    const el = await mount((host) => ({
      target: () => host.shadowRoot?.querySelector('[part="stage"]') ?? null,
    }))
    const stage = el.shadowRoot!.querySelector('[part="stage"]')
    expect(latestObserver().targets).toEqual([stage])
  })

  it('pauses running animations off screen and resumes only those it paused', async () => {
    const el = await mount()
    const running = fakeAnimation('running')
    const pausedByElement = fakeAnimation('paused')
    const inShadow = fakeAnimation('running')
    el.getAnimations = () =>
      [running, pausedByElement] as unknown as Animation[]
    ;(el.shadowRoot as any).getAnimations = () => [inShadow]

    latestObserver().report(true)
    latestObserver().report(false)
    expect(running.pause).toHaveBeenCalled()
    expect(inShadow.pause).toHaveBeenCalled()
    expect(pausedByElement.pause).not.toHaveBeenCalled()

    latestObserver().report(true)
    expect(running.play).toHaveBeenCalled()
    expect(inShadow.play).toHaveBeenCalled()
    expect(pausedByElement.play).not.toHaveBeenCalled()
  })

  it('pauses the animations of an element that starts off screen, without re-rendering it', async () => {
    const onChange = vi.fn()
    const el = await mount({ onChange })
    const requestUpdate = vi.spyOn(el, 'requestUpdate')
    const running = fakeAnimation('running')
    el.getAnimations = () => [running] as unknown as Animation[]

    latestObserver().report(false)
    expect(running.pause).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
    expect(requestUpdate).not.toHaveBeenCalled()

    latestObserver().report(false)
    expect(running.pause).toHaveBeenCalledTimes(1)

    latestObserver().report(true)
    expect(running.play).toHaveBeenCalledTimes(1)
  })

  it('leaves animations alone when pauseOffscreen is false', async () => {
    const el = await mount({ pauseOffscreen: false })
    const running = fakeAnimation('running')
    el.getAnimations = () => [running] as unknown as Animation[]
    latestObserver().report(true)
    latestObserver().report(false)
    expect(running.pause).not.toHaveBeenCalled()
  })

  it('resumes what it paused and disconnects when the host is removed', async () => {
    const el = await mount()
    const running = fakeAnimation('running')
    el.getAnimations = () => [running] as unknown as Animation[]
    latestObserver().report(true)
    latestObserver().report(false)
    const observer = latestObserver()
    el.remove()
    expect(observer.isDisconnected).toBe(true)
    expect(running.play).toHaveBeenCalled()
  })

  it('counts as in view at once where IntersectionObserver is missing', async () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const el = await mount()
    expect(el.inView.isInView).toBe(true)
    expect(el.inView.hasEntered).toBe(true)
  })
})
