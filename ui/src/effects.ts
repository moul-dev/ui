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
 * Effect elements: confetti; the landing kit (text effects, reveals,
 * marquee, bento grid, device frames and scroll progress); backgrounds and
 * light; site navigation and media (navbar, navigation menu, banner, dock,
 * progress nav, carousel, image slider, compare, video dialog and world
 * map); and pointer and scroll motion (tilt, magnetic, glow border, hover
 * highlight, direction hover, lens, cursor, mask reveal, pointer parallax,
 * connector beam, scroll text, sticky stack, scroll parallax, sticky scroll,
 * tracing beam, scroll frame and page transition).
 */

export {
  type AuroraVariant,
  MoulAurora,
  MoulAurora as Aurora,
} from './components/Aurora'
export {
  MoulBacklight,
  MoulBacklight as Backlight,
} from './components/Backlight'
export {
  type BannerVariant,
  MoulBanner,
  MoulBanner as Banner,
} from './components/Banner'
export {
  type BeamsVariant,
  MoulBeams,
  MoulBeams as Beams,
} from './components/Beams'
// Effect elements: `bun run gen:component <Name> --effect` adds an export for each.
export {
  MoulBentoCard,
  MoulBentoCard as BentoCard,
  MoulBentoGrid,
  MoulBentoGrid as BentoGrid,
} from './components/BentoGrid'
export {
  MoulBorderBeam,
  MoulBorderBeam as BorderBeam,
} from './components/BorderBeam'
export {
  MoulBrowserFrame,
  MoulBrowserFrame as BrowserFrame,
} from './components/BrowserFrame'
export {
  type CarouselAlign,
  type CarouselSlideChangeDetail,
  MoulCarousel,
  MoulCarousel as Carousel,
} from './components/Carousel'
export {
  type CompareChangeDetail,
  type CompareMode,
  type CompareOrientation,
  MoulCompare,
  MoulCompare as Compare,
} from './components/Compare'
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
  type ConnectorBeamPoint,
  connectorBeamPath,
  MoulConnectorBeam,
  MoulConnectorBeam as ConnectorBeam,
} from './components/ConnectorBeam'
export {
  type CursorScope,
  type CursorVariant,
  MoulCursor,
  MoulCursor as Cursor,
} from './components/Cursor'
export {
  MoulDirectionHover,
  MoulDirectionHover as DirectionHover,
} from './components/DirectionHover'
export {
  type DockOrientation,
  MoulDock,
  MoulDock as Dock,
  MoulDockItem,
  MoulDockItem as DockItem,
  MoulDockSeparator,
  MoulDockSeparator as DockSeparator,
} from './components/Dock'
export {
  type EdgeBlurEdges,
  type EdgeBlurOrientation,
  MoulEdgeBlur,
  MoulEdgeBlur as EdgeBlur,
} from './components/EdgeBlur'
export {
  MoulFocusGroup,
  MoulFocusGroup as FocusGroup,
} from './components/FocusGroup'
export {
  glowAngle,
  MoulGlowBorder,
  MoulGlowBorder as GlowBorder,
} from './components/GlowBorder'
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
  MoulHoverHighlight,
  MoulHoverHighlight as HoverHighlight,
} from './components/HoverHighlight'
export {
  type ImageSliderEffect,
  type ImageSliderSlideChangeDetail,
  MoulImageSlider,
  MoulImageSlider as ImageSlider,
} from './components/ImageSlider'
export {
  MoulLens,
  MoulLens as Lens,
} from './components/Lens'
export {
  MoulLightRays,
  MoulLightRays as LightRays,
} from './components/LightRays'
export {
  type MagneticOffset,
  MoulMagnetic,
  MoulMagnetic as Magnetic,
  magneticOffset,
} from './components/Magnetic'
export {
  type MarqueeDirection,
  MoulMarquee,
  MoulMarquee as Marquee,
} from './components/Marquee'
export {
  MoulMaskReveal,
  MoulMaskReveal as MaskReveal,
} from './components/MaskReveal'
export {
  MoulNavbar,
  MoulNavbar as Navbar,
  type NavbarEffect,
  type NavbarVariant,
} from './components/Navbar'
export {
  MoulNavigationMenu,
  MoulNavigationMenu as NavigationMenu,
  MoulNavigationMenuItem,
  MoulNavigationMenuItem as NavigationMenuItem,
  MoulNavigationMenuLink,
  MoulNavigationMenuLink as NavigationMenuLink,
  type NavigationMenuOrientation,
} from './components/NavigationMenu'
export {
  MoulNoise,
  MoulNoise as Noise,
} from './components/Noise'
export {
  MoulOrbit,
  MoulOrbit as Orbit,
} from './components/Orbit'
export {
  MoulPageTransition,
  MoulPageTransition as PageTransition,
  type PageTransitionDirection,
  type PageTransitionEffect,
  type PageTransitionOptions,
  pageTransitionCss,
} from './components/PageTransition'
export {
  MoulPattern,
  MoulPattern as Pattern,
  type PatternFade,
  type PatternVariant,
} from './components/Pattern'
export {
  MoulPerspectiveGrid,
  MoulPerspectiveGrid as PerspectiveGrid,
  type PerspectiveGridVariant,
} from './components/PerspectiveGrid'
export {
  MoulPhoneFrame,
  MoulPhoneFrame as PhoneFrame,
  type PhoneFrameVariant,
} from './components/PhoneFrame'
export {
  MoulPointerParallax,
  MoulPointerParallax as PointerParallax,
  type PointerParallaxScope,
  parseDepth,
} from './components/PointerParallax'
export {
  MoulProgressNav,
  MoulProgressNav as ProgressNav,
  type ProgressNavPlacement,
} from './components/ProgressNav'
export {
  MoulReveal,
  MoulReveal as Reveal,
  type RevealDirection,
} from './components/Reveal'
export {
  MoulRipple,
  MoulRipple as Ripple,
} from './components/Ripple'
export {
  MoulScramble,
  MoulScramble as Scramble,
  type ScrambleTrigger,
} from './components/Scramble'
export {
  MoulScrollFrame,
  MoulScrollFrame as ScrollFrame,
} from './components/ScrollFrame'
export {
  MoulScrollParallax,
  MoulScrollParallax as ScrollParallax,
  type ScrollParallaxOrientation,
} from './components/ScrollParallax'
export {
  MoulScrollProgress,
  MoulScrollProgress as ScrollProgress,
  type ScrollProgressPlacement,
} from './components/ScrollProgress'
export {
  MoulScrollText,
  MoulScrollText as ScrollText,
  type ScrollTextGeometry,
  type ScrollTextRange,
  scrollTextRange,
} from './components/ScrollText'
export {
  MoulShineBorder,
  MoulShineBorder as ShineBorder,
} from './components/ShineBorder'
export {
  MoulSpotlight,
  MoulSpotlight as Spotlight,
  type SpotlightPlacement,
  type SpotlightVariant,
} from './components/Spotlight'
export {
  MoulStickyScroll,
  MoulStickyScroll as StickyScroll,
  MoulStickyScrollItem,
  MoulStickyScrollItem as StickyScrollItem,
  type StickyScrollStepChangeDetail,
} from './components/StickyScroll'
export {
  MoulStickyStack,
  MoulStickyStack as StickyStack,
} from './components/StickyStack'
export {
  MoulTextEntrance,
  MoulTextEntrance as TextEntrance,
  type TextEntranceEffect,
} from './components/TextEntrance'
export { MoulTilt, MoulTilt as Tilt } from './components/Tilt'
export {
  MoulTracingBeam,
  MoulTracingBeam as TracingBeam,
  tracingBeamProgress,
} from './components/TracingBeam'
export {
  MoulTypewriter,
  MoulTypewriter as Typewriter,
} from './components/Typewriter'
export {
  MoulVideoDialog,
  MoulVideoDialog as VideoDialog,
  type VideoDialogAnimation,
  type VideoDialogType,
} from './components/VideoDialog'
export {
  MoulWordRotate,
  MoulWordRotate as WordRotate,
  type WordRotateChangeDetail,
  type WordRotateEffect,
} from './components/WordRotate'
export {
  arcPath,
  MoulWorldMap,
  MoulWorldMap as WorldMap,
  projectPoint,
  type WorldMapArc,
  type WorldMapMarker,
  type WorldMapPoint,
} from './components/WorldMap'
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
