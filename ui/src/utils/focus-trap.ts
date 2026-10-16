/**
 * Focus management, modal safety, and popover/anchor fallback utilities.
 *
 * Implements Requirements 6.3, 6.4, 6.8, 6.9, and 6.10:
 * - `safeShowModal`: invokes dialog.showModal() safely, catching disconnected DOMException.
 * - `focusFirstElement`: focuses the first interactive descendant within <100ms.
 * - `trapFocus`: traps Tab and Shift+Tab within a modal boundary.
 * - `restoreFocus`: returns focus to the initiating element on close.
 * - `supportsNativePopoverAndAnchor`: feature detection for Popover API and CSS Anchor Positioning.
 */

export const FOCUSABLE_ELEMENTS_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"]):not([disabled])',
  'details:not([disabled])',
  '[contenteditable="true"]',
].join(', ')

/**
 * Checks whether the host runtime natively supports the Popover API
 * and CSS Anchor Positioning (Requirement 6.9).
 */
export function supportsNativePopoverAndAnchor(): boolean {
  const hasPopover =
    typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype
  const hasAnchor =
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name', '--moul-anchor')
  return Boolean(hasPopover && hasAnchor)
}

/**
 * Returns an array of visible, focusable HTML elements within a container.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return []
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
  )
  return elements.filter((el) => {
    const isHiddenAttr =
      el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true'
    const style =
      typeof window !== 'undefined' && window.getComputedStyle
        ? window.getComputedStyle(el)
        : el.style
    const isHiddenStyle =
      style.display === 'none' || style.visibility === 'hidden'
    return !isHiddenAttr && !isHiddenStyle
  })
}

/**
 * Focuses the first focusable interactive element within root.
 * Falls back to focusing the container itself if no focusable children are found.
 */
export function focusFirstElement(root: HTMLElement): HTMLElement | null {
  if (!root) return null
  const focusables = getFocusableElements(root)
  const target =
    focusables[0] ?? (typeof root.focus === 'function' ? root : null)
  if (target && typeof target.focus === 'function') {
    try {
      target.focus()
      return target
    } catch {
      return null
    }
  }
  return null
}

/**
 * Traps keyboard Tab and Shift+Tab within container.
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return

  const focusables = getFocusableElements(container)
  if (focusables.length === 0) {
    event.preventDefault()
    return
  }

  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  const doc = container.ownerDocument || document
  const active = doc.activeElement

  if (event.shiftKey) {
    if (active === first || !container.contains(active as Node)) {
      event.preventDefault()
      last.focus()
    }
  } else {
    if (active === last || !container.contains(active as Node)) {
      event.preventDefault()
      first.focus()
    }
  }
}

/**
 * Safely calls dialog.showModal().
 * If dialog is disconnected, catches DOMException, logs console.warn, and does NOT focus children (Req 6.10).
 * If modal successfully opens, focuses the first focusable element within <100ms.
 */
export function safeShowModal(
  dialog: HTMLDialogElement | null,
  focusRoot?: HTMLElement,
): boolean {
  if (!dialog) return false
  try {
    if (!dialog.open) {
      dialog.showModal()
    }
  } catch (err) {
    console.warn(
      '[@moul-dev/ui] Failed to call dialog.showModal() (element may be disconnected):',
      err,
    )
    return false
  }
  focusFirstElement(focusRoot ?? dialog)
  return true
}

/**
 * Restores focus to a previously active element upon modal/popover dismissal.
 */
export function restoreFocus(previousActiveElement: HTMLElement | null): void {
  if (
    previousActiveElement &&
    typeof previousActiveElement.focus === 'function'
  ) {
    try {
      previousActiveElement.focus()
    } catch {
      // Silently ignore if previous element has unmounted or is disconnected
    }
  }
}
