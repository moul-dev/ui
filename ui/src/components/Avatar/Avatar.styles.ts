import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: tokens.spacing8,
    height: tokens.spacing8,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorNeutral200,
    color: tokens.colorNeutral700,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    userSelect: 'none',
    boxSizing: 'border-box',
    verticalAlign: 'middle',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  initials: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textTransform: 'uppercase',
  },
})
