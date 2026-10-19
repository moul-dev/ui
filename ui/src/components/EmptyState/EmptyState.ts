import { html, LitElement } from 'lit'
import type { VisualVariant } from '../../styles/semantic-tones'
import { defineElement } from '../../utils/define-element'
import { SPRING_GENTLE, stagger, subtleAnimate } from '../../utils/motion'
import { emptyStateStyles } from './EmptyState.styles'

export type EmptyStateSize = 'sm' | 'md' | 'lg'
export type EmptyStateAlign = 'start' | 'center'

export class MoulEmptyState extends LitElement {
  static override styles = emptyStateStyles

  static override properties = {
    size: { type: String, reflect: true },
    align: { type: String, reflect: true },
    variant: { type: String, reflect: true },
  }

  declare size: EmptyStateSize
  declare align: EmptyStateAlign
  declare variant: VisualVariant

  constructor() {
    super()
    this.size = 'md'
    this.align = 'center'
    this.variant = 'flat'
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'status')
    }
  }

  protected override firstUpdated(): void {
    const targets = Array.from(
      this.shadowRoot?.querySelectorAll<HTMLElement>(
        '[part="icon"], [part="title"], [part="description"], [part="actions"]',
      ) ?? [],
    )

    if (targets.length > 0) {
      subtleAnimate(
        targets,
        { y: [8, 0], opacity: [0, 1] },
        { ...SPRING_GENTLE, delay: stagger(0.05) },
      )
    }
  }

  /** `slot:empty` can't see assigned content, so emptiness is tracked from slotchange. */
  private readonly handleSlotChange = (event: Event): void => {
    const part = (event.target as HTMLSlotElement).parentElement
    if (!part) return
    const hasContent = Array.from(part.querySelectorAll('slot')).some((slot) =>
      slot
        .assignedNodes({ flatten: true })
        .some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.textContent ?? '').trim() !== '',
        ),
    )
    part.toggleAttribute('data-empty', !hasContent)
  }

  protected override render() {
    return html`
      <div part="base" @slotchange=${this.handleSlotChange}>
        <div part="icon" data-empty><slot name="icon"></slot></div>
        <div part="title" data-empty><slot name="title"></slot></div>
        <div part="description" data-empty><slot name="description"></slot><slot></slot></div>
        <div part="actions" data-empty><slot name="actions"></slot></div>
      </div>
    `
  }
}

defineElement('moul-empty-state', MoulEmptyState)

declare global {
  interface HTMLElementTagNameMap {
    'moul-empty-state': MoulEmptyState
  }
}
