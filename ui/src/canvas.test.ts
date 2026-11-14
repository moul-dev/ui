/**
 * The canvas entry's promise, as tests: each canvas element loads on demand,
 * and none of them is reachable from the main or the effects entry, so
 * neither base bundle pays for them. `ui/size-budget.json` holds the built
 * files to the same promise in bytes.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CANVAS_ELEMENTS,
  discoverCanvasElements,
  loadCanvasElement,
  watchCanvasElements,
} from './canvas'

const SRC = resolve(__dirname)
const PIECES_DIR = join(SRC, 'canvas')

/** `src/canvas/<name>.ts` files, the `@moul-dev/web-component/canvas/<name>` entries. */
const pieces = readdirSync(PIECES_DIR)
  .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
  .map((name) => name.replace(/\.ts$/, ''))

/** The component folder each piece re-exports. */
function componentOf(piece: string): string {
  const source = readFileSync(join(PIECES_DIR, `${piece}.ts`), 'utf8')
  const match = source.match(/from '\.\.\/components\/(\w+)'/)
  if (!match) throw new Error(`src/canvas/${piece}.ts re-exports no component`)
  return match[1]
}

const canvasComponents = new Set(pieces.map(componentOf))

/** Relative imports of a module, resolved to files. */
function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  const specifiers = [
    ...source.matchAll(/(?:from|import)\s*\(?\s*'(\.[^']+)'/g),
  ].map((match) => match[1])
  return specifiers.flatMap((specifier) => {
    const base = resolve(dirname(file), specifier)
    const candidates = [base, `${base}.ts`, join(base, 'index.ts')].filter(
      (path) => existsSync(path) && path.endsWith('.ts'),
    )
    return candidates.slice(0, 1)
  })
}

/** Every module reachable from `entry` through static and dynamic relative imports. */
function reachable(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file)) continue
    seen.add(file)
    queue.push(...importsOf(file))
  }
  return seen
}

describe('canvas entry', () => {
  it('has one loader per canvas element, and an entry file for each', () => {
    expect(pieces.length).toBeGreaterThan(0)
    expect(Object.keys(CANVAS_ELEMENTS).sort()).toEqual(
      pieces.map((piece) => `moul-${piece}`).sort(),
    )
  })

  it('names each entry after the tag its component registers', () => {
    for (const piece of pieces) {
      const component = componentOf(piece)
      const source = readFileSync(
        join(SRC, 'components', component, `${component}.ts`),
        'utf8',
      )
      expect(source, `src/canvas/${piece}.ts`).toContain(
        `defineElement('moul-${piece}'`,
      )
    }
  })

  it.each([
    ['main', 'index.ts'],
    ['effects', 'effects.ts'],
  ])('keeps every canvas element out of the %s entry', (_name, file) => {
    const modules = reachable(join(SRC, file))
    const leaked = [...modules].filter((path) =>
      [...canvasComponents].some((component) =>
        path.includes(`/components/${component}/`),
      ),
    )
    expect(leaked).toEqual([])
    expect(modules.has(join(SRC, 'canvas.ts'))).toBe(false)
  })

  it('imports no element up front: each loader is a dynamic import', () => {
    const source = readFileSync(join(SRC, 'canvas.ts'), 'utf8')
    expect(source).not.toMatch(/^import\s/m)
    expect(source).not.toMatch(/^export \* from/m)
  })

  describe('loading on demand', () => {
    afterEach(() => {
      document.body.replaceChildren()
    })

    it('loads an element the first time its tag is added to the page', async () => {
      const tag = Object.keys(CANVAS_ELEMENTS)[0]
      expect(customElements.get(tag)).toBeUndefined()
      document.body.append(document.createElement(tag))
      await vi.waitFor(() => expect(customElements.get(tag)).toBeDefined())
    })

    it('resolves to the class, and to undefined for a tag it does not know', async () => {
      const tag = Object.keys(CANVAS_ELEMENTS)[1]
      const loaded = await loadCanvasElement(tag.toUpperCase())
      expect(loaded).toBe(customElements.get(tag))
      expect(loadCanvasElement(tag)).toBe(loadCanvasElement(tag))
      await expect(loadCanvasElement('moul-button')).resolves.toBeUndefined()
    })

    it('finds tags inside a shadow root it is pointed at', async () => {
      const tag = Object.keys(CANVAS_ELEMENTS)[2]
      const host = document.createElement('div')
      const root = host.attachShadow({ mode: 'open' })
      document.body.append(host)
      root.append(document.createElement(tag))
      await discoverCanvasElements(root)
      expect(customElements.get(tag)).toBeDefined()
    })

    it('watches a shadow root for tags added later', async () => {
      const tag = Object.keys(CANVAS_ELEMENTS)[3]
      const host = document.createElement('div')
      const root = host.attachShadow({ mode: 'open' })
      document.body.append(host)
      const stop = watchCanvasElements(root)
      const wrapper = document.createElement('section')
      wrapper.innerHTML = `<${tag}></${tag}>`
      root.append(wrapper)
      await vi.waitFor(() => expect(customElements.get(tag)).toBeDefined())
      stop()
    })
  })
})
