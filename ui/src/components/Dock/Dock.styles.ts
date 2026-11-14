import { css } from 'lit'

/*
 * The dock writes two variables on each child, once per frame while the
 * pointer moves: --_dock-scale (unitless) and --_dock-shift (px along the
 * dock). It writes --_dock-grow (px) on its own bar. Children only ever
 * transform, so the page is never laid out again while the dock magnifies;
 * the short transitions smooth the frame-by-frame targets into one glide.
 */

export const dockStyles = css`
  :host {
    display: inline-block;
    vertical-align: middle;
    --_dock-duration: 160ms;
  }

  :host([hidden]) {
    display: none;
  }

  .bar {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: flex-end;
    justify-content: flex-start;
    gap: var(--dock-gap, 0.5rem);
    padding: var(--dock-padding, 0.5rem);
  }

  :host([orientation="vertical"]) .bar {
    flex-direction: column;
    align-items: flex-start;
  }

  /* The glass panel. It widens by the row's growth, half on each side, so it
     keeps wrapping the items as they spread; it never grows across the dock,
     and the items rise out of it, as on a desktop. */
  .background {
    position: absolute;
    z-index: -1;
    inset-block: 0;
    inset-inline: calc(var(--_dock-grow, 0px) / -2);
    box-sizing: border-box;
    border: 1px solid var(--color-border-glass, var(--color-border));
    border-radius: var(--dock-radius, var(--radius-2xl, 1.25rem));
    background: var(--dock-background, var(--color-bg-glass, var(--color-surface)));
    box-shadow: var(--shadow-glass, var(--shadow-md));
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    backdrop-filter: blur(16px) saturate(1.4);
    pointer-events: none;
    transition: inset var(--_dock-duration) var(--ease-out, ease-out);
  }

  :host([orientation="vertical"]) .background {
    inset-inline: 0;
    inset-block: calc(var(--_dock-grow, 0px) / -2);
  }

  @media (prefers-reduced-motion: reduce) {
    .background {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    .background {
      border-color: CanvasText;
    }
  }
`

export const dockItemStyles = css`
  :host {
    --_dock-item-size: var(--dock-item-size, 2.75rem);

    position: relative;
    display: block;
    flex: none;
    translate: var(--_dock-shift, 0px) 0;
    scale: var(--_dock-scale, 1);
    transform-origin: bottom center;
    transition:
      translate var(--_dock-duration, 160ms) var(--ease-out, ease-out),
      scale var(--_dock-duration, 160ms) var(--ease-out, ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  :host([data-orientation="vertical"]) {
    translate: 0 var(--_dock-shift, 0px);
    transform-origin: left center;
  }

  :host([data-orientation="vertical"]:dir(rtl)) {
    transform-origin: right center;
  }

  /* The item being pointed at, and its label, sit over its neighbours. */
  :host(:hover),
  :host(:focus-within) {
    z-index: 1;
  }

  .item {
    position: relative;
  }

  .control {
    display: grid;
    place-items: center;
    box-sizing: border-box;
    inline-size: var(--_dock-item-size);
    block-size: var(--_dock-item-size);
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--dock-item-radius, 9999px);
    background: var(--dock-item-background, var(--color-surface-secondary));
    color: var(--color-fg);
    font: inherit;
    font-size: calc(var(--_dock-item-size) * 0.45);
    line-height: 1;
    text-decoration: none;
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
    transition: background-color var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  ::slotted(svg),
  ::slotted(img) {
    display: block;
    inline-size: 50%;
    block-size: 50%;
  }

  @media (hover: hover) {
    .control:hover {
      background: var(--color-surface-hover, var(--color-surface-secondary));
    }
  }

  .control:focus-visible {
    box-shadow: var(--focus-ring);
  }

  :host([is-disabled]) .control {
    opacity: var(--disabled-opacity, 0.5);
    cursor: not-allowed;
  }

  /* The tooltip. It is drawn inside the scaled item, so it scales back by
     the same factor from the edge nearest the item and stays the same size
     beside an item of any size. --_dock-label-offset is the small slide it
     makes as it appears. */
  .label {
    --_dock-label-offset: 0.25rem;

    position: absolute;
    inset-block-end: calc(100% + 0.5rem);
    left: 50%;
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--color-bg-elevated, var(--color-surface));
    color: var(--color-fg);
    box-shadow: var(--shadow-overlay, var(--shadow-md));
    font-size: var(--font-size-xs, 0.75rem);
    line-height: var(--line-height-xs, 1rem);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    translate: -50% var(--_dock-label-offset);
    scale: calc(1 / var(--_dock-scale, 1));
    transform-origin: bottom center;
    transition:
      opacity var(--duration-fast, 150ms) var(--ease-out, ease-out),
      translate var(--duration-fast, 150ms) var(--ease-out, ease-out),
      scale var(--_dock-duration, 160ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    :host(:not([is-disabled]):hover) .label {
      --_dock-label-offset: 0px;
      opacity: 1;
    }
  }

  .control:focus-visible ~ .label {
    --_dock-label-offset: 0px;
    opacity: 1;
  }

  :host([data-orientation="vertical"]) .label {
    inset-block-end: auto;
    top: 50%;
    left: calc(100% + 0.5rem);
    translate: calc(-1 * var(--_dock-label-offset)) -50%;
    transform-origin: left center;
  }

  :host([data-orientation="vertical"]:dir(rtl)) .label {
    left: auto;
    right: calc(100% + 0.5rem);
    translate: var(--_dock-label-offset) -50%;
    transform-origin: right center;
  }

  /* The dot under an active item, in the dock's padding. */
  .indicator {
    position: absolute;
    top: calc(100% + 0.1875rem);
    left: 50%;
    inline-size: 0.25rem;
    block-size: 0.25rem;
    border-radius: 50%;
    background: var(--color-fg);
    opacity: 0;
    translate: -50% 0;
    scale: calc(1 / var(--_dock-scale, 1));
    transform-origin: top center;
  }

  :host([is-active]) .indicator {
    opacity: 1;
  }

  :host([data-orientation="vertical"]) .indicator {
    top: 50%;
    left: auto;
    right: calc(100% + 0.1875rem);
    translate: 0 -50%;
    transform-origin: right center;
  }

  :host([data-orientation="vertical"]:dir(rtl)) .indicator {
    right: auto;
    left: calc(100% + 0.1875rem);
    transform-origin: left center;
  }

  /* Nothing grows, so nothing moves; labels fade in without sliding. */
  @media (prefers-reduced-motion: reduce) {
    :host,
    .control {
      transition: none;
    }

    .label {
      --_dock-label-offset: 0px;
      transition: opacity var(--duration-fast, 150ms) linear;
    }
  }

  @media (forced-colors: active) {
    .control {
      border: 1px solid ButtonText;
    }

    .indicator {
      background: CanvasText;
    }
  }
`

export const dockSeparatorStyles = css`
  :host {
    display: block;
    flex: none;
    align-self: center;
    inline-size: 1px;
    block-size: calc(var(--dock-item-size, 2.75rem) * 0.6);
    margin-inline: 0.125rem;
    background: var(--dock-separator-color, var(--color-border));
    translate: var(--_dock-shift, 0px) 0;
    transition: translate var(--_dock-duration, 160ms) var(--ease-out, ease-out);
  }

  :host([hidden]) {
    display: none;
  }

  :host([aria-orientation="horizontal"]) {
    inline-size: calc(var(--dock-item-size, 2.75rem) * 0.6);
    block-size: 1px;
    margin-inline: 0;
    margin-block: 0.125rem;
    translate: 0 var(--_dock-shift, 0px);
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      transition: none;
    }
  }

  @media (forced-colors: active) {
    :host {
      background: CanvasText;
    }
  }
`
