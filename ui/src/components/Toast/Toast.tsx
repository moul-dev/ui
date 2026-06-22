'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastList as AriaToastList,
  UNSTABLE_ToastRegion as AriaToastRegion,
  UNSTABLE_ToastQueue as AriaToastQueue,
  type ToastProps as AriaToastProps,
  type ToastRegionProps as AriaToastRegionProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { Alert } from '../Alert'
import { styles } from './Toast.styles'

// ── Toast Content Type ───────────────────────────────────────────────

export interface ToastContent {
  title: string
  description?: string
  variant?: 'info' | 'error' | 'success' | 'warning'
}

// ── Toast Queue Manager ──────────────────────────────────────────────

export const toastQueue = new AriaToastQueue<ToastContent>({
  maxVisibleToasts: 5,
})

// ── useToast Hook ────────────────────────────────────────────────────

export function useToast() {
  return React.useMemo(
    () => ({
      show: (
        title: string,
        options?: {
          description?: string
          variant?: 'info' | 'error' | 'success' | 'warning'
          timeout?: number
        },
      ) => {
        return toastQueue.add(
          {
            title,
            description: options?.description,
            variant: options?.variant ?? 'info',
          },
          {
            timeout: options?.timeout ?? 5000,
          },
        )
      },
      close: (key: any) => {
        toastQueue.close(key)
      },
    }),
    [],
  )
}

// ── Toast Component ──────────────────────────────────────────────────

export interface ToastProps
  extends Omit<
    AriaToastProps<ToastContent>,
    'style' | 'className' | 'children'
  > {
  toast: any
  style?: StyleXStyles
  className?: string
}

export const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  function Toast({ toast, style, className, ...rest }, ref) {
    const variant = toast.content.variant ?? 'info'

    return (
      <AriaToast
        {...rest}
        ref={ref}
        toast={toast}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.toast,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(
            styles.toast,
            style,
          )
          return stylexStyle ?? {}
        }}
      >
        <Alert
          variant={variant}
          title={toast.content.title}
          description={toast.content.description}
          onClose={() => toastQueue.close(toast.key)}
        />
      </AriaToast>
    )
  },
)

// ── ToastContainer Component ─────────────────────────────────────────

export interface ToastContainerProps
  extends Omit<
    AriaToastRegionProps<ToastContent>,
    'style' | 'className' | 'children' | 'queue'
  > {
  style?: StyleXStyles
  className?: string
}

export const ToastContainer = React.forwardRef<
  HTMLDivElement,
  ToastContainerProps
>(function ToastContainer({ style, className, ...rest }, ref) {
  return (
    <AriaToastRegion
      {...rest}
      ref={ref}
      queue={toastQueue}
      className={(_) => {
        const { className: stylexClass } = stylex.props(styles.region, style)
        return [stylexClass, className].filter(Boolean).join(' ')
      }}
      style={(_) => {
        const { style: stylexStyle } = stylex.props(styles.region, style)
        return stylexStyle ?? {}
      }}
    >
      <AriaToastList
        className={stylex.props(styles.list).className}
        style={stylex.props(styles.list).style}
      >
        {({ toast }) => <Toast toast={toast} />}
      </AriaToastList>
    </AriaToastRegion>
  )
})
