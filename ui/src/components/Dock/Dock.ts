import { html, LitElement, type PropertyValues } from 'lit'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { dockStyles } from './Dock.styles'
import type { MoulDockItem } from './DockItem'
import { dockLayout } from './dock-layout'
import './DockItem'
import './DockSeparator'

/** `horizontal` lays the items in a row that grows upward; `vertical` in a column that grows toward the inline end. */
export type DockOrientation = 'horizontal' | 'vertical'

const ORIENTATIONS: readonly DockOrientation[] = ['horizontal', 'vertical']
const DEFAULT_MAGNIFICATION = 1.6
const DEFAULT_DISTANCE = 140

const SCALE_PROPERTY = '--_dock-scale'
const SHIFT_PROPERTY = '--_dock-shift'
const GROW_PROPERTY = '--_dock-grow'

/** The resting geometry of the children, measured once per hover. */
interface RestGeometry {
  children: HTMLElement[]
  centres: number[]
  sizes: number[]
  grows: boolean[]
}

const isItem = (el: Element): el is MoulDockItem =>
  el.localName === 'moul-dock-item'
const isSeparator = (el: Element): boolean =>
  el.localName === 'moul-dock-separator'

/**
 * A bar of icons that grow under the pointer, as in a desktop dock: the icon
 * under the pointer swells the most, its neighbours a little less, and the
 * row spreads out on both sides to make room, so put the dock where it can
 * grow from its middle, such as fixed and centred at the bottom of the page.
 * Fill it with `moul-dock-item` elements (links or buttons, each with an icon
 * and a `label` shown as a tooltip) and `moul-dock-separator` lines.
 * `magnification` sets how large the icon under the pointer grows and
 * `distance` how far the growth reaches; `orientation="vertical"` stands it on
 * its side. Only a mouse or pen magnifies; a tap simply follows the link. The
 * icons move by transforms alone, so the page is not laid out again while the
 * pointer moves. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the dock is a `role="toolbar"` named by
 * `label`, with `aria-orientation`. Only one item is in the tab order; the
 * arrow keys along the dock (Left and Right, or Up and Down when vertical)
 * move focus between the items and wrap at the ends, Home and End jump to
 * the first and last, and Tab leaves the dock. A focused item grows as if the
 * pointer were on it and shows its label. Disabled items are skipped.
 *
 * Reduced motion: nothing grows or moves; the labels still appear on hover
 * and focus, without sliding.
 *
 * @slot - The `moul-dock-item` and `moul-dock-separator` elements.
 *
 * @csspart bar - The row (or column) that holds the items.
 * @csspart background - The glass panel behind the items; it widens with them.
 *
 * @cssprop --dock-item-size - The resting width and height of each item. Defaults to `2.75rem`.
 * @cssprop --dock-gap - The space between items. Defaults to `0.5rem`.
 * @cssprop --dock-padding - The space between the items and the panel's edge. Defaults to `0.5rem`.
 * @cssprop --dock-radius - The panel's corner radius. Defaults to `var(--radius-2xl)`.
 * @cssprop --dock-background - The panel's fill. Defaults to `var(--color-bg-glass)`.
 */
export class MoulDock extends LitElement {
  static override styles = dockStyles

  static override properties = {
    label: { type: String, reflect: true },
    orientation: { type: String, reflect: true },
    magnification: { type: Number },
    distance: { type: Number },
  }

  /** The toolbar's accessible name. */
  declare label: string
  /** Defaults to `horizontal`; an unknown value falls back to it. */
  declare orientation: DockOrientation
  /** The scale of the item right under the pointer. Defaults to 1.6; 1 turns magnification off. */
  declare magnification: number
  /** How far from the pointer, in pixels, items still grow. Defaults to 140. */
  declare distance: number

  private isPointerOver = false
  private pointerAlong = 0
  /** The child the keyboard focus is on, when that focus is visible. */
  private focusedChild: HTMLElement | null = null
  private geometry: RestGeometry | null = null
  /** Values written on the last frame, so unchanged ones are not written again. */
  private written = new Map<HTMLElement, string>()
  private tabStop: MoulDockItem | null = null
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null
  private resizeObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.label = ''
    this.orientation = 'horizontal'
    this.magnification = DEFAULT_MAGNIFICATION
    this.distance = DEFAULT_DISTANCE
    // Registers itself with the host; it reads the bar's box once per frame.
    new PointerController(this, {
      target: () => this.barEl,
      pointerTypes: ['mouse', 'pen'],
      prefix: '--_dock-pointer',
      onFrame: this.handlePointerFrame,
    })
  }

  private get barEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('[part="bar"]') ?? null
  }

  private get isVertical(): boolean {
    return this.orientation === 'vertical'
  }

  /** Every element child the dock lays out, in DOM order. */
  private get dockChildren(): HTMLElement[] {
    return [...this.children].filter(
      (child): child is HTMLElement => isItem(child) || isSeparator(child),
    )
  }

  private get items(): MoulDockItem[] {
    return [...this.children].filter(isItem)
  }

  private get enabledItems(): MoulDockItem[] {
    return this.items.filter((item) => !item.isDisabled)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'toolbar')
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      this.layOut()
    })
    this.addEventListener('pointerenter', this.handlePointerEnter)
    this.addEventListener('pointerleave', this.handlePointerLeave)
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('focusin', this.handleFocusIn)
    this.addEventListener('focusout', this.handleFocusOut)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.removeEventListener('pointerenter', this.handlePointerEnter)
    this.removeEventListener('pointerleave', this.handlePointerLeave)
    this.removeEventListener('keydown', this.handleKeyDown)
    this.removeEventListener('focusin', this.handleFocusIn)
    this.removeEventListener('focusout', this.handleFocusOut)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.isPointerOver = false
    this.focusedChild = null
    for (const child of this.written.keys()) {
      child.style.removeProperty(SCALE_PROPERTY)
      child.style.removeProperty(SHIFT_PROPERTY)
    }
    this.written.clear()
    this.geometry = null
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('orientation') &&
      !ORIENTATIONS.includes(this.orientation)
    ) {
      this.orientation = 'horizontal'
    }
  }

  protected override firstUpdated(): void {
    const bar = this.barEl
    if (bar && typeof ResizeObserver === 'function') {
      this.resizeObserver = new ResizeObserver(() => {
        this.geometry = null
      })
      this.resizeObserver.observe(bar)
    }
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('label')) {
      if (this.label) this.setAttribute('aria-label', this.label)
      warnMissingLabel(this, 'dock label', Boolean(this.label))
    }
    if (changed.has('orientation')) {
      this.setAttribute('aria-orientation', this.orientation)
      this.syncChildren()
    }
    if (
      changed.has('orientation') ||
      changed.has('magnification') ||
      changed.has('distance')
    ) {
      this.geometry = null
      this.layOut()
    }
  }

  /** Tells the children which way the dock runs, and keeps one item in the tab order. */
  private syncChildren(): void {
    for (const child of this.dockChildren) {
      if (isSeparator(child)) {
        // A separator runs across the dock.
        child.setAttribute(
          'aria-orientation',
          this.isVertical ? 'horizontal' : 'vertical',
        )
      } else {
        child.setAttribute('data-orientation', this.orientation)
      }
    }
    const enabled = this.enabledItems
    if (!this.tabStop || !enabled.includes(this.tabStop)) {
      this.tabStop = enabled[0] ?? null
    }
    for (const item of this.items) item.isTabStop = item === this.tabStop
  }

  private readonly handleSlotChange = (): void => {
    this.geometry = null
    this.syncChildren()
    this.layOut()
  }

  private readonly handlePointerEnter = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    this.isPointerOver = true
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    this.isPointerOver = false
    this.layOut()
  }

  private readonly handlePointerFrame = (state: PointerState): void => {
    this.pointerAlong = this.isVertical ? state.y : state.x
    this.layOut()
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const item = this.itemFrom(event)
    if (!item) return
    this.tabStop = item
    for (const each of this.items) each.isTabStop = each === item
    this.focusedChild = isFocusVisible(item) ? item : null
    this.layOut()
  }

  private readonly handleFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null
    if (next && this.contains(next)) return
    this.focusedChild = null
    this.layOut()
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const enabled = this.enabledItems
    if (enabled.length === 0) return
    const current = this.itemFrom(event)
    const index = current ? enabled.indexOf(current) : -1
    const isRtl = !this.isVertical && getDirection(this) === 'rtl'
    const forward = this.isVertical
      ? 'ArrowDown'
      : isRtl
        ? 'ArrowLeft'
        : 'ArrowRight'
    const backward = this.isVertical
      ? 'ArrowUp'
      : isRtl
        ? 'ArrowRight'
        : 'ArrowLeft'

    let next: number
    switch (event.key) {
      case forward:
        next = (index + 1) % enabled.length
        break
      case backward:
        next = (index - 1 + enabled.length) % enabled.length
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = enabled.length - 1
        break
      default:
        return
    }
    event.preventDefault()
    enabled[next].focus()
  }

  /** The dock item an event came from, if any. */
  private itemFrom(event: Event): MoulDockItem | null {
    for (const node of event.composedPath()) {
      if (node === this) break
      if (
        node instanceof Element &&
        isItem(node) &&
        node.parentElement === this
      ) {
        return node
      }
    }
    return null
  }

  /**
   * Measures where each child rests along the dock, from layout sizes that
   * ignore the transforms, so it can be read mid-animation. It runs once per
   * hover, or after the children or the dock's size change.
   */
  private measure(): RestGeometry | null {
    const bar = this.barEl
    if (!bar || typeof getComputedStyle !== 'function') return null
    const style = getComputedStyle(bar)
    const vertical = this.isVertical
    const isRtl = !vertical && style.direction === 'rtl'
    const px = (value: string) => Number.parseFloat(value) || 0
    const startPad = vertical
      ? px(style.borderTopWidth) + px(style.paddingTop)
      : isRtl
        ? px(style.borderRightWidth) + px(style.paddingRight)
        : px(style.borderLeftWidth) + px(style.paddingLeft)
    const gap = px(vertical ? style.rowGap : style.columnGap)
    const barSize = vertical ? bar.offsetHeight : bar.offsetWidth

    const children = this.dockChildren
    const centres: number[] = []
    const sizes: number[] = []
    let along = startPad
    children.forEach((child, index) => {
      const childStyle = getComputedStyle(child)
      const marginStart = px(
        vertical
          ? childStyle.marginTop
          : isRtl
            ? childStyle.marginRight
            : childStyle.marginLeft,
      )
      const marginEnd = px(
        vertical
          ? childStyle.marginBottom
          : isRtl
            ? childStyle.marginLeft
            : childStyle.marginRight,
      )
      const size = vertical ? child.offsetHeight : child.offsetWidth
      along += marginStart
      const centre = along + size / 2
      centres.push(isRtl ? barSize - centre : centre)
      sizes.push(size)
      along += size + marginEnd + (index < children.length - 1 ? gap : 0)
    })
    return {
      children,
      centres,
      sizes,
      grows: children.map(
        (child) => isItem(child) && !(child as MoulDockItem).isDisabled,
      ),
    }
  }

  /** Scales and moves every child for the pointer or the focused item, or lets them rest. */
  private layOut(): void {
    const focusChild = this.focusedChild
    const isActive =
      !this.isReduced &&
      this.magnification > 1 &&
      (this.isPointerOver || focusChild !== null)
    if (!isActive) {
      this.rest()
      return
    }
    if (!this.geometry) this.geometry = this.measure()
    const geometry = this.geometry
    if (!geometry) return

    let focus: number | null = null
    if (this.isPointerOver) focus = this.pointerAlong
    else if (focusChild) {
      const index = geometry.children.indexOf(focusChild)
      focus = index >= 0 ? geometry.centres[index] : null
    }
    const layout = dockLayout({
      centres: geometry.centres,
      sizes: geometry.sizes,
      grows: geometry.grows,
      focus,
      magnification: this.magnification,
      distance:
        Number.isFinite(this.distance) && this.distance > 0
          ? this.distance
          : DEFAULT_DISTANCE,
    })
    geometry.children.forEach((child, index) => {
      this.write(child, layout.scales[index], layout.shifts[index])
    })
    this.barEl?.style.setProperty(GROW_PROPERTY, `${layout.grow}px`)
  }

  private rest(): void {
    for (const child of this.written.keys()) this.write(child, 1, 0)
    this.barEl?.style.setProperty(GROW_PROPERTY, '0px')
  }

  private write(child: HTMLElement, scale: number, shift: number): void {
    const key = `${scale}|${shift}`
    if (this.written.get(child) === key) return
    this.written.set(child, key)
    child.style.setProperty(SCALE_PROPERTY, String(scale))
    child.style.setProperty(SHIFT_PROPERTY, `${shift}px`)
  }

  protected override render() {
    return html`<div part="bar" class="bar">
      <span part="background" class="background" aria-hidden="true"></span>
      <slot @slotchange=${this.handleSlotChange}></slot>
    </div>`
  }
}

function isFocusVisible(item: MoulDockItem): boolean {
  const control = item.control
  if (!control) return false
  try {
    return control.matches(':focus-visible')
  } catch {
    return true
  }
}

function getDirection(el: HTMLElement): string {
  if (typeof getComputedStyle !== 'function') return 'ltr'
  return getComputedStyle(el).direction || 'ltr'
}

defineElement('moul-dock', MoulDock)

declare global {
  interface HTMLElementTagNameMap {
    'moul-dock': MoulDock
  }
}
