import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    borderBlockEndColor: tokens.colorBorderSubtle,
  },
  body: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    flexGrow: 1,
  },
  footer: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing4,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    borderBlockStartColor: tokens.colorBorderSubtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})
