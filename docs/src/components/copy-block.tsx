'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

export type PackageManager = 'bun' | 'pnpm' | 'npm' | 'yarn'

export interface PackageManagerConfig {
  id: PackageManager
  label: string
  prefix: string
}

export const PACKAGE_MANAGERS: readonly PackageManagerConfig[] = [
  { id: 'pnpm', label: 'pnpm', prefix: 'pnpm add' },
  { id: 'yarn', label: 'yarn', prefix: 'yarn add' },
  { id: 'bun', label: 'bun', prefix: 'bun add' },
  { id: 'npm', label: 'npm', prefix: 'npm i' },
] as const

interface CopyBlockProps {
  /** Optional custom full command string (e.g. for non-package installation commands) */
  command?: string
  /** Target package or arguments (default: "@moul-dev/ui") */
  packageName?: string
  /** Default active package manager */
  defaultManager?: PackageManager
  /** Extra container class names */
  className?: string
}

export function CopyBlock({
  command,
  packageName = '@moul-dev/ui',
  defaultManager = 'pnpm',
  className = '',
}: CopyBlockProps) {
  // If a custom command is explicitly provided and does not fit the default "@moul-dev/ui",
  // we render standard single-command mode.
  const isCustomSingleCommand = Boolean(
    command &&
      !command.includes('@moul-dev/ui') &&
      !command.startsWith('bun add'),
  )

  const [activeManager, setActiveManager] =
    useState<PackageManager>(defaultManager)
  const [prevManager, setPrevManager] = useState<PackageManager>(defaultManager)
  const [copied, setCopied] = useState(false)
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number
    width: number
  }>({
    left: 0,
    width: 0,
  })
  const [prefixWidth, setPrefixWidth] = useState<number | undefined>(undefined)

  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Map<PackageManager, HTMLButtonElement>>(new Map())
  const prefixItemRefs = useRef<Map<PackageManager, HTMLSpanElement>>(new Map())
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tabListId = useId()

  const currentPM =
    PACKAGE_MANAGERS.find((pm) => pm.id === activeManager) ??
    PACKAGE_MANAGERS[0]
  const prefix = currentPM ? currentPM.prefix : 'bun add'
  const activeFullCommand =
    isCustomSingleCommand && command ? command : `${prefix} ${packageName}`

  // Update sliding indicator position whenever active manager changes
  const updateIndicator = useCallback(() => {
    const tabEl = tabRefs.current.get(activeManager)
    const tabsContainer = tabsRef.current
    if (tabEl && tabsContainer) {
      const containerRect = tabsContainer.getBoundingClientRect()
      const tabRect = tabEl.getBoundingClientRect()
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      })
    }
  }, [activeManager])

  // Update animated prefix width so suffix glides smoothly
  const updatePrefixWidth = useCallback(() => {
    const prefixEl = prefixItemRefs.current.get(activeManager)
    if (prefixEl) {
      setPrefixWidth(prefixEl.offsetWidth)
    }
  }, [activeManager])

  useEffect(() => {
    updateIndicator()
    updatePrefixWidth()
  }, [updateIndicator, updatePrefixWidth])

  useEffect(() => {
    const handleResize = () => {
      updateIndicator()
      updatePrefixWidth()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateIndicator, updatePrefixWidth])

  const selectManager = (pm: PackageManager) => {
    if (pm !== activeManager) {
      setPrevManager(activeManager)
      setActiveManager(pm)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = PACKAGE_MANAGERS.findIndex(
      (pm) => pm.id === activeManager,
    )
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % PACKAGE_MANAGERS.length
      const nextPM = PACKAGE_MANAGERS[nextIndex]?.id
      if (nextPM) {
        selectManager(nextPM)
        tabRefs.current.get(nextPM)?.focus()
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex =
        (currentIndex - 1 + PACKAGE_MANAGERS.length) % PACKAGE_MANAGERS.length
      const prevPM = PACKAGE_MANAGERS[prevIndex]?.id
      if (prevPM) {
        selectManager(prevPM)
        tabRefs.current.get(prevPM)?.focus()
      }
    }
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeFullCommand)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = activeFullCommand
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    setCopied(true)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
  }, [activeFullCommand])

  if (isCustomSingleCommand && command) {
    return (
      <div
        className={`install-block ${copied ? 'is-copied' : ''} ${className}`}
      >
        <span className="prompt">$</span>
        <code className="command-text">{command}</code>
        <button
          type="button"
          onClick={handleCopy}
          className={`copy-btn ${copied ? 'copied' : ''}`}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="copy-check-icon"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="copy-clipboard-icon"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    )
  }

  const activeIndex = PACKAGE_MANAGERS.findIndex(
    (pm) => pm.id === activeManager,
  )
  const prevIndex = PACKAGE_MANAGERS.findIndex((pm) => pm.id === prevManager)
  const isMovingForward = activeIndex >= prevIndex

  return (
    <div
      className={`install-card group ${copied ? 'is-copied' : ''} ${className}`}
    >
      {/* Header with Package Manager Tabs */}
      <div className="install-card-header">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Package Manager selection"
          id={tabListId}
          onKeyDown={handleKeyDown}
          className="install-tabs-nav"
        >
          {/* Sliding background pill indicator */}
          <div
            className="install-tab-indicator"
            style={{
              transform: `translateX(${indicatorStyle.left}px)`,
              width: `${indicatorStyle.width}px`,
              opacity: indicatorStyle.width > 0 ? 1 : 0,
            }}
            aria-hidden="true"
          />

          {PACKAGE_MANAGERS.map((pm) => {
            const isSelected = activeManager === pm.id
            return (
              <button
                key={pm.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(pm.id, el)
                  else tabRefs.current.delete(pm.id)
                }}
                type="button"
                role="tab"
                id={`tab-${pm.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${pm.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => selectManager(pm.id)}
                className={`install-tab-btn ${isSelected ? 'active' : ''}`}
              >
                {pm.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Terminal Command Line */}
      <div
        className="install-command-bar"
        onClick={handleCopy}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCopy()
          }
        }}
        aria-label={`Copy command: ${activeFullCommand}`}
      >
        <div className="install-command-content">
          <span className="prompt" aria-hidden="true">
            $
          </span>

          <div
            className="install-prefix-viewport"
            style={{
              width: prefixWidth !== undefined ? `${prefixWidth}px` : 'auto',
            }}
          >
            {PACKAGE_MANAGERS.map((pm) => {
              const isActive = activeManager === pm.id
              const isPrev = prevManager === pm.id && !isActive

              let animationClass = 'inactive'
              if (isActive) {
                animationClass = 'active'
              } else if (isPrev) {
                animationClass = isMovingForward ? 'exit-up' : 'exit-down'
              }

              return (
                <span
                  key={pm.id}
                  ref={(el) => {
                    if (el) prefixItemRefs.current.set(pm.id, el)
                    else prefixItemRefs.current.delete(pm.id)
                  }}
                  className={`install-prefix-item ${animationClass}`}
                  aria-hidden={!isActive}
                >
                  {pm.prefix}
                </span>
              )
            })}
          </div>

          <span className="install-suffix">{packageName}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleCopy()
          }}
          className={`copy-btn ${copied ? 'copied' : ''}`}
          aria-label={copied ? 'Copied to clipboard!' : 'Copy to clipboard'}
        >
          {copied && <span className="copy-tooltip">Copied!</span>}
          {copied ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="copy-check-icon"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="copy-clipboard-icon"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
