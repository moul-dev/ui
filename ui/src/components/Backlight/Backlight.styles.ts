import { css } from 'lit'

export const backlightStyles = css`
  :host {
    display: block;
    position: relative;
  }

  :host([hidden]) {
    display: none;
  }

  /* The filter draws the glow, then the media over it. */
  [part="base"] {
    border-radius: inherit;
  }

  ::slotted(:is(img, video, picture, canvas, svg)) {
    display: block;
    max-inline-size: 100%;
    block-size: auto;
    border-radius: inherit;
  }

  /* Holds the filter without taking room; display: none would switch some
     browsers' filters off. */
  .defs {
    position: absolute;
    inline-size: 0;
    block-size: 0;
    overflow: hidden;
    pointer-events: none;
  }

  /* No glow where the system forces its own colours. */
  @media (forced-colors: active) {
    [part="base"] {
      filter: none !important;
    }
  }
`
