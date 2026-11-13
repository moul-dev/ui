import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const focusModeStyles = [
  resetStyles,
  css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    /* A fixed layer over the whole page; its clip-path cuts out the region */
    [part~="overlay"] {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      border: none;
      overflow: hidden;
      background-color: var(--focus-mode-overlay, var(--color-overlay));
      color: inherit;
      z-index: var(--z-modal, 1300);
    }

    [part~="overlay"]:not(.is-shown) {
      display: none;
    }

    :host([is-blurred]) [part~="overlay"] {
      backdrop-filter: blur(var(--focus-mode-blur, 4px));
      -webkit-backdrop-filter: blur(var(--focus-mode-blur, 4px));
    }

    /* Reads the default corner radius of the cutout from a token */
    .probe {
      position: absolute;
      width: 0;
      height: 0;
      visibility: hidden;
      border-radius: var(--radius-xl, 0.75rem);
    }
  `,
]
