import { css } from 'lit'

/*
 * State lives on the host: data-state="in" while the overlay is in, and
 * data-edge (top, right, bottom or left) for the side it rests off while out.
 * Before the first reveal it rests below. data-snap drops the transition for
 * the one frame in which the element moves a parked overlay to the edge the
 * pointer is coming from. Only `translate`, `scale` and `opacity` change, so
 * every slide runs on the compositor.
 */

export const directionHoverStyles = css`
  :host {
    --_direction-hover-duration: var(
      --direction-hover-duration,
      var(--duration-slow, 400ms)
    );
    --_direction-hover-x: 0%;
    --_direction-hover-y: 100%;

    display: block;
    position: relative;
    isolation: isolate;
    overflow: hidden;
    /* clip, where supported, so focusing a link in the parked overlay cannot scroll the box. */
    overflow: clip;
    border-radius: var(--direction-hover-radius, var(--radius-xl, 1rem));
    background: var(--color-surface-secondary);
  }

  :host([hidden]) {
    display: none;
  }

  :host([data-edge='top']) {
    --_direction-hover-x: 0%;
    --_direction-hover-y: -100%;
  }

  :host([data-edge='right']) {
    --_direction-hover-x: 100%;
    --_direction-hover-y: 0%;
  }

  :host([data-edge='left']) {
    --_direction-hover-x: -100%;
    --_direction-hover-y: 0%;
  }

  .media {
    height: 100%;
    transition: scale var(--_direction-hover-duration) var(--ease-out, ease-out);
  }

  :host([data-state='in']) .media {
    scale: var(--direction-hover-zoom, 1.05);
  }

  ::slotted(img),
  ::slotted(video),
  ::slotted(picture) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: var(--spacing-1, 0.25rem);
    box-sizing: border-box;
    padding: var(--direction-hover-padding, var(--spacing-4, 1rem));
    background: var(
      --direction-hover-overlay-background,
      linear-gradient(to top, var(--color-overlay) 0%, var(--color-overlay) 35%, transparent 100%)
    );
    color: var(--direction-hover-overlay-color, var(--color-snow));
    translate: var(--_direction-hover-x) var(--_direction-hover-y);
    transition: translate var(--_direction-hover-duration)
      var(--ease-out, ease-out);
  }

  :host([data-state='in']) .overlay {
    translate: 0 0;
  }

  :host([data-snap]) .overlay {
    transition: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .media,
    :host([data-state='in']) .media {
      scale: none;
      transition: none;
    }

    .overlay,
    :host([data-state='in']) .overlay {
      translate: none;
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) ease;
    }

    :host([data-state='in']) .overlay {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .overlay {
      background: Canvas;
      color: CanvasText;
    }
  }
`
