import { css } from 'lit'

export const videoDialogStyles = css`
  :host {
    --_video-radius: var(--video-dialog-radius, var(--radius-2xl, 1rem));
    --_video-ratio: var(--video-dialog-aspect-ratio, 16 / 9);
    --_video-play: var(--video-dialog-play-size, 4.5rem);
    display: block;
    -webkit-tap-highlight-color: transparent;
  }

  :host([hidden]) {
    display: none;
  }

  /* The thumbnail button: the image sets its size, the play button sits in the middle. */
  .trigger {
    position: relative;
    display: block;
    inline-size: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--_video-radius);
    overflow: hidden;
    background: var(--color-bg-subtle);
    color: inherit;
    font: inherit;
    cursor: pointer;
    box-shadow: var(--shadow-surface);
    outline: none;
    transition: box-shadow var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .trigger:focus-visible {
    box-shadow: var(--focus-ring);
  }

  .thumbnail {
    display: block;
    min-block-size: 3rem;
  }

  .thumbnail ::slotted(*) {
    display: block;
    inline-size: 100%;
    block-size: auto;
    margin: 0;
    object-fit: cover;
    transition: scale var(--duration-slow, 400ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .trigger:hover .thumbnail ::slotted(*) {
      scale: 1.03;
    }

    .trigger:hover .play-disc {
      scale: 1.08;
    }
  }

  .trigger:active .play-disc {
    scale: 0.95;
  }

  /* A soft glass ring round a solid disc; the ring breathes outward. */
  .play {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    display: grid;
    place-items: center;
    inline-size: var(--_video-play);
    block-size: var(--_video-play);
    border-radius: var(--radius-full, 9999px);
    background: color-mix(in oklch, var(--color-accent) 22%, transparent);
    translate: -50% -50%;
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    pointer-events: none;
  }

  :host(:dir(rtl)) .play {
    translate: 50% -50%;
  }

  .play::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    border: 2px solid color-mix(in oklch, var(--color-accent) 55%, transparent);
    animation: moul-video-dialog-ring 2.4s var(--ease-out, ease-out) infinite;
  }

  .play-disc {
    display: grid;
    place-items: center;
    inline-size: 72%;
    block-size: 72%;
    border-radius: inherit;
    background: var(--color-accent);
    color: var(--color-accent-fg);
    box-shadow: 0 6px 20px oklch(0 0 0 / 0.28);
    transition: scale var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  .play-disc svg {
    inline-size: 42%;
    block-size: 42%;
    /* The triangle's weight sits left of its box; nudge it to look centred. */
    translate: 6% 0;
  }

  @keyframes moul-video-dialog-ring {
    from {
      scale: 1;
      opacity: 0.9;
    }
    to {
      scale: 1.4;
      opacity: 0;
    }
  }

  /* The dialog is a transparent layer over the whole viewport; the panel is centred in it. */
  dialog {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal, 1300);
    box-sizing: border-box;
    inline-size: 100%;
    block-size: 100%;
    max-inline-size: none;
    max-block-size: none;
    margin: 0;
    padding: var(--spacing-4, 1rem);
    border: 0;
    background: transparent;
    color: var(--color-fg);
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (min-width: 640px) {
    dialog {
      padding: 4rem;
    }
  }

  dialog:not([open]) {
    display: none;
  }

  dialog::backdrop {
    background-color: var(--color-overlay);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
  }

  dialog[open]::backdrop {
    animation: moul-video-dialog-backdrop-in var(--duration-base, 250ms) var(--ease-out, ease-out);
  }

  dialog[data-closing]::backdrop {
    animation: moul-video-dialog-backdrop-out 260ms var(--ease-out, ease-out) forwards;
  }

  @keyframes moul-video-dialog-backdrop-in {
    from {
      opacity: 0;
    }
  }

  @keyframes moul-video-dialog-backdrop-out {
    to {
      opacity: 0;
    }
  }

  /* As wide as allowed, never taller than the viewport leaves room for. */
  .panel {
    position: relative;
    box-sizing: border-box;
    inline-size: min(
      var(--video-dialog-width, 64rem),
      100%,
      calc((100dvh - 2 * var(--spacing-4, 1rem)) * var(--_video-ratio))
    );
    aspect-ratio: var(--_video-ratio);
    border-radius: var(--_video-radius);
    overflow: hidden;
    background: var(--color-black);
    box-shadow: var(--shadow-overlay);
    transform-origin: center;
  }

  @media (min-width: 640px) {
    .panel {
      inline-size: min(
        var(--video-dialog-width, 64rem),
        100%,
        calc((100dvh - 8rem) * var(--_video-ratio))
      );
    }
  }

  dialog[data-closing] .panel,
  dialog[data-closing] .close {
    pointer-events: none;
  }

  iframe,
  video {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    border: 0;
    background: var(--color-black);
  }

  .close {
    position: absolute;
    inset-block-start: var(--spacing-4, 1rem);
    inset-inline-end: var(--spacing-4, 1rem);
    display: grid;
    place-items: center;
    inline-size: 2.5rem;
    block-size: 2.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: var(--radius-full, 9999px);
    background: var(--color-bg-elevated);
    color: var(--color-fg);
    box-shadow: var(--shadow-overlay);
    cursor: pointer;
    outline: none;
    transition:
      scale var(--duration-fast, 150ms) var(--ease-out, ease-out),
      background-color var(--duration-fast, 150ms) var(--ease-out, ease-out);
  }

  @media (hover: hover) {
    .close:hover {
      background: var(--color-surface-hover, var(--color-bg-elevated));
    }
  }

  .close:active {
    scale: 0.94;
  }

  .close:focus-visible {
    box-shadow: var(--focus-ring);
  }

  @media (prefers-reduced-motion: reduce) {
    .play::before {
      animation: none;
      opacity: 0;
    }

    .thumbnail ::slotted(*),
    .play-disc,
    .trigger,
    .close {
      transition: none;
    }

    .trigger:hover .thumbnail ::slotted(*),
    .trigger:hover .play-disc,
    .trigger:active .play-disc,
    .close:active {
      scale: none;
    }

    dialog[open]::backdrop,
    dialog[data-closing]::backdrop {
      animation: none;
    }
  }

  @media (forced-colors: active) {
    .play-disc {
      border: 2px solid ButtonText;
    }

    .trigger:focus-visible,
    .close:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }
  }
`
