import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { stickyScrollItemStyles } from './StickyScroll.styles'

/**
 * One step of a `moul-sticky-scroll`: its text in the default slot and its
 * picture, video or panel in the `media` slot. On a wide screen the text
 * scrolls in the first column and the media is shown in the pinned panel
 * while this step is the active one; on a narrow one the media sits above
 * the text. The parent sets `is-active`; do not set it yourself. It lives in
 * the effects entry: `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role. The text
 * and then the media are read in their order, the media of inactive steps
 * included, so nothing is hidden from a screen reader; focus inside either
 * makes the step active and shows its media.
 *
 * Reduced motion: the media appears and the text brightens at once, with no
 * fade.
 *
 * @slot - The step's text: a heading and a paragraph or two.
 * @slot media - The picture, video or panel shown while the step is active. It fills the panel.
 *
 * @csspart content - The text of the step.
 * @csspart media - The panel that shows the step's media.
 */
export class MoulStickyScrollItem extends LitElement {
  static override styles = stickyScrollItemStyles

  static override properties = {
    isActive: { type: Boolean, reflect: true, attribute: 'is-active' },
  }

  /** Whether this is the step being read. Set by the parent `moul-sticky-scroll`. */
  declare isActive: boolean

  constructor() {
    super()
    this.isActive = false
  }

  /** The box the text takes up; the item itself has no box of its own (`display: contents`). */
  get stepBox(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="content"]') ?? null
    )
  }

  protected override render() {
    return html`<div part="content" class="content"><slot></slot></div>
      <div class="column">
        <div part="media" class="media"><slot name="media"></slot></div>
      </div>`
  }
}

defineElement('moul-sticky-scroll-item', MoulStickyScrollItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-sticky-scroll-item': MoulStickyScrollItem
  }
}
