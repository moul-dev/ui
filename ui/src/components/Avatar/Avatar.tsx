'use client'

import type { StyleXStyles } from '@stylexjs/stylex'
import * as stylex from '@stylexjs/stylex'
import * as React from 'react'
import { warnMissingLabel } from '../../utils/warnMissingLabel'
import { styles } from './Avatar.styles'
import { AvatarGroupContext } from './AvatarGroup'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type AvatarShape = 'circle' | 'square'
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away'
export type AvatarStatusPosition = 'bottom-right' | 'top-right'

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  src?: string
  alt?: string
  initials?: string
  size?: AvatarSize
  shape?: AvatarShape
  status?: AvatarStatus
  statusPosition?: AvatarStatusPosition
  statusAriaLabel?: string
  fallback?: React.ReactNode
  style?: StyleXStyles
  className?: string
}

const DefaultUserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    {...stylex.props(styles.fallbackIcon)}
  >
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
)

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(
    {
      src,
      alt,
      initials,
      size: sizeProp,
      shape: shapeProp,
      status,
      statusPosition = 'bottom-right',
      statusAriaLabel,
      fallback,
      style,
      className,
      ...rest
    },
    ref,
  ) {
    const groupContext = React.useContext(AvatarGroupContext)
    const size = sizeProp ?? groupContext?.size ?? 'md'
    const shape = shapeProp ?? groupContext?.shape ?? 'circle'

    const [hasError, setHasError] = React.useState(false)

    React.useEffect(() => {
      setHasError(false)
    }, [src])

    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Avatar', {
        label: alt || rest['aria-label'] || (status ? `${status} status` : undefined),
        labelledBy: rest['aria-labelledby'],
        children: initials,
      })
    }

    const shapeStyleKey = shape === 'circle' ? 'circle' : `square_${size}`
    const sizeStyle = styles[size] || styles.md
    const shapeStyle = styles[shapeStyleKey as keyof typeof styles] || styles.circle

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
      sizeStyle,
      shapeStyle,
      style,
    )

    const renderContent = () => {
      if (src && !hasError) {
        return (
          <img
            src={src}
            alt={alt || ''}
            onError={() => setHasError(true)}
            {...stylex.props(styles.image)}
          />
        )
      }
      if (initials) {
        return <span {...stylex.props(styles.initials)}>{initials}</span>
      }
      if (fallback) {
        return fallback
      }
      return <DefaultUserIcon />
    }

    const renderStatusDot = () => {
      if (!status) return null

      const posKey = statusPosition === 'top-right' ? 'status_topRight' : 'status_bottomRight'
      const colorKey = `status_${status}` as keyof typeof styles
      const sizeKey = `statusSize_${size}` as keyof typeof styles

      const { className: dotClass, style: dotStyle } = stylex.props(
        styles.statusDot,
        styles[posKey],
        styles[colorKey],
        styles[sizeKey],
      )

      return (
        <span
          className={dotClass}
          style={dotStyle}
          role="status"
          aria-label={statusAriaLabel || `${status} status`}
        />
      )
    }

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        <div {...stylex.props(styles.innerWrapper)}>
          {renderContent()}
        </div>
        {renderStatusDot()}
      </div>
    )
  },
)
