import { css } from 'lit'

/*
 * Every length is in cqi, a percentage of the host's width, so the phone
 * keeps its proportions at any --phone-frame-width.
 */
export const phoneFrameStyles = css`
  :host {
    --_phone-bezel: var(
      --phone-frame-bezel,
      var(--color-eclipse, oklch(0.2103 0.0059 285.89))
    );
    /* The metal band around the edge and the buttons: the bezel, lightened. */
    --_phone-band: color-mix(
      in oklab,
      var(--_phone-bezel) 75%,
      var(--color-white, oklch(1 0 0))
    );
    /* How far the side buttons stand out. */
    --_phone-button: 1cqi;
    /* Bezel thickness, screen corner radius and screen aspect ratio. */
    --_phone-inset: 4.2cqi;
    --_phone-radius: 12.6cqi;
    --_phone-ratio: 393 / 852;

    display: inline-block;
    vertical-align: middle;
    inline-size: var(--phone-frame-width, 18rem);
    max-inline-size: 100%;
    container-type: inline-size;
  }

  :host([hidden]) {
    display: none;
  }

  :host([variant="android"]) {
    --_phone-inset: 3.4cqi;
    --_phone-radius: 8cqi;
    --_phone-ratio: 412 / 915;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  [part="base"] {
    position: relative;
    /* Room for the side buttons inside the host's box. */
    margin-inline: var(--_phone-button);
    padding: var(--_phone-inset);
    border-radius: calc(var(--_phone-radius) + var(--_phone-inset));
    background: var(--_phone-bezel);
    box-shadow:
      inset 0 0 0 0.6cqi var(--_phone-band),
      0 0 0 1px var(--color-border),
      var(--shadow-lg);
  }

  [part="screen"] {
    position: relative;
    overflow: hidden;
    isolation: isolate;
    aspect-ratio: var(--_phone-ratio);
    border-radius: var(--_phone-radius);
    background: var(--color-surface);
    color: var(--color-fg);
    /* The black edge of the glass, which keeps the screen apart from a bezel of the same shade. */
    box-shadow: 0 0 0 0.8cqi var(--color-black, oklch(0 0 0));
  }

  ::slotted(img),
  ::slotted(video),
  ::slotted(iframe) {
    position: absolute;
    inset: 0;
    display: block;
    inline-size: 100%;
    block-size: 100%;
  }

  ::slotted(img),
  ::slotted(video) {
    object-fit: cover;
  }

  ::slotted(iframe) {
    border: 0;
  }

  [part="island"],
  [part="camera"] {
    position: absolute;
    z-index: 1;
    inset-inline: 0;
    margin-inline: auto;
    background: var(--color-black, oklch(0 0 0));
    pointer-events: none;
  }

  [part="island"] {
    inset-block-start: 2.5cqi;
    inline-size: 28.8cqi;
    block-size: 8.5cqi;
    border-radius: var(--radius-full, 9999px);
  }

  [part="camera"] {
    inset-block-start: 2.6cqi;
    inline-size: 3.6cqi;
    block-size: 3.6cqi;
    border-radius: 50%;
  }

  /* Hardware does not mirror in right-to-left pages, so the buttons keep their physical sides. */
  .button {
    position: absolute;
    inline-size: var(--_phone-button);
    background: var(--_phone-band);
  }

  .left {
    left: calc(-1 * var(--_phone-button));
    border-radius: 0.5cqi 0 0 0.5cqi;
  }

  .right {
    right: calc(-1 * var(--_phone-button));
    border-radius: 0 0.5cqi 0.5cqi 0;
  }

  .action {
    top: 17%;
    height: 4.5%;
  }

  .volume-up {
    top: 25%;
    height: 7%;
  }

  .volume-down {
    top: 34%;
    height: 7%;
  }

  .power {
    top: 26%;
    height: 11%;
  }

  :host([variant="android"]) .power {
    top: 21%;
    height: 6%;
  }

  .volume {
    top: 30%;
    height: 12%;
  }
`
