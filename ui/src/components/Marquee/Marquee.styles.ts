import { css } from 'lit'

export const marqueeStyles = css`
  :host {
    display: block;
    /* A marquee is as wide as its container. Its content never sizes it, so
       the copies can never make it longer and so call for more copies. */
    inline-size: 100%;
    min-inline-size: 0;
    max-inline-size: 100%;
    contain: inline-size;
    --_marquee-gap: var(--marquee-gap, var(--spacing-8, 2rem));
    /* Which way a group travels along the row: -1 toward the left edge. */
    --_marquee-sign: -1;
    --_marquee-fade: min(12%, 6rem);
  }

  :host([hidden]) {
    display: none;
  }

  /* A column takes its height from the page (a height, or a stretching
     grid or flex parent), never from its content. */
  :host([direction="up"]),
  :host([direction="down"]) {
    contain: size;
  }

  :host(:dir(rtl)) {
    --_marquee-sign: 1;
  }

  .track {
    display: flex;
    gap: var(--_marquee-gap);
    /* Clip along the row only, so card shadows above and below still show.
       clip is not a scroll container, so focus can never scroll it. */
    overflow: hidden;
    overflow: clip visible;
  }

  .group {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: var(--_marquee-gap);
    /* Each group moves one group and one gap, onto the next group's place. */
    animation: moul-marquee-row var(--_marquee-duration, 20s) linear infinite;
  }

  ::slotted(*) {
    flex: 0 0 auto;
  }

  :host([direction="end"]) .group,
  :host([direction="down"]) .group {
    animation-direction: reverse;
  }

  /* A column: the host needs a height. */
  :host([direction="up"]) .track,
  :host([direction="down"]) .track {
    flex-direction: column;
    block-size: 100%;
    overflow: hidden;
    overflow: visible clip;
  }

  :host([direction="up"]) .group,
  :host([direction="down"]) .group {
    flex-direction: column;
    align-items: stretch;
    animation-name: moul-marquee-column;
  }

  @keyframes moul-marquee-row {
    from {
      translate: 0 0;
    }
    to {
      translate: calc(var(--_marquee-sign) * (100% + var(--_marquee-gap))) 0;
    }
  }

  @keyframes moul-marquee-column {
    from {
      translate: 0 0;
    }
    to {
      translate: 0 calc(-100% - var(--_marquee-gap));
    }
  }

  :host([is-paused]) .group,
  :host([pause-on-hover]:hover) .group,
  :host(:focus-within) .group,
  .is-offscreen .group {
    animation-play-state: paused;
  }

  :host([fade-edges]) .track {
    -webkit-mask-image: linear-gradient(
      to right,
      transparent,
      black var(--_marquee-fade),
      black calc(100% - var(--_marquee-fade)),
      transparent
    );
    mask-image: linear-gradient(
      to right,
      transparent,
      black var(--_marquee-fade),
      black calc(100% - var(--_marquee-fade)),
      transparent
    );
  }

  :host([fade-edges][direction="up"]) .track,
  :host([fade-edges][direction="down"]) .track {
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent,
      black var(--_marquee-fade),
      black calc(100% - var(--_marquee-fade)),
      transparent
    );
    mask-image: linear-gradient(
      to bottom,
      transparent,
      black var(--_marquee-fade),
      black calc(100% - var(--_marquee-fade)),
      transparent
    );
  }

  /* Keyboard focus inside: the row stops at its start and scrolls, so the
     browser can bring each focused item into view. (Under reduced motion it
     already scrolls, with its scrollbar.) */
  @media (prefers-reduced-motion: no-preference) {
    .track.is-browsing {
      overflow: auto hidden;
      scrollbar-width: none;
    }

    :host([direction="up"]) .track.is-browsing,
    :host([direction="down"]) .track.is-browsing {
      overflow: hidden auto;
    }

    .track.is-browsing::-webkit-scrollbar {
      display: none;
    }

    .track.is-browsing .group {
      animation: none;
    }

    :host([fade-edges]) .track.is-browsing {
      -webkit-mask-image: none;
      mask-image: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    /* !important beats the column rules, which set animation-name with a higher specificity. */
    .group {
      animation: none !important;
    }

    .group.copy {
      display: none;
    }

    .track {
      overflow: auto hidden;
    }

    :host([direction="up"]) .track,
    :host([direction="down"]) .track {
      overflow: hidden auto;
    }

    :host([fade-edges]) .track {
      -webkit-mask-image: none;
      mask-image: none;
    }
  }
`
