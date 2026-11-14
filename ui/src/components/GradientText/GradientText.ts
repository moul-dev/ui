import { html, LitElement, type PropertyValues } from 'lit'
import { InViewController } from '../../controllers/in-view.controller'
import { defineElement } from '../../utils/define-element'
import { gradientTextStyles } from './GradientText.styles'

/** `gradient` flows colours along the text, `shine` sweeps a bright band across it, `aurora` drifts several colours together. */
export type GradientTextEffect = 'gradient' | 'shine' | 'aurora'

const EFFECTS: readonly GradientTextEffect[] = ['gradient', 'shine', 'aurora']

/**
 * Text painted with a moving gradient or a passing light, for a word or two
 * in a hero heading. Wrap the words: `gradient` flows the theme's accent and
 * chart colours along them, `shine` keeps them subdued and sweeps a bright
 * band across every few seconds, and `aurora` lets several colours drift and
 * blend slowly. Set your own colours with `--gradient-text-colors`. It stays
 * inline, so it can sit mid-sentence, and each wrapped line gets the whole
 * gradient. The animation is pure CSS and pauses while the text is off
 * screen. It lives in the effects entry:
 * `import '@moul-dev/web-component/effects'`.
 *
 * Keyboard and screen readers: never focusable and adds no role; the text is
 * ordinary text and is read as it is. The colours change, so check that the
 * lightest point of the gradient still contrasts with the background. Where
 * the system forces its own colours (Windows high contrast) and when
 * printing, the text is plain, in the surrounding colour.
 *
 * Reduced motion: the gradient stands still, and `shine` shows the subdued
 * text with no sweep.
 *
 * @slot - The text to paint.
 *
 * @cssprop --gradient-text-colors - A comma-separated list of colours for `gradient` and `aurora`. Repeat the first colour at the end for a seamless loop. Defaults to `var(--color-accent), var(--color-chart-3), var(--color-chart-5), var(--color-accent)`.
 * @cssprop --gradient-text-duration - Length of one loop, as a CSS time. Defaults to `6s` for `gradient`, `4s` for `shine` (the sweep takes the first 40%) and `12s` for `aurora`.
 * @cssprop --gradient-text-shine-base - The subdued text colour for `shine`. Defaults to `--color-fg` at 65%.
 * @cssprop --gradient-text-shine-color - The colour of the band for `shine`. Defaults to `var(--color-fg)`.
 */
export class MoulGradientText extends LitElement {
  static override styles = gradientTextStyles

  static override properties = {
    effect: { type: String, reflect: true },
  }

  /** How the text is painted. Defaults to `gradient`. */
  declare effect: GradientTextEffect

  constructor() {
    super()
    this.effect = 'gradient'
    // Pauses the CSS animation while the text is off screen (the controller's default).
    new InViewController(this)
  }

  protected override willUpdate(changed: PropertyValues): void {
    super.willUpdate(changed)
    if (changed.has('effect') && !EFFECTS.includes(this.effect)) {
      this.effect = 'gradient'
    }
  }

  protected override render() {
    return html`<slot></slot>`
  }
}

defineElement('moul-gradient-text', MoulGradientText)

declare global {
  interface HTMLElementTagNameMap {
    'moul-gradient-text': MoulGradientText
  }
}
