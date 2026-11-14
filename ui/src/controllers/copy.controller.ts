import type { ReactiveController, ReactiveControllerHost } from 'lit'
import { copyText } from '../utils/clipboard'

export interface CopyControllerOptions {
  /** Milliseconds the copied state lasts. Defaults to 2000. */
  resetAfter?: number
}

/**
 * Copies text for an element's copy button and remembers, for a moment,
 * which button did it, so the button can show a check and a live region can
 * say "Copied". One controller serves several buttons: pass each a `key`.
 */
export class CopyController implements ReactiveController {
  /** The key of the last copy that worked, until it resets; null otherwise. */
  copiedKey: string | null = null
  /** The outcome of the last copy, until it resets: what a live region should say. */
  status: 'copied' | 'failed' | null = null

  private readonly host: ReactiveControllerHost
  private readonly resetAfter: number
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(
    host: ReactiveControllerHost,
    options: CopyControllerOptions = {},
  ) {
    this.host = host
    this.resetAfter = options.resetAfter ?? 2000
    host.addController(this)
  }

  /** True while the copy made with `key` shows as done. */
  isCopied(key = ''): boolean {
    return this.copiedKey === key
  }

  /** Copies `text`; resolves with whether it reached the clipboard. */
  async copy(text: string, key = ''): Promise<boolean> {
    const isCopied = await copyText(text)
    clearTimeout(this.timer)
    this.copiedKey = isCopied ? key : null
    this.status = isCopied ? 'copied' : 'failed'
    this.host.requestUpdate()
    this.timer = setTimeout(() => this.reset(), this.resetAfter)
    return isCopied
  }

  hostDisconnected(): void {
    clearTimeout(this.timer)
    this.copiedKey = null
    this.status = null
  }

  private reset(): void {
    this.copiedKey = null
    this.status = null
    this.host.requestUpdate()
  }
}
