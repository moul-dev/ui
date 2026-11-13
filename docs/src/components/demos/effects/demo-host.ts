/**
 * The smallest host a Moul controller needs, for the effects demos. It shows
 * that the controllers work in any custom element, not only a Lit one: the
 * host keeps a set of controllers, calls their lifecycle hooks, and batches
 * `requestUpdate()` into one `update()` per microtask, as Lit does.
 */
interface Controller {
  hostConnected?(): void
  hostDisconnected?(): void
  hostUpdate?(): void
  hostUpdated?(): void
}

export class DemoHost extends HTMLElement {
  readonly #controllers = new Set<Controller>()
  #isUpdatePending = false
  updateComplete: Promise<boolean> = Promise.resolve(true)

  addController(controller: Controller): void {
    this.#controllers.add(controller)
    if (this.isConnected) controller.hostConnected?.()
  }

  removeController(controller: Controller): void {
    this.#controllers.delete(controller)
  }

  requestUpdate(): void {
    if (this.#isUpdatePending) return
    this.#isUpdatePending = true
    this.updateComplete = Promise.resolve().then(() => {
      this.#isUpdatePending = false
      for (const controller of this.#controllers) controller.hostUpdate?.()
      this.update()
      for (const controller of this.#controllers) controller.hostUpdated?.()
      return true
    })
  }

  connectedCallback(): void {
    for (const controller of this.#controllers) controller.hostConnected?.()
    this.requestUpdate()
  }

  disconnectedCallback(): void {
    for (const controller of this.#controllers) controller.hostDisconnected?.()
  }

  /** Renders the element. Runs once after connecting and after each `requestUpdate()`. */
  protected update(): void {}
}

/** Defines a demo element once, even when a page includes its demo twice. */
export function defineDemo(
  tag: string,
  element: CustomElementConstructor,
): void {
  if (!customElements.get(tag)) customElements.define(tag, element)
}
