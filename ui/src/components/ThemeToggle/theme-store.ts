/** Follow the OS, or force the light or the dark theme. */
export type ThemeMode = 'system' | 'light' | 'dark'

/** The theme on screen. */
export type ResolvedTheme = 'light' | 'dark'

export const MODES: readonly ThemeMode[] = ['system', 'light', 'dark']

export const isMode = (value: unknown): value is ThemeMode =>
  MODES.includes(value as ThemeMode)

/** What the store needs from a toggle. */
interface ThemeStoreClient {
  mode: ThemeMode
  storageKey: string
  requestUpdate(): void
}

/** Reads a saved mode; an empty key means persistence is off. */
export function readStored(key: string): string | null {
  if (!key) return null
  try {
    return localStorage.getItem(key)
  } catch {
    // Storage can be blocked (strict privacy modes, sandboxed iframes).
    return null
  }
}

function writeStored(key: string, mode: ThemeMode): void {
  if (!key) return
  try {
    localStorage.setItem(key, mode)
  } catch {
    // The theme still applies to this page; it just is not remembered.
  }
}

const systemQuery = (): MediaQueryList | null =>
  typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null

/**
 * The page's one theme mode, shared by every `moul-theme-toggle`. The first
 * toggle to connect starts it and the last to leave stops its listeners and
 * forgets the mode, so the next toggle starts again from storage.
 */
class ThemeStore {
  mode: ThemeMode | null = null
  /** False after a cancelled `change`: the app applies the theme, so OS changes leave `<html>` alone. */
  private isApplied = true
  private readonly toggles = new Set<ThemeStoreClient>()
  private query: MediaQueryList | null = null

  /** The theme `mode` puts on screen (the current mode by default). */
  resolve(mode: ThemeMode | null = this.mode): ResolvedTheme {
    if (mode !== 'system') return mode ?? 'light'
    return (this.query ?? systemQuery())?.matches ? 'dark' : 'light'
  }

  /** Adds a toggle; the first one decides the starting mode with `startMode`. */
  connect(toggle: ThemeStoreClient, startMode: () => ThemeMode): void {
    if (this.toggles.size === 0) {
      this.query = systemQuery()
      this.query?.addEventListener?.('change', this.onSystemChange)
      window.addEventListener('storage', this.onStorage)
    }
    this.toggles.add(toggle)
    if (this.mode === null) {
      this.mode = startMode()
      this.isApplied = true
      this.apply()
    }
    toggle.mode = this.mode
  }

  disconnect(toggle: ThemeStoreClient): void {
    if (!this.toggles.delete(toggle) || this.toggles.size > 0) return
    this.query?.removeEventListener?.('change', this.onSystemChange)
    window.removeEventListener('storage', this.onStorage)
    this.query = null
    this.mode = null
  }

  /**
   * Moves every toggle to `mode`. With `apply` it also sets the theme on
   * `<html>` and saves it under `storageKey` (none when empty); without, the
   * app has taken over and both are left alone.
   */
  set(mode: ThemeMode, apply: boolean, storageKey = ''): void {
    this.mode = mode
    this.isApplied = apply
    if (apply) {
      writeStored(storageKey, mode)
      this.apply()
    }
    for (const toggle of this.toggles) {
      toggle.mode = mode
      toggle.requestUpdate()
    }
  }

  /** The same two writes as the inline `<head>` script in the docs. */
  private apply(): void {
    if (!this.mode) return
    const root = document.documentElement
    const theme = this.resolve()
    const scheme = this.mode === 'system' ? 'light dark' : this.mode
    if (root.getAttribute('data-theme') !== theme) {
      root.setAttribute('data-theme', theme)
    }
    if (root.style.colorScheme !== scheme) root.style.colorScheme = scheme
  }

  private readonly onSystemChange = (): void => {
    if (this.mode) this.set(this.mode, this.isApplied)
  }

  /** Another tab saved a mode under a key one of the toggles uses. */
  private readonly onStorage = (event: StorageEvent): void => {
    const { key, newValue } = event
    if (!key || !isMode(newValue) || newValue === this.mode) return
    if ([...this.toggles].some((toggle) => toggle.storageKey === key)) {
      this.set(newValue, true)
    }
  }
}

export const themeStore = new ThemeStore()
