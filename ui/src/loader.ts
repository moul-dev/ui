/**
 * @moul-dev/web-component/loader
 *
 * Loads each element the first time its tag appears, for every element in
 * the library: the main entry's, the effects entry's and the canvas
 * entry's. Importing it registers no element. It watches the page for
 * undefined `moul-*` tags and imports each one's own file, so a page that
 * uses `<moul-button>` downloads the button and what it needs (Lit, the
 * elements it renders), and nothing else. It is the one script a page
 * without a build step needs:
 *
 *   <script type="module" src="https://cdn.jsdelivr.net/npm/@moul-dev/web-component@<version>/dist/cdn/loader.js"></script>
 *
 * - Tags in the page, now or later, load by themselves.
 * - Tags already registered (by `@moul-dev/web-component`, say) are left alone.
 * - Tags inside a shadow root are out of the page watcher's sight: call
 *   `watchElements(shadowRoot)`, or `discoverElements(root)` once.
 * - With a bundler, import each element instead, so it is in the bundle
 *   rather than fetched later: `import '@moul-dev/web-component/elements/button'`.
 */

type ElementLoader = () => Promise<unknown>

/**
 * Every element this entry can load, by tag, with the import that loads it.
 * Each import is a separate file that the browser fetches only when asked.
 */
export const ELEMENTS: Readonly<Record<string, ElementLoader>> = {
  // Written by `bun run sync:elements` from the components: do not edit by hand.
  'moul-accordion': () => import('./elements/accordion'),
  'moul-accordion-item': () => import('./elements/accordion-item'),
  'moul-activity-feed': () => import('./elements/activity-feed'),
  'moul-agent-activity': () => import('./elements/agent-activity'),
  'moul-alert': () => import('./elements/alert'),
  'moul-alert-dialog': () => import('./elements/alert-dialog'),
  'moul-animated-list': () => import('./elements/animated-list'),
  'moul-area-chart': () => import('./elements/area-chart'),
  'moul-aurora': () => import('./elements/aurora'),
  'moul-avatar': () => import('./elements/avatar'),
  'moul-avatar-group': () => import('./elements/avatar-group'),
  'moul-backlight': () => import('./elements/backlight'),
  'moul-badge': () => import('./elements/badge'),
  'moul-banner': () => import('./elements/banner'),
  'moul-bar-chart': () => import('./elements/bar-chart'),
  'moul-beams': () => import('./elements/beams'),
  'moul-bento-card': () => import('./elements/bento-card'),
  'moul-bento-grid': () => import('./elements/bento-grid'),
  'moul-border-beam': () => import('./elements/border-beam'),
  'moul-breadcrumb-item': () => import('./elements/breadcrumb-item'),
  'moul-breadcrumbs': () => import('./elements/breadcrumbs'),
  'moul-browser-frame': () => import('./elements/browser-frame'),
  'moul-button': () => import('./elements/button'),
  'moul-button-group': () => import('./elements/button-group'),
  'moul-calendar': () => import('./elements/calendar'),
  'moul-card': () => import('./elements/card'),
  'moul-card-body': () => import('./elements/card-body'),
  'moul-card-footer': () => import('./elements/card-footer'),
  'moul-card-header': () => import('./elements/card-header'),
  'moul-carousel': () => import('./elements/carousel'),
  'moul-chart-container': () => import('./elements/chart-container'),
  'moul-chart-tooltip': () => import('./elements/chart-tooltip'),
  'moul-chat': () => import('./elements/chat'),
  'moul-checkbox': () => import('./elements/checkbox'),
  'moul-checkbox-group': () => import('./elements/checkbox-group'),
  'moul-code-block': () => import('./elements/code-block'),
  'moul-code-comparison': () => import('./elements/code-comparison'),
  'moul-combobox': () => import('./elements/combobox'),
  'moul-combobox-item': () => import('./elements/combobox-item'),
  'moul-command-palette': () => import('./elements/command-palette'),
  'moul-compare': () => import('./elements/compare'),
  'moul-confetti': () => import('./elements/confetti'),
  'moul-connector-beam': () => import('./elements/connector-beam'),
  'moul-cursor': () => import('./elements/cursor'),
  'moul-cursor-trail': () => import('./canvas/cursor-trail'),
  'moul-date-picker': () => import('./elements/date-picker'),
  'moul-direction-hover': () => import('./elements/direction-hover'),
  'moul-dissolve': () => import('./canvas/dissolve'),
  'moul-dock': () => import('./elements/dock'),
  'moul-dock-item': () => import('./elements/dock-item'),
  'moul-dock-separator': () => import('./elements/dock-separator'),
  'moul-doughnut-chart': () => import('./elements/doughnut-chart'),
  'moul-drawer': () => import('./elements/drawer'),
  'moul-dropdown-menu': () => import('./elements/dropdown-menu'),
  'moul-edge-blur': () => import('./elements/edge-blur'),
  'moul-empty-state': () => import('./elements/empty-state'),
  'moul-expandable-card': () => import('./elements/expandable-card'),
  'moul-file-tree': () => import('./elements/file-tree'),
  'moul-file-upload': () => import('./elements/file-upload'),
  'moul-flow-field': () => import('./canvas/flow-field'),
  'moul-focus-group': () => import('./elements/focus-group'),
  'moul-focus-mode': () => import('./elements/focus-mode'),
  'moul-form': () => import('./elements/form'),
  'moul-funnel-chart': () => import('./elements/funnel-chart'),
  'moul-globe': () => import('./canvas/globe'),
  'moul-glow-border': () => import('./elements/glow-border'),
  'moul-glyph-rain': () => import('./canvas/glyph-rain'),
  'moul-gradient-text': () => import('./elements/gradient-text'),
  'moul-heatmap-chart': () => import('./elements/heatmap-chart'),
  'moul-highlight': () => import('./elements/highlight'),
  'moul-history-ledger': () => import('./elements/history-ledger'),
  'moul-hover-card': () => import('./elements/hover-card'),
  'moul-hover-highlight': () => import('./elements/hover-highlight'),
  'moul-icon-cloud': () => import('./canvas/icon-cloud'),
  'moul-icon-morph': () => import('./elements/icon-morph'),
  'moul-image-effect': () => import('./canvas/image-effect'),
  'moul-image-loader': () => import('./canvas/image-loader'),
  'moul-image-slider': () => import('./elements/image-slider'),
  'moul-input-otp': () => import('./elements/input-otp'),
  'moul-interactive-grid': () => import('./canvas/interactive-grid'),
  'moul-kbd': () => import('./elements/kbd'),
  'moul-lens': () => import('./elements/lens'),
  'moul-light-rays': () => import('./elements/light-rays'),
  'moul-line-chart': () => import('./elements/line-chart'),
  'moul-link': () => import('./elements/link'),
  'moul-logs': () => import('./elements/logs'),
  'moul-logs-viewer': () => import('./elements/logs-viewer'),
  'moul-magnetic': () => import('./elements/magnetic'),
  'moul-marquee': () => import('./elements/marquee'),
  'moul-mask-reveal': () => import('./elements/mask-reveal'),
  'moul-menu-group': () => import('./elements/menu-group'),
  'moul-menu-item': () => import('./elements/menu-item'),
  'moul-menu-separator': () => import('./elements/menu-separator'),
  'moul-modal': () => import('./elements/modal'),
  'moul-navbar': () => import('./elements/navbar'),
  'moul-navigation-menu': () => import('./elements/navigation-menu'),
  'moul-navigation-menu-item': () => import('./elements/navigation-menu-item'),
  'moul-navigation-menu-link': () => import('./elements/navigation-menu-link'),
  'moul-noise': () => import('./elements/noise'),
  'moul-notification-bell': () => import('./elements/notification-bell'),
  'moul-number-field': () => import('./elements/number-field'),
  'moul-number-ticker': () => import('./elements/number-ticker'),
  'moul-orbit': () => import('./elements/orbit'),
  'moul-page-transition': () => import('./elements/page-transition'),
  'moul-pagination': () => import('./elements/pagination'),
  'moul-particles': () => import('./canvas/particles'),
  'moul-pattern': () => import('./elements/pattern'),
  'moul-percentage-bar': () => import('./elements/percentage-bar'),
  'moul-percentage-circle': () => import('./elements/percentage-circle'),
  'moul-perspective-grid': () => import('./elements/perspective-grid'),
  'moul-phone-frame': () => import('./elements/phone-frame'),
  'moul-pointer-parallax': () => import('./elements/pointer-parallax'),
  'moul-popover': () => import('./elements/popover'),
  'moul-press-particles': () => import('./canvas/press-particles'),
  'moul-progress-bar': () => import('./elements/progress-bar'),
  'moul-progress-nav': () => import('./elements/progress-nav'),
  'moul-prompt-input': () => import('./elements/prompt-input'),
  'moul-pull-to-refresh': () => import('./elements/pull-to-refresh'),
  'moul-radio': () => import('./elements/radio'),
  'moul-radio-group': () => import('./elements/radio-group'),
  'moul-relationship-graph': () => import('./elements/relationship-graph'),
  'moul-result-card': () => import('./elements/result-card'),
  'moul-reveal': () => import('./elements/reveal'),
  'moul-ripple': () => import('./elements/ripple'),
  'moul-scramble': () => import('./elements/scramble'),
  'moul-scroll-frame': () => import('./elements/scroll-frame'),
  'moul-scroll-parallax': () => import('./elements/scroll-parallax'),
  'moul-scroll-progress': () => import('./elements/scroll-progress'),
  'moul-scroll-text': () => import('./elements/scroll-text'),
  'moul-search-field': () => import('./elements/search-field'),
  'moul-select': () => import('./elements/select'),
  'moul-select-item': () => import('./elements/select-item'),
  'moul-selection-toolbar': () => import('./elements/selection-toolbar'),
  'moul-separator': () => import('./elements/separator'),
  'moul-shader-field': () => import('./canvas/shader-field'),
  'moul-shine-border': () => import('./elements/shine-border'),
  'moul-sidebar': () => import('./elements/sidebar'),
  'moul-sidebar-aside': () => import('./elements/sidebar-aside'),
  'moul-sidebar-brand': () => import('./elements/sidebar-brand'),
  'moul-sidebar-divider': () => import('./elements/sidebar-divider'),
  'moul-sidebar-footer': () => import('./elements/sidebar-footer'),
  'moul-sidebar-group': () => import('./elements/sidebar-group'),
  'moul-sidebar-header': () => import('./elements/sidebar-header'),
  'moul-sidebar-item': () => import('./elements/sidebar-item'),
  'moul-sidebar-main': () => import('./elements/sidebar-main'),
  'moul-sidebar-user': () => import('./elements/sidebar-user'),
  'moul-skeleton': () => import('./elements/skeleton'),
  'moul-slide-to-confirm': () => import('./elements/slide-to-confirm'),
  'moul-slider': () => import('./elements/slider'),
  'moul-spinner': () => import('./elements/spinner'),
  'moul-split-button': () => import('./elements/split-button'),
  'moul-spotlight': () => import('./elements/spotlight'),
  'moul-starfield': () => import('./canvas/starfield'),
  'moul-stat': () => import('./elements/stat'),
  'moul-step': () => import('./elements/step'),
  'moul-step-loader': () => import('./elements/step-loader'),
  'moul-stepper': () => import('./elements/stepper'),
  'moul-sticky-scroll': () => import('./elements/sticky-scroll'),
  'moul-sticky-scroll-item': () => import('./elements/sticky-scroll-item'),
  'moul-sticky-stack': () => import('./elements/sticky-stack'),
  'moul-streaming-response': () => import('./elements/streaming-response'),
  'moul-switch': () => import('./elements/switch'),
  'moul-tab': () => import('./elements/tab'),
  'moul-tab-panel': () => import('./elements/tab-panel'),
  'moul-table': () => import('./elements/table'),
  'moul-tabs': () => import('./elements/tabs'),
  'moul-tag': () => import('./elements/tag'),
  'moul-tag-group': () => import('./elements/tag-group'),
  'moul-terminal': () => import('./elements/terminal'),
  'moul-terminal-line': () => import('./elements/terminal-line'),
  'moul-text-area': () => import('./elements/text-area'),
  'moul-text-entrance': () => import('./elements/text-entrance'),
  'moul-text-field': () => import('./elements/text-field'),
  'moul-theme-toggle': () => import('./elements/theme-toggle'),
  'moul-thinking-indicator': () => import('./elements/thinking-indicator'),
  'moul-tilt': () => import('./elements/tilt'),
  'moul-timeline': () => import('./elements/timeline'),
  'moul-timeline-item': () => import('./elements/timeline-item'),
  'moul-toast': () => import('./elements/toast'),
  'moul-toast-region': () => import('./elements/toast-region'),
  'moul-toggle-button': () => import('./elements/toggle-button'),
  'moul-toggle-button-group': () => import('./elements/toggle-button-group'),
  'moul-tooltip': () => import('./elements/tooltip'),
  'moul-top-list': () => import('./elements/top-list'),
  'moul-tour': () => import('./elements/tour'),
  'moul-tour-step': () => import('./elements/tour-step'),
  'moul-tracing-beam': () => import('./elements/tracing-beam'),
  'moul-tree': () => import('./elements/tree'),
  'moul-tree-item': () => import('./elements/tree-item'),
  'moul-typewriter': () => import('./elements/typewriter'),
  'moul-typography': () => import('./elements/typography'),
  'moul-video-dialog': () => import('./elements/video-dialog'),
  'moul-warp': () => import('./canvas/warp'),
  'moul-word-rotate': () => import('./elements/word-rotate'),
  'moul-world-map': () => import('./elements/world-map'),
  'moul-zoom-grid': () => import('./canvas/zoom-grid'),
}

const loads = new Map<string, Promise<CustomElementConstructor | undefined>>()

/**
 * Loads and registers one element by tag. Resolves to its class, or to
 * `undefined` for a tag this entry does not know. A tag that is already
 * registered resolves to its class without loading anything. Calling it
 * again returns the same promise; a failed load (a network error) can be
 * tried again.
 */
export function loadElement(
  tag: string,
): Promise<CustomElementConstructor | undefined> {
  const name = tag.toLowerCase()
  const pending = loads.get(name)
  if (pending) return pending
  const load = Object.hasOwn(ELEMENTS, name) ? ELEMENTS[name] : undefined
  if (!load) return Promise.resolve(undefined)
  const registered =
    typeof customElements === 'undefined' ? undefined : customElements.get(name)
  const promise = registered
    ? Promise.resolve(registered)
    : load().then(() =>
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

/** Whether `element` is one of ours that nobody has asked for yet. */
function isPending(element: Element): boolean {
  return (
    Object.hasOwn(ELEMENTS, element.localName) && !loads.has(element.localName)
  )
}

/**
 * Loads every element used in `root` (the document by default), once. For
 * content that is already in place; `watchElements` also covers content
 * added later.
 */
export async function discoverElements(
  root: ParentNode = document,
): Promise<void> {
  const tags = new Set<string>()
  if (root instanceof Element && isPending(root)) tags.add(root.localName)
  // `:not(:defined)` leaves out every built-in and registered element, so
  // the loop sees only custom elements still waiting for a definition.
  for (const element of root.querySelectorAll(':not(:defined)')) {
    if (isPending(element)) tags.add(element.localName)
  }
  await Promise.all([...tags].map((tag) => loadElement(tag)))
}

/**
 * Loads elements in `root` now and whenever they are added to it later.
 * The document is watched from the moment this entry is imported; call
 * this for a shadow root. Returns a function that stops watching. Watching
 * stops by itself once every element has loaded.
 */
export function watchElements(root: Document | ShadowRoot): () => void {
  if (typeof MutationObserver !== 'function') return () => {}
  void discoverElements(root)
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node instanceof Element) void discoverElements(node)
      }
    }
    if (loads.size === Object.keys(ELEMENTS).length) observer.disconnect()
  })
  observer.observe(root, { childList: true, subtree: true })
  return () => observer.disconnect()
}

if (typeof document !== 'undefined') watchElements(document)
