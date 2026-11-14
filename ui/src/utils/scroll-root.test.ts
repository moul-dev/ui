import { fixture, fixtureCleanup, html } from '@open-wc/testing-helpers'
import { afterEach, describe, expect, it } from 'vitest'
import { findScrollRoot, scrollPortHeight } from './scroll-root'

afterEach(() => fixtureCleanup())

describe('findScrollRoot', () => {
  it('finds the nearest box that scrolls', async () => {
    const box = await fixture<HTMLDivElement>(
      html`<div style="overflow-y: auto; height: 200px">
        <section><p id="inner">Text</p></section>
      </div>`,
    )
    expect(findScrollRoot(box.querySelector('#inner') as Element)).toBe(box)
  })

  it('crosses slots and shadow roots', async () => {
    const box = await fixture<HTMLDivElement>(
      html`<div style="overflow-y: scroll; height: 200px">
        <div id="host"><p id="slotted">Text</p></div>
      </div>`,
    )
    const host = box.querySelector('#host') as HTMLElement
    const root = host.attachShadow({ mode: 'open' })
    root.innerHTML = '<div class="inside"><slot></slot></div>'
    const slotted = box.querySelector('#slotted') as Element
    expect(findScrollRoot(slotted)).toBe(box)
    expect(findScrollRoot(root.querySelector('.inside') as Element)).toBe(box)
  })

  it('counts overflow: hidden, as the browser does, unless told to skip it', async () => {
    const outer = await fixture<HTMLDivElement>(
      html`<div style="overflow-y: auto; height: 200px">
        <div class="clip" style="overflow-y: hidden"><p>Text</p></div>
      </div>`,
    )
    const clip = outer.querySelector('.clip') as Element
    const text = outer.querySelector('p') as Element
    expect(findScrollRoot(text)).toBe(clip)
    expect(findScrollRoot(text, { skipHidden: true })).toBe(outer)
  })

  it('passes over overflow: clip and returns null for the page', async () => {
    const el = await fixture<HTMLDivElement>(
      html`<div style="overflow-y: clip"><p>Text</p></div>`,
    )
    expect(findScrollRoot(el.querySelector('p') as Element)).toBeNull()
    expect(findScrollRoot(el)).toBeNull()
  })
})

describe('scrollPortHeight', () => {
  it('is the viewport height for the page', () => {
    expect(scrollPortHeight(null)).toBe(window.innerHeight)
  })
})
