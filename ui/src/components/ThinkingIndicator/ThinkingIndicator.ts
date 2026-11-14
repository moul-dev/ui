import { html, LitElement, type PropertyValues } from 'lit'
import {
  type CanvasFrame,
  CanvasLoopController,
} from '../../controllers/canvas-loop.controller'
import { defineElement } from '../../utils/define-element'
import { thinkingIndicatorStyles } from './ThinkingIndicator.styles'

export type ThinkingIndicatorSize = 'sm' | 'md' | 'lg'

const SIZES: ThinkingIndicatorSize[] = ['sm', 'md', 'lg']
/** Particles per size: enough to read as a sphere, few enough to stay crisp. */
const PARTICLES: Record<ThinkingIndicatorSize, number> = {
  sm: 36,
  md: 56,
  lg: 90,
}
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
/** Frames between reads of the orb's colour, so a theme switch shows within half a second. */
const COLOR_EVERY = 30

interface Particle {
  x: number
  y: number
  z: number
  phase: number
}

/** Points spread evenly over a unit sphere (a Fibonacci lattice). */
function sphere(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2
    const radius = Math.sqrt(1 - y * y)
    const angle = i * GOLDEN_ANGLE
    return {
      x: Math.cos(angle) * radius,
      y,
      z: Math.sin(angle) * radius,
      phase: (i * 2.399) % (Math.PI * 2),
    }
  })
}

/**
 * A small orb of particles that turns and breathes while a model works,
 * beside a label such as "Thinking" or "Searching records" whose text
 * shimmers. Put it where an answer will appear, and change `label` as the
 * work moves on. The orb is drawn on a canvas in the `--thinking-indicator-color`
 * (the accent colour by default) and stops drawing while it is off screen or
 * the tab is hidden.
 *
 * Keyboard and screen readers: it takes no focus. The host is a polite
 * `role="status"` live region holding the label, so a screen reader says
 * "Thinking" when it appears and each new `label` as it changes. With
 * `hide-label` the label is hidden from sight but still read. The orb is
 * decorative and hidden.
 *
 * Reduced motion: the orb is drawn once, still, and the label does not
 * shimmer.
 *
 * @csspart base - The row that holds the orb and the label.
 * @csspart orb - The canvas the orb is drawn on.
 * @csspart label - The label.
 * @cssprop --thinking-indicator-color - The orb's colour. Defaults to `var(--color-accent)`.
 * @cssprop --thinking-indicator-size - The orb's width and height. Defaults to `1.25rem`, `1.75rem` or `2.75rem` by `size`.
 */
export class MoulThinkingIndicator extends LitElement {
  static override styles = thinkingIndicatorStyles

  static override properties = {
    label: { type: String },
    size: { type: String, reflect: true },
    hideLabel: { type: Boolean, reflect: true, attribute: 'hide-label' },
  }

  /** What the model is doing: "Thinking", "Searching records". Read out when it changes. */
  declare label: string
  /** `sm`, `md` or `lg`. */
  declare size: ThinkingIndicatorSize
  /** Hide the label from sight; screen readers still read it. */
  declare hideLabel: boolean

  private particles: Particle[] = sphere(PARTICLES.md)
  private color = ''
  private colorAge = COLOR_EVERY

  private readonly loop = new CanvasLoopController(this, {
    canvas: () => this.renderRoot?.querySelector('canvas') ?? null,
    draw: (frame) => this.draw(frame),
    resize: () => {
      this.colorAge = COLOR_EVERY
    },
  })

  constructor() {
    super()
    this.label = 'Thinking'
    this.size = 'md'
    this.hideLabel = false
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) this.setAttribute('role', 'status')
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!SIZES.includes(this.size)) this.size = 'md'
    if (changed.has('size')) this.particles = sphere(PARTICLES[this.size])
  }

  protected override updated(changed: PropertyValues<this>): void {
    // A still orb (reduced motion) is redrawn by hand; a running one picks it up next frame.
    if (changed.get('size') !== undefined) this.loop.drawOnce()
  }

  private draw({ context, width, height, time, canvas }: CanvasFrame): void {
    if (!context || !width || !height) return
    if (++this.colorAge >= COLOR_EVERY || !this.color) {
      this.colorAge = 0
      this.color = getComputedStyle(canvas).color || 'currentColor'
    }
    const t = time / 1000
    const cx = width / 2
    const cy = height / 2
    const radius = (Math.min(width, height) / 2) * 0.66
    const breathe = 1 + 0.07 * Math.sin(t * 2.1)
    const spin = t * 0.9
    const tilt = 0.45 + 0.25 * Math.sin(t * 0.55)
    const cosSpin = Math.cos(spin)
    const sinSpin = Math.sin(spin)
    const cosTilt = Math.cos(tilt)
    const sinTilt = Math.sin(tilt)
    const dot = Math.max(0.6, radius * 0.085)

    context.clearRect(0, 0, width, height)
    context.fillStyle = this.color

    // A soft glow behind the particles.
    context.save()
    context.globalAlpha = 0.28 + 0.08 * Math.sin(t * 2.1)
    context.shadowColor = this.color
    context.shadowBlur = radius * 0.9
    context.beginPath()
    context.arc(cx, cy, radius * 0.42 * breathe, 0, Math.PI * 2)
    context.fill()
    context.restore()

    const projected = this.particles.map((p) => {
      const wobble = 1 + 0.09 * Math.sin(t * 2.6 + p.phase)
      const x1 = p.x * cosSpin + p.z * sinSpin
      const z1 = -p.x * sinSpin + p.z * cosSpin
      const y2 = p.y * cosTilt - z1 * sinTilt
      const z2 = p.y * sinTilt + z1 * cosTilt
      const r = radius * breathe * wobble
      const depth = (z2 + 1) / 2
      const scale = 1 / (1.35 - z2 * 0.35)
      return {
        x: cx + x1 * r * scale,
        y: cy + y2 * r * scale,
        depth,
        size: dot * (0.55 + 0.6 * depth),
      }
    })
    projected.sort((a, b) => a.depth - b.depth)
    for (const p of projected) {
      context.globalAlpha = 0.18 + 0.82 * p.depth
      context.beginPath()
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      context.fill()
    }
    context.globalAlpha = 1
  }

  protected override render() {
    return html`
      <span part="base" class="base">
        <canvas part="orb" class="orb" aria-hidden="true"></canvas>
        <span part="label" class="label">${this.label}</span>
      </span>
    `
  }
}

defineElement('moul-thinking-indicator', MoulThinkingIndicator)

declare global {
  interface HTMLElementTagNameMap {
    'moul-thinking-indicator': MoulThinkingIndicator
  }
}
