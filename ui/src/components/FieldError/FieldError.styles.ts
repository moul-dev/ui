import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    color: tokens.colorError500,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    marginBlockStart: 0,
  },
})
