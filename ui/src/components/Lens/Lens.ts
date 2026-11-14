import { html, LitElement, type PropertyValues } from 'lit'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { lensStyles } from './Lens.styles'

/*
 * The pointer position is written once per frame on the lens and on the
 * magnified copy inside it. These properties are registered so they do not
 * inherit: writing them never restyles the copies of your content. Shadow
 * roots ignore `@property`, so they are registered once here; where
 * registration is missing they inherit, and the lens still works.
 */
for (const [name, syntax, initialValue] of [
  ['--_lens-pointer-x', '<length-percentage>', '0px'],
  ['--_lens-pointer-y', '<length-percentage>', '0px'],
  ['--_lens-pointer-ratio-x', '<number>', '0.5'],
  ['--_lens-pointer-ratio-y', '<number>', '0.5'],
] as const) {
  try {
    CSS.registerProperty({ name, syntax, inherits: false, initialValue })
  } catch {
    // Already registered, or the browser cannot register properties.
  }
}

const DEFAULT_ZOOM = 2
const DEFAULT_SIZE = 160
const DEFAULT_POSITION = '50%'

/** Marks the light-DOM copies the element makes, so it can find and ignore them. */
const COPY_ATTRIBUTE = 'data-lens-copy'
const COPY_SLOT = 'lens'

/**
 * A round magnifier that follows the pointer over a photo, a map, a chart or
 * any other content and shows what is beneath it `zoom` times larger, for
 * the stitching on a product shot or the small print on a plan. `size` sets
 * how wide the lens is. With `is-static` the lens stays put at `position-x`
 * and `position-y` and needs no pointer, to call out one detail. On a touch
 * screen the lens appears where the finger presses and follows it until the
 * page starts to scroll. The lens shows a copy of your content: the element
 * makes it in the light DOM, next to your content, the first time the lens
 * is needed, and remakes it when the content changes, so your page's CSS
 * styles the copy too. An image with a `srcset` gets a sharper source in the
 * copy. Give the element no padding or border of its own; style the content
 * inside it. Bare text outside an element, a `<canvas>` and a playing
 * `<video>` are not mirrored. The lens moves by transforms alone, so the
 * page is not laid out again while the pointer moves. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The lens is
 * a visual aid only: your content is read once, at its normal size, and the
 * copy is `aria-hidden` and `inert`, so screen readers skip it and nothing
 * in it takes focus. Readers who need the content larger can zoom the page,
 * which the lens never blocks; `is-static` shows the lens without a pointer.
 *
 * Reduced motion: the lens appears and goes at once instead of growing and
 * fading. It still follows the pointer directly, without easing, because the
 * movement is the reader's own.
 *
 * @slot - The content to magnify: an image, a map, a chart, any elements.
 * @slot lens - Used by the element for the copy of your content. Do not put anything in it.
 *
 * @csspart lens - The round lens.
 *
 * @cssprop --lens-background - What shows in the lens where the content is transparent. Defaults to `var(--color-bg)`.
 * @cssprop --lens-border-color - The ring round the lens. Defaults to `var(--color-border)`.
 */
export class MoulLens extends LitElement {
  static override styles = lensStyles

  static override properties = {
    zoom: { type: Number },
    size: { type: Number },
    isStatic: { type: Boolean, reflect: true, attribute: 'is-static' },
    positionX: { type: String, attribute: 'position-x' },
    positionY: { type: String, attribute: 'position-y' },
  }

  /** How many times larger the content shows in the lens. Defaults to 2; values below 1 fall back to it. */
  declare zoom: number
  /** Width of the lens, in pixels. Defaults to 160. */
  declare size: number
  /** Keep the lens in place, at `position-x` and `position-y`, without following the pointer. */
  declare isStatic: boolean
  /** Where a static lens is centred across the content: a CSS length or percentage; a bare number is a percentage. Defaults to `50%`. */
  declare positionX: string
  /** Where a static lens is centred down the content: a CSS length or percentage; a bare number is a percentage. Defaults to `50%`. */
  declare positionY: string

  private hasCopies = false
  private isSyncQueued = false
  /** The items the current copies were made from. */
  private copiedFrom: Element[] = []
  private mutationObserver: MutationObserver | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.zoom = DEFAULT_ZOOM
    this.size = DEFAULT_SIZE
    this.isStatic = false
    this.positionX = DEFAULT_POSITION
    this.positionY = DEFAULT_POSITION
    // Registers itself with the host. The lens is a tool the reader moves,
    // so it keeps following under reduced motion.
    new PointerController(this, {
      prefix: '--_lens-pointer',
      styleTarget: () => this.lensEl,
      trackWhenReducedMotion: true,
      onFrame: this.handleFrame,
    })
  }

  private get viewportEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.viewport') ?? null
  }

  private get lensEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="lens"]') ?? null
  }

  private get zoomedEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.zoomed') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerEnd)
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('pointercancel', this.handlePointerEnd)
    if (typeof MutationObserver === 'function') {
      this.mutationObserver = new MutationObserver(this.handleMutations)
      this.mutationObserver.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      })
    }
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this)
    }
    if (this.isStatic) this.syncCopies()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerEnd)
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('pointercancel', this.handlePointerEnd)
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.removeCopies()
    this.hasCopies = false
    this.copiedFrom = []
    this.setActive(false)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('zoom')) {
      const zoom =
        Number.isFinite(this.zoom) && this.zoom >= 1 ? this.zoom : DEFAULT_ZOOM
      this.style.setProperty('--_lens-zoom', String(zoom))
    }
    if (changed.has('size')) {
      const size =
        Number.isFinite(this.size) && this.size > 0 ? this.size : DEFAULT_SIZE
      this.style.setProperty('--_lens-size', `${size}px`)
    }
    if (changed.has('positionX')) {
      this.style.setProperty('--_lens-position-x', position(this.positionX))
    }
    if (changed.has('positionY')) {
      this.style.setProperty('--_lens-position-y', position(this.positionY))
    }
    if (changed.has('isStatic') && this.isStatic && !this.hasCopies) {
      this.syncCopies()
    }
  }

  private setActive(on: boolean): void {
    if (on && !this.hasCopies) this.syncCopies()
    this.viewportEl?.classList.toggle('is-active', on)
  }

  /** The copy inside the lens needs the position too; the controller wrote it on the lens. */
  private readonly handleFrame = (state: PointerState): void => {
    this.writeCentre(state.x, state.y, false)
  }

  private writeCentre(x: number, y: number, onLens: boolean): void {
    const targets = onLens ? [this.lensEl, this.zoomedEl] : [this.zoomedEl]
    for (const target of targets) {
      target?.style.setProperty('--_lens-pointer-x', `${round(x)}px`)
      target?.style.setProperty('--_lens-pointer-y', `${round(y)}px`)
    }
  }

  private readonly handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.setActive(true)
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return
    // A press may not move at all: show the lens where the finger is.
    const box = this.getBoundingClientRect()
    this.writeCentre(event.clientX - box.left, event.clientY - box.top, true)
    this.setActive(true)
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') this.setActive(false)
  }

  private readonly handlePointerEnd = (): void => {
    this.setActive(false)
  }

  /** The copy is laid out at the content's own width, so it wraps exactly as the content does. */
  private readonly handleResize = (entries: ResizeObserverEntry[]): void => {
    const entry = entries[entries.length - 1]
    if (!entry) return
    const box = entry.contentBoxSize?.[0]
    const width = box ? box.inlineSize : entry.contentRect.width
    const height = box ? box.blockSize : entry.contentRect.height
    this.style.setProperty('--_lens-width', `${round(width)}px`)
    this.style.setProperty('--_lens-height', `${round(height)}px`)
  }

  private originals(): Element[] {
    return [...this.children].filter(
      (child) =>
        !child.hasAttribute(COPY_ATTRIBUTE) && !child.hasAttribute('slot'),
    )
  }

  private removeCopies(): void {
    for (const child of [...this.children]) {
      if (child.hasAttribute(COPY_ATTRIBUTE)) child.remove()
    }
  }

  /** Throws away the copies and makes them again from the current content. */
  private syncCopies(): void {
    this.isSyncQueued = false
    if (!this.isConnected) return
    this.removeCopies()
    const originals = this.originals()
    this.copiedFrom = originals
    this.hasCopies = true
    const zoom =
      Number.isFinite(this.zoom) && this.zoom >= 1 ? this.zoom : DEFAULT_ZOOM
    const fragment = document.createDocumentFragment()
    for (const original of originals) {
      fragment.append(makeCopy(original, zoom))
    }
    this.append(fragment)
  }

  private scheduleSync(): void {
    if (this.isSyncQueued || !this.hasCopies) return
    this.isSyncQueued = true
    queueMicrotask(() => {
      if (this.isSyncQueued) this.syncCopies()
    })
  }

  /** Content added or removed; changes inside it reach the mutation observer instead. */
  private readonly handleSlotChange = (): void => {
    const originals = this.originals()
    const isSame =
      originals.length === this.copiedFrom.length &&
      originals.every((item, index) => item === this.copiedFrom[index])
    if (!isSame) this.scheduleSync()
  }

  /** Remakes the copies when the content changes, ignoring the copies' own changes and the host's attributes. */
  private readonly handleMutations = (records: MutationRecord[]): void => {
    const changed = records.some((record) => {
      if (!this.contains(record.target) || isInsideCopy(record.target)) {
        return false
      }
      if (record.target === this) {
        if (record.type === 'attributes') return false
        const nodes = [...record.addedNodes, ...record.removedNodes]
        return nodes.some(
          (node) =>
            node instanceof Element && !node.hasAttribute(COPY_ATTRIBUTE),
        )
      }
      return true
    })
    if (changed) this.scheduleSync()
  }

  protected override render() {
    return html`<slot @slotchange=${this.handleSlotChange}></slot>
      <div class="viewport" aria-hidden="true">
        <div part="lens">
          <div class="zoomed"><slot name=${COPY_SLOT}></slot></div>
        </div>
      </div>`
  }
}

/** A deep clone that is hidden from screen readers, cannot take focus, and has no ids to clash with the original's. */
function makeCopy(original: Element, zoom: number): Element {
  const copy = original.cloneNode(true) as Element
  copy.setAttribute(COPY_ATTRIBUTE, '')
  copy.removeAttribute('id')
  for (const node of copy.querySelectorAll('[id]')) node.removeAttribute('id')
  copy.setAttribute('slot', COPY_SLOT)
  copy.setAttribute('aria-hidden', 'true')
  copy.setAttribute('inert', '')
  // The copy sits clipped inside the lens, where lazy loading would never start.
  const images = [
    ...(copy instanceof HTMLImageElement ? [copy] : []),
    ...copy.querySelectorAll('img'),
  ]
  const sources = [
    ...(original instanceof HTMLImageElement ? [original] : []),
    ...original.querySelectorAll('img'),
  ]
  images.forEach((image, index) => {
    image.loading = 'eager'
    const source = sources[index]
    // Ask for a source sharp enough to be shown `zoom` times larger.
    if (image.srcset && source) {
      const width = source.getBoundingClientRect().width
      if (width > 0) image.sizes = `${Math.ceil(width * zoom)}px`
    }
  })
  return copy
}

function isInsideCopy(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement
  return element?.closest(`[${COPY_ATTRIBUTE}]`) != null
}

/** A CSS length or percentage; a bare number is a percentage. */
function position(value: string): string {
  const text = String(value ?? '').trim()
  if (text === '') return DEFAULT_POSITION
  return /^-?\d*\.?\d+$/.test(text) ? `${text}%` : text
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

defineElement('moul-lens', MoulLens)

declare global {
  interface HTMLElementTagNameMap {
    'moul-lens': MoulLens
  }
}
