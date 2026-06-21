import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

const slideUp = stylex.keyframes({
  from: { transform: 'translateY(4px)', opacity: 0 },
  to: { transform: 'translateY(0)', opacity: 1 },
})

export const styles = stylex.create({
  tooltip: {
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    boxShadow: tokens.shadowMd,
    zIndex: tokens.zIndexTooltip,
    pointerEvents: 'none',
    outline: 'none',
    animationName: slideUp,
    animationDuration: '0.15s',
    animationTimingFunction: 'ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      animationPlayState: 'paused',
      animationDuration: '0s',
    },
  },
})
