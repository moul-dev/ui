import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { tableStyles } from './Table.styles.js'

@customElement('moul-table')
export class MoulTable extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    tableStyles,
  ]

  @property({ type: Boolean, attribute: 'striped' })
  accessor striped = false

  @property({ type: Boolean, attribute: 'hover' })
  accessor hover = false

  @property({ type: Boolean, attribute: 'bordered' })
  accessor bordered = false

  @property({ type: Boolean, attribute: 'small' })
  accessor small = false

  private handleSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement
    const tables = slot
      .assignedElements({ flatten: true })
      .filter(
        (el) => el.tagName.toLowerCase() === 'table',
      ) as HTMLTableElement[]
    tables.forEach((table) => {
      table.classList.add('table')
      if (this.striped) table.classList.add('table-striped')
      if (this.hover) table.classList.add('table-hover')
      if (this.bordered) table.classList.add('table-bordered')
      if (this.small) table.classList.add('table-sm')
    })
  }

  override render() {
    return html`
      <div class="table-responsive">
        <slot @slotchange=${this.handleSlotChange}></slot>
      </div>
    `
  }
}
