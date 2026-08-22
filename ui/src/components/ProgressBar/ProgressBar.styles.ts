import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const indeterminate = stylex.keyframes({
  '0%': {
    transform: 'translateX(-100%) scaleX(0.2)',
  },
  '50%': {
    transform: 'translateX(0%) scaleX(0.7)',
  },
  '100%': {
    transform: 'translateX(100%) scaleX(0.2)',
  },
})

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeSm,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: tokens.colorFg,
  },
  label: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
  },
  value: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeSm,
    fontVariantNumeric: 'tabular-nums',
  },
  track: {
    width: '100%',
    backgroundColor: tokens.colorNeutral200,
    overflow: 'hidden',
    position: 'relative',
  },
  trackSm: { height: '4px' },
  trackMd: { height: '8px' },
  trackLg: { height: '12px' },

  shapePill: { borderRadius: tokens.radiusFull },
  shapeSquare: { borderRadius: tokens.radiusNone },

  fill: {
    height: '100%',
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: 'inherit',
  },
  fillIndeterminate: {
    width: '100%',
    transformOrigin: 'left center',
    animationName: indeterminate,
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'easeInOut',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
    },
  },

  // Color Variants
  primary: {
    backgroundColor: tokens.colorPrimary500,
  },
  accent: {
    backgroundColor: tokens.colorPrimary600,
  },
  success: {
    backgroundColor: tokens.colorSuccess500,
  },
  warning: {
    backgroundColor: tokens.colorWarning500,
  },
  error: {
    backgroundColor: tokens.colorError500,
  },
  neutral: {
    backgroundColor: tokens.colorNeutral600,
  },
})
