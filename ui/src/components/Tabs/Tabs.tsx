'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Tabs as AriaTabs,
  TabList as AriaTabList,
  Tab as AriaTab,
  TabPanel as AriaTabPanel,
  type TabsProps as AriaTabsProps,
  type TabListProps as AriaTabListProps,
  type TabProps as AriaTabProps,
  type TabPanelProps as AriaTabPanelProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Tabs.styles'

// ── Tabs Component ───────────────────────────────────────────────────

const TabsContext = React.createContext<{
  variant: 'primary' | 'secondary' | 'tertiary'
}>({
  variant: 'primary',
})

export interface TabsProps extends Omit<AriaTabsProps, 'style'> {
  style?: StyleXStyles
  className?: string
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { variant = 'primary', style, className, children, ...rest },
  ref,
) {
  return (
    <TabsContext.Provider value={{ variant }}>
      <AriaTabs
        {...rest}
        ref={ref}
        className={() => {
          const { className: stylexClass } = stylex.props(
            styles.container,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.container, style)
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
        className={() => {
          const { className: stylexClass } = stylex.props(
            styles.tabList,
            variant === 'tertiary' && styles.tabListTertiary,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(
            styles.tabList,
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
  const { variant } = React.useContext(TabsContext)
  return (
    <AriaTab
      {...rest}
      ref={ref}
      className={(renderProps) => {
        const selectedStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}Selected` as keyof typeof styles
          ]
        const { className: stylexClass } = stylex.props(
          styles.tab,
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.tabDisabled,
          style,
        )
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(renderProps) => {
        const selectedStyle =
          styles[
            `tab${variant.charAt(0).toUpperCase() + variant.slice(1)}Selected` as keyof typeof styles
          ]
        const { style: stylexStyle } = stylex.props(
          styles.tab,
          renderProps.isSelected && selectedStyle,
          renderProps.isDisabled && styles.tabDisabled,
          style,
        )
        return stylexStyle || {}
      }}
    >
      {children}
    </AriaTab>
  )
})

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
        className={() => {
          const { className: stylexClass } = stylex.props(
            styles.tabPanel,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={() => {
          const { style: stylexStyle } = stylex.props(styles.tabPanel, style)
          return stylexStyle || {}
        }}
      >
        {children}
      </AriaTabPanel>
    )
  },
)
