import { html, LitElement, type PropertyValues } from 'lit'
import type { AnimationPlaybackControls } from 'motion'
import { defineElement } from '../../utils/define-element'
import { chevronDown } from '../../utils/icons'
import {
  EASE_OUT,
  type Pose,
  poseTransform,
  prefersReducedMotion,
  REST_POSE,
  readPose,
  SPRING_SNAPPY,
  subtleAnimate,
} from '../../utils/motion'
import type { MoulAccordion } from './Accordion'
import { accordionItemStyles } from './Accordion.styles'

/** Where the panel content rests while closed: faded out, nudged up a little. */
const CLOSED_POSE: Pose = { opacity: 0, y: -6, scale: 1 }

let nextId = 0

/**
 * One collapsible section of a `moul-accordion`: a header button that shows
 * or hides the panel below it. The panel opens with a spring on its height,
 * so the content underneath moves instead of jumping. It also works on its
 * own as a single disclosure.
 *
 * Keyboard and screen readers: the header is a native `<button>` with
 * `aria-expanded` and `aria-controls`, inside an element with
 * `role="heading"` and `aria-level` (from the accordion's `heading-level`,
 * 3 by default). `Enter` and `Space` toggle it; the arrow keys, `Home` and
 * `End` are handled by the parent `moul-accordion`. The panel has
 * `role="region"` and is named by its header. A closed panel is `hidden`, and
 * `inert` while it closes, so its content is out of the tab order and the
 * accessibility tree. A disabled item's button is natively disabled: it is
 * skipped by `Tab` and the arrow keys and cannot be toggled.
 *
 * Reduced motion: the panel's height springs from where it is to the
 * content's height (or to zero), the content fades and slides 6px, and the
 * chevron turns half a circle; under reduced motion the panel opens and
 * closes at once and the chevron flips without turning.
 *
 * @slot - The panel content.
 * @slot heading - Rich heading content; replaces the `heading` text.
 * @slot prefix - An icon before the heading.
 * @fires openchange - The user opened or closed the item; `detail.isOpen` is the new state. Not fired when `isOpen` is set from code.
 * @csspart heading - The `role="heading"` wrapper.
 * @csspart trigger - The header button.
 * @csspart prefix - The wrapper around the `prefix` slot.
 * @csspart label - The wrapper around the heading text.
 * @csspart indicator - The chevron.
 * @csspart panel - The region whose height animates.
 * @csspart content - The padded wrapper around the panel content.
 */
export class MoulAccordionItem extends LitElement {
  static override styles = accordionItemStyles

  static override properties = {
    heading: { type: String },
    value: { type: String },
    isOpen: { type: Boolean, reflect: true, attribute: 'is-open' },
    isDisabled: { type: Boolean, reflect: true, attribute: 'is-disabled' },
    headingLevel: { attribute: false },
    hasPrefix: { state: true },
  }

  /** The heading text. Use the `heading` slot for richer content. */
  declare heading: string
  /** Identifies the item in the accordion's `value`. Defaults to a generated id. */
  declare value: string
  declare isOpen: boolean
  declare isDisabled: boolean
  /** The `aria-level` of the heading, 1 to 6. The parent `moul-accordion` sets it from its `heading-level`. */
  declare headingLevel: number
  private declare hasPrefix: boolean

  private heightAnimation: AnimationPlaybackControls | null = null
  private contentAnimation: AnimationPlaybackControls | null = null
  /** Bumped on every toggle, so a superseded animation's finish does nothing. */
  private motionToken = 0

  constructor() {
    super()
    this.heading = ''
    this.value = `moul-accordion-item-${++nextId}`
    this.isOpen = false
    this.isDisabled = false
    this.headingLevel = 3
    this.hasPrefix = false
  }

  /** @internal The header button, for the accordion's arrow keys. */
  public get triggerEl(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector('[part~="trigger"]') ?? null
  }

  private get panelEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="panel"]') ?? null
  }

  private get contentEl(): HTMLElement | null {
    return this.shadowRoot?.querySelector('[part~="content"]') ?? null
  }

  private get accordion(): MoulAccordion | null {
    const parent = this.parentElement
    return parent?.localName === 'moul-accordion'
      ? (parent as MoulAccordion)
      : null
  }

  /** Moves focus to the header button. */
  public override focus(options?: FocusOptions): void {
    const trigger = this.triggerEl
    if (trigger) trigger.focus(options)
    else super.focus(options)
  }

  /**
   * Opens or closes the item as a user toggle does, firing `openchange`. In a
   * single-open accordion, opening it closes the others.
   */
  public setOpen(nextOpen: boolean): void {
    if (this.isOpen === nextOpen) return
    this.isOpen = nextOpen
    this.dispatchEvent(
      new CustomEvent('openchange', {
        bubbles: true,
        composed: true,
        detail: { isOpen: nextOpen },
      }),
    )
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    if (this.heightAnimation) this.settle()
  }

  protected override willUpdate(changedProps: PropertyValues<this>): void {
    super.willUpdate(changedProps)
    if (!this.hasUpdated) {
      this.hasPrefix = Array.from(this.children).some(
        (el) => el.slot === 'prefix',
      )
    }
  }

  protected override updated(changedProps: PropertyValues<this>): void {
    super.updated(changedProps)
    if (!changedProps.has('isOpen')) return
    const isToggle = changedProps.get('isOpen') !== undefined
    this.syncPanel(isToggle)
    if (isToggle && this.isOpen) this.accordion?.handleItemOpened(this)
  }

  private syncPanel(shouldAnimate: boolean): void {
    const panel = this.panelEl
    const content = this.contentEl
    if (!panel || !content) return
    panel.toggleAttribute('inert', !this.isOpen)

    // Start from wherever the panel is: hidden, fully open, or mid-spring.
    const isMoving = this.heightAnimation !== null
    const from = panel.hidden ? 0 : panel.getBoundingClientRect().height
    const fromPose = isMoving
      ? readPose(content, CLOSED_POSE)
      : this.isOpen
        ? CLOSED_POSE
        : REST_POSE
    this.heightAnimation?.stop()
    this.contentAnimation?.stop()
    panel.hidden = false
    const to = this.isOpen ? content.getBoundingClientRect().height : 0

    if (!shouldAnimate || prefersReducedMotion() || from === to) {
      this.settle()
      return
    }

    const token = ++this.motionToken
    panel.setAttribute('data-animating', '')
    panel.style.height = `${from}px`
    this.heightAnimation = subtleAnimate(
      panel,
      { height: [`${from}px`, `${to}px`] },
      SPRING_SNAPPY,
    )
    const toPose = this.isOpen ? REST_POSE : CLOSED_POSE
    this.contentAnimation = subtleAnimate(
      content,
      {
        opacity: [fromPose.opacity, toPose.opacity],
        transform: [poseTransform(fromPose), poseTransform(toPose)],
      },
      { duration: this.isOpen ? 0.24 : 0.16, ease: EASE_OUT },
    )
    this.heightAnimation.finished?.then(() => {
      if (token === this.motionToken) this.settle()
    })
  }

  /** Ends any animation and leaves the panel at rest: `auto` height when open, `hidden` when closed. */
  private settle(): void {
    this.motionToken++
    this.heightAnimation?.stop()
    this.contentAnimation?.stop()
    this.heightAnimation = null
    this.contentAnimation = null
    const panel = this.panelEl
    const content = this.contentEl
    if (panel) {
      panel.hidden = !this.isOpen
      panel.removeAttribute('data-animating')
      panel.style.removeProperty('height')
    }
    content?.style.removeProperty('opacity')
    content?.style.removeProperty('transform')
  }

  private readonly handleClick = (): void => {
    if (this.isDisabled) return
    this.setOpen(!this.isOpen)
  }

  private readonly handlePrefixChange = (e: Event): void => {
    const slot = e.target as HTMLSlotElement
    this.hasPrefix = slot.assignedNodes({ flatten: true }).length > 0
  }

  protected override render() {
    const level = Math.min(6, Math.max(1, Math.round(this.headingLevel) || 3))
    return html`
      <div part="heading" role="heading" aria-level=${level}>
        <button
          part="trigger"
          id="trigger"
          type="button"
          aria-expanded=${this.isOpen ? 'true' : 'false'}
          aria-controls="panel"
          ?disabled=${this.isDisabled}
          @click=${this.handleClick}
        >
          <span part="prefix" ?hidden=${!this.hasPrefix}>
            <slot name="prefix" @slotchange=${this.handlePrefixChange}></slot>
          </span>
          <span part="label"><slot name="heading">${this.heading}</slot></span>
          <span part="indicator">${chevronDown()}</span>
        </button>
      </div>
      <div part="panel" id="panel" role="region" aria-labelledby="trigger">
        <div part="content"><slot></slot></div>
      </div>
    `
  }
}

defineElement('moul-accordion-item', MoulAccordionItem)

declare global {
  interface HTMLElementTagNameMap {
    'moul-accordion-item': MoulAccordionItem
  }
}
