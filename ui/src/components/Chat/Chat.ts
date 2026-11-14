import { html, LitElement, nothing, type PropertyValues } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import { CopyController } from '../../controllers/copy.controller'
import { defineElement } from '../../utils/define-element'
import { formatFileSize, isImageFile, safeHref } from '../../utils/files'
import {
  arrowDown,
  check,
  copy,
  pencilSquare,
  sidebarPanel,
  sparkle,
} from '../../utils/icons'
import { markdownToText } from '../../utils/markdown'
import { prefersReducedMotion } from '../../utils/motion'
import '../AgentActivity/AgentActivity'
import type {
  AgentActivityOpenChangeDetail,
  AgentStep,
} from '../AgentActivity/AgentActivity'
import { fileIcon } from '../FileUpload/icons'
import '../PromptInput/PromptInput'
import type { FileUploadFunction } from '../FileUpload/FileUpload'
import type {
  MoulPromptInput,
  PromptModel,
  PromptModelChangeDetail,
  PromptSubmitKey,
} from '../PromptInput/PromptInput'
import '../StreamingResponse/StreamingResponse'
import type {
  ResponseFeedback,
  ResponseFeedbackChangeDetail,
  ResponseSource,
} from '../StreamingResponse/StreamingResponse'
import '../ThinkingIndicator/ThinkingIndicator'
import { chatStyles } from './Chat.styles'

export type ChatRole = 'user' | 'assistant'
export type ChatMessageStatus = 'pending' | 'streaming' | 'done' | 'error'

/** A file shown on a message. */
export interface ChatAttachment {
  name: string
  size?: number
  type?: string
  /** Where the file lives; images show a thumbnail and every file links to it. */
  url?: string
}

/** One turn of the conversation. */
export interface ChatMessage {
  /** Identifies the message; pushing a message with a known id updates it in place. */
  id: string | number
  role: ChatRole
  /** Markdown for the assistant; plain text for the user. */
  content?: string
  /**
   * An assistant message's progress: `pending` before anything arrives,
   * `streaming` while it does, then `done` (the default) or `error`.
   */
  status?: ChatMessageStatus
  /** Why an assistant message failed. */
  error?: string
  /** The assistant's reasoning and tool calls, shown above its answer. */
  steps?: AgentStep[]
  /** The sources the answer's `[n]` citations point at. */
  sources?: ResponseSource[]
  /** Files sent with a user message. */
  attachments?: ChatAttachment[]
  /** The reader's verdict on an assistant message. */
  feedback?: ResponseFeedback
}

/** A past conversation in the history sidebar. */
export interface ChatConversation {
  id: string
  title: string
  /** A heading to group under: "Today", "Last week". Consecutive conversations share it. */
  group?: string
}

/** A starter prompt shown while the chat is empty. */
export type ChatSuggestion =
  | string
  | {
      label: string
      /** What is sent; defaults to the label. */
      prompt?: string
      description?: string
    }

export interface ChatMessageEventDetail {
  messageId: string | number
  message: ChatMessage
}

export interface ChatFeedbackChangeDetail extends ChatMessageEventDetail {
  value: ResponseFeedback
}

export interface ChatConversationSelectDetail {
  id: string
  conversation: ChatConversation
}

export interface ChatSidebarChangeDetail {
  isOpen: boolean
}

/** Closer than this to the bottom counts as reading the latest message. */
const PIN_DISTANCE = 64
/** Narrower than this, the history slides over the conversation instead of sitting beside it. */
const NARROW_WIDTH = 720
/** The most of a reply read out when it finishes. */
const ANNOUNCE_CHARS = 600

const keyOf = (message: ChatMessage) => String(message.id)
const statusOf = (message: ChatMessage): ChatMessageStatus =>
  message.status ?? 'done'
const isBusy = (message: ChatMessage) =>
  message.role === 'assistant' &&
  (statusOf(message) === 'pending' || statusOf(message) === 'streaming')

/**
 * A complete chat with an AI assistant: a history of conversations in a
 * sidebar, the conversation itself, and a `<moul-prompt-input>` composer. A
 * user's turn is a bubble with its files; an assistant's turn shows its tool
 * calls and reasoning as a `<moul-agent-activity>`, a
 * `<moul-thinking-indicator>` until the first words arrive, and the answer as
 * a `<moul-streaming-response>` with its sources and actions. While empty it
 * greets the reader and offers `suggestions`.
 *
 * The chat draws what it is given. Listen for `promptsubmit`, `stop`,
 * `regenerate` and `conversationselect`, call your model, and feed the reply
 * back with `push()`, `appendText()`, `pushSteps()` and `updateMessage()` (or by setting
 * `messages`). The composer shows Stop while any assistant message is
 * `pending` or `streaming`. The view follows new text down while the reader
 * is at the bottom, and offers a "Jump to latest" button when they have
 * scrolled up. Narrower than 720px, the history slides over the conversation.
 *
 * Keyboard and screen readers: the conversation is a region named by `label`
 * ("Chat"); each message is an article that starts with a hidden heading,
 * "You said" or "Assistant said", so readers can jump between turns. When an
 * answer finishes, a polite live region reads its text (up to 600
 * characters), or its error. The sidebar is a navigation landmark named
 * "Conversations" whose conversations are buttons, the current one
 * `aria-current="true"`; its toggle in the header has `aria-expanded`, and
 * while it lies over a narrow chat `Escape` closes it and returns focus to
 * the toggle. The message list scrolls with the keyboard once focused, and
 * the composer, suggestions and message actions are native buttons and
 * fields with names.
 *
 * Reduced motion: "Jump to latest" and new messages scroll into place at
 * once instead of gliding, the sidebar opens and closes without sliding, and
 * every part inside follows its own reduced-motion path.
 *
 * @slot empty - Replaces the greeting shown while there are no messages.
 * @slot header-actions - Controls at the end of the header.
 * @slot sidebar-footer - Content at the bottom of the sidebar, such as the user's name.
 * @slot footer - A note under the composer: "Answers can be wrong. Check important facts."
 * @slot composer-start - Controls in the composer, after the attach button.
 * @fires promptsubmit - From the composer: `detail` is `{ value, attachments, model }`; cancelable.
 * @fires stop - From the composer, while an answer is generating.
 * @fires modelchange - From the composer: `detail` is `{ value, model }`.
 * @fires regenerate - An answer's regenerate or retry button was used; `detail` is `{ messageId, message }`.
 * @fires feedbackchange - An answer's feedback changed; `detail` is `{ messageId, message, value }`.
 * @fires conversationselect - A conversation in the sidebar was chosen; `detail` is `{ id, conversation }`.
 * @fires conversationcreate - The New chat button was used.
 * @fires sidebarchange - The sidebar toggle opened or closed the history; `detail` is `{ isOpen }`.
 * @csspart base - The frame around everything.
 * @csspart sidebar - The history sidebar.
 * @csspart new-chat - The New chat button.
 * @csspart conversation - Each conversation in the sidebar.
 * @csspart main - The conversation and the composer.
 * @csspart header - The bar above the conversation.
 * @csspart title - The conversation's title in the header.
 * @csspart messages - The scrolling list of messages.
 * @csspart message - Each message.
 * @csspart bubble - A user message's bubble.
 * @csspart suggestion - Each starter prompt.
 * @csspart jump-button - The "Jump to latest" button.
 * @csspart composer - The `<moul-prompt-input>`.
 * @cssprop --chat-max-width - The width of the conversation column. Defaults to `48rem`.
 * @cssprop --chat-sidebar-width - The history sidebar's width. Defaults to `16rem`.
 */
export class MoulChat extends LitElement {
  static override styles = chatStyles

  static override properties = {
    messages: { attribute: false },
    conversations: { attribute: false },
    conversationId: { type: String, attribute: 'conversation-id' },
    suggestions: { attribute: false },
    heading: { type: String },
    greeting: { type: String },
    label: { type: String },
    isGenerating: { type: Boolean, reflect: true, attribute: 'is-generating' },
    hideSidebar: { type: Boolean, reflect: true, attribute: 'hide-sidebar' },
    isSidebarOpen: {
      type: Boolean,
      reflect: true,
      attribute: 'is-sidebar-open',
    },
    placeholder: { type: String },
    placeholders: { attribute: false },
    models: { attribute: false },
    model: { type: String, reflect: true },
    allowAttachments: {
      type: Boolean,
      reflect: true,
      attribute: 'allow-attachments',
    },
    accept: { type: String },
    maxFiles: { type: Number, attribute: 'max-files' },
    maxSize: { type: Number, attribute: 'max-size' },
    upload: { attribute: false },
    submitKey: { type: String, attribute: 'submit-key' },
    isNarrow: { state: true },
    isPinned: { state: true },
    announcement: { state: true },
  }

  /** The conversation, oldest first. */
  declare messages: ChatMessage[]
  /** Past conversations for the sidebar, newest first. */
  declare conversations: ChatConversation[]
  /** The id of the conversation shown, marked current in the sidebar. */
  declare conversationId: string
  /** Starter prompts offered while the chat is empty. */
  declare suggestions: ChatSuggestion[]
  /** The header's title; defaults to the current conversation's title, then "New chat". */
  declare heading: string
  /** The greeting shown while the chat is empty. */
  declare greeting: string
  /** The conversation region's accessible name. */
  declare label: string
  /** Show Stop in the composer even when no message is streaming. */
  declare isGenerating: boolean
  /** Leave out the history sidebar and its toggle. */
  declare hideSidebar: boolean
  /** Show the history sidebar. */
  declare isSidebarOpen: boolean
  /** Passed to the composer. */
  declare placeholder: string
  /** Hints the composer's placeholder rotates through. */
  declare placeholders: string[]
  /** Models the composer offers. */
  declare models: PromptModel[]
  /** The chosen model's `value`. */
  declare model: string
  /** Let the composer take files. */
  declare allowAttachments: boolean
  declare accept: string
  declare maxFiles: number
  declare maxSize: number
  /** Sends each attached file as soon as it is attached; see `<moul-prompt-input>`. */
  declare upload: FileUploadFunction | null
  declare submitKey: PromptSubmitKey
  /** @internal */
  declare isNarrow: boolean
  /** @internal */
  declare isPinned: boolean
  /** @internal */
  declare announcement: string

  private readonly copier = new CopyController(this)
  /** Activity panels the reader opened or closed by hand. */
  private readonly activityChoices = new Map<string, boolean>()
  private lastStatuses = new Map<string, ChatMessageStatus>()
  private resizeObserver: ResizeObserver | null = null
  private contentObserver: ResizeObserver | null = null

  constructor() {
    super()
    this.messages = []
    this.conversations = []
    this.conversationId = ''
    this.suggestions = []
    this.heading = ''
    this.greeting = 'How can I help?'
    this.label = 'Chat'
    this.isGenerating = false
    this.hideSidebar = false
    this.isSidebarOpen = true
    this.placeholder = 'Ask anything'
    this.placeholders = []
    this.models = []
    this.model = ''
    this.allowAttachments = false
    this.accept = ''
    this.maxFiles = 10
    this.maxSize = 0
    this.upload = null
    this.submitKey = 'enter'
    this.isNarrow = false
    this.isPinned = true
    this.announcement = ''
  }

  /** The composer. */
  public get composer(): MoulPromptInput | null {
    return this.renderRoot?.querySelector('moul-prompt-input') ?? null
  }

  /** True while the composer shows Stop. */
  public get isBusy(): boolean {
    return this.isGenerating || this.list().some(isBusy)
  }

  /** Adds messages to the end; a message whose id is known is updated where it is. */
  public push(...messages: ChatMessage[]): void {
    const incoming = new Map(messages.map((m) => [keyOf(m), m]))
    const kept = this.list().map((message) => {
      const update = incoming.get(keyOf(message))
      if (!update) return message
      incoming.delete(keyOf(message))
      return { ...message, ...update }
    })
    this.messages = [...kept, ...incoming.values()]
  }

  /** Merges `patch` into a message. */
  public updateMessage(id: string | number, patch: Partial<ChatMessage>): void {
    this.push({ ...patch, id } as ChatMessage)
  }

  /** Adds a chunk of text to a message's content, and marks a pending one as streaming. */
  public appendText(id: string | number, chunk: string): void {
    const message = this.find(id)
    if (!message || !chunk) return
    this.updateMessage(id, {
      content: (message.content ?? '') + chunk,
      status: statusOf(message) === 'pending' ? 'streaming' : message.status,
    })
  }

  /** Adds steps to a message's activity; a step whose id is known is updated where it is. */
  public pushSteps(id: string | number, ...steps: AgentStep[]): void {
    const message = this.find(id)
    if (!message) return
    const incoming = new Map(steps.map((step) => [String(step.id), step]))
    const kept = (message.steps ?? []).map((step) => {
      const update = incoming.get(String(step.id))
      if (!update) return step
      incoming.delete(String(step.id))
      return { ...step, ...update }
    })
    this.updateMessage(id, { steps: [...kept, ...incoming.values()] })
  }

  /** Scrolls to the latest message and follows new text again. */
  public scrollToBottom(options: { smooth?: boolean } = {}): void {
    const scroller = this.scroller
    this.isPinned = true
    if (!scroller) return
    scroller.scrollTo({
      top: scroller.scrollHeight,
      behavior: options.smooth && !prefersReducedMotion() ? 'smooth' : 'auto',
    })
  }

  /** Puts the caret in the composer. */
  public focusComposer(): void {
    this.composer?.focus()
  }

  public override connectedCallback(): void {
    super.connectedCallback()
    if (this.hasUpdated) this.observe()
  }

  public override disconnectedCallback(): void {
    super.disconnectedCallback()
    this.resizeObserver?.disconnect()
    this.resizeObserver = null
    this.contentObserver?.disconnect()
    this.contentObserver = null
  }

  private list(): ChatMessage[] {
    return (Array.isArray(this.messages) ? this.messages : []).filter(
      (message) => message.role === 'user' || message.role === 'assistant',
    )
  }

  private find(id: string | number): ChatMessage | undefined {
    return this.list().find((message) => keyOf(message) === String(id))
  }

  private get scroller(): HTMLElement | null {
    return (
      this.renderRoot?.querySelector<HTMLElement>('[part~="messages"]') ?? null
    )
  }

  private emit<T>(type: string, detail: T): void {
    this.dispatchEvent(
      new CustomEvent<T>(type, { bubbles: true, composed: true, detail }),
    )
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    // Measured before the first render, so a narrow chat never draws its sidebar beside it.
    if (!this.hasUpdated) this.applyWidth(this.getBoundingClientRect().width)
    if (!changed.has('messages')) return
    const messages = this.list()
    const keys = new Set(messages.map(keyOf))
    for (const key of this.activityChoices.keys()) {
      if (!keys.has(key)) this.activityChoices.delete(key)
    }
    for (const message of messages) {
      if (message.role !== 'assistant') continue
      const before = this.lastStatuses.get(keyOf(message))
      const status = statusOf(message)
      if (before === undefined || before === status) continue
      if (
        status === 'done' &&
        (before === 'streaming' || before === 'pending')
      ) {
        const text = markdownToText(message.content ?? '')
        this.announcement =
          text.length > ANNOUNCE_CHARS
            ? `${text.slice(0, ANNOUNCE_CHARS)}…`
            : text
      } else if (status === 'error') {
        this.announcement = message.error || 'The answer failed.'
      }
    }
    this.lastStatuses = new Map(
      messages
        .filter((message) => message.role === 'assistant')
        .map((message) => [keyOf(message), statusOf(message)]),
    )
  }

  protected override firstUpdated(): void {
    this.observe()
    this.stickToBottom()
  }

  protected override updated(): void {
    this.stickToBottom()
  }

  private observe(): void {
    if (typeof ResizeObserver !== 'function') return
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(([entry]) => {
        this.applyWidth(entry?.contentRect.width ?? 0)
      })
      this.resizeObserver.observe(this)
    }
    const column = this.renderRoot.querySelector('.thread')
    if (!this.contentObserver && column) {
      // Text revealed inside the answers grows the list without a render here.
      this.contentObserver = new ResizeObserver(() => this.stickToBottom())
      this.contentObserver.observe(column)
    }
  }

  private applyWidth(width: number): void {
    if (width <= 0) return
    const isNarrow = width < NARROW_WIDTH
    if (isNarrow === this.isNarrow) return
    this.isNarrow = isNarrow
    // The history starts closed over a narrow chat.
    if (isNarrow) this.isSidebarOpen = false
  }

  private stickToBottom(): void {
    const scroller = this.scroller
    if (!this.isPinned || !scroller) return
    scroller.scrollTop = scroller.scrollHeight
  }

  private readonly handleScroll = (): void => {
    const scroller = this.scroller
    if (!scroller) return
    const distance =
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight
    const isPinned = distance < PIN_DISTANCE
    if (isPinned !== this.isPinned) this.isPinned = isPinned
  }

  private readonly handleSubmit = (): void => {
    // The reader's own prompt always brings the view down to it.
    this.isPinned = true
    this.updateComplete.then(() => this.scrollToBottom())
  }

  private readonly handleModelChange = (
    event: CustomEvent<PromptModelChangeDetail>,
  ): void => {
    this.model = event.detail.value
  }

  private setSidebar(isOpen: boolean): void {
    if (isOpen === this.isSidebarOpen) return
    this.isSidebarOpen = isOpen
    this.emit<ChatSidebarChangeDetail>('sidebarchange', { isOpen })
    if (!this.isNarrow) return
    this.updateComplete.then(() => {
      const target = isOpen
        ? this.renderRoot.querySelector<HTMLElement>('[part~="new-chat"]')
        : this.renderRoot.querySelector<HTMLElement>('.sidebar-toggle')
      target?.focus()
    })
  }

  private selectConversation(conversation: ChatConversation): void {
    this.emit<ChatConversationSelectDetail>('conversationselect', {
      id: conversation.id,
      conversation,
    })
    if (this.isNarrow) this.setSidebar(false)
  }

  private createConversation(): void {
    this.emit('conversationcreate', {})
    if (this.isNarrow) this.setSidebar(false)
    this.updateComplete.then(() => this.focusComposer())
  }

  private sendSuggestion(suggestion: ChatSuggestion): void {
    const composer = this.composer
    if (!composer) return
    const prompt =
      typeof suggestion === 'string'
        ? suggestion
        : suggestion.prompt || suggestion.label
    composer.value = prompt
    composer.submit()
  }

  private relayAnswerEvent(event: Event, message: ChatMessage): void {
    event.stopPropagation()
    const messageId = message.id
    const latest = this.find(messageId) ?? message
    if (event.type === 'regenerate') {
      this.emit<ChatMessageEventDetail>('regenerate', {
        messageId,
        message: latest,
      })
    } else if (event.type === 'feedbackchange') {
      const value = (event as CustomEvent<ResponseFeedbackChangeDetail>).detail
        .value
      this.updateMessage(messageId, { feedback: value })
      this.emit<ChatFeedbackChangeDetail>('feedbackchange', {
        messageId,
        message: { ...latest, feedback: value },
        value,
      })
    }
  }

  private renderSidebar() {
    if (this.hideSidebar) return nothing
    const conversations = Array.isArray(this.conversations)
      ? this.conversations
      : []
    const groups: { label: string; items: ChatConversation[] }[] = []
    for (const conversation of conversations) {
      const label = conversation.group ?? ''
      const last = groups[groups.length - 1]
      if (last && last.label === label) last.items.push(conversation)
      else groups.push({ label, items: [conversation] })
    }
    return html`
      <nav
        part="sidebar"
        class="sidebar"
        id="history"
        aria-label="Conversations"
        ?hidden=${!this.isSidebarOpen}
        @keydown=${(event: KeyboardEvent) => {
          if (event.key === 'Escape' && this.isNarrow) {
            event.stopPropagation()
            this.setSidebar(false)
          }
        }}
      >
        <div class="sidebar-top">
          <button
            part="new-chat"
            class="new-chat"
            type="button"
            @click=${this.createConversation}
          >
            ${pencilSquare()} New chat
          </button>
        </div>
        <div class="conversations">
          ${
            conversations.length
              ? groups.map(
                  (group, g) => html`
                    ${
                      group.label
                        ? html`<h3 class="group-label" id="group-${g}">${group.label}</h3>`
                        : nothing
                    }
                    <ul
                      class="conversation-list"
                      aria-labelledby=${group.label ? `group-${g}` : nothing}
                    >
                      ${group.items.map(
                        (conversation) => html`
                          <li>
                            <button
                              part="conversation"
                              class="conversation"
                              type="button"
                              title=${conversation.title}
                              aria-current=${conversation.id === this.conversationId ? 'true' : nothing}
                              @click=${() => this.selectConversation(conversation)}
                            >
                              ${conversation.title}
                            </button>
                          </li>
                        `,
                      )}
                    </ul>
                  `,
                )
              : html`<p class="no-history">No conversations yet</p>`
          }
        </div>
        <slot name="sidebar-footer"></slot>
      </nav>
    `
  }

  private renderAttachments(attachments: ChatAttachment[]) {
    if (!attachments.length) return nothing
    return html`<ul class="message-files" aria-label="Attachments">
      ${attachments.map((file) => {
        const href = safeHref(file.url)
        const thumb =
          href && isImageFile(file)
            ? html`<img src=${href} alt="" />`
            : fileIcon
        const body = html`
          <span class="file-thumb" aria-hidden="true">${thumb}</span>
          <span class="file-text">
            <span class="file-name">${file.name}</span>
            ${
              file.size === undefined
                ? nothing
                : html`<span class="file-meta">${formatFileSize(file.size)}</span>`
            }
          </span>
        `
        return html`<li>
          ${
            href
              ? html`<a class="file" href=${href} target="_blank" rel="noopener noreferrer">${body}</a>`
              : html`<span class="file">${body}</span>`
          }
        </li>`
      })}
    </ul>`
  }

  private renderUserMessage(message: ChatMessage) {
    const key = keyOf(message)
    const content = message.content ?? ''
    return html`
      <article part="message" class="message user" data-id=${key}>
        <h3 class="sr-only">You said:</h3>
        ${this.renderAttachments(message.attachments ?? [])}
        ${content ? html`<div part="bubble" class="bubble">${content}</div>` : nothing}
        ${
          content
            ? html`<div class="message-actions">
                <button
                  class="copy-button"
                  type="button"
                  aria-label="Copy message"
                  title="Copy message"
                  ?data-copied=${this.copier.isCopied(key)}
                  @click=${() => this.copier.copy(content, key)}
                >
                  ${copy('icon-copy')} ${check('icon-check')}
                </button>
              </div>`
            : nothing
        }
      </article>
    `
  }

  private renderAssistantMessage(message: ChatMessage, isLast: boolean) {
    const key = keyOf(message)
    const status = statusOf(message)
    const steps = message.steps ?? []
    const content = message.content ?? ''
    const isStreaming = status === 'pending' || status === 'streaming'
    const isStepRunning = steps.some((step) => step.status === 'running')
    const isThinking = isStreaming && !content && !isStepRunning
    const activityOpen =
      this.activityChoices.get(key) ?? (isStreaming && !content)
    return html`
      <article
        part="message"
        class="message assistant"
        data-id=${key}
        data-status=${status}
      >
        <h3 class="sr-only">Assistant said:</h3>
        ${
          steps.length
            ? html`<moul-agent-activity
                class="activity"
                .steps=${steps}
                .isOpen=${activityOpen}
                @openchange=${(
                  event: CustomEvent<AgentActivityOpenChangeDetail>,
                ) => {
                  event.stopPropagation()
                  this.activityChoices.set(key, event.detail.isOpen)
                }}
              ></moul-agent-activity>`
            : nothing
        }
        ${
          isThinking
            ? html`<moul-thinking-indicator class="thinking"></moul-thinking-indicator>`
            : nothing
        }
        ${
          content || status === 'error' || !isStreaming
            ? html`<moul-streaming-response
                class="answer"
                .content=${content}
                .sources=${message.sources ?? []}
                ?is-streaming=${isStreaming}
                feedback=${message.feedback ?? ''}
                error=${status === 'error' ? message.error || 'Something went wrong.' : ''}
                actions=${isLast ? 'copy regenerate feedback' : 'copy feedback'}
                label="Assistant's answer"
                @regenerate=${(event: Event) => this.relayAnswerEvent(event, message)}
                @feedbackchange=${(event: Event) => this.relayAnswerEvent(event, message)}
              ></moul-streaming-response>`
            : nothing
        }
      </article>
    `
  }

  private renderEmpty() {
    const suggestions = Array.isArray(this.suggestions) ? this.suggestions : []
    return html`
      <div class="empty">
        <slot name="empty">
          <div class="greeting">
            <span class="greeting-mark" aria-hidden="true">${sparkle()}</span>
            <h3 class="greeting-text">${this.greeting}</h3>
          </div>
        </slot>
        ${
          suggestions.length
            ? html`<ul class="suggestions" aria-label="Suggestions">
                ${suggestions.map((suggestion) => {
                  const label =
                    typeof suggestion === 'string'
                      ? suggestion
                      : suggestion.label
                  const description =
                    typeof suggestion === 'string' ? '' : suggestion.description
                  return html`<li>
                    <button
                      part="suggestion"
                      class="suggestion"
                      type="button"
                      ?disabled=${this.isBusy}
                      @click=${() => this.sendSuggestion(suggestion)}
                    >
                      <span class="suggestion-label">${label}</span>
                      ${description ? html`<span class="suggestion-description">${description}</span>` : nothing}
                    </button>
                  </li>`
                })}
              </ul>`
            : nothing
        }
      </div>
    `
  }

  protected override render() {
    const messages = this.list()
    const conversations = Array.isArray(this.conversations)
      ? this.conversations
      : []
    const title =
      this.heading ||
      conversations.find((c) => c.id === this.conversationId)?.title ||
      'New chat'
    const lastAssistant = [...messages]
      .reverse()
      .find((message) => message.role === 'assistant')
    const history = messages
      .filter((message) => message.role === 'user' && message.content)
      .map((message) => message.content as string)
    const showSidebar = !this.hideSidebar && this.isSidebarOpen
    return html`
      <div
        part="base"
        class="base"
        ?data-narrow=${this.isNarrow}
        ?data-sidebar=${showSidebar}
      >
        ${this.renderSidebar()}
        ${
          showSidebar && this.isNarrow
            ? html`<div class="backdrop" @click=${() => this.setSidebar(false)}></div>`
            : nothing
        }
        <section part="main" class="main" aria-label=${this.label}>
          <header part="header" class="header">
            ${
              this.hideSidebar
                ? nothing
                : html`<button
                    class="sidebar-toggle"
                    type="button"
                    aria-label=${this.isSidebarOpen ? 'Hide conversations' : 'Show conversations'}
                    title=${this.isSidebarOpen ? 'Hide conversations' : 'Show conversations'}
                    aria-expanded=${this.isSidebarOpen ? 'true' : 'false'}
                    aria-controls="history"
                    @click=${() => this.setSidebar(!this.isSidebarOpen)}
                  >
                    ${sidebarPanel()}
                  </button>`
            }
            <h2 part="title" class="title">${title}</h2>
            <slot name="header-actions"></slot>
          </header>
          <div
            part="messages"
            class="messages"
            tabindex="0"
            aria-label="Messages"
            role="group"
            @scroll=${this.handleScroll}
          >
            <div class="thread">
              ${
                messages.length
                  ? repeat(messages, keyOf, (message) =>
                      message.role === 'user'
                        ? this.renderUserMessage(message)
                        : this.renderAssistantMessage(
                            message,
                            message === lastAssistant,
                          ),
                    )
                  : this.renderEmpty()
              }
            </div>
          </div>
          <div class="composer-area">
            <button
              part="jump-button"
              class="jump"
              type="button"
              ?hidden=${this.isPinned || !messages.length}
              @click=${() => this.scrollToBottom({ smooth: true })}
            >
              ${arrowDown()} Jump to latest
            </button>
            <moul-prompt-input
              part="composer"
              class="composer"
              exportparts="base: composer-base, textarea: composer-textarea, send-button: composer-send-button"
              placeholder=${this.placeholder}
              .placeholders=${this.placeholders}
              .models=${this.models}
              model=${this.model}
              ?allow-attachments=${this.allowAttachments}
              accept=${this.accept}
              max-files=${this.maxFiles}
              max-size=${this.maxSize}
              .upload=${this.upload}
              .history=${history}
              submit-key=${this.submitKey}
              ?is-generating=${this.isBusy}
              @promptsubmit=${this.handleSubmit}
              @modelchange=${this.handleModelChange}
            >
              <slot name="composer-start" slot="start"></slot>
            </moul-prompt-input>
            <slot name="footer"></slot>
          </div>
        </section>
        <span class="sr-only" role="status">${this.announcement}</span>
      </div>
    `
  }
}

defineElement('moul-chat', MoulChat)

declare global {
  interface HTMLElementTagNameMap {
    'moul-chat': MoulChat
  }
}
