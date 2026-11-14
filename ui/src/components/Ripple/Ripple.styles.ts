import { css } from 'lit'

export const rippleStyles = css`
  /* The content sits in the middle, over the centre of the rings. */
  :host {
    display: grid;
    place-content: center;
    justify-items: center;
    position: relative;
    isolation: isolate;
    /* Room for the innermost ring and the next two. */
    min-height: calc(var(--ripple-size, 10rem) + var(--ripple-gap, 4.5rem) * 2);
  }

  :host([hidden]) {
    display: none;
  }

  [part='background'] {
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;

    --_ripple-size: var(--ripple-size, 10rem);
    --_ripple-gap: var(--ripple-gap, 4.5rem);
    --_ripple-color: var(--ripple-color, var(--color-fg));
    --_ripple-duration: var(--ripple-duration, 2s);
    /* Half a step past the outermost ring, where the fade reaches nothing. */
    --_ripple-reach: calc(
      (var(--_ripple-size) + var(--_ripple-gap) * var(--_ripple-count, 6)) / 2
    );
    -webkit-mask-image: radial-gradient(
      circle var(--_ripple-reach) at 50% 50%,
      black 30%,
      transparent
    );
    mask-image: radial-gradient(
      circle var(--_ripple-reach) at 50% 50%,
      black 30%,
      transparent
    );
  }

  .ring {
    /* 1 for the innermost ring, falling toward 0 for the outermost. */
    --_ripple-strength: calc(1 - var(--_ripple-index) / var(--_ripple-count, 6));
    position: absolute;
    left: 50%;
    top: 50%;
    /* Inner rings above outer ones, so every outline stays crisp. */
    z-index: calc(var(--_ripple-count, 6) - var(--_ripple-index));
    width: calc(var(--_ripple-size) + var(--_ripple-gap) * var(--_ripple-index));
    aspect-ratio: 1;
    translate: -50% -50%;
    border-radius: 50%;
    border: 1px solid
      color-mix(
        in oklab,
        var(--_ripple-color) calc(5% + var(--_ripple-strength) * 10%),
        transparent
      );
    background-color: color-mix(
      in oklab,
      var(--_ripple-color) calc(var(--_ripple-strength) * 3.5%),
      transparent
    );
    /* Each ring starts a little after the one inside it, so the pulse travels outward. */
    animation: moul-ripple-pulse var(--_ripple-duration) ease-in-out
      calc(var(--_ripple-duration) * var(--_ripple-index) * 0.04) infinite;
  }

  @keyframes moul-ripple-pulse {
    0%,
    100% {
      scale: 1;
    }
    50% {
      scale: 0.9;
    }
  }

  /* The rings stay still at their resting size. */
  @media (prefers-reduced-motion: reduce) {
    .ring {
      animation: none !important;
    }
  }

  /* Decoration only: where the system forces its colours, the rings are not drawn. */
  @media (forced-colors: active) {
    [part='background'] {
      display: none;
    }
  }
`
