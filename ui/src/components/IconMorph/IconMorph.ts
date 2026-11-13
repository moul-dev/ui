import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { type AnimationPlaybackControls, animate } from 'motion'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, prefersReducedMotion } from '../../utils/motion'
import { iconMorphStyles } from './IconMorph.styles'
import {
  type IconMorphName,
  LINE_ICONS,
  lineSvg,
  mixLine,
  RING_ROTATION,
  round,
  THEME_ICONS,
  themeSvg,
} from './icons'

export type { IconMorphName } from './icons'

export type IconMorphSize = 'sm' | 'md' | 'lg'

/**
 * `line` icons morph into each other, `theme` icons (sun, moon, system) into
 * each other, and `custom` (slotted) icons only cross-fade.
 */
type LayerKind = 'line' | 'theme' | 'custom'

/**
 * One icon on screen. Two or more exist only during a cross-fade. Its numbers
 * are `[opacity, scale, rotation, ...geometry]`: where it is now and where it
 * is heading.
 */
interface Layer {
  id: number
  name: string
  kind: LayerKind
  isLeaving: boolean
  now: number[]
  to: number[]
}

const POSE = 3
const REST = [1, 1, 0]
const ENTER = [0, 0.5, -45]
const LEAVE = [0, 0.5, 45]
const RING_TURN = POSE + RING_ROTATION

const warnedNames = new Set<string>()

function warnUnknownName(name: string): void {
  if (
    warnedNames.has(name) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production')
  ) {
    return
  }
  warnedNames.add(name)
  console.warn(
    `[@moul-dev/web-component] <moul-icon-morph> has no icon named "${name}", so it shows nothing. Use a built-in name or add a child with slot="${name}".`,
  )
}

const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => v + (b[i] - v) * t)

/**
 * An icon that morphs into another when its `name` changes: menu into close,
 * play into pause, sun into moon. The built-in line icons (menu, close, plus,
 * minus, check, chevrons, arrows, play, pause, more, loader, error) are all
 * three stroke segments and a ring, so any two morph point by point; `sun`,
 * `moon` and `system` morph among themselves. Any other change cross-fades:
 * the old icon turns and shrinks away while the new one turns in. A child
 * with `slot` set to a name is shown for that name, overriding a built-in one,
 * and always cross-fades. It is 1em square by default and strokes in the
 * current text colour, so it follows the text around it.
 *
 * Keyboard and screen readers: not focusable and has no keyboard behaviour.
 * With `label`, the host is `role="img"` named by the label. Without it the
 * host is `aria-hidden="true"`, which suits an icon next to visible text. An
 * icon-only `moul-button` takes its name from its content, so give the icon a
 * `label` there. Changing `name` is not announced; change `label` with it
 * when the icon alone carries the state.
 *
 * Reduced motion: the new icon replaces the old one at once, with no morph,
 * turn or fade, and `loader` slowly pulses its opacity instead of spinning.
 *
 * @slot <name> - A custom icon, such as an `<svg>`, shown while `name` equals its `slot` value. It overrides a built-in icon of the same name.
 * @csspart base - The box that holds the icon.
 * @csspart svg - The `<svg>` of a built-in icon (two exist briefly during a cross-fade).
 * @cssprop [--icon-morph-stroke-width=2] - Stroke width of the built-in icons, in viewBox units (the box is 24 wide).
 */
export class MoulIconMorph extends LitElement {
  static override styles = iconMorphStyles

  static override properties = {
    name: { type: String, reflect: true },
    label: { type: String },
    size: { type: String, reflect: true },
  }

  /** The icon shown: a built-in name or the `slot` of a child. */
  declare name: IconMorphName | (string & {})
  /** Accessible name; when empty the icon is decorative (`aria-hidden`). */
  declare label: string
  /** Fixed size; unset follows the font size (1em). */
  declare size: IconMorphSize | undefined

  private layers: Layer[] = []
  private nextId = 0
  private controls: AnimationPlaybackControls | null = null
  private observer: MutationObserver | null = null
  private isSlotDirty = false

  constructor() {
    super()
    this.name = ''
    this.label = ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.observer ??= new MutationObserver(() => this.markSlotsDirty())
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      attributeFilter: ['slot'],
    })
    if (this.hasUpdated) this.markSlotsDirty()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    if (this.controls) this.settle()
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed)
    if (changed.has('label')) {
      const label = this.label?.trim()
      if (label) {
        this.setAttribute('role', 'img')
        this.setAttribute('aria-label', label)
        this.removeAttribute('aria-hidden')
      } else {
        this.removeAttribute('role')
        this.removeAttribute('aria-label')
        this.setAttribute('aria-hidden', 'true')
      }
    }
    if (changed.has('name') || this.isSlotDirty) {
      this.isSlotDirty = false
      this.sync()
    }
  }

  private markSlotsDirty(): void {
    this.isSlotDirty = true
    this.requestUpdate()
  }

  private hasSlotted(name: string): boolean {
    return (
      name !== '' &&
      Array.from(this.children).some(
        (child) => child.getAttribute('slot') === name,
      )
    )
  }

  /** Moves the layers toward the icon `name` now resolves to. */
  private sync(): void {
    const name = this.name ?? ''
    const kind: LayerKind | null = this.hasSlotted(name)
      ? 'custom'
      : LINE_ICONS.has(name)
        ? 'line'
        : THEME_ICONS.has(name)
          ? 'theme'
          : null
    const active = this.layers.find((layer) => !layer.isLeaving)
    if (active && active.kind === kind && active.name === name) return
    if (name && !kind) warnUnknownName(name)
    // Stopping samples the running tween once more, so `now` is current.
    this.controls?.stop()
    this.controls = null

    const geometry =
      (kind === 'line' ? LINE_ICONS.get(name) : undefined) ??
      (kind === 'theme' ? THEME_ICONS.get(name) : undefined) ??
      []
    // At most one line layer, one theme layer and one layer per custom name
    // exist, so the one that can carry the new icon is found by kind.
    let layer = this.layers.find(
      (l) => l.kind === kind && (kind !== 'custom' || l.name === name),
    )
    if (layer?.name === 'loader' && name !== 'loader') this.foldSpin(layer)

    for (const other of this.layers) {
      if (other === layer) continue
      other.isLeaving = true
      other.to = [...LEAVE, ...other.to.slice(POSE)]
    }
    if (kind) {
      if (!layer) {
        layer = {
          id: this.nextId++,
          name,
          kind,
          isLeaving: false,
          now: [...ENTER, ...geometry],
          to: [],
        }
        this.layers.push(layer)
      }
      layer.name = name
      layer.isLeaving = false
      layer.to = [...REST, ...geometry]
    }

    if (!this.hasUpdated || !this.isConnected || prefersReducedMotion()) {
      this.settle()
    } else {
      this.play()
    }
  }

  /**
   * The loader's spin is a CSS animation that stops when it morphs away, so
   * its current angle moves into the ring's own rotation first.
   */
  private foldSpin(layer: Layer): void {
    if (prefersReducedMotion()) return
    const spin = this.renderRoot.querySelector('.spin')
    const animation = spin?.getAnimations?.()[0]
    const duration = Number(animation?.effect?.getComputedTiming().duration)
    const time = Number(animation?.currentTime)
    if (duration > 0 && time >= 0) {
      layer.now[RING_TURN] += ((time % duration) / duration) * 360
    }
  }

  /** Tweens every layer from where it is now, so an interrupted morph never jumps. */
  private play(): void {
    // Each tween keeps its own ends: a stopped one still samples once.
    const tracks = this.layers.map((layer) => ({
      layer,
      from: layer.now.slice(),
      to: layer.to.slice(),
    }))
    const controls = animate(0, 1, {
      duration: 0.3,
      ease: EASE_OUT,
      onUpdate: (t: number) => {
        for (const { layer, from, to } of tracks) {
          layer.now =
            layer.kind === 'line'
              ? [
                  ...mix(from.slice(0, POSE), to, t),
                  ...mixLine(from.slice(POSE), to.slice(POSE), t),
                ]
              : mix(from, to, t)
        }
        this.requestUpdate()
      },
    })
    this.controls = controls
    controls.then(() => {
      if (this.controls === controls) this.settle()
    })
  }

  /** Jumps to the end: drops leaving layers and puts the rest at their target. */
  private settle(): void {
    this.controls?.stop()
    this.controls = null
    this.layers = this.layers.filter((layer) => !layer.isLeaving)
    for (const layer of this.layers) layer.now = layer.to.slice()
    this.requestUpdate()
  }

  private renderLayer(layer: Layer) {
    const [opacity, scale, turn] = layer.now
    const pose =
      opacity === 1 && scale === 1 && turn === 0
        ? nothing
        : `opacity: ${round(opacity)}; transform: rotate(${round(turn)}deg) scale(${round(scale)})`
    const geometry = layer.now.slice(POSE)
    return html`<span class="layer" style=${pose}>
      ${
        layer.kind === 'custom'
          ? html`<slot name=${layer.name}></slot>`
          : html`<svg
              part="svg"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              ${
                layer.kind === 'line'
                  ? lineSvg(geometry, layer.name === 'loader')
                  : themeSvg(geometry, `m${layer.id}`)
              }
            </svg>`
      }
    </span>`
  }

  protected override render() {
    return html`<span part="base">
      ${repeat(
        this.layers,
        (layer) => layer.id,
        (layer) => this.renderLayer(layer),
      )}
    </span>`
  }
}

defineElement('moul-icon-morph', MoulIconMorph)

declare global {
  interface HTMLElementTagNameMap {
    'moul-icon-morph': MoulIconMorph
  }
}
