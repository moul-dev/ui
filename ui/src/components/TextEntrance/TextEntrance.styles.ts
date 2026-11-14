import { css } from 'lit'

export const textEntranceStyles = css`
  :host {
    display: inline;
    --_ease: var(--text-entrance-easing, var(--ease-out, ease-out));
    --_distance: var(--text-entrance-distance, 0.4em);
    --_blur: var(--text-entrance-blur, 0.2em);
    --_from-filter: none;
    --_from-translate: none;
    --_from-scale: none;
  }

  :host([hidden]) {
    display: none;
  }

  :host([effect="blur"]) {
    --_from-filter: blur(var(--_blur));
  }

  :host([effect="blur-up"]) {
    --_from-filter: blur(var(--_blur));
    --_from-translate: 0 var(--_distance);
  }

  :host([effect="slide-up"]) {
    --_from-translate: 0 var(--_distance);
  }

  :host([effect="slide-down"]) {
    --_from-translate: 0 calc(-1 * var(--_distance));
  }

  :host([effect="scale-up"]) {
    --_from-scale: 0.6;
  }

  /* Each piece's place in the order: its word, letter or line. */
  [data-split="word"] {
    --_index: var(--word-index, 0);
  }

  :host([by="lines"]) [data-split="word"] {
    --_index: var(--line-index, 0);
  }

  [data-split="char"] {
    --_index: var(--char-index, 0);
  }

  :host(:not([is-revealed]):not([by="chars"])) [data-split="word"],
  :host(:not([is-revealed])[by="chars"]) [data-split="char"] {
    opacity: 0;
  }

  :host([is-revealed]:not([by="chars"])) [data-split="word"],
  :host([is-revealed][by="chars"]) [data-split="char"] {
    animation: moul-text-entrance-in var(--_duration, 500ms) var(--_ease) both;
    animation-delay: calc(
      var(--_delay, 0ms) + var(--_index) * var(--_stagger, 60ms)
    );
  }

  @keyframes moul-text-entrance-in {
    from {
      opacity: 0;
      filter: var(--_from-filter);
      translate: var(--_from-translate);
      scale: var(--_from-scale);
    }
  }

  @media (prefers-reduced-motion: reduce), print {
    [data-split="word"],
    [data-split="char"] {
      opacity: 1 !important;
      animation: none !important;
    }
  }
`
