import { css } from 'lit'

/*
 * The light is two copies of the line, a wide faint halo and a narrow core,
 * each drawn as one dash that travels along it. Both paths have
 * pathLength="1000", so the dash lengths below are thousandths of the line
 * whatever its real length, and nothing is measured while it runs. Each dash
 * starts with its front at the `from` end and stops once its tail has passed
 * the `to` end; the gap is longer than the line, so only one dash shows.
 * (Chrome only interpolates stroke-dashoffset with a unit, hence `* 1px`.)
 */

export const connectorBeamStyles = css`
  :host {
    position: absolute;
    inset: 0;
    z-index: -1;
    display: block;
    pointer-events: none;
    --_connector-beam-width: var(--connector-beam-width, 2px);
    --_connector-beam-travel: 1260;
  }

  :host([hidden]) {
    display: none;
  }

  .svg {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    overflow: visible;
  }

  .stop-from {
    stop-color: var(--connector-beam-from, var(--color-chart-4, currentColor));
  }

  .stop-to {
    stop-color: var(--connector-beam-to, var(--color-accent, currentColor));
  }

  path {
    fill: none;
    stroke-linecap: round;
  }

  .track {
    stroke: var(--connector-beam-track, var(--color-border, currentColor));
    stroke-width: var(--_connector-beam-width);
    opacity: 0.8;
  }

  .halo,
  .core {
    stroke: url(#gradient);
    stroke-dasharray: calc(var(--_len) * 1px) 1400px;
    stroke-dashoffset: calc(var(--_len) * 1px);
    animation: moul-connector-beam-run var(--_connector-beam-duration, 3000ms)
      linear var(--_connector-beam-delay, 0ms) infinite both;
  }

  .halo {
    --_len: 260;
    stroke-width: calc(var(--_connector-beam-width) * 2.5);
    opacity: 0.3;
  }

  .core {
    --_len: 110;
    stroke-width: var(--_connector-beam-width);
  }

  :host([is-reversed]) .halo,
  :host([is-reversed]) .core {
    animation-direction: reverse;
  }

  .is-offscreen .halo,
  .is-offscreen .core {
    animation-play-state: paused;
  }

  @keyframes moul-connector-beam-run {
    from {
      stroke-dashoffset: calc(var(--_len) * 1px);
    }
    to {
      stroke-dashoffset: calc(
        (var(--_len) - var(--_connector-beam-travel)) * 1px
      );
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .light {
      display: none;
    }

    .halo,
    .core {
      animation: none;
    }

    /* The connection still shows, in the light's colours. */
    .track {
      stroke: url(#gradient);
      opacity: 0.7;
    }
  }

  @media (forced-colors: active) {
    .track {
      stroke: CanvasText;
      opacity: 1;
    }

    .light {
      display: none;
    }
  }

  @media print {
    .light {
      display: none;
    }
  }
`
