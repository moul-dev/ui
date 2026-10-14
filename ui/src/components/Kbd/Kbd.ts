import { type CSSResultOrNative, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { kbdStyles } from './Kbd.styles.js'

@customElement('moul-kbd')
export class MoulKbd extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, kbdStyles]

  override render() {
    return html`
      <kbd>
        <slot></slot>
      </kbd>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-kbd': MoulKbd
  }
}
