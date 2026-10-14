import { type CSSResultOrNative, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { LiveRegionController } from '../../controllers/live-region.controller.js'
import { MoulBase } from '../../shared/base.js'
import { fieldErrorStyles } from './FieldError.styles.js'

@customElement('moul-field-error')
export class MoulFieldError extends MoulBase {
  static override styles: CSSResultOrNative[] = [
    ...MoulBase.styles,
    fieldErrorStyles,
  ]

  private liveRegion = new LiveRegionController(this, {
    politeness: 'assertive',
  })

  @property({ type: String })
  accessor message = ''

  override updated() {
    const text = this.message || this.textContent || ''
    if (text.trim()) {
      this.liveRegion.announce(text.trim(), 'assertive')
    }
  }

  override render() {
    return html`
      <div class="invalid-feedback" role="alert">
        <slot>${this.message}</slot>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-field-error': MoulFieldError
  }
}
