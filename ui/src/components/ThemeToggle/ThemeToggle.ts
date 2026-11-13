import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { EASE_OUT, prefersReducedMotion } from '../../utils/motion'
import type { ButtonSize, ButtonVariant } from '../Button/Button'
import '../Button/Button'
import '../IconMorph/IconMorph'
import { themeToggleStyles } from './ThemeToggle.styles'
import {
  isMode,
  MODES,
  type ResolvedTheme,
  readStored,
  type ThemeMode,
  themeStore,
} from './theme-store'

export type { ResolvedTheme, ThemeMode } from './theme-store'

export type ThemeToggleTransition = 'circle' | 'none'

export interface ThemeToggleChangeDetail {
  /** The mode the toggle switches to. */
  mode: ThemeMode
  /** The theme that mode puts on screen. */
  resolvedTheme: ResolvedTheme
}

/**
 * The words the toggle speaks. In the three templates `{mode}` is the name of
 * the mode shown (in `announcement`, the new one), `{theme}` the name of the
 * theme on screen and `{next}` the name of the mode a press switches to.
 */
export interface ThemeToggleLabels {
  system: string
  light: string
  dark: string
  /** The button's name in light and dark mode. */
  name: string
  /** The button's name in system mode. */
  systemName: string
  /** Announced after a press. */
  announcement: string
}

const DEFAULT_LABELS: ThemeToggleLabels = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
  name: 'Theme: {mode}. Switch to {next}.',
  systemName: 'Theme: {mode} ({theme}). Switch to {next}.',
  announcement: '{mode} theme',
}

const ICONS = { system: 'system', light: 'sun', dark: 'moon' } as const

/** On `<html>` only while a reveal runs, so the injected rules touch no other view transition. */
const REVEAL_ATTRIBUTE = 'data-moul-theme-reveal'

let revealSheet: CSSStyleSheet | undefined
let activeReveal: ViewTransition | undefined

/** Adds, once, the rules that stop the default cross-fade of the root during a reveal. */
function adoptRevealSheet(): void {
  try {
    if (!revealSheet) {
      revealSheet = new CSSStyleSheet()
      revealSheet.replaceSync(
        `html[${REVEAL_ATTRIBUTE}]::view-transition-old(root),html[${REVEAL_ATTRIBUTE}]::view-transition-new(root){animation:none;mix-blend-mode:normal}`,
      )
    }
    if (!document.adoptedStyleSheets.includes(revealSheet)) {
      document.adoptedStyleSheets = [
        ...document.adoptedStyleSheets,
        revealSheet,
      ]
    }
  } catch {
    // No constructable stylesheets: the browser's default cross-fade runs instead.
  }
}

const fill = (template: string, words: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) => words[key] ?? match)

/**
 * A button that switches the page between the system, light and dark themes,
 * revealing the new theme in a circle that grows from the button. It sets
 * `data-theme` (the theme on screen) and `color-scheme` on `<html>`, which is
 * all the Moul tokens need, saves the mode in `localStorage`, and follows the
 * OS while in system mode. Every toggle on the page shows the same mode, and
 * so do other tabs. `modes="light dark"` makes it a two-state switch. Use it
 * in an app header or settings page; pair it with the inline `<head>` script
 * from the docs so the saved theme applies before the first paint.
 *
 * Keyboard and screen readers: one tab stop, the native `<button>` inside
 * `moul-button`; Enter or Space press it. Its name says the mode and the next
 * one, "Theme: Light. Switch to Dark.", and in system mode the theme the OS
 * gives, "Theme: System (Dark). Switch to Light." The icon is hidden from
 * screen readers. After a press a polite live region (`role="status"`)
 * announces the new mode ("Dark theme"); changes from another toggle, another
 * tab, the OS or a script are not announced. It cycles through modes, so it is
 * a plain button, not a switch with `aria-pressed`. `labels` replaces every
 * word for other languages. An `aria-label` on the host replaces the whole
 * name in every mode, so the mode is then only heard in the announcement.
 *
 * Reduced motion: the theme switches at once, with no reveal, and the icon
 * swaps without morphing. The same happens with `transition="none"` and in
 * browsers without the View Transitions API.
 *
 * @fires change - Before the theme switches on a press, from inside the view transition's update callback; cancelable. `detail: { mode, resolvedTheme }`. Calling `preventDefault()` leaves `<html>` and storage to the app; the toggles still move to the new mode.
 * @csspart button - The `moul-button`.
 * @csspart icon - The `moul-icon-morph` showing the mode: `system`, `sun` or `moon`.
 * @csspart status - The visually hidden live region.
 */
export class MoulThemeToggle extends LitElement {
  static override styles = themeToggleStyles

  static override properties = {
    mode: { type: String, reflect: true },
    modes: { type: String },
    storageKey: { type: String, attribute: 'storage-key' },
    transition: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    labels: { attribute: false },
    ariaLabel: { type: String, reflect: true, attribute: 'aria-label' },
    announcement: { state: true },
  }

  /**
   * The current mode, the same on every toggle. Setting it switches the page at
   * once (saved, no reveal, no `change`). Unset until the toggle connects.
   */
  declare mode: ThemeMode
  /** The modes a press cycles through, space-separated, in order. */
  declare modes: string
  /** `localStorage` key for the mode; empty turns persistence off. */
  declare storageKey: string
  declare transition: ThemeToggleTransition
  declare variant: ButtonVariant
  declare size: ButtonSize
  /** Replaces any of the default words; see `ThemeToggleLabels`. */
  declare labels: Partial<ThemeToggleLabels>
  /** Replaces the button's whole name in every mode. */
  declare ariaLabel: string | null
  private declare announcement: string

  constructor() {
    super()
    // `mode` stays unset: the first toggle starts from storage, then `mode`, then `modes`.
    this.modes = MODES.join(' ')
    this.storageKey = 'moul-theme'
    this.transition = 'circle'
    this.variant = 'ghost'
    this.size = 'md'
    this.labels = {}
    this.announcement = ''
  }

  /** The theme on screen: `light` or `dark`. */
  get resolvedTheme(): ResolvedTheme {
    return themeStore.resolve(this.mode ?? themeStore.mode)
  }

  private get cycle(): ThemeMode[] {
    const list = (this.modes ?? '').split(/\s+/).filter(isMode)
    return list.length ? [...new Set(list)] : [...MODES]
  }

  /** The mode on the button: `mode`, or the theme on screen when `modes` leaves `mode` out. */
  private get shown(): ThemeMode {
    return this.cycle.includes(this.mode) ? this.mode : this.resolvedTheme
  }

  private get next(): ThemeMode {
    const cycle = this.cycle
    return cycle[(cycle.indexOf(this.shown) + 1) % cycle.length]
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    themeStore.connect(this, () => {
      const stored = readStored(this.storageKey)
      if (isMode(stored) && this.cycle.includes(stored)) return stored
      return isMode(this.mode) ? this.mode : this.cycle[0]
    })
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    themeStore.disconnect(this)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    super.willUpdate(changed)
    const current = themeStore.mode
    // Set from outside, by attribute or property: switch the page at once.
    if (
      changed.has('mode') &&
      current &&
      this.mode !== current &&
      this.isConnected
    ) {
      if (isMode(this.mode)) themeStore.set(this.mode, true, this.storageKey)
      else this.mode = current
    }
  }

  private text(
    key: 'name' | 'systemName' | 'announcement',
    mode: ThemeMode,
  ): string {
    const labels = { ...DEFAULT_LABELS, ...this.labels }
    return fill(labels[key], {
      mode: labels[mode],
      theme: labels[themeStore.resolve(mode)],
      next: labels[this.next],
    })
  }

  private readonly handlePress = (event: Event): void => {
    // The toggle reports through `change`; its inner button's `press` stays inside.
    event.stopPropagation()
    if (
      this.transition === 'none' ||
      prefersReducedMotion() ||
      typeof document.startViewTransition !== 'function'
    ) {
      this.commit()
      return
    }
    const box = this.getBoundingClientRect()
    const x = box.left + box.width / 2
    const y = box.top + box.height / 2
    const radius = Math.ceil(
      Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)),
    )
    const root = document.documentElement
    adoptRevealSheet()
    root.setAttribute(REVEAL_ATTRIBUTE, '')
    const reveal = document.startViewTransition(async () => {
      this.commit()
      await this.updateComplete
    })
    activeReveal = reveal
    reveal.ready.then(
      () =>
        root.animate?.(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 450,
            easing: `cubic-bezier(${EASE_OUT.join(', ')})`,
            pseudoElement: '::view-transition-new(root)',
          },
        ),
      () => {},
    )
    const done = () => {
      if (activeReveal !== reveal) return
      activeReveal = undefined
      root.removeAttribute(REVEAL_ATTRIBUTE)
    }
    reveal.finished.then(done, done)
  }

  /** Fires `change`, then moves every toggle to the next mode and, unless cancelled, applies it. */
  private commit(): void {
    const mode = this.next
    if (!this.isConnected || mode === themeStore.mode) return
    const isApplied = this.dispatchEvent(
      new CustomEvent<ThemeToggleChangeDetail>('change', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { mode, resolvedTheme: themeStore.resolve(mode) },
      }),
    )
    themeStore.set(mode, isApplied, this.storageKey)
    this.announcement = this.text('announcement', mode)
  }

  protected override render() {
    const shown = this.shown
    const name =
      this.ariaLabel ||
      this.text(shown === 'system' ? 'systemName' : 'name', shown)
    return html`
      <moul-button
        part="button"
        variant=${this.variant}
        size=${this.size}
        is-icon
        @press=${this.handlePress}
      >
        <moul-icon-morph part="icon" class="icon" name=${ICONS[shown]}></moul-icon-morph>
        <span class="sr-only">${name}</span>
      </moul-button>
      <span part="status" class="sr-only" role="status">${this.announcement}</span>
    `
  }
}

defineElement('moul-theme-toggle', MoulThemeToggle)

declare global {
  interface HTMLElementTagNameMap {
    'moul-theme-toggle': MoulThemeToggle
  }
}
