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
    paddingBlockStart: tokens.spacing6,
    paddingBlockEnd: tokens.spacing2,
    paddingInline: tokens.spacing6,
    fontSize: tokens.fontSizeLg,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
  },
  body: {
    paddingBlockStart: tokens.spacing2,
    paddingBlockEnd: tokens.spacing4,
    paddingInline: tokens.spacing6,
    color: tokens.colorFgSubtle,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
    flexGrow: 1,
  },
  footer: {
    paddingBlockStart: tokens.spacing2,
    paddingBlockEnd: tokens.spacing6,
    paddingInline: tokens.spacing6,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: tokens.spacing3,
  },
})
