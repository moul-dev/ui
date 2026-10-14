import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { MoulBase } from '../../shared/base.js'
import { skeletonStyles } from './Skeleton.styles.js'

@customElement('moul-skeleton')
export class MoulSkeleton extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    skeletonStyles,
  ]

  @property({ type: String })
  accessor width = '100%'

  @property({ type: String })
  accessor height = '1em'

  @property({ type: String, reflect: true })
  accessor variant: 'text' | 'circular' | 'rectangular' = 'text'

  override render() {
    const styles = {
      width: this.width,
      height: this.height,
    }

    return html`
      <div class="placeholder-glow" aria-hidden="true">
        <span
          class="placeholder ${this.variant === 'circular' ? 'circular' : ''}"
          style="${styleMap(styles)}"
        ></span>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-skeleton': MoulSkeleton
  }
}
