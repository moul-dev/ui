import type { ReactiveController, ReactiveControllerHost } from 'lit'

export interface FormInternalsControllerOptions {
  /**
   * If true, warns when disconnected from form even if element has no `name` attribute.
   */
  requireFormConnection?: boolean
  onReset?: () => void
  onDisabledChange?: (disabled: boolean) => void
  onStateRestore?: (state: unknown, mode: 'restore' | 'autocomplete') => void
}

export class FormInternalsController implements ReactiveController {
  public internals: ElementInternals | null = null

  private host: ReactiveControllerHost & HTMLElement
  private options: FormInternalsControllerOptions

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: FormInternalsControllerOptions = {},
  ) {
    this.host = host
    this.options = options
    this.host.addController(this)
  }

  public hostConnected(): void {
    if (typeof this.host.attachInternals !== 'function') {
      console.warn(
        '[@moul-dev/ui] ElementInternals is not supported in this environment.',
      )
      this.internals = null
      return
    }

    if (!this.internals) {
      try {
        this.internals = this.host.attachInternals()
      } catch (err) {
        console.warn('[@moul-dev/ui] Failed to attach ElementInternals:', err)
        this.internals = null
        return
      }
    }

    // Detached form warning (Requirement 9.12)
    const hasName = this.host.hasAttribute?.('name') ?? false
    const requireConnection = Boolean(
      this.options.requireFormConnection || hasName,
    )
    if (requireConnection && this.internals) {
      const isConnectedToForm = Boolean(this.internals.form)
      if (!isConnectedToForm) {
        const tagName = (this.host.tagName ?? 'element').toLowerCase()
        console.warn(
          `[@moul-dev/ui] Form-associated element <${tagName}> is not connected to a <form>.`,
        )
      }
    }
  }

  public hostDisconnected(): void {
    // ElementInternals remains associated with the DOM node
  }

  public setValue(
    value: string | File | FormData | null,
    state?: unknown,
  ): void {
    if (this.internals && typeof this.internals.setFormValue === 'function') {
      this.internals.setFormValue(value, state as unknown as undefined)
    }
  }

  public setValidity(
    flags?: Partial<ValidityStateFlags>,
    message?: string,
    anchor?: HTMLElement,
  ): void {
    if (this.internals && typeof this.internals.setValidity === 'function') {
      const truncatedMessage =
        typeof message === 'string' ? message.slice(0, 200) : ''
      this.internals.setValidity(flags, truncatedMessage, anchor)
      this.internals.reportValidity?.()
    }
  }

  public checkValidity(): boolean {
    return this.internals?.checkValidity?.() ?? true
  }

  public reportValidity(): boolean {
    return this.internals?.reportValidity?.() ?? true
  }

  public get form(): HTMLFormElement | null {
    return this.internals?.form ?? null
  }

  public get validity(): ValidityState | null {
    return this.internals?.validity ?? null
  }

  public get validationMessage(): string {
    return this.internals?.validationMessage ?? ''
  }

  public get willValidate(): boolean {
    return this.internals?.willValidate ?? false
  }

  public get labels(): NodeList | null {
    return this.internals?.labels ?? null
  }
}
