import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const zoomIn = stylex.keyframes({
  from: { transform: 'scale(0.95)', opacity: 0 },
  to: { transform: 'scale(1)', opacity: 1 },
})

const slideInFromBottom = stylex.keyframes({
  from: { transform: 'translateY(24px)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
})

export const styles = stylex.create({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: tokens.zIndexModal,
    backgroundColor: tokens.colorOverlay,
    display: 'flex',
    alignItems: {
      default: 'center',
      '@media (max-width: 640px)': 'flex-end',
    },
    justifyContent: 'center',
    animationName: fadeIn,
    animationDuration: '0.2s',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
  modal: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowLg,
    borderTopLeftRadius: tokens.radiusLg,
    borderTopRightRadius: tokens.radiusLg,
    borderBottomLeftRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': 0,
    },
    borderBottomRightRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': 0,
    },
    overflow: 'hidden',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
    animationName: {
      default: zoomIn,
      '@media (max-width: 640px)': slideInFromBottom,
    },
    animationDuration: '0.2s',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
  sm: {
    maxWidth: {
      default: '400px',
      '@media (max-width: 640px)': '100%',
    },
  },
  md: {
    maxWidth: {
      default: '500px',
      '@media (max-width: 640px)': '100%',
    },
  },
  lg: {
    maxWidth: {
      default: '640px',
      '@media (max-width: 640px)': '100%',
    },
  },
  dialog: {
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: '100%',
  },
  header: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    borderBlockEndColor: tokens.colorBorderSubtle,
  },
  body: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    flexGrow: 1,
    overflowY: 'auto',
  },
  footer: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacing3,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    borderBlockStartColor: tokens.colorBorderSubtle,
  },
})
