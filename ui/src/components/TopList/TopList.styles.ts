import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing4,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(100px, 1.5fr) 2fr minmax(60px, auto)',
    alignItems: 'center',
    gap: tokens.spacing4,
  },
  label: {
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFg,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  track: {
    height: '6px',
    backgroundColor: tokens.colorNeutral200,
    borderRadius: tokens.radiusFull,
    width: '100%',
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: tokens.radiusFull,
    transition: 'width 0.3s ease-in-out',
  },
  value: {
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
    textAlign: 'end',
  },
})
