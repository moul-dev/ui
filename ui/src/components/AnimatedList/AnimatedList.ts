import { html, LitElement, type PropertyValues } from 'lit'
import { type AnimationPlaybackControls, animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
} from '../../utils/motion'
import { animatedListStyles } from './AnimatedList.styles'

/** Inline styles an arrival, departure or glide writes; cleared when it settles. */
const MOTION_STYLES = [
  'opacity',
  'transform',
  'transform-origin',
  'clip-path',
  'margin-bottom',
] as const

/** Room left outside the clip, so an item's shadow is not cut off while it moves. */
const SHADOW_ROOM = 48

/** The room an item takes in the list, measured at rest. */
interface Footprint {
  /** Border-box height. */
  height: number
  /** Everything it takes up: height, margins and the gap beside it. */
  space: number
  /** Its own bottom margin at rest. */
  margin: number
}

const round = (value: number) => Math.round(value * 100) / 100

/**
 * A list whose items arrive one at a time: each newcomer grows into place,
 * fading and scaling up, and pushes the items already there along. Use it
 * for feeds, notifications and activity that streams in. The items are its
 * slotted children, in any markup; put the newest first to have new items
 * land at the top.
 *
 * Add an item by inserting it as a child; it animates in. Remove one with
 * `removeItem(el)` to let it shrink away while the others close ranks; an
 * item removed from the DOM directly vanishes at once and the others glide
 * into the gap. With `delay`, the items already there when the list first
 * connects arrive one by one, `delay` milliseconds apart, last item first, so
 * a newest-first feed fills in from the bottom like it is catching up.
 *
 * Keyboard and screen readers: the list takes no focus and handles no keys;
 * its items keep their own. It has no role of its own. With `is-live` it
 * becomes `role="log"`, a polite live region, so screen readers announce
 * each item that arrives without moving focus.
 *
 * Reduced motion: items appear and disappear at once and the others jump to
 * their new places; a `delay` reveal shows every item at once.
 *
 * @slot - The items. Forwarded slots are followed, so another element can pass its own children through.
 * @csspart base - The column that lays the items out.
 * @cssprop --animated-list-gap - Space between items. Defaults to `var(--spacing-3)`.
 */
export class MoulAnimatedList extends LitElement {
  static override styles = animatedListStyles

  static override properties = {
    delay: { type: Number, reflect: true },
    isLive: { type: Boolean, reflect: true, attribute: 'is-live' },
  }

  /** Milliseconds between the items revealed when the list first connects; 0 shows them all at once. */
  declare delay: number
  /** Announce arriving items to screen readers (`role="log"`). */
  declare isLive: boolean

  /** Every item seen in the slot, including ones still waiting to be revealed. */
  private readonly known = new Set<HTMLElement>()
  /** Initial items not revealed yet, in markup order; the last one goes next. */
  private waiting: HTMLElement[] = []
  /** Inline `display` each waiting item had before it was hidden. */
  private readonly hiddenDisplay = new Map<HTMLElement, [string, string]>()
  private readonly leaving = new Set<HTMLElement>()
  /** Resolves a pending `removeItem()` when its departure ends early. */
  private readonly departures = new Map<HTMLElement, () => void>()
  /** Arrivals and departures in flight. */
  private readonly motions = new Map<HTMLElement, AnimationPlaybackControls>()
  /** Close-ranks glides in flight. */
  private readonly glides = new Map<HTMLElement, AnimationPlaybackControls>()
  /** Where each item was last seen, as an offset from the top of the list. */
  private readonly positions = new Map<HTMLElement, number>()
  private hasSynced = false
  private revealTimer: ReturnType<typeof setTimeout> | null = null
  private frame = 0
  private resizeObserver: ResizeObserver | null = null
  private ownsRole = false

  constructor() {
    super()
    this.delay = 0
    this.isLive = false
  }

  /** The items in the list, in order, without the ones on their way out. */
  public get items(): HTMLElement[] {
    return this.slotted().filter(
      (el) => !this.leaving.has(el) && !this.waiting.includes(el),
    )
  }

  private get base(): HTMLElement | null {
    return this.shadowRoot?.querySelector<HTMLElement>('[part="base"]') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    // A slot forwarded into this one reports its changes from among the children.
    this.addEventListener('slotchange', this.sync)
    if (this.hasUpdated) this.observeSize()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('slotchange', this.sync)
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    cancelAnimationFrame(this.frame)
    this.frame = 0
    // A list that leaves the page shows everything it holds.
    this.flushWaiting()
    for (const el of [...this.motions.keys(), ...this.glides.keys()]) {
      this.settle(el)
    }
  }

  protected override firstUpdated(): void {
    this.observeSize()
    this.sync()
  }

  protected override updated(changed: PropertyValues<this>): void {
    super.updated(changed)
    if (changed.has('isLive')) {
      if (this.isLive && !this.hasAttribute('role')) {
        this.setAttribute('role', 'log')
        this.ownsRole = true
      } else if (!this.isLive && this.ownsRole) {
        this.removeAttribute('role')
        this.ownsRole = false
      }
    }
  }

  /**
   * Shrinks `item` away while the items after it close ranks, then removes it
   * from the DOM. Resolves once it is gone. An element that is not in the
   * list is removed at once.
   */
  public async removeItem(item: HTMLElement): Promise<void> {
    if (this.leaving.has(item)) return
    const isShown = this.known.has(item) && !this.waiting.includes(item)
    if (!isShown || prefersReducedMotion() || !item.offsetHeight) {
      this.settle(item)
      item.remove()
      return
    }
    this.leaving.add(item)
    this.settle(item)
    const footprint = this.footprint(item)
    item.style.transformOrigin = 'top center'
    this.pose(item, 1, footprint)
    const exit = animate(1, 0, {
      duration: 0.22,
      ease: EASE_OUT,
      onUpdate: (progress: number) => this.pose(item, progress, footprint),
    })
    this.motions.set(item, exit)
    this.track()
    await new Promise<void>((resolve) => {
      this.departures.set(item, resolve)
      exit.finished.then(resolve, resolve)
    })
    this.departures.delete(item)
    if (this.motions.get(item) === exit) this.motions.delete(item)
    item.remove()
    // A list outside the page gets no slotchange; forget the item here too.
    if (!this.isConnected) this.forget(item)
  }

  /** Items assigned to the slot, following forwarded slots, including those leaving or waiting. */
  private slotted(): HTMLElement[] {
    const slot = this.shadowRoot?.querySelector('slot')
    return (slot?.assignedElements({ flatten: true }) ?? []).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    )
  }

  private readonly sync = (): void => {
    if (!this.hasUpdated) return
    const items = this.slotted()
    const isReduced = prefersReducedMotion()

    if (!this.hasSynced) {
      this.hasSynced = true
      for (const el of items) this.known.add(el)
      if (this.delay > 0 && !isReduced && items.length > 0) {
        this.waiting = [...items]
        for (const el of items) this.hide(el)
        this.revealNext()
      }
      this.measure()
      return
    }

    const present = new Set(items)
    const removed = [...this.known].filter((el) => !present.has(el))
    for (const el of removed) this.forget(el)
    const added = items.filter((el) => !this.known.has(el))
    if (added.length === 0 && removed.length === 0) return
    for (const el of added) this.known.add(el)
    if (isReduced) {
      this.measure()
      return
    }
    this.arrive(added)
  }

  /**
   * Starts `added` growing in and glides every other item from where it was
   * last seen to its new place, so a removal or an insertion anywhere in the
   * list reads as one movement.
   */
  private arrive(added: HTMLElement[]): void {
    const base = this.base
    if (!base) return
    const before = new Map(this.positions)
    // Newcomers start collapsed, so the others are measured beside them as they are now.
    const entering = added.flatMap((el) => this.collapse(el) ?? [])
    const top = base.getBoundingClientRect().top
    for (const el of this.items) {
      if (added.includes(el) || this.motions.has(el)) continue
      const was = before.get(el)
      if (was === undefined) continue
      const glide = this.glides.get(el)
      if (glide) {
        this.glides.delete(el)
        glide.stop()
        el.style.removeProperty('transform')
      }
      const dy = was - (el.getBoundingClientRect().top - top)
      if (Math.abs(dy) < 0.5) continue
      // Hold the old spot from this frame on, before the spring takes over.
      el.style.transform = `translateY(${dy}px)`
      const next = animate(
        el,
        { transform: [`translateY(${dy}px)`, 'translateY(0px)'] },
        SPRING_GENTLE,
      )
      this.glides.set(el, next)
      next.finished.then(() => {
        if (this.glides.get(el) !== next) return
        this.glides.delete(el)
        el.style.removeProperty('transform')
      })
    }
    for (const [el, footprint] of entering) this.grow(el, footprint)
    this.measure()
    this.track()
  }

  /** Collapses a newcomer to its starting pose; returns it with its footprint, or null when it has no box to grow. */
  private collapse(el: HTMLElement): [[HTMLElement, Footprint]] | null {
    if (!el.offsetHeight) return null
    const footprint = this.footprint(el)
    el.style.transformOrigin = 'top center'
    this.pose(el, 0, footprint)
    return [[el, footprint]]
  }

  private grow(el: HTMLElement, footprint: Footprint): void {
    const enter = animate(0, 1, {
      type: 'spring',
      stiffness: SPRING_GENTLE.stiffness,
      damping: SPRING_GENTLE.damping,
      mass: SPRING_GENTLE.mass,
      onUpdate: (progress: number) => this.pose(el, progress, footprint),
    })
    this.motions.set(el, enter)
    enter.finished.then(() => {
      if (this.motions.get(el) === enter) this.settle(el)
    })
  }

  private footprint(el: HTMLElement): Footprint {
    const height = el.offsetHeight
    const style = getComputedStyle(el)
    const margin = Number.parseFloat(style.marginBottom) || 0
    const marginTop = Number.parseFloat(style.marginTop) || 0
    return {
      height,
      margin,
      space: height + marginTop + margin + this.gapAround(el),
    }
  }

  /**
   * Poses an item `progress` of the way into the list: at 0 it takes no room
   * and cannot be seen, at 1 it rests. A negative bottom margin gives back the
   * room it does not take yet, so the items after it move with it (a padded
   * item cannot shrink to nothing by its height), and a clip hides the part
   * of it that has no room yet, so it never paints over its neighbours.
   */
  private pose(el: HTMLElement, progress: number, footprint: Footprint): void {
    const shown = Math.min(1, Math.max(0, progress))
    const { height, space, margin } = footprint
    const hidden = (1 - shown) * (height + SHADOW_ROOM) - SHADOW_ROOM
    const style = el.style
    style.marginBottom = `${round(margin - (1 - progress) * space)}px`
    style.clipPath = `inset(${-SHADOW_ROOM}px ${-SHADOW_ROOM}px ${round(hidden)}px)`
    style.opacity = String(round(shown))
    style.transform = `scale(${round(0.95 + 0.05 * progress)})`
  }

  /** The gap between `el` and its neighbours; nothing when it is the only item shown. */
  private gapAround(el: HTMLElement): number {
    const base = this.base
    if (!base || this.items.filter((item) => item !== el).length === 0) return 0
    return Number.parseFloat(getComputedStyle(base).rowGap) || 0
  }

  private readonly revealNext = (): void => {
    this.revealTimer = null
    if (prefersReducedMotion()) {
      this.flushWaiting()
      this.measure()
      return
    }
    const el = this.waiting.pop()
    if (!el) return
    this.show(el)
    this.arrive([el])
    if (this.waiting.length > 0) {
      this.revealTimer = setTimeout(this.revealNext, Math.max(0, this.delay))
    }
  }

  private flushWaiting(): void {
    if (this.revealTimer !== null) clearTimeout(this.revealTimer)
    this.revealTimer = null
    for (const el of this.waiting) this.show(el)
    this.waiting = []
  }

  private hide(el: HTMLElement): void {
    this.hiddenDisplay.set(el, [
      el.style.getPropertyValue('display'),
      el.style.getPropertyPriority('display'),
    ])
    el.style.setProperty('display', 'none', 'important')
  }

  private show(el: HTMLElement): void {
    const saved = this.hiddenDisplay.get(el)
    if (!saved) return
    this.hiddenDisplay.delete(el)
    if (saved[0]) el.style.setProperty('display', saved[0], saved[1])
    else el.style.removeProperty('display')
  }

  /** Stops whatever is moving `el` and hands it back to its own styles. */
  private settle(el: HTMLElement): void {
    const motion = this.motions.get(el)
    this.motions.delete(el)
    motion?.stop()
    const glide = this.glides.get(el)
    this.glides.delete(el)
    glide?.stop()
    for (const prop of MOTION_STYLES) el.style.removeProperty(prop)
    this.departures.get(el)?.()
  }

  /** Drops an item that left the slot. */
  private forget(el: HTMLElement): void {
    this.settle(el)
    this.show(el)
    this.known.delete(el)
    this.leaving.delete(el)
    this.positions.delete(el)
    this.waiting = this.waiting.filter((item) => item !== el)
  }

  private measure(): void {
    const base = this.base
    if (!base) return
    const top = base.getBoundingClientRect().top
    this.positions.clear()
    for (const el of this.items) {
      this.positions.set(el, el.getBoundingClientRect().top - top)
    }
  }

  /** Keeps the positions current every frame while anything moves, so an interruption starts from what is on screen. */
  private track(): void {
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    const step = (): void => {
      this.measure()
      this.frame =
        this.motions.size > 0 || this.glides.size > 0
          ? requestAnimationFrame(step)
          : 0
    }
    this.frame = requestAnimationFrame(step)
  }

  private observeSize(): void {
    const base = this.base
    if (!base || this.resizeObserver || typeof ResizeObserver !== 'function') {
      return
    }
    // Content that changes size between arrivals moves the items under it.
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.frame) this.measure()
    })
    this.resizeObserver.observe(base)
  }

  protected override render() {
    return html`<div part="base"><slot @slotchange=${this.sync}></slot></div>`
  }
}

defineElement('moul-animated-list', MoulAnimatedList)

declare global {
  interface HTMLElementTagNameMap {
    'moul-animated-list': MoulAnimatedList
  }
}
