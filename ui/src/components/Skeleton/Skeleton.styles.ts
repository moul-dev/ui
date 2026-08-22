import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const pulse = stylex.keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.4 },
})

export const styles = stylex.create({
  base: {
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
    },
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: pulse,
    animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)',
    backgroundColor: tokens.colorNeutral200,
  },
  block: {
    borderRadius: tokens.radiusMd,
    display: 'block',
    height: tokens.spacing5,
    width: '100%',
  },
  text: {
    borderRadius: tokens.radiusSm,
    display: 'block',
    height: tokens.spacing3,
    width: '100%',
  },
  circle: {
    borderRadius: tokens.radiusFull,
    display: 'inline-block',
    width: tokens.spacing8,
    height: tokens.spacing8,
    flexShrink: 0,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    width: '100%',
  },
})
