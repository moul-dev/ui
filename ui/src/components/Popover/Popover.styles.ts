import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  popover: {
    backgroundColor: tokens.colorBgElevated,
    boxShadow: tokens.shadowMd,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    zIndex: tokens.zIndexDropdown,
    outline: 'none',
  },
  dialog: {
    outline: 'none',
    padding: tokens.spacing4,
  },
  arrow: {
    fill: tokens.colorBgElevated,
    stroke: tokens.colorBorder,
    strokeWidth: '1px',
  },
})
