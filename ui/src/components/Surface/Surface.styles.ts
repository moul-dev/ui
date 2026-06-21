import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    borderRadius: tokens.radiusMd,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxSizing: 'border-box',
  },
  el0: {
    backgroundColor: tokens.colorBg,
    borderColor: tokens.colorBorder,
    boxShadow: 'none',
  },
  el1: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowSm,
  },
  el2: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowMd,
  },
  el3: {
    backgroundColor: tokens.colorBgElevated,
    borderColor: tokens.colorBorderSubtle,
    boxShadow: tokens.shadowLg,
  },
})
