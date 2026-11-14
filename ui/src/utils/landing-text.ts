import { css, type ReactiveController, type ReactiveControllerHost } from 'lit'

/** HTML's own whitespace (not the no-break space, which keeps its meaning). */
const HTML_WHITESPACE = /[ \t\n\r\f]+/g

/**
 * Keeps the text written inside a landing-kit text effect, such as
 * `<moul-typewriter>Ship on Friday</moul-typewriter>`, so the text is in the
 * HTML and shows before the script loads. Reads the host's light-DOM text,
 * with runs of whitespace collapsed and trimmed as HTML shows them, and reads
 * it again whenever that text changes, re-rendering the host. Markup inside
 * counts only for its text.
 */
export class LightTextController implements ReactiveController {
  /** The light-DOM text, whitespace collapsed. */
  public text = ''

  private readonly host: ReactiveControllerHost & HTMLElement
  private observer: MutationObserver | null = null

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this.host = host
    this.host.addController(this)
  }

  public hostConnected(): void {
    this.read()
    if (typeof MutationObserver !== 'function') return
    this.observer = new MutationObserver(() => this.read())
    this.observer.observe(this.host, {
      characterData: true,
      childList: true,
      subtree: true,
    })
  }

  public hostDisconnected(): void {
    this.observer?.disconnect()
    this.observer = null
  }

  private read(): void {
    const text = (this.host.textContent ?? '')
      .replace(HTML_WHITESPACE, ' ')
      .trim()
    if (text === this.text) return
    this.text = text
    this.host.requestUpdate()
  }
}

/** The nearest `lang` above `host`, for word and letter boundaries such as Khmer's. */
export function inheritedLang(host: Element): string | undefined {
  return host.closest('[lang]')?.getAttribute('lang') || undefined
}

/** A millisecond attribute as a usable number: never negative, `fallback` when unset or not a number. */
export function milliseconds(
  value: number | null | undefined,
  fallback: number,
): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : fallback
}

/** Hides the readable copy from sight but not from screen readers. */
export const readableCopyStyles = css`
  .readable {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
    user-select: none;
  }
`
