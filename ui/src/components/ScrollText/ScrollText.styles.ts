import { css } from 'lit'

/*
 * One number moves while the reader scrolls: --_scroll-text-progress, on
 * the text span, how far the page (or the scrolling container) is
 * scrolled, 0 to 1, animated by a native scroll timeline or written once
 * per frame by the fallback. The host holds two numbers set on resize,
 * --_scroll-text-k and --_scroll-text-c, which fold in where the text
 * sits, and each word holds its index (--word-index, from the splitter).
 * A word is lit by clamp(0, progress × k − c − index, 1): it brightens over
 * the stretch of scrolling one word takes, after the word before it. Until
 * k and c are known, c is very negative, so every word shows.
 */

export const scrollTextStyles = css`
  :host {
    display: block;
    --_scroll-text-dim: var(--scroll-text-dim, 0.2);
  }

  :host([hidden]) {
    display: none;
  }

  :host([is-pinned]) {
    block-size: var(--scroll-text-length, 250vh);
  }

  .stage {
    display: block;
  }

  :host([is-pinned]) .stage {
    position: sticky;
    inset-block-start: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: center;
    block-size: 100vh;
    block-size: var(--scroll-text-pin-height, 100svh);
  }

  .text {
    display: block;
  }

  [data-split="word"] {
    --_lit: clamp(
      0,
      var(--_scroll-text-progress, 0) * var(--_scroll-text-k, 0) -
        var(--_scroll-text-c, -100000) - var(--word-index, 0),
      1
    );
    opacity: calc(
      var(--_scroll-text-dim) + (1 - var(--_scroll-text-dim)) * var(--_lit)
    );
  }

  @media (prefers-reduced-motion: reduce) {
    :host([is-pinned]) {
      block-size: auto;
    }

    :host([is-pinned]) .stage {
      position: static;
      display: block;
      block-size: auto;
    }

    [data-split="word"] {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    [data-split="word"] {
      opacity: 1;
    }
  }

  @media print {
    :host([is-pinned]) {
      block-size: auto;
    }

    :host([is-pinned]) .stage {
      position: static;
      display: block;
      block-size: auto;
    }

    [data-split="word"] {
      opacity: 1;
    }
  }
`
