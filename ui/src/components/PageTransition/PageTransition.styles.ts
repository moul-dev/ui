import { css } from 'lit'

/** The element itself draws nothing. */
export const pageTransitionStyles = css`
  :host {
    display: none !important;
  }
`

/**
 * `fade` cross-fades the pages. `wipe` sweeps a panel of colour across the
 * screen, covering the old page and uncovering the new one. `slide` pushes
 * the new page in from the inline end. `circle` grows the new page out of a
 * circle from the point the reader clicked or tapped.
 */
export type PageTransitionEffect = 'fade' | 'wipe' | 'slide' | 'circle'

export const PAGE_TRANSITION_EFFECTS: readonly PageTransitionEffect[] = [
  'fade',
  'wipe',
  'slide',
  'circle',
]

/** The attribute the element sets on `<html>` while its own same-page transition runs. */
export const EFFECT_ATTRIBUTE = 'data-moul-page-transition'
/** Set on `<html>` to `backward` while a transition plays in reverse. */
export const DIRECTION_ATTRIBUTE = 'data-moul-page-transition-direction'
/** View transition types: `moul-page-<effect>` and this one for going back. */
export const TYPE_PREFIX = 'moul-page-'
export const BACKWARD_TYPE = 'moul-page-backward'
/** Where the circle grows from, and how far, written on `<html>`. */
export const ORIGIN_X = '--_moul-page-transition-x'
export const ORIGIN_Y = '--_moul-page-transition-y'
export const ORIGIN_R = '--_moul-page-transition-r'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'

/**
 * The document-level CSS for one effect. View transition pseudo-elements
 * hang off the document, never a shadow root, so the element puts this in a
 * `<style>` in the document head. A server can inline the same text in the
 * page's head, so the opt-in is there before any script runs.
 *
 * Every rule is scoped to a transition the element started: a cross-page
 * navigation carries the `moul-page-<effect>` type from the `@view-transition`
 * rule, and a same-page transition sets `data-moul-page-transition` on
 * `<html>`. Other view transitions on the page keep their own animations.
 * `:is()` forgives a selector it does not know, so a browser without
 * view transition types still matches the attribute.
 */
export function pageTransitionCss(
  effect: PageTransitionEffect,
  duration: number,
): string {
  const ms = (share: number) => `${Math.round(duration * share)}ms`
  const scope = `html:is(:active-view-transition-type(${TYPE_PREFIX}${effect}), [${EFFECT_ATTRIBUTE}="${effect}"])`
  const backward = `:is(:active-view-transition-type(${BACKWARD_TYPE}), [${DIRECTION_ATTRIBUTE}="backward"])`
  // Toward the inline start: going forward in right-to-left text, or going back in left-to-right.
  const reversed = [
    `${scope}:dir(rtl):not(${backward})`,
    `${scope}:dir(ltr)${backward}`,
  ]
  const at = (selectors: string[], pseudo: string) =>
    selectors.map((selector) => `${selector}::${pseudo}`).join(',\n')
  const old = 'view-transition-old(root)'
  const next = 'view-transition-new(root)'

  const shared = `
${scope}::view-transition-group(root) {
  animation-duration: ${ms(1)};
}
${at([scope], old)},
${at([scope], next)} {
  animation-duration: ${ms(1)};
  animation-timing-function: ${EASE};
  animation-fill-mode: both;
}`

  const effects: Record<PageTransitionEffect, string> = {
    fade: `
${at([scope], old)} { animation-name: moul-page-fade-out; }
${at([scope], next)} { animation-name: moul-page-fade-in; }
@keyframes moul-page-fade-out { to { opacity: 0; } }
@keyframes moul-page-fade-in { from { opacity: 0; } }`,

    // The old page is wiped away from one side while the new one follows
    // it in from the same side; the gap between them shows the panel colour,
    // painted on the transition's root.
    wipe: `
${scope}::view-transition {
  background: var(--page-transition-color, var(--color-accent, CanvasText));
}
${at([scope], old)},
${at([scope], next)} {
  mix-blend-mode: normal;
  animation-duration: ${ms(0.6)};
}
${at([scope], old)} { animation-name: moul-page-wipe-out; }
${at([scope], next)} {
  animation-name: moul-page-wipe-in;
  animation-delay: ${ms(0.4)};
}
${at(reversed, old)} { animation-name: moul-page-wipe-out-reverse; }
${at(reversed, next)} { animation-name: moul-page-wipe-in-reverse; }
@keyframes moul-page-wipe-out { to { clip-path: inset(0 0 0 100%); } }
@keyframes moul-page-wipe-in { from { clip-path: inset(0 100% 0 0); } to { clip-path: inset(0); } }
@keyframes moul-page-wipe-out-reverse { to { clip-path: inset(0 100% 0 0); } }
@keyframes moul-page-wipe-in-reverse { from { clip-path: inset(0 0 0 100%); } to { clip-path: inset(0); } }`,

    // The new page slides over the old one, which drifts a little the other way.
    slide: `
${at([scope], old)},
${at([scope], next)} { mix-blend-mode: normal; }
${at([scope], old)} { animation-name: moul-page-slide-out; }
${at([scope], next)} {
  animation-name: moul-page-slide-in;
  box-shadow: 0 0 2rem rgb(0 0 0 / 0.18);
}
${at(reversed, old)} { animation-name: moul-page-slide-out-reverse; }
${at(reversed, next)} { animation-name: moul-page-slide-in-reverse; }
@keyframes moul-page-slide-out { to { transform: translateX(-30%); } }
@keyframes moul-page-slide-in { from { transform: translateX(100%); } }
@keyframes moul-page-slide-out-reverse { to { transform: translateX(30%); } }
@keyframes moul-page-slide-in-reverse { from { transform: translateX(-100%); } }`,

    // The old page stays put while the new one grows over it from the origin.
    circle: `
${at([scope], old)} { animation-name: none; }
${at([scope], next)} {
  mix-blend-mode: normal;
  animation-name: moul-page-circle-in;
}
@keyframes moul-page-circle-in {
  from {
    clip-path: circle(0 at var(${ORIGIN_X}, 50%) var(${ORIGIN_Y}, 50%));
  }
  to {
    clip-path: circle(var(${ORIGIN_R}, 75vmax) at var(${ORIGIN_X}, 50%) var(${ORIGIN_Y}, 50%));
  }
}`,
  }

  // Nothing at all under reduced motion: no opt-in, so the browser swaps pages at once.
  return `@media (prefers-reduced-motion: no-preference) {
@view-transition {
  navigation: auto;
  types: ${TYPE_PREFIX}${effect};
}
${shared}
${effects[effect]}
}
`
}
