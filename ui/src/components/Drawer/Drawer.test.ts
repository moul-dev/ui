import { html, type LitElement, render } from 'lit'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import { type MoulDrawer, MoulDrawer as MoulDrawerClass } from './Drawer'
import { drawerStyles } from './Drawer.styles'

const SHEET_HEIGHT = 300

async function mount(template: unknown): Promise<MoulDrawer> {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(template, container)
  const drawer = container.firstElementChild as MoulDrawer
  await (drawer as LitElement).updateComplete
  return drawer
}

/** Mounts an open sheet whose panel measures `SHEET_HEIGHT` px tall. */
async function openSheet(template?: unknown): Promise<MoulDrawer> {
  const drawer = await mount(
    template ??
      html`<moul-drawer is-sheet>
        <h3 slot="header">Share</h3>
        <p>Pick where to send it.</p>
        <button slot="footer">Done</button>
      </moul-drawer>`,
  )
  const base = drawer.contentEl!
  base.getBoundingClientRect = () =>
    ({
      top: 468,
      bottom: 768,
      left: 0,
      right: 1024,
      width: 1024,
      height: SHEET_HEIGHT,
      x: 0,
      y: 468,
      toJSON: () => ({}),
    }) as DOMRect
  await drawer.setOpen(true)
  await drawer.updateComplete
  return drawer
}

const part = (drawer: MoulDrawer, name: string): HTMLElement =>
  drawer.shadowRoot!.querySelector<HTMLElement>(`[part="${name}"]`)!

/** The drag offset the sheet is drawn at, as the CSS reads it. */
const offset = (drawer: MoulDrawer): string =>
  drawer.dialogEl!.style.getPropertyValue('--_drag-y') || '0px'

let clock = 1000

function pointer(
  type: string,
  target: EventTarget,
  clientY: number,
  timeStamp = clock,
  slotted?: Element,
): void {
  const event = new PointerEvent(type, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    pointerType: 'touch',
    clientX: 100,
    clientY,
    bubbles: true,
    composed: true,
  })
  Object.defineProperty(event, 'timeStamp', { value: timeStamp })
  if (slotted) {
    // happy-dom leaves shadow slots out of a slotted node's event path; build
    // the browser's path, from the slotted node through its slot.
    const path = event.composedPath.bind(event)
    Object.defineProperty(event, 'composedPath', {
      value: () => [slotted, ...path()],
    })
  }
  target.dispatchEvent(event)
}

/**
 * Presses on `target`, moves through the vertical `points` 16 ms apart and,
 * unless `release` is false, lets go. `hold` waits that long before letting
 * go, so the release reads as zero velocity. `slotted` is the light DOM node
 * the press lands on when `target` is its slot.
 */
function dragY(
  target: EventTarget,
  points: number[],
  {
    release = true,
    hold = 0,
    slotted,
  }: { release?: boolean; hold?: number; slotted?: Element } = {},
): void {
  pointer('pointerdown', target, points[0], clock, slotted)
  for (const y of points.slice(1)) {
    clock += 16
    pointer('pointermove', window, y)
  }
  if (!release) return
  clock += hold
  pointer('pointerup', window, points[points.length - 1])
}

/**
 * Where a press on the body's content passes through. happy-dom leaves the
 * slot out of a slotted node's event path, so presses start at the slot.
 */
const slottedContent = (drawer: MoulDrawer): HTMLElement =>
  part(drawer, 'body').querySelector('slot')!

/** Gives the body scrollable content, scrolled `scrollTop` px down. */
function makeBodyScroll(drawer: MoulDrawer, scrollTop: number): void {
  const body = part(drawer, 'body')
  Object.defineProperty(body, 'scrollHeight', {
    configurable: true,
    value: 900,
  })
  Object.defineProperty(body, 'clientHeight', {
    configurable: true,
    value: 240,
  })
  Object.defineProperty(body, 'scrollTop', {
    configurable: true,
    writable: true,
    value: scrollTop,
  })
}

function trackOpenChange(drawer: MoulDrawer): Array<{ isOpen: boolean }> {
  const details: Array<{ isOpen: boolean }> = []
  drawer.addEventListener('openchange', (event) => {
    details.push((event as CustomEvent<{ isOpen: boolean }>).detail)
  })
  return details
}

describe('MoulDrawer sheet (`moul-drawer` with `is-sheet`)', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('reflects is-sheet, renders a decorative handle and ignores placement', async () => {
    const drawer = await mount(
      html`<moul-drawer placement="right" size="lg"></moul-drawer>`,
    )
    expect(drawer).toBeInstanceOf(MoulDrawerClass)
    expect(drawer.isSheet).toBe(false)
    expect(drawer.shadowRoot!.querySelector('[part="handle"]')).toBeNull()

    drawer.isSheet = true
    await drawer.updateComplete
    expect(drawer.hasAttribute('is-sheet')).toBe(true)

    const handle = part(drawer, 'handle')
    expect(handle.getAttribute('aria-hidden')).toBe('true')
    expect(handle.hasAttribute('tabindex')).toBe(false)
    expect(handle.tagName).toBe('DIV')
    // First in the panel, above the header.
    expect(part(drawer, 'base').firstElementChild).toBe(handle)

    const preset = () =>
      (drawer.overlayPresence as unknown as { options: { preset: string } })
        .options.preset
    expect(preset()).toBe('drawer-bottom')

    drawer.isSheet = false
    await drawer.updateComplete
    expect(preset()).toBe('drawer-right')
  })

  it('styles the sheet over any placement: bottom edge, fitted height, safe area, drag offset', () => {
    const css = drawerStyles
      .map((s: unknown) => (s as { cssText?: string }).cssText ?? String(s))
      .join('\n')
    const rule = (selector: string) =>
      css.match(
        new RegExp(
          `${selector.replace(/[[\]()^$.*+?|\\]/g, '\\$&')}\\s*\\{[^}]*\\}`,
        ),
      )?.[0] ?? ''

    const base = rule(':host([is-sheet]) [part~="base"]')
    expect(base).toMatch(/max-height:\s*90dvh/)
    expect(base).toMatch(/env\(safe-area-inset-bottom/)
    expect(base).toMatch(/translate:\s*0 var\(--_drag-y/)
    expect(base).toMatch(
      /border-radius:\s*var\(--_radius\) var\(--_radius\) 0 0/,
    )
    expect(rule(':host([is-sheet]) dialog')).toMatch(/align-items:\s*flex-end/)
    expect(rule(':host([is-sheet]) dialog::backdrop')).toMatch(
      /opacity:\s*calc\(1 - var\(--_sheet-progress/,
    )

    // Placement rules step aside for a sheet, so they cannot outrank it.
    expect(css).toContain(':host([placement="right"]:not([is-sheet])) dialog')
    expect(css).toContain(
      ':host([placement="bottom"][size="md"]:not([is-sheet])) [part~="base"]',
    )
    expect(css).not.toMatch(/:host\(\[placement="\w+"\]\)/)
  })

  it('closes when dragged past a third of its height and fires openchange', async () => {
    const drawer = await openSheet()
    const events = trackOpenChange(drawer)

    dragY(part(drawer, 'handle'), [500, 510, 560, 620], {
      release: false,
    })
    await drawer.updateComplete
    expect(offset(drawer)).toBe('120px')
    expect(drawer.dialogEl!.hasAttribute('data-dragging')).toBe(true)
    // The backdrop clears with the drag: 120 of 300 px.
    expect(drawer.dialogEl!.style.getPropertyValue('--_sheet-progress')).toBe(
      '0.4',
    )

    clock += 400
    pointer('pointerup', window, 620)
    expect(drawer.isOpen).toBe(false)
    expect(events).toEqual([{ isOpen: false }])
    await vi.waitFor(() => expect(drawer.dialogEl!.open).toBe(false))
    expect(drawer.dialogEl!.hasAttribute('data-dragging')).toBe(false)

    // Reopening starts from the resting position again.
    await drawer.setOpen(true)
    expect(offset(drawer)).toBe('0px')
    expect(drawer.dialogEl!.style.getPropertyValue('--_sheet-progress')).toBe(
      '',
    )
  })

  it('springs back from a short, slow drag and stays open', async () => {
    const drawer = await openSheet()
    const events = trackOpenChange(drawer)

    dragY(part(drawer, 'header'), [500, 510, 560], { hold: 400 })
    expect(drawer.isOpen).toBe(true)
    expect(events).toEqual([])
    expect(drawer.dialogEl!.style.getPropertyValue('--_sheet-progress')).toBe(
      '0',
    )
    // A spring, not a jump.
    expect(offset(drawer)).not.toBe('0px')
    await vi.waitFor(() => expect(offset(drawer)).toBe('0px'), {
      timeout: 3000,
    })
    expect(drawer.dialogEl!.open).toBe(true)
  })

  it('closes on a fast downward flick even when the drag is short', async () => {
    const drawer = await openSheet()
    const events = trackOpenChange(drawer)

    // 40 px in 32 ms: 1250 px/s.
    dragY(part(drawer, 'handle'), [500, 510, 540])
    expect(drawer.isOpen).toBe(false)
    expect(events).toEqual([{ isOpen: false }])
  })

  it('stays open when a long drag ends in a fast upward flick', async () => {
    const drawer = await openSheet()
    dragY(part(drawer, 'handle'), [500, 510, 700], {
      release: false,
    })
    clock += 200
    pointer('pointermove', window, 690)
    clock += 16
    pointer('pointermove', window, 640)
    pointer('pointerup', window, 640)
    expect(drawer.isOpen).toBe(true)
  })

  it('rubber-bands an upward drag and springs back', async () => {
    const drawer = await openSheet()
    dragY(part(drawer, 'handle'), [500, 490, 400], { release: false })
    // 100 px up past the top bound, at the controller's 0.35 elastic.
    expect(offset(drawer)).toBe('-35px')
    expect(drawer.dialogEl!.style.getPropertyValue('--_sheet-progress')).toBe(
      '0',
    )

    clock += 400
    pointer('pointerup', window, 400)
    expect(drawer.isOpen).toBe(true)
    await vi.waitFor(() => expect(offset(drawer)).toBe('0px'), {
      timeout: 3000,
    })
  })

  it('rubber-bands and springs back instead of closing when not dismissable', async () => {
    const drawer = await openSheet(
      html`<moul-drawer is-sheet .isDismissable=${false}>
        <p>Finish the form first.</p>
      </moul-drawer>`,
    )
    const events = trackOpenChange(drawer)

    dragY(part(drawer, 'handle'), [500, 510, 700], { release: false })
    expect(offset(drawer)).toBe('70px')
    // Even a flick does not close it.
    clock += 16
    pointer('pointermove', window, 800)
    pointer('pointerup', window, 800)
    expect(drawer.isOpen).toBe(true)
    expect(events).toEqual([])
    await vi.waitFor(() => expect(offset(drawer)).toBe('0px'), {
      timeout: 3000,
    })

    // Escape still closes it, as it does any drawer.
    drawer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(drawer.isOpen).toBe(false)
  })

  it('lets scrolled content scroll, and drags from its top only downward', async () => {
    const drawer = await openSheet()
    const content = slottedContent(drawer)

    // Scrolled down: the content keeps the gesture.
    makeBodyScroll(drawer, 120)
    dragY(content, [300, 310, 500], { hold: 400 })
    expect(offset(drawer)).toBe('0px')
    expect(drawer.isOpen).toBe(true)

    // At the top, heading up: still the content's, even if it turns down.
    makeBodyScroll(drawer, 0)
    dragY(content, [300, 290, 250, 400], { release: false })
    expect(offset(drawer)).toBe('0px')
    pointer('pointerup', window, 400)

    // At the top, heading down: the sheet follows and closes.
    dragY(content, [300, 310, 450], { release: false })
    expect(offset(drawer)).toBe('150px')
    clock += 400
    pointer('pointerup', window, 450)
    expect(drawer.isOpen).toBe(false)
  })

  it('drags from the header even while the content is scrolled', async () => {
    const drawer = await openSheet()
    makeBodyScroll(drawer, 120)
    dragY(part(drawer, 'header'), [500, 510, 560], { release: false })
    expect(offset(drawer)).toBe('60px')
    pointer('pointerup', window, 560)
  })

  it('never drags from a text field, so its text can still be selected', async () => {
    const drawer = await openSheet(
      html`<moul-drawer is-sheet>
        <p>Add a comment</p>
        <input slot="footer" aria-label="Comment" />
      </moul-drawer>`,
    )
    const footerSlot = part(drawer, 'footer').querySelector('slot')!
    const input = drawer.querySelector('input')!
    dragY(footerSlot, [500, 510, 650], { release: false, slotted: input })
    expect(offset(drawer)).toBe('0px')
    pointer('pointerup', window, 650)

    // The footer around it still drags.
    dragY(footerSlot, [500, 510, 560], { release: false })
    expect(offset(drawer)).toBe('60px')
    pointer('pointerup', window, 560)
  })

  it('stretches content that cannot scroll in both directions, like the handle', async () => {
    const drawer = await openSheet()
    dragY(slottedContent(drawer), [300, 290, 200], { release: false })
    expect(offset(drawer)).toBe('-35px')
    pointer('pointerup', window, 200)
  })

  it('returns at once instead of springing under reduced motion', async () => {
    motion = mockReducedMotion(true)
    const drawer = await openSheet()

    // The panel still follows the finger.
    dragY(part(drawer, 'handle'), [500, 510, 560], { release: false })
    expect(offset(drawer)).toBe('60px')
    clock += 400
    pointer('pointerup', window, 560)
    expect(offset(drawer)).toBe('0px')
    expect(drawer.isOpen).toBe(true)

    // A dismissing release closes at once too.
    dragY(part(drawer, 'handle'), [500, 510, 700], { hold: 400 })
    expect(drawer.isOpen).toBe(false)
    await drawer.updateComplete
    await vi.waitFor(() => expect(drawer.dialogEl!.open).toBe(false))

    const css = drawerStyles
      .map((s: unknown) => (s as { cssText?: string }).cssText ?? String(s))
      .join('\n')
    const reduced = css.slice(css.indexOf('@media (prefers-reduced-motion'))
    expect(reduced).toMatch(
      /:host\(\[is-sheet\]\) dialog::backdrop\s*\{\s*transition:\s*none/,
    )
  })

  it('keeps Escape, focus and the outside click as they were', async () => {
    const opener = document.createElement('button')
    document.body.append(opener)
    opener.focus()

    const drawer = await openSheet()
    const events = trackOpenChange(drawer)
    // Focus lands on the first control, never on the handle.
    await vi.waitFor(() =>
      expect(document.activeElement).toBe(drawer.querySelector('button')),
    )

    drawer.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(drawer.isOpen).toBe(false)
    expect(events).toEqual([{ isOpen: false }])
    await vi.waitFor(() => expect(document.activeElement).toBe(opener))

    // A click above the sheet closes it.
    await drawer.setOpen(true)
    drawer.dialogEl!.dispatchEvent(
      new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }),
    )
    expect(drawer.isOpen).toBe(false)
  })

  it('does not drag a drawer without is-sheet, at any placement', async () => {
    const drawer = await openSheet(
      html`<moul-drawer placement="bottom"><p>Plain drawer</p></moul-drawer>`,
    )
    expect(drawer.shadowRoot!.querySelector('[part="handle"]')).toBeNull()
    dragY(part(drawer, 'header'), [500, 510, 700], { hold: 400 })
    expect(offset(drawer)).toBe('0px')
    expect(drawer.isOpen).toBe(true)
  })
})
