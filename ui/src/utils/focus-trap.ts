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
 * Returns an array of visible, focusable HTML elements within a container,
 * inspecting both Shadow DOM and slotted Light DOM elements.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) return []

  const result: HTMLElement[] = []
  const visited = new Set<HTMLElement>()

  function isVisible(el: HTMLElement): boolean {
    const isHiddenAttr =
      el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true'
    const style =
      typeof window !== 'undefined' && window.getComputedStyle
        ? window.getComputedStyle(el)
        : el.style
    const isHiddenStyle =
      style?.display === 'none' || style?.visibility === 'hidden'
    return !isHiddenAttr && !isHiddenStyle
  }

  function checkElement(el: HTMLElement): void {
    if (visited.has(el)) return
    visited.add(el)
    if (
      typeof el.matches === 'function' &&
      el.matches(FOCUSABLE_ELEMENTS_SELECTOR) &&
      isVisible(el)
    ) {
      result.push(el)
    }
  }

  function traverse(node: Element): void {
    if (
      typeof HTMLSlotElement !== 'undefined' &&
      node instanceof HTMLSlotElement
    ) {
      const assigned =
        typeof node.assignedElements === 'function'
          ? node.assignedElements({ flatten: true })
          : []
      for (const el of assigned) {
        if (el instanceof HTMLElement) {
          checkElement(el)
          if (typeof el.querySelectorAll === 'function') {
            const innerFocusables = el.querySelectorAll<HTMLElement>(
              FOCUSABLE_ELEMENTS_SELECTOR,
            )
            for (const inner of Array.from(innerFocusables)) {
              checkElement(inner)
            }
          }
        }
      }
      return
    }

    if (node.shadowRoot) {
      for (const child of Array.from(node.shadowRoot.children)) {
        traverse(child)
      }
      return
    }

    if (node !== container && node instanceof HTMLElement) {
      checkElement(node)
    }

    for (const child of Array.from(node.children)) {
      traverse(child)
    }
  }

  traverse(container)

  // Fallback / safeguard if traverse didn't find elements but querySelectorAll does
  if (result.length === 0 && typeof container.querySelectorAll === 'function') {
    const rawElements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR),
    )
    for (const el of rawElements) {
      checkElement(el)
    }
  }

  return result
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

  const rootNode =
    typeof container.getRootNode === 'function' ? container.getRootNode() : null
  const shadowHost =
    rootNode &&
    typeof ShadowRoot !== 'undefined' &&
    rootNode instanceof ShadowRoot
      ? (rootNode as ShadowRoot).host
      : null

  const isInside =
    Boolean(active) &&
    (focusables.includes(active as HTMLElement) ||
      container.contains(active as Node) ||
      Boolean(shadowHost?.contains(active as Node)))

  if (event.shiftKey) {
    if (active === first || !isInside) {
      event.preventDefault()
      last.focus()
    }
  } else {
    if (active === last || !isInside) {
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
