import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { browserFrameStyles } from './BrowserFrame.styles'

/**
 * A browser window drawn around a screenshot, a video or any markup, so a
 * product shot on a landing page reads as a web app at a glance. Put the
 * content inside and the address to show in `url`: a toolbar with three
 * window dots and an address pill runs across the top, and the content fills
 * the full width below it. Every colour comes from the surface tokens, so the
 * window suits light and dark themes. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The toolbar,
 * dots and address alike, is decoration hidden from screen readers, so they
 * read only the content, with its own semantics; give a screenshot alt text
 * that says what it shows. The address is plain text, not a link.
 *
 * Reduced motion: nothing moves, so there is nothing to reduce.
 *
 * @slot - The content of the window: an image, a video, an iframe or any markup.
 *
 * @csspart base - The window: its border, rounded corners and shadow.
 * @csspart toolbar - The bar across the top that holds the dots and the address. Its sizes are in `em`, so its `font-size` scales it.
 * @csspart address - The pill that shows `url`, cut short with an ellipsis when it does not fit.
 * @csspart content - The area below the toolbar that holds the content.
 */
export class MoulBrowserFrame extends LitElement {
  static override styles = browserFrameStyles

  static override properties = {
    url: { type: String },
  }

  /** The address shown in the toolbar, as plain text. Defaults to an empty pill. */
  declare url: string

  constructor() {
    super()
    this.url = ''
  }

  protected override render() {
    return html`<div part="base">
      <div part="toolbar" aria-hidden="true">
        <span class="dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </span>
        <span part="address" dir="ltr">${this.url}</span>
      </div>
      <div part="content"><slot></slot></div>
    </div>`
  }
}

defineElement('moul-browser-frame', MoulBrowserFrame)

declare global {
  interface HTMLElementTagNameMap {
    'moul-browser-frame': MoulBrowserFrame
  }
}
