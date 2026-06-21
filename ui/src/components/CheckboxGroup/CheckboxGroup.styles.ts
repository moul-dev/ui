import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
  },
})
