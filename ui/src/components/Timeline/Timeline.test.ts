import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
} from '../../test-setup'
import './Timeline'
import type { MoulTimeline } from './Timeline'
import type { MoulTimelineItem } from './TimelineItem'

async function mount(markup: string): Promise<MoulTimeline> {
  const host = document.createElement('div')
  host.innerHTML = markup
  document.body.append(host)
  const timeline = host.querySelector('moul-timeline') as MoulTimeline
  await timeline.updateComplete
  await settle(timeline)
  return timeline
}

/** Lets the timeline write to its items, then the items render. */
async function settle(timeline: MoulTimeline): Promise<void> {
  await timeline.updateComplete
  await Promise.all(timeline.items.map((item) => item.updateComplete))
  await Promise.resolve()
}

const part = (item: MoulTimelineItem, name: string) =>
  item.shadowRoot?.querySelector<HTMLElement>(`[part~="${name}"]`) ?? null

/** Gives an element a viewport box, which happy-dom does not compute. */
function stubRect(el: Element, top: number, height: number): void {
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + height,
      left: 0,
      right: 20,
      width: 20,
      height,
      x: 0,
      y: top,
    }) as DOMRect
}

/** Whether CSS scroll-driven animations exist. happy-dom builds a new `CSS` on every read, so the whole global is replaced. */
function stubSupports(hasScrollTimelines: boolean): void {
  vi.stubGlobal('CSS', {
    supports: (property: string, value?: string) =>
      hasScrollTimelines &&
      property === 'animation-timeline' &&
      value === 'view()',
  })
}

const THREE = `
  <moul-timeline label="Releases">
    <moul-timeline-item heading="v1.0" meta="March">Launch</moul-timeline-item>
    <moul-timeline-item heading="v1.1">Fixes</moul-timeline-item>
    <moul-timeline-item heading="v2.0">Rewrite</moul-timeline-item>
  </moul-timeline>`

afterEach(() => {
  document.body.innerHTML = ''
})

describe('<moul-timeline>', () => {
  it('is a list of listitems named by label', async () => {
    const timeline = await mount(THREE)
    expect(customElements.get('moul-timeline')).toBeDefined()
    expect(customElements.get('moul-timeline-item')).toBeDefined()
    expect(timeline.getAttribute('role')).toBe('list')
    expect(timeline.getAttribute('aria-label')).toBe('Releases')
    for (const item of timeline.items) {
      expect(item.getAttribute('role')).toBe('listitem')
    }
  })

  it('keeps an aria-label set by the author', async () => {
    const timeline = await mount(
      `<moul-timeline aria-label="Mine" label="Theirs"><moul-timeline-item heading="a"></moul-timeline-item></moul-timeline>`,
    )
    expect(timeline.getAttribute('aria-label')).toBe('Mine')
  })

  it('renders the heading and meta text, or their slots', async () => {
    const timeline = await mount(`
      <moul-timeline>
        <moul-timeline-item heading="Plain" meta="Today">Body</moul-timeline-item>
        <moul-timeline-item heading="Ignored"><strong slot="heading">Rich</strong>Body</moul-timeline-item>
      </moul-timeline>`)
    const [plain, rich] = timeline.items
    expect(part(plain, 'heading')?.textContent).toContain('Plain')
    expect(part(plain, 'heading')?.textContent).toContain('Today')
    const slot = part(rich, 'heading')?.querySelector<HTMLSlotElement>(
      'slot[name="heading"]',
    )
    expect(slot?.assignedElements()[0]?.textContent).toBe('Rich')
  })

  it('marks the first and last items so the rail starts and ends at a marker', async () => {
    const timeline = await mount(THREE)
    const [first, middle, last] = timeline.items
    expect(part(first, 'base')?.classList.contains('first')).toBe(true)
    expect(part(middle, 'base')?.classList.contains('first')).toBe(false)
    expect(part(middle, 'base')?.classList.contains('last')).toBe(false)
    expect(part(last, 'base')?.classList.contains('last')).toBe(true)

    last.remove()
    // The mutation observer reports the removal after the current task.
    await new Promise((resolve) => setTimeout(resolve))
    await settle(timeline)
    await middle.updateComplete
    expect(part(middle, 'base')?.classList.contains('last')).toBe(true)
  })

  it('passes density and progress down, and falls back on unknown values', async () => {
    const timeline = await mount(THREE)
    const [first] = timeline.items
    expect(part(first, 'base')?.classList.contains('comfortable')).toBe(true)
    expect(part(first, 'base')?.classList.contains('scroll')).toBe(true)

    timeline.density = 'compact'
    timeline.progress = 'status'
    await settle(timeline)
    expect(part(first, 'base')?.classList.contains('compact')).toBe(true)
    expect(part(first, 'base')?.classList.contains('status')).toBe(true)

    timeline.setAttribute('density', 'huge')
    timeline.setAttribute('progress', 'sideways')
    await settle(timeline)
    expect(timeline.density).toBe('comfortable')
    expect(timeline.progress).toBe('scroll')
  })

  it('hides the content box of an item that has no content', async () => {
    const timeline = await mount(`
      <moul-timeline>
        <moul-timeline-item heading="Heading only"></moul-timeline-item>
        <moul-timeline-item heading="With body">Body</moul-timeline-item>
      </moul-timeline>`)
    const [bare, full] = timeline.items
    expect(part(bare, 'base')?.classList.contains('empty')).toBe(true)
    expect(part(full, 'base')?.classList.contains('empty')).toBe(false)
  })

  it('normalises an unknown status and tone', async () => {
    const timeline = await mount(`
      <moul-timeline><moul-timeline-item status="done" tone="pink"></moul-timeline-item></moul-timeline>`)
    const [item] = timeline.items
    await item.updateComplete
    expect(item.status).toBe('')
    expect(item.tone).toBe('primary')
  })

  describe('keyboard and screen readers', () => {
    it('takes no focus and hides the rail and marker', async () => {
      const timeline = await mount(THREE)
      const [item] = timeline.items
      expect(timeline.hasAttribute('tabindex')).toBe(false)
      expect(item.hasAttribute('tabindex')).toBe(false)
      expect(
        item.shadowRoot?.querySelector('.rail')?.getAttribute('aria-hidden'),
      ).toBe('true')
      expect(part(item, 'marker')?.getAttribute('aria-hidden')).toBe('true')
    })

    it('sets aria-current="step" on the current item and keeps an author value', async () => {
      const timeline = await mount(`
        <moul-timeline>
          <moul-timeline-item status="complete" heading="Ordered"></moul-timeline-item>
          <moul-timeline-item status="current" heading="Shipped"></moul-timeline-item>
          <moul-timeline-item status="current" aria-current="date" heading="Today"></moul-timeline-item>
        </moul-timeline>`)
      const [done, current, dated] = timeline.items
      expect(done.hasAttribute('aria-current')).toBe(false)
      expect(current.getAttribute('aria-current')).toBe('step')
      expect(dated.getAttribute('aria-current')).toBe('date')

      current.status = 'complete'
      dated.status = ''
      await current.updateComplete
      await dated.updateComplete
      expect(current.hasAttribute('aria-current')).toBe(false)
      expect(dated.getAttribute('aria-current')).toBe('date')
    })

    it('reads the status after the heading, in words the author can replace', async () => {
      const timeline = await mount(`
        <moul-timeline>
          <moul-timeline-item status="complete" heading="Ordered"></moul-timeline-item>
          <moul-timeline-item status="upcoming" heading="Delivered" status-label="បន្ទាប់"></moul-timeline-item>
          <moul-timeline-item status="current" heading="Shipped"></moul-timeline-item>
        </moul-timeline>`)
      const [done, upcoming, current] = timeline.items
      const word = (item: MoulTimelineItem) =>
        part(item, 'heading')?.querySelector('.sr-only')?.textContent ?? null
      expect(word(done)).toContain('Completed')
      expect(word(upcoming)).toContain('បន្ទាប់')
      expect(word(current)).toBeNull()
    })

    it('turns headings into headings of heading-level', async () => {
      const timeline = await mount(THREE)
      const title = () =>
        timeline.items[0].shadowRoot?.querySelector('.title') ?? null
      expect(title()?.hasAttribute('role')).toBe(false)

      timeline.headingLevel = 3
      await settle(timeline)
      expect(title()?.getAttribute('role')).toBe('heading')
      expect(title()?.getAttribute('aria-level')).toBe('3')

      timeline.headingLevel = 9
      await settle(timeline)
      expect(title()?.hasAttribute('role')).toBe(false)
    })
  })

  describe('scroll progress without scroll timelines', () => {
    let frames: ManualFrames

    beforeEach(() => {
      frames = manualAnimationFrames()
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
      // happy-dom claims to support everything; act like a browser without scroll timelines.
      stubSupports(false)
    })

    afterEach(() => {
      frames.restore()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    /** Stacks the items 300px apart, so the viewport middle (400) falls a third of the way into the second. */
    function layOut(timeline: MoulTimeline): void {
      timeline.items.forEach((item, i) => {
        const top = i * 300
        stubRect(part(item, 'rail') as HTMLElement, top, 300)
        stubRect(part(item, 'marker') as HTMLElement, top, 28)
      })
    }

    const progress = (item: MoulTimelineItem) =>
      part(item, 'base')?.style.getPropertyValue('--_progress')
    const reached = (item: MoulTimelineItem) =>
      part(item, 'marker')?.hasAttribute('data-reached')

    it('fills each segment up to the middle of the viewport as the page scrolls', async () => {
      const timeline = await mount(THREE)
      layOut(timeline)
      document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      const [first, second, third] = timeline.items
      expect(progress(first)).toBe('1')
      expect(progress(second)).toBe('0.333')
      expect(progress(third)).toBe('0')
      expect(reached(first)).toBe(true)
      expect(reached(second)).toBe(true)
      expect(reached(third)).toBe(false)
    })

    it('measures once per frame however many scroll events arrive', async () => {
      const timeline = await mount(THREE)
      layOut(timeline)
      const spy = vi.spyOn(timeline.items[0], 'syncScrollProgress')
      for (let i = 0; i < 5; i++) document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('stops tracking and clears the fill when progress is no longer scroll', async () => {
      const timeline = await mount(THREE)
      layOut(timeline)
      document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      timeline.progress = 'status'
      await settle(timeline)
      const [first] = timeline.items
      expect(progress(first)).toBe('')
      expect(reached(first)).toBe(false)
      const spy = vi.spyOn(first, 'syncScrollProgress')
      document.dispatchEvent(new Event('scroll'))
      frames.step(32)
      expect(spy).not.toHaveBeenCalled()
    })

    it('leaves the fill to CSS where scroll timelines exist', async () => {
      stubSupports(true)
      const timeline = await mount(THREE)
      layOut(timeline)
      const spy = vi.spyOn(timeline.items[1], 'syncScrollProgress')
      document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      expect(spy).not.toHaveBeenCalled()
    })

    it('stops listening when it leaves the page', async () => {
      const timeline = await mount(THREE)
      const item = timeline.items[0]
      const spy = vi.spyOn(item, 'syncScrollProgress')
      timeline.remove()
      document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('reduced motion', () => {
    let motion: ReducedMotionMock
    let frames: ManualFrames

    beforeEach(() => {
      motion = mockReducedMotion(true)
      frames = manualAnimationFrames()
      vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
      stubSupports(false)
    })

    afterEach(() => {
      motion.restore()
      frames.restore()
      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })

    it('still follows the scroll, since the reader moves it', async () => {
      const timeline = await mount(THREE)
      const [first] = timeline.items
      stubRect(part(first, 'rail') as HTMLElement, 0, 200)
      stubRect(part(first, 'marker') as HTMLElement, 0, 28)
      document.dispatchEvent(new Event('scroll'))
      frames.step(16)
      expect(part(first, 'base')?.style.getPropertyValue('--_progress')).toBe(
        '1',
      )
    })

    it('stops the pulse and the status easing in its reduced-motion styles', () => {
      const ctor = customElements.get('moul-timeline-item') as unknown as {
        styles: { cssText?: string }[]
      }
      const text = ctor.styles.map((sheet) => sheet.cssText ?? '').join('\n')
      const block = text.slice(text.indexOf('prefers-reduced-motion: reduce'))
      expect(block).toContain('.status .fill')
      expect(block).toContain('transition: none')
      expect(block).toContain('animation: none')
    })
  })
})
