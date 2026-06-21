import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    borderStyle: 'none',
    boxSizing: 'border-box',
  },
  horizontal: {
    borderBlockStartColor: tokens.colorBorder,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    width: '100%',
  },
  vertical: {
    alignSelf: 'stretch',
    borderInlineStartColor: tokens.colorBorder,
    borderInlineStartStyle: 'solid',
    borderInlineStartWidth: '1px',
    height: '100%',
  },
})
