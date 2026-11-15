/**
 * The per-element entries' promise, as tests: every element can be imported
 * on its own, an import registers what that element needs to work, and the
 * loader loads any tag the first time it appears. `ui/size-budget.json`
 * holds each entry, with its chunks, to a size in bytes.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  findElementTags,
  outOfDate,
  registeredBy,
  withLoaderMap,
} from '../../scripts/sync-elements'
import {
  discoverElements,
  ELEMENTS,
  loadElement,
  watchElements,
} from './loader'

const SRC = resolve(__dirname)
const tags = findElementTags(SRC)

/** Every `.ts` file under `dir` that is not a test. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return path.endsWith('.ts') && !path.endsWith('.test.ts') ? [path] : []
  })
}

describe('element entries', () => {
  it('writes the loader map without touching the code around it', () => {
    const loader =
      'export const ELEMENTS: Readonly<Record<string, L>> = {\n}\n\nfunction after() {\n}\n'
    const written = withLoaderMap(loader, [
      {
        tag: 'moul-badge',
        name: 'badge',
        module: join(SRC, 'components/Badge/Badge.ts'),
        kind: 'element',
      },
    ])
    expect(written).toBe(
      "export const ELEMENTS: Readonly<Record<string, L>> = {\n  // Written by `bun run sync:elements` from the components: do not edit by hand.\n  'moul-badge': () => import('./elements/badge'),\n}\n\nfunction after() {\n}\n",
    )
    expect(withLoaderMap(written, [])).toBe(
      'export const ELEMENTS: Readonly<Record<string, L>> = {\n  // Written by `bun run sync:elements` from the components: do not edit by hand.\n\n}\n\nfunction after() {\n}\n',
    )
  })

  it('are up to date with the components (run `bun run sync:elements`)', () => {
    const { changed, stale } = outOfDate(SRC)
    expect([...changed, ...stale].map((path) => relative(SRC, path))).toEqual(
      [],
    )
  })

  it('cover every element of the main and effects entries, and the loader covers every tag', () => {
    const entries = readdirSync(join(SRC, 'elements'))
      .map((name) => name.replace(/\.ts$/, ''))
      .sort()
    expect(entries).toEqual(
      tags
        .filter((tag) => tag.kind === 'element')
        .map((tag) => tag.name)
        .sort(),
    )
    expect(Object.keys(ELEMENTS).sort()).toEqual(
      tags.map((tag) => tag.tag).sort(),
    )
  })

  it.each(
    tags.filter((tag) => tag.kind === 'element').map((tag) => [tag.name, tag]),
  )('elements/%s registers its tag and the rest of its family', (name, tag) => {
    const family = tags
      .filter((other) => dirname(other.module) === dirname(tag.module))
      .map((other) => other.tag)
    const registered = registeredBy(join(SRC, 'elements', `${name}.ts`))
    expect(family.filter((member) => !registered.has(member))).toEqual([])
  })

  it('re-export, whole, every component the main and effects entries export', () => {
    const reexported = new Set(
      readdirSync(join(SRC, 'elements')).flatMap((name) =>
        [
          ...readFileSync(join(SRC, 'elements', name), 'utf8').matchAll(
            /^export \* from '\.\.\/(components\/[A-Za-z]+)'$/gm,
          ),
        ].map(([, folder]) => folder),
      ),
    )
    const registeringFolders = new Set(
      tags.map((tag) => relative(SRC, dirname(tag.module))),
    )
    const missing = ['index.ts', 'effects.ts'].flatMap((entry) =>
      [
        ...readFileSync(join(SRC, entry), 'utf8').matchAll(
          /from '\.\/(components\/[A-Za-z]+)'/g,
        ),
      ]
        .map(([, folder]) => folder)
        // Shared helpers (`components/ChartCommon.ts`) and folders that only
        // re-export another folder's element register nothing of their own.
        .filter((folder) => registeringFolders.has(folder))
        .filter((folder) => !reexported.has(folder))
        .map((folder) => `${entry}: ${folder}`),
    )
    expect(missing).toEqual([])
  })

  it('every component registers the elements it renders, so one import is enough', () => {
    const unregistered = sourceFiles(join(SRC, 'components')).flatMap(
      (file) => {
        const code = readFileSync(file, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/^\s*\/\/.*$/gm, '')
        const rendered = new Set(
          [
            ...code.matchAll(/<(moul-[a-z0-9-]+)[\s>/]/g),
            ...code.matchAll(/createElement\(\s*['"`](moul-[a-z0-9-]+)/g),
          ].map(([, tag]) => tag),
        )
        if (rendered.size === 0) return []
        const registered = registeredBy(file)
        return [...rendered]
          .filter((tag) => !registered.has(tag))
          .map((tag) => `${relative(SRC, file)} renders <${tag}>`)
      },
    )
    expect(unregistered).toEqual([])
  })
})

describe('loader', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  it('imports no element up front: each loader is a dynamic import', () => {
    const source = readFileSync(join(SRC, 'loader.ts'), 'utf8')
    expect(source).not.toMatch(/^import\s/m)
    expect(source).not.toMatch(/^export \* from/m)
  })

  it('leaves a tag that is already registered alone', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    class Placeholder extends HTMLElement {}
    customElements.define('moul-kbd', Placeholder)
    await expect(loadElement('moul-kbd')).resolves.toBe(Placeholder)
    document.body.append(document.createElement('moul-kbd'))
    await discoverElements()
    expect(customElements.get('moul-kbd')).toBe(Placeholder)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('loads an element the first time its tag is added to the page', async () => {
    expect(customElements.get('moul-badge')).toBeUndefined()
    document.body.append(document.createElement('moul-badge'))
    await vi.waitFor(() =>
      expect(customElements.get('moul-badge')).toBeDefined(),
    )
  })

  it('resolves to the class, and to undefined for a tag it does not know', async () => {
    const loaded = await loadElement('MOUL-SEPARATOR')
    expect(loaded).toBe(customElements.get('moul-separator'))
    expect(loadElement('moul-separator')).toBe(loadElement('moul-separator'))
    await expect(loadElement('moul-unknown')).resolves.toBeUndefined()
    await expect(loadElement('div')).resolves.toBeUndefined()
  })

  it('loads canvas elements from their own entries', async () => {
    await loadElement('moul-starfield')
    expect(customElements.get('moul-starfield')).toBeDefined()
  })

  it('finds tags inside a shadow root it is pointed at', async () => {
    const host = document.createElement('div')
    const root = host.attachShadow({ mode: 'open' })
    document.body.append(host)
    root.append(document.createElement('moul-spinner'))
    await discoverElements(root)
    expect(customElements.get('moul-spinner')).toBeDefined()
  })

  it('watches a shadow root for tags added later', async () => {
    const host = document.createElement('div')
    const root = host.attachShadow({ mode: 'open' })
    document.body.append(host)
    const stop = watchElements(root)
    const wrapper = document.createElement('section')
    wrapper.innerHTML = '<moul-skeleton></moul-skeleton>'
    root.append(wrapper)
    await vi.waitFor(() =>
      expect(customElements.get('moul-skeleton')).toBeDefined(),
    )
    stop()
  })

  it('registers every tag it knows', async () => {
    for (const tag of Object.keys(ELEMENTS)) {
      const loaded = await loadElement(tag)
      expect(loaded, tag).toBeDefined()
      expect(loaded, tag).toBe(customElements.get(tag))
    }
  }, 60_000)
})
