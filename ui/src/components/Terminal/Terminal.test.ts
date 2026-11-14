import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './Terminal'
import type { MoulTerminal } from './Terminal'
import type { MoulTerminalLine } from './TerminalLine'

let intersect: ((isIntersecting: boolean) => void) | null = null
const OriginalObserver = globalThis.IntersectionObserver

/** An IntersectionObserver the test drives: `intersect(true)` scrolls the terminal into view. */
class FakeObserver {
  constructor(callback: IntersectionObserverCallback) {
    intersect = (isIntersecting) =>
      callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      )
  }
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}

const SESSION = `
  <moul-terminal-line is-command>bun add moul</moul-terminal-line>
  <moul-terminal-line tone="muted">resolving…</moul-terminal-line>
  <moul-terminal-line tone="success">✓ done</moul-terminal-line>
  <moul-terminal-line is-command prompt="❯">bun dev</moul-terminal-line>
`

async function mount(attrs = '', lines = SESSION): Promise<MoulTerminal> {
  const host = document.createElement('div')
  host.innerHTML = `<moul-terminal ${attrs}>${lines}</moul-terminal>`
  document.body.append(host)
  const el = host.firstElementChild as MoulTerminal
  await el.updateComplete
  await Promise.all(el.lines.map((line) => line.updateComplete))
  return el
}

const states = (el: MoulTerminal) => el.lines.map((line) => line.state)
const typedText = (line: MoulTerminalLine) =>
  line.shadowRoot?.querySelector('.typed')?.textContent ?? null

describe('<moul-terminal>', () => {
  beforeEach(() => {
    globalThis.IntersectionObserver =
      FakeObserver as unknown as typeof IntersectionObserver
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.IntersectionObserver = OriginalObserver
    intersect = null
    document.body.innerHTML = ''
  })

  it('shows every line at once with is-static', async () => {
    const el = await mount('is-static')
    expect(states(el)).toEqual(['shown', 'shown', 'shown', 'shown'])
    expect(
      el.lines[0].shadowRoot?.querySelector('[part~="prompt"]')?.textContent,
    ).toBe('$')
    expect(
      el.lines[3].shadowRoot?.querySelector('[part~="prompt"]')?.textContent,
    ).toBe('❯')
  })

  it('waits until it is on screen, then types commands and shows output in turn', async () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()
    const el = await mount('typing-speed="10" line-delay="100"')
    el.addEventListener('complete', onComplete)
    expect(states(el)).toEqual(['waiting', 'waiting', 'waiting', 'waiting'])

    intersect?.(true)
    await vi.advanceTimersByTimeAsync(100)
    expect(el.lines[0].state).toBe('typing')
    // One character as typing starts, then one every 10ms.
    await vi.advanceTimersByTimeAsync(20)
    await el.lines[0].updateComplete
    expect(typedText(el.lines[0])).toBe('bun')

    // The rest of the command, the pause after it, then the first output line.
    await vi.advanceTimersByTimeAsync(100 + 160)
    expect(el.lines[0].state).toBe('shown')
    expect(el.lines[1].state).toBe('waiting')
    await vi.advanceTimersByTimeAsync(100)
    expect(el.lines[1].state).toBe('shown')
    expect(el.lines[2].state).toBe('waiting')

    await vi.advanceTimersByTimeAsync(5000)
    expect(states(el)).toEqual(['shown', 'shown', 'shown', 'shown'])
    expect(onComplete).toHaveBeenCalledTimes(1)
    await el.updateComplete
    expect(
      el.shadowRoot?.querySelector('[part~="replay-button"]'),
    ).not.toBeNull()
  })

  it('plays again from the start with replay()', async () => {
    vi.useFakeTimers()
    const el = await mount('typing-speed="1" line-delay="10"')
    intersect?.(true)
    await vi.advanceTimersByTimeAsync(5000)
    el.replay()
    expect(states(el)).toEqual(['waiting', 'waiting', 'waiting', 'waiting'])
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('[part~="replay-button"]')).toBeNull()
    await vi.advanceTimersByTimeAsync(5000)
    expect(states(el)).toEqual(['shown', 'shown', 'shown', 'shown'])
  })

  it('shows lines added after the session at once', async () => {
    const el = await mount('is-static')
    const line = document.createElement('moul-terminal-line')
    line.textContent = 'late'
    el.append(line)
    await el.updateComplete
    await new Promise((resolve) => setTimeout(resolve))
    expect(line.state).toBe('shown')
  })

  it('shows the whole session when it leaves the page mid-playback', async () => {
    vi.useFakeTimers()
    const el = await mount()
    intersect?.(true)
    await vi.advanceTimersByTimeAsync(250)
    const lines = el.lines
    el.remove()
    expect(lines.map((line) => line.state)).toEqual([
      'shown',
      'shown',
      'shown',
      'shown',
    ])
  })

  it('copies the commands without prompts or output', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const el = await mount('is-static')
    el.shadowRoot
      ?.querySelector<HTMLButtonElement>('[part~="copy-button"]')
      ?.click()
    await vi.waitFor(() =>
      expect(
        el.shadowRoot?.querySelector('[role="status"]')?.textContent?.trim(),
      ).toBe('Copied'),
    )
    expect(writeText).toHaveBeenCalledWith('bun add moul\nbun dev')
  })

  it('offers no copy button without commands, or with hide-copy', async () => {
    const plain = await mount(
      'is-static',
      '<moul-terminal-line>hi</moul-terminal-line>',
    )
    expect(plain.shadowRoot?.querySelector('[part~="copy-button"]')).toBeNull()
    const hidden = await mount('is-static hide-copy')
    expect(hidden.shadowRoot?.querySelector('[part~="copy-button"]')).toBeNull()
  })

  describe('keyboard and screen readers', () => {
    it('is a group named by its label, with buttons reached by Tab', async () => {
      const el = await mount('is-static label="zsh"')
      const base = el.shadowRoot?.querySelector('[part~="base"]')
      expect(base?.getAttribute('role')).toBe('group')
      expect(base?.getAttribute('aria-label')).toBe('zsh')
      expect(el.shadowRoot?.querySelector('[part~="title"]')?.textContent).toBe(
        'zsh',
      )
      const copyButton = el.shadowRoot?.querySelector('[part~="copy-button"]')
      expect(copyButton?.tagName).toBe('BUTTON')
      expect(copyButton?.getAttribute('aria-label')).toBe('Copy commands')
    })

    it('keeps the full text readable while hiding the prompt and the typed copy', async () => {
      vi.useFakeTimers()
      const el = await mount('typing-speed="10"')
      intersect?.(true)
      await vi.advanceTimersByTimeAsync(240)
      const line = el.lines[0]
      await line.updateComplete
      expect(line.state).toBe('typing')
      expect(line.textContent).toBe('bun add moul')
      expect(line.shadowRoot?.querySelector('slot')).not.toBeNull()
      expect(
        line.shadowRoot?.querySelector('.typed')?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(
        line.shadowRoot
          ?.querySelector('[part~="prompt"]')
          ?.getAttribute('aria-hidden'),
      ).toBe('true')
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock

    afterEach(() => motion?.restore())

    it('shows every line at once and offers no replay', async () => {
      motion = mockReducedMotion(true)
      const el = await mount()
      expect(states(el)).toEqual(['shown', 'shown', 'shown', 'shown'])
      await el.updateComplete
      expect(el.shadowRoot?.querySelector('[part~="replay-button"]')).toBeNull()
    })

    it('finishes at once when the setting turns on mid-playback', async () => {
      vi.useFakeTimers()
      motion = mockReducedMotion(false)
      const el = await mount()
      intersect?.(true)
      await vi.advanceTimersByTimeAsync(250)
      expect(el.lines[0].state).toBe('typing')
      motion.set(true)
      expect(states(el)).toEqual(['shown', 'shown', 'shown', 'shown'])
    })
  })
})
