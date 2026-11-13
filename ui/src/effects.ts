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
 */

// Effect elements: `bun run gen:component <Name> --effect` adds an export for each.
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
