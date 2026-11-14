import { css } from 'lit'

export const auroraStyles = css`
  :host {
    display: block;
    position: relative;
    /* The colour layer sits behind the content but never behind the page. */
    isolation: isolate;
  }

  :host([hidden]) {
    display: none;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [part="background"] {
    --_aurora-color-1: var(--aurora-color-1, var(--color-accent));
    --_aurora-color-2: var(--aurora-color-2, var(--color-chart-4));
    --_aurora-color-3: var(--aurora-color-3, var(--color-chart-5));
    /* Paler on a light page, where a strong field would muddy dark text. */
    --_aurora-1: light-dark(
      color-mix(in oklab, var(--_aurora-color-1) 70%, transparent),
      var(--_aurora-color-1)
    );
    --_aurora-2: light-dark(
      color-mix(in oklab, var(--_aurora-color-2) 70%, transparent),
      var(--_aurora-color-2)
    );
    --_aurora-3: light-dark(
      color-mix(in oklab, var(--_aurora-color-3) 70%, transparent),
      var(--_aurora-color-3)
    );
    --_aurora-blur: var(--aurora-blur, 48px);
    --_aurora-duration: var(--aurora-duration, 20s);
    position: absolute;
    inset: 0;
    z-index: -1;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
    /* The bands gather at the top and fade out toward the bottom. */
    -webkit-mask-image: radial-gradient(
      ellipse 130% 100% at 50% 0%,
      black 25%,
      transparent 80%
    );
    mask-image: radial-gradient(
      ellipse 130% 100% at 50% 0%,
      black 25%,
      transparent 80%
    );
  }

  :host(:dir(rtl)) [part="background"] {
    transform: scaleX(-1);
  }

  /* Larger than the element, so the blur fades out past the clipped edges rather than inside them. */
  .field {
    position: absolute;
    inset: calc(var(--_aurora-blur) * -2);
    filter: blur(var(--_aurora-blur));
    opacity: var(--aurora-opacity, 0.6);
  }

  /* Aurora: two wide strips of slanted colour bands that sway past each other. */
  .band {
    position: absolute;
    top: 0;
    left: -50%;
    width: 200%;
    height: 70%;
    transform-origin: 50% 0;
    background-image: linear-gradient(
      100deg,
      transparent 4%,
      var(--_aurora-1) 11%,
      transparent 18%,
      var(--_aurora-2) 27%,
      transparent 35%,
      var(--_aurora-3) 44%,
      transparent 52%,
      var(--_aurora-1) 61%,
      transparent 69%,
      var(--_aurora-2) 78%,
      transparent 86%,
      var(--_aurora-3) 93%,
      transparent
    );
    animation: moul-aurora-drift var(--_aurora-duration) ease-in-out infinite
      alternate;
  }

  .band + .band {
    height: 55%;
    opacity: 0.7;
    background-image: linear-gradient(
      80deg,
      transparent 6%,
      var(--_aurora-3) 15%,
      transparent 24%,
      var(--_aurora-1) 34%,
      transparent 43%,
      var(--_aurora-2) 53%,
      transparent 62%,
      var(--_aurora-3) 72%,
      transparent 81%,
      var(--_aurora-1) 90%,
      transparent
    );
    animation-name: moul-aurora-drift-back;
    animation-duration: calc(var(--_aurora-duration) * 1.35);
    animation-delay: calc(var(--_aurora-duration) * -0.6);
  }

  /* Blobs: four soft shapes over the whole area, each on its own path and pace. */
  :host([variant="blobs"]) [part="background"] {
    --_aurora-blur: var(--aurora-blur, 64px);
    -webkit-mask-image: none;
    mask-image: none;
  }

  .blob {
    position: absolute;
    width: 50%;
    height: 60%;
    border-radius: 42% 58% 62% 38% / 45% 40% 60% 55%;
    animation:
      moul-aurora-blob-drift var(--_aurora-duration) ease-in-out infinite
        alternate,
      moul-aurora-blob-morph calc(var(--_aurora-duration) * 0.7) ease-in-out
        infinite alternate;
  }

  .blob:nth-child(1) {
    top: 5%;
    left: 5%;
    background-color: var(--_aurora-1);
  }

  .blob:nth-child(2) {
    top: 0;
    left: 45%;
    background-color: var(--_aurora-2);
    animation-duration:
      calc(var(--_aurora-duration) * 1.3), calc(var(--_aurora-duration) * 0.9);
    animation-direction: alternate-reverse, alternate;
  }

  .blob:nth-child(3) {
    top: 40%;
    left: 25%;
    width: 55%;
    background-color: var(--_aurora-3);
    animation-duration:
      calc(var(--_aurora-duration) * 1.15), calc(var(--_aurora-duration) * 0.6);
    animation-delay:
      calc(var(--_aurora-duration) * -0.5), calc(var(--_aurora-duration) * -0.3);
  }

  .blob:nth-child(4) {
    top: 45%;
    left: 60%;
    width: 40%;
    height: 50%;
    background-color: color-mix(in oklab, var(--_aurora-1), var(--_aurora-2));
    animation-duration:
      calc(var(--_aurora-duration) * 0.85), calc(var(--_aurora-duration) * 0.8);
    animation-direction: alternate-reverse;
    animation-delay:
      calc(var(--_aurora-duration) * -0.25), calc(var(--_aurora-duration) * -0.6);
  }

  @keyframes moul-aurora-drift {
    from {
      transform: translateX(0) skewX(-6deg) scaleY(1);
    }
    to {
      transform: translateX(-25%) skewX(6deg) scaleY(1.15);
    }
  }

  @keyframes moul-aurora-drift-back {
    from {
      transform: translateX(-22%) skewX(4deg) scaleY(1.1);
    }
    to {
      transform: translateX(4%) skewX(-5deg) scaleY(0.9);
    }
  }

  @keyframes moul-aurora-blob-drift {
    0% {
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    50% {
      transform: translate(18%, 12%) rotate(50deg) scale(1.1);
    }
    100% {
      transform: translate(-8%, 20%) rotate(110deg) scale(0.92);
    }
  }

  @keyframes moul-aurora-blob-morph {
    0% {
      border-radius: 42% 58% 62% 38% / 45% 40% 60% 55%;
    }
    50% {
      border-radius: 64% 36% 38% 62% / 36% 60% 40% 64%;
    }
    100% {
      border-radius: 36% 64% 54% 46% / 58% 34% 66% 42%;
    }
  }

  /* A still field: the bands and blobs rest where they start. */
  @media (prefers-reduced-motion: reduce) {
    .band,
    .blob {
      animation: none !important;
    }
  }

  /* Decoration only: where the system forces its colours, the content stands on the plain background. */
  @media (forced-colors: active) {
    [part="background"] {
      display: none;
    }
  }
`
