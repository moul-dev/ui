import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    marginBlockEnd: 0,
  },
})
