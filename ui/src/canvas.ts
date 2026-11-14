/**
 * @moul-dev/web-component/canvas
 *
 * The third entry point, for the heaviest effects: particles, starfields,
 * shaders, the globe and image effects, drawn on a canvas or with WebGL.
 *
 * Importing it registers no element and costs about a kilobyte. It watches
 * the page for the tags in `CANVAS_ELEMENTS` and loads an element's own file
 * the first time its tag appears, so a page that never uses `<moul-globe>`
 * never downloads it. Neither `@moul-dev/web-component` nor
 * `@moul-dev/web-component/effects` contains any of these elements.
 *
 * - Tags in the page, now or later, load by themselves.
 * - Tags inside a shadow root are out of the page watcher's sight: call
 *   `watchCanvasElements(shadowRoot)`, or `discoverCanvasElements(root)` once.
 * - To skip the watcher, import one element's entry, which registers it
 *   straight away: `import '@moul-dev/web-component/canvas/globe'`.
 */

// Types only: erased from the build, so the loader stays free of element code.
export type {
  CursorTrailVariant,
  MoulCursorTrail,
} from './components/CursorTrail'
export type { DissolveDirection, MoulDissolve } from './components/Dissolve'
export type { FlowFieldVariant, MoulFlowField } from './components/FlowField'
export type {
  GlobeArc,
  GlobeMarker,
  GlobePoint,
  GlobeView,
  MoulGlobe,
} from './components/Globe'
export type { GlyphRainVariant, MoulGlyphRain } from './components/GlyphRain'
export type {
  IconCloudPressDetail,
  MoulIconCloud,
} from './components/IconCloud'
export type { ImageEffectName, MoulImageEffect } from './components/ImageEffect'
export type {
  ImageLoaderPhase,
  ImageLoaderRevealDetail,
  MoulImageLoader,
} from './components/ImageLoader'
export type {
  InteractiveGridFade,
  InteractiveGridVariant,
  MoulInteractiveGrid,
} from './components/InteractiveGrid'
export type {
  MoulParticles,
  ParticlesPointer,
  ParticlesVariant,
} from './components/Particles'
export type {
  MoulPressParticles,
  PressParticleShape,
  PressParticlesPoint,
} from './components/PressParticles'
export type {
  MoulShaderField,
  ShaderFieldShape,
  ShaderFieldVariant,
} from './components/ShaderField'
export type { MoulStarfield } from './components/Starfield'
export type { MoulWarp, WarpBoost, WarpVariant } from './components/Warp'
export type { MoulZoomGrid } from './components/ZoomGrid'

type CanvasElementLoader = () => Promise<unknown>

/**
 * Every element this entry can load, by tag, with the import that loads it.
 * Each import is a separate file that the browser fetches only when asked.
 */
export const CANVAS_ELEMENTS: Readonly<Record<string, CanvasElementLoader>> = {
  // Canvas elements: `bun run gen:component <Name> --canvas` adds a line for each.
  'moul-cursor-trail': () => import('./canvas/cursor-trail'),
  'moul-dissolve': () => import('./canvas/dissolve'),
  'moul-flow-field': () => import('./canvas/flow-field'),
  'moul-globe': () => import('./canvas/globe'),
  'moul-glyph-rain': () => import('./canvas/glyph-rain'),
  'moul-icon-cloud': () => import('./canvas/icon-cloud'),
  'moul-image-effect': () => import('./canvas/image-effect'),
  'moul-image-loader': () => import('./canvas/image-loader'),
  'moul-interactive-grid': () => import('./canvas/interactive-grid'),
  'moul-particles': () => import('./canvas/particles'),
  'moul-press-particles': () => import('./canvas/press-particles'),
  'moul-shader-field': () => import('./canvas/shader-field'),
  'moul-starfield': () => import('./canvas/starfield'),
  'moul-warp': () => import('./canvas/warp'),
  'moul-zoom-grid': () => import('./canvas/zoom-grid'),
}

const loads = new Map<string, Promise<CustomElementConstructor | undefined>>()

/** Tags not yet asked for, as one selector, or '' when every tag is loading or loaded. */
function pendingSelector(): string {
  return Object.keys(CANVAS_ELEMENTS)
    .filter((tag) => !loads.has(tag))
    .join(',')
}

/**
 * Loads and registers one element by tag. Resolves to its class, or to
 * `undefined` for a tag this entry does not know. Calling it again returns
 * the same promise; a failed load (a network error) can be tried again.
 */
export function loadCanvasElement(
  tag: string,
): Promise<CustomElementConstructor | undefined> {
  const name = tag.toLowerCase()
  const pending = loads.get(name)
  if (pending) return pending
  const load = Object.hasOwn(CANVAS_ELEMENTS, name)
    ? CANVAS_ELEMENTS[name]
    : undefined
  if (!load) return Promise.resolve(undefined)
  const promise = load().then(() =>
    typeof customElements === 'undefined'
      ? undefined
      : customElements.get(name),
  )
  loads.set(name, promise)
  promise.catch((error: unknown) => {
    loads.delete(name)
    console.error(`[moul] Could not load <${name}>.`, error)
  })
  return promise
}

/**
 * Loads every canvas element used in `root` (the document by default), once.
 * For content that is already in place; `watchCanvasElements` also covers
 * content added later.
 */
export async function discoverCanvasElements(
  root: ParentNode = document,
): Promise<void> {
  const selector = pendingSelector()
  if (!selector) return
  const tags = new Set<string>()
  if (root instanceof Element && root.matches(selector)) {
    tags.add(root.localName)
  }
  for (const element of root.querySelectorAll(selector)) {
    tags.add(element.localName)
  }
  await Promise.all([...tags].map((tag) => loadCanvasElement(tag)))
}

/**
 * Loads canvas elements in `root` now and whenever they are added to it
 * later. The document is watched from the moment this entry is imported;
 * call this for a shadow root. Returns a function that stops watching.
 * Watching stops by itself once every element has loaded.
 */
export function watchCanvasElements(root: Document | ShadowRoot): () => void {
  if (typeof MutationObserver !== 'function') return () => {}
  void discoverCanvasElements(root)
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) void discoverCanvasElements(node)
      }
    }
    if (!pendingSelector()) observer.disconnect()
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}

if (typeof document !== 'undefined') watchCanvasElements(document)
