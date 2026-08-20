'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components'
import { Tooltip, TooltipTrigger } from '../Tooltip'
import { styles } from './Sidebar.styles'

// ── Sidebar Context ───────────────────────────────────────────────────

interface SidebarContextValue {
  isCollapsed: boolean
  selectedKey?: string
  onSelectionChange?: (key: string) => void
  variant: 'solid' | 'glass'
  onCollapseToggle: () => void
  showCollapseToggle?: boolean
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(
  undefined,
)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('Sidebar components must be rendered within a <Sidebar>')
  }
  return context
}

// ── Icons ────────────────────────────────────────────────────────────

const ChevronLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="12"
    height="12"
    stroke="currentColor"
    strokeWidth="2.5"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

// ── Sidebar Component ────────────────────────────────────────────────

export interface SidebarProps {
  isCollapsed?: boolean
  defaultCollapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  selectedKey?: string
  defaultSelectedKey?: string
  onSelectionChange?: (key: string) => void
  variant?: 'solid' | 'glass'
  showCollapseToggle?: boolean
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  function Sidebar(
    {
      isCollapsed: controlledCollapsed,
      defaultCollapsed = false,
      onCollapseChange,
      selectedKey: controlledSelectedKey,
      defaultSelectedKey,
      onSelectionChange,
      variant = 'solid',
      showCollapseToggle,
      style,
      className,
      children,
    },
    ref,
  ) {
    const [localCollapsed, setLocalCollapsed] = React.useState(defaultCollapsed)
    const isCollapsed =
      controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed

    const [localSelectedKey, setLocalSelectedKey] =
      React.useState(defaultSelectedKey)
    const selectedKey =
      controlledSelectedKey !== undefined
        ? controlledSelectedKey
        : localSelectedKey

    const handleCollapseToggle = React.useCallback(() => {
      if (onCollapseChange) {
        onCollapseChange(!isCollapsed)
      } else {
        setLocalCollapsed((prev) => !prev)
      }
    }, [isCollapsed, onCollapseChange])

    const handleSelection = React.useCallback(
      (key: string) => {
        if (onSelectionChange) {
          onSelectionChange(key)
        } else {
          setLocalSelectedKey(key)
        }
      },
      [onSelectionChange],
    )

    const contextValue = React.useMemo(
      () => ({
        isCollapsed,
        selectedKey,
        onSelectionChange: handleSelection,
        variant,
        onCollapseToggle: handleCollapseToggle,
        showCollapseToggle,
      }),
      [
        isCollapsed,
        selectedKey,
        handleSelection,
        variant,
        handleCollapseToggle,
        showCollapseToggle,
      ],
    )

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.layout,
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={[stylexClass, className].filter(Boolean).join(' ')}
          style={{
            ...stylexStyle,
            ...style,
          }}
        >
          {children}
        </div>
      </SidebarContext.Provider>
    )
  },
)

// ── SidebarHeader Component ──────────────────────────────────────────

export interface SidebarHeaderProps {
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  SidebarHeaderProps
>(function SidebarHeader({ style, className, children }, ref) {
  const { isCollapsed } = useSidebar()
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.header,
    isCollapsed && styles.headerCollapsed,
    style,
  )

  return (
    <div
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      <div
        {...stylex.props(
          styles.headerContent,
          isCollapsed && styles.headerContentCollapsed,
        )}
      >
        {children}
      </div>
    </div>
  )
})

// ── SidebarGroup Component ───────────────────────────────────────────

export interface SidebarGroupProps {
  title?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  isExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarGroup = React.forwardRef<HTMLDivElement, SidebarGroupProps>(
  function SidebarGroup(
    {
      title,
      collapsible = true,
      defaultExpanded = true,
      isExpanded: controlledExpanded,
      onExpandedChange,
      style,
      className,
      children,
    },
    ref,
  ) {
    const { isCollapsed } = useSidebar()
    const [localExpanded, setLocalExpanded] = React.useState(defaultExpanded)
    const isGroupExpanded =
      controlledExpanded !== undefined ? controlledExpanded : localExpanded

    const handleToggleExpand = () => {
      if (!collapsible || isCollapsed) return
      const nextExpanded = !isGroupExpanded
      if (onExpandedChange) {
        onExpandedChange(nextExpanded)
      } else {
        setLocalExpanded(nextExpanded)
      }
    }

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.group,
      isCollapsed && styles.groupCollapsed,
      style,
    )

    return (
      <div
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {title && !isCollapsed && (
          <div
            {...(collapsible
              ? {
                  role: 'button' as const,
                  'aria-expanded': isGroupExpanded,
                  tabIndex: 0,
                  onClick: handleToggleExpand,
                  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                    if (
                      e.key === 'Enter' ||
                      e.key === ' ' ||
                      e.key === 'Spacebar'
                    ) {
                      e.preventDefault()
                      handleToggleExpand()
                    }
                  },
                }
              : {})}
            {...stylex.props(
              styles.groupHeader,
              collapsible && styles.groupHeaderCollapsible,
            )}
          >
            <span {...stylex.props(styles.groupTitle)}>{title}</span>
            {collapsible && (
              <ChevronDownIcon
                className={
                  stylex.props(
                    styles.groupChevron,
                    isGroupExpanded && styles.groupChevronExpanded,
                  ).className
                }
              />
            )}
          </div>
        )}

        <div
          {...stylex.props(
            styles.groupItems,
            isGroupExpanded || isCollapsed
              ? styles.groupItemsExpanded
              : styles.groupItemsCollapsed,
          )}
        >
          <div {...stylex.props(styles.groupItemsInner)}>{children}</div>
        </div>
      </div>
    )
  },
)

// ── SidebarItem Component ────────────────────────────────────────────

export interface SidebarItemProps
  extends Omit<AriaLinkProps, 'style' | 'className' | 'children'> {
  id?: string
  icon?: React.ReactNode
  isSelected?: boolean
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarItem = React.forwardRef<
  HTMLAnchorElement,
  SidebarItemProps
>(function SidebarItem(
  {
    id,
    href,
    icon,
    isSelected: controlledSelected,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const { isCollapsed, selectedKey, onSelectionChange } = useSidebar()

  const isSelected =
    controlledSelected !== undefined
      ? controlledSelected
      : typeof id === 'string' &&
        id.length > 0 &&
        selectedKey !== undefined &&
        selectedKey === id

  const handlePress = () => {
    if (typeof id === 'string' && id.length > 0 && onSelectionChange) {
      onSelectionChange(id)
    }
  }

  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.item,
    styles.itemHover,
    isSelected && styles.itemSelected,
    isCollapsed && styles.itemCollapsed,
    style,
  )

  const renderContent = (
    <AriaLink
      {...rest}
      href={href}
      ref={ref}
      onPress={handlePress}
      aria-current={isSelected ? 'page' : undefined}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle ?? {}}
    >
      {icon && (
        <span
          {...stylex.props(
            styles.itemIcon,
            isSelected && styles.itemIconSelected,
          )}
        >
          {icon}
        </span>
      )}
      <span
        {...stylex.props(
          styles.itemLabel,
          isCollapsed && styles.itemLabelCollapsed,
        )}
      >
        {children}
      </span>
    </AriaLink>
  )

  if (isCollapsed && children) {
    return (
      <TooltipTrigger delay={200}>
        {renderContent}
        <Tooltip placement="right" offset={12}>
          {children}
        </Tooltip>
      </TooltipTrigger>
    )
  }

  return renderContent
})

// ── SidebarFooter Component ──────────────────────────────────────────

export interface SidebarFooterProps {
  showBorder?: boolean
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  SidebarFooterProps
>(function SidebarFooter(
  { showBorder = true, style, className, children },
  ref,
) {
  const { isCollapsed } = useSidebar()
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.footer,
    showBorder && styles.footerBorder,
    isCollapsed && styles.footerCollapsed,
    style,
  )

  return (
    <div
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      <div
        {...stylex.props(
          styles.footerContent,
          isCollapsed && styles.footerContentCollapsed,
        )}
      >
        {children}
      </div>
    </div>
  )
})

// ── SidebarDivider Component ─────────────────────────────────────────

export interface SidebarDividerProps {
  style?: StyleXStyles
  className?: string
}

export const SidebarDivider = React.forwardRef<
  HTMLDivElement,
  SidebarDividerProps
>(function SidebarDivider({ style, className }, ref) {
  const { isCollapsed } = useSidebar()
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.divider,
    isCollapsed && styles.dividerCollapsed,
    style,
  )

  return (
    <div
      ref={ref}
      role="separator"
      aria-orientation="horizontal"
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    />
  )
})

// ── SidebarAside Component ───────────────────────────────────────────

export interface SidebarAsideProps {
  'aria-label'?: string
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
  showCollapseToggle?: boolean
}

export const SidebarAside = React.forwardRef<HTMLElement, SidebarAsideProps>(
  function SidebarAside(
    {
      'aria-label': ariaLabel = 'Sidebar',
      style,
      className,
      children,
      showCollapseToggle: propShowCollapseToggle,
    },
    ref,
  ) {
    const {
      isCollapsed,
      variant,
      onCollapseToggle,
      showCollapseToggle: contextShowToggle,
    } = useSidebar()
    const shouldShowToggle =
      propShowCollapseToggle !== undefined
        ? propShowCollapseToggle
        : (contextShowToggle ?? true)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.sidebar,
      styles[variant],
      isCollapsed ? styles.collapsed : styles.expanded,
    )

    return (
      <aside
        ref={ref}
        aria-label={ariaLabel}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={{
          ...stylexStyle,
          ...style,
        }}
      >
        {children}
        {shouldShowToggle && (
          <button
            type="button"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            {...stylex.props(
              styles.toggleButton,
              isCollapsed && styles.toggleButtonCollapsed,
            )}
            onClick={onCollapseToggle}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        )}
      </aside>
    )
  },
)

// ── SidebarMain Component ────────────────────────────────────────────

export interface SidebarMainProps {
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarMain = React.forwardRef<HTMLDivElement, SidebarMainProps>(
  function SidebarMain({ style, className, children }, ref) {
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.mainContent,
      style,
    )

    return (
      <div
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)
