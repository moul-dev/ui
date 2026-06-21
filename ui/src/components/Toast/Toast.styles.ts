import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const slideIn = stylex.keyframes({
  from: { transform: 'translateY(100%)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
})

export const styles = stylex.create({
  region: {
    position: 'fixed',
    bottom: tokens.spacing4,
    insetInlineEnd: tokens.spacing4,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    zIndex: tokens.zIndexToast,
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
    backgroundColor: tokens.colorBgElevated,
    color: tokens.colorFg,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    paddingBlock: tokens.spacing3,
    paddingInline: tokens.spacing4,
    boxShadow: tokens.shadowMd,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    minWidth: '250px',
    maxWidth: '400px',
    outline: 'none',
    animationName: slideIn,
    animationDuration: '0.2s',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
  toastError: {
    borderColor: tokens.colorError500,
  },
  toastSuccess: {
    borderColor: tokens.colorSuccess500,
  },
  toastWarning: {
    borderColor: tokens.colorWarning500,
  },
  toastInfo: {
    borderColor: tokens.colorPrimary500,
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    color: tokens.colorFg,
  },
  description: {
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    color: tokens.colorFgSubtle,
  },
})
