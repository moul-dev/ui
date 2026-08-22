import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const spin = stylex.keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
})

export const styles = stylex.create({
  base: {
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
    },
    borderColor: tokens.colorBorderSubtle,
    borderRadius: tokens.radiusFull,
    borderStyle: 'solid',
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
    borderBlockStartColor: tokens.colorPrimary500,
    display: 'inline-block',
    boxSizing: 'border-box',
  },
  sm: {
    height: tokens.spacing4,
    width: tokens.spacing4,
    borderWidth: '2px',
  },
  md: {
    height: tokens.spacing5,
    width: tokens.spacing5,
    borderWidth: tokens.spacing1,
  },
  lg: {
    height: tokens.spacing7,
    width: tokens.spacing7,
    borderWidth: tokens.spacing1,
  },
  xl: {
    height: tokens.spacing8,
    width: tokens.spacing8,
    borderWidth: tokens.spacing1,
  },
})
