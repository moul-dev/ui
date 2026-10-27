/**
 * Moul UI - Shared Shadow DOM Reset
 * Scoped Lit CSS reset providing box-sizing: border-box, font inheritance,
 * margin/padding resets, and accessible :focus-visible ring for Custom Elements.
 */

import { type CSSResultGroup, css } from 'lit'

export const resetStyles: CSSResultGroup = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    box-sizing: border-box;
    font-family: var(--font-family-base, inherit);
    font-size: var(--font-size-md, 1rem);
    line-height: var(--line-height-md, 1.5rem);
    color: var(--color-fg, inherit);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]),
  [hidden] {
    display: none !important;
  }

  /* Standard margin/padding resets for commonly used slotted or shadow elements */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  ul,
  ol,
  figure,
  blockquote,
  dl,
  dd {
    margin: 0;
  }

  /* Form control resets */
  button,
  input,
  optgroup,
  select,
  textarea {
    font-family: inherit;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
  }

  button,
  select {
    text-transform: none;
  }

  button,
  [type="button"],
  [type="reset"],
  [type="submit"] {
    -webkit-appearance: button;
  }

  /* Shared accessible focus-visible indicator */
  :focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
`

export default resetStyles
