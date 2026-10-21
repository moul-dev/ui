import { html, LitElement } from 'lit'
import { defineElement } from '../../utils/define-element'
import { skeletonStyles } from './Skeleton.styles'

export type SkeletonShape = 'line' | 'circle' | 'rect'
export type SkeletonVariant = 'pulse' | 'wave'

export class MoulSkeleton extends LitElement {
  static override styles = skeletonStyles

  static override properties = {
    shape: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    width: { type: String, reflect: true },
    height: { type: String, reflect: true },
  }

  declare shape: SkeletonShape
  declare variant: SkeletonVariant
  declare width: string
  declare height: string

  constructor() {
    super()
    this.shape = 'line'
    this.variant = 'wave'
    this.width = ''
    this.height = ''
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    this.setAttribute('aria-hidden', 'true')
  }

  protected override render() {
    const inlineStyle = [
      this.width ? `width: ${this.width};` : '',
      this.height ? `height: ${this.height};` : '',
    ]
      .filter(Boolean)
      .join(' ')

    return html`
      <div
        part="base"
        style=${inlineStyle || undefined}
        aria-hidden="true"
      ></div>
    `
  }
}

defineElement('moul-skeleton', MoulSkeleton)

declare global {
  interface HTMLElementTagNameMap {
    'moul-skeleton': MoulSkeleton
  }
}
