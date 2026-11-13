import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import { treeStyles } from './Tree.styles'
import {
  childItems,
  isItem,
  itemLabel,
  type MoulTreeItem,
  setAttr,
} from './TreeItem'

export type TreeSelectionMode = 'none' | 'single' | 'multiple'

export interface TreeSelectionChangeDetail {
  selectedKeys: string[]
}

export interface TreeExpandedChangeDetail {
  value: string
  isExpanded: boolean
  item: MoulTreeItem
}

export interface TreeActionDetail {
  value: string
  item: MoulTreeItem
}

const MODES: TreeSelectionMode[] = ['none', 'single', 'multiple']
const OBSERVED = [
  'value',
  'label',
  'hidden',
  'is-expanded',
  'is-selected',
  'is-disabled',
  'has-children',
]

/**
 * A collapsible tree of `<moul-tree-item>` nodes, nested in light DOM, for
 * file browsers, nested navigation and outlines. Branches open with a spring
 * and guide lines branch from each parent to its children. Items can be
 * selected one at a time (`selection-mode="single"`, the default), several at
 * once (`multiple`) or not at all (`none`), and activated, which fires
 * `action`.
 *
 * Keyboard and screen readers: the host has `role="tree"` (with
 * `aria-multiselectable` in multiple mode), named by `label` or your own
 * `aria-label`, and follows the WAI-ARIA tree view pattern with one tab stop
 * (a roving `tabindex` that starts on the first selected item, else the
 * first). `Arrow Down` and `Arrow Up` move through the visible items without
 * wrapping; `Arrow Right` opens a closed branch or moves to the first child
 * of an open one; `Arrow Left` closes an open branch or moves to the parent
 * (the two swap under `dir="rtl"`); `Home` and `End` go to the first and last
 * visible item; `*` opens every sibling branch; typing letters moves to the
 * next item whose label starts with them. `Enter` activates the item (and
 * selects it in single mode); `Space` selects it in single mode and toggles
 * it in multiple mode. A click on the chevron toggles the branch; a click on
 * the row selects it (toggles it in multiple mode), and a double-click
 * activates it. In `none` mode a single click activates instead. Activating
 * a branch also opens or closes it unless an `action` listener calls
 * `preventDefault()`. Disabled items can be focused and opened but are never
 * selected or activated. There is no range selection with `Shift`. When a
 * branch closes over the focused item, focus moves to that branch. Screen
 * readers hear `aria-selected="true"` on selected items; in multiple mode the
 * other selectable items carry `"false"`, and in `none` mode no item carries
 * it. Only user actions fire events; setting `selectedKeys` or `is-expanded`
 * from code does not.
 *
 * Reduced motion: branches open and close at once instead of growing with a
 * spring, the chevron turns and the row colours change without easing, and
 * the guide lines are static instead of drawing from parent to children.
 *
 * @slot - The top-level `moul-tree-item` elements (direct children only).
 * @fires selectionchange - The user changed the selection; `detail.selectedKeys` is the new `string[]`.
 * @fires expandedchange - The user opened or closed a branch; `detail` is `{ value, isExpanded, item }`.
 * @fires action - An item was activated (`Enter`, a click in `none` mode, a double-click otherwise); `detail` is `{ value, item }`. Cancelable: `preventDefault()` keeps a branch from toggling.
 * @cssprop --moul-tree-indent - How far each level is indented (default `1.5rem`).
 * @cssprop --moul-tree-guide-color - The guide line colour (default `var(--color-border)`); `transparent` hides the lines.
 */
export class MoulTree extends LitElement {
  static override styles = treeStyles

  static override properties = {
    selectionMode: { type: String, reflect: true, attribute: 'selection-mode' },
    selectedKeys: { attribute: false },
    label: { type: String },
  }

  declare selectionMode: TreeSelectionMode
  /** The `value`s of the selected items. Set it to select from code. */
  declare selectedKeys: string[]
  /** The tree's accessible name, set as `aria-label`. */
  declare label: string

  /** The item holding the tab stop. */
  private active: MoulTreeItem | null = null
  /** What the tree last wrote to each item's `isSelected`, to spot changes made on the item. */
  private readonly written = new WeakMap<MoulTreeItem, boolean>()
  /** The `aria-label` the tree last wrote to each item, to leave an author's own alone. */
  private readonly names = new WeakMap<MoulTreeItem, string>()
  private observer: MutationObserver | null = null
  private typed = ''
  private typedTimer = 0

  constructor() {
    super()
    this.selectionMode = 'single'
    this.selectedKeys = []
    this.label = ''
    // Listeners on the host itself, so they live as long as the element.
    this.addEventListener('keydown', this.handleKeyDown)
    this.addEventListener('click', this.handleClick)
    this.addEventListener('dblclick', this.handleDoubleClick)
    this.addEventListener('focusin', this.handleFocusIn)
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'tree')
    // Items added, removed, renamed or changed anywhere below re-run the sync.
    this.observer = new MutationObserver(() => this.requestUpdate())
    this.observer.observe(this, {
      childList: true,
      subtree: true,
      characterData: true,
      attributeFilter: OBSERVED,
    })
    // Catch up on anything that changed while the tree was detached.
    this.requestUpdate()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.observer?.disconnect()
    this.observer = null
    clearTimeout(this.typedTimer)
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!MODES.includes(this.selectionMode)) this.selectionMode = 'single'
    if (!Array.isArray(this.selectedKeys)) this.selectedKeys = []
    if (this.selectionMode === 'single' && this.selectedKeys.length > 1) {
      this.selectedKeys = this.selectedKeys.slice(0, 1)
    }
    if (changed.has('label') && (this.label || changed.get('label'))) {
      setAttr(this, 'aria-label', this.label || null)
    }
    setAttr(
      this,
      'aria-multiselectable',
      this.selectionMode === 'multiple' ? 'true' : null,
    )
    this.sync()
  }

  /** Writes levels, positions, names, selection and the tab stop onto every item. */
  private sync(): void {
    const mode = this.selectionMode
    const items: MoulTreeItem[] = []
    const walk = (parent: Element, level: number): void => {
      const siblings = childItems(parent)
      siblings.forEach((item, index) => {
        items.push(item)
        setAttr(item, 'aria-level', String(level))
        setAttr(item, 'aria-setsize', String(siblings.length))
        setAttr(item, 'aria-posinset', String(index + 1))
        item.isLast = index === siblings.length - 1
        const current = item.getAttribute('aria-label')
        if (current === null || current === this.names.get(item)) {
          const name = itemLabel(item)
          this.names.set(item, name)
          setAttr(item, 'aria-label', name || null)
        }
        walk(item, level + 1)
      })
    }
    walk(this, 1)

    if (mode !== 'none') {
      // Adopt `is-selected` set on an item (in markup or code) since the last write.
      let keys = this.selectedKeys
      for (const item of items) {
        if (!item.value || item.isSelected === !!this.written.get(item))
          continue
        if (!item.isSelected) keys = keys.filter((key) => key !== item.value)
        else keys = mode === 'single' ? [item.value] : [...keys, item.value]
      }
      if (keys !== this.selectedKeys) this.selectedKeys = [...new Set(keys)]
    }
    const selected = new Set(mode === 'none' ? [] : this.selectedKeys)
    for (const item of items) {
      const isSelected = !!item.value && selected.has(item.value)
      item.isSelected = isSelected
      this.written.set(item, isSelected)
      // As the APG tree pattern asks: single mode marks only the selected
      // item; multiple mode marks every selectable item true or false.
      const canSelect = mode === 'multiple' && !item.isDisabled
      setAttr(
        item,
        'aria-selected',
        isSelected ? 'true' : canSelect ? 'false' : null,
      )
    }

    const visible = this.visibleItems()
    let active = this.active
    if (active && !visible.includes(active)) {
      // Hidden by a closed ancestor, or removed: hand the stop to the nearest open ancestor.
      const hadFocus = this.focusedItem() === active
      let parent = active.parentElement
      while (isItem(parent) && !visible.includes(parent)) {
        parent = parent.parentElement
      }
      active =
        isItem(parent) && parent.closest('moul-tree') === this ? parent : null
      if (hadFocus) active?.focus()
    }
    this.active =
      active ??
      visible.find((item) => item.isSelected && !item.isDisabled) ??
      visible[0] ??
      null
    for (const item of items) {
      setAttr(item, 'tabindex', item === this.active ? '0' : '-1')
    }
  }

  /** Items whose ancestors are all open, in display order. */
  private visibleItems(): MoulTreeItem[] {
    const visible: MoulTreeItem[] = []
    const walk = (parent: Element): void => {
      for (const item of childItems(parent)) {
        visible.push(item)
        if (item.isExpanded) walk(item)
      }
    }
    walk(this)
    return visible
  }

  private focusedItem(): MoulTreeItem | null {
    const focused = (this.getRootNode() as Document | ShadowRoot).activeElement
    return isItem(focused) ? focused : null
  }

  private ownItem(node: EventTarget | null | undefined): MoulTreeItem | null {
    const item = node instanceof Element ? node.closest('moul-tree-item') : null
    return item && item.closest('moul-tree') === this ? item : null
  }

  private setActive(item: MoulTreeItem): void {
    if (this.active === item) return
    if (this.active) setAttr(this.active, 'tabindex', '-1')
    this.active = item
    setAttr(item, 'tabindex', '0')
  }

  private focusItem(item: MoulTreeItem | null | undefined): void {
    if (!item) return
    this.setActive(item)
    item.focus()
  }

  private emit(type: string, detail: unknown, cancelable = false): boolean {
    return this.dispatchEvent(
      new CustomEvent(type, {
        bubbles: true,
        composed: true,
        cancelable,
        detail,
      }),
    )
  }

  private setExpanded(item: MoulTreeItem, isExpanded: boolean): void {
    if (!item.isBranch || item.isExpanded === isExpanded) return
    item.isExpanded = isExpanded
    this.emit('expandedchange', { value: item.value, isExpanded, item })
  }

  /** Selects the item in single mode, toggles it in multiple mode. */
  private select(item: MoulTreeItem): void {
    const { value } = item
    const has = this.selectedKeys.includes(value)
    if (this.selectionMode === 'none' || item.isDisabled || !value) return
    if (this.selectionMode === 'single' && has) return
    this.selectedKeys =
      this.selectionMode === 'single'
        ? [value]
        : has
          ? this.selectedKeys.filter((key) => key !== value)
          : [...this.selectedKeys, value]
    this.emit('selectionchange', { selectedKeys: [...this.selectedKeys] })
  }

  private activate(item: MoulTreeItem): void {
    if (item.isDisabled) return
    if (this.emit('action', { value: item.value, item }, true)) {
      this.setExpanded(item, !item.isExpanded)
    }
  }

  /** The item whose row the event went through, and whether it hit the chevron. */
  private hit(event: Event): { item: MoulTreeItem; onToggle: boolean } | null {
    const path = event.composedPath()
    const item = this.ownItem(path.find(isItem))
    const root = item?.shadowRoot
    if (!item || !root) return null
    const through = (part: string) =>
      path.includes(root.querySelector(`[part~="${part}"]`) as Element)
    return through('row') ? { item, onToggle: through('toggle') } : null
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const hit = this.hit(event)
    if (!hit) return
    const { item, onToggle } = hit
    this.focusItem(item)
    if (onToggle && item.isBranch) {
      this.setExpanded(item, !item.isExpanded)
    } else if (event.detail < 2) {
      // The second click of a double-click is left to `dblclick`.
      if (this.selectionMode === 'none') this.activate(item)
      else this.select(item)
    }
  }

  private readonly handleDoubleClick = (event: MouseEvent): void => {
    const hit = this.hit(event)
    if (hit && !hit.onToggle && this.selectionMode !== 'none') {
      this.activate(hit.item)
    }
  }

  private readonly handleFocusIn = (event: FocusEvent): void => {
    const item = this.ownItem(event.target)
    if (item) this.setActive(item)
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const item = this.ownItem(event.target)
    if (!item || event.altKey) return
    const visible = this.visibleItems()
    const index = visible.indexOf(item)
    let key = event.key
    const horizontal = key === 'ArrowLeft' || key === 'ArrowRight'
    if (horizontal && getComputedStyle(this).direction === 'rtl') {
      key = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft'
    }
    switch (key) {
      case 'ArrowDown':
        this.focusItem(visible[index + 1])
        break
      case 'ArrowUp':
        this.focusItem(visible[index - 1])
        break
      case 'Home':
        this.focusItem(visible[0])
        break
      case 'End':
        this.focusItem(visible[visible.length - 1])
        break
      case 'ArrowRight':
        if (item.isExpanded) this.focusItem(childItems(item)[0])
        else this.setExpanded(item, true)
        break
      case 'ArrowLeft':
        if (item.isExpanded && item.isBranch) this.setExpanded(item, false)
        else if (isItem(item.parentElement)) this.focusItem(item.parentElement)
        break
      case 'Enter':
        if (this.selectionMode === 'single') this.select(item)
        this.activate(item)
        break
      case ' ':
        this.select(item)
        break
      case '*':
        for (const sibling of childItems(item.parentElement as Element)) {
          this.setExpanded(sibling, true)
        }
        break
      default:
        if (key.length !== 1 || event.ctrlKey || event.metaKey) return
        this.typeAhead(key, visible, index)
    }
    event.preventDefault()
  }

  /** Moves to the next visible item whose label starts with the typed text. */
  private typeAhead(
    char: string,
    visible: MoulTreeItem[],
    index: number,
  ): void {
    clearTimeout(this.typedTimer)
    this.typedTimer = window.setTimeout(() => {
      this.typed = ''
    }, 500)
    this.typed += char.toLowerCase()
    // Pressing one letter again cycles through the items that start with it.
    const repeated = [...this.typed].every((c) => c === this.typed[0])
    const query = repeated ? this.typed[0] : this.typed
    const start = repeated ? index + 1 : index
    for (let n = 0; n < visible.length; n++) {
      const candidate = visible[(start + n) % visible.length]
      if (itemLabel(candidate).toLowerCase().startsWith(query)) {
        this.focusItem(candidate)
        return
      }
    }
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-tree', MoulTree)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tree': MoulTree
  }
}
