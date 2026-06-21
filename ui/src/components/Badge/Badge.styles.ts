import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusFull,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
    fontWeight: tokens.fontWeightMedium,
    whiteSpace: 'nowrap',
  },
  neutral: {
    backgroundColor: tokens.colorNeutral200,
    color: tokens.colorNeutral700,
  },
  primary: {
    backgroundColor: tokens.colorPrimary100,
    color: tokens.colorPrimary700,
  },
  success: {
    backgroundColor: tokens.colorSuccess300,
    color: tokens.colorSuccess700,
  },
  warning: {
    backgroundColor: tokens.colorWarning300,
    color: tokens.colorWarning700,
  },
  error: {
    backgroundColor: tokens.colorError300,
    color: tokens.colorError700,
  },
})
