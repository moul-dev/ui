import { css } from 'lit'
import { resetStyles } from '../../styles/reset.styles'

export const numberTickerStyles = [
  resetStyles,
  css`
    /* Inherits the surrounding text (the reset sets body text): size, weight, colour and line height. */
    :host {
      display: inline-flex;
      align-items: baseline;
      white-space: nowrap;
      font-family: inherit;
      font-size: inherit;
      font-weight: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      color: inherit;
      font-variant-numeric: tabular-nums;
    }

    :host([hidden]) {
      display: none;
    }

    [part~="digits"] {
      display: inline-block;
      white-space: pre;
    }

    /*
     * A digit is a window one line tall onto a strip of glyphs. The hidden
     * sizer gives the window its width and baseline; clip-path, unlike
     * overflow, leaves that baseline in line with the text around it.
     */
    .digit {
      position: relative;
      display: inline-block;
      clip-path: inset(0 -0.25em);
      /* Digits fade at the window's edges as they roll; at rest the glyph sits clear of the fade. */
      mask-image: linear-gradient(
        to bottom,
        transparent,
        black 12%,
        black 88%,
        transparent
      );
    }

    .sizer {
      visibility: hidden;
    }

    .strip {
      position: absolute;
      inset: 0 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .strip > span {
      display: block;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
]
