import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  base: {
    display: 'inline-flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    boxSizing: 'border-box',
  },
  vertical: {
    flexDirection: 'column',
  },
  animatedTrack: {
    backgroundColor: tokens.colorBgSubtle,
    borderRadius: tokens.radiusMd,
    padding: '2px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    gap: '2px',
  },
  animatedTrackHorizontal: {
    flexDirection: 'row',
  },
  animatedTrackVertical: {
    flexDirection: 'column',
  },
})
