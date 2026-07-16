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
      style,
      className,
      children,
    },
    ref,
  ) {
    const [localCollapsed, setLocalCollapsed] = React.useState(defaultCollapsed)
    const isCollapsed =
      controlledCollapsed !== undefined ? controlledCollapsed : localCollapsed

    const [localSelectedKey, setLocalSelectedKey] = React.useState(
      defaultSelectedKey,
    )
    const selectedKey =
      controlledSelectedKey !== undefined
        ? controlledSelectedKey
        : localSelectedKey

    const handleCollapseToggle = () => {
      const nextCollapsed = !isCollapsed
      if (onCollapseChange) {
        onCollapseChange(nextCollapsed)
      } else {
        setLocalCollapsed(nextCollapsed)
      }
    }

    const handleSelection = (key: string) => {
      if (onSelectionChange) {
        onSelectionChange(key)
      } else {
        setLocalSelectedKey(key)
      }
    }

    const contextValue = React.useMemo(
      () => ({
        isCollapsed,
        selectedKey,
        onSelectionChange: handleSelection,
        variant,
        onCollapseToggle: handleCollapseToggle,
      }),
      [isCollapsed, selectedKey, onSelectionChange, variant],
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={[
            stylex.props(styles.layout).className,
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          style={{
            ...stylex.props(styles.layout).style,
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

  return (
    <div
      ref={ref}
      className={[
        stylex.props(
          styles.header,
          isCollapsed && styles.headerCollapsed,
          style,
        ).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        stylex.props(
          styles.header,
          isCollapsed && styles.headerCollapsed,
          style,
        ).style
      }
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

    return (
      <div
        ref={ref}
        className={[
          stylex.props(styles.group, isCollapsed && styles.groupCollapsed, style)
            .className,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        style={
          stylex.props(styles.group, isCollapsed && styles.groupCollapsed, style)
            .style
        }
      >
        {title && !isCollapsed && (
          <div
            role={collapsible ? 'button' : undefined}
            tabIndex={collapsible ? 0 : undefined}
            onClick={handleToggleExpand}
            onKeyDown={(e) => {
              if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                handleToggleExpand()
              }
            }}
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
  { id, href, icon, isSelected: controlledSelected, style, className, children, ...rest },
  ref,
) {
  const { isCollapsed, selectedKey, onSelectionChange } = useSidebar()

  const isSelected =
    controlledSelected !== undefined
      ? controlledSelected
      : id !== undefined && selectedKey === id

  const handlePress = () => {
    if (id !== undefined && onSelectionChange) {
      onSelectionChange(id)
    }
  }

  const renderContent = (
    <AriaLink
      {...rest}
      href={href}
      ref={ref}
      onPress={handlePress}
      className={() => {
        const { className: stylexClass } = stylex.props(
          styles.item,
          styles.itemHover,
          isSelected && styles.itemSelected,
          isCollapsed && styles.itemCollapsed,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={() => {
        const { style: stylexStyle } = stylex.props(
          styles.item,
          styles.itemHover,
          isSelected && styles.itemSelected,
          isCollapsed && styles.itemCollapsed,
          style,
        )
        return stylexStyle ?? {}
      }}
    >
      {icon && (
        <span
          {...stylex.props(styles.itemIcon, isSelected && styles.itemIconSelected)}
        >
          {icon}
        </span>
      )}
      <span
        {...stylex.props(styles.itemLabel, isCollapsed && styles.itemLabelCollapsed)}
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
>(function SidebarFooter({ showBorder = true, style, className, children }, ref) {
  const { isCollapsed } = useSidebar()

  return (
    <div
      ref={ref}
      className={[
        stylex.props(
          styles.footer,
          showBorder && styles.footerBorder,
          isCollapsed && styles.footerCollapsed,
          style,
        ).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        stylex.props(
          styles.footer,
          showBorder && styles.footerBorder,
          isCollapsed && styles.footerCollapsed,
          style,
        ).style
      }
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

  return (
    <div
      ref={ref}
      {...stylex.props(
        styles.divider,
        isCollapsed && styles.dividerCollapsed,
        style,
      )}
      className={[
        stylex.props(
          styles.divider,
          isCollapsed && styles.dividerCollapsed,
          style,
        ).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
})

// ── SidebarLayout Component ──────────────────────────────────────────

// ── SidebarAside Component ───────────────────────────────────────────

export interface SidebarAsideProps {
  style?: React.CSSProperties
  className?: string
  children?: React.ReactNode
  showCollapseToggle?: boolean
}

export const SidebarAside = React.forwardRef<
  HTMLDivElement,
  SidebarAsideProps
>(function SidebarAside(
  { style, className, children, showCollapseToggle = true },
  ref,
) {
  const { isCollapsed, variant, onCollapseToggle } = useSidebar()

  return (
    <div
      ref={ref}
      className={[
        stylex.props(
          styles.sidebar,
          styles[variant],
          isCollapsed ? styles.collapsed : styles.expanded,
        ).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...stylex.props(
          styles.sidebar,
          styles[variant],
          isCollapsed ? styles.collapsed : styles.expanded,
        ).style,
        ...style,
      }}
    >
      {children}
      {showCollapseToggle && (
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
    </div>
  )
})

// ── SidebarMain Component ────────────────────────────────────────────

export interface SidebarMainProps {
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarMain = React.forwardRef<
  HTMLDivElement,
  SidebarMainProps
>(function SidebarMain({ style, className, children }, ref) {
  return (
    <div
      ref={ref}
      className={[
        stylex.props(styles.mainContent, style).className,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        ...stylex.props(styles.mainContent, style).style,
      }}
    >
      {children}
    </div>
  )
})
