/**
 * Finding the box a scroll-linked effect scrolls in, shared by the scroll
 * effects (sticky stack, scroll parallax, sticky scroll, scroll frame,
 * tracing beam, scroll text) so their script fallbacks and observers follow
 * the same box the browser's own sticky and timeline logic follows.
 */

export interface FindScrollRootOptions {
  /**
   * Skip ancestors with `overflow: hidden`, which clip but never scroll.
   * The browser counts them as scroll containers, so a native `view()`
   * timeline or `position: sticky` binds to them; leave this off to match
   * that. Turn it on for an effect that names its scroll source itself
   * (a `ScrollTimeline` with an explicit `source`), so a clipping wrapper
   * does not freeze it.
   */
  skipHidden?: boolean
}

/**
 * The nearest ancestor, across shadow roots and slots, that is a scroll
 * container on the block axis: its `overflow-y` is anything but `visible` or
 * `clip` (and, with `skipHidden`, not `hidden`). Returns null when the page
 * itself scrolls the element.
 */
export function findScrollRoot(
  el: Element,
  options: FindScrollRootOptions = {},
): Element | null {
  if (typeof document === 'undefined' || typeof getComputedStyle !== 'function')
    return null
  const page = document.scrollingElement ?? document.documentElement
  let node = flatParent(el)
  while (node instanceof Element) {
    if (node === page || node === document.body) return null
    if (node.localName !== 'slot') {
      const overflow = getComputedStyle(node).overflowY
      if (
        overflow &&
        overflow !== 'visible' &&
        overflow !== 'clip' &&
        !(options.skipHidden && overflow === 'hidden')
      ) {
        return node
      }
    }
    node = flatParent(node)
  }
  return null
}

/** The parent in the flat tree: the slot a slotted node is shown in, or the host of a shadow root. */
function flatParent(node: Node): Node | null {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot
  const parent = node.parentNode
  if (
    parent &&
    typeof ShadowRoot !== 'undefined' &&
    parent instanceof ShadowRoot
  )
    return parent.host
  return parent
}

/** The height of the visible area of a scroll container, or of the viewport for the page. */
export function scrollPortHeight(root: Element | null): number {
  if (root) return root.clientHeight
  return typeof window === 'undefined' ? 0 : window.innerHeight
}

/** The top of the visible area of a scroll container, in viewport coordinates. */
export function scrollPortTop(root: Element | null): number {
  if (!root) return 0
  return root.getBoundingClientRect().top + root.clientTop
}
