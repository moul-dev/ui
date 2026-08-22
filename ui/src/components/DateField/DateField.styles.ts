import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
  },
  group: {
    display: 'inline-flex',
    alignItems: 'center',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusSm,
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  },
  groupSm: {
    minHeight: tokens.spacing7,
    paddingInline: tokens.spacing2,
    fontSize: tokens.fontSizeXs,
  },
  groupMd: {
    minHeight: tokens.spacing8,
    paddingInline: tokens.spacing3,
    fontSize: tokens.fontSizeSm,
  },
  groupLg: {
    minHeight: '42px',
    paddingInline: tokens.spacing4,
    fontSize: tokens.fontSizeMd,
  },
  primary: {
    backgroundColor: tokens.colorBg,
  },
  secondary: {
    backgroundColor: tokens.colorBgSubtle,
  },
  groupHover: {
    borderColor: tokens.colorNeutral400,
  },
  groupFocused: {
    borderColor: tokens.colorBorderFocus,
    boxShadow: `0 0 0 1px ${tokens.colorBorderFocus}`,
  },
  groupInvalid: {
    borderColor: tokens.colorError500,
  },
  groupFocusedInvalid: {
    borderColor: tokens.colorError500,
    boxShadow: `0 0 0 1px ${tokens.colorError500}`,
  },
  groupDisabled: {
    backgroundColor: tokens.colorNeutral100,
    color: tokens.colorNeutral400,
    borderColor: tokens.colorBorderSubtle,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  dateInput: {
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  segment: {
    display: 'inline-block',
    paddingInline: '2px',
    borderRadius: '2px',
    outline: 'none',
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorFg,
    boxSizing: 'border-box',
  },
  segmentFocused: {
    backgroundColor: tokens.colorPrimary500,
    color: tokens.colorFgOnPrimary,
  },
  segmentPlaceholder: {
    color: tokens.colorFgSubtle,
  },
  segmentLiteral: {
    color: tokens.colorFgSubtle,
    paddingInline: '1px',
  },
  segmentDisabled: {
    color: tokens.colorNeutral400,
  },
})
