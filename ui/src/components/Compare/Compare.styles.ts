import { css } from 'lit'

export const compareStyles = css`
  :host {
    display: block;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none;
  }

  /* --_compare-position is set on this frame from the position property. */
  .frame {
    --_compare-divider: var(--compare-divider-color, var(--color-white));
    --_compare-glide: var(--duration-fast, 150ms) var(--ease-out, ease-out);
    position: relative;
    isolation: isolate;
    overflow: hidden;
    aspect-ratio: var(--compare-aspect-ratio, auto);
    border-radius: var(--compare-radius, var(--radius-2xl, 1rem));
    background: var(--color-bg-subtle);
    cursor: ew-resize;
    user-select: none;
    -webkit-user-select: none;
    /* A horizontal drag is the element's; vertical swipes still scroll the page. */
    touch-action: pan-y pinch-zoom;
  }

  :host([orientation="vertical"]) .frame {
    cursor: ns-resize;
    touch-action: pan-x pinch-zoom;
  }

  .layer {
    block-size: 100%;
  }

  .after {
    position: absolute;
    inset: 0;
    /* Shows the after layer from the divider to the inline end. */
    clip-path: inset(0 0 0 var(--_compare-position, 50%));
    transition: clip-path var(--_compare-glide);
  }

  :host(:dir(rtl)) .after {
    clip-path: inset(0 var(--_compare-position, 50%) 0 0);
  }

  :host([orientation="vertical"]) .after {
    clip-path: inset(var(--_compare-position, 50%) 0 0 0);
  }

  /* The before image sets the frame's size; both fill it once it has one. */
  ::slotted(*) {
    display: block;
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    object-fit: cover;
    pointer-events: none;
    -webkit-user-drag: none;
  }

  .after ::slotted(*) {
    position: absolute;
    inset: 0;
  }

  .divider {
    position: absolute;
    inset-block: 0;
    inset-inline-start: var(--_compare-position, 50%);
    inline-size: var(--compare-divider-width, 2px);
    translate: -50% 0;
    background: var(--_compare-divider);
    box-shadow: 0 0 0 0.5px oklch(0 0 0 / 0.2), 0 0 12px oklch(0 0 0 / 0.25);
    pointer-events: none;
    transition: inset-inline-start var(--_compare-glide);
  }

  :host(:dir(rtl)) .divider {
    translate: 50% 0;
  }

  :host([orientation="vertical"]) .divider {
    inset-block: auto;
    inset-inline: 0;
    inset-block-start: var(--_compare-position, 50%);
    inline-size: auto;
    block-size: var(--compare-divider-width, 2px);
    translate: 0 -50%;
    transition: inset-block-start var(--_compare-glide);
  }

  .handle {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: var(--_compare-position, 50%);
    z-index: 1;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--compare-handle-size, 2.5rem);
    block-size: var(--compare-handle-size, 2.5rem);
    border-radius: var(--radius-full, 9999px);
    background: var(--_compare-divider);
    color: var(--color-black);
    box-shadow: 0 0 0 0.5px oklch(0 0 0 / 0.2), 0 4px 14px oklch(0 0 0 / 0.3);
    translate: -50% -50%;
    cursor: inherit;
    outline: none;
    transition:
      inset-inline-start var(--_compare-glide),
      scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  :host(:dir(rtl)) .handle {
    translate: 50% -50%;
  }

  :host([orientation="vertical"]) .handle {
    inset-block-start: var(--_compare-position, 50%);
    inset-inline-start: 50%;
    transition:
      inset-block-start var(--_compare-glide),
      scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  :host([orientation="vertical"]) .handle svg {
    rotate: 90deg;
  }

  .handle:focus-visible {
    box-shadow: var(--focus-ring);
  }

  @media (hover: hover) {
    .frame:hover .handle {
      scale: 1.06;
    }
  }

  .frame[data-dragging] .handle {
    scale: 1.1;
  }

  /* While a pointer drags, everything follows it exactly. */
  .frame[data-dragging] .after,
  .frame[data-dragging] .divider,
  .frame[data-dragging] .handle {
    transition: none;
  }

  /* A chip sits inside its own layer, so the other layer and the clip
     cover it as the divider passes over. */
  .chip {
    position: absolute;
    inset-block-start: var(--spacing-3, 0.75rem);
    padding: var(--spacing-1, 0.25rem) var(--spacing-2-5, 0.625rem);
    border-radius: var(--radius-full, 9999px);
    background: color-mix(in oklch, var(--color-black) 55%, transparent);
    color: var(--color-white);
    font-family: var(--font-family-base, inherit);
    font-size: var(--font-size-xs, 0.75rem);
    font-weight: var(--font-weight-medium, 500);
    line-height: 1.25;
    white-space: nowrap;
    pointer-events: none;
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
  }

  .before .chip {
    inset-inline-start: var(--spacing-3, 0.75rem);
  }

  .after .chip {
    inset-inline-end: var(--spacing-3, 0.75rem);
  }

  :host([orientation="vertical"]) .after .chip {
    inset-block: auto var(--spacing-3, 0.75rem);
    inset-inline: var(--spacing-3, 0.75rem) auto;
  }

  @media (prefers-reduced-motion: reduce) {
    .after,
    .divider,
    .handle {
      transition: none !important;
    }

    .frame:hover .handle,
    .frame[data-dragging] .handle {
      scale: none;
    }
  }

  @media (forced-colors: active) {
    .divider,
    .handle {
      background: CanvasText;
      color: Canvas;
    }

    .handle:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
`
