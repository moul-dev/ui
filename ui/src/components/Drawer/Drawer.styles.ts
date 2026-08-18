import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
})

const slideInRight = stylex.keyframes({
  from: { transform: 'translateX(100%)' },
  to: { transform: 'translateX(0)' },
})

const slideInLeft = stylex.keyframes({
  from: { transform: 'translateX(-100%)' },
  to: { transform: 'translateX(0)' },
})

const slideInTop = stylex.keyframes({
  from: { transform: 'translateY(-100%)' },
  to: { transform: 'translateY(0)' },
})

const slideInBottom = stylex.keyframes({
  from: { transform: 'translateY(100%)' },
  to: { transform: 'translateY(0)' },
})

export const styles = stylex.create({
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: tokens.zIndexModal,
    backgroundColor: tokens.colorOverlay,
    display: 'flex',
    animationName: fadeIn,
    animationDuration: '0.35s',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
  overlayRight: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  overlayLeft: {
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  overlayTop: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  overlayBottom: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  drawer: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowLg,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    outline: 'none',
    boxSizing: 'border-box',
    animationDuration: '0.35s',
    animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
  placementRight: {
    height: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
    marginBlock: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginInlineEnd: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginInlineStart: 0,
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': tokens.radiusNone,
    },
    borderWidth: {
      default: '1px',
      '@media (max-width: 640px)': 0,
    },
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    animationName: slideInRight,
  },
  placementLeft: {
    height: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
    marginBlock: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginInlineStart: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginInlineEnd: 0,
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': tokens.radiusNone,
    },
    borderWidth: {
      default: '1px',
      '@media (max-width: 640px)': 0,
    },
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    animationName: slideInLeft,
  },
  placementTop: {
    width: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
    marginBlockStart: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginBlockEnd: 0,
    marginInline: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': tokens.radiusNone,
    },
    borderWidth: {
      default: '1px',
      '@media (max-width: 640px)': 0,
    },
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    animationName: slideInTop,
  },
  placementBottom: {
    width: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
    marginBlockEnd: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    marginBlockStart: 0,
    marginInline: {
      default: tokens.spacing2,
      '@media (max-width: 640px)': 0,
    },
    borderRadius: {
      default: tokens.radiusLg,
      '@media (max-width: 640px)': tokens.radiusNone,
    },
    borderWidth: {
      default: '1px',
      '@media (max-width: 640px)': 0,
    },
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    animationName: slideInBottom,
  },
  // Horizontal (Side: Left / Right) Sizes
  sideSm: {
    width: {
      default: '400px',
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
  },
  sideMd: {
    width: {
      default: '600px',
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
  },
  sideLg: {
    width: {
      default: '800px',
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
  },
  sideFull: {
    width: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
    maxWidth: {
      default: `calc(100vw - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100vw',
    },
  },
  // Vertical (Top / Bottom) Sizes
  verticalSm: {
    height: {
      default: '400px',
      '@media (max-width: 640px)': '60vh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '90dvh',
    },
  },
  verticalMd: {
    height: {
      default: '600px',
      '@media (max-width: 640px)': '80vh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '90dvh',
    },
  },
  verticalLg: {
    height: {
      default: '800px',
      '@media (max-width: 640px)': '90vh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '95dvh',
    },
  },
  verticalFull: {
    height: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
    maxHeight: {
      default: `calc(100dvh - ${tokens.spacing2} * 2)`,
      '@media (max-width: 640px)': '100dvh',
    },
  },
  dialog: {
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    position: 'relative',
    boxSizing: 'border-box',
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backgroundColor: tokens.colorBgElevated,
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing3,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    borderBlockEndColor: tokens.colorBorderSubtle,
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  title: {
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
    margin: 0,
    lineHeight: tokens.lineHeightLg,
    flexGrow: 1,
  },
  body: {
    paddingBlock: tokens.spacing5,
    paddingInline: tokens.spacing5,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    flexGrow: 1,
    overflowY: 'auto',
    boxSizing: 'border-box',
  },
  footer: {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    backgroundColor: tokens.colorBgElevated,
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: tokens.spacing3,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    borderBlockStartColor: tokens.colorBorderSubtle,
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  closeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacing2,
    borderRadius: tokens.radiusMd,
    color: tokens.colorFgSubtle,
    backgroundColor: 'transparent',
    borderWidth: 0,
    cursor: 'pointer',
    outline: 'none',
    transitionProperty: 'color, background-color',
    transitionDuration: '0.15s',
    ':hover': {
      color: tokens.colorFg,
      backgroundColor: tokens.colorBgSubtle,
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBorderFocus}`,
      outlineOffset: '2px',
    },
  },
})
