import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radiusFull,
    fontWeight: tokens.fontWeightMedium,
    whiteSpace: 'nowrap',
  },
  sm: {
    paddingBlock: 0,
    paddingInline: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  md: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeXs,
    lineHeight: tokens.lineHeightXs,
  },
  lg: {
    paddingBlock: tokens.spacing1,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeSm,
    lineHeight: tokens.lineHeightSm,
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
  dot: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorNeutral700,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
  },
  hasDot: {
    gap: tokens.spacing1,
  },
  dotIndicator: {
    display: 'inline-block',
    borderRadius: tokens.radiusFull,
    flexShrink: 0,
  },
  dot_sm: {
    width: tokens.spacing1,
    height: tokens.spacing1,
  },
  dot_md: {
    width: tokens.spacing2,
    height: tokens.spacing2,
  },
  dot_lg: {
    width: tokens.spacing2,
    height: tokens.spacing2,
  },
  dot_neutral: {
    backgroundColor: tokens.colorNeutral600,
  },
  dot_primary: {
    backgroundColor: tokens.colorPrimary500,
  },
  dot_success: {
    backgroundColor: tokens.colorSuccess500,
  },
  dot_warning: {
    backgroundColor: tokens.colorWarning500,
  },
  dot_error: {
    backgroundColor: tokens.colorError500,
  },
})
