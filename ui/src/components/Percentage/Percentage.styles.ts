import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  barContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeSm,
  },
  barHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: tokens.colorFg,
  },
  barLabel: {
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFgSubtle,
  },
  barValue: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
  },
  barTrack: {
    width: '100%',
    backgroundColor: tokens.colorNeutral100,
    borderRadius: tokens.radiusFull,
    overflow: 'hidden',
  },
  barTrackSm: { height: '4px' },
  barTrackMd: { height: '8px' },
  barTrackLg: { height: '12px' },
  barFill: {
    height: '100%',
    borderRadius: tokens.radiusFull,
    transition: 'width 0.3s ease-in-out',
  },
  circleContainer: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing2,
    fontFamily: tokens.fontFamilyBase,
  },
  circleWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleValue: {
    position: 'absolute',
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFg,
  },
  circleLabel: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFgSubtle,
  },
})
