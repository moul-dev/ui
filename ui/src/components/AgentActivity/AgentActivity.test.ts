import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion, type ReducedMotionMock } from '../../test-setup'
import './AgentActivity'
import {
  type AgentStep,
  formatDuration,
  type MoulAgentActivity,
} from './AgentActivity'

const NOW = Date.now()

const STEPS: AgentStep[] = [
  {
    id: 'think',
    title: 'Planning',
    detail: 'The user wants the newest posts.',
    status: 'done',
    duration: 800,
  },
  {
    id: 'list',
    tool: 'list_records',
    title: 'Read posts',
    input: { collection: 'posts', sort: '-created' },
    output: '{"items":[{"id":"rec_1"}]}',
    status: 'done',
    startedAt: NOW - 3000,
    endedAt: NOW - 1800,
  },
  { id: 'answer', title: 'Write the answer', status: 'pending' },
]

const root = (el: MoulAgentActivity) => el.shadowRoot as ShadowRoot
const header = (el: MoulAgentActivity) =>
  root(el).querySelector<HTMLButtonElement>(
    '[part="header"]',
  ) as HTMLButtonElement
const items = (el: MoulAgentActivity) =>
  Array.from(root(el).querySelectorAll<HTMLElement>('moul-timeline-item'))
const summary = (el: MoulAgentActivity) =>
  root(el).querySelector('[part="summary"]')?.textContent

async function mount(steps = STEPS, attrs = {}): Promise<MoulAgentActivity> {
  const el = await fixture<MoulAgentActivity>(
    html`<moul-agent-activity .steps=${steps}></moul-agent-activity>`,
  )
  Object.assign(el, attrs)
  await el.updateComplete
  return el
}

describe('<moul-agent-activity>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
    vi.useRealTimers()
  })

  it('lays the steps on a compact status timeline', async () => {
    const el = await mount()
    const timeline = root(el).querySelector('moul-timeline')
    expect(timeline?.getAttribute('density')).toBe('compact')
    expect(timeline?.getAttribute('progress')).toBe('status')
    expect(items(el).map((item) => item.getAttribute('status'))).toEqual([
      'complete',
      'complete',
      'upcoming',
    ])
    const tool = items(el)[1]
    expect(tool?.querySelector('.step-title')?.textContent).toBe('Read posts')
    expect(tool?.querySelector('[part="tool"]')?.textContent).toBe(
      'list_records',
    )
    expect(tool?.querySelector('[slot="meta"]')?.textContent).toBe('1.2s')
    expect(items(el)[0]?.querySelector('.detail')?.textContent).toBe(
      'The user wants the newest posts.',
    )
  })

  it('sums up a finished run', async () => {
    const el = await mount(STEPS.slice(0, 2))
    expect(summary(el)).toBe('Finished 2 steps · 1 tool call · 2s')
  })

  it('names the running step and counts its seconds', async () => {
    vi.useFakeTimers()
    const el = await mount([
      {
        id: 1,
        tool: 'get_collection',
        status: 'running',
        startedAt: Date.now(),
      },
    ])
    expect(summary(el)).toBe('Calling get_collection…')
    expect(items(el)[0]?.getAttribute('status')).toBe('current')
    vi.advanceTimersByTime(2000)
    await el.updateComplete
    expect(items(el)[0]?.querySelector('[slot="meta"]')?.textContent).toBe('2s')
  })

  it('marks failed steps in the error tone', async () => {
    const el = await mount([
      { id: 1, tool: 'delete_collection', status: 'error', error: 'Forbidden' },
    ])
    const item = items(el)[0]
    expect(item?.getAttribute('tone')).toBe('error')
    expect(item?.getAttribute('status-label')).toBe('Failed')
    expect(item?.querySelector('.step-error')?.textContent).toBe('Forbidden')
    expect(summary(el)).toBe('Finished 1 step · 1 tool call · 1 failed')
  })

  it('updates a known step in place with push()', async () => {
    const el = await mount([
      { id: 'a', tool: 'list_records', status: 'running' },
    ])
    el.push({ id: 'a', status: 'done', output: [] }, { id: 'b', title: 'Next' })
    await el.updateComplete
    expect(el.steps).toHaveLength(2)
    expect(el.steps[0]).toMatchObject({ tool: 'list_records', status: 'done' })
  })

  it('uses label instead of the summary', async () => {
    const el = await mount(STEPS, { label: 'Agent run' })
    expect(summary(el)).toBe('Agent run')
  })

  describe('keyboard and screen readers', () => {
    it('folds the steps away from the header button', async () => {
      const el = await mount()
      const onOpen = vi.fn()
      el.addEventListener('openchange', onOpen)
      expect(header(el).getAttribute('aria-expanded')).toBe('true')
      expect(header(el).getAttribute('aria-controls')).toBe('steps')
      header(el).click()
      await el.updateComplete
      expect(el.isOpen).toBe(false)
      expect(header(el).getAttribute('aria-expanded')).toBe('false')
      expect(onOpen.mock.calls[0]?.[0].detail).toEqual({ isOpen: false })
    })

    it('opens a tool call input and output as code blocks', async () => {
      const el = await mount()
      const onExpand = vi.fn()
      el.addEventListener('expandedchange', onExpand)
      const toggle = items(el)[1]?.querySelector<HTMLButtonElement>(
        '[part="details-button"]',
      ) as HTMLButtonElement
      expect(toggle.getAttribute('aria-expanded')).toBe('false')
      toggle.click()
      await el.updateComplete
      expect(toggle.getAttribute('aria-expanded')).toBe('true')
      const blocks = Array.from(
        items(el)[1]?.querySelectorAll('moul-code-block') ?? [],
      ) as (HTMLElement & { code: string; filename: string })[]
      expect(blocks.map((block) => block.filename)).toEqual(['Input', 'Output'])
      expect(blocks[1]?.code).toBe(
        '{\n  "items": [\n    {\n      "id": "rec_1"\n    }\n  ]\n}',
      )
      expect(onExpand.mock.calls[0]?.[0].detail).toMatchObject({
        id: 'list',
        isExpanded: true,
      })
    })

    it('announces steps as they start and fail with is-live', async () => {
      const el = await mount([{ id: 1, title: 'Plan', status: 'pending' }], {
        isLive: true,
      })
      const status = () =>
        root(el).querySelector('[role="status"]')?.textContent
      el.steps = [{ id: 1, title: 'Plan', status: 'running' }]
      await el.updateComplete
      expect(status()).toBe('Running Plan')
      el.steps = [{ id: 1, title: 'Plan', status: 'error' }]
      await el.updateComplete
      expect(status()).toBe('Plan failed. Finished')
    })

    it('stays quiet without is-live', async () => {
      const el = await mount([{ id: 1, title: 'Plan', status: 'pending' }])
      el.steps = [{ id: 1, title: 'Plan', status: 'running' }]
      await el.updateComplete
      expect(root(el).querySelector('[role="status"]')?.textContent).toBe('')
    })
  })

  describe('reduced motion', () => {
    it('opens and closes details at once', async () => {
      motion.set(true)
      const el = await mount()
      const toggle = items(el)[1]?.querySelector<HTMLButtonElement>(
        '[part="details-button"]',
      ) as HTMLButtonElement
      toggle.click()
      await el.updateComplete
      toggle.click()
      await el.updateComplete
      expect(items(el)[1]?.querySelector('[part="details"]')).toBeNull()
    })
  })
})

describe('formatDuration', () => {
  it('reads milliseconds as a short duration', () => {
    expect(formatDuration(420)).toBe('420 ms')
    expect(formatDuration(3200)).toBe('3.2s')
    expect(formatDuration(3000)).toBe('3s')
    expect(formatDuration(42_000)).toBe('42s')
    expect(formatDuration(65_000)).toBe('1m 05s')
    expect(formatDuration(-1)).toBe('')
  })
})
