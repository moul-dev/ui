import { html, LitElement, type PropertyValues } from 'lit'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import { maskRevealStyles } from './MaskReveal.styles'

/*
 * The circle's centre and radius are registered properties, so they ease
 * when they change, and they do not inherit, so writing them once per frame
 * never restyles the content inside the layers. Shadow roots ignore
 * `@property`, so they are registered once here; where registration is
 * missing the circle still follows the pointer, without easing.
 */
const X_PROPERTY = '--_mask-reveal-pointer-x'
const Y_PROPERTY = '--_mask-reveal-pointer-y'
const RADIUS_PROPERTY = '--_mask-reveal-r'

for (const [name, syntax, initialValue] of [
  [X_PROPERTY, '<length-percentage>', '50%'],
  [Y_PROPERTY, '<length-percentage>', '50%'],
  [RADIUS_PROPERTY, '<length>', '0px'],
] as const) {
  try {
    CSS.registerProperty({ name, syntax, inherits: false, initialValue })
  } catch {
    // Already registered, or the browser cannot register properties.
  }
}

const DEFAULT_SIZE = 0
const DEFAULT_REVEAL_SIZE = 240

/**
 * Two layers in one place, with a circle under the pointer that uncovers the
 * hidden one: move over a headline and a second line shows through where the
 * pointer is, or over a photo and the same scene at night appears. The
 * default slot is the layer everyone sees; the `revealed` slot is the layer
 * underneath. The circle rests at `size` pixels across (0, out of sight, by
 * default), grows to `reveal-size` while the pointer is over the element,
 * eases after it as it moves and shrinks back when it leaves. `is-revealed`
 * uncovers the whole layer. The element is as large as the larger layer;
 * both are laid out in the same place, so give them the same size. On a
 * touch screen the circle opens where the finger presses and follows it
 * until the page starts to scroll. The circle moves by masking alone, so the
 * page is not laid out again while the pointer moves. It lives in the
 * effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. Both
 * layers are ordinary content, read in order, the visible layer first; when
 * the hidden layer only repeats the visible one in another style, mark it
 * `aria-hidden="true"` so it is not read twice. Focus on anything inside the
 * hidden layer (a link, a button) uncovers the whole layer until focus
 * leaves, so a keyboard user always sees what is focused. If the hidden
 * layer says something a reader needs and holds nothing focusable, give
 * keyboard users a control that sets `is-revealed`.
 *
 * Reduced motion: no circle follows the pointer. The whole hidden layer
 * shows at once while the pointer is over the element (or a finger presses
 * it, or focus is inside it), and hides at once when it leaves.
 *
 * @slot - The visible layer.
 * @slot revealed - The hidden layer, uncovered under the pointer.
 *
 * @csspart content - The visible layer, with a hole where the circle is.
 * @csspart revealed - The hidden layer, cut to the circle.
 *
 * @cssprop --mask-reveal-duration - How long the circle takes to grow and shrink. Defaults to `0.3s`.
 */
export class MoulMaskReveal extends LitElement {
  static override styles = maskRevealStyles

  static override properties = {
    size: { type: Number },
    revealSize: { type: Number, attribute: 'reveal-size' },
    isRevealed: { type: Boolean, reflect: true, attribute: 'is-revealed' },
  }

  /** Width of the circle at rest, in pixels, when the pointer is not over the element. Defaults to 0. */
  declare size: number
  /** Width of the circle while the pointer is over the element, in pixels. Defaults to 240. */
  declare revealSize: number
  /** Uncover the whole hidden layer. */
  declare isRevealed: boolean

  private resizeObserver: ResizeObserver | null = null
  private isFocusInside = false

  constructor() {
    super()
    this.size = DEFAULT_SIZE
    this.revealSize = DEFAULT_REVEAL_SIZE
    this.isRevealed = false
    // Registers itself with the host. Under reduced motion it stops writing the centre.
    new PointerController(this, {
      prefix: '--_mask-reveal-pointer',
      styleTarget: () => this.revealedEl,
      onFrame: this.handleFrame,
    })
  }

  private get layersEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.layers') ?? null
  }

  private get contentEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="content"]') ?? null
    )
  }

  private get revealedEl(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="revealed"]') ?? null
    )
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerEnd)
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('pointercancel', this.handlePointerEnd)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
    if (typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(this.handleResize)
      this.resizeObserver.observe(this)
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerEnd)
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('pointercancel', this.handlePointerEnd)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.isFocusInside = false
    this.setState('is-active', false)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('size')) {
      this.style.setProperty(
        '--_mask-reveal-size',
        `${px(this.size, DEFAULT_SIZE)}px`,
      )
    }
    if (changed.has('revealSize')) {
      this.style.setProperty(
        '--_mask-reveal-active-size',
        `${px(this.revealSize, DEFAULT_REVEAL_SIZE)}px`,
      )
    }
    if (changed.has('isRevealed')) this.syncFull()
  }

  /** Toggles a state class on the layers; the stylesheet sets the radius from it. */
  private setState(name: string, on: boolean): void {
    this.layersEl?.classList.toggle(name, on)
  }

  private syncFull(): void {
    this.setState('is-full', this.isRevealed || this.isFocusInside)
  }

  /** The visible layer needs the centre too, for its hole; the controller wrote it on the hidden layer. */
  private readonly handleFrame = (state: PointerState): void => {
    this.writeCentre(`${round(state.x)}px`, `${round(state.y)}px`, false)
  }

  private writeCentre(x: string, y: string, both: boolean): void {
    const targets = both ? [this.contentEl, this.revealedEl] : [this.contentEl]
    for (const target of targets) {
      target?.style.setProperty(X_PROPERTY, x)
      target?.style.setProperty(Y_PROPERTY, y)
    }
  }

  private readonly handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.setState('is-active', true)
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType !== 'touch') return
    // A tap may not move at all: open the circle where the finger is.
    if (!prefersReducedMotion()) {
      const box = this.getBoundingClientRect()
      this.writeCentre(
        `${round(event.clientX - box.left)}px`,
        `${round(event.clientY - box.top)}px`,
        true,
      )
    }
    this.setState('is-active', true)
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') this.setState('is-active', false)
  }

  private readonly handlePointerEnd = (): void => {
    this.setState('is-active', false)
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const inside = isInRevealedLayer(event.target, this)
    if (inside === this.isFocusInside) return
    this.isFocusInside = inside
    this.syncFull()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    if (isInRevealedLayer(event.relatedTarget, this)) return
    if (!this.isFocusInside) return
    this.isFocusInside = false
    this.syncFull()
  }

  /** A circle as wide as the box's diagonal covers it from any centre inside it. */
  private readonly handleResize = (entries: ResizeObserverEntry[]): void => {
    const entry = entries[entries.length - 1]
    if (!entry) return
    const box = entry.borderBoxSize?.[0]
    const width = box ? box.inlineSize : entry.contentRect.width
    const height = box ? box.blockSize : entry.contentRect.height
    this.style.setProperty(
      '--_mask-reveal-full',
      `${Math.ceil(Math.hypot(width, height))}px`,
    )
  }

  protected override render() {
    return html`<div class="layers">
      <div part="content" class="layer"><slot></slot></div>
      <div part="revealed" class="layer"><slot name="revealed"></slot></div>
    </div>`
  }
}

/** Whether `target` is inside the light-DOM content assigned to the `revealed` slot. */
function isInRevealedLayer(
  target: EventTarget | null,
  host: HTMLElement,
): boolean {
  if (!(target instanceof Element) || !host.contains(target)) return false
  let node: Element | null = target
  while (node && node.parentElement !== host) node = node.parentElement
  return node?.getAttribute('slot') === 'revealed'
}

function px(value: number, fallback: number): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

defineElement('moul-mask-reveal', MoulMaskReveal)

declare global {
  interface HTMLElementTagNameMap {
    'moul-mask-reveal': MoulMaskReveal
  }
}
