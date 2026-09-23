'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import { AnimatePresence, motion } from 'motion/react'
import * as React from 'react'
import {
  Link as AriaLink,
  type LinkProps as AriaLinkProps,
} from 'react-aria-components'
import {
  Drawer,
  DrawerBody,
  DrawerDialog,
  DrawerHandle,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
} from '../Drawer'
import { Tooltip, TooltipTrigger } from '../Tooltip'
import { styles } from './Sidebar.styles'

export type SidebarLayout =
  | 'sidebar-framed'
  | 'main-framed'
  | 'default'
  | 'inset'

// ── Sidebar Context ───────────────────────────────────────────────────

interface SidebarContextValue {
  isCollapsed: boolean
  selectedKey?: string
  onSelectionChange?: (key: string) => void
  variant: 'solid' | 'glass'
  layout: 'sidebar-framed' | 'main-framed'
  onCollapseToggle: () => void
  showCollapseToggle?: boolean
  dense?: boolean
  enableMobileNav: boolean
  mobileNavScaleOnScroll: boolean
  maxMobileItems: number
  isScrolledDown: boolean
  setIsScrolledDown: React.Dispatch<React.SetStateAction<boolean>>
  isMoreOpen: boolean
  setIsMoreOpen: React.Dispatch<React.SetStateAction<boolean>>
  hasMobileHeader: boolean
  setHasMobileHeader: React.Dispatch<React.SetStateAction<boolean>>
  registerScrollContainer?: (node: HTMLElement | null) => void
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

const MoreHorizontalIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" />
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
  layout?: SidebarLayout
  showCollapseToggle?: boolean
  dense?: boolean
  enableMobileNav?: boolean
  mobileNavScaleOnScroll?: boolean
  maxMobileItems?: number
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
      layout = 'sidebar-framed',
      showCollapseToggle,
      dense = false,
      enableMobileNav = true,
      mobileNavScaleOnScroll = true,
      maxMobileItems = 4,
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

    const [isScrolledDown, setIsScrolledDown] = React.useState(false)
    const [isMoreOpen, setIsMoreOpen] = React.useState(false)
    const [hasMobileHeader, setHasMobileHeader] = React.useState(true)
    const scrollContainerRef = React.useRef<HTMLElement | null>(null)
    const lastScrollYRef = React.useRef(0)

    const registerScrollContainer = React.useCallback(
      (node: HTMLElement | null) => {
        scrollContainerRef.current = node
      },
      [],
    )

    React.useEffect(() => {
      if (!enableMobileNav || !mobileNavScaleOnScroll) return

      const handleScroll = (scrollTop: number) => {
        if (typeof window !== 'undefined' && window.innerWidth > 768) return
        const lastY = lastScrollYRef.current
        const delta = scrollTop - lastY
        if (scrollTop <= 15) {
          setIsScrolledDown(false)
        } else if (delta > 8) {
          setIsScrolledDown(true)
        } else if (delta < -6) {
          setIsScrolledDown(false)
        }
        lastScrollYRef.current = scrollTop
      }

      const onContainerScroll = (e: Event) => {
        const target = e.currentTarget as HTMLElement
        handleScroll(target.scrollTop)
      }

      const onWindowScroll = () => {
        handleScroll(window.scrollY || document.documentElement.scrollTop)
      }

      const container = scrollContainerRef.current
      if (container) {
        container.addEventListener('scroll', onContainerScroll, {
          passive: true,
        })
      }
      window.addEventListener('scroll', onWindowScroll, { passive: true })

      let touchStartY = 0
      const onTouchStart = (e: TouchEvent) => {
        touchStartY = e.touches[0]?.clientY ?? 0
      }
      const onTouchMove = (e: TouchEvent) => {
        if (typeof window !== 'undefined' && window.innerWidth > 768) return
        const currentY = e.touches[0]?.clientY ?? 0
        const delta = touchStartY - currentY
        if (delta > 15) {
          setIsScrolledDown(true)
        } else if (delta < -15) {
          setIsScrolledDown(false)
        }
      }

      window.addEventListener('touchstart', onTouchStart, { passive: true })
      window.addEventListener('touchmove', onTouchMove, { passive: true })

      return () => {
        if (container) {
          container.removeEventListener('scroll', onContainerScroll)
        }
        window.removeEventListener('scroll', onWindowScroll)
        window.removeEventListener('touchstart', onTouchStart)
        window.removeEventListener('touchmove', onTouchMove)
      }
    }, [enableMobileNav, mobileNavScaleOnScroll])

    const handleCollapseToggle = React.useCallback(() => {
      if (onCollapseChange) {
        onCollapseChange(!isCollapsed)
      } else {
        setLocalCollapsed((prev) => !prev)
      }
    }, [isCollapsed, onCollapseChange])

    const handleSelection = React.useCallback(
      (key: string) => {
        setIsMoreOpen(false)
        if (onSelectionChange) {
          onSelectionChange(key)
        } else {
          setLocalSelectedKey(key)
        }
      },
      [onSelectionChange],
    )

    const normalizedLayout: 'sidebar-framed' | 'main-framed' =
      layout === 'main-framed' || layout === 'inset'
        ? 'main-framed'
        : 'sidebar-framed'

    const contextValue = React.useMemo(
      () => ({
        isCollapsed,
        selectedKey,
        onSelectionChange: handleSelection,
        variant,
        layout: normalizedLayout,
        onCollapseToggle: handleCollapseToggle,
        showCollapseToggle,
        dense,
        enableMobileNav,
        mobileNavScaleOnScroll,
        maxMobileItems,
        isScrolledDown,
        setIsScrolledDown,
        isMoreOpen,
        setIsMoreOpen,
        hasMobileHeader,
        setHasMobileHeader,
        registerScrollContainer,
      }),
      [
        isCollapsed,
        selectedKey,
        handleSelection,
        variant,
        normalizedLayout,
        handleCollapseToggle,
        showCollapseToggle,
        dense,
        enableMobileNav,
        mobileNavScaleOnScroll,
        maxMobileItems,
        isScrolledDown,
        isMoreOpen,
        hasMobileHeader,
        registerScrollContainer,
      ],
    )

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.layout,
      !enableMobileNav && styles.layoutStatic,
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
  dense?: boolean
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  SidebarHeaderProps
>(function SidebarHeader(
  { dense: propDense, style, className, children },
  ref,
) {
  const { isCollapsed, dense: contextDense } = useSidebar()
  const isDense = propDense !== undefined ? propDense : (contextDense ?? false)
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.header,
    isDense && styles.headerDense,
    isCollapsed && styles.headerCollapsed,
    style,
  )

  const renderedChildren = React.useMemo(() => {
    if (!isCollapsed) return children
    const childArray = React.Children.toArray(children)
    if (childArray.length <= 1) return children
    return childArray[0]
  }, [children, isCollapsed])

  return (
    <div
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      <div
        {...stylex.props(
          styles.headerContent,
          isDense && styles.headerContentDense,
          isCollapsed && styles.headerContentCollapsed,
        )}
      >
        {renderedChildren}
      </div>
    </div>
  )
})

// ── SidebarBrand Component ───────────────────────────────────────────

export interface SidebarBrandProps {
  logo?: React.ReactNode
  title?: React.ReactNode
  subtitle?: React.ReactNode
  dense?: boolean
  style?: StyleXStyles
  className?: string
  onClick?: () => void
  onPress?: () => void
  children?: React.ReactNode
}

export const SidebarBrand = React.forwardRef<HTMLDivElement, SidebarBrandProps>(
  function SidebarBrand(
    {
      logo,
      title,
      subtitle,
      dense: propDense,
      style,
      className,
      onClick,
      onPress,
      children,
    },
    ref,
  ) {
    const { isCollapsed, dense: contextDense } = useSidebar()
    const isDense =
      propDense !== undefined ? propDense : (contextDense ?? false)
    const isInteractive = Boolean(onClick || onPress)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.brand,
      isInteractive && styles.brandInteractive,
      isDense && styles.brandDense,
      isCollapsed && styles.brandCollapsed,
      style,
    )

    const handlePress = () => {
      onPress?.()
      onClick?.()
    }

    const renderContent = (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? handlePress : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePress()
                }
              }
            : undefined
        }
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {logo && <div {...stylex.props(styles.brandLogoWrapper)}>{logo}</div>}
        {!isCollapsed &&
          (title || subtitle ? (
            <div {...stylex.props(styles.brandInfo)}>
              {title && (
                <span {...stylex.props(styles.brandTitle)}>{title}</span>
              )}
              {subtitle && (
                <span {...stylex.props(styles.brandSubtitle)}>{subtitle}</span>
              )}
            </div>
          ) : (
            children
          ))}
      </div>
    )

    const tooltipLabel =
      typeof title === 'string'
        ? title
        : typeof subtitle === 'string'
          ? subtitle
          : undefined

    if (isCollapsed && tooltipLabel) {
      return (
        <TooltipTrigger delay={200}>
          {renderContent}
          <Tooltip placement="right" offset={12}>
            {tooltipLabel}
          </Tooltip>
        </TooltipTrigger>
      )
    }

    return renderContent
  },
)

// ── SidebarGroup Component ───────────────────────────────────────────

export interface SidebarGroupProps {
  title?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  isExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  dense?: boolean
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
      dense: propDense,
      style,
      className,
      children,
    },
    ref,
  ) {
    const sidebarContext = useSidebar()
    const { isCollapsed, dense: contextDense } = sidebarContext
    const isDense =
      propDense !== undefined ? propDense : (contextDense ?? false)

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

    const groupContextValue = React.useMemo(() => {
      if (propDense === undefined) return sidebarContext
      return {
        ...sidebarContext,
        dense: isDense,
      }
    }, [sidebarContext, propDense, isDense])

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.group,
      isDense && styles.groupDense,
      isCollapsed && styles.groupCollapsed,
      style,
    )

    const groupContent = (
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
              isDense && styles.groupHeaderDense,
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
          <div
            {...stylex.props(
              styles.groupItemsInner,
              isDense && styles.groupItemsInnerDense,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    )

    if (propDense !== undefined) {
      return (
        <SidebarContext.Provider value={groupContextValue}>
          {groupContent}
        </SidebarContext.Provider>
      )
    }

    return groupContent
  },
)

// ── SidebarItem Component ────────────────────────────────────────────

export interface SidebarItemProps
  extends Omit<AriaLinkProps, 'style' | 'className' | 'children'> {
  id?: string
  icon?: React.ReactNode
  isSelected?: boolean
  dense?: boolean
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
    dense: propDense,
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  const {
    isCollapsed,
    selectedKey,
    onSelectionChange,
    dense: contextDense,
  } = useSidebar()
  const isDense = propDense !== undefined ? propDense : (contextDense ?? false)

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
    isDense && styles.itemDense,
    styles.itemHover,
    isSelected && styles.itemSelected,
    isCollapsed && styles.itemCollapsed,
    isCollapsed && isDense && styles.itemCollapsedDense,
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
  dense?: boolean
  style?: StyleXStyles
  className?: string
  children?: React.ReactNode
}

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  SidebarFooterProps
>(function SidebarFooter(
  { showBorder = true, dense: propDense, style, className, children },
  ref,
) {
  const { isCollapsed, dense: contextDense } = useSidebar()
  const isDense = propDense !== undefined ? propDense : (contextDense ?? false)
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.footer,
    isDense && styles.footerDense,
    showBorder && styles.footerBorder,
    isCollapsed && styles.footerCollapsed,
    style,
  )

  const renderedChildren = React.useMemo(() => {
    if (!isCollapsed) return children
    const childArray = React.Children.toArray(children)
    if (childArray.length <= 1) return children
    return childArray[0]
  }, [children, isCollapsed])

  return (
    <div
      ref={ref}
      className={[stylexClass, className].filter(Boolean).join(' ')}
      style={stylexStyle}
    >
      <div
        {...stylex.props(
          styles.footerContent,
          isDense && styles.footerContentDense,
          isCollapsed && styles.footerContentCollapsed,
        )}
      >
        {renderedChildren}
      </div>
    </div>
  )
})

// ── SidebarUser Component ────────────────────────────────────────────

export interface SidebarUserProps {
  avatar?: React.ReactNode
  name?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  dense?: boolean
  style?: StyleXStyles
  className?: string
  onClick?: () => void
  onPress?: () => void
  children?: React.ReactNode
}

export const SidebarUser = React.forwardRef<HTMLDivElement, SidebarUserProps>(
  function SidebarUser(
    {
      avatar,
      name,
      description,
      action,
      dense: propDense,
      style,
      className,
      onClick,
      onPress,
      children,
    },
    ref,
  ) {
    const { isCollapsed, dense: contextDense } = useSidebar()
    const isDense =
      propDense !== undefined ? propDense : (contextDense ?? false)
    const isInteractive = Boolean(onClick || onPress)

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.user,
      isInteractive && styles.userInteractive,
      isDense && styles.userDense,
      isCollapsed && styles.userCollapsed,
      style,
    )

    const handlePress = () => {
      onPress?.()
      onClick?.()
    }

    const tooltipLabel = name
      ? description
        ? `${typeof name === 'string' ? name : ''}${typeof description === 'string' ? ` • ${description}` : ''}`
        : name
      : typeof description === 'string'
        ? description
        : undefined

    const renderContent = (
      <div
        ref={ref}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? handlePress : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePress()
                }
              }
            : undefined
        }
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {avatar && (
          <div {...stylex.props(styles.userAvatarWrapper)}>{avatar}</div>
        )}
        {!isCollapsed && (
          <>
            {name || description ? (
              <div {...stylex.props(styles.userInfo)}>
                {name && <span {...stylex.props(styles.userName)}>{name}</span>}
                {description && (
                  <span {...stylex.props(styles.userDescription)}>
                    {description}
                  </span>
                )}
              </div>
            ) : (
              children
            )}
            {action && <div {...stylex.props(styles.userAction)}>{action}</div>}
          </>
        )}
      </div>
    )

    if (isCollapsed && tooltipLabel) {
      return (
        <TooltipTrigger delay={200}>
          {renderContent}
          <Tooltip placement="right" offset={12}>
            {tooltipLabel}
          </Tooltip>
        </TooltipTrigger>
      )
    }

    return renderContent
  },
)

// ── SidebarDivider Component ─────────────────────────────────────────

export interface SidebarDividerProps {
  dense?: boolean
  style?: StyleXStyles
  className?: string
}

export const SidebarDivider = React.forwardRef<
  HTMLDivElement,
  SidebarDividerProps
>(function SidebarDivider({ dense: propDense, style, className }, ref) {
  const { isCollapsed, dense: contextDense } = useSidebar()
  const isDense = propDense !== undefined ? propDense : (contextDense ?? false)
  const { className: stylexClass, style: stylexStyle } = stylex.props(
    styles.divider,
    isDense && styles.dividerDense,
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

// ── Sidebar Extraction Helpers ────────────────────────────────────────

interface ExtractedItem {
  id?: string
  icon?: React.ReactNode
  label?: React.ReactNode
  href?: string
  onPress?: AriaLinkProps['onPress']
  element: React.ReactElement
}

interface ExtractedGroup {
  title?: string
  items: ExtractedItem[]
  element: React.ReactElement
}

function getDisplayName(element: unknown): string {
  if (!React.isValidElement(element)) return ''
  const type = element.type as { displayName?: string; name?: string }
  return type.displayName || type.name || ''
}

function extractSidebarElements(children: React.ReactNode) {
  const headerElements: React.ReactNode[] = []
  const footerElements: React.ReactNode[] = []
  const extractedGroups: ExtractedGroup[] = []
  const standaloneItems: ExtractedItem[] = []
  const allItems: ExtractedItem[] = []

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const dName = getDisplayName(child)

    if (child.type === SidebarHeader || dName === 'SidebarHeader') {
      headerElements.push(child)
    } else if (child.type === SidebarFooter || dName === 'SidebarFooter') {
      footerElements.push(child)
    } else if (child.type === SidebarGroup || dName === 'SidebarGroup') {
      const groupItems: ExtractedItem[] = []
      const groupProps = child.props as SidebarGroupProps
      React.Children.forEach(groupProps.children, (groupChild) => {
        if (!React.isValidElement(groupChild)) return
        const itemDName = getDisplayName(groupChild)
        if (groupChild.type === SidebarItem || itemDName === 'SidebarItem') {
          const itemProps = groupChild.props as SidebarItemProps
          const item: ExtractedItem = {
            id: itemProps.id,
            icon: itemProps.icon,
            label: itemProps.children,
            href: itemProps.href,
            onPress: itemProps.onPress,
            element: groupChild,
          }
          groupItems.push(item)
          allItems.push(item)
        }
      })
      extractedGroups.push({
        title: groupProps.title,
        items: groupItems,
        element: child,
      })
    } else if (child.type === SidebarItem || dName === 'SidebarItem') {
      const itemProps = child.props as SidebarItemProps
      const item: ExtractedItem = {
        id: itemProps.id,
        icon: itemProps.icon,
        label: itemProps.children,
        href: itemProps.href,
        onPress: itemProps.onPress,
        element: child,
      }
      standaloneItems.push(item)
      allItems.push(item)
    }
  })

  return {
    headerElements,
    footerElements,
    extractedGroups,
    standaloneItems,
    allItems,
  }
}

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
    const sidebarContext = useSidebar()
    const {
      isCollapsed,
      selectedKey,
      onSelectionChange,
      variant,
      layout,
      onCollapseToggle,
      showCollapseToggle: contextShowToggle,
      enableMobileNav,
      mobileNavScaleOnScroll,
      maxMobileItems,
      isScrolledDown,
      setIsScrolledDown,
      isMoreOpen,
      setIsMoreOpen,
      setHasMobileHeader,
    } = sidebarContext

    const shouldShowToggle =
      propShowCollapseToggle !== undefined
        ? propShowCollapseToggle
        : (contextShowToggle ?? true)

    const isMainFramed = layout === 'main-framed'

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.sidebar,
      enableMobileNav && styles.sidebarResponsive,
      isMainFramed ? styles.sidebarUnframed : styles.sidebarFramed,
      !isMainFramed && styles[variant],
      isCollapsed ? styles.collapsed : styles.expanded,
    )

    const {
      headerElements,
      footerElements,
      extractedGroups,
      overflowItemsList,
      dockItems,
      hasMore,
    } = React.useMemo(() => {
      const extracted = extractSidebarElements(children)
      const dock = extracted.allItems.slice(0, maxMobileItems)
      const overflow = extracted.allItems.slice(maxMobileItems)
      const more =
        overflow.length > 0 ||
        extracted.footerElements.length > 0 ||
        extracted.extractedGroups.length > 1
      return {
        ...extracted,
        dockItems: dock,
        overflowItemsList: overflow,
        hasMore: more,
      }
    }, [children, maxMobileItems])

    React.useEffect(() => {
      setHasMobileHeader?.(headerElements.length > 0)
    }, [headerElements.length, setHasMobileHeader])

    const desktopAside = (
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
        {shouldShowToggle &&
          (isCollapsed ? (
            <TooltipTrigger delay={200}>
              <button
                type="button"
                aria-label="Expand sidebar"
                {...stylex.props(
                  styles.toggleButton,
                  styles.toggleButtonCollapsed,
                )}
                onClick={onCollapseToggle}
              >
                <ChevronRightIcon />
              </button>
              <Tooltip placement="right" offset={12}>
                Expand sidebar
              </Tooltip>
            </TooltipTrigger>
          ) : (
            <button
              type="button"
              aria-label="Collapse sidebar"
              {...stylex.props(styles.toggleButton)}
              onClick={onCollapseToggle}
            >
              <ChevronLeftIcon />
            </button>
          ))}
      </aside>
    )

    if (!enableMobileNav) {
      return desktopAside
    }

    return (
      <>
        {desktopAside}
        {headerElements.length > 0 && (
          <SidebarContext.Provider
            value={{ ...sidebarContext, isCollapsed: false }}
          >
            <motion.header
              initial={false}
              animate={{
                y: isScrolledDown && mobileNavScaleOnScroll ? '-100%' : '0%',
                opacity: isScrolledDown && mobileNavScaleOnScroll ? 0 : 1,
              }}
              transition={{
                ease: [0.32, 0.72, 0, 1],
                duration: 0.28,
              }}
              style={{
                pointerEvents:
                  isScrolledDown && mobileNavScaleOnScroll ? 'none' : 'auto',
              }}
              {...stylex.props(styles.mobileTopBar)}
            >
              <div {...stylex.props(styles.mobileTopBarContent)}>
                {headerElements}
              </div>
            </motion.header>
          </SidebarContext.Provider>
        )}

        {dockItems.length > 0 && (
          <div {...stylex.props(styles.mobileBottomNavContainer)}>
            <motion.nav
              initial={false}
              aria-label="Mobile Bottom Navigation"
              animate={{
                scale: isScrolledDown && mobileNavScaleOnScroll ? 0.9 : 1,
                opacity: isScrolledDown && mobileNavScaleOnScroll ? 0.85 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
              {...stylex.props(styles.mobileBottomNav)}
            >
              {dockItems.map((item, idx) => {
                const isSelected =
                  typeof item.id === 'string' && item.id.length > 0
                    ? selectedKey === item.id
                    : false

                const Component = item.href ? motion.a : motion.button

                return (
                  <Component
                    key={item.id ?? idx}
                    href={item.href}
                    type={item.href ? undefined : 'button'}
                    aria-current={isSelected ? 'page' : undefined}
                    whileTap={{ scale: 0.92 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={(e) => {
                      setIsScrolledDown(false)
                      ;(item.onPress as any)?.(e)
                      if (item.id) {
                        onSelectionChange?.(item.id)
                      }
                    }}
                    {...stylex.props(
                      styles.mobileNavItem,
                      isSelected && styles.mobileNavItemActive,
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="sidebar-mobile-active-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 500,
                          damping: 35,
                        }}
                        {...stylex.props(styles.mobileNavActivePill)}
                      />
                    )}
                    {item.icon && (
                      <span {...stylex.props(styles.mobileNavIcon)}>
                        {item.icon}
                      </span>
                    )}
                    <AnimatePresence>
                      {(!isScrolledDown || !mobileNavScaleOnScroll) &&
                        item.label && (
                          <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            {...stylex.props(styles.mobileNavLabel)}
                          >
                            {item.label}
                          </motion.span>
                        )}
                    </AnimatePresence>
                  </Component>
                )
              })}

              {hasMore && (
                <motion.button
                  type="button"
                  aria-label="More navigation options"
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ scale: 1.04 }}
                  onClick={() => {
                    setIsScrolledDown(false)
                    setIsMoreOpen(true)
                  }}
                  {...stylex.props(styles.mobileNavMoreButton)}
                >
                  <span {...stylex.props(styles.mobileNavIcon)}>
                    <MoreHorizontalIcon />
                  </span>
                  <AnimatePresence>
                    {(!isScrolledDown || !mobileNavScaleOnScroll) && (
                      <motion.span
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        {...stylex.props(styles.mobileNavLabel)}
                      >
                        More
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
            </motion.nav>
          </div>
        )}

        {hasMore && isMoreOpen && (
          <DrawerOverlay
            isOpen={isMoreOpen}
            onOpenChange={setIsMoreOpen}
            placement="bottom"
            style={styles.mobileDrawerOverlay}
          >
            <Drawer placement="bottom" style={styles.mobileDrawerModal}>
              <DrawerDialog style={styles.mobileDrawerDialog}>
                <DrawerHeader style={styles.mobileDrawerHeader}>
                  <DrawerHandle />
                  <div {...stylex.props(styles.mobileDrawerHeaderRow)}>
                    <DrawerTitle style={styles.mobileDrawerTitle}>
                      Navigation
                    </DrawerTitle>
                  </div>
                </DrawerHeader>
                <DrawerBody style={styles.mobileDrawerBody}>
                  <SidebarContext.Provider
                    value={{ ...sidebarContext, isCollapsed: false }}
                  >
                    <div {...stylex.props(styles.mobileDrawerContent)}>
                      {extractedGroups.length > 0
                        ? extractedGroups.map((group, gIdx) => (
                            <div
                              key={group.title ?? gIdx}
                              {...stylex.props(styles.mobileDrawerGroup)}
                            >
                              {group.title && (
                                <div
                                  {...stylex.props(
                                    styles.mobileDrawerGroupTitle,
                                  )}
                                >
                                  {group.title}
                                </div>
                              )}
                              {group.items.map((it, itIdx) => (
                                <div
                                  key={it.id ?? itIdx}
                                  onClick={() => {
                                    if (it.id) onSelectionChange?.(it.id)
                                    setIsMoreOpen(false)
                                  }}
                                >
                                  {it.element}
                                </div>
                              ))}
                            </div>
                          ))
                        : overflowItemsList.map((it, itIdx) => (
                            <div
                              key={it.id ?? itIdx}
                              onClick={() => {
                                if (it.id) onSelectionChange?.(it.id)
                                setIsMoreOpen(false)
                              }}
                            >
                              {it.element}
                            </div>
                          ))}

                      {footerElements.length > 0 && (
                        <div {...stylex.props(styles.mobileDrawerFooter)}>
                          {footerElements}
                        </div>
                      )}
                    </div>
                  </SidebarContext.Provider>
                </DrawerBody>
              </DrawerDialog>
            </Drawer>
          </DrawerOverlay>
        )}
      </>
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
    const {
      layout,
      variant,
      enableMobileNav,
      hasMobileHeader,
      registerScrollContainer,
    } = useSidebar()
    const isMainFramed = layout === 'main-framed'
    const innerRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      registerScrollContainer?.(innerRef.current)
      return () => registerScrollContainer?.(null)
    }, [registerScrollContainer])

    const setMergedRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') {
          ref(node)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }
      },
      [ref],
    )

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.mainContent,
      isMainFramed ? styles.mainFramed : styles.mainUnframed,
      isMainFramed &&
        (variant === 'glass' ? styles.mainGlass : styles.mainSolid),
      style,
      enableMobileNav && styles.mainContentMobileNav,
      enableMobileNav && hasMobileHeader && styles.mainContentMobileWithHeader,
    )

    return (
      <div
        ref={setMergedRef}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {children}
      </div>
    )
  },
)

Sidebar.displayName = 'Sidebar'
SidebarHeader.displayName = 'SidebarHeader'
SidebarBrand.displayName = 'SidebarBrand'
SidebarGroup.displayName = 'SidebarGroup'
SidebarItem.displayName = 'SidebarItem'
SidebarFooter.displayName = 'SidebarFooter'
SidebarUser.displayName = 'SidebarUser'
SidebarDivider.displayName = 'SidebarDivider'
SidebarAside.displayName = 'SidebarAside'
SidebarMain.displayName = 'SidebarMain'
