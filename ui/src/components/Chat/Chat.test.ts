import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import type { MoulAgentActivity } from '../AgentActivity/AgentActivity'
import type { MoulPromptInput } from '../PromptInput/PromptInput'
import type { MoulStreamingResponse } from '../StreamingResponse/StreamingResponse'
import './Chat'
import type { ChatConversation, ChatMessage, MoulChat } from './Chat'

const MESSAGES: ChatMessage[] = [
  { id: 'u1', role: 'user', content: 'Which collections are there?' },
  {
    id: 'a1',
    role: 'assistant',
    content: 'There are **two**: `posts` and `users`.',
    steps: [{ id: 's1', tool: 'list_collections', status: 'done', output: [] }],
  },
]

const CONVERSATIONS: ChatConversation[] = [
  { id: 'c1', title: 'Collections', group: 'Today' },
  { id: 'c2', title: 'Slow queries', group: 'Today' },
  { id: 'c3', title: 'Webhooks', group: 'Last week' },
]

const root = (el: MoulChat) => el.shadowRoot as ShadowRoot
const composer = (el: MoulChat) =>
  root(el).querySelector('moul-prompt-input') as MoulPromptInput
const articles = (el: MoulChat) =>
  Array.from(root(el).querySelectorAll<HTMLElement>('[part="message"]'))
const answer = (el: MoulChat, id: string) =>
  root(el).querySelector(
    `[data-id="${id}"] moul-streaming-response`,
  ) as MoulStreamingResponse | null

async function mount(props: Partial<MoulChat> = {}): Promise<MoulChat> {
  const el = await fixture<MoulChat>(html`<moul-chat></moul-chat>`)
  Object.assign(el, props)
  await el.updateComplete
  return el
}

describe('<moul-chat>', () => {
  let motion: ReducedMotionMock

  beforeEach(() => {
    motion = mockReducedMotion(false)
  })

  afterEach(() => {
    motion.restore()
  })

  it('draws user bubbles and assistant answers with their activity', async () => {
    const el = await mount({ messages: MESSAGES })
    const [user, assistant] = articles(el)
    expect(user?.classList.contains('user')).toBe(true)
    expect(user?.querySelector('[part="bubble"]')?.textContent).toBe(
      'Which collections are there?',
    )
    const activity = assistant?.querySelector(
      'moul-agent-activity',
    ) as MoulAgentActivity
    expect(activity.steps).toHaveLength(1)
    expect(answer(el, 'a1')?.content).toBe(MESSAGES[1]?.content)
    expect(answer(el, 'a1')?.isStreaming).toBe(false)
  })

  it('greets and offers suggestions while empty, and sends one when chosen', async () => {
    const el = await mount({
      greeting: 'Ask about your data',
      suggestions: [
        'List collections',
        { label: 'Errors', prompt: 'Show errors from today' },
      ],
    })
    expect(root(el).querySelector('.greeting-text')?.textContent).toBe(
      'Ask about your data',
    )
    const onSubmit = vi.fn()
    el.addEventListener('promptsubmit', onSubmit)
    const buttons = root(el).querySelectorAll<HTMLButtonElement>(
      '[part="suggestion"]',
    )
    expect(buttons).toHaveLength(2)
    buttons[1]?.click()
    expect(onSubmit.mock.calls[0]?.[0].detail.value).toBe(
      'Show errors from today',
    )
  })

  it('streams an answer through push, appendText, pushSteps and updateMessage', async () => {
    const el = await mount()
    el.push(
      { id: 'u1', role: 'user', content: 'Count posts' },
      { id: 'a1', role: 'assistant', status: 'pending' },
    )
    await el.updateComplete
    expect(root(el).querySelector('moul-thinking-indicator')).not.toBeNull()
    expect(composer(el).isGenerating).toBe(true)

    el.pushSteps('a1', { id: 't1', tool: 'list_records', status: 'running' })
    await el.updateComplete
    expect(root(el).querySelector('moul-thinking-indicator')).toBeNull()

    el.pushSteps('a1', { id: 't1', status: 'done' })
    el.appendText('a1', 'There are ')
    el.appendText('a1', '42 posts.')
    await el.updateComplete
    const message = el.messages.find((m) => m.id === 'a1')
    expect(message).toMatchObject({
      status: 'streaming',
      content: 'There are 42 posts.',
    })
    expect(message?.steps?.[0]).toMatchObject({
      tool: 'list_records',
      status: 'done',
    })
    expect(answer(el, 'a1')?.isStreaming).toBe(true)

    el.updateMessage('a1', { status: 'done' })
    await el.updateComplete
    expect(composer(el).isGenerating).toBe(false)
  })

  it('folds the activity away once the answer starts, unless the reader chose', async () => {
    const el = await mount({
      messages: [
        {
          id: 'a1',
          role: 'assistant',
          status: 'streaming',
          steps: [{ id: 1, tool: 'x', status: 'done' }],
        },
      ],
    })
    const activity = () =>
      root(el).querySelector('moul-agent-activity') as MoulAgentActivity
    expect(activity().isOpen).toBe(true)
    el.appendText('a1', 'Answer')
    await el.updateComplete
    expect(activity().isOpen).toBe(false)
    activity()
      .shadowRoot?.querySelector<HTMLButtonElement>('[part="header"]')
      ?.click()
    await el.updateComplete
    el.appendText('a1', ' more')
    await el.updateComplete
    expect(activity().isOpen).toBe(true)
  })

  it('shows a finished answer with its activity folded', async () => {
    const el = await mount({ messages: MESSAGES })
    const activity = root(el).querySelector(
      'moul-agent-activity',
    ) as MoulAgentActivity
    expect(activity.isOpen).toBe(false)
  })

  it('relays regenerate and feedback with the message they belong to', async () => {
    const el = await mount({ messages: MESSAGES })
    const onRegenerate = vi.fn()
    const onFeedback = vi.fn()
    el.addEventListener('regenerate', onRegenerate)
    el.addEventListener('feedbackchange', onFeedback)
    const response = answer(el, 'a1') as MoulStreamingResponse
    await response.updateComplete
    response.shadowRoot
      ?.querySelector<HTMLButtonElement>(
        'button[aria-label="Regenerate response"]',
      )
      ?.click()
    expect(onRegenerate).toHaveBeenCalledOnce()
    expect(onRegenerate.mock.calls[0]?.[0].detail.messageId).toBe('a1')
    response.shadowRoot
      ?.querySelector<HTMLButtonElement>('button[aria-label="Good response"]')
      ?.click()
    expect(onFeedback.mock.calls[0]?.[0].detail).toMatchObject({
      messageId: 'a1',
      value: 'up',
    })
    expect(el.messages[1]?.feedback).toBe('up')
  })

  it('offers regenerate on the last answer only', async () => {
    const el = await mount({
      messages: [{ id: 'a0', role: 'assistant', content: 'Old' }, ...MESSAGES],
    })
    expect(answer(el, 'a0')?.actions).toBe('copy feedback')
    expect(answer(el, 'a1')?.actions).toBe('copy regenerate feedback')
  })

  it('shows a failed answer as an error', async () => {
    const el = await mount({
      messages: [
        { id: 'a1', role: 'assistant', status: 'error', error: 'Timed out' },
      ],
    })
    expect(answer(el, 'a1')?.error).toBe('Timed out')
  })

  it('feeds the conversation to the composer history', async () => {
    const el = await mount({ messages: MESSAGES })
    expect(composer(el).history).toEqual(['Which collections are there?'])
  })

  describe('history sidebar', () => {
    it('groups conversations and marks the current one', async () => {
      const el = await mount({
        conversations: CONVERSATIONS,
        conversationId: 'c2',
      })
      const labels = [...root(el).querySelectorAll('.group-label')].map(
        (h) => h.textContent,
      )
      expect(labels).toEqual(['Today', 'Last week'])
      const current = root(el).querySelector('[aria-current="true"]')
      expect(current?.textContent?.trim()).toBe('Slow queries')
      expect(root(el).querySelector('[part="title"]')?.textContent).toBe(
        'Slow queries',
      )
    })

    it('fires conversationselect and conversationcreate', async () => {
      const el = await mount({ conversations: CONVERSATIONS })
      const onSelect = vi.fn()
      const onCreate = vi.fn()
      el.addEventListener('conversationselect', onSelect)
      el.addEventListener('conversationcreate', onCreate)
      root(el)
        .querySelectorAll<HTMLButtonElement>('[part="conversation"]')[2]
        ?.click()
      expect(onSelect.mock.calls[0]?.[0].detail).toEqual({
        id: 'c3',
        conversation: CONVERSATIONS[2],
      })
      root(el).querySelector<HTMLButtonElement>('[part="new-chat"]')?.click()
      expect(onCreate).toHaveBeenCalledOnce()
    })

    it('leaves the sidebar out with hide-sidebar', async () => {
      const el = await mount({ hideSidebar: true })
      expect(root(el).querySelector('[part="sidebar"]')).toBeNull()
      expect(root(el).querySelector('.sidebar-toggle')).toBeNull()
    })

    it('starts closed and slides over a narrow chat', async () => {
      const el = await mount({ conversations: CONVERSATIONS })
      triggerResize(el, { width: 500, height: 600 })
      await el.updateComplete
      expect(el.isSidebarOpen).toBe(false)
      expect(
        root(el).querySelector('[part="base"]')?.hasAttribute('data-narrow'),
      ).toBe(true)
    })
  })

  describe('keyboard and screen readers', () => {
    it('heads every message with who said it', async () => {
      const el = await mount({ messages: MESSAGES })
      expect(
        articles(el).map((a) => a.querySelector('h3')?.textContent),
      ).toEqual(['You said:', 'Assistant said:'])
      expect(
        root(el).querySelector('[part="main"]')?.getAttribute('aria-label'),
      ).toBe('Chat')
    })

    it('reads a finished answer aloud, and an error', async () => {
      const el = await mount({
        messages: [
          { id: 'a1', role: 'assistant', status: 'streaming', content: '' },
        ],
      })
      const status = () =>
        root(el).querySelector('.base > [role="status"]')?.textContent
      el.updateMessage('a1', { content: 'Done: **42** posts.', status: 'done' })
      await el.updateComplete
      expect(status()).toBe('Done: 42 posts.')
      el.push({ id: 'a2', role: 'assistant', status: 'pending' })
      await el.updateComplete
      el.updateMessage('a2', { status: 'error', error: 'Rate limited' })
      await el.updateComplete
      expect(status()).toBe('Rate limited')
    })

    it('toggles the sidebar with aria-expanded and closes it on Escape when narrow', async () => {
      const el = await mount({ conversations: CONVERSATIONS })
      const toggle = root(el).querySelector<HTMLButtonElement>(
        '.sidebar-toggle',
      ) as HTMLButtonElement
      const onSidebar = vi.fn()
      el.addEventListener('sidebarchange', onSidebar)
      expect(toggle.getAttribute('aria-expanded')).toBe('true')
      expect(toggle.getAttribute('aria-controls')).toBe('history')
      toggle.click()
      await el.updateComplete
      expect(toggle.getAttribute('aria-expanded')).toBe('false')
      expect(onSidebar.mock.calls[0]?.[0].detail).toEqual({ isOpen: false })

      triggerResize(el, { width: 500, height: 600 })
      toggle.click()
      await el.updateComplete
      const sidebar = root(el).querySelector('[part="sidebar"]') as HTMLElement
      sidebar.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      )
      await el.updateComplete
      expect(el.isSidebarOpen).toBe(false)
    })
  })

  describe('reduced motion', () => {
    it('jumps to the latest message without gliding', async () => {
      motion.set(true)
      const el = await mount({ messages: MESSAGES })
      const scroller = root(el).querySelector(
        '[part="messages"]',
      ) as HTMLElement
      const scrollTo = vi.fn()
      scroller.scrollTo = scrollTo as unknown as typeof scroller.scrollTo
      el.scrollToBottom({ smooth: true })
      expect(scrollTo).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'auto' }),
      )
    })
  })
})
