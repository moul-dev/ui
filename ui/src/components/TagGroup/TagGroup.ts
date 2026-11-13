import { html, LitElement, type PropertyValues } from 'lit'
import { defineElement } from '../../utils/define-element'
import type { MoulTag } from './Tag'
import { tagGroupStyles } from './TagGroup.styles'

export type TagSelectionMode = 'none' | 'single' | 'multiple'

/**
 * A labelled set of `moul-tag` chips, for filters or chosen values. Set
 * `selection-mode` to `single` or `multiple` to let a click toggle tags
 * (tracked in `selected-keys` and reported by `selectionchange`), and
 * `is-removable` to give every tag a remove button.
 *
 * Keyboard and screen readers: the group is not focusable and handles no keys;
 * only each tag's remove button is in the tab order, so selecting tags needs a
 * pointer. The host is a `role="group"`, or a `role="listbox"` when tags are
 * selectable, named by `label`, which is also shown above the tags.
 *
 * Reduced motion: the group itself does not animate; each `moul-tag` handles
 * its own press and removal motion.
 */
export class MoulTagGroup extends LitElement {
  static override styles = tagGroupStyles

  static override properties = {
    selectedKeys: { type: Array, attribute: 'selected-keys' },
    selectionMode: { type: String, reflect: true, attribute: 'selection-mode' },
    isRemovable: { type: Boolean, reflect: true, attribute: 'is-removable' },
    label: { type: String, reflect: true },
  }

  declare selectedKeys: string[]
  declare selectionMode: TagSelectionMode
  declare isRemovable: boolean
  declare label: string

  constructor() {
    super()
    this.selectedKeys = []
    this.selectionMode = 'none'
    this.isRemovable = false
    this.label = ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute(
        'role',
        this.selectionMode === 'none' ? 'group' : 'listbox',
      )
    }
    if (this.label) {
      this.setAttribute('aria-label', this.label)
    }
    this.addEventListener('press', this.handleTagPress as EventListener)
    this.addEventListener('remove', this.handleTagRemove as EventListener)
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.removeEventListener('press', this.handleTagPress as EventListener)
    this.removeEventListener('remove', this.handleTagRemove as EventListener)
  }

  protected override updated(changedProps: PropertyValues): void {
    super.updated(changedProps)

    if (changedProps.has('selectionMode')) {
      this.setAttribute(
        'role',
        this.selectionMode === 'none' ? 'group' : 'listbox',
      )
    }

    if (changedProps.has('label') && this.label) {
      this.setAttribute('aria-label', this.label)
    }

    if (changedProps.has('selectedKeys') || changedProps.has('isRemovable')) {
      this.syncChildren()
    }
  }

  private hasSeededFromChildren = false

  private syncChildren(): void {
    const slot = this.shadowRoot?.querySelector('slot')
    const tags = ((slot?.assignedElements() ?? []) as MoulTag[]).filter(
      (el) => el.tagName.toLowerCase() === 'moul-tag',
    )

    // Adopt <moul-tag is-selected> markup as the initial selection when none is given.
    if (!this.hasSeededFromChildren && tags.length > 0) {
      this.hasSeededFromChildren = true
      if (this.selectedKeys.length === 0) {
        const preset = tags
          .filter((tag) => tag.isSelected || tag.hasAttribute('is-selected'))
          .map((tag) => tag.key)
        if (preset.length > 0) this.selectedKeys = preset
      }
    }

    tags.forEach((tag) => {
      if (this.isRemovable && !tag.hasAttribute('is-removable')) {
        tag.isRemovable = true
      }
      tag.isSelected = this.selectedKeys.includes(tag.key)
    })
  }

  private readonly handleSlotChange = (): void => {
    this.syncChildren()
  }

  private readonly handleTagPress = (e: CustomEvent): void => {
    if (this.selectionMode === 'none') return

    const key = e.detail?.key
    if (!key) return

    if (this.selectionMode === 'single') {
      this.selectedKeys = this.selectedKeys.includes(key) ? [] : [key]
    } else if (this.selectionMode === 'multiple') {
      if (this.selectedKeys.includes(key)) {
        this.selectedKeys = this.selectedKeys.filter((k) => k !== key)
      } else {
        this.selectedKeys = [...this.selectedKeys, key]
      }
    }

    this.syncChildren()
    this.dispatchEvent(
      new CustomEvent('selectionchange', {
        bubbles: true,
        composed: true,
        detail: { selectedKeys: this.selectedKeys },
      }),
    )
  }

  private readonly handleTagRemove = (e: CustomEvent): void => {
    const key = e.detail?.key
    if (!key) return

    if (this.selectedKeys.includes(key)) {
      this.selectedKeys = this.selectedKeys.filter((k) => k !== key)
      this.syncChildren()
      this.dispatchEvent(
        new CustomEvent('selectionchange', {
          bubbles: true,
          composed: true,
          detail: { selectedKeys: this.selectedKeys },
        }),
      )
    }
  }

  protected override render() {
    return html`
      ${this.label ? html`<span class="label" part="label">${this.label}</span>` : ''}
      <div class="tag-container" part="container">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}

defineElement('moul-tag-group', MoulTagGroup)

declare global {
  interface HTMLElementTagNameMap {
    'moul-tag-group': MoulTagGroup
  }
}
