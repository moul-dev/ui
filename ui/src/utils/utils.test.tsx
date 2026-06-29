import * as React from 'react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { mergeProps } from './mergeProps'
import { hasTextContent, warnMissingLabel } from './warnMissingLabel'

describe('hasTextContent helper', () => {
  test('returns false for null, undefined, or empty values', () => {
    expect(hasTextContent(null)).toBe(false)
    expect(hasTextContent(undefined)).toBe(false)
    expect(hasTextContent('')).toBe(false)
    expect(hasTextContent('   ')).toBe(false)
  })

  test('returns true for non-empty strings and numbers', () => {
    expect(hasTextContent('Hello')).toBe(true)
    expect(hasTextContent(123)).toBe(true)
    expect(hasTextContent('  word  ')).toBe(true)
  })

  test('recursively checks arrays of children', () => {
    expect(hasTextContent([null, undefined, ''])).toBe(false)
    expect(hasTextContent([null, 'Hello', ''])).toBe(true)
  })

  test('recursively checks children nested in React elements', () => {
    const element = React.createElement('span', null, 'Nested text')
    expect(hasTextContent(element)).toBe(true)

    const emptyElement = React.createElement('div', null)
    expect(hasTextContent(emptyElement)).toBe(false)

    const deeplyNested = React.createElement(
      'div',
      null,
      React.createElement(
        'span',
        null,
        React.createElement('strong', null, 'Deep'),
      ),
    )
    expect(hasTextContent(deeplyNested)).toBe(true)
  })
})

describe('warnMissingLabel', () => {
  let warnSpy: any
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    warnSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  test('warns when label, labelledBy, and children are all absent', () => {
    warnMissingLabel('TestComponent', {})
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain(
      '[TestComponent] This component has no accessible name',
    )
  })

  test('does not warn when label is provided', () => {
    warnMissingLabel('TestComponent', { label: 'My Label' })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('does not warn when labelledBy is provided', () => {
    warnMissingLabel('TestComponent', { labelledBy: 'some-id' })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('does not warn when children has valid text content', () => {
    warnMissingLabel('TestComponent', { children: 'Visible text' })
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('warns when children has empty/whitespace text content', () => {
    warnMissingLabel('TestComponent', { children: '   ' })
    expect(warnSpy).toHaveBeenCalledTimes(1)
  })

  test('suppresses warnings in production environment', () => {
    process.env.NODE_ENV = 'production'
    warnMissingLabel('TestComponent', {})
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('mergeProps wrapper', () => {
  test('merges classNames and event handlers', () => {
    const clickHandler1 = vi.fn()
    const clickHandler2 = vi.fn()

    const merged = mergeProps(
      { className: 'class-a', onClick: clickHandler1, id: 'test-id' },
      { className: 'class-b', onClick: clickHandler2 },
    )

    expect(merged.className).toBe('class-a class-b')
    expect(merged.id).toBe('test-id')

    if (merged.onClick) {
      merged.onClick({} as any)
    }
    expect(clickHandler1).toHaveBeenCalledTimes(1)
    expect(clickHandler2).toHaveBeenCalledTimes(1)
  })
})
