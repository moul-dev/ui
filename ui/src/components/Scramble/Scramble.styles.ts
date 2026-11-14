import { css } from 'lit'
import { readableCopyStyles } from '../../utils/landing-text'

export const scrambleStyles = [
  readableCopyStyles,
  css`
    :host {
      display: inline;
    }

    :host([hidden]) {
      display: none;
    }

    /* A word never breaks between its letters. */
    .word {
      display: inline-block;
    }

    .char {
      display: inline-block;
      position: relative;
    }

    /*
     * A scrambling letter keeps its final glyph, unseen, so it keeps that
     * glyph's width; the random glyph is drawn over it and takes no space, so
     * the line never jitters. Flex centring keeps a wider glyph centred too.
     */
    .char[data-glyph] {
      visibility: hidden;
    }

    .char[data-glyph]::after {
      content: attr(data-glyph);
      visibility: visible;
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      white-space: nowrap;
      color: var(--scramble-glyph-color, currentColor);
      pointer-events: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .char[data-glyph] {
        visibility: visible;
      }

      .char[data-glyph]::after {
        content: none;
      }
    }
  `,
]
