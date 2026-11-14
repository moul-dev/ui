import { LitElement, nothing, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { prefersReducedMotion } from '../../utils/motion'
import {
  BACKWARD_TYPE,
  DIRECTION_ATTRIBUTE,
  EFFECT_ATTRIBUTE,
  ORIGIN_R,
  ORIGIN_X,
  ORIGIN_Y,
  PAGE_TRANSITION_EFFECTS,
  type PageTransitionEffect,
  pageTransitionCss,
  pageTransitionStyles,
} from './PageTransition.styles'

export type { PageTransitionEffect }

/** `forward` moves toward the inline end, as when following a link; `backward` the other way, as when going back. */
export type PageTransitionDirection = 'forward' | 'backward'

export interface PageTransitionOptions {
  /** Where `circle` grows from, in viewport pixels. Defaults to the last click or tap, or the focused element, or the centre. */
  x?: number
  y?: number
  /** Which way `wipe` and `slide` move. Defaults to `forward`. */
  direction?: PageTransitionDirection
}

const DEFAULT_EFFECT: PageTransitionEffect = 'wipe'
const DEFAULT_DURATION = 600
/** A press older than this is not the one that started the transition. */
const PRESS_MAX_AGE_MS = 2000
/** Where the old page leaves the press point for the new one to read. */
const ORIGIN_STORAGE_KEY = 'moul-page-transition-origin'
const ORIGIN_MAX_AGE_MS = 10_000

interface ViewTransitionLike {
  finished: Promise<void>
  ready: Promise<void>
  updateCallbackDone: Promise<void>
  types?: Set<string>
}

type DocumentWithTransitions = Document & {
  startViewTransition?: (
    update: () => unknown,
  ) => ViewTransitionLike | undefined
}

/** `pageswap` and `pagereveal` carry the cross-page transition, where there is one. */
type PageTransitionEvent = Event & {
  viewTransition?: ViewTransitionLike | null
}

interface NavigationEntryLike {
  index: number
}

interface NavigationLike {
  activation?: {
    navigationType?: string
    entry?: NavigationEntryLike | null
    from?: NavigationEntryLike | null
  } | null
}

interface Point {
  x: number
  y: number
}

/** The last press on the page, shared by every instance. */
let lastPress: (Point & { time: number }) | null = null
/** Each same-page transition gets a number, so only the newest one tidies `<html>`. */
let transitionCount = 0

function now(): number {
  return typeof performance === 'undefined' ? Date.now() : performance.now()
}

/**
 * Where a transition the reader started came from: their last press, if it
 * was just now, or the element that has keyboard focus.
 */
function pressOrigin(): Point | null {
  if (lastPress && now() - lastPress.time < PRESS_MAX_AGE_MS) {
    return { x: lastPress.x, y: lastPress.y }
  }
  const focused = document.activeElement
  if (
    focused &&
    focused !== document.body &&
    focused !== document.documentElement
  ) {
    const box = focused.getBoundingClientRect()
    if (box.width > 0 || box.height > 0) {
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 }
    }
  }
  return null
}

/** Writes where the circle grows from and the radius that covers the screen from there. */
function writeOrigin(point: Point | null): void {
  const root = document.documentElement
  const width = window.innerWidth
  const height = window.innerHeight
  const x = point?.x ?? width / 2
  const y = point?.y ?? height / 2
  const radius = Math.hypot(Math.max(x, width - x), Math.max(y, height - y))
  root.style.setProperty(ORIGIN_X, `${Math.round(x)}px`)
  root.style.setProperty(ORIGIN_Y, `${Math.round(y)}px`)
  root.style.setProperty(ORIGIN_R, `${Math.ceil(radius)}px`)
}

function clearRoot(): void {
  const root = document.documentElement
  root.removeAttribute(EFFECT_ATTRIBUTE)
  root.removeAttribute(DIRECTION_ATTRIBUTE)
  root.style.removeProperty(ORIGIN_X)
  root.style.removeProperty(ORIGIN_Y)
  root.style.removeProperty(ORIGIN_R)
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage
  } catch {
    // Storage blocked by the browser's privacy settings.
    return null
  }
}

/** Whether this page was reached by going back through the history. */
function isBackward(): boolean {
  const activation = (globalThis as unknown as { navigation?: NavigationLike })
    .navigation?.activation
  if (activation?.navigationType !== 'traverse') return false
  const to = activation.entry?.index
  const from = activation.from?.index
  return (
    typeof to === 'number' && typeof from === 'number' && from >= 0 && to < from
  )
}

/**
 * An animated change of page: a panel of colour wipes across the screen, the
 * new page slides in or grows out of a circle from where the reader clicked,
 * or the two pages cross-fade. Put one in every page, for example in the
 * shared layout, and links to other pages on the same site animate with no
 * other change, through the browser's cross-document view transitions. The
 * browser decides when the new page first draws, so load the effects entry
 * with `blocking="render"`, or put `pageTransitionCss()` in each page's head
 * from the server; otherwise a page whose script arrives late simply changes
 * without the animation. In a
 * single-page app, wrap each change of view in `start()`: it runs your update
 * inside `document.startViewTransition()` with the same effect, and simply
 * runs it where the browser has no view transitions. `effect` picks the
 * animation and `duration` its length; `--page-transition-color` on `:root`
 * colours the wipe. The element itself draws nothing: it adds one `<style>`
 * to the document head, because view transitions are drawn above the whole
 * page, and takes it away when removed. Where the browser has no view
 * transitions (cross-page ones arrived in Chrome 126 and Safari 18.2), pages
 * simply change as they always have. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable, renders nothing and adds no
 * role. Links, the back button and focus work exactly as without it; the
 * animation is a picture of the old and new pages, drawn over them, so it
 * never takes the reader's input and nothing is announced twice. In a
 * single-page app, moving focus and announcing the new view stay your
 * router's job, as without it.
 *
 * Reduced motion: no transition at all. The opt-in to cross-page transitions
 * sits inside `prefers-reduced-motion: no-preference`, and `start()` runs the
 * update straight away, so the new page simply appears.
 *
 * @cssprop --page-transition-color - The colour of the `wipe` panel; set it on `:root`, where the transition is drawn. Defaults to `var(--color-accent)`.
 */
export class MoulPageTransition extends LitElement {
  static override styles = pageTransitionStyles

  static override properties = {
    effect: { type: String, reflect: true },
    duration: { type: Number },
  }

  /** The animation. Defaults to `wipe`; an unknown value falls back to it. */
  declare effect: PageTransitionEffect
  /** The whole transition's length in milliseconds. Defaults to 600. */
  declare duration: number

  private styleEl: HTMLStyleElement | null = null

  private readonly handlePointerDown = (event: PointerEvent): void => {
    lastPress = { x: event.clientX, y: event.clientY, time: now() }
  }

  /** The old page: leave the press point for the next one, as a share of the screen. */
  private readonly handlePageSwap = (event: Event): void => {
    if (!(event as PageTransitionEvent).viewTransition) return
    const origin = pressOrigin()
    const store = storage()
    if (!store) return
    try {
      if (!origin) {
        store.removeItem(ORIGIN_STORAGE_KEY)
        return
      }
      store.setItem(
        ORIGIN_STORAGE_KEY,
        JSON.stringify({
          x: origin.x / Math.max(1, window.innerWidth),
          y: origin.y / Math.max(1, window.innerHeight),
          time: Date.now(),
        }),
      )
    } catch {
      // Storage full or blocked: the circle grows from the centre.
    }
  }

  /** The new page, before its first frame: direction and origin for the transition about to play. */
  private readonly handlePageReveal = (event: Event): void => {
    const transition = (event as PageTransitionEvent).viewTransition
    if (!transition) return
    const root = document.documentElement
    root.setAttribute(EFFECT_ATTRIBUTE, this.effect)
    if (isBackward()) {
      transition.types?.add(BACKWARD_TYPE)
      root.setAttribute(DIRECTION_ATTRIBUTE, 'backward')
    }
    writeOrigin(this.readStoredOrigin())
    transition.ready?.catch(() => {})
    transition.finished.then(clearRoot, clearRoot)
  }

  constructor() {
    super()
    this.effect = DEFAULT_EFFECT
    this.duration = DEFAULT_DURATION
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-hidden', 'true')
    this.writeStyle()
    window.addEventListener('pointerdown', this.handlePointerDown, {
      capture: true,
      passive: true,
    })
    window.addEventListener('pageswap', this.handlePageSwap)
    window.addEventListener('pagereveal', this.handlePageReveal)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.styleEl?.remove()
    this.styleEl = null
    window.removeEventListener('pointerdown', this.handlePointerDown, {
      capture: true,
    })
    window.removeEventListener('pageswap', this.handlePageSwap)
    window.removeEventListener('pagereveal', this.handlePageReveal)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (
      changed.has('effect') &&
      !PAGE_TRANSITION_EFFECTS.includes(this.effect)
    ) {
      this.effect = DEFAULT_EFFECT
    }
    if (
      changed.has('duration') &&
      !(Number.isFinite(this.duration) && this.duration >= 0)
    ) {
      this.duration = DEFAULT_DURATION
    }
    if (changed.has('effect') || changed.has('duration')) this.writeStyle()
  }

  /**
   * Runs `update`, the change from one view to the next, inside a view
   * transition with this element's effect, and resolves once the animation
   * has finished. Where the browser has no view transitions, the page is
   * hidden or the reader asks for reduced motion, it just runs `update`. It
   * rejects if `update` throws or rejects.
   */
  public async start(
    update: () => unknown = () => {},
    options: PageTransitionOptions = {},
  ): Promise<void> {
    const doc = document as DocumentWithTransitions
    if (
      typeof doc.startViewTransition !== 'function' ||
      prefersReducedMotion() ||
      document.visibilityState === 'hidden'
    ) {
      await update()
      return
    }

    const id = ++transitionCount
    const root = document.documentElement
    root.setAttribute(EFFECT_ATTRIBUTE, this.effect)
    if (options.direction === 'backward') {
      root.setAttribute(DIRECTION_ATTRIBUTE, 'backward')
    } else {
      root.removeAttribute(DIRECTION_ATTRIBUTE)
    }
    const hasPoint =
      typeof options.x === 'number' && typeof options.y === 'number'
    writeOrigin(
      hasPoint
        ? { x: options.x as number, y: options.y as number }
        : pressOrigin(),
    )

    const tidy = () => {
      if (id === transitionCount) clearRoot()
    }
    let transition: ViewTransitionLike | undefined
    try {
      transition = doc.startViewTransition(() => update())
    } catch {
      transition = undefined
    }
    if (!transition) {
      tidy()
      await update()
      return
    }
    // A skipped transition rejects `ready`; the update still runs and
    // `finished` still settles. An update that fails rejects `finished` too,
    // which is the one promise passed on.
    transition.ready?.catch(() => {})
    transition.updateCallbackDone?.catch(() => {})
    try {
      await transition.finished
    } finally {
      tidy()
    }
  }

  private readStoredOrigin(): Point | null {
    const store = storage()
    if (!store) return null
    try {
      const raw = store.getItem(ORIGIN_STORAGE_KEY)
      store.removeItem(ORIGIN_STORAGE_KEY)
      if (!raw) return null
      const saved = JSON.parse(raw) as { x?: number; y?: number; time?: number }
      if (
        typeof saved.x !== 'number' ||
        typeof saved.y !== 'number' ||
        typeof saved.time !== 'number' ||
        Date.now() - saved.time > ORIGIN_MAX_AGE_MS
      ) {
        return null
      }
      return {
        x: saved.x * window.innerWidth,
        y: saved.y * window.innerHeight,
      }
    } catch {
      return null
    }
  }

  /** Puts this effect's document-level CSS in the head, or brings it up to date. */
  private writeStyle(): void {
    if (!this.isConnected || typeof document === 'undefined') return
    if (!this.styleEl) {
      this.styleEl = document.createElement('style')
      this.styleEl.setAttribute('data-moul-page-transition', '')
      document.head.append(this.styleEl)
    }
    const effect = PAGE_TRANSITION_EFFECTS.includes(this.effect)
      ? this.effect
      : DEFAULT_EFFECT
    const duration =
      Number.isFinite(this.duration) && this.duration >= 0
        ? this.duration
        : DEFAULT_DURATION
    const text = pageTransitionCss(effect, duration)
    if (this.styleEl.textContent !== text) this.styleEl.textContent = text
  }

  protected override render() {
    return nothing
  }
}

defineElement('moul-page-transition', MoulPageTransition)

declare global {
  interface HTMLElementTagNameMap {
    'moul-page-transition': MoulPageTransition
  }
}
