import * as stylex from '@stylexjs/stylex'
import { tokens } from '../../tokens/tokens.stylex'

export const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    padding: tokens.spacing4,
    backgroundColor: tokens.colorBg,
    borderRadius: tokens.radiusMd,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorFg,
    minWidth: '160px',
    flex: 1,
  },
  label: {
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightMedium,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  value: {
    fontSize: tokens.fontSize3xl,
    fontWeight: tokens.fontWeightBold,
    lineHeight: tokens.lineHeight3xl,
    color: tokens.colorFg,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing2,
    marginTop: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
  },
  trendBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: tokens.fontWeightSemibold,
    paddingBlock: '2px',
    paddingInline: '6px',
    borderRadius: tokens.radiusSm,
  },
  trendUp: {
    backgroundColor: tokens.colorSuccess300,
    color: tokens.colorSuccess700,
  },
  trendDown: {
    backgroundColor: tokens.colorError300,
    color: tokens.colorError700,
  },
  trendNeutral: {
    backgroundColor: tokens.colorNeutral200,
    color: tokens.colorNeutral700,
  },
  trendText: {
    color: tokens.colorFgSubtle,
  },
})
