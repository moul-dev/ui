import { css } from 'lit'

/*
 * The base is the subject of a view timeline. Over the first half of its
 * passage through the viewport (cover 0% to cover 50%: from its top edge
 * entering at the bottom until its middle reaches the middle), the frame
 * goes from tilted back and scaled to flat, and the header rises into its
 * place. Natively that is two CSS animations of transform and translate on
 * the view timeline. Elsewhere the script fallback writes
 * --_scroll-frame-progress (0 to 1 over the whole passage) on the base, and
 * the same transforms are computed from min(1, progress × 2).
 */

export const scrollFrameStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  .base {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  .header {
    display: none;
  }

  .base.has-header .header {
    display: block;
    margin-block-end: var(--scroll-frame-gap, var(--spacing-8, 2rem));
  }

  .frame {
    transform-origin: 50% 50%;
  }

  @supports (animation-timeline: view()) {
    .base {
      view-timeline: --_scroll-frame block;
    }

    .frame,
    .header {
      animation-duration: auto;
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: --_scroll-frame;
      animation-range: cover 0% cover 50%;
    }

    .frame {
      animation-name: moul-scroll-frame-lie-flat;
    }

    .header {
      animation-name: moul-scroll-frame-rise;
    }
  }

  @supports not (animation-timeline: view()) {
    .frame,
    .header {
      --_scroll-frame-progress: inherit;
    }

    .frame {
      transform: perspective(var(--scroll-frame-perspective, 1000px))
        rotateX(
          calc(
            (1 - min(1, var(--_scroll-frame-progress, 1) * 2)) *
              var(--_scroll-frame-tilt, 20) * 1deg
          )
        )
        scale(
          calc(
            1 + (1 - min(1, var(--_scroll-frame-progress, 1) * 2)) *
              (var(--scroll-frame-scale, 1.05) - 1)
          )
        );
    }

    .header {
      translate: 0
        calc(
          (1 - min(1, var(--_scroll-frame-progress, 1) * 2)) *
            var(--scroll-frame-header-shift, 3rem)
        );
    }
  }

  @keyframes moul-scroll-frame-lie-flat {
    from {
      transform: perspective(var(--scroll-frame-perspective, 1000px))
        rotateX(calc(var(--_scroll-frame-tilt, 20) * 1deg))
        scale(var(--scroll-frame-scale, 1.05));
    }
    to {
      transform: perspective(var(--scroll-frame-perspective, 1000px))
        rotateX(0deg) scale(1);
    }
  }

  @keyframes moul-scroll-frame-rise {
    from {
      translate: 0 var(--scroll-frame-header-shift, 3rem);
    }
    to {
      translate: 0 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .frame,
    .header {
      animation: none;
      transform: none;
      translate: none;
    }
  }
`
