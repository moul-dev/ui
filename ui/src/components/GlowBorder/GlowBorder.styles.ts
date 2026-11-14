import { css } from 'lit'

/*
 * The element writes three variables on .glow, at most once per frame while
 * a mouse or pen moves near the box: --moul-glow-border-angle (registered
 * <angle>, inherited, 0deg at the top and clockwise), --_glow-border-intensity
 * (0 to 1) and, when the attributes change, --_glow-border-spread and
 * --_glow-border-blur. The arc is a conic gradient turned to the angle and
 * masked to a ring, so the page is never laid out again while it moves; the
 * transitions turn the frame-by-frame targets into one glide.
 */

export const glowBorderStyles = css`
  :host {
    display: block;
    position: relative;
    /* The moul-card radius. Set border-radius on the element to change it: the ring follows. */
    border-radius: var(--radius-surface, 1.5rem);
    --_glow-border-width: var(--glow-border-width, 2px);
    --_glow-border-colors: var(
      --glow-border-colors,
      var(--color-accent),
      var(--color-chart-4),
      var(--color-chart-2)
    );
    --_glow-border-duration: var(--glow-border-duration, 0.4s);
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

  .glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    opacity: var(--_glow-border-intensity, 0);
    transition:
      --moul-glow-border-angle var(--_glow-border-duration)
        var(--ease-out, ease-out),
      opacity var(--_glow-border-duration) ease-out;
  }

  /* The arc: transparent at both ends, the colours spread evenly between,
     centred on the angle. Only the ring's padding shows through the mask. */
  .ring {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    padding: var(--_glow-border-width);
    border-radius: inherit;
    background: conic-gradient(
      from
        calc(
          var(--moul-glow-border-angle, 0deg) -
            var(--_glow-border-spread, 80deg) / 2
        ),
      transparent,
      var(--_glow-border-colors),
      transparent var(--_glow-border-spread, 80deg),
      transparent
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  /* A wider copy of the ring, blurred, for a soft light round the arc. */
  .halo {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    filter: blur(var(--_glow-border-blur, 0px));
    opacity: 0.8;
  }

  .halo .ring {
    padding: calc(var(--_glow-border-width) + var(--_glow-border-blur, 0px));
  }

  /* Nothing follows the pointer: the whole ring lights evenly while it is over the box. */
  @media (prefers-reduced-motion: reduce) {
    .glow {
      transition: none;
      opacity: 0;
    }

    :host(:hover) .glow {
      opacity: 1;
    }

    .ring {
      background: linear-gradient(135deg, var(--_glow-border-colors));
    }
  }

  /* A decoration only: not drawn where colours are forced, or on paper. */
  @media (forced-colors: active), print {
    .glow {
      display: none;
    }
  }
`
