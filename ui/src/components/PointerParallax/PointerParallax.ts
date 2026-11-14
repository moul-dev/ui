import { html, LitElement, type PropertyValues } from 'lit'
import { styleMap } from 'lit/directives/style-map.js'
import { InViewController } from '../../controllers/in-view.controller'
import {
  PointerController,
  type PointerState,
} from '../../controllers/pointer.controller'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion, watchReducedMotion } from '../../utils/motion'
import { pointerParallaxStyles } from './PointerParallax.styles'

/** `element` follows the pointer while it is over the element; `page` follows it anywhere on the page. */
export type PointerParallaxScope = 'element' | 'page'

const SCOPES: readonly PointerParallaxScope[] = ['element', 'page']
const DEFAULT_STRENGTH = 24

const DEPTH_PROPERTY = '--_pointer-parallax-depth'
const X_PROPERTY = '--_pointer-parallax-x'
const Y_PROPERTY = '--_pointer-parallax-y'

/** The depth a child asks for in `data-depth`, or null when it has none. */
export function parseDepth(value: string | null): number | null {
  if (value === null || value.trim() === '') return null
  const depth = Number(value)
  return Number.isFinite(depth) ? depth : null
}

/**
 * Layers that shift by different amounts as the pointer moves, so a flat
 * hero gains depth: a background barely moves, a card in front moves more,
 * and a layer with a negative depth moves the other way. Put the layers in
 * it as children, positioned however you like, and give each one a
 * `data-depth`, usually between -1 and 1; a child without one stays still.
 * `strength` is how far, in pixels, a layer of depth 1 travels with the
 * pointer at the element's edge. By default the layers follow the pointer
 * while it is over the element and drift back when it leaves;
 * `scope="page"` follows it anywhere on the page, measured from the
 * element's centre, for a background that reacts before the pointer
 * reaches it. Each layer moves by the `translate` property, so position
 * layers with `inset`, margins or `transform`, not `translate`. Only a mouse
 * or a pen moves them. The layers move by transforms alone, and the element
 * writes two numbers per frame however many layers it holds. It lives in
 * the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the layers
 * keep their own semantics and are read in order. Mark purely decorative
 * layers `aria-hidden="true"` yourself.
 *
 * Reduced motion: every layer stays in its place.
 *
 * @slot - The layers, each an element with a `data-depth`.
 *
 * @cssprop --pointer-parallax-duration - How long a layer takes to catch up with the pointer, and to drift back. Defaults to `600ms`.
 */
export class MoulPointerParallax extends LitElement {
  static override styles = pointerParallaxStyles

  static override properties = {
    strength: { type: Number },
    scope: { type: String, reflect: true },
  }

  /** How far, in pixels, a layer of depth 1 moves with the pointer at the edge. Defaults to 24. */
  declare strength: number
  /** Where the pointer is followed. Defaults to `element`; an unknown value falls back to it. */
  declare scope: PointerParallaxScope

  private pointer: PointerController | null = null
  private pointerScope: PointerParallaxScope | null = null
  private readonly inView: InViewController
  private isReduced = false
  private stopWatchingMotion: (() => void) | null = null
  private mutationObserver: MutationObserver | null = null
  /** The offset written last, so an unchanged one is not written again. */
  private written = ''

  constructor() {
    super()
    this.strength = DEFAULT_STRENGTH
    this.scope = 'element'
    // Only consulted for `scope="page"`: an element off screen skips its writes.
    this.inView = new InViewController(this, { pauseOffscreen: false })
  }

  /** The offset the layers are moved by, each -1 to 1, as last written. */
  public get offset(): { x: number; y: number } {
    const layers = this.layersEl
    return {
      x: Number(layers?.style.getPropertyValue(X_PROPERTY) || 0),
      y: Number(layers?.style.getPropertyValue(Y_PROPERTY) || 0),
    }
  }

  private get layersEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.layers') ?? null
  }

  private get probeEl(): HTMLElement | null {
    return this.renderRoot?.querySelector<HTMLElement>('.probe') ?? null
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.write(0, 0, false)
    })
    if (typeof MutationObserver === 'function') {
      this.mutationObserver = new MutationObserver(() => this.syncDepths())
      this.mutationObserver.observe(this, {
        attributes: true,
        attributeFilter: ['data-depth'],
        subtree: true,
      })
    }
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.mutationObserver?.disconnect()
    this.mutationObserver = null
    this.write(0, 0, false)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('scope')) {
      if (!SCOPES.includes(this.scope)) this.scope = 'element'
      this.bindPointer()
    }
    if (changed.has('strength')) {
      const value = Number(this.strength)
      if (!Number.isFinite(value)) this.strength = DEFAULT_STRENGTH
    }
  }

  protected override firstUpdated(): void {
    // Not every engine fires slotchange for the children a slot starts with.
    this.syncDepths()
  }

  /** Follows the pointer over the element or across the page, as `scope` asks. */
  private bindPointer(): void {
    if (this.pointer && this.pointerScope === this.scope) return
    if (this.pointer) {
      this.pointer.hostDisconnected()
      this.removeController(this.pointer)
    }
    this.pointerScope = this.scope
    this.write(0, 0, false)
    this.pointer = new PointerController(this, {
      scope: this.scope === 'page' ? 'window' : 'element',
      pointerTypes: ['mouse', 'pen'],
      prefix: '--_pointer-parallax-pointer',
      // The controller always writes the pointer position as variables; the
      // layers need only the offset, so those go to an unrendered probe.
      styleTarget: () => this.probeEl,
      onFrame: this.handlePointerFrame,
    })
  }

  private readonly handlePointerFrame = (state: PointerState): void => {
    if (this.isReduced) return
    if (this.scope === 'page') {
      if (!this.inView.isInView) return
    } else if (!state.isInside) {
      this.write(0, 0, false)
      return
    }
    this.write(toOffset(state.ratioX), toOffset(state.ratioY), true)
  }

  private write(x: number, y: number, isActive: boolean): void {
    const layers = this.layersEl
    if (!layers) return
    const key = `${x}|${y}|${isActive}`
    if (key === this.written) return
    this.written = key
    layers.style.setProperty(X_PROPERTY, String(x))
    layers.style.setProperty(Y_PROPERTY, String(y))
    layers.classList.toggle('is-active', isActive)
  }

  /** Copies each child's `data-depth` into a variable, once, so frames never touch the children. */
  private syncDepths(): void {
    for (const child of this.children) {
      if (!(child instanceof HTMLElement || child instanceof SVGElement)) {
        continue
      }
      const depth = parseDepth(child.getAttribute('data-depth'))
      if (depth === null) child.style.removeProperty(DEPTH_PROPERTY)
      else child.style.setProperty(DEPTH_PROPERTY, String(depth))
    }
  }

  private readonly handleSlotChange = (): void => {
    this.syncDepths()
  }

  protected override render() {
    const layerStyle = {
      '--_pointer-parallax-strength': String(this.strength),
    }
    return html`<div class="layers" style=${styleMap(layerStyle)}>
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
      <span class="probe" hidden></span>`
  }
}

/** A 0-to-1 position across the element as an offset from its centre, -1 to 1. */
function toOffset(ratio: number): number {
  const offset = Math.min(1, Math.max(-1, ratio * 2 - 1))
  return Math.round(offset * 1000) / 1000
}

defineElement('moul-pointer-parallax', MoulPointerParallax)

declare global {
  interface HTMLElementTagNameMap {
    'moul-pointer-parallax': MoulPointerParallax
  }
}
