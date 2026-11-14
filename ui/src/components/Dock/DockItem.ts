import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { ifDefined } from 'lit/directives/if-defined.js'
import { defineElement } from '../../utils/define-element'
import { warnMissingLabel } from '../../utils/warn-missing-label'
import { dockItemStyles } from './Dock.styles'

/**
 * One icon in a `moul-dock`: a link when it has an `href`, otherwise a
 * button. Put the icon in it (an inline `<svg>`, an `<img>` or an emoji) and
 * give it a `label`, which names it for screen readers and appears as a small
 * tooltip above it on hover and keyboard focus. `is-active` puts a dot under
 * it, for the page you are on or an app that is running. Listen for `click`
 * on a button item. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: the link or button inside takes focus, named
 * by `label`; the tooltip text is `aria-hidden` so the name is not read twice.
 * Inside a dock only one item is in the tab order and the arrow keys move
 * between them (see `moul-dock`). `is-active` sets `aria-current="page"` on a
 * link and `aria-pressed="true"` on a button; `is-disabled` sets
 * `aria-disabled` and the item is skipped by the arrow keys.
 *
 * Reduced motion: the item does not grow or move, its label appears without
 * sliding, and hover colours change without fading.
 *
 * @slot - The icon.
 *
 * @csspart control - The link or button.
 * @csspart label - The tooltip with the label.
 * @csspart indicator - The dot shown with `is-active`.
 *
 * @cssprop --dock-item-size - The resting width and height of the item. Defaults to `2.75rem`; set it on the dock.
 * @cssprop --dock-item-radius - The corner radius of the item. Defaults to `9999px`, a circle.
 * @cssprop --dock-item-background - The item's fill. Defaults to `var(--color-surface-secondary)`.
 */
export class MoulDockItem extends LitElement {
  static override styles = dockItemStyles

  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  }

  static override properties = {
    label: { type: String, reflect: true },
    href: { type: String, reflect: true },
    target: { type: String, reflect: true },
    isActive: { type: Boolean, reflect: true, attribute: 'is-active' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    isTabStop: { attribute: false },
  }

  /** The item's name: read by screen readers and shown as its tooltip. */
  declare label: string
  /** Makes the item a link to this URL. Empty makes it a button. */
  declare href: string
  /** Where a link item opens, as on `<a target>`. */
  declare target: string
  /** Shows a dot under the item and marks it current. */
  declare isActive: boolean
  /** Turns the item off and skips it in keyboard navigation. */
  declare isDisabled: boolean
  /**
   * Whether this item is the dock's single tab stop. The dock sets it.
   * @internal
   */
  declare isTabStop: boolean

  constructor() {
    super()
    this.label = ''
    this.href = ''
    this.target = ''
    this.isActive = false
    this.isDisabled = false
    this.isTabStop = true
  }

  /** The link or button inside. */
  public get control(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part="control"]') ?? null
    )
  }

  public override focus(options?: FocusOptions): void {
    const control = this.control
    if (control) control.focus(options)
    else super.focus(options)
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed)
    if (changed.has('label')) {
      warnMissingLabel(this, 'dock item label', Boolean(this.label))
    }
  }

  private readonly handleClick = (event: MouseEvent): void => {
    if (!this.isDisabled) return
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  protected override render() {
    const tabindex = this.isTabStop && !this.isDisabled ? '0' : '-1'
    const name = this.label || nothing
    const content = html`<slot></slot>`
    const control = this.href
      ? html`<a
          part="control"
          class="control"
          href=${this.isDisabled ? nothing : this.href}
          target=${ifDefined(this.target || undefined)}
          rel=${this.target === '_blank' ? 'noopener noreferrer' : nothing}
          tabindex=${tabindex}
          aria-label=${name}
          aria-current=${this.isActive ? 'page' : nothing}
          aria-disabled=${this.isDisabled ? 'true' : nothing}
          @click=${this.handleClick}
          >${content}</a
        >`
      : html`<button
          part="control"
          class="control"
          type="button"
          tabindex=${tabindex}
          aria-label=${name}
          aria-pressed=${this.isActive ? 'true' : nothing}
          aria-disabled=${this.isDisabled ? 'true' : nothing}
          @click=${this.handleClick}
        >
          ${content}
        </button>`
    return html`<div class="item">
      ${control}
      ${
        this.label
          ? html`<span part="label" class="label" aria-hidden="true"
              >${this.label}</span
            >`
          : nothing
      }
      <span part="indicator" class="indicator" aria-hidden="true"></span>
    </div>`
  }
}

defineElement('moul-dock-item', MoulDockItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-dock-item': MoulDockItem
  }
}
