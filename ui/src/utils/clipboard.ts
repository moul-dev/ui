/** The focused element, looking through open shadow roots. */
function deepActiveElement(): HTMLElement | null {
  let active = document.activeElement
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement
  }
  return active instanceof HTMLElement ? active : null
}

/**
 * Copies `text` to the clipboard and resolves with whether it worked. It uses
 * the async Clipboard API, and falls back to a hidden textarea and
 * `execCommand('copy')` where that API is missing or refused (an insecure
 * origin, an iframe without permission). Focus returns to where it was.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Refused: try the fallback below.
  }
  if (typeof document === 'undefined' || !document.body) return false
  const focused = deepActiveElement()
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.setAttribute('aria-hidden', 'true')
  area.style.cssText =
    'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none'
  document.body.append(area)
  area.select()
  let isCopied = false
  try {
    isCopied = document.execCommand('copy')
  } catch {
    isCopied = false
  }
  area.remove()
  focused?.focus({ preventScroll: true })
  return isCopied
}
