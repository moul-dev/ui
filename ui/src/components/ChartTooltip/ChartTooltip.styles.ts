import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    backgroundColor: tokens.colorBgElevated,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorder,
    borderRadius: tokens.radiusSm,
    padding: tokens.spacing3,
    boxShadow: tokens.shadowLg,
    fontSize: tokens.fontSizeXs,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
    minWidth: '140px',
    pointerEvents: 'none',
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    paddingBlockEnd: tokens.spacing1,
    marginBlockEnd: tokens.spacing1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    margin: 0,
    padding: 0,
    listStyle: 'none',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing4,
  },
  indicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing2,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: tokens.radiusFull,
    display: 'inline-block',
  },
  name: {
    color: tokens.colorFgSubtle,
  },
  value: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
  },
})
