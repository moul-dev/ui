import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './StepLoader'
import type { MoulStepLoader, StepLoaderStep } from './StepLoader'
import { stepLoaderStyles } from './StepLoader.styles'

const STEPS: StepLoaderStep[] = [
  'Checking files',
  { label: 'Uploading', description: '3 of 12 files' },
  'Publishing',
]

async function mount(
  props: Partial<MoulStepLoader> = {},
): Promise<MoulStepLoader> {
  const el = await fixture<MoulStepLoader>(
    html`<moul-step-loader></moul-step-loader>`,
  )
  Object.assign(el, { steps: STEPS, ...props })
  await el.updateComplete
  return el
}

const rows = (el: MoulStepLoader) =>
  Array.from(el.shadowRoot?.querySelectorAll<HTMLElement>('li') ?? [])
const states = (el: MoulStepLoader) => rows(el).map((row) => row.dataset.state)
const announcement = (el: MoulStepLoader) =>
  el.shadowRoot?.querySelector('[role="status"]')?.textContent?.trim()

describe('<moul-step-loader>', () => {
  let motion: ReducedMotionMock | null = null

  afterEach(() => {
    motion?.restore()
    motion = null
    vi.useRealTimers()
  })

  it('marks steps before current done, current in progress and later pending', async () => {
    const el = await mount({ current: 1 })
    expect(states(el)).toEqual(['done', 'current', 'pending'])
    expect(rows(el)[0].querySelector('svg.mark path')).not.toBeNull()
    expect(rows(el)[1].querySelector('moul-spinner')).not.toBeNull()
    expect(rows(el)[2].querySelector('svg, moul-spinner')).toBeNull()
    expect(rows(el)[1].querySelector('[part="description"]')?.textContent).toBe(
      '3 of 12 files',
    )
    expect(rows(el)[1].getAttribute('part')).toBe('step step-current')
  })

  it('shows every step done once current reaches the end, and fires complete once', async () => {
    const el = await mount({ current: 2 })
    const onComplete = vi.fn()
    el.addEventListener('complete', onComplete)
    el.current = 3
    await el.updateComplete
    expect(el.isComplete).toBe(true)
    expect(states(el)).toEqual(['done', 'done', 'done'])
    expect(onComplete).toHaveBeenCalledTimes(1)
    el.current = 4
    await el.updateComplete
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('marks the current step failed with is-error and stops moving on', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount({ current: 1, interval: 500 })
    el.isError = true
    await el.updateComplete
    expect(states(el)).toEqual(['done', 'failed', 'pending'])
    expect(rows(el)[1].querySelectorAll('svg.mark path')).toHaveLength(2)
    vi.advanceTimersByTime(2000)
    await el.updateComplete
    expect(el.current).toBe(1)
  })

  it('moves on by itself every interval and fires stepchange', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount({ interval: 800 })
    const onStep = vi.fn()
    el.addEventListener('stepchange', onStep)

    vi.advanceTimersByTime(799)
    expect(el.current).toBe(0)
    vi.advanceTimersByTime(1)
    await el.updateComplete
    expect(el.current).toBe(1)
    expect(onStep).toHaveBeenLastCalledWith(
      expect.objectContaining({ detail: { current: 1, previous: 0 } }),
    )

    vi.advanceTimersByTime(800)
    await el.updateComplete
    vi.advanceTimersByTime(800)
    await el.updateComplete
    expect(el.current).toBe(3)
    // Without loop it stops at the end.
    vi.advanceTimersByTime(5000)
    await el.updateComplete
    expect(el.current).toBe(3)
    expect(onStep).toHaveBeenCalledTimes(3)
  })

  it('starts over after the last step with loop', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount({ interval: 100, loop: true, current: 3 })
    vi.advanceTimersByTime(100)
    await el.updateComplete
    expect(el.current).toBe(0)
  })

  it('stops its timer when removed and resumes when put back', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const el = await mount({ interval: 100 })
    const parent = el.parentElement as HTMLElement
    el.remove()
    vi.advanceTimersByTime(500)
    expect(el.current).toBe(0)
    parent.append(el)
    vi.advanceTimersByTime(100)
    await el.updateComplete
    expect(el.current).toBe(1)
  })

  describe('keyboard and screen readers', () => {
    it('is an unfocusable ordered list named by label, with the current step marked', async () => {
      const el = await mount({ current: 1, label: 'Publishing site' })
      const list = el.shadowRoot?.querySelector('ol')
      expect(list?.getAttribute('aria-label')).toBe('Publishing site')
      expect(el.tabIndex).toBe(-1)
      expect(rows(el).map((row) => row.getAttribute('aria-current'))).toEqual([
        null,
        'step',
        null,
      ])
      // Indicators are decoration; the state is spoken as text.
      for (const row of rows(el)) {
        expect(
          row.querySelector('[part="indicator"]')?.getAttribute('aria-hidden'),
        ).toBe('true')
      }
      expect(
        rows(el).map((row) => row.querySelector('.sr-only')?.textContent),
      ).toEqual([', done', ', in progress', ', not started'])
    })

    it('announces the current step, a failure and the end in a polite live region', async () => {
      const el = await mount()
      const region = el.shadowRoot?.querySelector('[role="status"]')
      expect(region?.getAttribute('aria-live')).toBe('polite')
      expect(announcement(el)).toBe('Checking files')
      el.current = 1
      await el.updateComplete
      expect(announcement(el)).toBe('Uploading')
      el.isError = true
      await el.updateComplete
      expect(announcement(el)).toBe('Uploading, failed')
      expect(rows(el)[1].querySelector('.sr-only')?.textContent).toBe(
        ', failed',
      )
      el.isError = false
      el.current = 3
      await el.updateComplete
      expect(announcement(el)).toBe('All steps done')
    })

    it('reads translated state words from labels', async () => {
      const el = await mount({
        current: 3,
        labels: { done: 'រួចរាល់', complete: 'បានបញ្ចប់' },
      })
      expect(rows(el)[0].querySelector('.sr-only')?.textContent).toBe(', រួចរាល់')
      expect(announcement(el)).toBe('បានបញ្ចប់')
    })
  })

  describe('keeping the current step in view', () => {
    it('scrolls a constrained host so the current step sits in its middle', async () => {
      const el = await mount()
      Object.defineProperty(el, 'scrollHeight', { value: 300 })
      Object.defineProperty(el, 'clientHeight', { value: 100 })
      el.scrollTo = vi.fn() as typeof el.scrollTo
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ y: 0, height: 100 }),
      )
      vi.spyOn(rows(el)[2], 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ y: 200, height: 20 }),
      )
      el.current = 2
      await el.updateComplete
      expect(el.scrollTo).toHaveBeenLastCalledWith({
        top: 160,
        behavior: 'smooth',
      })
    })
  })

  describe('reduced motion', () => {
    const css = stepLoaderStyles.map((sheet) => String(sheet)).join('\n')
    const reduced = css.slice(
      css.indexOf('@media (prefers-reduced-motion: reduce)'),
    )

    it('shows marks already drawn and does not slide the current row in', () => {
      expect(reduced).toMatch(
        /\.mark path\s*{\s*stroke-dashoffset: 0;\s*animation: none/,
      )
      expect(reduced).toMatch(
        /\.step\[data-state="current"\],\s*\.step\[data-state="failed"\]\s*{\s*animation: none/,
      )
    })

    it('jumps to the current step instead of scrolling smoothly', async () => {
      motion = mockReducedMotion(true)
      const el = await mount()
      Object.defineProperty(el, 'scrollHeight', { value: 300 })
      Object.defineProperty(el, 'clientHeight', { value: 100 })
      el.scrollTo = vi.fn() as typeof el.scrollTo
      el.current = 2
      await el.updateComplete
      expect(el.scrollTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ behavior: 'auto' }),
      )
    })
  })
})
