import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './VideoDialog'
import type { MoulVideoDialog } from './VideoDialog'
import { videoDialogStyles } from './VideoDialog.styles'

const css = videoDialogStyles.cssText

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  expect(start, `no @media ${query}`).toBeGreaterThanOrEqual(0)
  let depth = 0
  const open = css.indexOf('{', start)
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  return ''
}

const EMBED = 'https://player.example.com/embed/tour'

const part = <T extends HTMLElement = HTMLElement>(
  el: MoulVideoDialog,
  name: string,
) => el.shadowRoot?.querySelector<T>(`[part="${name}"]`) as T

const dialog = (el: MoulVideoDialog) =>
  el.shadowRoot?.querySelector('dialog') as HTMLDialogElement

/** Lets the open or close and the renders it causes run to the end. */
const settle = async (el: MoulVideoDialog) => {
  for (let i = 0; i < 4; i++) {
    await el.updateComplete
    await new Promise((resolve) => setTimeout(resolve))
  }
}

function recordOpenChanges(el: MoulVideoDialog): boolean[] {
  const changes: boolean[] = []
  el.addEventListener('openchange', (event) =>
    changes.push((event as CustomEvent<{ isOpen: boolean }>).detail.isOpen),
  )
  return changes
}

function rect(left: number, top: number, width: number, height: number) {
  return () =>
    ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect
}

/**
 * happy-dom would otherwise fetch every embed URL the tests mount; with
 * loading off it reports each iframe as an error instead, which is expected
 * here and silenced.
 */
const happyDom = (
  window as unknown as {
    happyDOM?: { settings: { disableIframePageLoading: boolean } }
  }
).happyDOM

describe('<moul-video-dialog>', () => {
  let motion: ReducedMotionMock | null = null
  let couldLoadIframes = false

  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    if (!happyDom) return
    couldLoadIframes = !happyDom.settings.disableIframePageLoading
    happyDom.settings.disableIframePageLoading = true
  })

  afterAll(() => {
    vi.mocked(console.error).mockRestore()
    if (happyDom && couldLoadIframes) {
      happyDom.settings.disableIframePageLoading = false
    }
  })

  afterEach(() => {
    motion?.restore()
    motion = null
    fixtureCleanup()
  })

  it('renders a named thumbnail button and a closed dialog with no player yet', async () => {
    const el = await fixture<MoulVideoDialog>(html`
      <moul-video-dialog src=${EMBED} label="Watch the two-minute tour">
        <img slot="thumbnail" alt="" />
      </moul-video-dialog>
    `)
    expect(customElements.get('moul-video-dialog')).toBeDefined()
    const trigger = part<HTMLButtonElement>(el, 'trigger')
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.getAttribute('type')).toBe('button')
    expect(trigger.getAttribute('aria-label')).toBe('Watch the two-minute tour')
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(
      part(el, 'thumbnail').querySelector('slot[name="thumbnail"]'),
    ).not.toBeNull()
    expect(part(el, 'play-icon').getAttribute('aria-hidden')).toBe('true')
    expect(dialog(el).open).toBe(false)
    expect(dialog(el).getAttribute('aria-label')).toBe(
      'Watch the two-minute tour',
    )
    // Nothing loads until the reader asks for it.
    expect(el.shadowRoot?.querySelector('iframe, video')).toBeNull()
  })

  it('applies its defaults and normalises unknown values', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog></moul-video-dialog>`,
    )
    expect(el.label).toBe('Play video')
    expect(el.closeLabel).toBe('Close video')
    expect(el.animation).toBe('expand')
    expect(el.type).toBe('')
    expect(el.isOpen).toBe(false)
    el.setAttribute('animation', 'spin')
    el.setAttribute('type', 'audio')
    await el.updateComplete
    expect(el.animation).toBe('expand')
    expect(el.type).toBe('')
    expect(part(el, 'close-button').getAttribute('aria-label')).toBe(
      'Close video',
    )
  })

  it('opens an embedded player from the thumbnail and moves focus to the close button', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED} label="Watch the tour"></moul-video-dialog>`,
    )
    const changes = recordOpenChanges(el)
    part(el, 'trigger').click()
    await settle(el)

    expect(changes).toEqual([true])
    expect(el.isOpen).toBe(true)
    expect(el.hasAttribute('is-open')).toBe(true)
    expect(dialog(el).open).toBe(true)
    const iframe = part<HTMLIFrameElement>(el, 'iframe')
    expect(iframe).not.toBeNull()
    expect(part(el, 'panel').contains(iframe)).toBe(true)
    expect(iframe.getAttribute('src')).toBe(EMBED)
    expect(iframe.getAttribute('title')).toBe('Watch the tour')
    expect(iframe.getAttribute('allow')).toBe(
      'autoplay; fullscreen; picture-in-picture; encrypted-media',
    )
    expect(iframe.hasAttribute('allowfullscreen')).toBe(true)
    expect(iframe.getAttribute('referrerpolicy')).toBe(
      'strict-origin-when-cross-origin',
    )
    expect(el.shadowRoot?.activeElement).toBe(part(el, 'close-button'))
  })

  it('plays a video file in a <video> with its controls, and type overrides the guess', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src="/media/tour.mp4?v=2"></moul-video-dialog>`,
    )
    await el.setOpen(true)
    await settle(el)
    const video = part<HTMLVideoElement>(el, 'video')
    expect(video).not.toBeNull()
    expect(video.getAttribute('src')).toContain('/media/tour.mp4?v=2')
    expect(video.hasAttribute('controls')).toBe(true)
    expect(video.hasAttribute('autoplay')).toBe(true)
    expect(video.hasAttribute('playsinline')).toBe(true)
    expect(video.getAttribute('aria-label')).toBe('Play video')
    await el.setOpen(false)

    el.type = 'embed'
    await el.setOpen(true)
    await settle(el)
    expect(part(el, 'iframe')).not.toBeNull()
    expect(part(el, 'video')).toBeNull()
    await el.setOpen(false)

    el.src = 'https://cdn.example.com/stream/tour'
    el.type = 'video'
    await el.setOpen(true)
    await settle(el)
    expect(part(el, 'video')).not.toBeNull()
  })

  it('never plays a src that is not a web address', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src="javascript:alert(1)"></moul-video-dialog>`,
    )
    await el.setOpen(true)
    await settle(el)
    expect(dialog(el).open).toBe(true)
    expect(el.shadowRoot?.querySelector('iframe, video')).toBeNull()
    expect(warn).toHaveBeenCalled()

    await el.setOpen(false)
    el.src = 'data:video/mp4;base64,AAAA'
    await el.setOpen(true)
    await settle(el)
    expect(el.shadowRoot?.querySelector('iframe, video')).toBeNull()
    warn.mockRestore()
  })

  it('closes from the close button, removes the player and returns focus to the thumbnail', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    const changes = recordOpenChanges(el)
    const trigger = part<HTMLButtonElement>(el, 'trigger')
    trigger.focus()
    trigger.click()
    await settle(el)

    part(el, 'close-button').click()
    await settle(el)
    expect(changes).toEqual([true, false])
    expect(el.isOpen).toBe(false)
    expect(el.hasAttribute('is-open')).toBe(false)
    expect(dialog(el).open).toBe(false)
    expect(el.shadowRoot?.querySelector('iframe, video')).toBeNull()
    expect(el.shadowRoot?.activeElement).toBe(trigger)
  })

  it('closes on Escape and on a click on the backdrop, not on a click in the panel', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    const changes = recordOpenChanges(el)

    await el.setOpen(true)
    await settle(el)
    const escapeKey = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    part(el, 'close-button').dispatchEvent(escapeKey)
    expect(escapeKey.defaultPrevented).toBe(true)
    await settle(el)
    expect(dialog(el).open).toBe(false)

    await el.setOpen(true)
    await settle(el)
    part(el, 'panel').dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle(el)
    expect(dialog(el).open).toBe(true)
    dialog(el).dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle(el)
    expect(dialog(el).open).toBe(false)

    // The browser's own cancel is turned into the same close.
    await el.setOpen(true)
    await settle(el)
    const cancel = new Event('cancel', { cancelable: true })
    dialog(el).dispatchEvent(cancel)
    expect(cancel.defaultPrevented).toBe(true)
    await settle(el)
    expect(dialog(el).open).toBe(false)

    expect(changes).toEqual([true, false, true, false, true, false])
  })

  it('follows is-open set from script without firing openchange', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    const changes = recordOpenChanges(el)
    el.setAttribute('is-open', '')
    await settle(el)
    expect(dialog(el).open).toBe(true)
    expect(part(el, 'iframe')).not.toBeNull()
    el.removeAttribute('is-open')
    await settle(el)
    expect(dialog(el).open).toBe(false)
    expect(part(el, 'iframe')).toBeNull()
    expect(changes).toEqual([])
  })

  it('grows the panel out of the thumbnail with expand and shrinks it back', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    part(el, 'trigger').getBoundingClientRect = rect(100, 100, 320, 180)
    const panel = part(el, 'panel')
    panel.getBoundingClientRect = rect(0, 0, 1280, 720)
    const animate = vi.fn(
      () =>
        ({
          finished: Promise.resolve(),
          cancel: vi.fn(),
        }) as unknown as Animation,
    )
    panel.animate = animate as unknown as typeof panel.animate

    await el.setOpen(true)
    expect(animate).toHaveBeenCalledTimes(1)
    const [enter, enterOptions] = animate.mock.calls[0] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ]
    // Centre 260,190 against 640,360; a quarter of the size.
    expect(enter[0].transform).toBe(
      'translate(-380px, -170px) scale(0.25, 0.25)',
    )
    expect(enter[enter.length - 1].transform).toBe('none')
    expect(enterOptions.duration).toBeGreaterThan(0)

    await el.setOpen(false)
    expect(animate).toHaveBeenCalledTimes(2)
    const [exit, exitOptions] = animate.mock.calls[1] as unknown as [
      Keyframe[],
      KeyframeAnimationOptions,
    ]
    expect(exit[exit.length - 1].transform).toBe(
      'translate(-380px, -170px) scale(0.25, 0.25)',
    )
    expect(exitOptions.fill).toBe('forwards')
    expect(dialog(el).open).toBe(false)
  })

  it('fades or slides the panel without the thumbnail for the other animations', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED} animation="slide-up"></moul-video-dialog>`,
    )
    const panel = part(el, 'panel')
    const animate = vi.fn(
      () =>
        ({
          finished: Promise.resolve(),
          cancel: vi.fn(),
        }) as unknown as Animation,
    )
    panel.animate = animate as unknown as typeof panel.animate
    await el.setOpen(true)
    const [slide] = animate.mock.calls[0] as unknown as [Keyframe[]]
    expect(slide[0].transform).toBe('translateY(3rem)')

    await el.setOpen(false)
    el.animation = 'fade'
    await el.updateComplete
    await el.setOpen(true)
    const [fade] = animate.mock.calls[2] as unknown as [Keyframe[]]
    expect(fade[0]).toMatchObject({ transform: 'scale(0.96)', opacity: 0 })
  })

  it('opens and closes at once under reduced motion', async () => {
    motion = mockReducedMotion(true)
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    const panel = part(el, 'panel')
    const animate = vi.fn()
    panel.animate = animate as unknown as typeof panel.animate

    await el.setOpen(true)
    expect(dialog(el).open).toBe(true)
    await el.setOpen(false)
    expect(dialog(el).open).toBe(false)
    expect(animate).not.toHaveBeenCalled()

    const reduced = mediaBlock('(prefers-reduced-motion: reduce)')
    expect(reduced).toMatch(/\.play::before\s*\{\s*animation: none/)
    expect(reduced).toContain('dialog[data-closing]::backdrop')
    expect(reduced).toContain('scale: none')
  })

  it('closes its dialog when it leaves the page', async () => {
    const el = await fixture<MoulVideoDialog>(
      html`<moul-video-dialog src=${EMBED}></moul-video-dialog>`,
    )
    await el.setOpen(true)
    await settle(el)
    const native = dialog(el)
    el.remove()
    expect(native.open).toBe(false)
  })
})
