import { css } from 'lit'

export const confettiStyles = css`
  :host {
    display: inline-block;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  .canvas {
    display: none;
  }

  /*
   * Shown in the top layer, so it covers dialogs too, and fixed to the
   * viewport. Every UA popover style is reset: no border, no fill.
   */
  :host([data-active]) .canvas {
    display: block;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    overflow: visible;
    pointer-events: none;
    z-index: var(--z-toast, 1700);
  }

  .probe {
    display: none;
  }
`
