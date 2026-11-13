import { html, LitElement, nothing, type PropertyValues } from 'lit'
import type { AnimationPlaybackControls } from 'motion'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import {
  EASE_OUT,
  prefersReducedMotion,
  SPRING_GENTLE,
  subtleAnimate,
} from '../../utils/motion'
import { treeItemStyles } from './Tree.styles'

export const isItem = (node: unknown): node is MoulTreeItem =>
  node instanceof Element && node.localName === 'moul-tree-item'

/** The visible `moul-tree-item` children of a tree or an item. */
export const childItems = (parent: Element): MoulTreeItem[] =>
  Array.from(parent.children).filter(
    (child): child is MoulTreeItem => isItem(child) && !child.hidden,
  )

/** The item's own name: its `label`, else the text of its `slot="label"` element. */
export const itemLabel = (item: MoulTreeItem): string =>
  item.label ||
  (
    Array.from(item.children).find((child) => child.slot === 'label')
      ?.textContent ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim()

/** Sets or removes an attribute, touching the DOM only when it changes. */
export function setAttr(el: Element, name: string, value: string | null): void {
  if (el.getAttribute(name) === value) return
  if (value === null) el.removeAttribute(name)
  else el.setAttribute(name, value)
}

/**
 * One node of a `<moul-tree>`: a row with a chevron, an optional icon, a label
 * and optional meta, plus the `moul-tree-item` children nested inside it, which
 * open and close under it. A `value` identifies it in `selectedKeys` and in the
 * tree's events. `has-children` marks a branch whose children are loaded
 * later: it shows the chevron and the tree fires `expandedchange` when it
 * opens, so the app can append them then.
 *
 * Keyboard and screen readers: the host is the focus target, with
 * `role="treeitem"`; the parent `<moul-tree>` sets `aria-level`,
 * `aria-setsize`, `aria-posinset`, `aria-selected`, the roving `tabindex`,
 * and `aria-label` from `label` (else the `slot="label"` text), so the name
 * leaves out the nested items' text; an `aria-label` you set yourself is
 * kept. The item adds `aria-expanded` on branches only and `aria-disabled`
 * when disabled, and its children sit in a `role="group"` container inside
 * its shadow root. The tree handles every key. The `suffix` text is not part
 * of the name, so screen readers do not hear it.
 *
 * Reduced motion: opening and closing do not animate the children's height
 * with a spring, the chevron turns at once, and the guide lines appear static
 * instead of drawing from the parent down to each child.
 *
 * @slot - Nested `moul-tree-item` children (direct children only).
 * @slot label - A rich label, used instead of the `label` text.
 * @slot prefix - An icon before the label.
 * @slot suffix - Non-interactive meta after the label, such as a count.
 * @csspart row - The clickable row: chevron, prefix, label and suffix.
 * @csspart toggle - The chevron box (empty on a leaf).
 * @csspart label - The label wrapper.
 * @csspart guide - The guide line from the parent to this item.
 * @csspart group - The `role="group"` container of the children.
 */
export class MoulTreeItem extends LitElement {
  static override styles = treeItemStyles

  static override properties = {
    value: { type: String, reflect: true },
    label: { type: String, reflect: true },
    isExpanded: { type: Boolean, reflect: true, attribute: 'is-expanded' },
    isSelected: { type: Boolean, reflect: true, attribute: 'is-selected' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    hasChildren: { type: Boolean, reflect: true, attribute: 'has-children' },
    isLast: { state: true },
  }

  declare value: string
  declare label: string
  declare isExpanded: boolean
  declare isSelected: boolean
  declare isDisabled: boolean
  declare hasChildren: boolean
  /**
   * Set by the tree: the last of its siblings, so its guide line ends here.
   * @internal
   */
  declare isLast: boolean

  private motion: AnimationPlaybackControls | null = null
  private motionToken = 0
  private itemCount = 0

  constructor() {
    super()
    this.value = ''
    this.label = ''
    this.isExpanded = false
    this.isSelected = false
    this.isDisabled = false
    this.hasChildren = false
    this.isLast = false
  }

  /** True when the item has children, or `has-children` promises some. */
  get isBranch(): boolean {
    return this.hasChildren || childItems(this).length > 0
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('role', 'treeitem')
  }

  protected override firstUpdated(): void {
    this.itemCount = childItems(this).length
  }

  protected override updated(changed: PropertyValues<this>): void {
    setAttr(
      this,
      'aria-expanded',
      this.isBranch ? String(this.isExpanded) : null,
    )
    setAttr(this, 'aria-disabled', this.isDisabled ? 'true' : null)
    if (changed.has('isExpanded')) {
      this.syncGroup(changed.get('isExpanded') !== undefined)
    }
  }

  private get group(): HTMLElement | null {
    return this.renderRoot.querySelector('[part~="group"]')
  }

  /** Opens or closes the children container, with a height spring unless motion is reduced. */
  private syncGroup(animate: boolean, fromZero = false): void {
    const group = this.group
    if (!group) return
    const token = ++this.motionToken
    if (!animate || prefersReducedMotion()) {
      this.motion?.stop()
      group.hidden = !this.isExpanded
      group.style.removeProperty('height')
      group.removeAttribute('data-animating')
      return
    }
    const from =
      fromZero || group.hidden ? 0 : group.getBoundingClientRect().height
    this.motion?.stop()
    group.hidden = false
    group.style.removeProperty('height')
    const to = this.isExpanded ? group.getBoundingClientRect().height : 0
    group.setAttribute('data-animating', '')
    this.motion = subtleAnimate(
      group,
      { height: [`${from}px`, `${to}px`] },
      SPRING_GENTLE,
    )
    if (this.isExpanded) {
      childItems(this).forEach((child, index) => {
        child.drawGuide(index * 0.04)
      })
    }
    const settle = (): void => {
      if (token !== this.motionToken) return
      group.style.removeProperty('height')
      group.removeAttribute('data-animating')
      group.hidden = !this.isExpanded
    }
    this.motion.finished.then(settle, settle)
  }

  /** Draws this item's guide line from the top, as its parent opens. */
  private drawGuide(delay: number): void {
    const guide = this.renderRoot.querySelector('[part~="guide"]')
    if (!guide || prefersReducedMotion()) return
    subtleAnimate(
      guide,
      { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] },
      { duration: 0.35, delay, ease: EASE_OUT },
    )
  }

  private readonly handleSlotChange = (): void => {
    const count = childItems(this).length
    // Children loaded into an open branch (`has-children`) grow in from nothing.
    if (!this.itemCount && count && this.isExpanded) this.syncGroup(true, true)
    this.itemCount = count
    this.requestUpdate()
  }

  protected override render() {
    return html`
      <span
        part="guide"
        class="guide ${this.isLast ? 'last' : ''}"
        aria-hidden="true"
      ></span>
      <div part="row" class="row">
        <span part="toggle" class="toggle" aria-hidden="true">
          ${this.isBranch ? chevronDown('chevron') : nothing}
        </span>
        <slot name="prefix"></slot>
        <span part="label" class="label">
          <slot name="label">${this.label}</slot>
        </span>
        <slot name="suffix"></slot>
      </div>
      <div part="group" class="group" role="group">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}

defineElement('moul-tree-item', MoulTreeItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tree-item': MoulTreeItem
  }
}
