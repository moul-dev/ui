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
    borderWidth: tokens.spacing1,
    animationDuration: '0.8s',
    animationIterationCount: 'infinite',
    animationName: spin,
    animationTimingFunction: 'linear',
    borderBlockStartColor: tokens.colorPrimary500,
    display: 'inline-block',
    height: tokens.spacing5,
    width: tokens.spacing5,
  },
})
