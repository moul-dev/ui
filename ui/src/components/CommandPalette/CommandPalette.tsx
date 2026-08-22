'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Dialog as AriaDialog,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
} from 'react-aria-components'
import { Kbd } from '../Kbd'
import { styles } from './CommandPalette.styles'

// ── Hook: useCommandPalette ──────────────────────────────────────────

export interface UseCommandPaletteOptions {
  shortcut?: string | string[]
  defaultOpen?: boolean
}

export function useCommandPalette(options: UseCommandPaletteOptions = {}) {
  const { shortcut = ['Meta+k', 'Ctrl+k'], defaultOpen = false } = options
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  const open = React.useCallback(() => setIsOpen(true), [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const toggle = React.useCallback(() => setIsOpen((prev) => !prev), [])

  React.useEffect(() => {
    if (!shortcut) return

    const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut]

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const sc of shortcuts) {
        const parts = sc.toLowerCase().split('+')
        const key = parts[parts.length - 1]
        const needsMeta = parts.includes('meta') || parts.includes('cmd') || parts.includes('command')
        const needsCtrl = parts.includes('ctrl') || parts.includes('control')
        const needsShift = parts.includes('shift')
        const needsAlt = parts.includes('alt')

        const metaMatch = needsMeta ? event.metaKey : true
        const ctrlMatch = needsCtrl ? event.ctrlKey : true
        const shiftMatch = needsShift ? event.shiftKey : true
        const altMatch = needsAlt ? event.altKey : true
        const keyMatch = event.key.toLowerCase() === key

        if ((needsMeta || needsCtrl) && (event.metaKey || event.ctrlKey) && keyMatch) {
          event.preventDefault()
          toggle()
          return
        }

        if (metaMatch && ctrlMatch && shiftMatch && altMatch && keyMatch) {
          event.preventDefault()
          toggle()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut, toggle])

  return { isOpen, setIsOpen, open, close, toggle }
}

// ── Context ──────────────────────────────────────────────────────────

export interface CommandPaletteItemData {
  id: string
  onAction?: () => void
  getElement?: () => HTMLElement | null
}

interface CommandPaletteContextValue {
  search: string
  setSearch: (value: string) => void
  activeId: string | null
  setActiveId: (id: string | null) => void
  registerItem: (item: CommandPaletteItemData) => () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void
  selectActive: () => void
  close: () => void
  matchCount: number
}

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | null>(null)

export function useCommandPaletteContext() {
  const context = React.useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('CommandPalette compound components must be used within <CommandPalette>')
  }
  return context
}

// ── Icons ────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(styles.searchIcon)}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

// ── CommandPalette Component ─────────────────────────────────────────

export interface CommandPaletteProps {
  isOpen?: boolean
  defaultOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  shortcut?: string | string[]
  size?: 'sm' | 'md' | 'lg'
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const CommandPalette = React.forwardRef<HTMLDivElement, CommandPaletteProps>(
  function CommandPalette(
    {
      isOpen: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      shortcut = ['Meta+k', 'Ctrl+k'],
      size = 'md',
      style,
      className,
      children,
    },
    ref,
  ) {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen

    const handleOpenChange = React.useCallback(
      (nextOpen: boolean) => {
        if (!isControlled) {
          setUncontrolledOpen(nextOpen)
        }
        onOpenChange?.(nextOpen)
      },
      [isControlled, onOpenChange],
    )

    // Global keyboard shortcut listener
    React.useEffect(() => {
      if (!shortcut) return

      const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut]
      const handleGlobalKeyDown = (event: KeyboardEvent) => {
        for (const sc of shortcuts) {
          const parts = sc.toLowerCase().split('+')
          const key = parts[parts.length - 1]
          const isCmdOrCtrl = parts.includes('meta') || parts.includes('ctrl') || parts.includes('cmd')

          if (isCmdOrCtrl && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === key) {
            event.preventDefault()
            handleOpenChange(!isOpen)
            return
          }
        }
      }

      window.addEventListener('keydown', handleGlobalKeyDown)
      return () => window.removeEventListener('keydown', handleGlobalKeyDown)
    }, [shortcut, isOpen, handleOpenChange])

    const [search, setSearch] = React.useState('')
    const [activeId, setActiveId] = React.useState<string | null>(null)
    const [itemIds, setItemIds] = React.useState<string[]>([])
    const itemsMapRef = React.useRef<Map<string, CommandPaletteItemData>>(new Map())

    // Reset search and active on close
    React.useEffect(() => {
      if (!isOpen) {
        setSearch('')
        setActiveId(null)
        setItemIds([])
        itemsMapRef.current.clear()
      }
    }, [isOpen])

    const registerItem = React.useCallback((item: CommandPaletteItemData) => {
      itemsMapRef.current.set(item.id, item)
      setItemIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]))

      return () => {
        itemsMapRef.current.delete(item.id)
        setItemIds((prev) => prev.filter((id) => id !== item.id))
      }
    }, [])

    // Ensure the first matching item is selected by default
    React.useEffect(() => {
      if (itemIds.length > 0) {
        setActiveId((curr) => (curr && itemIds.includes(curr) ? curr : itemIds[0]))
      } else {
        setActiveId(null)
      }
    }, [itemIds])

    const close = React.useCallback(() => {
      handleOpenChange(false)
    }, [handleOpenChange])

    const navigateNext = React.useCallback(() => {
      if (itemIds.length === 0) return
      setActiveId((curr) => {
        const currentIndex = curr ? itemIds.indexOf(curr) : -1
        const nextIndex = (currentIndex + 1) % itemIds.length
        const nextId = itemIds[nextIndex]
        const elem = itemsMapRef.current.get(nextId)?.getElement?.()
        elem?.scrollIntoView?.({ block: 'nearest' })
        return nextId
      })
    }, [itemIds])

    const navigatePrev = React.useCallback(() => {
      if (itemIds.length === 0) return
      setActiveId((curr) => {
        const currentIndex = curr ? itemIds.indexOf(curr) : -1
        const prevIndex = (currentIndex - 1 + itemIds.length) % itemIds.length
        const prevId = itemIds[prevIndex]
        const elem = itemsMapRef.current.get(prevId)?.getElement?.()
        elem?.scrollIntoView?.({ block: 'nearest' })
        return prevId
      })
    }, [itemIds])

    const selectActive = React.useCallback(() => {
      if (!activeId) return
      const item = itemsMapRef.current.get(activeId)
      if (item?.onAction) {
        item.onAction()
        close()
      }
    }, [activeId, close])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          e.stopPropagation()
          navigateNext()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          e.stopPropagation()
          navigatePrev()
        } else if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
          selectActive()
        } else if (e.key === 'Escape') {
          e.preventDefault()
          e.stopPropagation()
          close()
        }
      },
      [navigateNext, navigatePrev, selectActive, close],
    )

    const contextValue = React.useMemo(
      () => ({
        search,
        setSearch,
        activeId,
        setActiveId,
        registerItem,
        handleKeyDown,
        selectActive,
        close,
        matchCount: itemIds.length,
      }),
      [search, activeId, registerItem, handleKeyDown, selectActive, close, itemIds.length],
    )

    if (!isOpen) return null

    return (
      <CommandPaletteContext.Provider value={contextValue}>
        <AriaModalOverlay
          isOpen={isOpen}
          onOpenChange={handleOpenChange}
          isDismissable
          className={(_) => {
            const { className: stylexClass } = stylex.props(styles.overlay)
            return stylexClass || ''
          }}
          style={(_) => {
            const { style: stylexStyle } = stylex.props(styles.overlay)
            return stylexStyle ?? {}
          }}
        >
          <AriaModal
            className={(_) => {
              const { className: stylexClass } = stylex.props(
                styles.dialog,
                styles[size],
                style,
              )
              return [stylexClass, className].filter(Boolean).join(' ')
            }}
            style={(_) => {
              const { style: stylexStyle } = stylex.props(
                styles.dialog,
                styles[size],
                style,
              )
              return stylexStyle ?? {}
            }}
          >
            <AriaDialog
              ref={ref}
              aria-label="Command Palette"
              style={{ outline: 'none', display: 'flex', flexDirection: 'column', width: '100%' }}
            >
              <div
                onKeyDown={handleKeyDown}
                style={{ display: 'flex', flexDirection: 'column', width: '100%', outline: 'none' }}
              >
                {children}
              </div>
            </AriaDialog>
          </AriaModal>
        </AriaModalOverlay>
      </CommandPaletteContext.Provider>
    )
  },
)

// ── CommandPaletteInput Component ─────────────────────────────────────

export interface CommandPaletteInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style'> {
  style?: StyleXStyles
  className?: string
  showKbd?: boolean
}

export const CommandPaletteInput = React.forwardRef<
  HTMLInputElement,
  CommandPaletteInputProps
>(function CommandPaletteInput(
  {
    style,
    className,
    placeholder = 'Type a command or search...',
    showKbd = true,
    value: controlledValue,
    onChange,
    onKeyDown,
    ...rest
  },
  ref,
) {
  const { search, setSearch, close, handleKeyDown } = useCommandPaletteContext()
  const value = controlledValue !== undefined ? controlledValue : search

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    onChange?.(e)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    handleKeyDown(e)
    onKeyDown?.(e)
  }

  const { className: wrapperClass, style: wrapperStyle } = stylex.props(
    styles.inputWrapper,
    style,
  )

  return (
    <div className={[wrapperClass, className].filter(Boolean).join(' ')} style={wrapperStyle}>
      <SearchIcon />
      <input
        {...rest}
        ref={ref}
        type="text"
        autoFocus
        value={value}
        onChange={handleChange}
        onKeyDown={handleInputKeyDown}
        placeholder={placeholder}
        aria-label="Search commands"
        {...stylex.props(styles.input)}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setSearch('')}
          {...stylex.props(styles.clearButton)}
        >
          ✕
        </button>
      )}
      {showKbd && <Kbd onClick={close} style={styles.kbdEsc}>ESC</Kbd>}
    </div>
  )
})

// ── CommandPaletteList Component ──────────────────────────────────────

export interface CommandPaletteListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CommandPaletteList = React.forwardRef<
  HTMLDivElement,
  CommandPaletteListProps
>(function CommandPaletteList({ style, className, onKeyDown, children, ...rest }, ref) {
  const { handleKeyDown } = useCommandPaletteContext()
  const { className: listClass, style: listStyle } = stylex.props(styles.list, style)

  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleKeyDown(e)
    onKeyDown?.(e)
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="listbox"
      tabIndex={-1}
      onKeyDown={handleListKeyDown}
      className={[listClass, className].filter(Boolean).join(' ')}
      style={listStyle}
    >
      {children}
    </div>
  )
})

// ── CommandPaletteSection Component ───────────────────────────────────

export interface CommandPaletteSectionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  heading?: string
  style?: StyleXStyles
  className?: string
}

export const CommandPaletteSection = React.forwardRef<
  HTMLDivElement,
  CommandPaletteSectionProps
>(function CommandPaletteSection({ heading, style, className, children, ...rest }, ref) {
  const { className: sectionClass, style: sectionStyle } = stylex.props(
    styles.section,
    style,
  )

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      className={[sectionClass, className].filter(Boolean).join(' ')}
      style={sectionStyle}
    >
      {heading && <div {...stylex.props(styles.sectionHeader)}>{heading}</div>}
      {children}
    </div>
  )
})

// ── CommandPaletteItem Component ──────────────────────────────────────

export interface CommandPaletteItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'onSelect'> {
  icon?: React.ReactNode
  description?: React.ReactNode
  shortcut?: string | string[]
  badge?: React.ReactNode
  keywords?: string[]
  onAction?: () => void
  isDisabled?: boolean
  style?: StyleXStyles
  className?: string
}

export const CommandPaletteItem = React.forwardRef<
  HTMLDivElement,
  CommandPaletteItemProps
>(function CommandPaletteItem(
  {
    icon,
    description,
    shortcut,
    badge,
    keywords = [],
    onAction,
    isDisabled = false,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const id = React.useId()
  const itemRef = React.useRef<HTMLDivElement | null>(null)
  const { search, activeId, setActiveId, registerItem, close } = useCommandPaletteContext()
  const isActive = activeId === id

  React.useImperativeHandle(ref, () => itemRef.current!)

  // Filter check
  const labelText = typeof children === 'string' ? children : ''
  const descText = typeof description === 'string' ? description : ''
  const matchesQuery = React.useMemo(() => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const inLabel = labelText.toLowerCase().includes(q)
    const inDesc = descText.toLowerCase().includes(q)
    const inKeywords = keywords.some((k) => k.toLowerCase().includes(q))
    return inLabel || inDesc || inKeywords
  }, [search, labelText, descText, keywords])

  // Register item into keyboard navigation list
  React.useEffect(() => {
    if (!matchesQuery || isDisabled) return
    return registerItem({
      id,
      onAction,
      getElement: () => itemRef.current,
    })
  }, [id, matchesQuery, isDisabled, onAction, registerItem])

  if (!matchesQuery) return null

  const handlePointerEnter = () => {
    if (!isDisabled) {
      setActiveId(id)
    }
  }

  const handleClick = () => {
    if (isDisabled) return
    onAction?.()
    close()
  }

  const shortcuts = shortcut ? (Array.isArray(shortcut) ? shortcut : [shortcut]) : []

  const { className: itemClass, style: itemStyle } = stylex.props(
    styles.item,
    isActive && styles.itemActive,
    isDisabled && styles.itemDisabled,
    style,
  )

  return (
    <div
      {...rest}
      ref={itemRef}
      role="option"
      aria-selected={isActive}
      aria-disabled={isDisabled}
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      className={[itemClass, className].filter(Boolean).join(' ')}
      style={itemStyle}
    >
      <div {...stylex.props(styles.itemContent)}>
        {icon && <div {...stylex.props(styles.itemIcon)}>{icon}</div>}
        <div {...stylex.props(styles.itemTextWrapper)}>
          <span {...stylex.props(styles.itemLabel)}>{children}</span>
          {description && (
            <span {...stylex.props(styles.itemDescription)}>{description}</span>
          )}
        </div>
      </div>

      {(shortcuts.length > 0 || badge) && (
        <div {...stylex.props(styles.itemMeta)}>
          {badge}
          {shortcuts.map((sc, i) => (
            <Kbd key={i}>{sc}</Kbd>
          ))}
        </div>
      )}
    </div>
  )
})

// ── CommandPaletteEmpty Component ─────────────────────────────────────

export interface CommandPaletteEmptyProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CommandPaletteEmpty = React.forwardRef<
  HTMLDivElement,
  CommandPaletteEmptyProps
>(function CommandPaletteEmpty({ style, className, children, ...rest }, ref) {
  const { matchCount } = useCommandPaletteContext()

  if (matchCount > 0) return null

  const { className: emptyClass, style: emptyStyle } = stylex.props(
    styles.empty,
    style,
  )

  return (
    <div
      {...rest}
      ref={ref}
      className={[emptyClass, className].filter(Boolean).join(' ')}
      style={emptyStyle}
    >
      {children || 'No results found.'}
    </div>
  )
})

// ── CommandPaletteFooter Component ────────────────────────────────────

export interface CommandPaletteFooterProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const CommandPaletteFooter = React.forwardRef<
  HTMLDivElement,
  CommandPaletteFooterProps
>(function CommandPaletteFooter({ style, className, children, ...rest }, ref) {
  const { className: footerClass, style: footerStyle } = stylex.props(
    styles.footer,
    style,
  )

  return (
    <div
      {...rest}
      ref={ref}
      className={[footerClass, className].filter(Boolean).join(' ')}
      style={footerStyle}
    >
      {children || (
        <>
          <div {...stylex.props(styles.footerKeyGroup)}>
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>Navigate</span>
          </div>
          <div {...stylex.props(styles.footerKeyGroup)}>
            <Kbd>↵</Kbd>
            <span>Select</span>
          </div>
          <div {...stylex.props(styles.footerKeyGroup)}>
            <Kbd>ESC</Kbd>
            <span>Close</span>
          </div>
        </>
      )}
    </div>
  )
})
