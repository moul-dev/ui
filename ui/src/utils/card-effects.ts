/**
 * Card effects shared by `moul-card` (main entry) and `moul-bento-card`
 * (effects entry): the effect names, the decorative layers each one renders,
 * and a small controller for the pointer and off-screen work.
 *
 * It must stay free of the effects-entry controllers (PointerController,
 * InViewController), because `moul-card` imports it into the main bundle.
 */
import { html, type ReactiveController, type ReactiveControllerHost } from 'lit'
import { prefersReducedMotion, watchReducedMotion } from './motion'

/**
 * `spotlight`: a soft light follows the pointer across the card.
 * `glare`: a band of light sweeps across once on hover or keyboard focus.
 * `glow`: a gradient ring on the edge and a coloured glow outside the card
 * slowly turn.
 */
export type CardEffect = 'spotlight' | 'glare' | 'glow'

export const CARD_EFFECTS: readonly CardEffect[] = [
  'spotlight',
  'glare',
  'glow',
]

/** The known effects in a space-separated `effect` value; other tokens are ignored. */
export function parseCardEffects(value: unknown): Set<CardEffect> {
  const effects = new Set<CardEffect>()
  if (typeof value !== 'string') return effects
  for (const token of value.split(/\s+/)) {
    if ((CARD_EFFECTS as readonly string[]).includes(token)) {
      effects.add(token as CardEffect)
    }
  }
  return effects
}

// The glow turns by animating this angle. Shadow roots ignore `@property`,
// so it is registered once here; where registration is missing (or the page
// already did it) the glow simply holds still.
try {
  CSS.registerProperty({
    name: '--moul-card-glow-angle',
    syntax: '<angle>',
    inherits: false,
    initialValue: '0deg',
  })
} catch {
  // Already registered, or the browser cannot register properties.
}

/** Under the content, above the card's background. */
export const cardSpotlightLayer = html`<span
  class="card-spotlight"
  aria-hidden="true"
></span>`

/** Over the content; the band is its `::before`. */
export const cardGlareLayer = html`<span
  class="card-glare"
  aria-hidden="true"
></span>`

/** The outer glow is its `box-shadow`, the ring its `::before`. */
export const cardGlowLayer = html`<span
  class="card-glow"
  aria-hidden="true"
></span>`

type CardEffectsHost = ReactiveControllerHost &
  HTMLElement & { effect?: string | null }

/**
 * Runs the scripted half of the card effects, and only for the effects in
 * the host's `effect` list:
 *
 * - `spotlight`: follows a mouse or pen over the host, at most once per
 *   animation frame, and writes the position to `--_card-spotlight-x` and
 *   `--_card-spotlight-y` on the light itself (never the host, so nothing
 *   inherits into nested cards). `data-on` on the light shows it. Under
 *   reduced motion the light shows but rests at the centre.
 * - `glow`: sets `data-paused` on the glow layer while the card is off
 *   screen, so the turning stops costing frames.
 */
export class CardEffectsController implements ReactiveController {
  private readonly host: CardEffectsHost
  private isTracking = false
  private isOver = false
  private isReduced = false
  private frame = 0
  private clientX = 0
  private clientY = 0
  private stopWatchingMotion: (() => void) | null = null
  private observer: IntersectionObserver | null = null
  private isOffscreen = false

  constructor(host: CardEffectsHost) {
    this.host = host
    host.addController(this)
  }

  public hostConnected(): void {
    this.sync()
  }

  public hostUpdated(): void {
    this.sync()
  }

  public hostDisconnected(): void {
    this.stopSpotlight()
    this.stopGlow()
  }

  private sync(): void {
    const effects = parseCardEffects(this.host.effect)
    if (effects.has('spotlight')) this.startSpotlight()
    else this.stopSpotlight()
    if (effects.has('glow')) this.startGlow()
    else this.stopGlow()
  }

  private layer(name: string): HTMLElement | null {
    return (
      this.host.shadowRoot?.querySelector<HTMLElement>(`.card-${name}`) ?? null
    )
  }

  // ── Spotlight ────────────────────────────────────────────────────────

  private startSpotlight(): void {
    if (this.isTracking) return
    this.isTracking = true
    this.isReduced = prefersReducedMotion()
    this.stopWatchingMotion = watchReducedMotion((isReduced) => {
      this.isReduced = isReduced
      if (isReduced) this.rest()
    })
    this.host.addEventListener('pointermove', this.handlePointerMove, {
      passive: true,
    })
    this.host.addEventListener('pointerleave', this.handlePointerLeave)
  }

  private stopSpotlight(): void {
    if (!this.isTracking) return
    this.isTracking = false
    this.stopWatchingMotion?.()
    this.stopWatchingMotion = null
    this.host.removeEventListener('pointermove', this.handlePointerMove)
    this.host.removeEventListener('pointerleave', this.handlePointerLeave)
    this.cancelFrame()
    this.isOver = false
    this.layer('spotlight')?.removeAttribute('data-on')
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    // Touch has no hover: a light under a finger would only flash.
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return
    this.clientX = event.clientX
    this.clientY = event.clientY
    this.isOver = true
    if (this.frame || typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.flush)
  }

  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') return
    this.isOver = false
    this.cancelFrame()
    // The position stays, so the light fades out where the pointer left.
    this.layer('spotlight')?.removeAttribute('data-on')
  }

  private readonly flush = (): void => {
    this.frame = 0
    const light = this.layer('spotlight')
    if (!light || !this.isOver) return
    light.setAttribute('data-on', '')
    if (this.isReduced) {
      this.rest()
      return
    }
    const rect = light.getBoundingClientRect()
    light.style.setProperty(
      '--_card-spotlight-x',
      `${round(this.clientX - rect.left)}px`,
    )
    light.style.setProperty(
      '--_card-spotlight-y',
      `${round(this.clientY - rect.top)}px`,
    )
  }

  /** Drops the written position, so the light sits at its 50% 50% default. */
  private rest(): void {
    this.cancelFrame()
    const light = this.layer('spotlight')
    light?.style.removeProperty('--_card-spotlight-x')
    light?.style.removeProperty('--_card-spotlight-y')
    if (light && this.isOver) light.setAttribute('data-on', '')
  }

  private cancelFrame(): void {
    if (this.frame && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.frame)
    }
    this.frame = 0
  }

  // ── Glow ─────────────────────────────────────────────────────────────

  private startGlow(): void {
    if (!this.observer && typeof IntersectionObserver === 'function') {
      this.observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        this.isOffscreen = !entry.isIntersecting
        this.applyPause()
      })
      this.observer.observe(this.host)
    }
    // The layer may have just been rendered.
    this.applyPause()
  }

  private stopGlow(): void {
    this.observer?.disconnect()
    this.observer = null
    this.isOffscreen = false
  }

  private applyPause(): void {
    this.layer('glow')?.toggleAttribute('data-paused', this.isOffscreen)
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}
