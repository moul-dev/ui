import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { Button } from '../../index'
import { tokens } from '../../tokens/tokens.stylex'

const styles = stylex.create({
  card: {
    backgroundColor: tokens.colorBgGlass,
    borderColor: tokens.colorBorderSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.radiusLg,
    padding: tokens.spacing8,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: tokens.shadowSm,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing7,
    boxSizing: 'border-box',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing4,
    width: '100%',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    paddingBottom: tokens.spacing2,
    margin: 0,
  },
  controlsRow: {
    display: 'flex',
    gap: tokens.spacing3,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
})

interface BlocksSectionProps {
  isCollapsed: boolean
  onToggleCollapse: () => void
  isSidebarDense: boolean
  onToggleDense: () => void
  sidebarVariant: 'solid' | 'glass'
  onToggleVariant: () => void
  showToggle: boolean
  onToggleShowToggle: () => void
  activeTab: string
}

export const BlocksSection: React.FC<BlocksSectionProps> = ({
  isCollapsed,
  onToggleCollapse,
  isSidebarDense,
  onToggleDense,
  sidebarVariant,
  onToggleVariant,
  showToggle,
  onToggleShowToggle,
  activeTab,
}) => {
  return (
    <div {...stylex.props(styles.card)}>
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Application Sidebar Controller
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--colorFgSubtle, #94a3b8)',
          }}
        >
          Test the responsive shell features: collapsible state, dense mode,
          glass/solid backgrounds, and keyboard item selection.
        </p>

        <div {...stylex.props(styles.controlsRow)}>
          <Button variant="secondary" size="sm" onPress={onToggleCollapse}>
            {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          </Button>
          <Button variant="secondary" size="sm" onPress={onToggleDense}>
            Dense Mode: {isSidebarDense ? 'ON' : 'OFF'}
          </Button>
          <Button variant="secondary" size="sm" onPress={onToggleVariant}>
            Surface: {sidebarVariant.toUpperCase()}
          </Button>
          <Button variant="secondary" size="sm" onPress={onToggleShowToggle}>
            Floating Handle: {showToggle ? 'Visible' : 'Hidden'}
          </Button>
        </div>

        <div style={{ fontSize: '0.875rem', color: 'var(--colorFg, #f8fafc)' }}>
          Active Navigation ID:{' '}
          <span style={{ color: '#a855f7', fontWeight: 600 }}>{activeTab}</span>
        </div>
      </section>
    </div>
  )
}
