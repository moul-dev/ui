'use client'

import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Avatar.styles'
import { warnMissingLabel } from '../../utils/warnMissingLabel'

export interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  src?: string
  alt?: string
  initials?: string
  style?: StyleXStyles
  className?: string
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar({ src, alt, initials, style, className, ...rest }, ref) {
    const [hasError, setHasError] = React.useState(false)

    React.useEffect(() => {
      setHasError(false)
    }, [src])

    if (process.env.NODE_ENV !== 'production') {
      warnMissingLabel('Avatar', {
        label: alt || rest['aria-label'],
        labelledBy: rest['aria-labelledby'],
        children: initials,
      })
    }

    const { className: stylexClass, style: stylexStyle } = stylex.props(
      styles.base,
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
      return <span {...stylex.props(styles.initials)}>{initials}</span>
    }

    return (
      <div
        {...rest}
        ref={ref}
        className={[stylexClass, className].filter(Boolean).join(' ')}
        style={stylexStyle}
      >
        {renderContent()}
      </div>
    )
  },
)
