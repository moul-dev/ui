import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    width: '100%',
    userSelect: 'none',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  output: {
    fontSize: tokens.fontSizeSm,
    color: tokens.colorFgSubtle,
    fontFamily: tokens.fontFamilyBase,
  },
  track: {
    position: 'relative',
    height: tokens.spacing2, // 8px
    width: '100%',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorBorder,
    marginBlock: tokens.spacing2, // add some spacing for thumb overflow
  },
  trackDisabled: {
    opacity: 0.4,
  },
  fill: {
    position: 'absolute',
    height: '100%',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorPrimary500,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translate(-50%, -50%)', // Note: in RTL, React Aria positions the thumb offset using left/right automatically, but we might want to check transform centering.
    width: tokens.spacing5, // 20px
    height: tokens.spacing5, // 20px
    borderRadius: tokens.radiusFull,
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: tokens.colorPrimary500,
    backgroundColor: tokens.colorBg,
    boxShadow: tokens.shadowSm,
    cursor: 'pointer',
    outline: 'none',
    transitionProperty: 'border-color, transform, box-shadow',
    transitionDuration: '0.1s',
    transitionTimingFunction: 'ease-in-out',
    ':hover': {
      borderColor: tokens.colorPrimary600,
      transform: 'translate(-50%, -50%) scale(1.1)',
    },
    ':active': {
      borderColor: tokens.colorPrimary700,
      transform: 'translate(-50%, -50%) scale(0.95)',
    },
  },
  thumbFocusVisible: {
    outlineStyle: 'solid',
    outlineWidth: '2px',
    outlineOffset: '2px',
    outlineColor: tokens.colorBorderFocus,
  },
  thumbDisabled: {
    borderColor: tokens.colorNeutral400,
    backgroundColor: tokens.colorBgSubtle,
    cursor: 'not-allowed',
    ':hover': {
      transform: 'translate(-50%, -50%)',
    },
  },
})
