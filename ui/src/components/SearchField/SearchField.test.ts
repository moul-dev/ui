import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import './SearchField'
import type { MoulSearchField } from './SearchField'
import { searchFieldStyles } from './SearchField.styles'

const css = searchFieldStyles
  .map((sheet) => ('cssText' in sheet ? sheet.cssText : ''))
  .join('\n')

/** Lets the focusout check (one task later) and the render it causes run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** The body of the first `@media` block whose query starts with `query`. */
function mediaBlock(query: string): string {
  const start = css.indexOf(`@media ${query}`)
  if (start < 0) return ''
  let depth = 0
  for (let i = css.indexOf('{', start); i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) {
      return css.slice(css.indexOf('{', start) + 1, i)
    }
  }
  return ''
}

function key(target: HTMLElement, name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: name,
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  target.dispatchEvent(event)
  return event
}

const button = (el: MoulSearchField) => el.expandButton as HTMLButtonElement

describe('<moul-search-field is-expandable>', () => {
  afterEach(() => {
    fixtureCleanup()
  })

  it('starts as a round search button that controls the input', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search the docs"></moul-search-field>`,
    )
    expect(el.isExpandable).toBe(true)
    expect(el.isExpanded).toBe(false)
    expect(el.hasAttribute('is-expanded')).toBe(false)

    const trigger = button(el)
    expect(trigger.tagName).toBe('BUTTON')
    expect(trigger.type).toBe('button')
    expect(trigger.getAttribute('aria-label')).toBe('Search the docs')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-controls')).toBe('input')
    expect(el.inputElement?.id).toBe('input')
    expect(trigger.getAttribute('tabindex')).toBe('0')
    // The closed input is out of the tab order and hidden.
    expect(el.inputElement?.getAttribute('tabindex')).toBe('-1')
  })

  it('a plain field renders no expand button', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field label="Search"></moul-search-field>`,
    )
    expect(el.expandButton).toBeNull()
    expect(el.shadowRoot?.querySelector('[part="search-icon"]')).not.toBeNull()
  })

  it('opens on press, moves focus into the input and fires expandchange', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    const changes: boolean[] = []
    el.addEventListener('expandchange', (event) => {
      changes.push((event as CustomEvent).detail.isExpanded)
    })

    button(el).click()
    await el.updateComplete
    await el.updateComplete

    expect(el.isExpanded).toBe(true)
    expect(el.hasAttribute('is-expanded')).toBe(true)
    expect(changes).toEqual([true])
    expect(button(el).getAttribute('aria-expanded')).toBe('true')
    expect(button(el).getAttribute('tabindex')).toBe('-1')
    expect(el.inputElement?.hasAttribute('tabindex')).toBe(false)
    expect(el.shadowRoot?.activeElement).toBe(el.inputElement)
  })

  it('Escape in an empty open field closes it and returns focus to the button', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    button(el).click()
    await el.updateComplete
    const changes: boolean[] = []
    el.addEventListener('expandchange', (event) => {
      changes.push((event as CustomEvent).detail.isExpanded)
    })

    const event = key(el.inputElement as HTMLInputElement, 'Escape')
    await el.updateComplete
    await el.updateComplete

    expect(event.defaultPrevented).toBe(true)
    expect(el.isExpanded).toBe(false)
    expect(changes).toEqual([false])
    expect(el.shadowRoot?.activeElement).toBe(button(el))
  })

  it('Escape with text clears it first and stays open; a second Escape closes', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    button(el).click()
    await el.updateComplete
    el.value = 'koh'
    await el.updateComplete

    key(el.inputElement as HTMLInputElement, 'Escape')
    await el.updateComplete
    expect(el.value).toBe('')
    expect(el.isExpanded).toBe(true)

    key(el.inputElement as HTMLInputElement, 'Escape')
    await el.updateComplete
    expect(el.isExpanded).toBe(false)
  })

  it('closes when focus leaves it empty, and stays open when it has text', async () => {
    const outside = document.createElement('button')
    document.body.append(outside)
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    button(el).click()
    await el.updateComplete

    el.inputElement?.blur()
    outside.focus()
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle()
    await el.updateComplete
    expect(el.isExpanded).toBe(false)

    button(el).click()
    await el.updateComplete
    el.value = 'Kampot'
    await el.updateComplete
    outside.focus()
    el.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    await settle()
    await el.updateComplete
    expect(el.isExpanded).toBe(true)
    outside.remove()
  })

  it('starts open when it already has a value', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search" value="Siem Reap"></moul-search-field>`,
    )
    expect(el.isExpanded).toBe(true)
    expect(el.shadowRoot?.querySelector('[part="clear-btn"]')).not.toBeNull()
  })

  it('hides the clear button while closed', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search" value="Kep"></moul-search-field>`,
    )
    el.isExpanded = false
    await el.updateComplete
    expect(el.shadowRoot?.querySelector('[part="clear-btn"]')).toBeNull()
  })

  it('setting isExpanded opens and closes it without an event', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    let fired = 0
    el.addEventListener('expandchange', () => {
      fired++
    })
    el.isExpanded = true
    await el.updateComplete
    expect(el.hasAttribute('is-expanded')).toBe(true)
    el.isExpanded = false
    await el.updateComplete
    expect(fired).toBe(0)
  })

  it('names the button and input from aria-label when there is no label', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable aria-label="Search places"></moul-search-field>`,
    )
    expect(button(el).getAttribute('aria-label')).toBe('Search places')
    expect(el.inputElement?.getAttribute('aria-label')).toBe('Search places')

    const bare = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable></moul-search-field>`,
    )
    expect(button(bare).getAttribute('aria-label')).toBe('Search')
  })

  it('does not open while disabled', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable is-disabled label="Search"></moul-search-field>`,
    )
    expect(button(el).disabled).toBe(true)
    button(el).click()
    await el.updateComplete
    expect(el.isExpanded).toBe(false)
  })

  it('keeps Enter submitting the query once open', async () => {
    const el = await fixture<MoulSearchField>(
      html`<moul-search-field is-expandable label="Search"></moul-search-field>`,
    )
    button(el).click()
    await el.updateComplete
    el.value = 'Mondulkiri'
    await el.updateComplete
    let submitted = ''
    el.addEventListener('submit', (event) => {
      submitted = (event as CustomEvent).detail.value
    })
    key(el.inputElement as HTMLInputElement, 'Enter')
    expect(submitted).toBe('Mondulkiri')
  })

  it('animates the width open with a spring and opens at once under reduced motion', () => {
    expect(css).toContain(
      'inline-size: var(--search-field-expanded-width, 16rem)',
    )
    expect(css).toMatch(
      /inline-size var\(--duration-slow[^)]*\) var\(--ease-spring/,
    )
    const reduced = mediaBlock('(prefers-reduced-motion: reduce)')
    expect(reduced).toContain(
      ":host([is-expandable]) [part~='input-container']",
    )
    expect(reduced).toMatch(/transition:\s*none/)
  })
})
