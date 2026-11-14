import { css } from 'lit'

export const shineBorderStyles = css`
  :host {
    display: block;
    position: relative;
    /* The moul-card radius. Set border-radius on the element to change it: the ring follows. */
    border-radius: var(--radius-surface, 1.5rem);
    --_shine-border-colors: var(
      --shine-border-colors,
      var(--color-accent),
      var(--color-chart-4),
      var(--color-chart-3),
      var(--color-chart-2)
    );
    --_shine-border-width: var(--shine-border-width, 1px);
    --_shine-border-duration: var(--shine-border-duration, 14s);
    /* The glow drifts from the top-left corner to the bottom right and back. */
    --_shine-border-from: 0% 0%;
    --_shine-border-to: 100% 100%;
    --_shine-border-still: to bottom right;
  }

  :host(:dir(rtl)) {
    --_shine-border-from: 100% 0%;
    --_shine-border-to: 0% 100%;
    --_shine-border-still: to bottom left;
  }

  :host([hidden]) {
    display: none;
  }

  /* Left empty, it is an overlay: let the pointer through to the box beneath. */
  :host(:empty) {
    pointer-events: none;
  }

  /* Slotted content can take the element's radius with border-radius: inherit. */
  slot {
    border-radius: inherit;
  }

  /* A ring of --shine-border-width over the content's edge. Behind it, a
     radial glow three times the box's size, with the colours in a band
     between clear centre and clear rim; moving it slides the band round
     the ring, so the colours come and go side by side. */
  [part="border"] {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    padding: var(--_shine-border-width);
    border-radius: inherit;
    pointer-events: none;
    background-image: radial-gradient(
      transparent,
      transparent,
      var(--_shine-border-colors),
      transparent,
      transparent
    );
    background-size: 300% 300%;
    background-position: var(--_shine-border-from);
    background-repeat: no-repeat;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    animation: moul-shine-border-drift var(--_shine-border-duration)
      ease-in-out infinite;
  }

  @keyframes moul-shine-border-drift {
    0%,
    100% {
      background-position: var(--_shine-border-from);
    }
    50% {
      background-position: var(--_shine-border-to);
    }
  }

  /* The colours stand still, once round the whole ring. The list is given
     twice, so a single colour is still a valid gradient, and the image is
     twice the box, so only the first pass shows. */
  @media (prefers-reduced-motion: reduce) {
    [part="border"] {
      animation: none !important;
      background-image: linear-gradient(
        var(--_shine-border-still),
        var(--_shine-border-colors),
        var(--_shine-border-colors)
      );
      background-size: 200% 200%;
    }
  }

  /* A decoration only: not drawn where colours are forced, or on paper. */
  @media (forced-colors: active), print {
    [part="border"] {
      display: none;
    }
  }
`
