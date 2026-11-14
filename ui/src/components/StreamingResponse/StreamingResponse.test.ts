import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './StreamingResponse'
import type { MoulStreamingResponse } from './StreamingResponse'

const root = (el: MoulStreamingResponse) => el.shadowRoot as ShadowRoot
const content = (el: MoulStreamingResponse) =>
  root(el).querySelector<HTMLElement>('[part="content"]') as HTMLElement
const actions = (el: MoulStreamingResponse) =>
  root(el).querySelector<HTMLElement>('[part="actions"]') as HTMLElement
const button = (el: MoulStreamingResponse, name: string) =>
  root(el).querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)

async function mount(
  props: Partial<MoulStreamingResponse> = {},
): Promise<MoulStreamingResponse> {
  const el = await fixture<MoulStreamingResponse>(
    html`<moul-streaming-response></moul-streaming-response>`,
  )
  Object.assign(el, props)
  await el.updateComplete
  return el
}

describe('<moul-streaming-response>', () => {
  let motion: ReducedMotionMock
  let frames: ManualFrames

  beforeEach(() => {
    motion = mockReducedMotion(false)
    frames = manualAnimationFrames()
  })

  afterEach(() => {
    motion.restore()
    frames.restore()
  })

  it('renders Markdown as elements, not as HTML', async () => {
    const el = await mount({
      content: [
        '# Collections',
        '',
        'There are **3** collections and `posts` is the largest.',
        '',
        '- posts',
        '- users',
        '',
        '<img src=x onerror="alert(1)">',
      ].join('\n'),
    })
    const heading = content(el).querySelector('[role="heading"]')
    expect(heading?.textContent?.trim()).toBe('Collections')
    expect(heading?.getAttribute('aria-level')).toBe('3')
    expect(content(el).querySelector('strong')?.textContent).toBe('3')
    expect(content(el).querySelector('.inline-code')?.textContent).toBe('posts')
    expect(content(el).querySelectorAll('li')).toHaveLength(2)
    expect(content(el).querySelector('img')).toBeNull()
    expect(content(el).textContent).toContain('<img src=x onerror="alert(1)">')
  })

  it('starts heading levels at heading-level', async () => {
    const el = await mount({ content: '## Sub', headingLevel: 2 })
    expect(
      content(el).querySelector('[role="heading"]')?.getAttribute('aria-level'),
    ).toBe('3')
  })

  it('shows fenced code in a moul-code-block', async () => {
    const el = await mount({ content: '```json\n{"ok": true}\n```' })
    const block = content(el).querySelector(
      'moul-code-block',
    ) as HTMLElement & {
      code: string
      language: string
    }
    expect(block.code).toBe('{"ok": true}')
    expect(block.language).toBe('json')
  })

  it('links safely and turns images into links', async () => {
    const el = await mount({
      content:
        '[docs](https://moul.dev) [bad](javascript:alert(1)) ![chart](https://img.test/c.png)',
    })
    const links = [...content(el).querySelectorAll('a')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://moul.dev',
      'https://img.test/c.png',
    ])
    expect(links[0]?.rel).toContain('noopener')
    expect(links[0]?.target).toBe('_blank')
    expect(links[1]?.classList.contains('image-link')).toBe(true)
    expect(content(el).textContent).toContain('bad')
  })

  it('links citations to sources and lists the sources once done', async () => {
    const el = await mount({
      content: 'Records are paged [1].',
      sources: [
        { title: 'Records API', url: 'https://docs.moul.dev/records' },
        { title: 'Offline note' },
      ],
    })
    const citation = content(el).querySelector('.citation')
    expect(citation?.getAttribute('href')).toBe('https://docs.moul.dev/records')
    expect(citation?.getAttribute('aria-label')).toBe('Source 1: Records API')
    const sources = root(el).querySelectorAll('[part="source"]')
    expect(sources).toHaveLength(2)
    expect(sources[0]?.textContent).toContain('docs.moul.dev')
    expect(sources[1]?.tagName).toBe('SPAN')
  })

  it('reads its Markdown from its text when content is empty', async () => {
    const el = await fixture<MoulStreamingResponse>(html`
      <moul-streaming-response>
        **Hello** world
      </moul-streaming-response>
    `)
    expect(el.text).toBe('**Hello** world')
    expect(content(el).querySelector('strong')?.textContent).toBe('Hello')
  })

  it('reveals streamed text smoothly behind a caret, then shows the actions', async () => {
    const el = await mount({ isStreaming: true })
    el.appendText('Hello there, this is a streamed answer.')
    await el.updateComplete
    expect(content(el).getAttribute('aria-busy')).toBe('true')
    expect(content(el).textContent?.trim()).toBe('')
    expect(root(el).querySelector('[part="caret"]')).not.toBeNull()
    expect(actions(el).hidden).toBe(true)

    frames.step(0)
    frames.step(100)
    await el.updateComplete
    const partial = content(el).textContent?.trim() ?? ''
    expect(partial.length).toBeGreaterThan(0)
    expect(partial.length).toBeLessThan(39)

    el.isStreaming = false
    for (let t = 200; t < 2000 && el.isRevealing; t += 16) {
      frames.step(t)
      await el.updateComplete
    }
    expect(content(el).textContent?.trim()).toBe(
      'Hello there, this is a streamed answer.',
    )
    expect(content(el).getAttribute('aria-busy')).toBe('false')
    expect(root(el).querySelector('[part="caret"]')).toBeNull()
    expect(actions(el).hidden).toBe(false)
  })

  it('never cuts a Khmer letter from its signs while revealing', async () => {
    const el = await mount({ isStreaming: true })
    const khmer = 'ស្រុកខ្មែរ'
    el.appendText(khmer)
    await el.updateComplete
    for (let t = 0; t < 400 && el.isRevealing; t += 4) {
      frames.step(t)
      await el.updateComplete
      const shown = content(el).textContent?.trim() ?? ''
      const last = shown.charCodeAt(shown.length - 1)
      expect(last).not.toBe(0x17d2)
    }
  })

  it('shows text that arrives complete at once', async () => {
    const el = await mount({ content: 'Already done.' })
    expect(content(el).textContent?.trim()).toBe('Already done.')
    expect(frames.pending).toBe(0)
  })

  it('starts over when the text is replaced', async () => {
    const el = await mount({ content: 'First answer.' })
    el.isStreaming = true
    el.content = 'Second'
    await el.updateComplete
    expect(content(el).textContent?.trim()).toBe('')
  })

  it('copies its Markdown and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    const el = await mount({ content: '**Bold**' })
    const onCopy = vi.fn()
    el.addEventListener('responsecopy', onCopy)
    button(el, 'Copy response')?.click()
    await vi.waitFor(() => expect(onCopy).toHaveBeenCalled())
    expect(writeText).toHaveBeenCalledWith('**Bold**')
    expect(onCopy.mock.calls[0]?.[0].detail).toEqual({
      text: '**Bold**',
      isCopied: true,
    })
    await el.updateComplete
    expect(root(el).querySelector('[role="status"]')?.textContent).toBe(
      'Copied',
    )
    vi.unstubAllGlobals()
  })

  it('fires regenerate, and offers a retry on error', async () => {
    const el = await mount({ content: 'Partial', error: 'Rate limited.' })
    const onRegenerate = vi.fn()
    el.addEventListener('regenerate', onRegenerate)
    const alert = root(el).querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Rate limited.')
    alert?.querySelector('button')?.click()
    expect(onRegenerate).toHaveBeenCalledOnce()
    expect(actions(el).hidden).toBe(true)
  })

  it('limits the actions to the ones named', async () => {
    const el = await mount({ content: 'Done.', actions: 'copy' })
    expect(button(el, 'Copy response')).not.toBeNull()
    expect(button(el, 'Regenerate response')).toBeNull()
    expect(button(el, 'Good response')).toBeNull()
  })

  describe('keyboard and screen readers', () => {
    it('is a region named by label, busy while streaming', async () => {
      const el = await mount({ content: 'Hi', label: 'Answer' })
      expect(content(el).getAttribute('role')).toBe('region')
      expect(content(el).getAttribute('aria-label')).toBe('Answer')
      expect(content(el).getAttribute('aria-busy')).toBe('false')
    })

    it('toggles feedback with aria-pressed and reports it', async () => {
      const el = await mount({ content: 'Done.' })
      const onFeedback = vi.fn()
      el.addEventListener('feedbackchange', onFeedback)
      const good = button(el, 'Good response') as HTMLButtonElement
      const bad = button(el, 'Bad response') as HTMLButtonElement
      good.click()
      await el.updateComplete
      expect(good.getAttribute('aria-pressed')).toBe('true')
      expect(el.feedback).toBe('up')
      bad.click()
      await el.updateComplete
      expect(good.getAttribute('aria-pressed')).toBe('false')
      expect(bad.getAttribute('aria-pressed')).toBe('true')
      bad.click()
      await el.updateComplete
      expect(el.feedback).toBe('')
      expect(onFeedback.mock.calls.map((c) => c[0].detail.value)).toEqual([
        'up',
        'down',
        '',
      ])
    })
  })

  describe('reduced motion', () => {
    it('shows streamed text as soon as it arrives', async () => {
      motion.set(true)
      const el = await mount({ isStreaming: true })
      el.appendText('No smoothing here.')
      await el.updateComplete
      expect(content(el).textContent?.trim()).toBe('No smoothing here.')
      expect(frames.pending).toBe(0)
    })
  })
})
