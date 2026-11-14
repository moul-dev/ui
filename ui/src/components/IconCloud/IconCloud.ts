import { html, LitElement, nothing, type PropertyValues } from 'lit'
import {
  CanvasColorController,
  withAlpha,
} from '../../controllers/canvas-color.controller'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { loadImage } from '../../utils/canvas-image'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { iconCloudStyles } from './IconCloud.styles'
import {
  apply,
  axisAngle,
  depthStyle,
  dragRotation,
  easeOut,
  fibonacciSphere,
  identity,
  type Matrix3,
  multiply,
  orthonormalize,
  turnToFront,
  type Vector3,
} from './icon-cloud-geometry'

/** Detail of the `press` event: the icon pressed, as its slotted element and its place in the slot. */
export interface IconCloudPressDetail {
  item: Element
  index: number
}

/** How strongly the pointer's offset from the centre turns the sphere, in radians a second at the edge. */
const LEAN = 1.1
/** Spin left over from a fling settles back to the steady turn over about this long. */
const SETTLE_MS = 700
/** How long a turn to a focused icon takes. */
const TURN_DURATION = 650
/** The fastest a fling may spin the sphere, in radians a second. */
const MAX_SPIN = 7
const TAU = Math.PI * 2

interface Turn {
  start: number
  base: Matrix3
  axis: Vector3
  angle: number
}

type ColorName = 'icon' | 'focus' | 'chip' | 'chipBorder'

/**
 * Icons or logos set on a sphere that turns slowly, for a "works with" or
 * "built with" section. Each child (an `<img>`, an inline `<svg>`, or a link
 * or button wrapping one) is spread evenly over the sphere and drawn on a
 * canvas: icons at the front are full size and opaque, icons at the back
 * smaller and faded. The sphere leans toward the pointer, spins when it is
 * dragged and carries on a little after it is let go. Pressing an icon that
 * is a link or button (or holds one) activates it, after a cancelable
 * `press` event. A monochrome SVG drawn in `currentColor` takes
 * `--icon-cloud-icon-color`; a child with neither image nor SVG is drawn as
 * a round chip with the first letters of its text. The cloud is square by
 * default and fills its container's width. It loads on demand from the
 * canvas entry: `import '@moul-dev/web-component/canvas'`.
 *
 * Keyboard and screen readers: the children stay in the page as a visually
 * hidden group (named by `label`), so a screen reader reads every image's
 * alt text and every link's name, in order. Links and buttons stay in the
 * tab order: focusing one turns the sphere to bring its icon to the front,
 * rings it in the focus colour and holds the sphere still, and Enter or
 * Space works as it always does. The canvas itself is hidden from assistive
 * technology.
 *
 * Reduced motion: the sphere does not turn on its own or lean toward the
 * pointer. Dragging still turns it, since the reader's own hand moves it,
 * but it stops when let go, and focusing an icon brings it to the front at
 * once.
 *
 * @slot - The icons: `<img>` (with alt text), inline `<svg>`, or links or buttons wrapping one.
 * @csspart base - The box that holds the canvas.
 * @csspart canvas - The canvas the icons are drawn on.
 * @csspart items - The visually hidden group that holds the slotted icons.
 *
 * @cssprop --icon-cloud-icon-color - Colour for monochrome SVGs drawn in `currentColor`, and for the letters on text chips. Defaults to `var(--color-fg)`.
 * @cssprop --icon-cloud-focus-color - The ring round the focused icon. Defaults to `var(--color-focus)`.
 *
 * @fires press - An icon was pressed (`detail: { item, index }`). Cancel it to stop a link or button inside from being activated.
 */
export class MoulIconCloud extends LitElement {
  static override styles = iconCloudStyles

  static override properties = {
    label: { type: String },
    radius: { type: Number },
    speed: { type: Number },
    iconSize: { type: Number, attribute: 'icon-size' },
    isPaused: { type: Boolean, reflect: true, attribute: 'is-paused' },
    isDragging: { state: true },
    isOverAction: { state: true },
  }

  /** Accessible name of the group of icons, e.g. "Integrations". */
  declare label: string
  /** Radius of the sphere, in CSS pixels. Defaults to filling the box. */
  declare radius: number | undefined
  /** How fast the sphere turns on its own, in degrees a second. Defaults to 14. */
  declare speed: number
  /** Width of an icon at the front, in CSS pixels. Defaults to 40. */
  declare iconSize: number
  /** Stop turning on its own and leaning toward the pointer. Dragging still turns it. */
  declare isPaused: boolean
  private declare isDragging: boolean
  private declare isOverAction: boolean

  private items: Element[] = []
  private points: Vector3[] = []
  private sprites: Array<HTMLCanvasElement | null> = []
  /** Turned positions this frame, x, y, z per icon. */
  private turned = new Float32Array(0)
  /** Icon indexes from back to front. */
  private order: number[] = []
  private readonly rotation: Matrix3 = identity()
  private readonly step: Matrix3 = identity()
  private readonly scratch: Vector3 = [0, 0, 0]
  private spinX = 0
  private spinY = 0
  private turn: Turn | null = null
  private focusIndex = -1
  private sphereRadius = 0
  private centerX = 0
  private centerY = 0
  private pixelRatio = 1
  private clock = 0
  private frames = 0
  private spriteVersion = 0
  private needsDraw = true
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null

  private pointerX = 0
  private pointerY = 0
  private isHovering = false
  private dragId: number | null = null
  private dragX = 0
  private dragY = 0
  private dragTime = 0
  private hasMoved = false

  private readonly palette = new CanvasColorController<ColorName>(this, {
    probe: () => this.renderRoot.querySelector<HTMLElement>('.color-probe'),
    colors: () => ({
      icon: 'var(--icon-cloud-icon-color, var(--color-fg))',
      focus: 'var(--icon-cloud-focus-color, var(--color-focus))',
      chip: 'var(--color-surface)',
      chipBorder: 'var(--color-border)',
    }),
    // Monochrome SVGs and text chips are drawn in these colours: draw them again.
    onChange: () => void this.buildSprites(),
  })

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot.querySelector('canvas'),
    draw: (frame) => this.paint(frame),
    resize: ({ width, height, pixelRatio }) => {
      this.centerX = width / 2
      this.centerY = height / 2
      const ratioChanged = pixelRatio !== this.pixelRatio
      this.pixelRatio = pixelRatio
      this.measureSphere(width, height)
      if (ratioChanged) void this.buildSprites()
      this.needsDraw = true
    },
  })

  constructor() {
    super()
    this.label = ''
    this.radius = undefined
    this.speed = 14
    this.iconSize = 40
    this.isPaused = false
    this.isDragging = false
    this.isOverAction = false
    // Start tipped a little, so the turn reads as a sphere rather than a carousel.
    axisAngle(1, 0, 0, -0.35, this.rotation)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.spinX = 0
      this.spinY = 0
      this.redraw()
    })
    this.addEventListener('pointerdown', this.handlePointerDown)
    this.addEventListener('pointermove', this.handlePointerMove)
    this.addEventListener('pointerup', this.handlePointerUp)
    this.addEventListener('pointercancel', this.handlePointerUp)
    this.addEventListener('lostpointercapture', this.handlePointerUp)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeEventListener('pointerdown', this.handlePointerDown)
    this.removeEventListener('pointermove', this.handlePointerMove)
    this.removeEventListener('pointerup', this.handlePointerUp)
    this.removeEventListener('pointercancel', this.handlePointerUp)
    this.removeEventListener('lostpointercapture', this.handlePointerUp)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.dragId = null
    this.isDragging = false
    this.isHovering = false
  }

  /** The slotted icons, in the order they are placed on the sphere. */
  public get icons(): Element[] {
    return [...this.items]
  }

  /** Index of the icon whose link or button has focus, or -1. */
  public get focusedIndex(): number {
    return this.focusIndex
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('iconSize')) void this.buildSprites()
    if (changed.has('radius') || changed.has('iconSize')) {
      const canvas = this.renderRoot.querySelector('canvas')
      const box = canvas?.getBoundingClientRect()
      if (box) this.measureSphere(box.width, box.height)
    }
    if (
      changed.has('isPaused') ||
      changed.has('speed') ||
      changed.has('radius')
    ) {
      this.redraw()
    }
  }

  private measureSphere(width: number, height: number): void {
    const size = this.validIconSize
    const auto = Math.min(width, height) / 2 - size / 2 - 6
    const wanted = Number(this.radius)
    this.sphereRadius = Math.max(
      0,
      Number.isFinite(wanted) && wanted > 0 ? wanted : auto,
    )
  }

  private get validIconSize(): number {
    const size = Number(this.iconSize)
    return Number.isFinite(size) && size > 0 ? Math.min(size, 256) : 40
  }

  private readonly handleSlotChange = (event: Event): void => {
    const slot = event.target as HTMLSlotElement
    this.items = slot.assignedElements({ flatten: true })
    this.points = fibonacciSphere(this.items.length)
    this.turned = new Float32Array(this.items.length * 3)
    this.order = this.items.map((_, index) => index)
    this.focusIndex = -1
    void this.buildSprites()
  }

  /**
   * Draws every icon once into a square canvas of its own, at the screen's
   * density, so each frame only copies finished pictures. Sprites that load
   * after a newer build has started are dropped.
   */
  private async buildSprites(): Promise<void> {
    const version = ++this.spriteVersion
    const items = this.items
    const pixels = Math.max(
      1,
      Math.round(this.validIconSize * Math.max(1, this.pixelRatio)),
    )
    this.sprites = items.map(() => null)
    this.redraw()
    await Promise.all(
      items.map(async (item, index) => {
        const sprite = await this.drawSprite(item, pixels).catch(() => null)
        if (version !== this.spriteVersion) return
        this.sprites[index] = sprite
        this.redraw()
      }),
    )
  }

  private async drawSprite(
    item: Element,
    pixels: number,
  ): Promise<HTMLCanvasElement | null> {
    if (typeof document === 'undefined') return null
    const canvas = document.createElement('canvas')
    canvas.width = pixels
    canvas.height = pixels
    const context = canvas.getContext('2d')
    if (!context) return null

    const image =
      item instanceof HTMLImageElement ? item : item.querySelector('img')
    const vector =
      item instanceof SVGSVGElement ? item : item.querySelector('svg')
    let source: HTMLImageElement | null = null
    if (image) {
      source =
        image.complete && image.naturalWidth > 0
          ? image
          : await loadImage(
              image.currentSrc || image.src,
              image.getAttribute('crossorigin'),
            )
    } else if (vector) {
      source = await loadImage(this.svgDataUrl(vector, pixels))
    }

    if (source) {
      const width = source.naturalWidth || pixels
      const height = source.naturalHeight || pixels
      const fit = Math.min(pixels / width, pixels / height)
      const w = width * fit
      const h = height * fit
      context.drawImage(source, (pixels - w) / 2, (pixels - h) / 2, w, h)
      return canvas
    }

    // Neither image nor SVG: a round chip with the first letters of its text.
    const text = (item.textContent ?? '').trim().slice(0, 2)
    const middle = pixels / 2
    const ring = Math.max(1, pixels / 40)
    context.beginPath()
    context.arc(middle, middle, middle - ring, 0, TAU)
    context.fillStyle = this.palette.get('chip')
    context.fill()
    context.lineWidth = ring
    context.strokeStyle = this.palette.get('chipBorder')
    context.stroke()
    if (text) {
      const family = getComputedStyle(this).fontFamily || 'sans-serif'
      context.font = `600 ${Math.round(pixels * 0.38)}px ${family}`
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillStyle = this.palette.get('icon')
      context.fillText(text, middle, middle + pixels * 0.02)
    }
    return canvas
  }

  /** An inline SVG as a data URL, sized for its sprite, with `currentColor` resolved to the icon colour. */
  private svgDataUrl(vector: SVGSVGElement, pixels: number): string {
    const copy = vector.cloneNode(true) as SVGSVGElement
    copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    copy.setAttribute('width', String(pixels))
    copy.setAttribute('height', String(pixels))
    // An SVG drawn as an image cannot see the page's CSS, so give it the colour outright.
    copy.style.color = withAlpha(this.palette.get('icon'), 1)
    const markup = new XMLSerializer().serializeToString(copy)
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  }

  private redraw(): void {
    this.needsDraw = true
    if (!this.loop.isRunning) this.loop.drawOnce()
  }

  /** The spin the sphere settles toward: its steady turn plus a lean toward the pointer. */
  private targetSpin(): [number, number] {
    if (this.isReduced || this.isPaused || this.focusIndex >= 0) return [0, 0]
    let x = 0
    let y = (this.speed * Math.PI) / 180
    if (this.isHovering && this.sphereRadius > 0) {
      const dx = (this.pointerX - this.centerX) / this.sphereRadius
      const dy = (this.pointerY - this.centerY) / this.sphereRadius
      x += Math.max(-1, Math.min(1, dy)) * LEAN
      y += Math.max(-1, Math.min(1, dx)) * LEAN
    }
    return [x, y]
  }

  private get isMoving(): boolean {
    if (this.turn || this.isDragging) return true
    const [x, y] = this.targetSpin()
    return (
      Math.abs(this.spinX) + Math.abs(this.spinY) > 1e-3 ||
      Math.abs(x) + Math.abs(y) > 1e-3
    )
  }

  private advance(delta: number): void {
    this.clock += delta
    const turn = this.turn
    if (turn) {
      const progress = (this.clock - turn.start) / TURN_DURATION
      axisAngle(...turn.axis, turn.angle * easeOut(progress), this.step)
      multiply(this.step, turn.base, this.rotation)
      if (progress >= 1) this.turn = null
      return
    }
    if (this.isDragging || this.isReduced) return
    const [targetX, targetY] = this.targetSpin()
    const ease = 1 - Math.exp(-delta / SETTLE_MS)
    this.spinX += (targetX - this.spinX) * ease
    this.spinY += (targetY - this.spinY) * ease
    const speed = Math.hypot(this.spinX, this.spinY)
    if (speed < 1e-4) return
    axisAngle(this.spinX, this.spinY, 0, (speed * delta) / 1000, this.step)
    multiply(this.step, this.rotation, this.rotation)
    if (++this.frames % 240 === 0) orthonormalize(this.rotation)
  }

  private paint(frame: CanvasFrame): void {
    const { context, width, height, delta } = frame
    if (!context) return
    if (!this.needsDraw && !this.isMoving) return
    this.needsDraw = false
    this.advance(delta)
    context.clearRect(0, 0, width, height)
    if (this.items.length === 0 || this.sphereRadius <= 0) return

    const { turned, order, points, rotation } = this
    const scratch = this.scratch
    for (let i = 0; i < points.length; i++) {
      apply(rotation, points[i], scratch)
      turned[i * 3] = scratch[0]
      turned[i * 3 + 1] = scratch[1]
      turned[i * 3 + 2] = scratch[2]
    }
    // Back to front. The order barely changes between frames, so an insertion sort is nearly free.
    for (let i = 1; i < order.length; i++) {
      const index = order[i]
      const z = turned[index * 3 + 2]
      let j = i - 1
      while (j >= 0 && turned[order[j] * 3 + 2] > z) {
        order[j + 1] = order[j]
        j--
      }
      order[j + 1] = index
    }

    const size = this.validIconSize
    const r = this.sphereRadius
    for (const index of order) {
      const sprite = this.sprites[index]
      const z = turned[index * 3 + 2]
      const { scale, alpha } = depthStyle(z)
      const s = size * scale
      const x = this.centerX + r * turned[index * 3]
      const y = this.centerY - r * turned[index * 3 + 1]
      if (sprite) {
        context.globalAlpha = alpha
        context.drawImage(sprite, x - s / 2, y - s / 2, s, s)
      }
      if (index === this.focusIndex) {
        context.globalAlpha = 1
        context.beginPath()
        context.arc(x, y, s / 2 + 5, 0, TAU)
        context.lineWidth = 2
        context.strokeStyle = this.palette.get('focus')
        context.stroke()
      }
    }
    context.globalAlpha = 1
  }

  /** The front-most icon under a point in the canvas, or -1. */
  private iconAt(x: number, y: number): number {
    const size = this.validIconSize
    for (let k = this.order.length - 1; k >= 0; k--) {
      const index = this.order[k]
      const z = this.turned[index * 3 + 2]
      const half = (size * depthStyle(z).scale) / 2
      const ix = this.centerX + this.sphereRadius * this.turned[index * 3]
      const iy = this.centerY - this.sphereRadius * this.turned[index * 3 + 1]
      if (Math.hypot(x - ix, y - iy) <= half) return index
    }
    return -1
  }

  /** The link or button an icon is, or holds. */
  private actionOf(item: Element | undefined): HTMLElement | null {
    if (!item) return null
    const selector = 'a[href], button, [role="button"], [role="link"]'
    if (item.matches(selector)) return item as HTMLElement
    return item.querySelector<HTMLElement>(selector)
  }

  /** Turns the sphere so icon `index` faces the viewer: eased, or at once under reduced motion or off screen. */
  private bringToFront(index: number): void {
    const point = this.points[index]
    if (!point) return
    const { axis, angle } = turnToFront(apply(this.rotation, point))
    this.spinX = 0
    this.spinY = 0
    if (this.isReduced || !this.loop.isRunning) {
      this.turn = null
      axisAngle(...axis, angle, this.step)
      multiply(this.step, this.rotation, this.rotation)
      this.redraw()
      return
    }
    this.turn = {
      start: this.clock,
      base: new Float64Array(this.rotation),
      axis,
      angle,
    }
    this.redraw()
  }

  private localPoint(event: PointerEvent): { x: number; y: number } {
    const box = this.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    this.dragId = event.pointerId
    this.dragX = event.clientX
    this.dragY = event.clientY
    this.dragTime = event.timeStamp
    this.hasMoved = false
    try {
      this.setPointerCapture(event.pointerId)
    } catch {
      // A synthetic or already-released pointer cannot be captured.
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const { x, y } = this.localPoint(event)
    this.pointerX = x
    this.pointerY = y
    if (event.pointerId !== this.dragId) {
      // A mouse or pen hovering: lean toward it, and show which icons can be pressed.
      if (event.pointerType !== 'touch') {
        this.isHovering = true
        this.isOverAction =
          this.actionOf(this.items[this.iconAt(x, y)]) !== null
      }
      return
    }
    const dx = event.clientX - this.dragX
    const dy = event.clientY - this.dragY
    if (!this.hasMoved && Math.hypot(dx, dy) < 4) return
    if (!this.hasMoved) {
      this.hasMoved = true
      this.isDragging = true
      this.turn = null
    }
    dragRotation(dx, dy, this.sphereRadius, this.step)
    multiply(this.step, this.rotation, this.rotation)
    const elapsed = event.timeStamp - this.dragTime
    if (elapsed > 0 && this.sphereRadius > 0) {
      const smoothing = 0.4
      const spinX = (dy / this.sphereRadius / elapsed) * 1000
      const spinY = (dx / this.sphereRadius / elapsed) * 1000
      this.spinX += (spinX - this.spinX) * smoothing
      this.spinY += (spinY - this.spinY) * smoothing
    }
    this.dragX = event.clientX
    this.dragY = event.clientY
    this.dragTime = event.timeStamp
    this.redraw()
  }

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.dragId) return
    this.dragId = null
    if (this.hasPointerCapture?.(event.pointerId)) {
      this.releasePointerCapture(event.pointerId)
    }
    if (!this.hasMoved) {
      if (event.type === 'pointerup') this.pressAt(this.localPoint(event))
      return
    }
    this.isDragging = false
    const idle = event.timeStamp - this.dragTime > 80
    if (this.isReduced || idle || event.type !== 'pointerup') {
      this.spinX = 0
      this.spinY = 0
    }
    const speed = Math.hypot(this.spinX, this.spinY)
    if (speed > MAX_SPIN) {
      this.spinX *= MAX_SPIN / speed
      this.spinY *= MAX_SPIN / speed
    }
    this.redraw()
  }

  private readonly handlePointerLeave = (): void => {
    this.isHovering = false
    this.isOverAction = false
  }

  private pressAt(point: { x: number; y: number }): void {
    const index = this.iconAt(point.x, point.y)
    const item = this.items[index]
    if (!item) return
    const event = new CustomEvent<IconCloudPressDetail>('press', {
      detail: { item, index },
      bubbles: true,
      composed: true,
      cancelable: true,
    })
    if (!this.dispatchEvent(event)) return
    this.actionOf(item)?.click()
  }

  private indexOf(target: EventTarget | null): number {
    if (!(target instanceof Node)) return -1
    return this.items.findIndex(
      (item) => item === target || item.contains(target),
    )
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const index = this.indexOf(event.target)
    if (index < 0) return
    this.focusIndex = index
    this.bringToFront(index)
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    if (this.indexOf(event.relatedTarget) >= 0) return
    this.focusIndex = -1
    this.redraw()
  }

  protected override render() {
    const classes = [
      'base',
      this.isDragging ? 'is-dragging' : '',
      this.isOverAction && !this.isDragging ? 'is-over-action' : '',
    ]
      .filter(Boolean)
      .join(' ')
    return html`<div part="base" class=${classes}>
        <canvas part="canvas" aria-hidden="true"></canvas>
      </div>
      <div
        part="items"
        class="items"
        role=${this.label ? 'group' : nothing}
        aria-label=${this.label || nothing}
      >
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <span class="color-probe"></span>`
  }
}

defineElement('moul-icon-cloud', MoulIconCloud)

declare global {
  interface HTMLElementTagNameMap {
    'moul-icon-cloud': MoulIconCloud
  }
}
