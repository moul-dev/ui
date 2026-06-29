'use client'
import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import {
  SelectionIndicator as AriaSelectionIndicator,
  Tab as AriaTab,
  TabList as AriaTabList,
  type TabListProps as AriaTabListProps,
  TabPanel as AriaTabPanel,
  type TabPanelProps as AriaTabPanelProps,
  TabPanels as AriaTabPanels,
  type TabPanelsProps as AriaTabPanelsProps,
  type TabProps as AriaTabProps,
  Tabs as AriaTabs,
  type TabsProps as AriaTabsProps,
  composeRenderProps,
} from 'react-aria-components'
import { styles } from './Tabs.styles'

// ── Tabs Context ─────────────────────────────────────────────────────

const TabsContext = React.createContext<{
  variant: 'primary' | 'secondary' | 'tertiary'
  orientation: 'horizontal' | 'vertical'
}>({
  variant: 'primary',
  orientation: 'horizontal',
})

// ── Tabs Component ───────────────────────────────────────────────────

export interface TabsProps extends Omit<AriaTabsProps, 'style'> {
  style?: StyleXStyles
  className?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    variant = 'primary',
    orientation = 'horizontal',
    style,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <TabsContext.Provider value={{ variant, orientation }}>
      <AriaTabs
        orientation={orientation}
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.container,
            renderProps.orientation === 'vertical'
              ? styles.containerVertical
              : styles.containerHorizontal,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.container,
            renderProps.orientation === 'vertical'
              ? styles.containerVertical
              : styles.containerHorizontal,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaTabs>
    </TabsContext.Provider>
  )
})

// ── TabList Component ────────────────────────────────────────────────

export interface TabListProps<T> extends Omit<AriaTabListProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TabList = React.forwardRef<HTMLDivElement, TabListProps<any>>(
  function TabList({ style, className, children, ...rest }, ref) {
    const { variant } = React.useContext(TabsContext)
    return (
      <AriaTabList
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.tabList,
            renderProps.orientation === 'vertical'
              ? styles.tabListVertical
              : styles.tabListHorizontal,
            variant === 'tertiary' && styles.tabListTertiary,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.tabList,
            renderProps.orientation === 'vertical'
              ? styles.tabListVertical
              : styles.tabListHorizontal,
            variant === 'tertiary' && styles.tabListTertiary,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaTabList>
    )
  },
)

// ── Tab Component ────────────────────────────────────────────────────

export interface TabProps extends Omit<AriaTabProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const Tab = React.forwardRef<HTMLDivElement, TabProps>(function Tab(
  { style, className, children, ...rest },
  ref,
) {
  const { variant, orientation } = React.useContext(TabsContext)
  return (
    <AriaTab
      {...rest}
      ref={ref}
      className={(renderProps) => {
        const variantStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
          ]
        const selectedStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}Selected` as keyof typeof styles
          ]
        const { className: stylexClass } = stylex.props(
          styles.tab,
          variantStyle,
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.tabDisabled,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const variantStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
          ]
        const selectedStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}Selected` as keyof typeof styles
          ]
        const { style: stylexStyle } = stylex.props(
          styles.tab,
          variantStyle,
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.tabDisabled,
          style,
        )
        return stylexStyle || {}
      }}
    >
      {composeRenderProps(children, (childrenVal) => (
        <>
          {childrenVal}
          <AriaSelectionIndicator
            {...(() => {
              const { className: stylexClass, style: stylexStyle } =
                stylex.props(
                  styles.selectionIndicator,
                  variant === 'tertiary' && styles.selectionIndicatorTertiary,
                  variant !== 'tertiary' &&
                    styles[
                      `selectionIndicator${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
                    ],
                  variant !== 'tertiary' &&
                    (orientation === 'vertical'
                      ? styles.selectionIndicatorVertical
                      : styles.selectionIndicatorHorizontal),
                )
              return {
                className: [stylexClass, 'react-aria-SelectionIndicator']
                  .filter(Boolean)
                  .join(' '),
                style: stylexStyle,
              }
            })()}
          />
        </>
      ))}
    </AriaTab>
  )
})

// ── TabPanels Component ──────────────────────────────────────────────

export interface TabPanelsProps<T>
  extends Omit<AriaTabPanelsProps<T>, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TabPanels = React.forwardRef<HTMLDivElement, TabPanelsProps<any>>(
  function TabPanels({ style, className, children, ...rest }, ref) {
    const { orientation } = React.useContext(TabsContext)
    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.tabPanels,
      orientation === 'vertical' && styles.tabPanelsFlex,
      style,
    )
    return (
      <AriaTabPanels
        {...rest}
        ref={ref}
        className={[stylexClass, 'react-aria-TabPanels', className]
          .filter(Boolean)
          .join(' ')}
        style={stylexStyle || {}}
      >
        {children}
      </AriaTabPanels>
    )
  },
)

// ── TabPanel Component ───────────────────────────────────────────────

export interface TabPanelProps extends Omit<AriaTabPanelProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const TabPanel = React.forwardRef<HTMLDivElement, TabPanelProps>(
  function TabPanel({ style, className, children, ...rest }, ref) {
    return (
      <AriaTabPanel
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.tabPanel,
            renderProps.isEntering && styles.tabPanelEntering,
            renderProps.isExiting && styles.tabPanelExiting,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.tabPanel,
            renderProps.isEntering && styles.tabPanelEntering,
            renderProps.isExiting && styles.tabPanelExiting,
            style,
          )
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaTabPanel>
    )
  },
)
