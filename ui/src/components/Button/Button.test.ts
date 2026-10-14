import { describe, expect, it, vi } from 'vitest'
import './index.js'
import type { MoulButton } from './Button.js'

describe('MoulButton', () => {
  it('registers the <moul-button> custom element', () => {
    expect(customElements.get('moul-button')).toBeDefined()
  })

  it('renders with default props and attributes', async () => {
    const btn = document.createElement('moul-button') as MoulButton
    btn.textContent = 'Click me'
    document.body.appendChild(btn)
    await btn.updateComplete

    const innerBtn = btn.shadowRoot!.querySelector('button')!
    expect(innerBtn).toBeDefined()
    expect(innerBtn.classList.contains('btn')).toBe(true)
    expect(innerBtn.classList.contains('btn-primary')).toBe(true)
    expect(btn.getAttribute('size')).toBe('md')

    btn.remove()
  })

  it('fires moul-press on click and Enter/Space keyboard events', async () => {
    const btn = document.createElement('moul-button') as MoulButton
    document.body.appendChild(btn)
    await btn.updateComplete

    const pressHandler = vi.fn()
    btn.addEventListener('moul-press', pressHandler)

    const innerBtn = btn.shadowRoot!.querySelector('button')!
    innerBtn.click()
    expect(pressHandler).toHaveBeenCalledTimes(1)

    innerBtn.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    )
    expect(pressHandler).toHaveBeenCalledTimes(2)

    innerBtn.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    )
    expect(pressHandler).toHaveBeenCalledTimes(3)

    btn.remove()
  })

  it('prevents interactions when is-disabled or is-pending', async () => {
    const btn = document.createElement('moul-button') as MoulButton
    btn.setAttribute('is-disabled', '')
    document.body.appendChild(btn)
    await btn.updateComplete

    const pressHandler = vi.fn()
    btn.addEventListener('moul-press', pressHandler)

    const innerBtn = btn.shadowRoot!.querySelector('button')!
    innerBtn.click()
    expect(pressHandler).not.toHaveBeenCalled()
    expect(innerBtn.hasAttribute('disabled')).toBe(true)
    expect(innerBtn.getAttribute('aria-disabled')).toBe('true')

    btn.removeAttribute('is-disabled')
    btn.setAttribute('is-pending', '')
    await btn.updateComplete

    innerBtn.click()
    expect(pressHandler).not.toHaveBeenCalled()
    expect(innerBtn.getAttribute('aria-busy')).toBe('true')
    expect(btn.shadowRoot!.querySelector('.spinner')).not.toBeNull()

    btn.remove()
  })
})
