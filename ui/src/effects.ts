/**
 * @moul-dev/web-component/effects
 *
 * The second entry point, for motion. It holds the controllers that pointer,
 * scroll, in-view, drag, text and canvas effects are built on, and will hold
 * the effect elements themselves. It is built as its own bundle, so an app
 * that imports only `@moul-dev/web-component` ships none of it.
 *
 * - PointerController: pointer position as CSS variables, once per frame
 * - ScrollController: scroll progress through native scroll timelines, with a script fallback
 * - InViewController: on-screen tracking that pauses animations off screen
 * - DragController: pointer capture, release velocity and a spring release
 * - TextSplitController / splitText: letters, words or lines, still read as one sentence
 * - CanvasLoopController: pixel ratio, resize, pausing and reduced motion for canvas loops
 *
 * Effect elements: confetti, and the landing kit (text effects, reveals,
 * marquee, bento grid, device frames and scroll progress).
 */

// Effect elements: `bun run gen:component <Name> --effect` adds an export for each.
export {
  MoulBentoCard,
  MoulBentoCard as BentoCard,
  MoulBentoGrid,
  MoulBentoGrid as BentoGrid,
} from './components/BentoGrid'
export {
  MoulBrowserFrame,
  MoulBrowserFrame as BrowserFrame,
} from './components/BrowserFrame'
export {
  type ConfettiOptions,
  type ConfettiPoint,
  type ConfettiShape,
  type ConfettiVariant,
  fireConfetti,
  MoulConfetti,
  MoulConfetti as Confetti,
} from './components/Confetti'
export {
  type GradientTextEffect,
  MoulGradientText,
  MoulGradientText as GradientText,
} from './components/GradientText'
export {
  type HighlightEffect,
  MoulHighlight,
  MoulHighlight as Highlight,
} from './components/Highlight'
export {
  type MarqueeDirection,
  MoulMarquee,
  MoulMarquee as Marquee,
} from './components/Marquee'
export {
  MoulPhoneFrame,
  MoulPhoneFrame as PhoneFrame,
  type PhoneFrameVariant,
} from './components/PhoneFrame'
export {
  MoulReveal,
  MoulReveal as Reveal,
  type RevealDirection,
} from './components/Reveal'
export {
  MoulScramble,
  MoulScramble as Scramble,
  type ScrambleTrigger,
} from './components/Scramble'
export {
  MoulScrollProgress,
  MoulScrollProgress as ScrollProgress,
  type ScrollProgressPlacement,
} from './components/ScrollProgress'
export {
  MoulTextEntrance,
  MoulTextEntrance as TextEntrance,
  type TextEntranceEffect,
} from './components/TextEntrance'
export {
  MoulTypewriter,
  MoulTypewriter as Typewriter,
} from './components/Typewriter'
export {
  MoulWordRotate,
  MoulWordRotate as WordRotate,
  type WordRotateChangeDetail,
  type WordRotateEffect,
} from './components/WordRotate'
export {
  type CanvasContextKind,
  type CanvasFrame,
  CanvasLoopController,
  type CanvasLoopControllerOptions,
} from './controllers/canvas-loop.controller'
export {
  type DragAxis,
  type DragBounds,
  DragController,
  type DragControllerOptions,
  type DragPoint,
  type DragSpring,
  type DragState,
} from './controllers/drag.controller'
export {
  InViewController,
  type InViewControllerOptions,
} from './controllers/in-view.controller'
export {
  closestEdge,
  PointerController,
  type PointerControllerOptions,
  type PointerEdge,
  type PointerState,
} from './controllers/pointer.controller'
export {
  ScrollController,
  type ScrollControllerOptions,
  type ScrollDirection,
  type ScrollState,
} from './controllers/scroll.controller'
export {
  type SplitTextBy,
  type SplitTextOptions,
  type SplitTextResult,
  segmentText,
  splitGraphemes,
  splitText,
  type TextSegment,
  TextSplitController,
  type TextSplitControllerOptions,
} from './controllers/text-split.controller'
export {
  prefersReducedMotion,
  watchReducedMotion,
} from './utils/motion'
