import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { tagGroupStyles, tagStyles } from './TagGroup.styles.js'

@customElement('moul-tag')
export class MoulTag extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, tagStyles]

  @property({ type: String })
  accessor value = ''

  @property({ type: String })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @property({ type: String })
  accessor variant: 'primary' | 'secondary' | 'tertiary' = 'secondary'

  @property({ type: Boolean, attribute: 'is-disabled', reflect: true })
  accessor isDisabled = false

  @property({ type: Boolean, attribute: 'is-selected', reflect: true })
  accessor isSelected = false

  @property({ type: Boolean, attribute: 'removable', reflect: true })
  accessor removable = false

  @property({ type: Boolean, attribute: 'selectable', reflect: true })
  accessor selectable = false

  @property({ type: String })
  accessor href = ''

  private handleClick() {
    if (this.isDisabled) return
    if (this.selectable) {
      this.isSelected = !this.isSelected
      this.dispatchEvent(
        new CustomEvent('moul-tag-select', {
          detail: { value: this.value, isSelected: this.isSelected },
          bubbles: true,
          composed: true,
        }),
      )
    }
  }

  private handleRemove(e: MouseEvent) {
    e.stopPropagation()
    if (this.isDisabled) return
    this.dispatchEvent(
      new CustomEvent('moul-tag-remove', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    )
  }

  override render() {
    const content = html`
      <span class="tag ${this.size} ${this.variant}" @click=${this.handleClick}>
        <slot></slot>
        ${
          this.removable
            ? html`
          <button type="button" class="btn-remove" aria-label="Remove" @click=${this.handleRemove}>
            &times;
          </button>
        `
            : ''
        }
      </span>
    `

    if (this.href) {
      return html`<a href="${this.href}" style="text-decoration:none;color:inherit;">${content}</a>`
    }

    return content
  }
}

@customElement('moul-tag-group')
export class MoulTagGroup extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    tagGroupStyles,
  ]

  @property({ type: String })
  accessor label = ''

  @property({ type: String })
  accessor description = ''

  @property({ type: String, attribute: 'error-message' })
  accessor errorMessage = ''

  @property({ type: Boolean, attribute: 'is-invalid' })
  accessor isInvalid = false

  @property({ type: Boolean, attribute: 'is-disabled' })
  accessor isDisabled = false

  @property({ type: String })
  accessor size: 'sm' | 'md' | 'lg' = 'md'

  @property({ type: String })
  accessor variant: 'primary' | 'secondary' | 'tertiary' = 'secondary'

  @property({ type: String, attribute: 'selection-mode' })
  accessor selectionMode: 'none' | 'single' | 'multiple' = 'none'

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement
    const tags = slot
      .assignedElements({ flatten: true })
      .filter((el) => el instanceof MoulTag) as MoulTag[]
    tags.forEach((tag) => {
      if (!tag.hasAttribute('size')) tag.size = this.size
      if (!tag.hasAttribute('variant')) tag.variant = this.variant
      if (this.isDisabled) tag.isDisabled = true
      if (this.selectionMode !== 'none') tag.selectable = true
    })
  }

  override render() {
    return html`
      <div class="tag-group" role="group">
        ${this.label ? html`<label class="label">${this.label}</label>` : ''}
        <div class="tag-list" role="${this.selectionMode !== 'none' ? 'listbox' : 'list'}">
          <slot @slotchange=${this.handleSlotChange}></slot>
        </div>
        ${this.description && !this.isInvalid ? html`<div class="description">${this.description}</div>` : ''}
        ${this.isInvalid && this.errorMessage ? html`<div class="error-message" role="alert">${this.errorMessage}</div>` : ''}
      </div>
    `
  }
}
