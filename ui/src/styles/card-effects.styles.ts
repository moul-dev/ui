import { type CSSResult, css } from 'lit'

/**
 * The card effects (`effect="spotlight glare glow"`), shared by `moul-card`
 * and `moul-bento-card`. The layers come from `utils/card-effects.ts`.
 * `focus` is the host state that shows the spotlight at the centre and
 * sweeps the glare without a pointer: `:focus-visible` for a card that takes
 * focus itself, `:focus-within` for one that holds focusable content.
 */
export const cardEffectStyles = (focus: CSSResult): CSSResult => css`
  /* The spotlight sits at z-index -1: above the card's own background, under
     its content. */
  :host([effect]) {
    isolation: isolate;
  }

  .card-spotlight,
  .card-glare,
  .card-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  /* ── Spotlight: a soft light under the pointer ─────────────────────── */
  .card-spotlight {
    --_card-spotlight-at: var(--_card-spotlight-x, 50%)
      var(--_card-spotlight-y, 50%);
    z-index: -1;
    overflow: hidden;
    opacity: 0;
    background: radial-gradient(
      circle var(--card-spotlight-size, 20rem) at var(--_card-spotlight-at),
      var(
        --card-spotlight-color,
        light-dark(
          color-mix(in oklab, var(--color-accent) 16%, transparent),
          color-mix(in oklab, var(--color-accent) 28%, transparent)
        )
      ),
      transparent
    );
    transition: opacity var(--duration-base, 250ms) var(--ease-out, ease-out);
  }

  .card-spotlight[data-on] {
    opacity: 1;
  }

  /* Keyboard focus, with no pointer over the card: the light at the centre. */
  :host(${focus}) .card-spotlight:not([data-on]) {
    --_card-spotlight-at: 50% 50%;
    opacity: 1;
  }

  /* ── Glare: a band of light that sweeps across once ────────────────── */
  .card-glare {
    --_card-glare-color: var(
      --card-glare-color,
      light-dark(
        color-mix(in oklab, var(--color-accent) 14%, transparent),
        color-mix(in oklab, var(--color-white) 14%, transparent)
      )
    );
    --_card-glare-angle: 115deg;
    --_card-glare-from: -100%;
    --_card-glare-to: 100%;
    z-index: 2;
    overflow: hidden;
  }

  /* White light cannot show on a white card, so the light theme's default
     is a pale accent; on a solid fill, white shows in both themes. */
  :host(:is([variant="solid"], [variant="shadow"])) .card-glare {
    --_card-glare-color: var(
      --card-glare-color,
      color-mix(in oklab, var(--color-white) 30%, transparent)
    );
  }

  :host(:dir(rtl)) .card-glare {
    --_card-glare-angle: -115deg;
    --_card-glare-from: 100%;
    --_card-glare-to: -100%;
  }

  /* The band waits past the inline start, out of sight. */
  .card-glare::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      var(--_card-glare-angle),
      transparent 25%,
      var(--_card-glare-color) 50%,
      transparent 75%
    );
    translate: var(--_card-glare-from) 0;
  }

  /* It crosses once on the way in and jumps back unseen on the way out,
     because only the hovered state has a transition. */
  @media (prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine) {
    :host(:hover) .card-glare::before {
      translate: var(--_card-glare-to) 0;
      transition: translate var(--card-glare-duration, 700ms)
        var(--ease-smooth, ease);
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :host(${focus}) .card-glare::before {
      translate: var(--_card-glare-to) 0;
      transition: translate var(--card-glare-duration, 700ms)
        var(--ease-smooth, ease);
    }
  }

  /* ── Glow: a turning gradient ring and a coloured glow outside ─────── */
  .card-glow {
    --_card-glow-1: var(--card-glow-color-1, var(--color-accent));
    --_card-glow-2: var(--card-glow-color-2, var(--color-chart-4));
    --_card-glow-size: var(--card-glow-size, 1.5rem);
    --_card-glow-reach: calc(var(--_card-glow-size) * 0.35);
    /* Unregistered, so the ring on ::before inherits the turning value. */
    --_card-glow-angle: var(--moul-card-glow-angle, 0deg);
    /* Outer shadows are drawn only outside the border box, so the glow
       never tints the card itself. The two colours sit on opposite sides
       and orbit as the angle turns. */
    box-shadow:
      calc(cos(var(--_card-glow-angle)) * var(--_card-glow-reach))
        calc(sin(var(--_card-glow-angle)) * var(--_card-glow-reach))
        var(--_card-glow-size)
        color-mix(in oklab, var(--_card-glow-1) 60%, transparent),
      calc(cos(var(--_card-glow-angle)) * var(--_card-glow-reach) * -1)
        calc(sin(var(--_card-glow-angle)) * var(--_card-glow-reach) * -1)
        var(--_card-glow-size)
        color-mix(in oklab, var(--_card-glow-2) 60%, transparent);
    animation: moul-card-glow-turn var(--card-glow-duration, 6s) linear
      infinite;
  }

  .card-glow::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: var(--card-glow-width, 1.5px);
    background: conic-gradient(
      from var(--_card-glow-angle),
      var(--_card-glow-1),
      var(--_card-glow-2),
      var(--_card-glow-1)
    );
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  /* Off screen, set by the controller. */
  .card-glow[data-paused] {
    animation-play-state: paused;
  }

  @keyframes moul-card-glow-turn {
    to {
      --moul-card-glow-angle: 1turn;
    }
  }

  /* The spotlight shows and hides at once and rests at the centre (the
     controller stops writing the position); the glare is a still sheen
     across the middle while hovered or focused; the glow holds still. */
  @media (prefers-reduced-motion: reduce) {
    .card-spotlight {
      transition: none;
    }

    .card-glare::before {
      translate: none;
      opacity: 0;
    }

    :host(${focus}) .card-glare::before {
      opacity: 1;
    }

    .card-glow {
      animation: none;
    }
  }

  @media (prefers-reduced-motion: reduce) and (hover: hover) and (pointer: fine) {
    :host(:hover) .card-glare::before {
      opacity: 1;
    }
  }

  /* Decoration only: gone where the system forces its own colours, and on paper. */
  @media (forced-colors: active), print {
    .card-spotlight,
    .card-glare,
    .card-glow {
      display: none;
    }
  }
`
