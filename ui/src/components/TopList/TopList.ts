import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { topListStyles } from './TopList.styles.js'

export interface TopListItemData {
  id?: string | number
  title: string
  value?: string | number
}

@customElement('moul-top-list')
export class MoulTopList extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    topListStyles,
  ]

  @property({ type: Array })
  accessor items: TopListItemData[] = []

  override render() {
    return html`
      <div class="list-group">
        ${
          this.items.length > 0
            ? this.items.map(
                (item, idx) => html`
                <div class="list-group-item">
                  <span class="rank">${idx + 1}</span>
                  <span class="title">${item.title}</span>
                  ${item.value !== undefined ? html`<span class="value">${item.value}</span>` : ''}
                </div>
              `,
              )
            : html`<slot></slot>`
        }
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-top-list': MoulTopList
  }
}
