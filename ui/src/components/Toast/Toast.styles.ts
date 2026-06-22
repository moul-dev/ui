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
    zIndex: tokens.zIndexToast,
    pointerEvents: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing3,
    pointerEvents: 'none',
  },
  toast: {
    pointerEvents: 'auto',
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
})
