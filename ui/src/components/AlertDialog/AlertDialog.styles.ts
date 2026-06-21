import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  dialog: {
    outline: 'none',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    width: '100%',
  },
  header: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: '1px',
    borderBlockEndColor: tokens.colorBorderSubtle,
  },
  body: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeMd,
    lineHeight: tokens.lineHeightMd,
    flexGrow: 1,
  },
  footer: {
    paddingBlock: tokens.spacing4,
    paddingInline: tokens.spacing5,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacing3,
    borderBlockStartStyle: 'solid',
    borderBlockStartWidth: '1px',
    borderBlockStartColor: tokens.colorBorderSubtle,
  },
})
