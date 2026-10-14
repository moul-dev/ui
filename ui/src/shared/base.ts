import { type CSSResultOrNative, css, LitElement } from 'lit'
import { bootstrapSheet } from './bootstrap.styles.js'

export const baseStyles = css`
  :host {
    box-sizing: border-box;
    font-family: var(--bs-body-font-family, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
    color: var(--bs-fg-body, inherit);
    line-height: var(--bs-body-line-height, 1.5);
    -webkit-font-smoothing: antialiased;
  }

  :host-context([data-theme="dark"]),
  :host-context([data-bs-theme="dark"]) {
    color-scheme: dark;
    --bs-shadow-strength: 2.4;
  }

  :host-context([data-theme="light"]),
  :host-context([data-bs-theme="light"]) {
    color-scheme: light;
    --bs-shadow-strength: 1;
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }
`

// Every moul component extends MoulBase.
// Subclasses append a scoped sheet:
//   static styles = [...MoulBase.styles, css`...`]
export abstract class MoulBase extends LitElement {
  static styles: CSSResultOrNative[] = [bootstrapSheet, baseStyles]
}
