import { type CSSResultOrNative, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { MoulBase } from '../../shared/base.js'
import { formStyles } from './Form.styles.js'

@customElement('moul-form')
export class MoulForm extends MoulBase {
  static override styles: CSSResultOrNative[] = [...MoulBase.styles, formStyles]

  private handleSubmit = (event: SubmitEvent) => {
    const form = event.target as HTMLFormElement
    if (!form.checkValidity()) {
      event.preventDefault()
      event.stopPropagation()
      form.classList.add('was-validated')
      return
    }

    form.classList.add('was-validated')
    this.dispatchEvent(
      new CustomEvent('moul-submit', {
        bubbles: true,
        composed: true,
        detail: { form, originalEvent: event },
      }),
    )
  }

  override render() {
    return html`
      <form class="needs-validation" novalidate @submit="${this.handleSubmit}">
        <slot></slot>
      </form>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moul-form': MoulForm
  }
}
